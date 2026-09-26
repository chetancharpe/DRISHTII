import React, { useState, useEffect } from 'react';
import {
  PracticeQuestion,
  PracticeAnswerRecord,
} from '../../types/practice';
import {
  Volume2,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  SkipForward,
  Check,
  Sparkles,
} from 'lucide-react';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import { Link } from 'react-router-dom';

interface PracticeQuestionCardProps {
  question: PracticeQuestion;
  currentIndex: number;
  totalQuestions: number;
  savedAnswer?: PracticeAnswerRecord;
  onSubmitAnswer: (questionId: string, selectedOptionIds: string[]) => void;
  onSkipQuestion: (questionId: string) => void;
  onGoPrevious: () => void;
  onGoNext: () => void;
  onFinishSession: () => void;
  isLastQuestion: boolean;
}

export const PracticeQuestionCard: React.FC<PracticeQuestionCardProps> = ({
  question,
  currentIndex,
  totalQuestions,
  savedAnswer,
  onSubmitAnswer,
  onSkipQuestion,
  onGoPrevious,
  onGoNext,
  onFinishSession,
  isLastQuestion,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { speak, preferences, announce } = useAccessibility();

  // Synchronize state when question changes or when viewing an already answered question
  useEffect(() => {
    if (savedAnswer) {
      setSelectedIds(savedAnswer.selectedOptionIds || []);
    } else {
      setSelectedIds([]);
    }
  }, [question.id, savedAnswer]);

  const isSubmitted = savedAnswer?.isSubmitted || false;
  const isCorrect = savedAnswer?.isCorrect || false;
  const isSkipped = savedAnswer?.isSkipped || false;

  const handleOptionChange = (optionId: string) => {
    if (isSubmitted) return; // Prevent changing after submission

    if (question.type === 'multiple_choice') {
      setSelectedIds((prev) =>
        prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId]
      );
    } else {
      // Single choice or True/False
      setSelectedIds([optionId]);
    }
  };

  const handleCheckAnswer = () => {
    if (selectedIds.length === 0) return;
    onSubmitAnswer(question.id, selectedIds);

    // Check correctness for immediate speech announcement
    const correct =
      selectedIds.length === question.correctOptionIds.length &&
      selectedIds.every((id) => question.correctOptionIds.includes(id));

    if (correct) {
      announce('Correct. Your answer is correct.', 'assertive');
    } else {
      const correctLabels = question.options
        .filter((o) => question.correctOptionIds.includes(o.id))
        .map((o) => `Option ${o.label}: ${o.text}`)
        .join(', ');
      announce(`Not quite. The correct answer is ${correctLabels}.`, 'assertive');
    }
  };

  const handleReadQuestion = () => {
    speak(`Question ${currentIndex} of ${totalQuestions}. ${question.questionText}`);
  };

  const handleReadOptions = () => {
    const optionsText = question.options
      .map((opt) => `Option ${opt.label}: ${opt.text}`)
      .join('. ');
    speak(`Options for Question ${currentIndex}: ${optionsText}`);
  };

  return (
    <article
      aria-labelledby={`practice-question-${question.id}`}
      className="p-5 sm:p-7 rounded-2xl border border-border bg-surface shadow-sm flex flex-col gap-6"
    >
      {/* Question Header & Meta */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2.5 py-1 rounded-md bg-surface-elevated border border-border text-xs font-bold text-foreground">
            Question {currentIndex} of {totalQuestions}
          </span>

          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
            {question.topicName}
          </span>

          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-surface-elevated text-foreground-secondary border border-border capitalize">
            {question.difficulty}
          </span>

          {isSubmitted && (
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold ${
                isCorrect
                  ? 'bg-success/10 text-success-contrast border border-success/30'
                  : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30'
              }`}
            >
              {isCorrect ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-success" aria-hidden="true" />
                  <span>Correct</span>
                </>
              ) : (
                <>
                  <XCircle className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
                  <span>Needs Review</span>
                </>
              )}
            </span>
          )}

          {isSkipped && (
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-surface-elevated text-foreground-muted border border-border">
              Skipped for now
            </span>
          )}
        </div>

        {/* Audio assistance controls */}
        {preferences.audioEnabled && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReadQuestion}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface hover:bg-surface-elevated border border-border text-foreground text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[32px] transition-colors"
              aria-label={`Listen to Question ${currentIndex}`}
            >
              <Volume2 className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
              <span>Read Question</span>
            </button>

            <button
              type="button"
              onClick={handleReadOptions}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface hover:bg-surface-elevated border border-border text-foreground text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[32px] transition-colors"
              aria-label={`Listen to options for Question ${currentIndex}`}
            >
              <Volume2 className="w-3.5 h-3.5 text-foreground-secondary" aria-hidden="true" />
              <span>Read Options</span>
            </button>
          </div>
        )}
      </div>

      {/* Question Prompt */}
      <div>
        <h2
          id={`practice-question-${question.id}`}
          className="text-base sm:text-lg font-bold text-foreground leading-relaxed"
        >
          {question.questionText}
        </h2>

        {question.type === 'multiple_choice' && (
          <p className="text-xs text-foreground-secondary mt-1 italic">
            (Select all options that apply)
          </p>
        )}
      </div>

      {/* Answer Options */}
      <fieldset className="flex flex-col gap-3">
        <legend className="sr-only">
          Answer options for Question {currentIndex}
        </legend>

        <div className="flex flex-col gap-2.5" role={question.type === 'multiple_choice' ? 'group' : 'radiogroup'}>
          {question.options.map((opt) => {
            const isSelected = selectedIds.includes(opt.id);
            const isCorrectOption = question.correctOptionIds.includes(opt.id);

            // Calculate semantic and visual styles after submission
            let borderClass = 'border-border';
            let bgClass = 'bg-surface hover:bg-surface-elevated';
            let statusBadge = null;

            if (isSubmitted) {
              if (isCorrectOption) {
                borderClass = 'border-success/60 ring-1 ring-success/40';
                bgClass = 'bg-success/5';
                statusBadge = (
                  <span className="text-[11px] font-bold text-success inline-flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Correct Answer</span>
                  </span>
                );
              } else if (isSelected && !isCorrectOption) {
                borderClass = 'border-amber-500/50 ring-1 ring-amber-500/30';
                bgClass = 'bg-amber-500/5';
                statusBadge = (
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 inline-flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Your Selection</span>
                  </span>
                );
              }
            } else if (isSelected) {
              borderClass = 'border-primary ring-1 ring-primary';
              bgClass = 'bg-primary/5';
            }

            return (
              <label
                key={opt.id}
                className={`p-4 rounded-xl border ${borderClass} ${bgClass} cursor-pointer transition-all flex items-start justify-between gap-3 focus-within:ring-2 focus-within:ring-primary`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="pt-0.5">
                    {question.type === 'multiple_choice' ? (
                      <input
                        type="checkbox"
                        name={`practice-q-${question.id}`}
                        value={opt.id}
                        checked={isSelected}
                        disabled={isSubmitted}
                        onChange={() => handleOptionChange(opt.id)}
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary focus:ring-offset-0 disabled:opacity-50"
                      />
                    ) : (
                      <input
                        type="radio"
                        name={`practice-q-${question.id}`}
                        value={opt.id}
                        checked={isSelected}
                        disabled={isSubmitted}
                        onChange={() => handleOptionChange(opt.id)}
                        className="w-4 h-4 border-border text-primary focus:ring-primary focus:ring-offset-0 disabled:opacity-50"
                      />
                    )}
                  </div>

                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-foreground">
                      <span className="font-mono text-primary mr-1.5">{opt.label}.</span>
                      {opt.text}
                    </span>
                  </div>
                </div>

                {statusBadge && <div>{statusBadge}</div>}
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* Immediate Check Answer CTA */}
      {!isSubmitted && (
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleCheckAnswer}
            disabled={selectedIds.length === 0}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-primary hover:bg-primary-hover active:bg-primary-hover disabled:opacity-50 text-primary-contrast font-bold text-xs min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
          >
            <span>Check Answer</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => onSkipQuestion(question.id)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-surface hover:bg-surface-elevated border border-border text-foreground-secondary hover:text-foreground text-xs font-semibold min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
          >
            <SkipForward className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Skip for now</span>
          </button>
        </div>
      )}

      {/* Live Region for Screen Reader Feedback */}
      <div className="sr-only" aria-live="polite">
        {isSubmitted &&
          (isCorrect
            ? 'Correct. Your answer is correct.'
            : `Not quite. Let's review the concept. Correct answer is ${question.correctOptionIds.join(', ')}.`)}
      </div>

      {/* Explanatory Feedback Card */}
      {isSubmitted && (
        <section
          aria-labelledby={`feedback-heading-${question.id}`}
          className={`p-5 rounded-xl border flex flex-col gap-3 ${
            isCorrect
              ? 'bg-success/5 border-success/30'
              : 'bg-amber-500/5 border-amber-500/30'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <h3
              id={`feedback-heading-${question.id}`}
              className={`text-sm font-bold flex items-center gap-2 ${
                isCorrect ? 'text-success-contrast' : 'text-amber-800 dark:text-amber-400'
              }`}
            >
              {isCorrect ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-success" aria-hidden="true" />
                  <span>Correct. Your answer is correct.</span>
                </>
              ) : (
                <>
                  <HelpCircle className="w-4 h-4 text-amber-600" aria-hidden="true" />
                  <span>Not quite. Let&rsquo;s review the concept.</span>
                </>
              )}
            </h3>

            <span className="text-[11px] font-bold uppercase tracking-wider text-foreground-secondary">
              Explanatory Feedback
            </span>
          </div>

          <div className="text-xs text-foreground leading-relaxed pl-6 border-l-2 border-border">
            <p className="font-semibold text-foreground mb-1">Explanation:</p>
            <p>{question.explanation}</p>
          </div>

          {!isCorrect && (
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-border">
              <span className="text-xs text-foreground-secondary">
                Need more practice on this topic?
              </span>
              <Link
                to={`/candidate/learn/${question.subjectId}/${question.topicId}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline p-1 min-h-[36px] rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Review {question.topicName} Notes</span>
              </Link>
            </div>
          )}
        </section>
      )}

      {/* Question Navigation Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 mt-2">
        <button
          type="button"
          onClick={onGoPrevious}
          disabled={currentIndex <= 1}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-surface hover:bg-surface-elevated disabled:opacity-40 border border-border text-foreground text-xs font-semibold min-h-[40px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
          aria-label="Previous question"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Previous</span>
        </button>

        <div className="flex items-center gap-2">
          {isLastQuestion ? (
            <button
              type="button"
              onClick={onFinishSession}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-success hover:bg-success-hover active:bg-success-hover text-success-contrast text-xs font-bold min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-success shadow-sm transition-colors"
            >
              <span>Finish Practice</span>
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onGoNext}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-primary hover:bg-primary-hover active:bg-primary-hover text-primary-contrast text-xs font-bold min-h-[40px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
              aria-label="Next question"
            >
              <span>Next</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
};
