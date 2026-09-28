import React, { useEffect, useRef } from 'react';
import { X, Keyboard } from 'lucide-react';

interface ExamShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExamShortcutsModal: React.FC<ExamShortcutsModalProps> = ({ isOpen, onClose }) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

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

  const shortcutGroups = [
    {
      category: 'Question Navigation',
      items: [
        { key: 'N', desc: 'Navigate to next question' },
        { key: 'P', desc: 'Navigate to previous question' },
      ],
    },
    {
      category: 'Answering & Review',
      items: [
        { key: '1 – 4', desc: 'Select option A, B, C, or D' },
        { key: 'M', desc: 'Toggle "Mark for Review" flag' },
        { key: 'C', desc: 'Clear currently selected answer' },
      ],
    },
    {
      category: 'Audio Assistance & Reading',
      items: [
        { key: 'R', desc: 'Re-read current question stem via speech' },
        { key: 'O', desc: 'Read answer options out loud via speech' },
      ],
    },
    {
      category: 'System & Submission',
      items: [
        { key: 'S', desc: 'Open examination submit confirmation' },
        { key: '?', desc: 'Open this keyboard shortcuts reference' },
        { key: 'Esc', desc: 'Dismiss active dialogs or navigator' },
      ],
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-dialog-title"
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
              <Keyboard className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="shortcuts-dialog-title" className="text-base font-extrabold text-foreground">
                Accessible Keyboard Shortcuts
              </h2>
              <p className="text-xs text-foreground-secondary mt-0.5">
                Single-key quick controls for screen reader & keyboard navigation
              </p>
            </div>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-foreground-secondary hover:text-foreground hover:bg-surface-elevated focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[40px] min-w-[40px] flex items-center justify-center transition-colors"
            aria-label="Close keyboard shortcuts dialog"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-4 overflow-y-auto max-h-[60vh]">
          {shortcutGroups.map((group) => (
            <div key={group.category} className="flex flex-col gap-2">
              <h3 className="text-xs font-bold text-foreground-secondary uppercase tracking-wider">
                {group.category}
              </h3>
              <div className="rounded-xl border border-border bg-surface divide-y divide-border/60">
                {group.items.map((item) => (
                  <div key={item.key} className="flex items-center justify-between px-3.5 py-2.5 text-xs">
                    <span className="text-foreground">{item.desc}</span>
                    <kbd className="px-2 py-1 rounded-md bg-surface-elevated border border-border font-mono font-bold text-foreground text-xs shadow-2xs">
                      {item.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <p className="text-[11px] text-foreground-secondary italic leading-relaxed">
            Note: Shortcuts are active during the examination cockpit and automatically paused when typing in text fields or inside modal dialogs.
          </p>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-surface-elevated/40 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
          >
            Return to Examination (Esc)
          </button>
        </div>
      </div>
    </div>
  );
};
