import json
from google import genai
from google.genai import types
from config import settings

client = genai.Client(api_key=settings.gemini_api_key)


class GeminiClient:
    def __init__(self):
        self.model = settings.gemini_model

    def generate(self, prompt: str, temperature: float = 0.7, max_tokens: int = 8192) -> str:
        try:
            response = client.models.generate_content(
                model=self.model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=temperature,
                    max_output_tokens=max_tokens,
                ),
            )
            return response.text
        except Exception as e:
            raise RuntimeError(f"Gemini API error: {str(e)}")

    def generate_json(self, prompt: str, temperature: float = 0.3) -> dict:
        full_prompt = prompt + "\n\nIMPORTANT: Respond ONLY with valid JSON. No markdown, no code blocks, no extra text."
        try:
            raw = self.generate(full_prompt, temperature=temperature)
            # Strip markdown code blocks if present
            cleaned = raw.strip()
            if cleaned.startswith("```"):
                lines = cleaned.split("\n")
                lines = [l for l in lines if not l.strip().startswith("```")]
                cleaned = "\n".join(lines)
            return json.loads(cleaned)
        except json.JSONDecodeError:
            # Retry once with stricter instruction
            retry_prompt = (
                prompt
                + "\n\nYou MUST output ONLY valid JSON. No markdown formatting. "
                "No ```json blocks. Start directly with { or [."
            )
            raw = self.generate(retry_prompt, temperature=0.1)
            cleaned = raw.strip()
            if cleaned.startswith("```"):
                lines = cleaned.split("\n")
                lines = [l for l in lines if not l.strip().startswith("```")]
                cleaned = "\n".join(lines)
            return json.loads(cleaned)

    def chat(self, messages: list[dict], system_prompt: str = None) -> str:
        contents = []
        if system_prompt:
            contents.append(types.Content(role="user", parts=[types.Part.from_text(text=system_prompt)]))
            contents.append(types.Content(role="model", parts=[types.Part.from_text(text="Understood. I'll follow these instructions.")]))

        for msg in messages:
            role = "user" if msg["role"] == "user" else "model"
            contents.append(types.Content(role=role, parts=[types.Part.from_text(text=msg["message"])]))

        try:
            response = client.models.generate_content(
                model=self.model,
                contents=contents,
            )
            return response.text
        except Exception as e:
            raise RuntimeError(f"Gemini chat error: {str(e)}")


# Singleton instance
gemini_client = GeminiClient()
