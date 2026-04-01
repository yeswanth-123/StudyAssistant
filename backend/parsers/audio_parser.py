from google import genai
from google.genai import types
from config import settings


SUPPORTED_FORMATS = {"mp3", "wav", "ogg", "flac", "m4a", "wma", "aac"}

MIME_TYPES = {
    "mp3": "audio/mpeg",
    "wav": "audio/wav",
    "ogg": "audio/ogg",
    "flac": "audio/flac",
    "m4a": "audio/mp4",
    "wma": "audio/x-ms-wma",
    "aac": "audio/aac",
}

_client = genai.Client(api_key=settings.gemini_api_key)


def extract_text_from_audio(file_bytes: bytes, filename: str) -> str:
    """Extract spoken text from audio using Gemini multimodal."""
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "wav"
    mime_type = MIME_TYPES.get(ext, f"audio/{ext}")

    try:
        response = _client.models.generate_content(
            model=settings.gemini_model,
            contents=types.Content(
                parts=[
                    types.Part.from_bytes(data=file_bytes, mime_type=mime_type),
                    types.Part.from_text(
                        text="Transcribe all spoken content in this audio file. "
                             "Return ONLY the transcription text, nothing else. "
                             "If there is no intelligible speech, return exactly: NO_SPEECH_DETECTED"
                    ),
                ]
            ),
        )
        text = response.text.strip()
        if "NO_SPEECH_DETECTED" in text:
            return ""
        return text
    except Exception as e:
        raise RuntimeError(f"Audio transcription error: {str(e)}")
