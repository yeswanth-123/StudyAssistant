from llm.gemini_client import gemini_client
from llm.prompts import SUMMARIZATION_PROMPT


def generate_summary(content: str) -> dict:
    # Truncate if too long for a single prompt
    max_content_length = 30000
    if len(content) > max_content_length:
        content = content[:max_content_length] + "\n\n[Content truncated for summarization]"

    prompt = SUMMARIZATION_PROMPT.format(content=content)
    result = gemini_client.generate_json(prompt)

    # Validate structure
    return {
        "short_summary": result.get("short_summary", ""),
        "detailed_summary": result.get("detailed_summary", ""),
        "bullet_points": result.get("bullet_points", []),
    }
