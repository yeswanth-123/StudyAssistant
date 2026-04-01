from llm.gemini_client import gemini_client
from llm.prompts import CHATBOT_SYSTEM_PROMPT, CHATBOT_RAG_PROMPT
from embeddings.vector_store import VectorStore
from database import get_chat_history, save_chat_message


def chat_with_context(session_id: str, user_message: str) -> str:
    # Retrieve relevant chunks via RAG
    store = VectorStore(session_id)
    relevant_chunks = store.search(user_message, top_k=5)
    context = "\n\n---\n\n".join(relevant_chunks) if relevant_chunks else "No specific context available."

    # Get chat history
    history = get_chat_history(session_id, limit=10)
    chat_history_text = ""
    for msg in history:
        role = "Student" if msg["role"] == "user" else "StudyMate"
        chat_history_text += f"{role}: {msg['message']}\n"

    # Build RAG prompt
    rag_prompt = CHATBOT_RAG_PROMPT.format(
        context=context,
        chat_history=chat_history_text,
        question=user_message,
    )

    # Generate response with chat history for continuity
    messages = history + [{"role": "user", "message": rag_prompt}]
    response = gemini_client.chat(messages, system_prompt=CHATBOT_SYSTEM_PROMPT)

    # Save to database
    save_chat_message(session_id, "user", user_message)
    save_chat_message(session_id, "assistant", response)

    return response
