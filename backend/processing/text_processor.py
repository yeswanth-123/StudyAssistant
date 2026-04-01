import re


def clean_text(text: str) -> str:
    # Remove excessive whitespace
    text = re.sub(r'\s+', ' ', text)
    # Remove special characters but keep punctuation
    text = re.sub(r'[^\w\s.,;:!?\'"()\-/]', '', text)
    # Remove multiple dots
    text = re.sub(r'\.{3,}', '...', text)
    # Strip leading/trailing whitespace
    text = text.strip()
    return text


def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> list[str]:
    if not text:
        return []

    text = clean_text(text)
    chunks = []
    start = 0

    while start < len(text):
        end = start + chunk_size

        # Try to break at sentence boundary
        if end < len(text):
            # Look for sentence end near the chunk boundary
            last_period = text.rfind('.', start + chunk_size - 200, end + 100)
            last_newline = text.rfind('\n', start + chunk_size - 200, end + 100)
            break_point = max(last_period, last_newline)
            if break_point > start:
                end = break_point + 1

        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)

        start = end - overlap
        if start >= len(text):
            break

    return chunks
