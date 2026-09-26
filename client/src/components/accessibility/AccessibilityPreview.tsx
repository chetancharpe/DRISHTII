import React, { useState } from 'react';
import { useAccessibility } from '../../hooks/useAccessibility';
import { Clock, Volume2, ArrowLeft, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import { Button } from '../common/Button';

export interface AccessibilityPreviewProps {
  className?: string;
}

export const AccessibilityPreview: React.FC<AccessibilityPreviewProps> = ({ className = '' }) => {
  const { preferences, speak, isSpeaking, stopSpeaking, isSpeechSupported } = useAccessibility();
  const [selectedOption, setSelectedOption] = useState<string>('B');
  const [listenFeedback, setListenFeedback] = useState<string | null>(null);

  const questionText = "Which planet is known as the Red Planet?";
  const options = [
    { key: 'A', text: 'Earth' },
    { key: 'B', text: 'Mars' },
    { key: 'C', text: 'Jupiter' },
    { key: 'D', text: 'Venus' },
  ];

  const handleListen = () => {
    if (!isSpeechSupported) {
      setListenFeedback('Speech synthesis is unavailable in this browser.');
      return;
    }

    if (isSpeaking) {
      stopSpeaking();
      setListenFeedback('Playback stopped.');
    } else {
      const fullSpeech = `Question 1: ${questionText}. Option A: Earth. Option B: Mars. Option C: Jupiter. Option D: Venus.`;
      speak(fullSpeech);
      setListenFeedback('Reading question and options aloud...');
    }
  };

  return (
    <div
      role="region"
      aria-label="Miniature examination interface preview"
      className={`rounded-xl border-2 border-primary/40 bg-surface p-5 sm:p-6 shadow-sm flex flex-col gap-4 text-foreground ${className}`}
    >
      {/* Header bar of preview */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
          <span className="text-xs font-bold uppercase tracking-wider text-foreground">
            Interactive Examination Preview
          </span>
        </div>
        <div
          className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-border bg-surface-elevated text-xs font-mono font-semibold text-foreground"
          aria-label="Simulated exam timer: 29 minutes remaining"
        >
          <Clock className="w-3.5 h-3.5 text-primary shrink-0" aria-hidden="true" />
          <span>29 minutes remaining</span>
        </div>
      </div>

      {/* Question Header & Listen Action */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bold font-mono text-primary uppercase">
            Question 1 of 50
          </span>
          <h4 className="text-base sm:text-lg font-extrabold text-foreground leading-snug">
            {questionText}
          </h4>
        </div>

        {/* Listen Button (triggers speech on demand) */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleListen}
          icon={<Volume2 className={`w-4 h-4 ${isSpeaking ? 'text-primary animate-pulse' : ''}`} aria-hidden="true" />}
          aria-label={`Listen to Question 1 and answer options${isSpeaking ? ' (click to stop)' : ''}`}
          className="shrink-0"
        >
          {isSpeaking ? 'Stop Audio' : 'Listen'}
        </Button>
      </div>

      {listenFeedback && (
        <p className="text-xs text-primary font-medium" role="status" aria-live="polite">
          {listenFeedback}
        </p>
      )}

      {/* Answer Options Radio Group */}
      <fieldset className="border-0 p-0 m-0">
        <legend className="sr-only">Choose answer for Question 1</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-1" role="radiogroup">
          {options.map((opt) => {
            const isSelected = selectedOption === opt.key;
            const inputId = `preview-opt-${opt.key}`;

            return (
              <label
                key={opt.key}
                htmlFor={inputId}
                className={`
                  flex items-center justify-between p-3.5 rounded-lg border-2 cursor-pointer
                  transition-all select-none min-h-[50px]
                  ${
                    isSelected
                      ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary'
                      : 'border-border bg-surface-elevated/50 hover:bg-surface-elevated hover:border-border-strong'
                  }
                `.trim()}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    id={inputId}
                    name="preview-exam-options"
                    value={opt.key}
                    checked={isSelected}
                    onChange={() => setSelectedOption(opt.key)}
                    className="sr-only"
                  />
                  <span
                    className={`
                      w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold font-mono shrink-0
                      ${
                        isSelected
                          ? 'bg-primary text-primary-contrast'
                          : 'bg-surface border border-border text-foreground'
                      }
                    `}
                    aria-hidden="true"
                  >
                    {opt.key}
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {opt.text}
                  </span>
                </div>

                {isSelected && (
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                )}

                {preferences.keyboardFirst && (
                  <span className="keyboard-indicator text-[10px]" aria-hidden="true">
                    Key: {opt.key}
                  </span>
                )}
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-3 border-t border-border mt-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          icon={<ArrowLeft className="w-4 h-4" aria-hidden="true" />}
          disabled
          aria-label="Previous question (disabled on first question)"
        >
          Previous
        </Button>

        <span className="text-xs font-medium text-foreground-muted">
          Selected: Option {selectedOption}
        </span>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          iconRight={<ArrowRight className="w-4 h-4" aria-hidden="true" />}
          aria-label="Next question preview"
        >
          Next
        </Button>
      </div>
    </div>
  );
};
