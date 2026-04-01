import uuid
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from typing import Optional

from ingestion.handler import process_uploaded_file, process_url
from processing.text_processor import chunk_text
from embeddings.vector_store import VectorStore
from services.summarization_service import generate_summary
from services.topic_service import extract_topics
from services.quiz_service import generate_quiz
from services.evaluation_service import evaluate_answer
from services.chatbot_service import chat_with_context
from services.recommendation_service import get_recommendations
from database import (
    save_session, save_document, save_summary, save_topics, save_quiz,
    get_session, get_session_summary, get_session_topics, get_chat_history,
)
from config import settings

router = APIRouter()


# ===================== MODELS =====================

class UrlInput(BaseModel):
    url: str
    session_id: Optional[str] = None


class ChatInput(BaseModel):
    session_id: str
    message: str


class QuizRequest(BaseModel):
    session_id: str
    difficulty: str = "medium"
    num_questions: int = 10


class EvaluateRequest(BaseModel):
    question: str
    expected_answer: str
    user_answer: str


class RecommendRequest(BaseModel):
    session_id: str


class TextInput(BaseModel):
    text: str
    title: str = "Pasted Text"
    session_id: Optional[str] = None


# ===================== UPLOAD & INGEST =====================

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    session_id: Optional[str] = Form(None),
):
    try:
        # Create or use existing session
        if not session_id:
            session_id = str(uuid.uuid4())

        save_session(session_id, file.filename or "Untitled")

        # Process file
        result = await process_uploaded_file(file)

        # Save document record
        save_document(
            doc_id=result["id"],
            session_id=session_id,
            filename=result["filename"],
            file_type=result["file_type"],
            raw_text=result["text"],
        )

        # Chunk and store embeddings
        chunks = chunk_text(result["text"], settings.chunk_size, settings.chunk_overlap)
        store = VectorStore(session_id)
        store.add_chunks(chunks)

        return {
            "session_id": session_id,
            "document_id": result["id"],
            "filename": result["filename"],
            "file_type": result["file_type"],
            "text_length": len(result["text"]),
            "num_chunks": len(chunks),
            "message": "File processed and indexed successfully",
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")


@router.post("/upload-url")
async def upload_url(data: UrlInput):
    try:
        session_id = data.session_id or str(uuid.uuid4())
        save_session(session_id, data.url)

        result = process_url(data.url)

        save_document(
            doc_id=result["id"],
            session_id=session_id,
            filename=result["filename"],
            file_type=result["file_type"],
            raw_text=result["text"],
            source_url=result.get("source_url"),
        )

        chunks = chunk_text(result["text"], settings.chunk_size, settings.chunk_overlap)
        store = VectorStore(session_id)
        store.add_chunks(chunks)

        return {
            "session_id": session_id,
            "document_id": result["id"],
            "file_type": result["file_type"],
            "text_length": len(result["text"]),
            "num_chunks": len(chunks),
            "message": "URL content processed and indexed successfully",
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")


@router.post("/upload-text")
async def upload_text(data: TextInput):
    try:
        if not data.text.strip():
            raise HTTPException(status_code=400, detail="Text cannot be empty")

        session_id = data.session_id or str(uuid.uuid4())
        save_session(session_id, data.title)

        doc_id = str(uuid.uuid4())
        save_document(
            doc_id=doc_id,
            session_id=session_id,
            filename=data.title,
            file_type="text",
            raw_text=data.text,
        )

        chunks = chunk_text(data.text, settings.chunk_size, settings.chunk_overlap)
        store = VectorStore(session_id)
        store.add_chunks(chunks)

        return {
            "session_id": session_id,
            "document_id": doc_id,
            "file_type": "text",
            "text_length": len(data.text),
            "num_chunks": len(chunks),
            "message": "Text processed and indexed successfully",
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")


# ===================== SUMMARIZATION =====================

@router.post("/summarize")
async def summarize(data: dict):
    session_id = data.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id is required")

    try:
        store = VectorStore(session_id)
        chunks = store.get_all_chunks()
        if not chunks:
            raise HTTPException(status_code=404, detail="No content found for this session")

        content = "\n\n".join(chunks[:25])
        result = generate_summary(content)

        save_summary(session_id, result["short_summary"], result["detailed_summary"], result["bullet_points"])

        return {"session_id": session_id, **result}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summarization error: {str(e)}")


# ===================== TOPIC EXTRACTION =====================

@router.post("/topics")
async def topics(data: dict):
    session_id = data.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id is required")

    try:
        store = VectorStore(session_id)
        chunks = store.get_all_chunks()
        if not chunks:
            raise HTTPException(status_code=404, detail="No content found for this session")

        content = "\n\n".join(chunks[:25])
        result = extract_topics(content)

        save_topics(session_id, result["main_topics"], result["subtopics"], result["keywords"])

        return {"session_id": session_id, **result}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Topic extraction error: {str(e)}")


# ===================== QUIZ =====================

@router.post("/quiz/generate")
async def quiz_generate(data: QuizRequest):
    try:
        result = generate_quiz(data.session_id, data.difficulty, data.num_questions)
        save_quiz(data.session_id, result, data.difficulty)
        return {"session_id": data.session_id, **result}

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Quiz generation error: {str(e)}")


@router.post("/quiz/evaluate")
async def quiz_evaluate(data: EvaluateRequest):
    try:
        result = evaluate_answer(data.question, data.expected_answer, data.user_answer)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Evaluation error: {str(e)}")


# ===================== CHATBOT =====================

@router.post("/chat")
async def chat(data: ChatInput):
    try:
        session = get_session(data.session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        response = chat_with_context(data.session_id, data.message)
        return {
            "session_id": data.session_id,
            "response": response,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")


@router.get("/chat/history/{session_id}")
async def chat_history(session_id: str):
    history = get_chat_history(session_id)
    return {"session_id": session_id, "messages": history}


# ===================== RECOMMENDATIONS =====================

@router.post("/recommendations")
async def recommendations(data: RecommendRequest):
    try:
        topics_data = get_session_topics(data.session_id)
        if not topics_data:
            # Generate topics first
            store = VectorStore(data.session_id)
            chunks = store.get_all_chunks()
            if not chunks:
                raise HTTPException(status_code=404, detail="No content found")

            content = "\n\n".join(chunks[:25])
            topics_data = extract_topics(content)
            save_topics(data.session_id, topics_data["main_topics"], topics_data["subtopics"], topics_data["keywords"])

        result = get_recommendations(
            topics_data["main_topics"],
            topics_data["subtopics"],
            topics_data["keywords"],
        )
        return {"session_id": data.session_id, **result}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recommendation error: {str(e)}")


# ===================== SESSION =====================

@router.get("/session/{session_id}")
async def session_info(session_id: str):
    session = get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    summary = get_session_summary(session_id)
    topics_data = get_session_topics(session_id)

    return {
        "session": session,
        "summary": summary,
        "topics": topics_data,
    }


# ===================== PROCESS ALL (convenience) =====================

@router.post("/process-all")
async def process_all(data: dict):
    """Process uploaded content: generate summary, topics, and recommendations in one call."""
    session_id = data.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id is required")

    try:
        store = VectorStore(session_id)
        chunks = store.get_all_chunks()
        if not chunks:
            raise HTTPException(status_code=404, detail="No content found for this session")

        content = "\n\n".join(chunks[:25])

        # Run summary and topics concurrently for speed
        import asyncio
        loop = asyncio.get_event_loop()
        summary_task = loop.run_in_executor(None, generate_summary, content)
        topics_task = loop.run_in_executor(None, extract_topics, content)
        summary, topics_data = await asyncio.gather(summary_task, topics_task)

        save_summary(session_id, summary["short_summary"], summary["detailed_summary"], summary["bullet_points"])
        save_topics(session_id, topics_data["main_topics"], topics_data["subtopics"], topics_data["keywords"])

        # Get recommendations (depends on topics result)
        recs = await loop.run_in_executor(
            None, get_recommendations,
            topics_data["main_topics"],
            topics_data["subtopics"],
            topics_data["keywords"],
        )

        return {
            "session_id": session_id,
            "summary": summary,
            "topics": topics_data,
            "recommendations": recs,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")
