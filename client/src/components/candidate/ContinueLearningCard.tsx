import React from 'react';
import { Link } from 'react-router-dom';
import { LearningProgressItem } from '../../types/candidateDashboard';
import { Bookmark, ArrowRight, Play, BookOpen } from 'lucide-react';

export interface ContinueLearningCardProps {
  learning: LearningProgressItem | null;
  className?: string;
}

export const ContinueLearningCard: React.FC<ContinueLearningCardProps> = ({
  learning,
  className = '',
}) => {
  return (
    <section
      aria-labelledby="continue-learning-heading"
      className={`rounded-xl border border-border bg-surface p-5 sm:p-6 shadow-sm flex flex-col gap-4 text-foreground ${className}`}
    >
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <Bookmark className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
        <h2 id="continue-learning-heading" className="text-base sm:text-lg font-bold text-foreground">
          Continue Where You Left Off
        </h2>
      </div>

      {learning ? (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-primary px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
                {learning.subject}
              </span>
              <h3 className="text-base font-bold text-foreground mt-1">
                {learning.topic}
              </h3>
            </div>
            <div className="text-xs text-foreground-secondary font-mono">
              {learning.completedLessons} of {learning.totalLessons} lessons completed
            </div>
          </div>

          <p className="text-xs text-foreground-muted leading-relaxed">
            Next lesson: <strong className="text-foreground">{learning.nextLessonTitle}</strong>
          </p>

          {/* Progress bar */}
          <div
            role="progressbar"
            aria-valuenow={Math.round((learning.completedLessons / learning.totalLessons) * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Lesson progress: ${learning.completedLessons} of ${learning.totalLessons} lessons completed`}
            className="w-full bg-surface-elevated rounded-full h-2 overflow-hidden border border-border"
          >
            <div
              className="bg-primary h-full rounded-full transition-all duration-300"
              style={{
                width: `${Math.round((learning.completedLessons / learning.totalLessons) * 100)}%`,
              }}
            />
          </div>

          <div className="pt-2 flex justify-end">
            <Link
              to={learning.continueRoute}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-primary-contrast text-xs font-bold transition-colors min-h-[42px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label={`Continue lesson: ${learning.nextLessonTitle} in ${learning.topic}`}
            >
              <Play className="w-4 h-4 fill-current shrink-0" aria-hidden="true" />
              <span>Continue Lesson</span>
            </Link>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="p-6 rounded-lg border border-dashed border-border bg-surface-elevated/30 flex flex-col items-center text-center gap-3">
          <BookOpen className="w-8 h-8 text-foreground-muted" aria-hidden="true" />
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-bold text-foreground">No learning activity yet</h3>
            <p className="text-xs text-foreground-muted max-w-sm leading-relaxed">
              Explore syllabus study guides, structured notes, and audio summaries to begin your coursework.
            </p>
          </div>
          <Link
            to="/candidate/learn"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border bg-surface hover:bg-surface-elevated text-foreground text-xs font-bold transition-colors min-h-[40px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span>Start Learning</span>
            <ArrowRight className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
          </Link>
        </div>
      )}
    </section>
  );
};
