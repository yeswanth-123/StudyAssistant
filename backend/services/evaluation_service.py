from llm.gemini_client import gemini_client
from llm.prompts import ANSWER_EVALUATION_PROMPT


def evaluate_answer(question: str, expected_answer: str, user_answer: str) -> dict:
    prompt = ANSWER_EVALUATION_PROMPT.format(
        question=question,
        expected_answer=expected_answer,
        user_answer=user_answer,
    )

    result = gemini_client.generate_json(prompt)

    return {
        "is_correct": result.get("is_correct", False),
        "score": result.get("score", 0),
        "feedback": result.get("feedback", ""),
        "explanation": result.get("explanation", ""),
        "improvement_suggestions": result.get("improvement_suggestions", []),
    }
