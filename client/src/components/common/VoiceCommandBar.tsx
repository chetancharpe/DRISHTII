import React from 'react';
import { Mic, MicOff, Check, AlertCircle } from 'lucide-react';

export interface VoiceCommandBarProps {
  isListening: boolean;
  isSupported: boolean;
  lastCommand: string | null;
  errorNotice: string | null;
  onToggle: () => void;
  className?: string;
}

export const VoiceCommandBar: React.FC<VoiceCommandBarProps> = ({
  isListening,
  isSupported,
  lastCommand,
  errorNotice,
  onToggle,
  className = '',
}) => {
  if (!isSupported) {
    return (
      <div
        className={`p-2.5 rounded-xl border border-border bg-surface-elevated/40 text-xs text-foreground-muted flex items-center justify-between gap-2 ${className}`}
      >
        <div className="flex items-center gap-2">
          <MicOff className="w-4 h-4 text-foreground-muted" aria-hidden="true" />
          <span>Voice navigation: supported in Chromium browsers (Chrome/Edge).</span>
        </div>
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-label="Hands-free voice command navigation controls"
      className={`p-3 rounded-2xl border ${
        isListening
          ? 'border-primary/50 bg-primary/5 shadow-xs'
          : 'border-border bg-surface-elevated/40'
      } flex flex-wrap items-center justify-between gap-3 transition-colors ${className}`}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={isListening}
          aria-label={isListening ? 'Deactivate voice navigation' : 'Activate hands-free voice navigation'}
          className={`p-2 rounded-xl flex items-center justify-center min-h-[40px] min-w-[40px] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            isListening
              ? 'bg-primary text-primary-contrast shadow-sm animate-pulse'
              : 'bg-surface hover:bg-surface-elevated border border-border text-foreground'
          }`}
        >
          {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
        </button>

        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-foreground">
              {isListening ? 'Voice Navigation Active' : 'Hands-Free Voice Control'}
            </span>
            {isListening && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30">
                Listening...
              </span>
            )}
          </div>
          <p className="text-[11px] text-foreground-secondary">
            {isListening
              ? "Say 'Next', 'Previous', 'Option A-D', 'Play', 'Pause', or 'Bookmark'."
              : 'Click to enable microphone voice shortcuts.'}
          </p>
        </div>
      </div>

      {/* Last Recognized Command */}
      {lastCommand && isListening && (
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface border border-primary/30 text-xs text-primary font-mono font-bold animate-fadeIn">
          <Check className="w-3.5 h-3.5 text-status-success" aria-hidden="true" />
          <span>Recognized: &ldquo;{lastCommand}&rdquo;</span>
        </div>
      )}

      {errorNotice && (
        <div className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5 w-full">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{errorNotice}</span>
        </div>
      )}
    </div>
  );
};
