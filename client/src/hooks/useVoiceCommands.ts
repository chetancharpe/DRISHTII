import { useState, useEffect, useRef, useCallback } from 'react';
import { useAccessibility } from '../contexts/AccessibilityContext';

export interface VoiceCommandHandlers {
  onNext?: () => void;
  onPrevious?: () => void;
  onSelectOption?: (optionIndex: number) => void;
  onMarkReview?: () => void;
  onClearAnswer?: () => void;
  onSubmit?: () => void;
  onPlayAudio?: () => void;
  onPauseAudio?: () => void;
  onAddBookmark?: () => void;
}

// Global declaration for Web Speech Recognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function useVoiceCommands(handlers: VoiceCommandHandlers) {
  const { announce } = useAccessibility();
  const [isListening, setIsListening] = useState(false);
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const isSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const processTranscript = useCallback(
    (transcript: string) => {
      const text = transcript.trim().toLowerCase();
      setLastCommand(text);

      if (text.includes('next') || text.includes('agla')) {
        announce('Voice command: Next');
        handlersRef.current.onNext?.();
      } else if (text.includes('previous') || text.includes('back') || text.includes('pichhla')) {
        announce('Voice command: Previous');
        handlersRef.current.onPrevious?.();
      } else if (text.includes('option a') || text.includes('option 1') || text.includes('choose a') || text.includes('select a')) {
        announce('Voice command: Selected Option A');
        handlersRef.current.onSelectOption?.(0);
      } else if (text.includes('option b') || text.includes('option 2') || text.includes('choose b') || text.includes('select b')) {
        announce('Voice command: Selected Option B');
        handlersRef.current.onSelectOption?.(1);
      } else if (text.includes('option c') || text.includes('option 3') || text.includes('choose c') || text.includes('select c')) {
        announce('Voice command: Selected Option C');
        handlersRef.current.onSelectOption?.(2);
      } else if (text.includes('option d') || text.includes('option 4') || text.includes('choose d') || text.includes('select d')) {
        announce('Voice command: Selected Option D');
        handlersRef.current.onSelectOption?.(3);
      } else if (text.includes('mark') || text.includes('review') || text.includes('flag')) {
        announce('Voice command: Marked for review');
        handlersRef.current.onMarkReview?.();
      } else if (text.includes('clear') || text.includes('reset')) {
        announce('Voice command: Cleared answer');
        handlersRef.current.onClearAnswer?.();
      } else if (text.includes('submit') || text.includes('finish')) {
        announce('Voice command: Submit');
        handlersRef.current.onSubmit?.();
      } else if (text.includes('play') || text.includes('start audio') || text.includes('listen')) {
        announce('Voice command: Play audio');
        handlersRef.current.onPlayAudio?.();
      } else if (text.includes('pause') || text.includes('stop audio')) {
        announce('Voice command: Pause audio');
        handlersRef.current.onPauseAudio?.();
      } else if (text.includes('bookmark') || text.includes('save note')) {
        announce('Voice command: Added bookmark');
        handlersRef.current.onAddBookmark?.();
      }
    },
    [announce]
  );

  const startListening = useCallback(() => {
    if (!isSupported) {
      setErrorNotice('Voice recognition is not supported in this browser. Try Chrome or Edge.');
      return;
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setErrorNotice(null);
        announce('Voice commands activated. Say commands like Next, Option A, or Pause.');
      };

      recognition.onresult = (event: any) => {
        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript;
        processTranscript(transcript);
      };

      recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech') {
          setErrorNotice(`Voice recognition notice: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      setErrorNotice('Could not start microphone voice listener.');
    }
  }, [isSupported, announce, processTranscript]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Safe ignore
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
    announce('Voice commands deactivated.');
  }, [announce]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  return {
    isSupported,
    isListening,
    lastCommand,
    errorNotice,
    startListening,
    stopListening,
    toggleListening,
  };
}
