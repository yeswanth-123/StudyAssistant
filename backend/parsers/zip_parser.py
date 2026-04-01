import zipfile
import io
from parsers.pdf_parser import extract_text_from_pdf
from parsers.image_parser import extract_text_from_image
from parsers.audio_parser import extract_text_from_audio

IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".bmp", ".tiff", ".webp"}
AUDIO_EXTENSIONS = {".mp3", ".wav", ".ogg", ".flac", ".m4a", ".aac", ".wma"}
PDF_EXTENSIONS = {".pdf"}
TEXT_EXTENSIONS = {".txt", ".md", ".csv", ".json", ".xml", ".html", ".htm"}


def extract_text_from_zip(file_bytes: bytes) -> str:
    texts = []

    with zipfile.ZipFile(io.BytesIO(file_bytes), "r") as zf:
        for file_info in zf.infolist():
            if file_info.is_dir():
                continue

            name = file_info.filename.lower()
            ext = "." + name.rsplit(".", 1)[-1] if "." in name else ""
            data = zf.read(file_info.filename)

            try:
                if ext in PDF_EXTENSIONS:
                    text = extract_text_from_pdf(data)
                elif ext in IMAGE_EXTENSIONS:
                    text = extract_text_from_image(data)
                elif ext in AUDIO_EXTENSIONS:
                    text = extract_text_from_audio(data, file_info.filename)
                elif ext in TEXT_EXTENSIONS:
                    text = data.decode("utf-8", errors="ignore")
                else:
                    continue

                if text.strip():
                    texts.append(f"--- {file_info.filename} ---\n{text}")
            except Exception:
                continue

    return "\n\n".join(texts)
