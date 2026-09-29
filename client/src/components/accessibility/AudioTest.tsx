import React, { useState } from 'react';
import { useAccessibility } from '../../hooks/useAccessibility';
import { Volume2, VolumeX, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '../common/Button';

export interface AudioTestProps {
  className?: string;
}

export const AudioTest: React.FC<AudioTestProps> = ({ className = '' }) => {
  const { speak, stopSpeaking, isSpeaking, isSpeechSupported } = useAccessibility();
  const [testStatus, setTestStatus] = useState<string | null>(null);

  const handleTestAudio = () => {
    if (!isSpeechSupported) {
      setTestStatus('Audio assistance is not available in this browser.');
      return;
    }

    setTestStatus('Playing speech sample...');
    speak('DRISHTI audio assistance is working.');
  };

  const handleStopAudio = () => {
    stopSpeaking();
    setTestStatus('Audio playback stopped.');
  };

  return (
    <div className={`p-4 rounded-xl border border-border bg-surface-elevated/70 flex flex-col gap-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Acoustic Speech Test
          </h4>
        </div>
        {!isSpeechSupported && (
          <span className="text-[11px] font-semibold text-status-warning flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
            Speech synthesis unavailable
          </span>
        )}
      </div>

      <p className="text-xs text-foreground-secondary leading-relaxed">
        Test DRISHTI voice playback directly on your current speakers or headphones. Speech is strictly triggered by your command and never autoplays.
      </p>

      {!isSpeechSupported ? (
        <div
          role="alert"
          className="p-3 rounded-lg border border-status-warning/30 bg-status-warning/10 text-xs text-foreground flex items-center gap-2 font-medium"
        >
          <AlertCircle className="w-4 h-4 text-status-warning shrink-0" aria-hidden="true" />
          <span>Audio assistance is not available in this browser.</span>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          {isSpeaking ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleStopAudio}
              icon={<VolumeX className="w-4 h-4 text-status-error" aria-hidden="true" />}
              aria-label="Stop audio speech playback"
            >
              Stop Audio
            </Button>
          ) : (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleTestAudio}
              icon={<Volume2 className="w-4 h-4 text-primary" aria-hidden="true" />}
              aria-label="Play acoustic speech test phrase: DRISHTI audio assistance is working"
            >
              Test Audio
            </Button>
          )}

          {testStatus && (
            <span
              className="text-xs text-foreground-muted flex items-center gap-1.5"
              role="status"
              aria-live="polite"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" aria-hidden="true" />
              {testStatus}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
