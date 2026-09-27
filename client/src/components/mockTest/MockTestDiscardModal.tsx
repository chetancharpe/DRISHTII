import React, { useEffect, useRef } from 'react';
import { AlertCircle, Trash2 } from 'lucide-react';

interface MockTestDiscardModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirmDiscard: () => void;
  testTitle: string;
}

export const MockTestDiscardModal: React.FC<MockTestDiscardModalProps> = ({
  isOpen,
  onCancel,
  onConfirmDiscard,
  testTitle,
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
      aria-labelledby="discard-title"
      aria-describedby="discard-desc"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
    >
      <div className="w-full max-w-md p-6 rounded-2xl border border-border bg-surface shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex-shrink-0" aria-hidden="true">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 id="discard-title" className="text-base font-bold text-foreground">
              Discard In-Progress Attempt?
            </h2>
            <p id="discard-desc" className="text-xs text-foreground-secondary">
              This will clear your unsaved responses for <strong className="text-foreground">{testTitle}</strong>.
            </p>
          </div>
        </div>

        <p className="text-xs text-foreground leading-relaxed p-3.5 rounded-xl bg-surface-elevated border border-border">
          Are you sure you want to discard this unfinished test session? This action cannot be reversed.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 rounded-lg border border-border bg-surface hover:bg-surface-elevated text-foreground text-xs font-semibold min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
          >
            <span>Keep Attempt</span>
          </button>

          <button
            type="button"
            onClick={onConfirmDiscard}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg bg-error hover:bg-error/90 text-white text-xs font-bold min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-error shadow-sm transition-colors"
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
            <span>Discard Attempt</span>
          </button>
        </div>
      </div>
    </div>
  );
};
