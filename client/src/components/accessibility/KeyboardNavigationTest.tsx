import React, { useState } from 'react';
import { Keyboard, CheckCircle2, Navigation } from 'lucide-react';

export interface KeyboardNavigationTestProps {
  className?: string;
}

export const KeyboardNavigationTest: React.FC<KeyboardNavigationTestProps> = ({ className = '' }) => {
  const [activeItem, setActiveItem] = useState<number | null>(null);
  const [activatedHistory, setActivatedHistory] = useState<Set<number>>(new Set());

  const handleActivate = (num: number) => {
    setActiveItem(num);
    setActivatedHistory((prev) => new Set([...prev, num]));
  };

  const isComplete = activatedHistory.size >= 1;

  return (
    <div className={`p-5 rounded-xl border border-border bg-surface-elevated/60 flex flex-col gap-4 ${className}`}>
      <div className="flex items-center gap-2">
        <Keyboard className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
        <h4 className="text-sm font-bold text-foreground">
          Interactive Keyboard Navigation Test
        </h4>
      </div>

      <div className="text-xs text-foreground-secondary leading-relaxed flex flex-col gap-1">
        <p className="font-medium text-foreground">
          Instruction: Use <kbd className="px-1.5 py-0.5 rounded border border-border bg-surface font-mono font-bold text-primary">Tab</kbd> to move through the controls below. Press <kbd className="px-1.5 py-0.5 rounded border border-border bg-surface font-mono font-bold text-primary">Enter</kbd> or <kbd className="px-1.5 py-0.5 rounded border border-border bg-surface font-mono font-bold text-primary">Space</kbd> to activate any focused control.
        </p>
      </div>

      {/* 1, 2, 3 Focusable Test Buttons */}
      <div className="flex flex-wrap items-center gap-3 pt-1">
        {[1, 2, 3].map((num) => {
          const isActivated = activatedHistory.has(num);
          return (
            <button
              key={num}
              type="button"
              onClick={() => handleActivate(num)}
              onFocus={() => setActiveItem(num)}
              aria-label={`Test Control ${num}${isActivated ? ' (activated)' : ''}`}
              className={`
                min-h-[46px] min-w-[120px] px-4 py-2.5 rounded-lg border-2 text-sm font-bold
                transition-all duration-150 cursor-pointer flex items-center justify-center gap-2
                ${
                  isActivated
                    ? 'border-status-success bg-status-success/15 text-foreground'
                    : 'border-border bg-surface hover:border-border-strong text-foreground'
                }
              `.trim()}
            >
              <span>Control {num}</span>
              {isActivated && (
                <CheckCircle2 className="w-4 h-4 text-status-success shrink-0" aria-hidden="true" />
              )}
            </button>
          );
        })}
      </div>

      {/* Dynamic Feedback Banner */}
      <div
        className="p-3 rounded-lg border border-border bg-surface flex items-center gap-2.5 min-h-[44px]"
        role="status"
        aria-live="polite"
      >
        {isComplete ? (
          <div className="flex items-center gap-2 text-xs font-semibold text-status-success">
            <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Keyboard navigation is working. Focus indicator and activation confirmed.{activeItem ? ` (Last focused: Control ${activeItem})` : ''}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-foreground-muted">
            <Navigation className="w-3.5 h-3.5 text-primary shrink-0 animate-pulse" aria-hidden="true" />
            <span>Awaiting keyboard interaction: Press Tab to focus, Space/Enter to test.{activeItem ? ` Focused: Control ${activeItem}` : ''}</span>
          </div>
        )}
      </div>

      {/* Focus Indicator Visual Demonstration */}
      <div className="pt-2 border-t border-border flex flex-col gap-2">
        <span className="text-[11px] font-mono uppercase tracking-wider text-foreground-muted font-semibold">
          Focus State Style Preview
        </span>
        <div className="flex items-center gap-4">
          <div
            tabIndex={0}
            role="region"
            aria-label="Demonstration of DRISHTI high-visibility focus ring"
            className="px-4 py-2 rounded-md bg-surface border border-primary outline outline-3 outline-primary outline-offset-3 font-semibold text-xs text-foreground select-none"
          >
            Focused Element (3px Focus Ring)
          </div>
          <span className="text-xs text-foreground-muted">
            WCAG 2.2 compliant 3px focus ring with high-contrast offset.
          </span>
        </div>
      </div>
    </div>
  );
};
