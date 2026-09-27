import React, { useEffect, useRef } from 'react';
import { ExamQuestion, ExamAnswer } from '../../types/exam';
import { X, Check, Bookmark, CheckCheck, Circle } from 'lucide-react';

interface ExamQuestionNavigatorProps {
  isOpen: boolean;
  onClose: () => void;
  questions: ExamQuestion[];
  answers: Record<string, ExamAnswer>;
  currentQuestionId: string;
  onSelectQuestion: (questionId: string) => void;
}

export const ExamQuestionNavigator: React.FC<ExamQuestionNavigatorProps> = ({
  isOpen,
  onClose,
  questions,
  answers,
  currentQuestionId,
  onSelectQuestion,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Focus trap & Escape key listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    closeButtonRef.current?.focus();
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Compute status counts
  let answered = 0;
  let marked = 0;
  let answeredMarked = 0;
  let unanswered = 0;

  questions.forEach((q) => {
    const ans = answers[q.id];
    const hasAnswer = ans && ans.selectedOptions.length > 0;
    const isMarked = ans?.isMarkedForReview || false;

    if (hasAnswer && isMarked) answeredMarked++;
    else if (hasAnswer) answered++;
    else if (isMarked) marked++;
    else unanswered++;
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="exam-navigator-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs"
    >
      <div
        ref={modalRef}
        className="w-full max-w-xl max-h-[85vh] bg-surface rounded-2xl border border-border shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border bg-surface-elevated/40">
          <div>
            <h2 id="exam-navigator-title" className="text-base font-extrabold text-foreground">
              Question Navigator
            </h2>
            <p className="text-xs text-foreground-secondary mt-0.5">
              Jump directly to any examination item
            </p>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-foreground-secondary hover:text-foreground hover:bg-surface-elevated border border-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[40px] min-w-[40px] flex items-center justify-center"
            aria-label="Close question navigator"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Legend / Tally Bar */}
        <div className="p-4 border-b border-border bg-surface flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-success/20 text-success border border-success/40 flex items-center justify-center text-[10px]">
              <Check className="w-2.5 h-2.5" />
            </span>
            <span className="font-semibold text-foreground">Answered ({answered})</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-accent/20 text-accent border border-accent/40 flex items-center justify-center text-[10px]">
              <Bookmark className="w-2.5 h-2.5" />
            </span>
            <span className="font-semibold text-foreground">Review ({marked})</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-accent/30 text-accent border border-accent/50 flex items-center justify-center text-[10px]">
              <CheckCheck className="w-2.5 h-2.5" />
            </span>
            <span className="font-semibold text-foreground">Answered + Review ({answeredMarked})</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-surface-elevated text-foreground-secondary border border-border flex items-center justify-center text-[10px]">
              <Circle className="w-2 h-2" />
            </span>
            <span className="font-semibold text-foreground">Unanswered ({unanswered})</span>
          </div>
        </div>

        {/* Question Grid */}
        <div className="p-4 sm:p-5 overflow-y-auto max-h-[50vh]">
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
            {questions.map((q) => {
              const ans = answers[q.id];
              const hasAnswer = ans && ans.selectedOptions.length > 0;
              const isMarked = ans?.isMarkedForReview || false;
              const isCurrent = q.id === currentQuestionId;

              let statusText = 'Unanswered';
              let badgeColor = 'bg-surface hover:bg-surface-elevated border-border text-foreground';
              let icon = <Circle className="w-3 h-3 text-foreground-secondary" />;

              if (hasAnswer && isMarked) {
                statusText = 'Answered and marked for review';
                badgeColor = 'bg-accent/20 border-accent/50 text-accent font-bold';
                icon = <CheckCheck className="w-3.5 h-3.5 text-accent" />;
              } else if (hasAnswer) {
                statusText = 'Answered';
                badgeColor = 'bg-success/20 border-success/40 text-success font-bold';
                icon = <Check className="w-3.5 h-3.5 text-success" />;
              } else if (isMarked) {
                statusText = 'Marked for review';
                badgeColor = 'bg-accent/15 border-accent/40 text-accent font-bold';
                icon = <Bookmark className="w-3.5 h-3.5 text-accent" />;
              }

              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => {
                    onSelectQuestion(q.id);
                    onClose();
                  }}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs min-h-[52px] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${badgeColor} ${
                    isCurrent ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface' : ''
                  }`}
                  aria-label={`Question ${q.number}: ${statusText}${isCurrent ? ' (Current question)' : ''}`}
                >
                  <span className="font-mono font-bold text-xs">{q.number}</span>
                  <div className="mt-0.5" aria-hidden="true">
                    {icon}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-border bg-surface-elevated/40 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-surface hover:bg-surface-elevated border border-border text-foreground text-xs font-bold min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
          >
            Close Navigator
          </button>
        </div>
      </div>
    </div>
  );
};
