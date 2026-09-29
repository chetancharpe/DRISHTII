import { useState, useEffect, useRef, useCallback } from 'react';
import { useAccessibility } from '../contexts/AccessibilityContext';

export interface PendingOptionSelection {
  optionIndex: number;
  label: string; // e.g., 'A', 'B', 'C', 'D'
  text: string;  // e.g., '25 percent'
}

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
  onAnnounceTime?: () => void;
  // Scribe helper to read current question choices
  getCurrentOptions?: () => { label: string; text: string }[];
  // Subjective dictation callback
  onSubjectiveAnswerChange?: (text: string) => void;
}

// Global declaration for Web Speech Recognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function useVoiceCommands(handlers: VoiceCommandHandlers) {
  const { announce, speak } = useAccessibility();
  const [isListening, setIsListening] = useState(false);
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Scribe MCQ confirmation state
  const [pendingSelection, setPendingSelection] = useState<PendingOptionSelection | null>(null);

  // Scribe Subjective Dictation state
  const [isDictating, setIsDictating] = useState<boolean>(false);
  const [dictatedText, setDictatedText] = useState<string>('');

  const recognitionRef = useRef<any>(null);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const pendingRef = useRef(pendingSelection);
  pendingRef.current = pendingSelection;

  const isDictatingRef = useRef(isDictating);
  isDictatingRef.current = isDictating;

  const dictatedTextRef = useRef(dictatedText);
  dictatedTextRef.current = dictatedText;

  const isSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // Scribe: Confirm pending option selection
  const confirmPendingSelection = useCallback(() => {
    if (pendingRef.current) {
      const { optionIndex, label } = pendingRef.current;
      handlersRef.current.onSelectOption?.(optionIndex);
      speak(`Option ${label} confirmed and saved.`);
      announce(`Option ${label} confirmed and saved.`, 'polite');
      setPendingSelection(null);
    }
  }, [speak, announce]);

  // Scribe: Cancel pending option selection
  const cancelPendingSelection = useCallback(() => {
    if (pendingRef.current) {
      speak('Option selection cancelled. What choice would you like to select?');
      announce('Option selection cancelled.', 'polite');
      setPendingSelection(null);
    }
  }, [speak, announce]);

  // Scribe Dictation: Read back full answer
  const readBackDictation = useCallback(() => {
    const text = dictatedTextRef.current.trim();
    if (text) {
      speak(`Your dictated answer reads: ${text}`);
      announce('Reading back dictated answer.', 'polite');
    } else {
      speak('No text has been dictated yet.');
    }
  }, [speak, announce]);

  // Scribe Dictation: Read last sentence
  const readLastSentence = useCallback(() => {
    const text = dictatedTextRef.current.trim();
    if (!text) {
      speak('No text has been dictated yet.');
      return;
    }
    const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
    const last = sentences[sentences.length - 1].trim();
    speak(`Last sentence: ${last}`);
  }, [speak]);

  // Scribe Dictation: Delete last sentence
  const deleteLastSentence = useCallback(() => {
    const text = dictatedTextRef.current.trim();
    if (!text) {
      speak('No text to delete.');
      return;
    }
    const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
    if (sentences.length <= 1) {
      setDictatedText('');
      handlersRef.current.onSubjectiveAnswerChange?.('');
      speak('Last sentence removed. Dictation is now empty.');
      announce('Last sentence removed. Dictation is now empty.', 'polite');
    } else {
      sentences.pop();
      const updated = sentences.join('').trim();
      setDictatedText(updated);
      handlersRef.current.onSubjectiveAnswerChange?.(updated);
      speak('Last sentence removed.');
      announce('Last sentence removed from answer.', 'polite');
    }
  }, [speak, announce]);

  // Scribe Dictation: Clear all text
  const clearDictation = useCallback(() => {
    setDictatedText('');
    handlersRef.current.onSubjectiveAnswerChange?.('');
    speak('Dictated answer cleared.');
    announce('Dictated answer cleared.', 'polite');
  }, [speak, announce]);

  // Scribe Dictation: Start dictating
  const startDictating = useCallback(() => {
    setIsDictating(true);
    speak('Dictation mode activated. Speak your answer freely. Say "read back" or "confirm answer" when finished.');
    announce('Scribe Dictation mode activated.', 'polite');
  }, [speak, announce]);

  // Scribe Dictation: Stop dictating
  const stopDictating = useCallback(() => {
    setIsDictating(false);
    speak('Dictation stopped and answer saved.');
    announce('Dictation stopped and answer saved.', 'polite');
  }, [speak, announce]);

  // Core Speech Recognition Parser
  const processTranscript = useCallback(
    (transcript: string) => {
      const rawText = transcript.trim();
      const text = rawText.toLowerCase();
      setLastCommand(rawText);

      // ==========================================
      // 1. DICTATION MODE PARSING
      // ==========================================
      if (isDictatingRef.current) {
        if (text.includes('read back') || text.includes('read answer') || text.includes('sunao') || text.includes('read whole answer')) {
          readBackDictation();
          return;
        }
        if (text.includes('read last sentence') || text.includes('last sentence sunao')) {
          readLastSentence();
          return;
        }
        if (text.includes('delete last sentence') || text.includes('remove last sentence') || text.includes('undo last sentence') || text.includes('aakhri sentence hatao')) {
          deleteLastSentence();
          return;
        }
        if (text === 'clear answer' || text === 'saaf karo' || text === 'clear dictation') {
          clearDictation();
          return;
        }
        if (text.includes('confirm answer') || text.includes('stop dictating') || text.includes('save answer') || text.includes('theek hai')) {
          stopDictating();
          return;
        }

        // Otherwise append spoken text to subjective answer
        const current = dictatedTextRef.current;
        const updated = current ? `${current} ${rawText}` : rawText;
        setDictatedText(updated);
        handlersRef.current.onSubjectiveAnswerChange?.(updated);
        return;
      }

      // ==========================================
      // 2. MCQ PENDING CONFIRMATION HANDLING
      // ==========================================
      if (pendingRef.current) {
        if (
          text.includes('confirm') ||
          text.includes('yes') ||
          text.includes('save') ||
          text.includes('haan') ||
          text.includes('theek hai') ||
          text.includes('sahi hai') ||
          text === 'ok'
        ) {
          confirmPendingSelection();
          return;
        }
        if (
          text.includes('change') ||
          text.includes('cancel') ||
          text.includes('no') ||
          text.includes('nahi') ||
          text.includes('badlo') ||
          text.includes('hatao')
        ) {
          cancelPendingSelection();
          return;
        }
      }

      // ==========================================
      // 3. OPTION SELECTION WITH CONFIRMATION
      // ==========================================
      const options = handlersRef.current.getCurrentOptions?.() || [];

      const handleOptionVoiceSelect = (optIndex: number, defaultLabel: string) => {
        const opt = options[optIndex];
        const label = opt ? opt.label : defaultLabel;
        const optText = opt ? opt.text : `Option ${label}`;

        const pendingObj: PendingOptionSelection = {
          optionIndex: optIndex,
          label: label,
          text: optText,
        };
        setPendingSelection(pendingObj);

        // Audible verification prompt with confirmation step
        speak(`You selected Option ${label}: ${optText}. Say confirm or say change.`);
        announce(`Selected Option ${label}: ${optText}. Say confirm or say change.`, 'assertive');
      };

      if (text.includes('option a') || text.includes('option 1') || text.includes('choose a') || text.includes('select a')) {
        handleOptionVoiceSelect(0, 'A');
        return;
      }
      if (text.includes('option b') || text.includes('option 2') || text.includes('choose b') || text.includes('select b')) {
        handleOptionVoiceSelect(1, 'B');
        return;
      }
      if (text.includes('option c') || text.includes('option 3') || text.includes('choose c') || text.includes('select c')) {
        handleOptionVoiceSelect(2, 'C');
        return;
      }
      if (text.includes('option d') || text.includes('option 4') || text.includes('choose d') || text.includes('select d')) {
        handleOptionVoiceSelect(3, 'D');
        return;
      }

      // ==========================================
      // 4. GENERAL NAVIGATION & TIME COMMANDS
      // ==========================================
      if (text.includes('next') || text.includes('agla')) {
        announce('Voice command: Next', 'polite');
        handlersRef.current.onNext?.();
      } else if (text.includes('previous') || text.includes('back') || text.includes('pichhla')) {
        announce('Voice command: Previous', 'polite');
        handlersRef.current.onPrevious?.();
      } else if (text.includes('mark') || text.includes('review') || text.includes('flag')) {
        announce('Voice command: Marked for review', 'polite');
        handlersRef.current.onMarkReview?.();
      } else if (text.includes('clear') || text.includes('reset')) {
        announce('Voice command: Cleared answer', 'polite');
        handlersRef.current.onClearAnswer?.();
      } else if (text.includes('submit') || text.includes('finish')) {
        announce('Voice command: Submit', 'polite');
        handlersRef.current.onSubmit?.();
      } else if (text.includes('time') || text.includes('samay') || text.includes('kitna time') || text.includes('remaining')) {
        handlersRef.current.onAnnounceTime?.();
      } else if (text.includes('dictate') || text.includes('scribe')) {
        startDictating();
      } else if (text.includes('play') || text.includes('start audio') || text.includes('listen')) {
        announce('Voice command: Play audio', 'polite');
        handlersRef.current.onPlayAudio?.();
      } else if (text.includes('pause') || text.includes('stop audio')) {
        announce('Voice command: Pause audio', 'polite');
        handlersRef.current.onPauseAudio?.();
      } else if (text.includes('bookmark') || text.includes('save note')) {
        announce('Voice command: Added bookmark', 'polite');
        handlersRef.current.onAddBookmark?.();
      }
    },
    [
      speak,
      announce,
      confirmPendingSelection,
      cancelPendingSelection,
      readBackDictation,
      readLastSentence,
      deleteLastSentence,
      clearDictation,
      startDictating,
      stopDictating,
    ]
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
        announce('Scribe Voice Mode activated. Say Option A through D, Next, Previous, or Time.', 'polite');
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
    setIsDictating(false);
    setPendingSelection(null);
    announce('Voice commands deactivated.', 'polite');
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
    // Scribe MCQ Confirmation
    pendingSelection,
    confirmPendingSelection,
    cancelPendingSelection,
    // Scribe Subjective Dictation
    isDictating,
    dictatedText,
    setDictatedText,
    startDictating,
    stopDictating,
    readBackDictation,
    readLastSentence,
    deleteLastSentence,
    clearDictation,
    // Controls
    startListening,
    stopListening,
    toggleListening,
  };
}
