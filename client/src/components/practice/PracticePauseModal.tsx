import React, { useEffect, useRef } from 'react';
import { Pause, Play } from 'lucide-react';

interface PracticePauseModalProps {
  isOpen: boolean;
  onResume: () => void;
  topicName: string;
}

export const PracticePauseModal: React.FC<PracticePauseModalProps> = ({
  isOpen,
  onResume,
  topicName,
}) => {
  const resumeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      resumeButtonRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pause-modal-title"
      aria-describedby="pause-modal-description"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
    >
      <div className="w-full max-w-md p-6 rounded-2xl border border-border bg-surface shadow-2xl flex flex-col items-center text-center gap-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="p-3 rounded-full bg-primary/10 text-primary" aria-hidden="true">
          <Pause className="w-8 h-8" />
        </div>

        <div className="flex flex-col gap-1.5">
          <h2 id="pause-modal-title" className="text-lg font-bold text-foreground">
            Practice Paused
          </h2>
          <p id="pause-modal-description" className="text-xs text-foreground-secondary leading-relaxed">
            Your timer has paused and your current answers in <strong className="text-foreground">{topicName}</strong> are safely preserved. Take a moment to rest your eyes before continuing.
          </p>
        </div>

        <div className="w-full flex flex-col gap-2 pt-2">
          <button
            ref={resumeButtonRef}
            type="button"
            onClick={onResume}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary hover:bg-primary-hover active:bg-primary-hover text-primary-contrast font-bold text-xs min-h-[48px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-sm transition-colors"
          >
            <Play className="w-4 h-4 fill-current" aria-hidden="true" />
            <span>Resume Practice</span>
          </button>
        </div>
      </div>
    </div>
  );
};
