# StudyMate AI — Design Document

## 1. Problem Statement

Students deal with diverse study materials (PDFs, lecture videos, audio recordings, images, handwritten notes) spread across formats. They need a unified tool that can ingest any content type, produce structured summaries, generate practice quizzes, and answer follow-up questions — all powered by AI.

## 2. Proposed Solution

**StudyMate AI** is a full-stack web application that:
- Accepts **7 content types**: PDF, YouTube URL, audio, video, image (OCR), ZIP archives, and plain text.
- Generates **structured summaries**, **topic extraction**, and **resource recommendations** using Google Gemini.
- Creates **interactive quizzes** (MCQ + short answer) with AI-powered answer evaluation.
- Provides a **RAG-based chatbot** for context-aware Q&A over uploaded materials.

## 3. System Architecture

```
┌──────────────────────────────────────────────────────────┐
│                  Frontend (Next.js 14)                    │
│   Upload │ Summary │ Topics │ Quiz │ Chat │ Resources    │
└─────────────────────────┬────────────────────────────────┘
                          │ REST API (JSON)
┌─────────────────────────▼────────────────────────────────┐
│                  Backend (FastAPI)                         │
│                                                           │
│  Ingestion ──► Parsers ──► Text Processing ──► Embeddings │
│                  │                                │       │
│   PDF, YouTube,  │          Clean + Chunk    Gemini API   │
│   Audio, Video,  │                           + FAISS      │
│   Image, ZIP     │                                │       │
│                  ▼                                ▼       │
│            AI Services (Google Gemini 2.5 Flash)          │
│   Summary │ Topics │ Quiz │ Evaluation │ Chat (RAG)      │
│                                                           │
│   ┌────────────────┐    ┌─────────────────┐              │
│   │ SQLite (meta)  │    │ FAISS (vectors) │              │
│   └────────────────┘    └─────────────────┘              │
└───────────────────────────────────────────────────────────┘
```

## 4. Technology Stack

| Component        | Technology                 | Rationale                                      |
|------------------|----------------------------|-------------------------------------------------|
| Frontend         | Next.js 14, React 18, Tailwind CSS | SSR, modern UI, rapid prototyping       |
| Backend          | FastAPI (Python 3.11+)     | Async, auto-docs, Python ML ecosystem           |
| LLM              | Google Gemini 2.5 Flash    | Multimodal (text+audio+video+image), fast       |
| Embeddings       | Gemini Embedding API       | 3072-dim vectors, native Gemini integration     |
| Vector DB        | FAISS                      | In-memory similarity search, zero infrastructure|
| Metadata Store   | SQLite                     | Zero-config, portable, sufficient for prototype |
| Audio/Video      | Gemini Multimodal API      | Superior transcription via LLM understanding    |
| PDF Parsing      | PyPDF2                     | Pure Python, no native dependencies             |
| YouTube          | youtube-transcript-api     | Direct transcript extraction from YouTube       |
| OCR              | Tesseract + Pillow         | Industry-standard open-source OCR               |
| Containerization | Docker + Docker Compose    | Reproducible builds, one-command deployment      |

## 5. Module Design

### 5.1 Content Ingestion Pipeline

```
Upload (file/URL/text)
    │
    ├── PDF ──────────► PyPDF2 text extraction
    ├── YouTube URL ──► youtube-transcript-api (fallback: any language)
    ├── Audio ────────► Gemini multimodal transcription
    ├── Video ────────► Gemini File Upload API + multimodal transcription
    ├── Image ────────► Tesseract OCR
    ├── ZIP ──────────► Recursive extraction → route each file to parser
    └── Text ─────────► Direct passthrough
          │
          ▼
    Text Cleaning → Chunking (1000 chars, 200 overlap)
          │
          ▼
    Gemini Embedding (3072-dim) → FAISS Index + SQLite metadata
```

### 5.2 AI Services

| Service         | Input                    | Output                              | Method                  |
|-----------------|--------------------------|--------------------------------------|-------------------------|
| Summarization   | Full extracted text       | Structured summary (sections, bullets) | Gemini generate         |
| Topic Extraction| Full extracted text       | Topics with descriptions + keywords  | Gemini JSON generation  |
| Quiz Generation | Full text + topic filter  | MCQs + short answer questions        | Gemini JSON generation  |
| Answer Evaluation| Question + user answer   | Score, feedback, correct answer      | Gemini JSON generation  |
| Chatbot (RAG)   | User question + history  | Contextual answer                    | Vector retrieval + Gemini chat |
| Recommendations | Extracted topics          | External learning resources          | Gemini generate         |

