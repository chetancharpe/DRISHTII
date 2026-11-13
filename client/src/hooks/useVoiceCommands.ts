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
  onConfirmSubmit?: () => void;
  onCancelSubmit?: () => void;
  onPlayAudio?: () => void;
  onPauseAudio?: () => void;
  onAddBookmark?: () => void;
  onAnnounceTime?: () => void;
  onReadQuestion?: () => void;
  onReadOptions?: () => void;
  onStatus?: () => void;
  onNavigate?: (route: string) => void;
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
  const { announce, speak, preferences } = useAccessibility();
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

  const isListeningRef = useRef(isListening);
  isListeningRef.current = isListening;

  const restartTimerRef = useRef<any>(null);
  const processTranscriptRef = useRef<(transcript: string) => void>(() => {});

  const isSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // Scribe: Confirm pending option selection
  const confirmPendingSelection = useCallback(() => {
    if (pendingRef.current) {
      const { optionIndex, label } = pendingRef.current;
      handlersRef.current.onSelectOption?.(optionIndex);
      const isHindi = preferences?.language === 'hi';
      const msg = isHindi ? `विकल्प ${label} सुरक्षित कर दिया गया है।` : `Option ${label} confirmed and saved.`;
      speak(msg);
      announce(msg, 'polite');
      setPendingSelection(null);
    }
  }, [speak, announce, preferences]);

  // Scribe: Cancel pending option selection
  const cancelPendingSelection = useCallback(() => {
    if (pendingRef.current) {
      const isHindi = preferences?.language === 'hi';
      const msg = isHindi ? 'विकल्प चयन रद्द कर दिया गया। आप कौन सा विकल्प चुनना चाहते हैं?' : 'Option selection cancelled. What choice would you like to select?';
      speak(msg);
      announce(msg, 'polite');
      setPendingSelection(null);
    }
  }, [speak, announce, preferences]);

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
          text.includes('कन्फर्म') ||
          text.includes('हाँ') ||
          text.includes('हां') ||
          text.includes('सही है') ||
          text.includes('ठीक है') ||
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
          text.includes('hatao') ||
          text.includes('बदलो') ||
          text.includes('नहीं') ||
          text.includes('रद्द') ||
          text.includes('हटाओ')
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
        const isHindi = preferences?.language === 'hi';
        const prompt = isHindi
          ? `आपने विकल्प ${label} चुना है: ${optText}। पुष्टि के लिए 'हाँ' या 'कन्फर्म' बोलें, या बदलने के लिए 'बदलो' बोलें।`
          : `You selected Option ${label}: ${optText}. Say confirm or say change.`;
        speak(prompt);
        announce(prompt, 'assertive');
      };

      if (
        text.includes('option a') || text.includes('option 1') || text.includes('choose a') || text.includes('select a') ||
        text.includes('विकल्प ए') || text.includes('विकल्प 1') || text.includes('पहला विकल्प') || text.includes('विकल्प एक') ||
        text === 'विकल्प ए' || text === 'विकल्प 1' || text === 'ए'
      ) {
        handleOptionVoiceSelect(0, 'A');
        return;
      }
      if (
        text.includes('option b') || text.includes('option 2') || text.includes('choose b') || text.includes('select b') ||
        text.includes('विकल्प बी') || text.includes('विकल्प 2') || text.includes('दूसरा विकल्प') || text.includes('विकल्प दो') ||
        text === 'विकल्प बी' || text === 'विकल्प 2' || text === 'बी'
      ) {
        handleOptionVoiceSelect(1, 'B');
        return;
      }
      if (
        text.includes('option c') || text.includes('option 3') || text.includes('choose c') || text.includes('select c') ||
        text.includes('विकल्प सी') || text.includes('विकल्प 3') || text.includes('तीसरा विकल्प') || text.includes('विकल्प तीन') ||
        text === 'विकल्प सी' || text === 'विकल्प 3' || text === 'सी'
      ) {
        handleOptionVoiceSelect(2, 'C');
        return;
      }
      if (
        text.includes('option d') || text.includes('option 4') || text.includes('choose d') || text.includes('select d') ||
        text.includes('विकल्प डी') || text.includes('विकल्प 4') || text.includes('चौथा विकल्प') || text.includes('विकल्प चार') ||
        text === 'विकल्प डी' || text === 'विकल्प 4' || text === 'डी'
      ) {
        handleOptionVoiceSelect(3, 'D');
        return;
      }

      // ==========================================
      // 4. READ QUESTION / OPTIONS / REPEAT
      // ==========================================
      if (
        text.includes('read question') ||
        text.includes('sawal padho') ||
        text.includes('question padho') ||
        text.includes('सवाल पढ़ो') ||
        text.includes('read problem') ||
        text === 'read' ||
        text === 'padho' ||
        text.includes('repeat') ||
        text.includes('दोबारा')
      ) {
        if (handlersRef.current.onReadQuestion) {
          handlersRef.current.onReadQuestion();
          return;
        }
      }

      if (
        text.includes('read options') ||
        text.includes('options') ||
        text.includes('vikalp') ||
        text.includes('ऑप्शन बताओ') ||
        text.includes('विकल्प पढ़ो')
      ) {
        if (handlersRef.current.onReadOptions) {
          handlersRef.current.onReadOptions();
          return;
        }
      }

      // ==========================================
      // 5. GENERAL NAVIGATION & TIME COMMANDS
      // ==========================================
      if (text.includes('next') || text.includes('agla') || text.includes('अगला') || text.includes('आगे')) {
        announce('Voice command: Next', 'polite');
        handlersRef.current.onNext?.();
      } else if (text.includes('previous') || text.includes('back') || text.includes('pichhla') || text.includes('पिछला') || text.includes('पीछे')) {
        announce('Voice command: Previous', 'polite');
        handlersRef.current.onPrevious?.();
      } else if (text.includes('mark') || text.includes('review') || text.includes('flag') || text.includes('मार्क') || text.includes('निशान')) {
        announce('Voice command: Marked for review', 'polite');
        handlersRef.current.onMarkReview?.();
      } else if (text.includes('clear') || text.includes('reset') || text.includes('saaf karo') || text.includes('हटाओ') || text.includes('साफ करो')) {
        announce('Voice command: Cleared answer', 'polite');
        handlersRef.current.onClearAnswer?.();
      } else if (text.includes('confirm submit') || text.includes('yes submit') || text.includes('haan submit') || text.includes('हाँ सबमिट')) {
        handlersRef.current.onConfirmSubmit?.();
      } else if (text.includes('cancel submit') || text.includes('वापस जाओ')) {
        handlersRef.current.onCancelSubmit?.();
      } else if (text.includes('submit') || text.includes('finish') || text.includes('सबमिट') || text.includes('समाप्त')) {
        announce('Voice command: Submit', 'polite');
        handlersRef.current.onSubmit?.();
      } else if (text.includes('status') || text.includes('where am i') || text.includes('kahan hoon') || text.includes('स्थिति')) {
        handlersRef.current.onStatus?.();
      } else if (text.includes('time') || text.includes('samay') || text.includes('kitna time') || text.includes('remaining') || text.includes('समय') || text.includes('समय बताओ')) {
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
      } else if (handlersRef.current.onNavigate) {
        if (text.includes('dashboard') || text.includes('home') || text.includes('डैशबोर्ड')) {
          handlersRef.current.onNavigate('/candidate/dashboard');
        } else if (text.includes('mock test') || text.includes('मॉक टेस्ट')) {
          handlersRef.current.onNavigate('/candidate/mock-tests');
        } else if (text.includes('exam') || text.includes('परीक्षा')) {
          handlersRef.current.onNavigate('/candidate/exams');
        } else if (text.includes('result') || text.includes('रिजल्ट')) {
          handlersRef.current.onNavigate('/candidate/results');
        }
      }
    },
    [
      speak,
      announce,
      preferences,
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

  useEffect(() => {
    processTranscriptRef.current = processTranscript;
  }, [processTranscript]);

  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    clearTimeout(restartTimerRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
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

  const startListening = useCallback(async () => {
    if (!isSupported) {
      setErrorNotice('Voice recognition is not supported in this browser. Try Chrome or Edge.');
      return;
    }

    if (navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
      } catch {
        setErrorNotice('Microphone permission denied. Please allow microphone access.');
        return;
      }
    }

    isListeningRef.current = true;
    setIsListening(true);
    setErrorNotice(null);

    const SpeechRecognitionClass =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionClass) return;

    function runRecognition() {
      if (!isListeningRef.current) return;

      if (recognitionRef.current) {
        try {
          recognitionRef.current.onend = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.abort();
        } catch {}
        recognitionRef.current = null;
      }

      try {
        const recognition = new SpeechRecognitionClass();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = preferences?.language === 'hi' ? 'hi-IN' : 'en-IN';

        recognition.onstart = () => {
          setIsListening(true);
          setErrorNotice(null);
          announce('Scribe Voice Mode activated.', 'polite');
        };

        recognition.onresult = (event: any) => {
          let interim = '';
          let final = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const item = event.results[i];
            if (item.isFinal) {
              final += item[0].transcript;
            } else {
              interim += item[0].transcript;
            }
          }

          if (final.trim()) {
            processTranscriptRef.current(final.trim());
          } else if (interim.trim()) {
            const raw = interim.trim().toLowerCase();
            const quickInterim = [
              'next', 'previous', 'agla', 'pichhla', 'option a', 'option b', 'option c', 'option d',
              'option 1', 'option 2', 'option 3', 'option 4', 'confirm', 'cancel', 'submit', 'time',
              'अगला', 'पिछला', 'विकल्प ए', 'विकल्प बी', 'विकल्प सी', 'विकल्प डी',
              'विकल्प 1', 'विकल्प 2', 'विकल्प 3', 'विकल्प 4', 'कन्फर्म', 'हाँ', 'नहीं', 'सबमिट', 'समय'
            ];
            if (quickInterim.includes(raw)) {
              processTranscriptRef.current(raw);
            }
          }
        };

        recognition.onerror = (event: any) => {
          if (event.error !== 'no-speech' && event.error !== 'aborted') {
            setErrorNotice(`Voice recognition notice: ${event.error}`);
          }
        };

        recognition.onend = () => {
          if (isListeningRef.current) {
            clearTimeout(restartTimerRef.current);
            restartTimerRef.current = setTimeout(() => {
              if (isListeningRef.current) {
                runRecognition();
              }
            }, 300);
          } else {
            setIsListening(false);
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
      } catch (err) {
        setErrorNotice('Could not start microphone voice listener.');
      }
    }

    runRecognition();
  }, [isSupported, preferences?.language, announce]);

  const toggleListening = useCallback(() => {
    if (isListeningRef.current) {
      stopListening();
    } else {
      startListening();
    }
  }, [startListening, stopListening]);

  useEffect(() => {
    return () => {
      clearTimeout(restartTimerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onend = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
        recognitionRef.current = null;
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
