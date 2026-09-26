import React from 'react';
import { useAccessibility } from '../../hooks/useAccessibility';
import { Keyboard, Check } from 'lucide-react';

export const KeyboardModeControl: React.FC = () => {
  const { preferences, setKeyboardOnlyMode } = useAccessibility();

  return (
    <div className="flex flex-col gap-2 py-3 border-b border-border">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-start gap-2">
          <Keyboard className="w-4 h-4 text-foreground-muted mt-0.5" aria-hidden="true" />
          <div>
            <div className="text-sm font-semibold text-foreground">
              Keyboard Navigation Shortcut Badges
            </div>
            <p className="text-xs text-foreground-muted mt-0.5 leading-relaxed">
              Exposes visible keyboard hotkey indicators alongside examination actions and question palettes.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setKeyboardOnlyMode(!preferences.keyboardOnlyMode)}
          aria-pressed={preferences.keyboardOnlyMode}
          className={`
            shrink-0 px-3.5 py-2 rounded-md border min-h-[44px] min-w-[100px] flex items-center justify-center gap-1.5
            text-xs font-semibold transition-colors duration-fast select-none cursor-pointer
            ${
              preferences.keyboardOnlyMode
                ? 'bg-primary text-primary-contrast border-primary font-bold'
                : 'bg-surface text-foreground border-border hover:bg-surface-elevated'
            }
          `.trim()}
        >
          {preferences.keyboardOnlyMode && (
            <Check className="w-3.5 h-3.5 stroke-[3]" aria-hidden="true" />
          )}
          <span>{preferences.keyboardOnlyMode ? 'Visible' : 'Hidden'}</span>
        </button>
      </div>
    </div>
  );
};
