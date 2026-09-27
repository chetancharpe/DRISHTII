import React from 'react';
import { ProgressSummary } from '../../services/api/learningApi';

interface ProgressOverviewProps {
  progress: ProgressSummary;
}

export const ProgressOverview: React.FC<ProgressOverviewProps> = ({ progress }) => {
  const { weekly_summary, overall_accuracy, total_questions_attempted, total_topics_practiced, study_streak_days } = progress;

  return (
    <section aria-labelledby="progress-overview-heading" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 id="progress-overview-heading" className="text-xl font-bold text-white">
            Performance & Practice Insights
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Objective progress metrics derived from your active study and practice sessions.
          </p>
        </div>
        <div
          role="status"
          aria-label={`Current study streak: ${study_streak_days} consecutive days`}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs font-semibold w-fit"
        >
          🔥 {study_streak_days}-Day Study Streak
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700">
          <span className="text-xs text-slate-400 font-medium block mb-1">Overall Accuracy</span>
          <span className="text-2xl font-bold text-indigo-400">{overall_accuracy}%</span>
          <span className="text-[11px] text-slate-400 block mt-1">Across all questions</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700">
          <span className="text-xs text-slate-400 font-medium block mb-1">Questions Attempted</span>
          <span className="text-2xl font-bold text-emerald-400">{total_questions_attempted}</span>
          <span className="text-[11px] text-slate-400 block mt-1">Practice & mock tests</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700">
          <span className="text-xs text-slate-400 font-medium block mb-1">Topics Practiced</span>
          <span className="text-2xl font-bold text-amber-400">{total_topics_practiced}</span>
          <span className="text-[11px] text-slate-400 block mt-1">Active curriculum areas</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700">
          <span className="text-xs text-slate-400 font-medium block mb-1">Active Study Time</span>
          <span className="text-2xl font-bold text-purple-400">{weekly_summary.study_time_minutes}m</span>
          <span className="text-[11px] text-slate-400 block mt-1">This past week</span>
        </div>
      </div>

      {/* Section 46 & 48: Accessible Weekly Narrative (Never requires visual graph) */}
      <div
        role="region"
        aria-label="Weekly Performance Narrative Summary"
        className="p-5 rounded-2xl bg-indigo-950/40 border border-indigo-800/50 space-y-2"
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 block">
          Weekly Summary ({weekly_summary.week_start} – {weekly_summary.week_end})
        </span>
        <p className="text-sm text-slate-200 leading-relaxed font-normal">
          {weekly_summary.summary_text}
        </p>
      </div>
    </section>
  );
};
