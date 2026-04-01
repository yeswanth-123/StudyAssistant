import sqlite3
import json
from datetime import datetime
from config import settings


def get_db():
    conn = sqlite3.connect(settings.sqlite_db_path)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    cursor = conn.cursor()
    cursor.executescript("""
        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            title TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS documents (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            filename TEXT,
            file_type TEXT,
            source_url TEXT,
            raw_text TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (session_id) REFERENCES sessions(id)
        );

        CREATE TABLE IF NOT EXISTS summaries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            short_summary TEXT,
            detailed_summary TEXT,
            bullet_points TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (session_id) REFERENCES sessions(id)
        );

        CREATE TABLE IF NOT EXISTS topics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            main_topics TEXT,
            subtopics TEXT,
            keywords TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (session_id) REFERENCES sessions(id)
        );

        CREATE TABLE IF NOT EXISTS quizzes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            quiz_data TEXT,
            difficulty TEXT DEFAULT 'medium',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (session_id) REFERENCES sessions(id)
        );

        CREATE TABLE IF NOT EXISTS chat_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            role TEXT NOT NULL,
            message TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (session_id) REFERENCES sessions(id)
        );
    """)
    conn.commit()
    conn.close()


def save_session(session_id: str, title: str):
    conn = get_db()
    conn.execute(
        "INSERT OR REPLACE INTO sessions (id, title, updated_at) VALUES (?, ?, ?)",
        (session_id, title, datetime.now()),
    )
    conn.commit()
    conn.close()


def save_document(doc_id: str, session_id: str, filename: str, file_type: str, raw_text: str, source_url: str = None):
    conn = get_db()
    conn.execute(
        "INSERT INTO documents (id, session_id, filename, file_type, raw_text, source_url) VALUES (?, ?, ?, ?, ?, ?)",
        (doc_id, session_id, filename, file_type, raw_text, source_url),
    )
    conn.commit()
    conn.close()


def save_summary(session_id: str, short_summary: str, detailed_summary: str, bullet_points: list):
    conn = get_db()
    conn.execute(
        "INSERT INTO summaries (session_id, short_summary, detailed_summary, bullet_points) VALUES (?, ?, ?, ?)",
        (session_id, short_summary, detailed_summary, json.dumps(bullet_points)),
    )
    conn.commit()
    conn.close()


def save_topics(session_id: str, main_topics: list, subtopics: list, keywords: list):
    conn = get_db()
    conn.execute(
        "INSERT INTO topics (session_id, main_topics, subtopics, keywords) VALUES (?, ?, ?, ?)",
        (session_id, json.dumps(main_topics), json.dumps(subtopics), json.dumps(keywords)),
    )
    conn.commit()
    conn.close()


def save_quiz(session_id: str, quiz_data: dict, difficulty: str):
    conn = get_db()
    conn.execute(
        "INSERT INTO quizzes (session_id, quiz_data, difficulty) VALUES (?, ?, ?)",
        (session_id, json.dumps(quiz_data), difficulty),
    )
    conn.commit()
    conn.close()


def save_chat_message(session_id: str, role: str, message: str):
    conn = get_db()
    conn.execute(
        "INSERT INTO chat_history (session_id, role, message) VALUES (?, ?, ?)",
        (session_id, role, message),
    )
    conn.commit()
    conn.close()


def get_chat_history(session_id: str, limit: int = 20):
    conn = get_db()
    rows = conn.execute(
        "SELECT role, message FROM chat_history WHERE session_id = ? ORDER BY created_at DESC LIMIT ?",
        (session_id, limit),
    ).fetchall()
    conn.close()
    return [{"role": r["role"], "message": r["message"]} for r in reversed(rows)]


def get_session(session_id: str):
    conn = get_db()
    row = conn.execute("SELECT * FROM sessions WHERE id = ?", (session_id,)).fetchone()
    conn.close()
    return dict(row) if row else None


def get_session_summary(session_id: str):
    conn = get_db()
    row = conn.execute(
        "SELECT * FROM summaries WHERE session_id = ? ORDER BY created_at DESC LIMIT 1",
        (session_id,),
    ).fetchone()
    conn.close()
    if row:
        result = dict(row)
        result["bullet_points"] = json.loads(result["bullet_points"])
        return result
    return None


def get_session_topics(session_id: str):
    conn = get_db()
    row = conn.execute(
        "SELECT * FROM topics WHERE session_id = ? ORDER BY created_at DESC LIMIT 1",
        (session_id,),
    ).fetchone()
    conn.close()
    if row:
        result = dict(row)
        result["main_topics"] = json.loads(result["main_topics"])
        result["subtopics"] = json.loads(result["subtopics"])
        result["keywords"] = json.loads(result["keywords"])
        return result
    return None
