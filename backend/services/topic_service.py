from llm.gemini_client import gemini_client
from llm.prompts import TOPIC_EXTRACTION_PROMPT


def extract_topics(content: str) -> dict:
    max_content_length = 30000
    if len(content) > max_content_length:
        content = content[:max_content_length] + "\n\n[Content truncated]"

    prompt = TOPIC_EXTRACTION_PROMPT.format(content=content)
    result = gemini_client.generate_json(prompt)

    return {
        "main_topics": result.get("main_topics", []),
        "subtopics": result.get("subtopics", []),
        "keywords": result.get("keywords", []),
    }
