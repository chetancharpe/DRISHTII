import React from 'react';
import { useNavigate } from 'react-router-dom';

interface PersonalizedPracticeProps {
  topics: string[];
}

export const PersonalizedPractice: React.FC<PersonalizedPracticeProps> = ({
  topics = ['Probability', 'Percentages', 'Syllogisms'],
}) => {
  const navigate = useNavigate();

  return (
    <div
      role="region"
      aria-labelledby="personalized-practice-heading"
      className="p-6 rounded-2xl bg-gradient-to-r from-indigo-900/60 via-slate-900 to-purple-900/40 border-2 border-indigo-500/50 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6"
    >
      <div className="space-y-2 max-w-xl">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold">
          ✨ Practice for You
        </div>
        <h3 id="personalized-practice-heading" className="text-xl font-bold text-white">
          Adaptive 10-Question Reinforcement Set
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          Questions automatically selected based on your recent accuracy in{' '}
          <span className="font-semibold text-white">{topics.slice(0, 3).join(', ')}</span>.
          Audio assistance and full keyboard shortcuts are enabled throughout the session.
        </p>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={() => navigate('/candidate/practice')}
          className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Start Practice Set (10 Questions)
        </button>
      </div>
    </div>
  );
};
