import os
import time
import tempfile
from google import genai
from google.genai import types
from config import settings


SUPPORTED_FORMATS = {"mp4", "mkv", "avi", "mov", "webm", "flv", "wmv", "m4v", "3gp"}

MIME_TYPES = {
    "mp4": "video/mp4",
    "mkv": "video/x-matroska",
    "avi": "video/x-msvideo",
    "mov": "video/quicktime",
    "webm": "video/webm",
    "flv": "video/x-flv",
    "wmv": "video/x-ms-wmv",
    "m4v": "video/x-m4v",
    "3gp": "video/3gpp",
}

_client = genai.Client(api_key=settings.gemini_api_key)


def extract_text_from_video(file_bytes: bytes, filename: str) -> str:
    """Extract spoken text from video using Gemini multimodal via file upload."""
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "mp4"
    mime_type = MIME_TYPES.get(ext, f"video/{ext}")

    with tempfile.NamedTemporaryFile(suffix=f".{ext}", delete=False) as tmp:
        tmp.write(file_bytes)
        tmp_path = tmp.name

    try:
        # Upload video to Gemini File API
        uploaded_file = _client.files.upload(file=tmp_path)

        # Wait for server-side processing
        while uploaded_file.state.name == "PROCESSING":
            time.sleep(2)
            uploaded_file = _client.files.get(name=uploaded_file.name)

        if uploaded_file.state.name == "FAILED":
            raise RuntimeError("Video processing failed on server side")

        response = _client.models.generate_content(
            model=settings.gemini_model,
            contents=types.Content(
                parts=[
                    types.Part.from_uri(
                        file_uri=uploaded_file.uri, mime_type=uploaded_file.mime_type
                    ),
                    types.Part.from_text(
                        text="Transcribe all spoken content in this video. "
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
    except RuntimeError:
        raise
    except Exception as e:
        raise RuntimeError(f"Video transcription error: {str(e)}")
    finally:
        os.unlink(tmp_path)
