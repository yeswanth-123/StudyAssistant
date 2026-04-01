# StudyMate AI — Personalized Study Help Chatbot

A production-ready AI-powered learning assistant that accepts multiple content types, generates structured summaries, interactive quizzes, and provides a RAG-based chatbot for follow-up Q&A.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                     │
│  Upload │ Summary │ Topics │ Quiz │ Chat │ Resources     │
└────────────────────────┬────────────────────────────────┘
                         │ REST API
┌────────────────────────▼────────────────────────────────┐
│                   Backend (FastAPI)                       │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌────────────┐            │
│  │ Ingestion│→ │ Parsers  │→ │ Processing │            │
│  │ (upload) │  │ PDF/YT/  │  │ clean+chunk│            │
│  └──────────┘  │ Audio/   │  └─────┬──────┘            │
│                │ Image/ZIP│        │                     │
│                └──────────┘        ▼                     │
│                           ┌────────────────┐            │
│                           │  Embeddings    │            │
│                           │  (Gemini +     │            │
│                           │   FAISS)       │            │
│                           └───────┬────────┘            │
│                                   │                     │
│  ┌────────────────────────────────▼──────────────────┐  │
│  │              AI Services (Gemini API)              │  │
│  │  Summary │ Topics │ Quiz │ Evaluation │ Chat(RAG)  │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌─────────────────┐  ┌──────────────────┐              │
│  │  SQLite (meta)  │  │  FAISS (vectors) │              │
│  └─────────────────┘  └──────────────────┘              │
└──────────────────────────────────────────────────────────┘
```

## Data Flow

```
User Input → File/URL Upload → Parser (PDF/YT/Audio/Image/ZIP) → Text Extraction
→ Cleaning → Chunking → Embedding (Gemini) → FAISS Storage → Retrieval → Gemini LLM → UI
```

---

## Tech Stack

| Layer      | Technology        | Justification                                  |
|------------|-------------------|-------------------------------------------------|
| Frontend   | Next.js 14 + React 18 + Tailwind CSS | SSR, modern UI, rapid development  |
| Backend    | FastAPI (Python)  | Async, fast, auto OpenAPI docs                  |
| LLM        | Google Gemini API | Multimodal, strong reasoning, free tier          |
| Embeddings | Gemini Embedding API | Native integration with vector search       |
| Vector DB  | FAISS             | Fast similarity search, lightweight              |
| Metadata   | SQLite            | Zero-config, portable                           |
| PDF        | PyPDF2            | Pure Python, no system deps                      |
| YouTube    | youtube-transcript-api | Direct transcript extraction              |
| Audio      | SpeechRecognition + pydub | Google STT, handles multiple formats   |
| OCR        | Tesseract + Pillow | Industry standard OCR                          |
| Deployment | Docker + Docker Compose | Portable, reproducible                    |

---

## Folder Structure

```
Hackathon/
├── docker-compose.yml
├── backend/
│   ├── main.py                  # FastAPI app entry
│   ├── config.py                # Configuration & env vars
│   ├── database.py              # SQLite operations
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── .env.example
│   ├── ingestion/
│   │   └── handler.py           # File upload & URL handling
│   ├── parsers/
│   │   ├── pdf_parser.py        # PDF text extraction
│   │   ├── youtube_parser.py    # YouTube transcript extraction
│   │   ├── audio_parser.py      # Audio speech-to-text
│   │   ├── image_parser.py      # Image OCR
│   │   └── zip_parser.py        # ZIP extraction + mixed processing
│   ├── processing/
│   │   └── text_processor.py    # Text cleaning & chunking
│   ├── embeddings/
│   │   └── vector_store.py      # FAISS vector store + Gemini embeddings
│   ├── llm/
│   │   ├── gemini_client.py     # Gemini API wrapper
│   │   └── prompts.py           # All prompt templates
│   ├── services/
│   │   ├── summarization_service.py
│   │   ├── topic_service.py
│   │   ├── quiz_service.py
│   │   ├── evaluation_service.py
│   │   ├── chatbot_service.py
│   │   └── recommendation_service.py
│   └── api/
│       └── routes.py            # REST API endpoints
└── frontend/
    ├── package.json
    ├── next.config.js
    ├── tailwind.config.js
    ├── Dockerfile
    └── src/
        ├── app/
        │   ├── layout.tsx
        │   ├── globals.css
        │   └── page.tsx         # Main application page
        ├── lib/
        │   └── api.ts           # API client functions
        └── components/
            ├── UploadSection.tsx
            ├── SummarySection.tsx
            ├── TopicsSection.tsx
            ├── QuizSection.tsx
            ├── ChatSection.tsx
            └── RecommendationsSection.tsx
```

---

## API Endpoints

| Method | Endpoint               | Description                          |
|--------|------------------------|--------------------------------------|
| POST   | `/api/upload`          | Upload file (PDF/image/audio/ZIP)    |
| POST   | `/api/upload-url`      | Process a YouTube URL                |
| POST   | `/api/process-all`     | Generate summary+topics+recs at once |
| POST   | `/api/summarize`       | Generate structured summary          |
| POST   | `/api/topics`          | Extract topics & keywords            |
| POST   | `/api/quiz/generate`   | Generate quiz (MCQ + short answer)   |
| POST   | `/api/quiz/evaluate`   | Evaluate a user's answer             |
| POST   | `/api/chat`            | RAG-based chatbot Q&A                |
| GET    | `/api/chat/history/{id}` | Get chat history for session       |
| POST   | `/api/recommendations` | Get resource recommendations         |
| GET    | `/api/session/{id}`    | Get session info                     |
| GET    | `/health`              | Health check                         |

---

## Setup & Run Locally

### Prerequisites
- Python 3.11+
- Node.js 18+
- Tesseract OCR: `sudo apt install tesseract-ocr`
- FFmpeg: `sudo apt install ffmpeg`
- Google Gemini API key from https://aistudio.google.com/app/apikey

### Backend

```bash
cd backend

# Create .env file
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# Create virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev
```

Open http://localhost:3000

### Docker (Full Stack)

```bash
# From project root
cp backend/.env.example backend/.env
# Edit backend/.env with your GEMINI_API_KEY

docker-compose up --build
```

---

## Deployment Guide

### Backend → Render.com
1. Push code to GitHub
2. Create new Web Service on Render
3. Set root directory: `backend`
4. Build command: `pip install -r requirements.txt`
5. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Add environment variables (GEMINI_API_KEY, etc.)

### Frontend → Vercel
1. Import GitHub repo to Vercel
2. Set root directory: `frontend`
3. Add env: `NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api`
4. Deploy

---

## Scalability Improvements

1. **Async Embedding Pipeline**: Use background workers (Celery/Redis) for file processing
2. **Streaming Responses**: Use Gemini streaming API for real-time chat responses
3. **Persistent Vector DB**: Replace FAISS with Pinecone/Weaviate for cloud-native scaling
4. **Caching**: Add Redis for caching summaries, quiz results
5. **CDN**: Serve frontend via CloudFlare CDN
6. **Rate Limiting**: Add API rate limiting middleware
7. **Auth**: Add user authentication (OAuth2/JWT)
8. **Batch Processing**: Queue large file uploads for async processing
9. **Multi-Model**: Allow switching between Gemini models for cost/quality trade-offs
10. **Analytics**: Track usage patterns to improve recommendations
