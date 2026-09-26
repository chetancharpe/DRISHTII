import React from 'react';
import { PracticeQuestionReview } from '../../types/practice';
import { CheckCircle2, XCircle, SkipForward, Check } from 'lucide-react';

interface PracticeQuestionReviewListProps {
  reviews: PracticeQuestionReview[];
}

export const PracticeQuestionReviewList: React.FC<PracticeQuestionReviewListProps> = ({
  reviews,
}) => {
  return (
    <section aria-labelledby="review-answers-heading" className="flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <h2 id="review-answers-heading" className="text-base font-bold text-foreground">
            Detailed Question Review
          </h2>
          <p className="text-xs text-foreground-secondary">
            Inspect your selected responses alongside correct options and step-by-step rationales.
          </p>
        </div>
        <span className="text-xs font-semibold text-foreground px-2.5 py-1 rounded bg-surface border border-border">
          {reviews.length} Questions Reviewed
        </span>
      </div>

      <div className="flex flex-col gap-5">
        {reviews.map((rev) => {
          const isCorrect = rev.isCorrect;
          const isSkipped = rev.isSkipped;

          return (
            <article
              key={rev.questionId}
              aria-labelledby={`review-q-heading-${rev.questionId}`}
              className="p-5 sm:p-6 rounded-2xl border border-border bg-surface flex flex-col gap-4"
            >
              {/* Review Item Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
                <span className="text-xs font-bold text-foreground">
                  Question #{rev.questionIndex}
                </span>

                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-surface-elevated text-foreground-secondary border border-border capitalize">
                    {rev.difficulty}
                  </span>

                  {isSkipped ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold bg-surface-elevated text-foreground-muted border border-border">
                      <SkipForward className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Skipped</span>
                    </span>
                  ) : isCorrect ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold bg-success/10 text-success-contrast border border-success/30">
                      <CheckCircle2 className="w-3.5 h-3.5 text-success" aria-hidden="true" />
                      <span>Correct</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                      <XCircle className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
                      <span>Needs Review</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Question Text */}
              <h3
                id={`review-q-heading-${rev.questionId}`}
                className="text-sm sm:text-base font-bold text-foreground leading-relaxed"
              >
                {rev.questionText}
              </h3>

              {/* Options breakdown */}
              <div className="flex flex-col gap-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-foreground-secondary">
                  Options:
                </p>
                <div className="flex flex-col gap-2">
                  {rev.options.map((opt) => {
                    const isUserChoice = rev.userSelectedOptionIds.includes(opt.id);
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

              {/* Step by step explanation */}
              <div className="p-4 rounded-xl bg-surface-elevated/40 border border-border flex flex-col gap-1 text-xs">
                <span className="font-bold text-foreground">Step-by-step Explanation:</span>
                <p className="text-foreground-secondary leading-relaxed">{rev.explanation}</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
