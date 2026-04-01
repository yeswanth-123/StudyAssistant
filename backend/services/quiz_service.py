from llm.gemini_client import gemini_client
from llm.prompts import QUIZ_GENERATION_PROMPT
from embeddings.vector_store import VectorStore


def generate_quiz(session_id: str, difficulty: str = "medium", num_questions: int = 10) -> dict:
    store = VectorStore(session_id)
    chunks = store.get_all_chunks()

    if not chunks:
        raise ValueError("No content available. Please upload study material first.")

    # Use representative chunks for quiz generation
    content = "\n\n".join(chunks[:20])

    max_content_length = 25000
    if len(content) > max_content_length:
        content = content[:max_content_length]

    prompt = QUIZ_GENERATION_PROMPT.format(
        content=content,
        difficulty=difficulty,
        num_questions=num_questions,
    )

    result = gemini_client.generate_json(prompt)

    return {
        "mcq_questions": result.get("mcq_questions", []),
        "short_answer_questions": result.get("short_answer_questions", []),
        "difficulty": difficulty,
        "total_questions": len(result.get("mcq_questions", [])) + len(result.get("short_answer_questions", [])),
    }
