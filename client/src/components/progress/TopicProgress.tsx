import React from 'react';
import { TopicProgressItem } from '../../services/api/learningApi';
import { useNavigate } from 'react-router-dom';

interface TopicProgressProps {
  topics: TopicProgressItem[];
}

export const TopicProgress: React.FC<TopicProgressProps> = ({ topics }) => {
  const navigate = useNavigate();

  const handleAction = (action: string) => {
    if (action === 'review_lesson') {
      navigate('/learning');
    } else if (action === 'practice_questions') {
      navigate('/practice');
    } else {
      navigate('/mock-tests');
    }
  };

  return (
    <section aria-labelledby="topic-progress-heading" className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 id="topic-progress-heading" className="text-lg font-bold text-white">
            Topic Progress & Practice Status
          </h3>
          <p className="text-xs text-slate-400">
            Factual accuracy per subject area with transparent practice recommendations.
          </p>
        </div>
      </div>

      <div className="space-y-3" role="list" aria-label="Topic Performance List">
        {topics.map((tp) => {
          const isHigh = tp.accuracy >= 75;
          const isMedium = tp.accuracy >= 60 && tp.accuracy < 75;
          const barColor = isHigh ? 'bg-emerald-500' : isMedium ? 'bg-amber-500' : 'bg-rose-500';

          return (
            <div
              key={`${tp.subject}-${tp.topic}`}
              role="listitem"
              className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                    {tp.subject}
                  </span>
                  <h4 className="text-sm font-semibold text-white">{tp.topic}</h4>
                </div>

                {/* Accessible Progress Bar with ARIA attributes */}
                <div className="flex items-center gap-3">
                  <div
                    role="progressbar"
                    aria-valuenow={tp.accuracy}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${tp.topic} accuracy: ${tp.accuracy}%`}
                    className="w-full max-w-xs h-2 rounded-full bg-slate-700 overflow-hidden"
                  >
                    <div className={`h-full ${barColor}`} style={{ width: `${tp.accuracy}%` }} />
                  </div>
                  <span className="text-xs font-bold text-slate-200 min-w-[3rem]">
                    {tp.accuracy}%
                  </span>
                </div>

                <p className="text-xs text-slate-400">
                  {tp.questions_attempted} attempts · avg {Math.round(tp.average_time_seconds)}s/question ·{' '}
                  <span className="text-slate-300 font-medium">{tp.factual_status}</span>
                </p>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={() => handleAction(tp.recommended_action)}
                className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold shrink-0 focus:outline-none focus:ring-2 focus:ring-indigo-400 self-start sm:self-auto"
              >
                {tp.recommended_action === 'review_lesson'
                  ? 'Review Lesson'
                  : tp.recommended_action === 'practice_questions'
                  ? 'Practice Questions'
                  : 'Take Timed Mock'}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
};
