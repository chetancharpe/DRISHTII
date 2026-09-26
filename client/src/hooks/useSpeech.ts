import { useState, useEffect, useCallback } from 'react';
import { useAccessibility } from './useAccessibility';

export interface UseSpeechReturn {
  isSpeaking: boolean;
  isPaused: boolean;
  isSupported: boolean;
  speak: (text: string) => void;
  cancel: () => void;
  pause: () => void;
  resume: () => void;
}

/**
 * useSpeech Hook
 * Encapsulates the Web SpeechSynthesis API.
 * CRITICAL RULE: Speech is NEVER automatically initiated on mount or page load.
 * It is strictly triggered by explicit user interaction (e.g. keyboard command or button click).
 */
export function useSpeech(): UseSpeechReturn {
  const { preferences } = useAccessibility();
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const cancel = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
  }, [isSupported]);

  const speak = useCallback(
    (text: string) => {
      if (!isSupported || !preferences.audioFeedbackEnabled || !text.trim()) {
        return;
      }

      // Stop previous queued utterance
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = preferences.preferredLanguage || 'en-US';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsPaused(false);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
        setIsPaused(false);
      };

      window.speechSynthesis.speak(utterance);
    },
    [isSupported, preferences.audioFeedbackEnabled, preferences.preferredLanguage]
  );

  const pause = useCallback(() => {
    if (isSupported && isSpeaking) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, [isSupported, isSpeaking]);

  const resume = useCallback(() => {
    if (isSupported && isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  }, [isSupported, isPaused]);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (isSupported) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isSupported]);

  return {
    isSpeaking,
    isPaused,
    isSupported,
    speak,
    cancel,
    pause,
    resume,
  };
}
