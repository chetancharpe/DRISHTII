import React, { useState } from 'react';
import { Volume2, Play, Square, Pause, AlertCircle } from 'lucide-react';
import { useAccessibility } from '../../contexts/AccessibilityContext';

interface AudioLearningPlayerProps {
  textToRead: string;
  sectionTitle?: string;
}

export const AudioLearningPlayer: React.FC<AudioLearningPlayerProps> = ({
  textToRead,
  sectionTitle = 'this section',
}) => {
  const { speak, stopSpeaking, isSpeaking, isSpeechSupported, preferences, announce } = useAccessibility();
  const [isPaused, setIsPaused] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const handlePlay = () => {
    if (!isSpeechSupported) {
      setNotice('Speech synthesis is not supported on this browser or platform.');
      announce('Speech synthesis is not supported on this browser.');
      return;
    }

    if (window.speechSynthesis?.paused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      announce(`Resuming audio for ${sectionTitle}`);
      return;
    }

    setNotice(null);
    setIsPaused(false);
    speak(textToRead);
    announce(`Reading ${sectionTitle}`);
  };

  const handlePause = () => {
    if (window.speechSynthesis && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      announce(`Audio paused for ${sectionTitle}`);
    }
  };

  const handleStop = () => {
    stopSpeaking();
    setIsPaused(false);
    announce(`Audio playback stopped for ${sectionTitle}`);
  };

  return (
    <div
      aria-label={`Audio reader for ${sectionTitle}`}
      className="p-3.5 rounded-xl border border-border bg-surface-elevated/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 my-2"
    >
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-lg bg-primary/10 text-primary flex-shrink-0" aria-hidden="true">
          {isSpeaking && !isPaused ? (
            <Volume2 className="w-4 h-4 animate-pulse" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </div>
        <div>
          <p className="text-xs font-bold text-foreground">
            {isSpeaking && !isPaused
              ? `Reading ${sectionTitle}...`
              : isPaused
              ? 'Audio Paused'
              : `Listen to ${sectionTitle}`}
          </p>
          <p className="text-[11px] text-foreground-secondary">
            {preferences.audioEnabled
              ? 'Audio enabled in your preferences'
              : 'Turn on audio in settings for automatic screen narration'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {!isSpeaking || isPaused ? (
          <button
            type="button"
            onClick={handlePlay}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-hover active:bg-primary-hover text-primary-contrast text-xs font-bold min-h-[38px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
            aria-label={`Listen to ${sectionTitle}`}
          >
            <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
            <span>{isPaused ? 'Resume' : 'Listen'}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handlePause}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-elevated hover:bg-surface border border-border text-foreground text-xs font-semibold min-h-[38px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
            aria-label={`Pause reading ${sectionTitle}`}
          >
            <Pause className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Pause</span>
          </button>
        )}

        {(isSpeaking || isPaused) && (
          <button
            type="button"
            onClick={handleStop}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-elevated border border-border text-foreground-secondary text-xs font-semibold min-h-[38px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
            aria-label={`Stop audio playback`}
          >
            <Square className="w-3 h-3 fill-current" aria-hidden="true" />
            <span>Stop</span>
          </button>
        )}
      </div>

      {notice && (
        <div
          role="alert"
          className="w-full text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 p-2 rounded border border-amber-500/20 flex items-center gap-1.5"
        >
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
          <span>{notice}</span>
        </div>
      )}
    </div>
  );
};
