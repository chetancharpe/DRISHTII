import React, { useEffect, useRef } from 'react';
import { AlertCircle, ArrowRight } from 'lucide-react';

interface PracticeFinishModalProps {
  isOpen: boolean;
  unansweredCount: number;
  totalQuestions: number;
  onCancel: () => void;
  onConfirmFinish: () => void;
}

export const PracticeFinishModal: React.FC<PracticeFinishModalProps> = ({
  isOpen,
  unansweredCount,
  totalQuestions,
  onCancel,
  onConfirmFinish,
}) => {
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      cancelBtnRef.current?.focus();
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="finish-modal-title"
      aria-describedby="finish-modal-description"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
    >
      <div className="w-full max-w-md p-6 rounded-2xl border border-border bg-surface shadow-2xl flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-full bg-primary/10 text-primary flex-shrink-0" aria-hidden="true">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 id="finish-modal-title" className="text-base font-bold text-foreground">
              Finish Practice Session?
            </h2>
            <p className="text-xs text-foreground-secondary">
              Review your completion status before viewing your results.
            </p>
          </div>
        </div>

        <div
          id="finish-modal-description"
          className="p-4 rounded-xl border border-border bg-surface-elevated/40 flex flex-col gap-2"
        >
          {unansweredCount > 0 ? (
            <p className="text-xs text-foreground leading-relaxed">
              You have <strong className="text-amber-600 dark:text-amber-400 font-bold">{unansweredCount}</strong> unanswered or skipped question{unansweredCount > 1 ? 's' : ''} out of {totalQuestions}. You can continue practicing or proceed to see your summary score.
            </p>
          ) : (
            <p className="text-xs text-foreground leading-relaxed">
              All <strong className="text-success font-bold">{totalQuestions}</strong> questions have been attempted! Ready to generate your performance breakdown?
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 rounded-lg border border-border bg-surface hover:bg-surface-elevated text-foreground text-xs font-semibold min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
          >
            <span>Continue Practice</span>
          </button>

          <button
            type="button"
            onClick={onConfirmFinish}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg bg-primary hover:bg-primary-hover active:bg-primary-hover text-primary-contrast text-xs font-bold min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-sm transition-colors"
          >
            <span>Finish & View Results</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};
