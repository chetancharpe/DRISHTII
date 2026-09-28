import React, { useRef, useEffect } from 'react';
import { ExamQuestion as ExamQuestionType, ExamAnswer, ExamNavigationPolicy } from '../../types/exam';
import { ExamAnswerControl } from './ExamAnswerControl';
import { RichMathText } from '../common/RichMathText';
import { KaTeXMath } from '../common/KaTeXMath';
import { AccessibleDataTable } from '../common/AccessibleDataTable';
import {
  Volume2,
  Bookmark,
  CheckSquare,
  ArrowLeft,
  ArrowRight,
  Send,
  Variable,
} from 'lucide-react';
import { useAccessibility } from '../../contexts/AccessibilityContext';

interface ExamQuestionProps {
  question: ExamQuestionType;
  currentNumber: number;
  totalQuestions: number;
  answer?: ExamAnswer;
  navigationPolicy: ExamNavigationPolicy;
  isFirstQuestion: boolean;
  isLastQuestion: boolean;
  onAnswerChange: (selectedOptions: string[]) => void;
  onClearAnswer: () => void;
  onToggleReview: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

export const ExamQuestion: React.FC<ExamQuestionProps> = ({
  question,
  currentNumber,
  totalQuestions,
  answer,
  navigationPolicy,
  isFirstQuestion,
  isLastQuestion,
  onAnswerChange,
  onClearAnswer,
  onToggleReview,
  onPrevious,
  onNext,
  onSubmit,
}) => {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const { speak, preferences } = useAccessibility();

  const isMarked = answer?.isMarkedForReview || false;
  const selectedOptions = answer?.selectedOptions || [];

  // Focus management: when question changes, move focus to question heading
  useEffect(() => {
    headingRef.current?.focus();
  }, [question.id]);

  // Audio assistance: speak question stem
  const handleListenQuestion = () => {
    let textToSpeak = `Question ${currentNumber} of ${totalQuestions}. Section: ${question.sectionTitle}. ${question.prompt}`;
    if (question.formulaAriaLabel) {
      textToSpeak += ` Formula: ${question.formulaAriaLabel}.`;
    }
    if (question.table) {
      textToSpeak += ` Includes data table: ${question.table.caption || 'Table data'}.`;
    }
    speak(textToSpeak);
  };

  // Audio assistance: speak all options
  const handleListenOptions = () => {
    const optionsText = question.options
      .map((opt) => `Option ${opt.label}: ${opt.text}`)
      .join('. ');
    speak(`Available answer choices: ${optionsText}`);
  };

  return (
    <article
      aria-labelledby={`q-heading-${question.id}`}
      className="flex flex-col gap-6 max-w-4xl mx-auto w-full pb-10"
    >
      <fieldset className="p-0 m-0 border-0 flex flex-col gap-5">
        <legend className="sr-only">
          Question {currentNumber} of {totalQuestions}. {question.sectionTitle}.
        </legend>

        {/* Question Header & Meta Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2
              ref={headingRef}
              id={`q-heading-${question.id}`}
              tabIndex={-1}
              className="text-base sm:text-lg font-extrabold text-foreground tracking-tight focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded px-1"
            >
              Question {currentNumber} of {totalQuestions}
            </h2>

            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-surface-elevated border border-border text-foreground-secondary">
              {question.sectionTitle}
            </span>

            <span className="text-xs font-mono font-medium text-foreground-secondary">
              +{question.marks} / -{question.negativeMarks} marks
            </span>
          </div>

          {/* Audio Assistance Buttons */}
          {preferences.audioEnabled && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleListenQuestion}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface hover:bg-surface-elevated border border-border text-foreground text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[36px] transition-colors"
                aria-label="Listen to current question text"
              >
                <Volume2 className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                <span>Read Question</span>
              </button>

              <button
                type="button"
                onClick={handleListenOptions}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface hover:bg-surface-elevated border border-border text-foreground text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[36px] transition-colors"
                aria-label="Listen to answer options"
              >
                <Volume2 className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                <span>Read Options</span>
              </button>
            </div>
          )}
        </div>

        {/* Question Text */}
        <div className="text-base sm:text-lg font-medium text-foreground leading-relaxed">
          <RichMathText text={question.prompt} />
        </div>

        {/* Optional Formula */}
        {question.formula && (
          <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 text-foreground flex flex-col gap-2 overflow-x-auto">
            <div className="flex items-center gap-2 text-xs font-bold text-primary">
              <Variable className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
              <span>Mathematical Formula</span>
            </div>
            <KaTeXMath math={question.formula} displayMode phoneticLabel={question.formulaAriaLabel} />
          </div>
        )}

        {/* Optional Table */}
        {question.table && (
          <AccessibleDataTable
            caption={question.table.caption || 'Reference Table'}
            headers={question.table.headers}
            rows={question.table.rows}
          />
        )}

        {/* Answer Options */}
        <div className="mt-2">
          <ExamAnswerControl
            questionId={question.id}
            type={question.type}
            options={question.options}
            selectedOptions={selectedOptions}
            onChange={onAnswerChange}
            onClear={onClearAnswer}
          />
        </div>
      </fieldset>

      {/* Question Actions & Navigation Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-border mt-4">
        {/* Left: Mark for Review toggle */}
        {navigationPolicy.reviewAllowed && (
          <button
            type="button"
            onClick={onToggleReview}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border font-bold text-xs min-h-[44px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              isMarked
                ? 'bg-accent/15 border-accent text-accent'
                : 'bg-surface hover:bg-surface-elevated border-border text-foreground'
            }`}
            aria-pressed={isMarked}
            aria-label={isMarked ? 'Remove review mark for this question' : 'Mark this question for later review'}
          >
            {isMarked ? (
              <>
                <CheckSquare className="w-4 h-4 text-accent" aria-hidden="true" />
                <span>Marked for Review</span>
              </>
            ) : (
              <>
                <Bookmark className="w-4 h-4 text-foreground-secondary" aria-hidden="true" />
                <span>Mark for Review</span>
              </>
            )}
          </button>
        )}

        {/* Right: Previous & Next / Submit Navigation */}
        <div className="flex items-center gap-2.5 ml-auto">
          {navigationPolicy.backNavigationAllowed && (
            <button
              type="button"
              onClick={onPrevious}
              disabled={isFirstQuestion}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-surface hover:bg-surface-elevated border border-border text-foreground font-bold text-xs min-h-[44px] disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
              aria-label="Navigate to previous question"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              <span>Previous</span>
            </button>
          )}

          {!isLastQuestion ? (
            <button
              type="button"
              onClick={onNext}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover active:bg-primary-hover text-primary-contrast font-bold text-xs min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-xs transition-colors"
              aria-label="Save current answer and navigate to next question"
            >
              <span>Save & Next</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onSubmit}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-danger hover:bg-danger/90 active:bg-danger text-white font-bold text-xs min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-danger shadow-xs transition-colors"
              aria-label="Review and submit examination"
            >
              <span>Review & Submit</span>
              <Send className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
};
