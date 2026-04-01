"use client";

import React from "react";
import { FiBookOpen, FiList, FiChevronDown, FiChevronUp } from "react-icons/fi";

interface SummaryData {
  short_summary: string;
  detailed_summary: string;
  bullet_points: string[];
}

interface SummarySectionProps {
  data: SummaryData | null;
  isLoading: boolean;
}

export default function SummarySection({ data, isLoading }: SummarySectionProps) {
  const [showDetailed, setShowDetailed] = React.useState(false);

  if (isLoading) {
    return (
      <div className="glass rounded-2xl p-6 animate-pulse">
        <div className="h-6 bg-white/10 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-white/10 rounded w-full"></div>
          <div className="h-4 bg-white/10 rounded w-5/6"></div>
          <div className="h-4 bg-white/10 rounded w-4/6"></div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="glass rounded-2xl p-6">
      <h2 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
        <FiBookOpen className="text-emerald-400" />
        Summary
      </h2>

      {/* Short Summary */}
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-4">
        <h3 className="font-semibold text-emerald-300 text-sm uppercase tracking-wide mb-2">
          Quick Summary
        </h3>
        <p className="text-slate-300 leading-relaxed">{data.short_summary}</p>
      </div>

      {/* Detailed Summary Toggle */}
      <button
        onClick={() => setShowDetailed(!showDetailed)}
        className="flex items-center gap-2 text-blue-400 font-medium text-sm hover:text-blue-300 mb-3 transition-colors"
      >
        {showDetailed ? <FiChevronUp /> : <FiChevronDown />}
        {showDetailed ? "Hide" : "Show"} Detailed Summary
      </button>

      {showDetailed && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-4">
          <p className="text-slate-300 leading-relaxed whitespace-pre-line">
            {data.detailed_summary}
          </p>
        </div>
      )}

      {/* Bullet Points */}
      <div className="mt-4">
        <h3 className="font-semibold text-slate-300 text-sm uppercase tracking-wide mb-3 flex items-center gap-2">
          <FiList className="text-slate-500" />
          Key Points
        </h3>
        <ul className="space-y-2">
          {data.bullet_points.map((point, index) => (
            <li key={index} className="flex items-start gap-3">
              <span className="mt-1.5 w-2 h-2 rounded-full bg-blue-400 flex-shrink-0"></span>
              <span className="text-slate-400 text-sm leading-relaxed">{point}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
