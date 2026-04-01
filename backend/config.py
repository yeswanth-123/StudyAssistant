import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv(override=True)


class Settings(BaseSettings):
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    upload_dir: str = os.getenv("UPLOAD_DIR", "./uploads")
    faiss_index_dir: str = os.getenv("FAISS_INDEX_DIR", "./faiss_store")
    sqlite_db_path: str = os.getenv("SQLITE_DB_PATH", "./studymate.db")
    cors_origins: str = os.getenv("CORS_ORIGINS", "http://localhost:3000")
    max_upload_size_mb: int = int(os.getenv("MAX_UPLOAD_SIZE_MB", "100"))
    chunk_size: int = int(os.getenv("CHUNK_SIZE", "1000"))
    chunk_overlap: int = int(os.getenv("CHUNK_OVERLAP", "200"))
    embedding_model: str = os.getenv("EMBEDDING_MODEL", "models/gemini-embedding-001")
    gemini_model: str = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")


settings = Settings()

os.makedirs(settings.upload_dir, exist_ok=True)
os.makedirs(settings.faiss_index_dir, exist_ok=True)
