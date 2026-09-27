import React, { useEffect, useRef } from 'react';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import { X, SlidersHorizontal, Sun, Moon, Contrast, Type, Volume2, ShieldCheck } from 'lucide-react';

interface ExamAccessibilityBarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExamAccessibilityBar: React.FC<ExamAccessibilityBarProps> = ({
  isOpen,
  onClose,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const { preferences, updatePreferences } = useAccessibility();

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
      aria-labelledby="exam-a11y-title"
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
              <SlidersHorizontal className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="exam-a11y-title" className="text-base font-extrabold text-foreground">
                Exam Accessibility Preferences
              </h2>
              <p className="text-xs text-foreground-secondary mt-0.5">
                Adjust visual and speech settings without interrupting your exam session
              </p>
            </div>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-foreground-secondary hover:text-foreground hover:bg-surface-elevated focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[40px] min-w-[40px] flex items-center justify-center"
            aria-label="Close accessibility preferences"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Content Controls */}
        <div className="p-5 flex flex-col gap-5 overflow-y-auto max-h-[60vh] text-xs">
          {/* Text Size */}
          <div className="flex flex-col gap-2">
            <label className="font-bold text-foreground flex items-center gap-2">
              <Type className="w-4 h-4 text-primary" aria-hidden="true" />
              <span>Text Scaling</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['default', 'large', 'extra-large', 'maximum'] as const).map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => updatePreferences({ fontSize: size })}
                  className={`p-2.5 rounded-xl border text-xs font-bold capitalize transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[44px] ${
                    preferences.fontSize === size
                      ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary'
                      : 'border-border bg-surface hover:bg-surface-elevated text-foreground'
                  }`}
                  aria-pressed={preferences.fontSize === size}
                >
                  {size.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Theme & Contrast */}
          <div className="flex flex-col gap-2">
            <label className="font-bold text-foreground flex items-center gap-2">
              <Sun className="w-4 h-4 text-primary" aria-hidden="true" />
              <span>Visual Appearance</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => updatePreferences({ theme: 'light', highContrast: false })}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[44px] ${
                  preferences.theme === 'light' && !preferences.highContrast
                    ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary'
                    : 'border-border bg-surface hover:bg-surface-elevated text-foreground'
                }`}
                aria-pressed={preferences.theme === 'light' && !preferences.highContrast}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>Light</span>
              </button>

              <button
                type="button"
                onClick={() => updatePreferences({ theme: 'dark', highContrast: false })}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[44px] ${
                  preferences.theme === 'dark' && !preferences.highContrast
                    ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary'
                    : 'border-border bg-surface hover:bg-surface-elevated text-foreground'
                }`}
                aria-pressed={preferences.theme === 'dark' && !preferences.highContrast}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>Dark</span>
              </button>

              <button
                type="button"
                onClick={() => updatePreferences({ highContrast: !preferences.highContrast })}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[44px] ${
                  preferences.highContrast
                    ? 'border-accent bg-accent/20 text-accent ring-1 ring-accent'
                    : 'border-border bg-surface hover:bg-surface-elevated text-foreground'
                }`}
                aria-pressed={preferences.highContrast}
              >
                <Contrast className="w-3.5 h-3.5" />
                <span>Contrast</span>
              </button>
            </div>
          </div>

          {/* Audio Assistance Toggle */}
          <div className="flex flex-col gap-2">
            <label className="font-bold text-foreground flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-primary" aria-hidden="true" />
              <span>Audio Assistance</span>
            </label>
            <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-surface">
              <div>
                <span className="font-bold text-foreground block">Question Narration Buttons</span>
                <span className="text-[11px] text-foreground-secondary">
                  Enables "Read Question" and "Read Options" buttons
                </span>
              </div>
              <button
                type="button"
                onClick={() => updatePreferences({ audioEnabled: !preferences.audioEnabled })}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[38px] ${
                  preferences.audioEnabled
                    ? 'bg-primary text-primary-contrast border-primary'
                    : 'bg-surface-elevated border-border text-foreground-secondary'
                }`}
                aria-pressed={preferences.audioEnabled}
              >
                {preferences.audioEnabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          </div>

          {/* Integrity Notice (Section 33, 48) */}
          <div className="p-3 rounded-xl border border-primary/20 bg-primary/5 flex items-start gap-2 text-foreground-secondary text-[11px] leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              Accessibility modifications strictly apply to visual and speech rendering. Your examination timer, answers, and section progress remain uninterrupted.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-surface-elevated/40 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover active:bg-primary-hover text-primary-contrast font-bold text-xs min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
          >
            Apply & Return to Exam
          </button>
        </div>
      </div>
    </div>
  );
};
