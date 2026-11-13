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
import { RichMathText } from '../common/RichMathText';

interface PracticeQuestionCardProps {
  question: PracticeQuestion;
  currentIndex: number;
  totalQuestions: number;
  savedAnswer?: PracticeAnswerRecord;
  correctOptionIds?: string[];
  explanation?: string;
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
  correctOptionIds: propCorrectOptionIds,
  explanation: propExplanation,
  onSubmitAnswer,
  onSkipQuestion,
  onGoPrevious,
  onGoNext,
  onFinishSession,
  isLastQuestion,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { speak, preferences, hasHindiVoice, announce } = useAccessibility();
  const isHindi =
    preferences?.language === 'hi' ||
    (typeof document !== 'undefined' && document.documentElement.lang === 'hi');

  const effectiveCorrectIds: string[] =
    propCorrectOptionIds && propCorrectOptionIds.length > 0
      ? propCorrectOptionIds
      : (question.correctOptionIds || []);

  const effectiveExplanation: string =
    propExplanation ||
    question.explanation ||
    (isHindi ? 'प्रश्न का उत्तर देने पर विस्तृत चरणबद्ध स्पष्टीकरण उपलब्ध कराया जाता है।' : 'Detailed step-by-step pedagogical explanation is available upon answering.');

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
  };

  const handleReadQuestion = () => {
    const textHi = `प्रश्न संख्या ${currentIndex}, कुल ${totalQuestions} में से। ${question.questionText}`;
    const textEn = `Question ${currentIndex} of ${totalQuestions}. ${question.questionText}`;
    const toSpeak = isHindi && hasHindiVoice ? textHi : textEn;
    speak(toSpeak);
    announce(isHindi ? textHi : textEn, 'assertive');
  };

  const handleReadOptions = () => {
    const optsHi = question.options
      .map((opt) => `ऑप्शन ${opt.label}: ${opt.text}`)
      .join('। ');
    const optsEn = question.options
      .map((opt) => `Option ${opt.label}: ${opt.text}`)
      .join('. ');
    const textHi = `प्रश्न संख्या ${currentIndex} के विकल्प: ${optsHi}`;
    const textEn = `Options for Question ${currentIndex}: ${optsEn}`;
    const toSpeak = isHindi && hasHindiVoice ? textHi : textEn;
    speak(toSpeak);
    announce(isHindi ? textHi : textEn, 'assertive');
  };

  return (
    <article
      aria-labelledby={`practice-question-${question.id}`}
      className="p-5 sm:p-7 rounded-2xl border-2 border-border bg-surface shadow-sm flex flex-col gap-6"
    >
      {/* Question Header & Meta */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-1 rounded-lg bg-surface-elevated border-2 border-border text-xs font-bold text-foreground">
            {isHindi
              ? `प्रश्न ${currentIndex} कुल ${totalQuestions} में से`
              : `Question ${currentIndex} of ${totalQuestions}`}
          </span>

          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-primary/10 text-primary border border-primary/20">
            {question.topicName}
          </span>

          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-surface-elevated text-foreground-secondary border border-border capitalize">
            {question.difficulty === 'easy'
              ? isHindi ? 'सरल' : 'Easy'
              : question.difficulty === 'hard'
              ? isHindi ? 'कठिन' : 'Hard'
              : isHindi ? 'मध्यम' : 'Medium'}
          </span>

          {isSubmitted && (
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-black ${
                isCorrect
                  ? 'bg-success/10 text-success-contrast border border-success/30'
                  : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30'
              }`}
            >
              {isCorrect ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-success" aria-hidden="true" />
                  <span>{isHindi ? 'सही उत्तर' : 'Correct'}</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-amber-600" aria-hidden="true" />
                  <span>{isHindi ? 'गलत उत्तर' : 'Needs Review'}</span>
                </>
              )}
            </span>
          )}

          {isSkipped && (
            <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-surface-elevated text-foreground-muted border border-border">
              {isHindi ? 'छोड़ा गया सवाल' : 'Skipped for now'}
            </span>
          )}
        </div>

        {/* Audio assistance controls */}
        {preferences.audioEnabled && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReadQuestion}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-elevated border-2 border-border text-foreground text-xs font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[38px] transition-colors"
              aria-label={isHindi ? `प्रश्न ${currentIndex} सुनें` : `Listen to Question ${currentIndex}`}
            >
              <Volume2 className="w-4 h-4 text-primary" aria-hidden="true" />
              <span>{isHindi ? 'प्रश्न सुनें' : 'Read Question'}</span>
            </button>

            <button
              type="button"
              onClick={handleReadOptions}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-elevated border-2 border-border text-foreground text-xs font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[38px] transition-colors"
              aria-label={isHindi ? `प्रश्न ${currentIndex} के विकल्प सुनें` : `Listen to options for Question ${currentIndex}`}
            >
              <Volume2 className="w-4 h-4 text-primary" aria-hidden="true" />
              <span>{isHindi ? 'विकल्प सुनें' : 'Read Options'}</span>
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
          <RichMathText text={question.questionText} />
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
            const isCorrectOption = effectiveCorrectIds.includes(opt.id);

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
                      <RichMathText text={opt.text} />
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
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover active:bg-primary-hover disabled:opacity-50 text-primary-contrast font-bold text-xs min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors shadow-sm"
          >
            <span>{isHindi ? 'उत्तर जांचें' : 'Check Answer'}</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => onSkipQuestion(question.id)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-surface hover:bg-surface-elevated border border-border text-foreground-secondary hover:text-foreground text-xs font-semibold min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
          >
            <SkipForward className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{isHindi ? 'अभी छोड़ें' : 'Skip for now'}</span>
          </button>
        </div>
      )}

      {/* Live Region for Screen Reader Feedback */}
      <div className="sr-only" aria-live="polite">
        {isSubmitted &&
          (isCorrect
            ? isHindi ? 'सही उत्तर। आपका विकल्प सही है।' : 'Correct. Your answer is correct.'
            : isHindi ? `गलत उत्तर। सही उत्तर विकल्प ${effectiveCorrectIds.join(', ')} है।` : `Not quite. Correct answer is Option ${effectiveCorrectIds.join(', ')}.`)}
      </div>

      {/* Explanatory Feedback Card */}
      {isSubmitted && (
        <section
          aria-labelledby={`feedback-heading-${question.id}`}
          className={`p-5 rounded-2xl border-2 flex flex-col gap-3 ${
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
                  <span>{isHindi ? 'बिल्कुल सही! आपका उत्तर सही है।' : 'Correct. Your answer is correct.'}</span>
                </>
              ) : (
                <>
                  <HelpCircle className="w-4 h-4 text-amber-600" aria-hidden="true" />
                  <span>{isHindi ? 'गलत उत्तर। आइए चरणबद्ध स्पष्टीकरण देखें।' : 'Not quite. Let’s review the concept.'}</span>
                </>
              )}
            </h3>

            <span className="text-[11px] font-bold uppercase tracking-wider text-foreground-secondary">
              {isHindi ? 'चरणबद्ध स्पष्टीकरण' : 'Explanatory Feedback'}
            </span>
          </div>

          <div className="text-xs text-foreground leading-relaxed pl-6 border-l-2 border-border">
            <p className="font-semibold text-foreground mb-1">{isHindi ? 'स्पष्टीकरण:' : 'Explanation:'}</p>
            <RichMathText text={effectiveExplanation} />
          </div>

          {!isCorrect && (
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-border">
              <span className="text-xs text-foreground-secondary">
                {isHindi ? 'क्या आप इस विषय को और पढ़ना चाहते हैं?' : 'Need more practice on this topic?'}
              </span>
              <Link
                to={`/candidate/learn/${question.subjectId}/${question.topicId}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline p-1 min-h-[36px] rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{isHindi ? `${question.topicName} के नोट्स पढ़ें` : `Review ${question.topicName} Notes`}</span>
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
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface hover:bg-surface-elevated disabled:opacity-40 border border-border text-foreground text-xs font-semibold min-h-[40px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
          aria-label={isHindi ? 'पिछला सवाल' : 'Previous question'}
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{isHindi ? 'पिछला सवाल' : 'Previous'}</span>
        </button>

        <div className="flex items-center gap-2">
          {isLastQuestion ? (
            <button
              type="button"
              onClick={onFinishSession}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-success hover:bg-success-hover active:bg-success-hover text-success-contrast text-xs font-bold min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-success shadow-sm transition-colors"
            >
              <span>{isHindi ? 'अभ्यास पूरा करें' : 'Finish Practice'}</span>
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onGoNext}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover active:bg-primary-hover text-primary-contrast text-xs font-bold min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors shadow-sm"
              aria-label={isHindi ? 'अगला सवाल' : 'Next question'}
            >
              <span>{isHindi ? 'अगला सवाल' : 'Next'}</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
};
