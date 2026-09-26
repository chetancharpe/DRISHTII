import React from 'react';
import { Link } from 'react-router-dom';
import { LearningTopic } from '../../types/learning';
import { Clock, BookOpen, Target, Sparkles, CheckCircle2 } from 'lucide-react';

interface TopicListItemProps {
  topic: LearningTopic;
  subjectId: string;
}

export const TopicListItem: React.FC<TopicListItemProps> = ({ topic, subjectId }) => {
  return (
    <article
      aria-labelledby={`topic-title-${topic.id}`}
      className="p-4 sm:p-5 rounded-xl border border-border bg-surface hover:border-primary/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
    >
      {/* Topic Information */}
      <div className="flex flex-col gap-2 max-w-xl">
        <div className="flex flex-wrap items-center gap-2">
          <h3 id={`topic-title-${topic.id}`} className="text-sm sm:text-base font-bold text-foreground">
            {topic.name}
          </h3>

          {topic.isRecommended && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
              <Sparkles className="w-2.5 h-2.5" aria-hidden="true" />
              <span>Recommended</span>
            </span>
          )}

          {topic.progressPercent === 100 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-success/10 text-success border border-success/20">
              <CheckCircle2 className="w-2.5 h-2.5" aria-hidden="true" />
              <span>Completed</span>
            </span>
          )}
        </div>

        <p className="text-xs text-foreground-secondary leading-relaxed">
          {topic.shortDescription}
        </p>

        {/* Metadata Badges */}
        <div className="flex flex-wrap items-center gap-4 text-[11px] text-foreground-secondary pt-1">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-foreground-muted" aria-hidden="true" />
            <span>Est. {topic.estimatedMinutes} min</span>
          </span>

          <span className="inline-flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-foreground-muted" aria-hidden="true" />
            <span>{topic.completedLessons} / {topic.totalLessons} lessons</span>
          </span>

          {topic.practiceAvailable && (
            <span className="inline-flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-foreground-muted" aria-hidden="true" />
              <span>{topic.practiceCount} questions ready</span>
            </span>
          )}
        </div>
      </div>

      {/* Progress & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 md:gap-6 flex-shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-border">
        {/* Progress Display */}
        <div className="flex flex-col gap-1 w-full sm:w-28">
          <div className="flex items-center justify-between text-xs">
            <span className="text-foreground-secondary text-[11px]">Progress</span>
            <span className="font-bold text-foreground">{topic.progressPercent}%</span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={topic.progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuetext={`${topic.name} progress: ${topic.progressPercent} percent`}
            className="w-full h-1.5 rounded-full bg-surface-elevated overflow-hidden border border-border/40"
          >
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${topic.progressPercent}%` }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Link
            to={`/candidate/learn/${subjectId}/${topic.id}`}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary hover:bg-primary-hover active:bg-primary-hover text-primary-contrast font-bold text-xs min-h-[40px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
            aria-label={`Learn ${topic.name}`}
          >
            <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Learn</span>
          </Link>

          {topic.practiceAvailable && (
            <Link
              to={`/candidate/practice?subject=${subjectId}&topic=${topic.id}`}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-surface-elevated hover:bg-surface border border-border text-foreground font-semibold text-xs min-h-[40px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
              aria-label={`Practice questions for ${topic.name}`}
            >
              <Target className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
              <span>Practice</span>
            </Link>
          )}
        </div>
      </div>
    </article>
  );
};
