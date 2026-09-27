import React, { useEffect, useRef } from 'react';
import { Send, AlertTriangle, RefreshCw, X, ShieldAlert } from 'lucide-react';

interface ExamSubmissionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmSubmit: () => void;
  onRetrySync: () => void;
  totalQuestions: number;
  answeredCount: number;
  unansweredCount: number;
  markedCount: number;
  unsyncedCount: number;
  isSubmitting: boolean;
  isSyncing: boolean;
}

export const ExamSubmissionDialog: React.FC<ExamSubmissionDialogProps> = ({
  isOpen,
  onClose,
  onConfirmSubmit,
  onRetrySync,
  totalQuestions,
  answeredCount,
  unansweredCount,
  markedCount,
  unsyncedCount,
  isSubmitting,
  isSyncing,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const primaryButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        e.preventDefault();
        onClose();
      }
    };

    primaryButtonRef.current?.focus();
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isSubmitting]);

  if (!isOpen) return null;

  const hasUnsynced = unsyncedCount > 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="submit-dialog-title"
      aria-describedby="submit-dialog-desc"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs"
    >
      <div
        ref={modalRef}
        className="w-full max-w-lg bg-surface rounded-2xl border border-border shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-surface-elevated/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-danger/10 text-danger border border-danger/20">
              <ShieldAlert className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="submit-dialog-title" className="text-base font-extrabold text-foreground">
                Submit Examination?
              </h2>
              <p id="submit-dialog-desc" className="text-xs text-foreground-secondary mt-0.5">
                Review your response tallies before final submission
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 rounded-xl text-foreground-secondary hover:text-foreground hover:bg-surface-elevated focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[40px] min-w-[40px] flex items-center justify-center disabled:opacity-50"
            aria-label="Close submit dialog and return to test"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Tallies */}
        <div className="p-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-xl border border-border bg-surface-elevated/30 flex flex-col">
              <span className="text-[10px] uppercase font-bold text-foreground-secondary">Total</span>
              <span className="font-mono text-lg font-bold text-foreground">{totalQuestions}</span>
            </div>

            <div className="p-3 rounded-xl border border-success/30 bg-success/10 flex flex-col">
              <span className="text-[10px] uppercase font-bold text-success">Answered</span>
              <span className="font-mono text-lg font-bold text-success">{answeredCount}</span>
            </div>

            <div className="p-3 rounded-xl border border-warning/30 bg-warning/10 flex flex-col">
              <span className="text-[10px] uppercase font-bold text-warning">Unanswered</span>
              <span className="font-mono text-lg font-bold text-warning">{unansweredCount}</span>
            </div>

            <div className="p-3 rounded-xl border border-accent/30 bg-accent/10 flex flex-col">
              <span className="text-[10px] uppercase font-bold text-accent">For Review</span>
              <span className="font-mono text-lg font-bold text-accent">{markedCount}</span>
            </div>
          </div>

          {/* Unsynchronized Warning Banner (Section 45) */}
          {hasUnsynced ? (
            <div
              className="p-4 rounded-xl border border-danger/40 bg-danger/10 text-danger flex items-start gap-3 text-xs"
              role="alert"
            >
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div className="flex flex-col gap-1">
                <strong className="font-bold">
                  {unsyncedCount} answer{unsyncedCount > 1 ? 's have' : ' has'} not yet been confirmed by the server.
                </strong>
                <p className="text-[11px] text-danger/90 leading-relaxed">
                  Do not submit unconfirmed answers. Please verify connectivity and synchronize before continuing.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl border border-border bg-surface-elevated/30 text-xs text-foreground-secondary flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                After final submission, you will not be able to return to the active examination or modify your answers.
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 sm:p-5 border-t border-border bg-surface-elevated/40 flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-surface hover:bg-surface-elevated border border-border text-foreground font-bold text-xs min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors disabled:opacity-50"
          >
            Continue Examination
          </button>

          {hasUnsynced ? (
            <button
              ref={primaryButtonRef}
              type="button"
              onClick={onRetrySync}
              disabled={isSyncing}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-warning hover:bg-warning-hover active:bg-warning-hover text-warning-contrast font-bold text-xs min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-warning shadow-xs transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} aria-hidden="true" />
              <span>{isSyncing ? 'Synchronizing...' : 'Try Synchronizing Again'}</span>
            </button>
          ) : (
            <button
              ref={primaryButtonRef}
              type="button"
              onClick={onConfirmSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-danger hover:bg-danger/90 active:bg-danger text-white font-bold text-xs min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-danger shadow-xs transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" aria-hidden="true" />
              <span>{isSubmitting ? 'Submitting to Authority...' : 'Confirm Final Submission'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
