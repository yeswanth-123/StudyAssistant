"use client";

import React from "react";
import { FiTag, FiHash } from "react-icons/fi";

interface TopicsData {
  main_topics: string[];
  subtopics: string[];
  keywords: string[];
}

interface TopicsSectionProps {
  data: TopicsData | null;
  isLoading: boolean;
}

export default function TopicsSection({ data, isLoading }: TopicsSectionProps) {
  if (isLoading) {
    return (
      <div className="glass rounded-2xl p-6 animate-pulse">
        <div className="h-6 bg-white/10 rounded w-1/3 mb-4"></div>
        <div className="flex flex-wrap gap-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-8 bg-white/10 rounded-full w-20"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="glass rounded-2xl p-6">
      <h2 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
        <FiTag className="text-purple-400" />
        Topics & Keywords
      </h2>

      {/* Main Topics */}
      <div className="mb-4">
        <h3 className="font-semibold text-slate-300 text-sm uppercase tracking-wide mb-2">
          Main Topics
        </h3>
        <div className="flex flex-wrap gap-2">
          {data.main_topics.map((topic, index) => (
            <span
              key={index}
              className="px-3 py-1.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full text-sm font-medium"
            >
              {topic}
            </span>
          ))}
        </div>
      </div>

      {/* Subtopics */}
      <div className="mb-4">
        <h3 className="font-semibold text-slate-300 text-sm uppercase tracking-wide mb-2">
          Subtopics
        </h3>
        <div className="flex flex-wrap gap-2">
          {data.subtopics.map((topic, index) => (
            <span
              key={index}
              className="px-3 py-1.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full text-sm font-medium"
            >
              {topic}
            </span>
          ))}
        </div>
      </div>

      {/* Keywords */}
      <div>
        <h3 className="font-semibold text-slate-300 text-sm uppercase tracking-wide mb-2 flex items-center gap-1">
          <FiHash className="text-slate-500" size={14} />
          Keywords
        </h3>
        <div className="flex flex-wrap gap-2">
          {data.keywords.map((keyword, index) => (
            <span
              key={index}
              className="px-2.5 py-1 bg-white/5 text-slate-400 border border-white/10 rounded-lg text-xs font-medium"
            >
              {keyword}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
