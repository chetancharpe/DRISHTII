import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, List, Target } from 'lucide-react';
import { LearningTopic } from '../../types/learning';

interface TopicNavigationFooterProps {
  subjectId: string;
  previousTopic?: LearningTopic | null;
  nextTopic?: LearningTopic | null;
  currentTopic: LearningTopic;
}

export const TopicNavigationFooter: React.FC<TopicNavigationFooterProps> = ({
  subjectId,
  previousTopic,
  nextTopic,
  currentTopic,
}) => {
  return (
    <footer aria-label="Topic navigation controls" className="flex flex-col gap-4 pt-6 border-t border-border mt-8">
      {/* Primary Practice CTA */}
      {currentTopic.practiceAvailable && (
        <div className="p-5 rounded-xl border border-primary/30 bg-primary/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10 text-primary flex-shrink-0" aria-hidden="true">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Ready to test what you just learned?
              </h3>
              <p className="text-xs text-foreground-secondary">
                Attempt {currentTopic.practiceCount} questions on {currentTopic.name} with instant explanatory feedback.
              </p>
            </div>
          </div>

          <Link
            to={`/candidate/practice?subject=${subjectId}&topic=${currentTopic.id}`}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-primary hover:bg-primary-hover active:bg-primary-hover text-primary-contrast text-xs font-bold min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-sm transition-colors flex-shrink-0"
            aria-label={`Start practice for ${currentTopic.name}`}
          >
            <span>Practice This Topic</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>
      )}

      {/* Prev / Next & Topic List Navigation */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        {previousTopic ? (
          <Link
            to={`/candidate/learn/${subjectId}/${previousTopic.id}`}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-surface border border-border hover:bg-surface-elevated text-foreground text-xs font-semibold min-h-[40px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
            aria-label={`Previous topic: ${previousTopic.name}`}
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Prev: {previousTopic.name}</span>
          </Link>
        ) : (
          <div className="hidden sm:block" />
        )}

        <Link
          to={`/candidate/learn/${subjectId}`}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-surface hover:bg-surface-elevated border border-border text-foreground-secondary hover:text-foreground text-xs font-semibold min-h-[40px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
          aria-label="Return to subject topics list"
        >
          <List className="w-3.5 h-3.5" aria-hidden="true" />
          <span>All Topics</span>
        </Link>

        {nextTopic ? (
          <Link
            to={`/candidate/learn/${subjectId}/${nextTopic.id}`}
            className="inline-flex items-center justify-end gap-2 px-3 py-2 rounded-lg bg-surface border border-border hover:bg-surface-elevated text-foreground text-xs font-semibold min-h-[40px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
            aria-label={`Next topic: ${nextTopic.name}`}
          >
            <span>Next: {nextTopic.name}</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        ) : (
          <div className="hidden sm:block" />
        )}
      </div>
    </footer>
  );
};
