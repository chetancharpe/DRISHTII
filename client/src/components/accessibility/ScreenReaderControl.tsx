import React from 'react';
import { useAccessibility } from '../../hooks/useAccessibility';
import { Volume2, Check } from 'lucide-react';

export const ScreenReaderControl: React.FC = () => {
  const { preferences, setScreenReaderOptimized } = useAccessibility();

  return (
    <div className="flex flex-col gap-2 py-3 border-b border-border">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-start gap-2">
          <Volume2 className="w-4 h-4 text-foreground-muted mt-0.5" aria-hidden="true" />
          <div>
            <div className="text-sm font-semibold text-foreground">
              Screen-Reader Optimized Formatting
            </div>
            <p className="text-xs text-foreground-muted mt-0.5 leading-relaxed">
              Enables enhanced live-region announcements, linearized reading order for math/tables, and hides non-essential visual decoration.
            </p>
            <p className="text-[11px] text-foreground-muted/80 mt-1 italic">
              Note: This is an application layout preference for external assistive software (NVDA, JAWS, VoiceOver, TalkBack); it does not replace an OS screen reader.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setScreenReaderOptimized(!preferences.screenReaderOptimized)}
          aria-pressed={preferences.screenReaderOptimized}
          className={`
            shrink-0 px-3.5 py-2 rounded-md border min-h-[44px] min-w-[100px] flex items-center justify-center gap-1.5
            text-xs font-semibold transition-colors duration-fast select-none cursor-pointer
            ${
              preferences.screenReaderOptimized
                ? 'bg-primary text-primary-contrast border-primary font-bold'
                : 'bg-surface text-foreground border-border hover:bg-surface-elevated'
            }
          `.trim()}
        >
          {preferences.screenReaderOptimized && (
            <Check className="w-3.5 h-3.5 stroke-[3]" aria-hidden="true" />
          )}
          <span>{preferences.screenReaderOptimized ? 'Enabled' : 'Disabled'}</span>
        </button>
      </div>
    </div>
  );
};
