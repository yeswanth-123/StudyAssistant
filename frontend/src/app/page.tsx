"use client";

import React, { useState } from "react";
import {
  FiBookOpen,
  FiTag,
  FiAward,
  FiMessageSquare,
  FiStar,
  FiZap,
} from "react-icons/fi";
import UploadSection from "@/components/UploadSection";
import SummarySection from "@/components/SummarySection";
import TopicsSection from "@/components/TopicsSection";
import QuizSection from "@/components/QuizSection";
import ChatSection from "@/components/ChatSection";
import RecommendationsSection from "@/components/RecommendationsSection";
import { processAll } from "@/lib/api";

type Tab = "summary" | "topics" | "quiz" | "chat" | "resources";

export default function Home() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("summary");
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Data states
  const [summaryData, setSummaryData] = useState<any>(null);
  const [topicsData, setTopicsData] = useState<any>(null);
  const [recsData, setRecsData] = useState<any>(null);

  const handleUploadComplete = async (newSessionId: string) => {
    setSessionId(newSessionId);
    setIsProcessing(true);
    setActiveTab("summary");

    try {
      const result = await processAll(newSessionId);
      setSummaryData(result.summary);
      setTopicsData(result.topics);
      setRecsData(result.recommendations);
    } catch (err: any) {
      console.error("Processing error:", err);
      alert(
        err.response?.data?.detail ||
          "Failed to process content. Please try again."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "summary", label: "Summary", icon: <FiBookOpen /> },
    { key: "topics", label: "Topics", icon: <FiTag /> },
    { key: "quiz", label: "Quiz", icon: <FiAward /> },
    { key: "chat", label: "Chat", icon: <FiMessageSquare /> },
    { key: "resources", label: "Resources", icon: <FiStar /> },
  ];

  return (
    <div className="min-h-screen bg-mesh">
      {/* Header */}
      <header className="glass-strong sticky top-0 z-50 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
              <FiZap className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text">StudyMate AI</h1>
              <p className="text-xs text-slate-400">
                Your Personalized Study Assistant
              </p>
            </div>
          </div>
          {sessionId && (
            <button
              onClick={() => {
                setSessionId(null);
                setSummaryData(null);
                setTopicsData(null);
                setRecsData(null);
              }}
              className="px-4 py-2 text-sm text-slate-300 border border-white/10 rounded-lg hover:bg-white/5 hover:border-white/20 transition-all"
            >
              New Session
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Upload Section - Always visible */}
        {!sessionId && (
          <div className="max-w-2xl mx-auto mt-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold gradient-text mb-2">
                Learn Smarter, Not Harder
              </h2>
              <p className="text-slate-400">
                Upload your study materials and let AI help you understand,
                summarize, quiz, and master the content.
              </p>
            </div>
            <UploadSection
              onUploadComplete={handleUploadComplete}
              sessionId={sessionId}
              isLoading={isUploading}
              setIsLoading={setIsUploading}
            />

            {/* Feature cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-8">
              {[
                {
                  icon: "📄",
                  title: "PDF & Docs",
                  desc: "Upload any PDF or text file",
                },
                {
                  icon: "🎥",
                  title: "YouTube",
                  desc: "Paste any YouTube URL",
                },
                {
                  icon: "�",
                  title: "Video",
                  desc: "MP4, MKV, AVI, MOV",
                },
                {
                  icon: "�🎵",
                  title: "Audio",
                  desc: "MP3, WAV, and more",
                },
                {
                  icon: "🖼️",
                  title: "Images",
                  desc: "OCR text extraction",
                },
                {
                  icon: "✏️",
                  title: "Text",
                  desc: "Paste content directly",
                },
              ].map((feature, i) => (
                <div
                  key={i}
                  className="glass glass-hover rounded-xl p-4 text-center transition-all cursor-default"
                >
                  <span className="text-2xl">{feature.icon}</span>
                  <p className="font-medium text-slate-200 text-sm mt-2">
                    {feature.title}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content Section - After upload */}
        {sessionId && (
          <div>
            {/* Processing Indicator */}
            {isProcessing && (
              <div className="glass glow-purple rounded-xl p-6 mb-6 text-center">
                <div className="loading-dots mb-3">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <p className="text-purple-300 font-medium">
                  Analyzing your content with AI...
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  Generating summary, extracting topics, and finding resources
                </p>
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 glass rounded-xl p-1.5 mb-6 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    activeTab === tab.key
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-purple-500/20"
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2">
                {activeTab === "summary" && (
                  <SummarySection data={summaryData} isLoading={isProcessing} />
                )}
                {activeTab === "topics" && (
                  <TopicsSection data={topicsData} isLoading={isProcessing} />
                )}
                {activeTab === "quiz" && <QuizSection sessionId={sessionId} />}
                {activeTab === "chat" && <ChatSection sessionId={sessionId} />}
                {activeTab === "resources" && (
                  <RecommendationsSection
                    data={recsData}
                    isLoading={isProcessing}
                  />
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Upload more files */}
                <UploadSection
                  onUploadComplete={handleUploadComplete}
                  sessionId={sessionId}
                  isLoading={isUploading}
                  setIsLoading={setIsUploading}
                />

                {/* Quick Stats */}
                {summaryData && (
                  <div className="glass rounded-2xl p-4 glow-blue">
                    <h3 className="font-semibold text-slate-300 text-sm mb-3">
                      Quick Summary
                    </h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      {summaryData.short_summary}
                    </p>
                  </div>
                )}

                {/* Topics Quick View */}
                {topicsData && activeTab !== "topics" && (
                  <div className="glass rounded-2xl p-4">
                    <h3 className="font-semibold text-slate-300 text-sm mb-3">
                      Key Topics
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {topicsData.main_topics
                        .slice(0, 5)
                        .map((topic: string, i: number) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full text-xs"
                          >
                            {topic}
                          </span>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 py-6 text-center text-sm text-slate-600 border-t border-white/5">
        <p>
          StudyMate AI — Powered by Google Gemini
        </p>
      </footer>
    </div>
  );
}
