"use client";

import React, { useState } from "react";
import {
  FiAward,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiChevronRight,
} from "react-icons/fi";
import { generateQuiz, evaluateAnswer } from "@/lib/api";

interface QuizSectionProps {
  sessionId: string;
}

interface MCQQuestion {
  id: number;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  difficulty: string;
}

interface ShortAnswerQuestion {
  id: number;
  question: string;
  expected_answer: string;
  key_points: string[];
  difficulty: string;
}

interface EvaluationResult {
  is_correct: boolean;
  score: number;
  feedback: string;
  explanation: string;
  improvement_suggestions: string[];
}

export default function QuizSection({ sessionId }: QuizSectionProps) {
  const [difficulty, setDifficulty] = useState("medium");
  const [numQuestions, setNumQuestions] = useState(10);
  const [mcqQuestions, setMcqQuestions] = useState<MCQQuestion[]>([]);
  const [shortQuestions, setShortQuestions] = useState<ShortAnswerQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [evaluations, setEvaluations] = useState<Record<string, EvaluationResult>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState<string | null>(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [score, setScore] = useState<{ correct: number; total: number } | null>(null);

  const allQuestions = [
    ...mcqQuestions.map((q) => ({ ...q, type: "mcq" as const })),
    ...shortQuestions.map((q) => ({ ...q, type: "short" as const })),
  ];

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const result = await generateQuiz(sessionId, difficulty, numQuestions);
      setMcqQuestions(result.mcq_questions || []);
      setShortQuestions(result.short_answer_questions || []);
      setCurrentQuestion(0);
      setSelectedAnswers({});
      setEvaluations({});
      setQuizStarted(true);
      setScore(null);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to generate quiz");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleMcqSelect = (questionId: string, answer: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleShortAnswer = (questionId: string, answer: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleEvaluate = async (q: any) => {
    const key = `${q.type}-${q.id}`;
    const userAnswer = selectedAnswers[key];
    if (!userAnswer) return;

    setIsEvaluating(key);
    try {
      let expectedAnswer: string;
      if (q.type === "mcq") {
        expectedAnswer = `Correct answer: ${q.correct_answer}. ${q.explanation}`;
      } else {
        expectedAnswer = `${q.expected_answer}. Key points: ${q.key_points.join(", ")}`;
      }

      const result = await evaluateAnswer(q.question, expectedAnswer, userAnswer);
      setEvaluations((prev) => ({ ...prev, [key]: result }));
    } catch (err: any) {
      alert(err.response?.data?.detail || "Evaluation failed");
    } finally {
      setIsEvaluating(null);
    }
  };

  const calculateScore = () => {
    let correct = 0;
    const total = allQuestions.length;

    allQuestions.forEach((q) => {
      const key = `${q.type}-${q.id}`;
      const eval_result = evaluations[key];
      if (eval_result?.is_correct) correct++;
    });

    setScore({ correct, total });
  };

  if (!quizStarted) {
    return (
      <div className="glass rounded-2xl p-6">
        <h2 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
          <FiAward className="text-amber-400" />
          Quiz Generator
        </h2>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Difficulty
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Number of Questions
            </label>
            <select
              value={numQuestions}
              onChange={(e) => setNumQuestions(Number(e.target.value))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className={`w-full py-3 rounded-xl font-semibold text-white transition-all ${
            isGenerating
              ? "bg-white/5 text-slate-500 cursor-not-allowed"
              : "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-lg shadow-amber-500/20"
          }`}
        >
          {isGenerating ? (
            <span className="flex items-center justify-center gap-2">
              <FiClock className="animate-spin" /> Generating Quiz...
            </span>
          ) : (
            "Generate Quiz"
          )}
        </button>
      </div>
    );
  }

  const currentQ = allQuestions[currentQuestion];
  const currentKey = currentQ ? `${currentQ.type}-${currentQ.id}` : "";

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <FiAward className="text-amber-400" />
          Quiz
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">
            {currentQuestion + 1} / {allQuestions.length}
          </span>
          <button
            onClick={() => {
              setQuizStarted(false);
              setScore(null);
            }}
            className="text-sm text-blue-400 hover:text-blue-300 hover:underline"
          >
            New Quiz
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-white/5 rounded-full h-2 mb-6">
        <div
          className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full transition-all"
          style={{
            width: `${((currentQuestion + 1) / allQuestions.length) * 100}%`,
          }}
        />
      </div>

      {/* Score Display */}
      {score && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-4 text-center">
          <p className="text-2xl font-bold text-amber-300">
            {score.correct} / {score.total} Correct
          </p>
          <p className="text-sm text-amber-400/70 mt-1">
            ({Math.round((score.correct / score.total) * 100)}%)
          </p>
        </div>
      )}

      {currentQ && (
        <div>
          {/* Difficulty Badge */}
          <span
            className={`inline-block px-2 py-0.5 text-xs rounded-full font-medium mb-3 ${
              currentQ.difficulty === "easy"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : currentQ.difficulty === "hard"
                ? "bg-red-500/20 text-red-300 border border-red-500/30"
                : "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
            }`}
          >
            {currentQ.difficulty}
          </span>

          <p className="text-slate-200 font-medium mb-4">{currentQ.question}</p>

          {/* MCQ Options */}
          {currentQ.type === "mcq" && (
            <div className="space-y-2 mb-4">
              {(currentQ as MCQQuestion).options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleMcqSelect(currentKey, opt.charAt(0))}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                    selectedAnswers[currentKey] === opt.charAt(0)
                      ? "border-blue-500/50 bg-blue-500/10 text-blue-300"
                      : "border-white/10 text-slate-300 hover:border-white/20 hover:bg-white/[0.02]"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          {/* Short Answer Input */}
          {currentQ.type === "short" && (
            <textarea
              value={selectedAnswers[currentKey] || ""}
              onChange={(e) => handleShortAnswer(currentKey, e.target.value)}
              placeholder="Type your answer here..."
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 mb-4"
            />
          )}

          {/* Evaluate Button */}
          {!evaluations[currentKey] && (
            <button
              onClick={() => handleEvaluate(currentQ)}
              disabled={!selectedAnswers[currentKey] || isEvaluating === currentKey}
              className={`w-full py-2.5 rounded-lg font-medium text-white transition-all mb-3 ${
                !selectedAnswers[currentKey] || isEvaluating === currentKey
                  ? "bg-white/5 text-slate-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500"
              }`}
            >
              {isEvaluating === currentKey ? "Evaluating..." : "Check Answer"}
            </button>
          )}

          {/* Evaluation Result */}
          {evaluations[currentKey] && (
            <div
              className={`rounded-xl p-4 mb-4 ${
                evaluations[currentKey].is_correct
                  ? "bg-emerald-500/10 border border-emerald-500/20"
                  : "bg-red-500/10 border border-red-500/20"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {evaluations[currentKey].is_correct ? (
                  <FiCheckCircle className="text-emerald-400 text-lg" />
                ) : (
                  <FiXCircle className="text-red-400 text-lg" />
                )}
                <span className="font-semibold text-slate-200">
                  {evaluations[currentKey].is_correct ? "Correct!" : "Incorrect"}
                </span>
                <span className="text-sm text-slate-500 ml-auto">
                  Score: {evaluations[currentKey].score}/100
                </span>
              </div>
              <p className="text-sm text-slate-400 mb-2">
                {evaluations[currentKey].feedback}
              </p>
              <p className="text-sm text-slate-500 italic">
                {evaluations[currentKey].explanation}
              </p>
              {evaluations[currentKey].improvement_suggestions.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase">
                    Suggestions
                  </p>
                  <ul className="text-sm text-slate-400 list-disc list-inside">
                    {evaluations[currentKey].improvement_suggestions.map(
                      (s, i) => (
                        <li key={i}>{s}</li>
                      )
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3">
            <button
              onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
              disabled={currentQuestion === 0}
              className="flex-1 py-2 rounded-lg border border-white/10 text-slate-300 font-medium hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Previous
            </button>
            {currentQuestion < allQuestions.length - 1 ? (
              <button
                onClick={() => setCurrentQuestion(currentQuestion + 1)}
                className="flex-1 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:from-blue-500 hover:to-purple-500 flex items-center justify-center gap-1"
              >
                Next <FiChevronRight />
              </button>
            ) : (
              <button
                onClick={calculateScore}
                className="flex-1 py-2 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 text-white font-medium hover:from-amber-500 hover:to-orange-500"
              >
                Finish Quiz
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
