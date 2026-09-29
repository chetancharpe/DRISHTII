import React from 'react';
import {
  Mic,
  MicOff,
  Check,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { PendingOptionSelection } from '../../hooks/useVoiceCommands';

export interface VoiceCommandBarProps {
  isListening: boolean;
  isSupported: boolean;
  lastCommand: string | null;
  errorNotice: string | null;
  onToggle: () => void;
  // Scribe confirmation props
  pendingSelection?: PendingOptionSelection | null;
  onConfirmSelection?: () => void;
  onCancelSelection?: () => void;
  // Dictation props
  isDictating?: boolean;
  onStopDictating?: () => void;
  className?: string;
}

export const VoiceCommandBar: React.FC<VoiceCommandBarProps> = ({
  isListening,
  isSupported,
  lastCommand,
  errorNotice,
  onToggle,
  pendingSelection,
  onConfirmSelection,
  onCancelSelection,
  isDictating = false,
  onStopDictating,
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
    <div className={`flex flex-col gap-2 w-full ${className}`}>
      {/* Main Scribe & Voice Navigation Bar */}
      <div
        role="region"
        aria-label="AI Scribe voice command and dictation status"
        className={`p-3 rounded-2xl border transition-all ${
          pendingSelection
            ? 'border-accent bg-accent/10 shadow-md ring-1 ring-accent/40'
            : isListening
            ? 'border-primary/50 bg-primary/5 shadow-xs'
            : 'border-border bg-surface-elevated/40'
        } flex flex-wrap items-center justify-between gap-3`}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggle}
            aria-pressed={isListening}
            aria-label={isListening ? 'Deactivate Scribe voice mode' : 'Activate Scribe voice mode'}
            className={`p-2 rounded-xl flex items-center justify-center min-h-[40px] min-w-[40px] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              isListening
                ? 'bg-primary text-primary-contrast shadow-sm animate-pulse'
                : 'bg-surface hover:bg-surface-elevated border border-border text-foreground'
            }`}
          >
            {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black uppercase tracking-wider text-foreground">
                {isListening ? 'AI Scribe Active' : 'Scribe / Voice Control'}
              </span>
              {isListening && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 animate-pulse">
                  Listening for commands...
                </span>
              )}
              {isDictating && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent/20 text-accent border border-accent/30">
                  <span>Dictation Mode Active</span>
                  {onStopDictating && (
                    <button
                      type="button"
                      onClick={onStopDictating}
                      className="underline hover:no-underline ml-1 text-[9px] uppercase font-bold"
                    >
                      [Stop]
                    </button>
                  )}
                </span>
              )}
            </div>
            <p className="text-[11px] text-foreground-secondary mt-0.5">
              {isListening
                ? "Say 'Option A-D', 'Confirm', 'Change', 'Time', 'Next', 'Previous', or 'Start Dictation'."
                : "Click microphone or press 'V' to enable AI Scribe voice mode."}
            </p>
          </div>
        </div>

        {/* Last Recognized Command */}
        {lastCommand && isListening && !pendingSelection && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface border border-primary/30 text-xs text-primary font-mono font-bold animate-fadeIn">
            <Check className="w-3.5 h-3.5 text-status-success" aria-hidden="true" />
            <span>Recognized: &ldquo;{lastCommand}&rdquo;</span>
          </div>
        )}
      </div>

      {/* Scribe MCQ Confirmation Banner */}
      {pendingSelection && (
        <div
          role="alert"
          aria-live="assertive"
          className="p-3.5 rounded-2xl border-2 border-accent bg-accent/15 shadow-md flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-150"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-accent text-accent-contrast">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-black text-foreground">
                Confirmation Required for Option {pendingSelection.label}
              </div>
              <p className="text-xs text-foreground-secondary font-medium">
                You selected: &ldquo;<strong className="text-foreground">{pendingSelection.text}</strong>&rdquo;. Say <strong className="text-accent underline font-bold">&ldquo;Confirm&rdquo;</strong> to save or <strong className="text-foreground underline font-bold">&ldquo;Change&rdquo;</strong> to choose another option.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {onCancelSelection && (
              <button
                type="button"
                onClick={onCancelSelection}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border bg-surface hover:bg-surface-elevated text-foreground text-xs font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[36px]"
              >
                <XCircle className="w-3.5 h-3.5 text-foreground-muted" />
                <span>Change Choice [Esc]</span>
              </button>
            )}

            {onConfirmSelection && (
              <button
                type="button"
                onClick={onConfirmSelection}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-accent hover:bg-accent/90 text-accent-contrast text-xs font-black shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent min-h-[36px]"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Confirm Option {pendingSelection.label} [Enter]</span>
              </button>
            )}
          </div>
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
