import React from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  RotateCcw,
  Check,
  Trash2,
} from 'lucide-react';

export interface ExamSubjectiveDictationProps {
  value: string;
  onChange: (value: string) => void;
  isDictating: boolean;
  isSupported: boolean;
  onToggleDictation: () => void;
  onReadBack: () => void;
  onReadLastSentence: () => void;
  onDeleteLastSentence: () => void;
  onClear: () => void;
  onConfirm: () => void;
  placeholder?: string;
  className?: string;
}

export const ExamSubjectiveDictation: React.FC<ExamSubjectiveDictationProps> = ({
  value,
  onChange,
  isDictating,
  isSupported,
  onToggleDictation,
  onReadBack,
  onReadLastSentence,
  onDeleteLastSentence,
  onClear,
  onConfirm,
  placeholder = 'Speak or type your subjective answer or examination notes here...',
  className = '',
}) => {
  return (
    <div
      role="region"
      aria-label="AI Scribe Answer Dictation Assistant"
      className={`rounded-2xl border-2 transition-all p-4 flex flex-col gap-3 ${
        isDictating
          ? 'border-primary bg-primary/5 shadow-md ring-1 ring-primary/40'
          : 'border-border bg-surface-elevated/40'
      } ${className}`}
    >
      {/* Scribe Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`p-2 rounded-xl flex items-center justify-center transition-colors ${
              isDictating
                ? 'bg-primary text-primary-contrast animate-pulse'
                : 'bg-primary/10 text-primary border border-primary/20'
            }`}
          >
            <Mic className="w-4 h-4" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                AI Scribe Dictation Assistant
              </h3>
              {isDictating && (
                <span className="text-[10px] font-mono font-extrabold uppercase px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 animate-pulse">
                  Listening & Transcribing...
                </span>
              )}
            </div>
            <p className="text-[11px] text-foreground-secondary mt-0.5">
              Hands-free answer dictation with audio read-back and voice editing
            </p>
          </div>
        </div>

        {/* Start / Stop Dictation Toggle */}
        {isSupported && (
          <button
            type="button"
            onClick={onToggleDictation}
            aria-pressed={isDictating}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-bold text-xs min-h-[38px] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              isDictating
                ? 'bg-danger text-white hover:bg-danger/90 active:bg-danger shadow-xs animate-pulse'
                : 'bg-primary hover:bg-primary-hover active:bg-primary-hover text-primary-contrast shadow-xs'
            }`}
          >
            {isDictating ? (
              <>
                <MicOff className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Stop Dictating</span>
              </>
            ) : (
              <>
                <Mic className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Start Dictation</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Accessible Textarea */}
      <div className="relative w-full">
        <label htmlFor="scribe-answer-textarea" className="sr-only">
          Subjective answer and dictated response text
        </label>
        <textarea
          id="scribe-answer-textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={4}
          className="w-full p-3.5 rounded-xl bg-surface border border-border text-foreground text-sm font-medium leading-relaxed resize-y focus:outline-none focus-visible:ring-2 focus-visible:ring-primary placeholder:text-foreground-muted"
        />

        {value.length > 0 && (
          <div className="absolute bottom-2.5 right-3 text-[10px] font-mono text-foreground-muted bg-surface/80 px-1.5 py-0.5 rounded border border-border">
            {value.trim().split(/\s+/).filter(Boolean).length} words
          </div>
        )}
      </div>

      {/* Scribe Action & Review Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border">
        {/* Audio Verification Tools */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={onReadBack}
            disabled={!value.trim()}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface hover:bg-surface-elevated border border-border text-foreground text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors min-h-[34px]"
            aria-label="Read back full dictated answer aloud"
          >
            <Volume2 className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
            <span>Read Back</span>
          </button>

          <button
            type="button"
            onClick={onReadLastSentence}
            disabled={!value.trim()}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface hover:bg-surface-elevated border border-border text-foreground text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors min-h-[34px]"
            aria-label="Read back last sentence of dictated answer"
          >
            <span>Read Last Sentence</span>
          </button>

          <button
            type="button"
            onClick={onDeleteLastSentence}
            disabled={!value.trim()}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface hover:bg-surface-elevated border border-border text-foreground text-xs font-semibold text-danger disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-danger transition-colors min-h-[34px]"
            aria-label="Delete last dictated sentence"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Delete Last Sentence</span>
          </button>
        </div>

        {/* Clear & Confirm Controls */}
        <div className="flex items-center gap-2 ml-auto">
          {value.trim() && (
            <button
              type="button"
              onClick={onClear}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-foreground-secondary hover:text-danger text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-danger transition-colors min-h-[34px]"
              aria-label="Clear dictated answer"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Clear</span>
            </button>
          )}

          <button
            type="button"
            onClick={onConfirm}
            disabled={!value.trim()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-primary-contrast text-xs font-bold shadow-xs disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors min-h-[34px]"
            aria-label="Confirm and save dictated answer"
          >
            <Check className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Confirm Answer</span>
          </button>
        </div>
      </div>

      {/* Spoken Voice Commands Cheatsheet */}
      {isDictating && (
        <div
          role="note"
          className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-[11px] text-foreground-secondary flex flex-wrap items-center gap-x-3 gap-y-1"
        >
          <span className="font-bold text-primary">Scribe Voice Commands:</span>
          <span>&ldquo;Read back&rdquo;</span>
          <span>•</span>
          <span>&ldquo;Read last sentence&rdquo;</span>
          <span>•</span>
          <span>&ldquo;Delete last sentence&rdquo;</span>
          <span>•</span>
          <span>&ldquo;Confirm answer&rdquo;</span>
        </div>
      )}
    </div>
  );
};
