import os
import uuid
from fastapi import UploadFile
from config import settings
from parsers.pdf_parser import extract_text_from_pdf
from parsers.youtube_parser import extract_transcript_from_youtube
from parsers.audio_parser import extract_text_from_audio, SUPPORTED_FORMATS as AUDIO_FORMATS
from parsers.image_parser import extract_text_from_image
from parsers.zip_parser import extract_text_from_zip
from parsers.video_parser import extract_text_from_video, SUPPORTED_FORMATS as VIDEO_FORMATS

IMAGE_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "bmp", "tiff", "webp"}


def detect_file_type(filename: str) -> str:
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext == "pdf":
        return "pdf"
    elif ext in IMAGE_EXTENSIONS:
        return "image"
    elif ext in AUDIO_FORMATS:
        return "audio"
    elif ext in VIDEO_FORMATS:
        return "video"
    elif ext == "zip":
        return "zip"
    elif ext in ("txt", "md", "csv"):
        return "text"
    return "unknown"


async def process_uploaded_file(file: UploadFile) -> dict:
    file_bytes = await file.read()
    filename = file.filename or "unknown"
    file_type = detect_file_type(filename)

    # Save to disk
    file_id = str(uuid.uuid4())
    save_path = os.path.join(settings.upload_dir, f"{file_id}_{filename}")
    with open(save_path, "wb") as f:
        f.write(file_bytes)

    # Extract text based on type
    if file_type == "pdf":
        text = extract_text_from_pdf(file_bytes)
    elif file_type == "image":
        text = extract_text_from_image(file_bytes)
    elif file_type == "audio":
        text = extract_text_from_audio(file_bytes, filename)
    elif file_type == "video":
        text = extract_text_from_video(file_bytes, filename)
    elif file_type == "zip":
        text = extract_text_from_zip(file_bytes)
    elif file_type == "text":
        text = file_bytes.decode("utf-8", errors="ignore")
    else:
        raise ValueError(f"Unsupported file type: {filename}")

    return {
        "id": file_id,
        "filename": filename,
        "file_type": file_type,
        "text": text,
        "path": save_path,
    }


def process_url(url: str) -> dict:
    url = url.strip()
    if "youtube.com" in url or "youtu.be" in url:
        text = extract_transcript_from_youtube(url)
        return {
            "id": str(uuid.uuid4()),
            "filename": url,
            "file_type": "youtube",
            "text": text,
            "source_url": url,
        }
    else:
        raise ValueError(f"Unsupported URL type. Currently only YouTube links are supported: {url}")
