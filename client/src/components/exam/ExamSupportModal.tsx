import React, { useEffect, useRef } from 'react';
import { X, HelpCircle, Keyboard, LifeBuoy, Wifi } from 'lucide-react';

interface ExamSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  organization: string;
}

export const ExamSupportModal: React.FC<ExamSupportModalProps> = ({
  isOpen,
  onClose,
  organization,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="exam-help-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs"
    >
      <div
        ref={modalRef}
        className="w-full max-w-lg bg-surface rounded-2xl border border-border shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-surface-elevated/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <HelpCircle className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="exam-help-title" className="text-base font-extrabold text-foreground">
                Technical Support & Controls
              </h2>
              <p className="text-xs text-foreground-secondary mt-0.5">
                Guidance on keyboard operations and platform assistance
              </p>
            </div>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-foreground-secondary hover:text-foreground hover:bg-surface-elevated focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[40px] min-w-[40px] flex items-center justify-center"
            aria-label="Close technical support dialog"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-4 overflow-y-auto max-h-[60vh] text-xs">
          {/* Keyboard Operations */}
          <div className="p-4 rounded-xl border border-border bg-surface flex flex-col gap-2.5">
            <h3 className="font-bold text-foreground flex items-center gap-2 text-xs">
              <Keyboard className="w-4 h-4 text-primary" aria-hidden="true" />
              <span>Keyboard Controls</span>
            </h3>
            <ul className="flex flex-col gap-1.5 text-foreground-secondary leading-relaxed pl-1">
              <li>
                <strong className="text-foreground">Tab / Shift + Tab:</strong> Move between interactive options and buttons.
              </li>
              <li>
                <strong className="text-foreground">Up / Down Arrow Keys:</strong> Select radio options in single-choice questions.
              </li>
              <li>
                <strong className="text-foreground">Spacebar:</strong> Select or toggle checkboxes and review marks.
              </li>
              <li>
                <strong className="text-foreground">Escape:</strong> Dismiss navigator and dialog windows.
              </li>
            </ul>
          </div>

          {/* Connectivity & Offline Behavior */}
          <div className="p-4 rounded-xl border border-border bg-surface flex flex-col gap-2.5">
            <h3 className="font-bold text-foreground flex items-center gap-2 text-xs">
              <Wifi className="w-4 h-4 text-primary" aria-hidden="true" />
              <span>Network & Synchronization</span>
            </h3>
            <p className="text-foreground-secondary leading-relaxed">
              If your connection drops, GoWow continues to log your answers locally and displays an "Offline" badge. Once reconnected, click "Retry" to synchronize all pending responses with the server.
            </p>
          </div>

          {/* Demo Authority Support Channel (Section 38) */}
          <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex flex-col gap-2">
            <h3 className="font-bold text-foreground flex items-center gap-2 text-xs">
              <LifeBuoy className="w-4 h-4 text-primary" aria-hidden="true" />
              <span>Technical Support Channel</span>
            </h3>
            <p className="text-foreground-secondary leading-relaxed">
              For system difficulties, communicate with your proctor or authority desk.
            </p>
            <div className="mt-1 p-2.5 rounded-lg bg-surface border border-border text-[11px] font-mono text-foreground">
              Examination Authority: {organization} (Demo Desk)
              <br />
              Candidate Assistance ID: GOWOW-HELP-8942
            </div>
            <p className="text-[10px] text-foreground-secondary italic">
              Note: Technical support staff cannot assist with examination subject questions or hints.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-surface-elevated/40 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-surface hover:bg-surface-elevated border border-border text-foreground font-bold text-xs min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
          >
            Return to Examination
          </button>
        </div>
      </div>
    </div>
  );
};