### 5.3 RAG Chatbot Flow

```
User Question
    │
    ▼
Gemini Embedding → FAISS Top-5 Retrieval
    │
    ▼
Build Prompt = System Instruction + Retrieved Chunks + Chat History + Question
    │
    ▼
Gemini Chat API → Response
```

## 6. API Design

| Method | Endpoint                 | Description                        |
|--------|--------------------------|------------------------------------|
| POST   | `/api/upload`            | Upload file (PDF/audio/video/image/ZIP) |
| POST   | `/api/upload-url`        | Process YouTube URL                |
| POST   | `/api/upload-text`       | Submit plain text                  |
| POST   | `/api/process-all`       | Generate summary + topics concurrently |
| POST   | `/api/summarize`         | Generate structured summary        |
| POST   | `/api/topics`            | Extract topics & keywords          |
| POST   | `/api/quiz/generate`     | Generate quiz questions            |
| POST   | `/api/quiz/evaluate`     | Evaluate user's answer             |
| POST   | `/api/chat`              | RAG chatbot Q&A                    |
| GET    | `/api/chat/history/{id}` | Retrieve chat history              |
| POST   | `/api/recommendations`   | Get resource recommendations       |
| GET    | `/api/session/{id}`      | Get session metadata               |
| GET    | `/health`                | Health check                       |

## 7. Frontend Design

- **Theme**: Dark glassmorphism with gradient accents and glow effects
- **Layout**: Single-page application with collapsible sections
- **Sections**: Upload → Summary → Topics → Quiz → Chat → Recommendations
- **Upload Modes**: File upload (drag & drop), YouTube URL input, direct text input
- **Supported Files**: PDF, MP3, WAV, OGG, FLAC, MP4, MKV, AVI, MOV, M4V, PNG, JPG, ZIP

## 8. Data Flow Diagram

```
┌────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  User  │────►│  Upload  │────►│  Parser  │────►│  Clean   │
│        │     │  Handler │     │ (7 types)│     │ + Chunk  │
└────────┘     └──────────┘     └──────────┘     └────┬─────┘
                                                      │
     ┌────────────────────────────────────────────────┘
     │
     ▼
┌──────────┐     ┌──────────┐     ┌──────────┐
│ Gemini   │────►│  FAISS   │────►│  SQLite  │
│ Embed    │     │  Index   │     │ Metadata │
└──────────┘     └──────────┘     └──────────┘
     │
     ▼
┌──────────────────────────────────────────────┐
│          Gemini AI Services                   │
│  Summary │ Topics │ Quiz │ Chat │ Resources  │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
                  ┌──────────┐
                  │ Frontend │
                  │ Display  │
                  └──────────┘
```

## 9. Key Design Decisions

| Decision | Choice | Alternative Considered | Reason |
|----------|--------|----------------------|--------|
| Audio/Video transcription | Gemini Multimodal API | Google Speech Recognition | Far superior accuracy, handles noisy audio, no chunking needed |
| Vector store | FAISS (in-memory) | Pinecone, ChromaDB | Zero infrastructure, fast for prototype scale |
| Embedding dimension | 3072 | 768 | Matches `gemini-embedding-001` model output |
| Processing concurrency | `asyncio.gather` for summary+topics | Sequential | ~33% faster response for process-all |
| File upload (video) | Gemini File Upload API | Inline bytes | Handles large files (>20MB) reliably |
| Environment config | `load_dotenv(override=True)` | Default dotenv | Prevents stale shell env vars from overriding `.env` |

## 10. Deployment Architecture

```
                    ┌─────────────┐
                    │   Vercel    │ ◄── Frontend (Next.js)
                    └──────┬──────┘
                           │ HTTPS
                    ┌──────▼──────┐
                    │  Render.com │ ◄── Backend (FastAPI)
                    │  + SQLite   │
                    │  + FAISS    │
                    └─────────────┘
                           │
                    ┌──────▼──────┐
                    │ Google AI   │ ◄── Gemini API
                    └─────────────┘
```

## 11. Future Enhancements

1. **Streaming Responses** — Use Gemini streaming API for real-time chat output
2. **User Authentication** — OAuth2/JWT for multi-user sessions
3. **Persistent Vector DB** — Migrate to Pinecone/Weaviate for cloud scalability
4. **Caching Layer** — Redis for caching summaries and quiz results
5. **Background Processing** — Celery workers for large file uploads
6. **Multi-Model Support** — Switch between Gemini models for cost/quality tradeoffs
7. **Analytics Dashboard** — Track usage patterns and learning progress
