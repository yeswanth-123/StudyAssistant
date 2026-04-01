import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

const api = axios.create({
  baseURL: API_URL,
  timeout: 120000, // 2 min timeout for AI operations
});

// ========== Upload ==========
export async function uploadFile(file: File, sessionId?: string) {
  const formData = new FormData();
  formData.append("file", file);
  if (sessionId) formData.append("session_id", sessionId);
  const res = await api.post("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function uploadUrl(url: string, sessionId?: string) {
  const res = await api.post("/upload-url", { url, session_id: sessionId });
  return res.data;
}

export async function uploadText(text: string, title: string = "Pasted Text", sessionId?: string) {
  const res = await api.post("/upload-text", { text, title, session_id: sessionId });
  return res.data;
}

// ========== Process All ==========
export async function processAll(sessionId: string) {
  const res = await api.post("/process-all", { session_id: sessionId });
  return res.data;
}

// ========== Summarize ==========
export async function getSummary(sessionId: string) {
  const res = await api.post("/summarize", { session_id: sessionId });
  return res.data;
}

// ========== Topics ==========
export async function getTopics(sessionId: string) {
  const res = await api.post("/topics", { session_id: sessionId });
  return res.data;
}

// ========== Quiz ==========
export async function generateQuiz(
  sessionId: string,
  difficulty: string = "medium",
  numQuestions: number = 10
) {
  const res = await api.post("/quiz/generate", {
    session_id: sessionId,
    difficulty,
    num_questions: numQuestions,
  });
  return res.data;
}

export async function evaluateAnswer(
  question: string,
  expectedAnswer: string,
  userAnswer: string
) {
  const res = await api.post("/quiz/evaluate", {
    question,
    expected_answer: expectedAnswer,
    user_answer: userAnswer,
  });
  return res.data;
}

// ========== Chat ==========
export async function sendChatMessage(sessionId: string, message: string) {
  const res = await api.post("/chat", {
    session_id: sessionId,
    message,
  });
  return res.data;
}

export async function getChatHistory(sessionId: string) {
  const res = await api.get(`/chat/history/${sessionId}`);
  return res.data;
}

// ========== Recommendations ==========
export async function getRecommendations(sessionId: string) {
  const res = await api.post("/recommendations", { session_id: sessionId });
  return res.data;
}

// ========== Session ==========
export async function getSession(sessionId: string) {
  const res = await api.get(`/session/${sessionId}`);
  return res.data;
}
