import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../common/Card';
import { PracticeResult } from '../../types/practice';
import {
  CheckCircle2,
  XCircle,
  SkipForward,
  Clock,
  Target,
  ArrowRight,
  RotateCcw,
  BookOpen,
  LayoutDashboard,
  Sparkles,
  Award,
} from 'lucide-react';

interface PracticeResultCardProps {
  result: PracticeResult;
  onPracticeAgain?: () => void;
  onReviewAnswers?: () => void;
}

export const PracticeResultCard: React.FC<PracticeResultCardProps> = ({
  result,
  onPracticeAgain,
  onReviewAnswers,
}) => {
  return (
    <Card className="flex flex-col gap-6">
      {/* Header Summary Banner */}
      <div className="p-6 rounded-2xl border border-primary/20 bg-primary/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-primary/10 text-primary flex-shrink-0" aria-hidden="true">
            <Award className="w-8 h-8" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
              Practice Summary • {result.subjectName}
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">
              {result.summaryTitle}
            </h2>
            <p className="text-xs text-foreground-secondary leading-relaxed max-w-lg">
              {result.summaryMessage}
            </p>
          </div>
        </div>

        {/* Score & Accuracy Big Badges */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-around sm:justify-start">
          <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-surface border border-border min-w-[90px]">
            <span className="text-[10px] uppercase font-bold text-foreground-secondary">
              Score
            </span>
            <span className="font-mono text-xl font-bold text-foreground">
              {result.correctCount} / {result.totalQuestions}
            </span>
          </div>

          <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-surface border border-border min-w-[90px]">
            <span className="text-[10px] uppercase font-bold text-foreground-secondary">
              Accuracy
            </span>
            <span className="font-mono text-xl font-bold text-primary">
              {result.accuracyPercent}%
            </span>
          </div>
        </div>
      </div>

      {/* Metrics Breakdown Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Correct */}
        <div className="p-4 rounded-xl border border-success/30 bg-success/5 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-success">
            <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
            <span className="text-xs font-bold text-success-contrast">Correct</span>
          </div>
          <span className="font-mono text-xl font-bold text-foreground">
            {result.correctCount}
          </span>
          <span className="text-[10px] text-foreground-secondary">Answered accurately</span>
        </div>

        {/* Incorrect */}
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
            <XCircle className="w-4 h-4" aria-hidden="true" />
            <span className="text-xs font-bold text-foreground">Needs Review</span>
          </div>
          <span className="font-mono text-xl font-bold text-foreground">
            {result.incorrectCount}
          </span>
          <span className="text-[10px] text-foreground-secondary">Revisit explanations</span>
        </div>

        {/* Skipped */}
        <div className="p-4 rounded-xl border border-border bg-surface-elevated/40 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-foreground-secondary">
            <SkipForward className="w-4 h-4" aria-hidden="true" />
            <span className="text-xs font-bold text-foreground">Skipped</span>
          </div>
          <span className="font-mono text-xl font-bold text-foreground">
            {result.skippedCount}
          </span>
          <span className="text-[10px] text-foreground-secondary">Unattempted items</span>
        </div>

        {/* Time Used */}
        <div className="p-4 rounded-xl border border-border bg-surface flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-foreground-secondary">
            <Clock className="w-4 h-4 text-foreground-muted" aria-hidden="true" />
            <span className="text-xs font-bold text-foreground">Time Used</span>
          </div>
          <span className="font-mono text-xl font-bold text-foreground">
            {result.timeUsedFormatted}
          </span>
          <span className="text-[10px] text-foreground-secondary">Practice duration</span>
        </div>
      </div>

      {/* Recommended Next Step Box */}
      <section
        aria-labelledby="recommended-next-step"
        className="p-5 rounded-xl border border-border bg-surface-elevated/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary flex-shrink-0" aria-hidden="true">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 id="recommended-next-step" className="text-xs font-bold uppercase tracking-wider text-foreground">
              Recommended Next Step
            </h3>
            <p className="text-xs text-foreground-secondary leading-relaxed mt-0.5">
              {result.recommendedNextStep}
            </p>
          </div>
        </div>

        <Link
          to={`/candidate/learn/${result.subjectId}/${result.topicId}`}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-surface border border-border hover:bg-surface-elevated text-foreground text-xs font-semibold min-h-[40px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors flex-shrink-0"
        >
          <BookOpen className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
          <span>Review Concept Notes</span>
        </Link>
      </section>

      {/* Weak Areas (Rule-Based Demo Analysis) */}
      {result.weakTopics.length > 0 && (
        <section aria-labelledby="weak-topics-heading" className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 id="weak-topics-heading" className="text-xs font-bold uppercase tracking-wider text-foreground">
              Topics to Strengthen
            </h3>
            <span className="text-[10px] text-foreground-secondary">
              Based on this practice session
            </span>
          </div>

          <div className="flex flex-col gap-2.5">
            {result.weakTopics.map((wt) => (
              <div
                key={wt.topicId}
                className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-foreground">{wt.topicName}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-400">
                      {wt.accuracyPercent}% Accuracy
                    </span>
                  </div>
                  <p className="text-xs text-foreground-secondary">{wt.recommendation}</p>
                </div>

                <Link
                  to={`/candidate/learn/${wt.subjectId}/${wt.topicId}`}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border text-foreground text-xs font-semibold hover:bg-surface-elevated min-h-[38px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors flex-shrink-0"
                >
                  <span>Review Topic</span>
                  <ArrowRight className="w-3 h-3" aria-hidden="true" />
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Primary Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border">
        <div className="flex flex-wrap items-center gap-2">
          {onReviewAnswers && (
            <button
              type="button"
              onClick={onReviewAnswers}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-surface hover:bg-surface-elevated border border-border text-foreground text-xs font-bold min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
            >
              <CheckCircle2 className="w-4 h-4 text-primary" aria-hidden="true" />
              <span>Review All Answers</span>
            </button>
          )}

          {onPracticeAgain && (
            <button
              type="button"
              onClick={onPracticeAgain}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-primary hover:bg-primary-hover active:bg-primary-hover text-primary-contrast text-xs font-bold min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              <span>Practice Again</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/candidate/practice"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-surface hover:bg-surface-elevated border border-border text-foreground-secondary hover:text-foreground text-xs font-semibold min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
          >
            <Target className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Back to Practice</span>
          </Link>

          <Link
            to="/candidate/dashboard"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-surface hover:bg-surface-elevated border border-border text-foreground-secondary hover:text-foreground text-xs font-semibold min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
          >
            <LayoutDashboard className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Dashboard</span>
          </Link>
        </div>
      </div>
    </Card>
  );
};
