"use client";

import React from "react";
import { FiExternalLink, FiYoutube, FiBookOpen, FiStar } from "react-icons/fi";

interface VideoRec {
  title: string;
  description: string;
  search_query: string;
  relevance: string;
  url: string;
}

interface ArticleRec {
  title: string;
  description: string;
  search_query: string;
  relevance: string;
  url: string;
}

interface RecommendationsData {
  youtube_videos: VideoRec[];
  articles: ArticleRec[];
  study_tips: string[];
}

interface RecommendationsSectionProps {
  data: RecommendationsData | null;
  isLoading: boolean;
}

export default function RecommendationsSection({
  data,
  isLoading,
}: RecommendationsSectionProps) {
  if (isLoading) {
    return (
      <div className="glass rounded-2xl p-6 animate-pulse">
        <div className="h-6 bg-white/10 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-white/10 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="glass rounded-2xl p-6">
      <h2 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
        <FiStar className="text-orange-400" />
        Recommended Resources
      </h2>

      {/* YouTube Videos */}
      <div className="mb-6">
        <h3 className="font-semibold text-slate-300 text-sm uppercase tracking-wide mb-3 flex items-center gap-2">
          <FiYoutube className="text-red-400" />
          YouTube Videos
        </h3>
        <div className="space-y-3">
          {data.youtube_videos.map((video, index) => (
            <a
              key={index}
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3 rounded-lg border border-white/10 hover:border-red-500/30 hover:bg-red-500/5 transition-all group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-slate-200 text-sm group-hover:text-red-300">
                    {video.title}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">{video.description}</p>
                  <p className="text-xs text-slate-600 mt-1 italic">
                    {video.relevance}
                  </p>
                </div>
                <FiExternalLink className="text-slate-600 group-hover:text-red-400 flex-shrink-0 mt-1" />
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Articles */}
      <div className="mb-6">
        <h3 className="font-semibold text-slate-300 text-sm uppercase tracking-wide mb-3 flex items-center gap-2">
          <FiBookOpen className="text-blue-400" />
          Articles & Resources
        </h3>
        <div className="space-y-3">
          {data.articles.map((article, index) => (
            <a
              key={index}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3 rounded-lg border border-white/10 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-slate-200 text-sm group-hover:text-blue-300">
                    {article.title}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {article.description}
                  </p>
                </div>
                <FiExternalLink className="text-slate-600 group-hover:text-blue-400 flex-shrink-0 mt-1" />
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Study Tips */}
      {data.study_tips && data.study_tips.length > 0 && (
        <div>
          <h3 className="font-semibold text-slate-300 text-sm uppercase tracking-wide mb-3">
            Study Tips
          </h3>
          <ul className="space-y-2">
            {data.study_tips.map((tip, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-orange-400 mt-0.5">💡</span>
                <span className="text-sm text-slate-400">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
