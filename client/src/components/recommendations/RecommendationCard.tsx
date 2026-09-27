import React, { useState } from 'react';
import { RecommendationItem } from '../../services/api/learningApi';
import { useNavigate } from 'react-router-dom';

interface RecommendationCardProps {
  recommendation: RecommendationItem;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({ recommendation }) => {
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState<'yes' | 'no' | null>(null);

  const handleStart = () => {
    if (recommendation.type === 'review') {
      navigate('/learning');
    } else if (recommendation.type === 'practice') {
      navigate('/practice');
    } else {
      navigate('/mock-tests');
    }
  };

  const priorityBadge =
    recommendation.priority === 'high'
      ? 'bg-rose-950/40 text-rose-300 border-rose-800'
      : recommendation.priority === 'normal'
      ? 'bg-amber-950/40 text-amber-300 border-amber-800'
      : 'bg-emerald-950/40 text-emerald-300 border-emerald-800';

  const typeIcon =
    recommendation.type === 'review'
      ? '📖'
      : recommendation.type === 'practice'
      ? '✏️'
      : '⏱️';

  return (
    <article
      aria-labelledby={`rec-title-${recommendation.id}`}
      className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 flex flex-col justify-between gap-3 text-slate-100"
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${priorityBadge}`}
          >
            {recommendation.priority} Priority
          </span>
          <span className="text-xs text-slate-400">{recommendation.subject}</span>
        </div>

        <h4 id={`rec-title-${recommendation.id}`} className="text-sm font-bold text-white flex items-center gap-1.5">
          <span aria-hidden="true">{typeIcon}</span> {recommendation.topic}
        </h4>

        <p className="text-xs text-slate-300 leading-relaxed font-normal">
          {recommendation.reason}
        </p>
      </div>

      <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between gap-2">
        {/* Optional User Feedback Loop (Section 63) */}
        <div className="text-[11px] text-slate-400">
          {feedback ? (
            <span className="text-emerald-400 font-medium">✓ Feedback recorded</span>
          ) : (
            <div className="flex items-center gap-1">
              <span className="sr-only">Was this recommendation useful?</span>
              <button
                type="button"
                onClick={() => setFeedback('yes')}
                title="Mark recommendation as helpful"
                className="hover:text-white px-1.5 py-0.5 rounded hover:bg-slate-700"
              >
                👍 Helpful
              </button>
              <button
                type="button"
                onClick={() => setFeedback('no')}
                title="Mark recommendation as not helpful"
                className="hover:text-white px-1.5 py-0.5 rounded hover:bg-slate-700"
              >
                👎 Not really
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleStart}
          className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          {recommendation.type === 'review'
            ? 'Start Review'
            : recommendation.type === 'practice'
            ? 'Start Practice'
            : 'Start Mock'}
        </button>
      </div>
    </article>
  );
};
