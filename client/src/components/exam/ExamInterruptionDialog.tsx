import React, { useEffect, useRef } from 'react';
import { AlertCircle, RefreshCw, ArrowRight } from 'lucide-react';
import { ExamSessionStatus } from '../../types/exam';

interface ExamInterruptionDialogProps {
  isOpen: boolean;
  status: ExamSessionStatus;
  lastSyncTimestamp: number;
  onResume: () => void;
  onViewStatus?: () => void;
}

export const ExamInterruptionDialog: React.FC<ExamInterruptionDialogProps> = ({
  isOpen,
  status,
  lastSyncTimestamp,
  onResume,
  onViewStatus,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const actionButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      actionButtonRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isExpired = status === 'EXPIRED';
  const syncDate = new Date(lastSyncTimestamp).toLocaleTimeString();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="interruption-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/85 backdrop-blur-xs"
    >
      <div
        ref={modalRef}
        className="w-full max-w-md bg-surface rounded-2xl border border-border shadow-2xl p-6 flex flex-col gap-5 text-center animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="w-12 h-12 rounded-2xl bg-warning/15 text-warning border border-warning/30 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" aria-hidden="true" />
        </div>

        <div>
          <h2 id="interruption-dialog-title" className="text-lg font-extrabold text-foreground">
            {isExpired ? 'Examination Session Ended' : 'Examination Session Interrupted'}
          </h2>
          <p className="text-xs text-foreground-secondary mt-1.5 leading-relaxed">
            {isExpired
              ? 'The official examination window has concluded. Unsaved inputs can no longer be processed.'
              : 'Your browser or device connection experienced an interruption. Your latest confirmed responses are preserved.'}
          </p>
        </div>

        {/* State metadata */}
        <div className="p-3.5 rounded-xl border border-border bg-surface-elevated/40 text-xs flex flex-col gap-1 text-left">
          <div className="flex justify-between">
            <span className="text-foreground-secondary">Session Status:</span>
            <span className="font-bold text-foreground capitalize">{status.toLowerCase()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-foreground-secondary">Last Sync:</span>
            <span className="font-mono text-foreground font-semibold">{syncDate}</span>
          </div>
        </div>

        {/* Action Button */}
        <div>
          {isExpired ? (
            <button
              ref={actionButtonRef}
              type="button"
              onClick={onViewStatus}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover active:bg-primary-hover text-primary-contrast font-bold text-xs min-h-[48px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-xs transition-colors"
            >
              <span>View Submission Status</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          ) : (
            <button
              ref={actionButtonRef}
              type="button"
              onClick={onResume}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover active:bg-primary-hover text-primary-contrast font-bold text-xs min-h-[48px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-xs transition-colors"
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              <span>Resume Examination</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
