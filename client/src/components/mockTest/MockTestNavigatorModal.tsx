import React, { useEffect, useRef } from 'react';
import { MockTestQuestion, MockTestAnswer } from '../../types/mockTest';
import { MockTestNavigatorPalette } from './MockTestNavigatorPalette';
import { X } from 'lucide-react';

interface MockTestNavigatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: MockTestQuestion[];
  answers: Record<string, MockTestAnswer>;
  currentQuestionId: string;
  onSelectQuestion: (questionId: string) => void;
}

export const MockTestNavigatorModal: React.FC<MockTestNavigatorModalProps> = ({
  isOpen,
  onClose,
  questions,
  answers,
  currentQuestionId,
  onSelectQuestion,
}) => {
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      closeBtnRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mobile-nav-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm lg:hidden"
    >
      <div className="w-full max-w-sm max-h-[85vh] overflow-y-auto rounded-2xl border border-border bg-surface p-5 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h2 id="mobile-nav-title" className="text-sm font-bold text-foreground">
            Question Navigator
          </h2>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg border border-border text-foreground-secondary hover:text-foreground hover:bg-surface-elevated focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[36px] min-w-[36px] inline-flex items-center justify-center transition-colors"
            aria-label="Close question navigator"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <MockTestNavigatorPalette
          questions={questions}
          answers={answers}
          currentQuestionId={currentQuestionId}
          onSelectQuestion={(id) => {
            onSelectQuestion(id);
            onClose();
          }}
        />
      </div>
    </div>
  );
};
