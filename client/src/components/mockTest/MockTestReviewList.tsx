import React, { useState } from 'react';
import { MockTestQuestionReview } from '../../types/mockTest';
import {
  CheckCircle2,
  XCircle,
  Bookmark,
  Check,
} from 'lucide-react';

interface MockTestReviewListProps {
  reviews: MockTestQuestionReview[];
}

export const MockTestReviewList: React.FC<MockTestReviewListProps> = ({ reviews }) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'incorrect' | 'unanswered' | 'marked'>('all');

  const filteredReviews = reviews.filter((r) => {
    if (activeFilter === 'incorrect') return r.status === 'incorrect';
    if (activeFilter === 'unanswered') return r.status === 'unanswered';
    if (activeFilter === 'marked') return r.markedForReview;
    return true;
  });

  return (
    <section aria-labelledby="mock-review-title" className="flex flex-col gap-6">
      {/* Header and Filter Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h2 id="mock-review-title" className="text-lg font-bold text-foreground">
            Question-by-Question Review
          </h2>
          <p className="text-xs text-foreground-secondary">
            Inspect explanations, correct options, and your marked flags.
          </p>
        </div>

        {/* Filter Pills */}
        <div
          role="radiogroup"
          aria-label="Filter reviewed questions"
          className="flex flex-wrap items-center gap-1.5"
        >
          <button
            type="button"
            role="radio"
            aria-checked={activeFilter === 'all'}
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[36px] transition-colors ${
              activeFilter === 'all'
                ? 'bg-primary text-primary-contrast font-bold'
                : 'bg-surface border border-border text-foreground hover:bg-surface-elevated'
            }`}
          >
            All ({reviews.length})
          </button>

          <button
            type="button"
            role="radio"
            aria-checked={activeFilter === 'incorrect'}
            onClick={() => setActiveFilter('incorrect')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[36px] transition-colors ${
              activeFilter === 'incorrect'
                ? 'bg-primary text-primary-contrast font-bold'
                : 'bg-surface border border-border text-foreground hover:bg-surface-elevated'
            }`}
          >
            Incorrect ({reviews.filter((r) => r.status === 'incorrect').length})
          </button>

          <button
            type="button"
            role="radio"
            aria-checked={activeFilter === 'unanswered'}
            onClick={() => setActiveFilter('unanswered')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[36px] transition-colors ${
              activeFilter === 'unanswered'
                ? 'bg-primary text-primary-contrast font-bold'
                : 'bg-surface border border-border text-foreground hover:bg-surface-elevated'
            }`}
          >
            Unanswered ({reviews.filter((r) => r.status === 'unanswered').length})
          </button>

          <button
            type="button"
            role="radio"
            aria-checked={activeFilter === 'marked'}
            onClick={() => setActiveFilter('marked')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[36px] transition-colors ${
              activeFilter === 'marked'
                ? 'bg-primary text-primary-contrast font-bold'
                : 'bg-surface border border-border text-foreground hover:bg-surface-elevated'
            }`}
          >
            Marked ({reviews.filter((r) => r.markedForReview).length})
          </button>
        </div>
      </div>

      {/* Questions Review List */}
      <div className="flex flex-col gap-5">
        {filteredReviews.length > 0 ? (
          filteredReviews.map((rev) => {
            const isCorrect = rev.status === 'correct';
            const isUnanswered = rev.status === 'unanswered';

            return (
              <article
                key={rev.questionId}
                aria-labelledby={`rev-q-num-${rev.questionId}`}
                className="p-5 sm:p-6 rounded-2xl border border-border bg-surface flex flex-col gap-4 shadow-sm"
              >
                {/* Item Meta Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2">
                    <span
                      id={`rev-q-num-${rev.questionId}`}
                      className="px-2.5 py-0.5 rounded text-xs font-bold bg-surface-elevated text-foreground border border-border"
                    >
                      Question {rev.questionNumber}
                    </span>
                    <span className="text-xs text-foreground-secondary font-medium">
                      {rev.sectionName}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {rev.markedForReview && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                        <Bookmark className="w-3 h-3 text-amber-600" aria-hidden="true" />
                        <span>Flagged Review</span>
                      </span>
                    )}

                    {isUnanswered ? (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-surface-elevated text-foreground-secondary border border-border">
                        Unanswered
                      </span>
                    ) : isCorrect ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold bg-success/10 text-success-contrast border border-success/30">
                        <CheckCircle2 className="w-3.5 h-3.5 text-success" aria-hidden="true" />
                        <span>Correct (+1)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                        <XCircle className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
                        <span>Incorrect (-0.33)</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Question Prompt */}
                <h3 className="text-sm sm:text-base font-bold text-foreground leading-relaxed">
                  {rev.questionText}
                </h3>

                {/* Optional Formula */}
                {rev.formula && (
                  <div className="p-3 rounded-lg border border-primary/20 bg-primary/5 flex flex-col gap-1 text-xs">
                    <span className="font-mono font-bold text-foreground">{rev.formula.visualText}</span>
                    <span className="text-foreground-secondary italic">
                      Spoken equivalent: &ldquo;{rev.formula.accessibleText}&rdquo;
                    </span>
                  </div>
                )}

                {/* Optional Table */}
                {rev.table && (
                  <div className="overflow-x-auto rounded-xl border border-border bg-surface">
                    <table className="w-full text-left text-xs border-collapse">
                      <caption className="py-1.5 px-3 font-bold text-foreground bg-surface-elevated/40 text-left">
                        {rev.table.caption}
                      </caption>
                      <thead>
                        <tr className="border-b border-border bg-surface-elevated/20 text-foreground-secondary">
                          {rev.table.headers.map((h, i) => (
                            <th key={i} className="py-2 px-3">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {rev.table.rows.map((row, rIdx) => (
                          <tr key={rIdx}>
                            {row.map((cell, cIdx) => (
                              <td key={cIdx} className="py-2 px-3 text-foreground font-medium">{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Options Choices Breakdown */}
                <div className="flex flex-col gap-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-foreground-secondary">
                    Answer Options:
                  </p>
                  <div className="flex flex-col gap-2">
                    {rev.options.map((opt) => {
                      const isUserChoice = rev.userOptionIds.includes(opt.id);
                      const isCorrectAnswer = rev.correctOptionIds.includes(opt.id);

                      let itemStyle = 'border-border bg-surface';
                      let badge = null;

                      if (isCorrectAnswer) {
                        itemStyle = 'border-success/60 bg-success/5 font-semibold';
                        badge = (
                          <span className="text-[11px] font-bold text-success inline-flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Correct Answer</span>
                          </span>
                        );
                      } else if (isUserChoice && !isCorrectAnswer) {
                        itemStyle = 'border-amber-500/50 bg-amber-500/5 line-through decoration-amber-500/50';
                        badge = (
                          <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 inline-flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Your Selection</span>
                          </span>
                        );
                      }

                      return (
                        <div
                          key={opt.id}
                          className={`p-3 rounded-xl border ${itemStyle} flex items-center justify-between gap-3 text-xs`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono font-bold text-primary">{opt.label}.</span>
                            <span className="text-foreground">{opt.text}</span>
                          </div>
                          {badge}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Explanation */}
                <div className="p-4 rounded-xl bg-surface-elevated/40 border border-border flex flex-col gap-1 text-xs">
                  <span className="font-bold text-foreground">Explanation:</span>
                  <p className="text-foreground-secondary leading-relaxed">{rev.explanation}</p>
                </div>
              </article>
            );
          })
        ) : (
          <div className="p-8 rounded-xl border border-dashed border-border text-center flex flex-col items-center gap-2">
            <p className="text-xs text-foreground-secondary">
              No questions found matching the selected filter ({activeFilter}).
            </p>
          </div>
        )}
      </div>
    </section>
  );
};
