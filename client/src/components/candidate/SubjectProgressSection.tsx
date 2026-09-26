import React from 'react';
import { Link } from 'react-router-dom';
import { SubjectProgressItem } from '../../types/candidateDashboard';
import { BookOpen, ArrowRight } from 'lucide-react';

export interface SubjectProgressSectionProps {
  subjects: SubjectProgressItem[];
  className?: string;
}

export const SubjectProgressSection: React.FC<SubjectProgressSectionProps> = ({
  subjects,
  className = '',
}) => {
  return (
    <section
      aria-labelledby="subject-progress-heading"
      className={`rounded-xl border border-border bg-surface p-5 sm:p-6 shadow-sm flex flex-col gap-4 text-foreground ${className}`}
    >
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
          <h2 id="subject-progress-heading" className="text-base sm:text-lg font-bold text-foreground">
            Subject Progress
          </h2>
        </div>
        <span className="text-xs text-foreground-muted">
          4 Syllabus Domains
        </span>
      </div>

      <div className="flex flex-col gap-4">
        {subjects.map((subj) => (
          <div
            key={subj.id}
            className="p-3.5 rounded-lg border border-border bg-surface-elevated/40 flex flex-col gap-2.5"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <span className="text-sm font-bold text-foreground">{subj.subject}</span>
                <span className="text-xs text-foreground-muted ml-2">
                  ({subj.masteredTopics} of {subj.totalTopics} topics mastered)
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold text-foreground">
                  {subj.progressPercent}%
                </span>
                <Link
                  to={subj.practiceRoute}
                  className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary-hover hover:underline p-1 min-h-[36px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                  aria-label={`Practice ${subj.subject} questions. Current mastery is ${subj.progressPercent}%.`}
                >
                  <span>Practice</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </Link>
              </div>
            </div>

            {/* Semantic Accessible Progressbar */}
            <div
              role="progressbar"
              aria-valuenow={subj.progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${subj.subject} mastery progress: ${subj.progressPercent}%`}
              className="w-full bg-surface rounded-full h-2.5 overflow-hidden border border-border"
            >
              <div
                className="bg-primary h-full rounded-full transition-all duration-300"
                style={{ width: `${subj.progressPercent}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
