import React from 'react';
import { Link } from 'react-router-dom';
import { NextActionItem } from '../../types/candidateDashboard';
import { ArrowRight, Clock, PlayCircle, Sparkles } from 'lucide-react';
import { useAccessibility } from '../../hooks/useAccessibility';

export interface NextActionBannerProps {
  action: NextActionItem;
  className?: string;
}

export const NextActionBanner: React.FC<NextActionBannerProps> = ({ action, className = '' }) => {
  const { preferences } = useAccessibility();
  const isHindi = preferences?.language === 'hi' || (typeof document !== 'undefined' && document.documentElement.lang === 'hi');
  const percentCompleted = Math.round((action.completedQuestions / action.totalQuestions) * 100);

  return (
    <section
      id="next-action-section"
      aria-labelledby="next-action-heading"
      className={`rounded-2xl border border-primary/40 bg-gradient-to-r from-primary/15 via-surface/80 to-surface/85 backdrop-blur-xl p-5 sm:p-7 shadow-glass flex flex-col gap-5 text-foreground relative overflow-hidden glass-specular ${className}`}
    >
      {/* Decorative background badge */}
      <div className="flex items-center justify-between gap-2 border-b border-border/80 pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-primary">
            {isHindi ? 'अनुशंसित अगला कदम' : 'Next Recommended Step'}
          </span>
        </div>
        <div
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface-elevated/80 backdrop-blur-md border border-border text-xs font-mono font-semibold text-foreground-secondary shadow-xs"
          aria-label={`Estimated duration: ${action.estimatedMinutesRemaining} minutes remaining`}
        >
          <Clock className="w-3.5 h-3.5 text-primary shrink-0" aria-hidden="true" />
          <span>~{action.estimatedMinutesRemaining} {isHindi ? 'मिनट' : 'mins'}</span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col gap-2 max-w-xl">
          <h2 id="next-action-heading" className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
            {action.title}
          </h2>

          <div className="flex items-center gap-2 text-sm text-foreground">
            <span className="font-bold text-primary px-2.5 py-0.5 rounded-lg bg-primary/15 border border-primary/30 text-xs backdrop-blur-xs">
              {action.subject}
            </span>
            <span className="font-bold text-foreground">
              {action.topic}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-foreground-secondary leading-relaxed">
            {isHindi
              ? `इस अभ्यास सत्र को पूरा करने के लिए ${action.totalQuestions - action.completedQuestions} और प्रश्न हल करें।`
              : `Complete ${action.totalQuestions - action.completedQuestions} more questions to finish this scheduled ${action.subject} practice session.`}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <Link
            to={action.ctaRoute}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-primary hover:from-indigo-600 hover:to-primary-hover text-white font-extrabold text-sm shadow-glow-primary hover:shadow-lg transition-all min-h-[48px] focus:outline-none focus-visible:ring-3 focus-visible:ring-primary focus-visible:ring-offset-2 select-none"
            aria-label={`${action.ctaLabel}: ${action.subject} - ${action.topic}. ${action.completedQuestions} of ${action.totalQuestions} questions completed.`}
          >
            <PlayCircle className="w-5 h-5 shrink-0" aria-hidden="true" />
            <span>{isHindi ? 'अभ्यास जारी रखें' : action.ctaLabel}</span>
          </Link>

          <Link
            to="/candidate/practice"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-border bg-surface/70 hover:bg-surface-elevated text-foreground text-xs font-bold transition-all min-h-[48px] backdrop-blur-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="View all available practice subjects and question banks"
          >
            <span>{isHindi ? 'सभी अभ्यास देखें' : 'View All Practice'}</span>
            <ArrowRight className="w-3.5 h-3.5 text-foreground-muted shrink-0" aria-hidden="true" />
          </Link>
        </div>
      </div>

      {/* Semantic Accessible Progress Bar */}
      <div className="flex flex-col gap-2 pt-2 border-t border-border/80">
        <div className="flex justify-between items-center text-xs font-semibold">
          <span className="text-foreground">
            Progress: {action.completedQuestions} / {action.totalQuestions} questions completed
          </span>
          <span className="font-mono text-primary font-bold">{percentCompleted}%</span>
        </div>

        <div
          role="progressbar"
          aria-valuenow={percentCompleted}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Practice progress for ${action.topic}: ${action.completedQuestions} of ${action.totalQuestions} questions completed`}
          className="w-full bg-surface-elevated rounded-full h-3 overflow-hidden border border-border"
        >
          <div
            className="bg-primary h-full rounded-full transition-all duration-300"
            style={{ width: `${percentCompleted}%` }}
          />
        </div>
      </div>
    </section>
  );
};
