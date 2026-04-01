import re
from youtube_transcript_api import YouTubeTranscriptApi


def extract_video_id(url: str) -> str | None:
    patterns = [
        r'(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})',
        r'(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})',
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None


def extract_transcript_from_youtube(url: str) -> str:
    video_id = extract_video_id(url)
    if not video_id:
        raise ValueError(f"Could not extract video ID from URL: {url}")

    try:
        ytt_api = YouTubeTranscriptApi()
        # Try English first, then fall back to any available language
        try:
            transcript = ytt_api.fetch(video_id, languages=['en'])
        except Exception:
            transcript = ytt_api.fetch(video_id)
        text_parts = [entry.text for entry in transcript]
        full_text = " ".join(text_parts)
        if not full_text.strip():
            raise ValueError("Transcript is empty")
        return full_text

    except ValueError:
        raise
    except Exception as e:
        error_msg = str(e).lower()
        if "no transcript" in error_msg or "disabled" in error_msg:
            raise ValueError(
                f"No transcript available for this video. "
                f"The video may have subtitles disabled or no captions. "
                f"Try a video with English subtitles/CC enabled."
            )
        raise ValueError(f"Could not fetch transcript for video {video_id}: {str(e)}")
