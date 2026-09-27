import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../common/Card';
import { MockTestResult } from '../../types/mockTest';
import {
  Award,
  CheckCircle2,
  XCircle,
  RotateCcw,
  BookOpen,
  LayoutDashboard,
  Sparkles,
  BookmarkCheck,
  TrendingUp,
} from 'lucide-react';

interface MockTestResultCardProps {
  result: MockTestResult;
  onRetake: () => void;
  onReview: () => void;
}

export const MockTestResultCard: React.FC<MockTestResultCardProps> = ({
  result,
  onRetake,
  onReview,
}) => {
  return (
    <Card className="flex flex-col gap-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl border border-primary/20 bg-primary/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className="p-3.5 rounded-2xl bg-primary/10 text-primary flex-shrink-0" aria-hidden="true">
            <Award className="w-8 h-8" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
              Mock Examination Result • {result.examName}
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              {result.testTitle}
            </h1>
            <p className="text-xs text-foreground-secondary leading-relaxed">
              Examination simulation successfully completed in {result.timeUsedFormatted}.
            </p>
          </div>
        </div>

        {/* Big Score Badges */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-around sm:justify-start">
          <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-surface border border-border min-w-[95px]">
            <span className="text-[10px] uppercase font-bold text-foreground-secondary">
              Score
            </span>
            <span className="font-mono text-xl font-bold text-foreground">
              {result.totalScore} / {result.maxScore}
            </span>
          </div>

          <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-surface border border-border min-w-[95px]">
            <span className="text-[10px] uppercase font-bold text-foreground-secondary">
              Percentage
            </span>
            <span className="font-mono text-xl font-bold text-primary">
              {result.percentage}%
            </span>
          </div>
        </div>
      </div>

      {/* Metrics Tally Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Correct */}
        <div className="p-4 rounded-xl border border-success/30 bg-success/5 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-success">
            <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
            <span className="text-xs font-bold text-success-contrast">Correct Attempts</span>
          </div>
          <span className="font-mono text-xl font-bold text-foreground">
            {result.correctCount}
          </span>
          <span className="text-[10px] text-foreground-secondary">Earned marks</span>
        </div>

        {/* Incorrect */}
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
            <XCircle className="w-4 h-4 text-amber-600" aria-hidden="true" />
            <span className="text-xs font-bold text-foreground">Incorrect Attempts</span>
          </div>
          <span className="font-mono text-xl font-bold text-foreground">
            {result.incorrectCount}
          </span>
          <span className="text-[10px] text-foreground-secondary">Incurred negative marks</span>
        </div>

        {/* Unanswered */}
        <div className="p-4 rounded-xl border border-border bg-surface-elevated/40 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-foreground-secondary">
            <span className="text-xs font-bold text-foreground">Unanswered</span>
          </div>
          <span className="font-mono text-xl font-bold text-foreground">
            {result.unansweredCount}
          </span>
          <span className="text-[10px] text-foreground-secondary">Zero penalty</span>
        </div>

        {/* Marked for Review */}
        <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-500/5 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-purple-700 dark:text-purple-300">
            <BookmarkCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" aria-hidden="true" />
            <span className="text-xs font-bold text-foreground">Marked for Review</span>
          </div>
          <span className="font-mono text-xl font-bold text-foreground">
            {result.markedForReviewCount}
          </span>
          <span className="text-[10px] text-foreground-secondary">Flagged during test</span>
        </div>
      </div>

      {/* Section-Wise Performance Breakdown */}
      <section aria-labelledby="section-perf-heading" className="flex flex-col gap-3">
        <h2 id="section-perf-heading" className="text-xs font-bold uppercase tracking-wider text-foreground">
          Sectional Performance Analysis
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {result.sectionPerformances.map((sec) => (
            <div
              key={sec.sectionId}
              className="p-4 rounded-xl border border-border bg-surface flex flex-col gap-2.5"
            >
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="font-bold text-xs text-foreground">{sec.sectionName}</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-primary/10 text-primary border border-primary/20">
                  {sec.accuracyPercent}%
                </span>
              </div>

              <div className="flex flex-col gap-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-foreground-secondary">Score:</span>
                  <span className="font-mono font-bold text-foreground">{sec.score} / {sec.maxScore}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground-secondary">Correct:</span>
                  <span className="font-mono text-foreground">{sec.correctCount} / {sec.totalQuestions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground-secondary">Incorrect:</span>
                  <span className="font-mono text-amber-600 dark:text-amber-400">{sec.incorrectCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground-secondary">Unanswered:</span>
                  <span className="font-mono text-foreground-secondary">{sec.unansweredCount}</span>
                </div>
              </div>

              {/* Visual + accessible progress */}
              <div
                role="progressbar"
                aria-valuenow={sec.accuracyPercent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuetext={`${sec.sectionName} accuracy: ${sec.accuracyPercent} percent`}
                className="w-full h-1.5 rounded-full bg-surface-elevated overflow-hidden border border-border mt-1"
              >
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${sec.accuracyPercent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Factual Performance Interpretations */}
      {result.factualInterpretations.length > 0 && (
        <section
          aria-labelledby="factual-interp-heading"
          className="p-5 rounded-xl border border-border bg-surface-elevated/40 flex flex-col gap-2.5"
        >
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" aria-hidden="true" />
            <h3 id="factual-interp-heading" className="text-xs font-bold uppercase tracking-wider text-foreground">
              Performance Observations
            </h3>
          </div>
          <ul className="flex flex-col gap-1.5 list-disc pl-5 text-xs text-foreground leading-relaxed">
            {result.factualInterpretations.map((note, idx) => (
              <li key={idx}>{note}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Recommended Next Steps */}
      {result.recommendedNextSteps.length > 0 && (
        <section
          aria-labelledby="rec-next-heading"
          className="p-5 rounded-xl border border-primary/20 bg-primary/5 flex flex-col gap-2.5"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" aria-hidden="true" />
            <h3 id="rec-next-heading" className="text-xs font-bold uppercase tracking-wider text-primary">
              Recommended Next Steps
            </h3>
          </div>
          <ol className="flex flex-col gap-1.5 list-decimal pl-5 text-xs text-foreground leading-relaxed">
            {result.recommendedNextSteps.map((step, idx) => (
              <li key={idx}>{step}</li>
            ))}
          </ol>
        </section>
      )}

      {/* Primary Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onReview}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-surface hover:bg-surface-elevated border border-border text-foreground text-xs font-bold min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
          >
            <BookOpen className="w-4 h-4 text-primary" aria-hidden="true" />
            <span>Review All Questions & Answers</span>
          </button>

          <button
            type="button"
            onClick={onRetake}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-primary hover:bg-primary-hover active:bg-primary-hover text-primary-contrast text-xs font-bold min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-sm transition-colors"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            <span>Retake Mock Test</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/candidate/mock-tests"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-surface hover:bg-surface-elevated border border-border text-foreground-secondary hover:text-foreground text-xs font-semibold min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
          >
            <span>Mock Tests Home</span>
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
