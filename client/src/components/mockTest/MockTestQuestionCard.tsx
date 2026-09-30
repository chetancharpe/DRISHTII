import React, { useEffect, useRef } from 'react';
import {
  MockTestQuestion,
  MockTestAnswer,
  QuestionAttemptStatus,
} from '../../types/mockTest';
import {
  Bookmark,
  BookmarkCheck,
  RotateCcw,
  Volume2,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Variable,
} from 'lucide-react';
import { useAccessibility } from '../../contexts/AccessibilityContext';

interface MockTestQuestionCardProps {
  question: MockTestQuestion;
  currentNumber: number;
  totalQuestions: number;
  answer?: MockTestAnswer;
  onSaveOption: (optionId: string, isMultiple?: boolean) => void;
  onClearOption: () => void;
  onToggleMarkReview: () => void;
  onNext: () => void;
  onPrevious: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export const MockTestQuestionCard: React.FC<MockTestQuestionCardProps> = ({
  question,
  currentNumber,
  totalQuestions,
  answer,
  onSaveOption,
  onClearOption,
  onToggleMarkReview,
  onNext,
  onPrevious,
  isFirst,
  isLast,
}) => {
  const { speak, preferences } = useAccessibility();
  const questionHeadingRef = useRef<HTMLHeadingElement>(null);

  // Focus management when question number changes (Requirement #51)
  useEffect(() => {
    questionHeadingRef.current?.focus();
  }, [question?.id]);

  const selectedOptionIds = answer?.selectedOptionIds || [];
  const isMarked = answer?.markedForReview || false;
  const status: QuestionAttemptStatus = answer?.status || 'unanswered';

  const handleReadQuestion = () => {
    if (!question) return;
    const tableText = question.table
      ? `Table: ${question.table.caption}. Headers: ${question.table.headers.join(', ')}.`
      : '';
    const formulaText = question.formula ? `Formula: ${question.formula.accessibleText}.` : '';
    speak(`Question ${currentNumber} of ${totalQuestions}. ${question.text} ${formulaText} ${tableText}`);
  };

  const handleReadOptions = () => {
    if (!question?.options) return;
    const text = question.options.map((o) => `Option ${o.label}: ${o.text}`).join('. ');
    speak(`Options for Question ${currentNumber}: ${text}`);
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'answered':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold bg-success/10 text-success-contrast border border-success/30">
            <CheckCircle2 className="w-3.5 h-3.5 text-success" aria-hidden="true" />
            <span>Answered</span>
          </span>
        );
      case 'answered_marked_for_review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/30">
            <BookmarkCheck className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Answered & Marked for Review</span>
          </span>
        );
      case 'marked_for_review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30">
            <Bookmark className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Marked for Review</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded text-xs font-medium bg-surface-elevated text-foreground-secondary border border-border">
            Not Answered
          </span>
        );
    }
  };

  return (
    <article
      aria-labelledby={`question-title-${question.id}`}
      className="p-5 sm:p-7 rounded-2xl border border-border bg-surface shadow-sm flex flex-col gap-6"
    >
      {/* Question Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2.5 py-1 rounded bg-surface-elevated border border-border text-xs font-bold text-foreground">
            Question {currentNumber} of {totalQuestions}
          </span>
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-surface-elevated text-foreground-secondary border border-border capitalize">
            {question.difficulty}
          </span>
          {getStatusBadge()}
        </div>

        {/* Audio assistance triggers */}
        {preferences.audioEnabled && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReadQuestion}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface hover:bg-surface-elevated border border-border text-foreground text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[32px] transition-colors"
              aria-label={`Listen to Question ${currentNumber}`}
            >
              <Volume2 className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
              <span>Read Question</span>
            </button>

            <button
              type="button"
              onClick={handleReadOptions}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface hover:bg-surface-elevated border border-border text-foreground text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[32px] transition-colors"
              aria-label={`Listen to options for Question ${currentNumber}`}
            >
              <Volume2 className="w-3.5 h-3.5 text-foreground-secondary" aria-hidden="true" />
              <span>Read Options</span>
            </button>
          </div>
        )}
      </div>

      {/* Question Text */}
      <div>
        <h2
          id={`question-title-${question.id}`}
          ref={questionHeadingRef}
          tabIndex={-1}
          className="text-base sm:text-lg font-bold text-foreground leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-primary rounded p-1"
        >
          {question.text}
        </h2>

        {question.type === 'multiple_choice' && (
          <p className="text-xs text-foreground-secondary mt-1 italic">
            (Select all appropriate options)
          </p>
        )}
      </div>

      {/* Optional Formula Notation */}
      {question.formula && (
        <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
            <Variable className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Mathematical Formula</span>
          </div>
          <div className="font-mono text-sm font-bold text-foreground py-1 px-2.5 rounded bg-surface border border-border">
            {question.formula.visualText}
          </div>
          <span className="text-xs text-foreground-secondary italic">
            Spoken equivalent: &ldquo;{question.formula.accessibleText}&rdquo;
          </span>
        </div>
      )}

      {/* Optional Table */}
      {question.table && (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface my-1">
          <table className="w-full text-left text-xs border-collapse">
            <caption className="py-2 px-3 text-xs font-bold text-foreground bg-surface-elevated/50 text-left border-b border-border">
              {question.table.caption}
            </caption>
            <thead>
              <tr className="border-b border-border bg-surface-elevated/30 text-[11px] font-bold text-foreground-secondary uppercase tracking-wider">
                {question.table.headers.map((h, i) => (
                  <th key={i} scope="col" className="py-2.5 px-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {question.table.rows.map((r, rIdx) => (
                <tr key={rIdx} className="hover:bg-surface-elevated/20">
                  {r.map((cell, cIdx) => (
                    <td key={cIdx} className="py-2.5 px-3 text-foreground font-medium">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Options Fieldset */}
      <fieldset className="flex flex-col gap-3">
        <legend className="sr-only">Answer choices for Question {currentNumber}</legend>

        <div
          role={question.type === 'multiple_choice' ? 'group' : 'radiogroup'}
          className="flex flex-col gap-2.5"
        >
          {(question.options || []).map((opt) => {
            const isSelected = selectedOptionIds.includes(opt.id);

            return (
              <label
                key={opt.id}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3.5 focus-within:ring-2 focus-within:ring-primary ${
                  isSelected
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border bg-surface hover:bg-surface-elevated'
                }`}
              >
                <div className="pt-0.5">
                  {question.type === 'multiple_choice' ? (
                    <input
                      type="checkbox"
                      name={`mock-q-${question.id}`}
                      value={opt.id}
                      checked={isSelected}
                      onChange={() => onSaveOption(opt.id, true)}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary focus:ring-offset-0"
                    />
                  ) : (
                    <input
                      type="radio"
                      name={`mock-q-${question.id}`}
                      value={opt.id}
                      checked={isSelected}
                      onChange={() => onSaveOption(opt.id, false)}
                      className="w-4 h-4 border-border text-primary focus:ring-primary focus:ring-offset-0"
                    />
                  )}
                </div>

                <div className="flex flex-col">
                  <span className="text-xs font-bold text-foreground">
                    <span className="font-mono text-primary mr-1.5">{opt.label}.</span>
                    {opt.text}
                  </span>
                </div>
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* Review & Clear Secondary Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={onToggleMarkReview}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-xs font-semibold min-h-[40px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors ${
            isMarked
              ? 'bg-amber-500/15 border-amber-500 text-amber-800 dark:text-amber-300'
              : 'bg-surface hover:bg-surface-elevated border-border text-foreground-secondary hover:text-foreground'
          }`}
          aria-pressed={isMarked}
          aria-label={isMarked ? 'Remove mark for review' : 'Mark question for review'}
        >
          {isMarked ? (
            <>
              <BookmarkCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
              <span>Remove Review Mark</span>
            </>
          ) : (
            <>
              <Bookmark className="w-3.5 h-3.5 text-foreground-muted" aria-hidden="true" />
              <span>Mark for Review</span>
            </>
          )}
        </button>

        {selectedOptionIds.length > 0 && (
          <button
            type="button"
            onClick={onClearOption}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-foreground-secondary hover:text-foreground hover:bg-surface-elevated focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[40px] transition-colors"
            aria-label="Clear selected answer response"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Clear Selection</span>
          </button>
        )}
      </div>

      {/* Navigation Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 mt-2">
        <button
          type="button"
          onClick={onPrevious}
          disabled={isFirst}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-surface hover:bg-surface-elevated disabled:opacity-40 border border-border text-foreground text-xs font-semibold min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
          aria-label="Previous question"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Previous</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onNext}
            className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-lg bg-primary hover:bg-primary-hover active:bg-primary-hover text-primary-contrast text-xs font-bold min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-sm transition-colors"
            aria-label={isLast ? 'Save and inspect test' : 'Save and advance to next question'}
          >
            <span>{isLast ? 'Save & Review' : 'Save & Next'}</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
};
