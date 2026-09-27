import React, { useEffect, useRef } from 'react';
import { AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';

interface MockTestSubmitModalProps {
  isOpen: boolean;
  answeredCount: number;
  unansweredCount: number;
  markedForReviewCount: number;
  totalQuestions: number;
  onCancel: () => void;
  onConfirmSubmit: () => void;
  isSubmitting?: boolean;
}

export const MockTestSubmitModal: React.FC<MockTestSubmitModalProps> = ({
  isOpen,
  answeredCount,
  unansweredCount,
  markedForReviewCount,
  totalQuestions,
  onCancel,
  onConfirmSubmit,
  isSubmitting = false,
}) => {
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      cancelBtnRef.current?.focus();
    }
  }, [isOpen]);

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
      aria-labelledby="submit-modal-title"
      aria-describedby="submit-modal-desc"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
    >
      <div className="w-full max-w-md p-6 rounded-2xl border border-border bg-surface shadow-2xl flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-full bg-primary/10 text-primary flex-shrink-0" aria-hidden="true">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h2 id="submit-modal-title" className="text-base font-bold text-foreground">
              Submit Mock Examination?
            </h2>
            <p className="text-xs text-foreground-secondary">
              Review your question tally before finalizing your submission.
            </p>
          </div>
        </div>

        {/* Tally Breakdown Card */}
        <div
          id="submit-modal-desc"
          className="p-4 rounded-xl border border-border bg-surface-elevated/40 flex flex-col gap-2.5 text-xs"
        >
          <div className="flex items-center justify-between border-b border-border/50 pb-2">
            <span className="text-foreground-secondary">Total Examination Questions:</span>
            <span className="font-mono font-bold text-foreground">{totalQuestions}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-success font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Answered:</span>
            </span>
            <span className="font-mono font-bold text-foreground">{answeredCount}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-amber-700 dark:text-amber-400 font-semibold">
              Unanswered / Skipped:
            </span>
            <span className="font-mono font-bold text-foreground">{unansweredCount}</span>
          </div>

          {markedForReviewCount > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-purple-700 dark:text-purple-300 font-semibold">
                Marked for Review:
              </span>
              <span className="font-mono font-bold text-foreground">{markedForReviewCount}</span>
            </div>
          )}

          <p className="text-[11px] text-foreground-secondary italic pt-1 border-t border-border/50">
            Note: Unanswered questions carry zero penalty, but will not receive marks.
          </p>
        </div>

        {/* Modal CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-1">
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 rounded-lg border border-border bg-surface hover:bg-surface-elevated text-foreground text-xs font-semibold min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
          >
            <span>Continue Test</span>
          </button>

          <button
            type="button"
            onClick={onConfirmSubmit}
            disabled={isSubmitting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-lg bg-primary hover:bg-primary-hover active:bg-primary-hover disabled:opacity-50 text-primary-contrast text-xs font-bold min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-sm transition-colors"
          >
            <span>{isSubmitting ? 'Submitting...' : 'Submit Test'}</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};
