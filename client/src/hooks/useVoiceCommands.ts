import { useState, useEffect, useRef, useCallback } from 'react';
import { useAccessibility } from '../contexts/AccessibilityContext';
import { playEarcon, resumeAudioContext } from '../utils/audioEarcons';

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
  const { announce, speak, preferences, isSpeaking } = useAccessibility();
  const [isListening, setIsListening] = useState(false);
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Scribe MCQ confirmation state
  const [pendingSelection, setPendingSelection] = useState<PendingOptionSelection | null>(null);

  // Scribe Subjective Dictation state
  const [isDictating, setIsDictating] = useState<boolean>(false);
  const [dictatedText, setDictatedText] = useState<string>('');

  const recognitionRef = useRef<any>(null);
  const shouldListenRef = useRef<boolean>(false);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const pendingRef = useRef(pendingSelection);
  pendingRef.current = pendingSelection;

  const isDictatingRef = useRef(isDictating);
  isDictatingRef.current = isDictating;

  const dictatedTextRef = useRef(dictatedText);
  dictatedTextRef.current = dictatedText;

  const isHindi = preferences.language === 'hi';

  const isSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // Scribe: Confirm pending option selection
  const confirmPendingSelection = useCallback(() => {
    if (pendingRef.current) {
      const { optionIndex, label } = pendingRef.current;
      handlersRef.current.onSelectOption?.(optionIndex);
      playEarcon('ding');
      const confirmationText = isHindi
        ? `विकल्प ${label} चुना गया। अगला सवाल?`
        : `Option ${label} confirmed and saved. Next?`;
      speak(confirmationText);
      announce(confirmationText, 'polite');
      setPendingSelection(null);
    }
  }, [speak, announce, isHindi]);

  // Scribe: Cancel pending option selection
  const cancelPendingSelection = useCallback(() => {
    if (pendingRef.current) {
      playEarcon('nav');
      const cancelText = isHindi
        ? 'विकल्प चयन रद्द किया गया। आप कौन-सा विकल्प चुनना चाहते हैं?'
        : 'Option selection cancelled. What choice would you like to select?';
      speak(cancelText);
      announce(cancelText, 'polite');
      setPendingSelection(null);
    }
  }, [speak, announce, isHindi]);

  // Scribe Dictation: Read back full answer
  const readBackDictation = useCallback(() => {
    const text = dictatedTextRef.current.trim();
    if (text) {
      speak(isHindi ? `आपका उत्तर है: ${text}` : `Your dictated answer reads: ${text}`);
      announce('Reading back dictated answer.', 'polite');
    } else {
      speak(isHindi ? 'अभी कोई उत्तर डिक्टेट नहीं किया गया है।' : 'No text has been dictated yet.');
    }
  }, [speak, announce, isHindi]);

  // Scribe Dictation: Read last sentence
  const readLastSentence = useCallback(() => {
    const text = dictatedTextRef.current.trim();
    if (!text) {
      speak(isHindi ? 'कोई टेक्स्ट नहीं है।' : 'No text has been dictated yet.');
      return;
    }
    const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
    const last = sentences[sentences.length - 1].trim();
    speak(isHindi ? `अंतिम वाक्य: ${last}` : `Last sentence: ${last}`);
  }, [speak, isHindi]);

  // Scribe Dictation: Delete last sentence
  const deleteLastSentence = useCallback(() => {
    const text = dictatedTextRef.current.trim();
    if (!text) {
      speak(isHindi ? 'हटाने के लिए कोई टेक्स्ट नहीं है।' : 'No text to delete.');
      return;
    }
    const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
    if (sentences.length <= 1) {
      setDictatedText('');
      handlersRef.current.onSubjectiveAnswerChange?.('');
      speak(isHindi ? 'अंतिम वाक्य हटाया गया। उत्तर अब खाली है।' : 'Last sentence removed. Dictation is now empty.');
      announce('Last sentence removed.', 'polite');
    } else {
      sentences.pop();
      const updated = sentences.join('').trim();
      setDictatedText(updated);
      handlersRef.current.onSubjectiveAnswerChange?.(updated);
      speak(isHindi ? 'अंतिम वाक्य हटाया गया।' : 'Last sentence removed.');
      announce('Last sentence removed.', 'polite');
    }
  }, [speak, announce, isHindi]);

  // Scribe Dictation: Clear all text
  const clearDictation = useCallback(() => {
    setDictatedText('');
    handlersRef.current.onSubjectiveAnswerChange?.('');
    speak(isHindi ? 'डिक्टेट किया गया उत्तर साफ़ कर दिया गया है।' : 'Dictated answer cleared.');
    announce('Dictated answer cleared.', 'polite');
  }, [speak, announce, isHindi]);

  // Scribe Dictation: Start dictating
  const startDictating = useCallback(() => {
    setIsDictating(true);
    speak(
      isHindi
        ? 'डिक्टेशन मोड शुरू हो गया है। अपना उत्तर बोलें। समाप्त होने पर बोलें "उत्तर सेव करो"।'
        : 'Dictation mode activated. Speak your answer freely. Say "save answer" or "confirm" when finished.'
    );
    announce('Scribe Dictation mode activated.', 'polite');
  }, [speak, announce, isHindi]);

  // Scribe Dictation: Stop dictating
  const stopDictating = useCallback(() => {
    setIsDictating(false);
    playEarcon('ding');
    speak(isHindi ? 'डिक्टेशन रोक दी गई है और उत्तर सेव हो गया है।' : 'Dictation stopped and answer saved.');
    announce('Dictation stopped and answer saved.', 'polite');
  }, [speak, announce, isHindi]);

  // Core Speech Recognition Parser with Bilingual Natural Speech Matching
  const processTranscript = useCallback(
    (transcript: string) => {
      const rawText = transcript.trim();
      if (!rawText) return;
      const text = rawText.toLowerCase();
      setLastCommand(rawText);

      // ==========================================
      // 1. DICTATION MODE PARSING
      // ==========================================
      if (isDictatingRef.current) {
        if (
          text.includes('read back') ||
          text.includes('read answer') ||
          text.includes('sunao') ||
          text.includes('उत्तर पढ़ो') ||
          text.includes('read whole answer')
        ) {
          readBackDictation();
          return;
        }
        if (text.includes('read last sentence') || text.includes('last sentence sunao') || text.includes('अंतिम वाक्य')) {
          readLastSentence();
          return;
        }
        if (
          text.includes('delete last sentence') ||
          text.includes('remove last sentence') ||
          text.includes('undo last sentence') ||
          text.includes('aakhri sentence hatao')
        ) {
          deleteLastSentence();
          return;
        }
        if (text === 'clear answer' || text === 'saaf karo' || text === 'clear dictation' || text.includes('साफ़ करो')) {
          clearDictation();
          return;
        }
        if (
          text.includes('confirm answer') ||
          text.includes('stop dictating') ||
          text.includes('save answer') ||
          text.includes('theek hai') ||
          text.includes('हो गया') ||
          text.includes('सेव करो')
        ) {
          stopDictating();
          return;
        }

        // Append spoken text to subjective answer
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
          text === 'ok' ||
          text.includes('हाँ') ||
          text.includes('सही है')
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
          text.includes('नहीं') ||
          text.includes('बदलो')
        ) {
          cancelPendingSelection();
          return;
        }
      }

      // ==========================================
      // 3. OPTION SELECTION (DIRECT & SNAPPY)
      // ==========================================
      const options = handlersRef.current.getCurrentOptions?.() || [];

      const selectOptionDirectly = (optIndex: number, defaultLabel: string) => {
        playEarcon('ding');
        const opt = options[optIndex];
        const label = opt ? opt.label : defaultLabel;
        if (handlersRef.current.onSelectOption) {
          handlersRef.current.onSelectOption(optIndex);
        } else {
          window.dispatchEvent(
            new CustomEvent('drishti:mock-select-option', {
              detail: { index: optIndex, label },
            })
          );
        }
        const feedback = isHindi
          ? `विकल्प ${label} चुना गया। अगला?`
          : `Option ${label} selected. Next?`;
        speak(feedback);
        announce(feedback, 'polite');
      };

      // Option A / 1 / पहला
      if (
        /^(option\s*a|opt\s*a|choose\s*a|select\s*a|answer\s*a|\ba\b|पहला|विकल्प\s*ए|ऑप्शन\s*ए|ऑप्शन\s*a|\bए\b|option\s*1)$/i.test(
          text
        ) ||
        text === 'option a' ||
        text === 'a' ||
        text === 'पहला' ||
        text === 'ऑप्शन a'
      ) {
        selectOptionDirectly(0, 'A');
        return;
      }

      // Option B / 2 / दूसरा
      if (
        /^(option\s*b|opt\s*b|choose\s*b|select\s*b|answer\s*b|\bb\b|दूसरा|विकल्प\s*बी|ऑप्शन\s*बी|ऑप्शन\s*b|\bबी\b|option\s*2)$/i.test(
          text
        ) ||
        text === 'option b' ||
        text === 'b' ||
        text === 'दूसरा' ||
        text === 'ऑप्शन b'
      ) {
        selectOptionDirectly(1, 'B');
        return;
      }

      // Option C / 3 / तीसरा
      if (
        /^(option\s*c|opt\s*c|choose\s*c|select\s*c|answer\s*c|\bc\b|तीसरा|विकल्प\s*सी|ऑप्शन\s*सी|ऑप्शन\s*c|\bसी\b|option\s*3)$/i.test(
          text
        ) ||
        text === 'option c' ||
        text === 'c' ||
        text === 'तीसरा' ||
        text === 'ऑप्शन c'
      ) {
        selectOptionDirectly(2, 'C');
        return;
      }

      // Option D / 4 / चौथा
      if (
        /^(option\s*d|opt\s*d|choose\s*d|select\s*d|answer\s*d|\bd\b|चौथा|विकल्प\s*डी|ऑप्शन\s*डी|ऑप्शन\s*d|\bडी\b|option\s*4)$/i.test(
          text
        ) ||
        text === 'option d' ||
        text === 'd' ||
        text === 'चौथा' ||
        text === 'ऑप्शन d'
      ) {
        selectOptionDirectly(3, 'D');
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
        text === 'पढ़ो' ||
        text.includes('repeat') ||
        text.includes('दोबारा')
      ) {
        if (handlersRef.current.onReadQuestion) {
          handlersRef.current.onReadQuestion();
        } else {
          window.dispatchEvent(new CustomEvent('drishti:mock-read-question'));
        }
        return;
      }

      if (
        text.includes('read options') ||
        text.includes('options') ||
        text.includes('vikalp') ||
        text.includes('ऑप्शन बताओ') ||
        text.includes('विकल्प बताओ') ||
        text.includes('choices')
      ) {
        if (handlersRef.current.onReadOptions) {
          handlersRef.current.onReadOptions();
        } else {
          // If options available in callback, read them out directly
          if (options.length > 0) {
            const optList = options.map((o) => `Option ${o.label}: ${o.text}`).join('. ');
            speak(optList);
          }
        }
        return;
      }

      // ==========================================
      // 5. NAVIGATION (NEXT / PREVIOUS / SKIP)
      // ==========================================
      if (
        text.includes('next') ||
        text.includes('agla') ||
        text.includes('अगला') ||
        text.includes('आगे') ||
        text.includes('skip') ||
        text.includes('छोड़ो')
      ) {
        playEarcon('nav');
        if (handlersRef.current.onNext) {
          handlersRef.current.onNext();
        } else {
          window.dispatchEvent(new CustomEvent('drishti:mock-next'));
        }
        return;
      }

      if (
        text.includes('previous') ||
        text.includes('back') ||
        text.includes('pichla') ||
        text.includes('pichhla') ||
        text.includes('पिछला') ||
        text.includes('पीछे')
      ) {
        playEarcon('nav');
        if (handlersRef.current.onPrevious) {
          handlersRef.current.onPrevious();
        } else {
          window.dispatchEvent(new CustomEvent('drishti:mock-previous'));
        }
        return;
      }

      // ==========================================
      // 6. STATUS / WHERE AM I / TIME
      // ==========================================
      if (
        text.includes('status') ||
        text.includes('where am i') ||
        text.includes('kahan hoon') ||
        text.includes('स्थिति') ||
        text.includes('कहाँ हूँ') ||
        text.includes('overview')
      ) {
        if (handlersRef.current.onStatus) {
          handlersRef.current.onStatus();
        } else {
          window.dispatchEvent(new CustomEvent('drishti:mock-status'));
        }
        return;
      }

      if (
        text.includes('time') ||
        text.includes('samay') ||
        text.includes('kitna time') ||
        text.includes('समय') ||
        text.includes('remaining')
      ) {
        if (handlersRef.current.onAnnounceTime) {
          handlersRef.current.onAnnounceTime();
        } else {
          window.dispatchEvent(new CustomEvent('drishti:mock-time'));
        }
        return;
      }

      // ==========================================
      // 7. EXAM ACTIONS (MARK REVIEW / CLEAR)
      // ==========================================
      if (
        text.includes('mark') ||
        text.includes('review') ||
        text.includes('flag') ||
        text.includes('मार्क') ||
        text.includes('रिव्यू')
      ) {
        playEarcon('nav');
        if (handlersRef.current.onMarkReview) {
          handlersRef.current.onMarkReview();
        } else {
          window.dispatchEvent(new CustomEvent('drishti:mock-mark-review'));
        }
        announce('Marked for review', 'polite');
        return;
      }

      if (
        text.includes('clear') ||
        text.includes('reset') ||
        text.includes('hatao') ||
        text.includes('saaf karo') ||
        text.includes('हटाओ') ||
        text.includes('साफ़')
      ) {
        playEarcon('nav');
        if (handlersRef.current.onClearAnswer) {
          handlersRef.current.onClearAnswer();
        } else {
          window.dispatchEvent(new CustomEvent('drishti:mock-clear'));
        }
        announce('Answer cleared', 'polite');
        return;
      }

      // ==========================================
      // 8. SUBMISSION SAFETY & CONFIRMATION
      // ==========================================
      if (text.includes('confirm submit') || text.includes('yes submit') || text.includes('haan submit') || text.includes('हाँ सबमिट')) {
        playEarcon('alert');
        handlersRef.current.onConfirmSubmit?.();
        return;
      }

      if (text.includes('cancel submit') || text.includes('wapas jao') || text.includes('वापस जाओ')) {
        playEarcon('nav');
        handlersRef.current.onCancelSubmit?.();
        speak(isHindi ? 'सबमिशन रद्द किया गया।' : 'Submission cancelled. Continuing examination.');
        return;
      }

      if (
        text.includes('submit') ||
        text.includes('finish') ||
        text.includes('khatam') ||
        text.includes('सबमिट') ||
        text.includes('समाप्त')
      ) {
        playEarcon('alert');
        if (handlersRef.current.onSubmit) {
          handlersRef.current.onSubmit();
        } else {
          window.dispatchEvent(new CustomEvent('drishti:mock-submit'));
        }
        return;
      }

      // ==========================================
      // 9. PLATFORM NAVIGATION
      // ==========================================
      if (handlersRef.current.onNavigate) {
        if (text.includes('dashboard') || text.includes('home') || text.includes('डैशबोर्ड')) {
          playEarcon('nav');
          handlersRef.current.onNavigate('/candidate/dashboard');
          return;
        }
        if (text.includes('mock test') || text.includes('practice test') || text.includes('मॉक टेस्ट')) {
          playEarcon('nav');
          handlersRef.current.onNavigate('/candidate/mock-tests');
          return;
        }
        if (text.includes('exam') || text.includes('pariksha') || text.includes('परीक्षा')) {
          playEarcon('nav');
          handlersRef.current.onNavigate('/candidate/exams');
          return;
        }
        if (text.includes('result') || text.includes('score') || text.includes('रिजल्ट')) {
          playEarcon('nav');
          handlersRef.current.onNavigate('/candidate/results');
          return;
        }
      }

      // If unrecognized: play gentle error tone
      playEarcon('error');
    },
    [
      isHindi,
      confirmPendingSelection,
      cancelPendingSelection,
      readBackDictation,
      readLastSentence,
      deleteLastSentence,
      clearDictation,
      startDictating,
      stopDictating,
      speak,
      announce,
    ]
  );

  const startListening = useCallback(() => {
    if (!isSupported) {
      setErrorNotice('Voice recognition is not supported in this browser. Try Chrome or Edge.');
      return;
    }

    resumeAudioContext();
    shouldListenRef.current = true;

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = preferences.language === 'hi' ? 'hi-IN' : 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
        setErrorNotice(null);
      };

      recognition.onresult = (event: any) => {
        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript;
        processTranscript(transcript);
      };

      recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          setErrorNotice(`Voice notice: ${event.error}`);
        }
      };

      recognition.onend = () => {
        // Continuous hands-free loop: If user wanted listening to be active, restart
        if (shouldListenRef.current) {
          setTimeout(() => {
            if (shouldListenRef.current) {
              try {
                recognition.start();
              } catch {
                // Busy or already restarted
              }
            }
          }, 150);
        } else {
          setIsListening(false);
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
      playEarcon('bloop');
    } catch {
      setErrorNotice('Could not start microphone voice listener.');
    }
  }, [isSupported, preferences.language, processTranscript]);

  const stopListening = useCallback(() => {
    shouldListenRef.current = false;
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
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening || shouldListenRef.current) {
      stopListening();
      announce(isHindi ? 'हैंड्स-फ्री मोड बंद किया गया।' : 'Hands-Free Scribe Mode paused.', 'polite');
    } else {
      startListening();
      announce(
        isHindi
          ? 'हैंड्स-फ्री मोड सक्रिय है। आप बोल सकते हैं।'
          : 'Hands-Free Scribe Mode active. Listening for commands.',
        'polite'
      );
    }
  }, [isListening, startListening, stopListening, announce, isHindi]);

  // Turn-Taking Protocol:
  // When system speaks, pause listening to avoid self-echo.
  // When system finishes speaking, play 'bloop' earcon and resume listening!
  useEffect(() => {
    if (!shouldListenRef.current) return;

    if (isSpeaking) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    } else {
      const timer = setTimeout(() => {
        if (shouldListenRef.current && !isSpeaking) {
          playEarcon('bloop');
          try {
            recognitionRef.current?.start();
          } catch {}
        }
      }, 180);
      return () => clearTimeout(timer);
    }
  }, [isSpeaking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      shouldListenRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
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
