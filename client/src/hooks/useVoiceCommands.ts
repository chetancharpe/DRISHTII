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
  onSkip?: () => void;
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
  // Conversational AI Platform Query Analyzer
  onVoiceQuery?: (rawText: string) => boolean | void;
}

// Global declaration for Web Speech Recognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export interface VoiceCommandOptions {
  autoStart?: boolean;
  requireConfirmation?: boolean;
}

/**
 * Universal option matcher supporting English and Hindi (Devanagari + Romanized)
 * Automatically cleans punctuation and whitespace before matching.
 */
export function matchOptionCommand(
  rawText: string,
  optionsList?: { label: string; text: string }[]
): { index: number; label: string } | null {
  if (!rawText) return null;

  // Clean punctuation and excess whitespace
  const clean = rawText
    .trim()
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()।?]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Option A
  if (
    /\b(option\s*[a1]|choose\s*[a1]|select\s*[a1]|answer\s*[a1]|mark\s*[a1]|[a1]\s*option|option\s*one|ans\s*[a1])\b/i.test(clean) ||
    /^(a|one|ek|ए|pehla|ay|eh)$/i.test(clean) ||
    /\b(a\s*option|option\s*a|vikalp\s*a|uttar\s*a|a\s*hoga|a\s*hai|a\s*lagao|a\s*chuno|a\s*lock|a\s*sahi)\b/i.test(clean) ||
    clean.includes('ऑप्शन ए') || clean.includes('ऑप्शन a') || clean.includes('ऑप्शन 1') || clean.includes('ऑप्शन एक') ||
    clean.includes('विकल्प ए') || clean.includes('विकल्प a') || clean.includes('विकल्प 1') || clean.includes('विकल्प एक') || clean.includes('पहला विकल्प') ||
    clean.includes('पहला ऑप्शन') || clean.includes('उत्तर ए') || clean.includes('ए ऑप्शन') || clean.includes('ए विकल्प') ||
    clean.includes('पहला वाला') || clean.includes('पहला') ||
    clean.includes('vikalp 1') || clean.includes('vikalp ek') || clean.includes('pehla vikalp') || clean.includes('pehla option') ||
    clean.includes('first option') || clean.includes('1st option') || clean.includes('ek number') ||
    clean.includes('option ek') || clean.includes('ए होगा') || clean.includes('ए है') ||
    clean.includes('ए लगाओ') || clean.includes('ए चुनो') || clean.includes('ए लॉक') || clean.includes('ए सही')
  ) {
    return { index: 0, label: 'A' };
  }

  // Option B
  if (
    /\b(option\s*[b2]|choose\s*[b2]|select\s*[b2]|answer\s*[b2]|mark\s*[b2]|[b2]\s*option|option\s*be|option\s*bee|option\s*two|ans\s*[b2])\b/i.test(clean) ||
    /^(b|two|do|बी|be|bee|doosra|dusra)$/i.test(clean) ||
    /\b(b\s*option|option\s*b|vikalp\s*b|uttar\s*b|b\s*hoga|b\s*hai|b\s*lagao|b\s*chuno|b\s*lock|b\s*sahi)\b/i.test(clean) ||
    clean.includes('ऑप्शन बी') || clean.includes('ऑप्शन b') || clean.includes('ऑप्शन 2') || clean.includes('ऑप्शन दो') ||
    clean.includes('विकल्प बी') || clean.includes('विकल्प b') || clean.includes('विकल्प 2') || clean.includes('विकल्प दो') || clean.includes('दूसरा विकल्प') ||
    clean.includes('दूसरा ऑप्शन') || clean.includes('उत्तर बी') || clean.includes('बी ऑप्शन') || clean.includes('बी विकल्प') ||
    clean.includes('दूसरा वाला') || clean.includes('दूसरा') ||
    clean.includes('vikalp 2') || clean.includes('vikalp do') || clean.includes('doosra vikalp') || clean.includes('dusra option') || clean.includes('doosra option') ||
    clean.includes('second option') || clean.includes('2nd option') || clean.includes('do number') ||
    clean.includes('option do') || clean.includes('बी होगा') || clean.includes('बी है') ||
    clean.includes('बी लगाओ') || clean.includes('बी चुनो') || clean.includes('बी लॉक') || clean.includes('बी सही')
  ) {
    return { index: 1, label: 'B' };
  }

  // Option C
  if (
    /\b(option\s*[c3]|choose\s*[c3]|select\s*[c3]|answer\s*[c3]|mark\s*[c3]|[c3]\s*option|option\s*see|option\s*three|ans\s*[c3])\b/i.test(clean) ||
    /^(c|three|teen|सी|see|sea|si|teesra|tisra)$/i.test(clean) ||
    /\b(c\s*option|option\s*c|vikalp\s*c|uttar\s*c|c\s*hoga|c\s*hai|c\s*lagao|c\s*chuno|c\s*lock|c\s*sahi)\b/i.test(clean) ||
    clean.includes('ऑप्शन सी') || clean.includes('ऑप्शन c') || clean.includes('ऑप्शन 3') || clean.includes('ऑप्शन तीन') ||
    clean.includes('विकल्प सी') || clean.includes('विकल्प c') || clean.includes('विकल्प 3') || clean.includes('विकल्प तीन') || clean.includes('तीसरा विकल्प') ||
    clean.includes('तीसरा ऑप्शन') || clean.includes('उत्तर सी') || clean.includes('सी ऑप्शन') || clean.includes('सी विकल्प') ||
    clean.includes('तीसरा वाला') || clean.includes('तीसरा') ||
    clean.includes('vikalp 3') || clean.includes('vikalp teen') || clean.includes('teesra vikalp') || clean.includes('teesra option') ||
    clean.includes('third option') || clean.includes('3rd option') || clean.includes('teen number') ||
    clean.includes('option teen') || clean.includes('सी होगा') || clean.includes('सी है') ||
    clean.includes('सी लगाओ') || clean.includes('सी चुनो') || clean.includes('सी लॉक') || clean.includes('सी सही')
  ) {
    return { index: 2, label: 'C' };
  }

  // Option D
  if (
    /\b(option\s*[d4]|choose\s*[d4]|select\s*[d4]|answer\s*[d4]|mark\s*[d4]|[d4]\s*option|option\s*four|ans\s*[d4])\b/i.test(clean) ||
    /^(d|four|char|chaar|डी|dee|chautha)$/i.test(clean) ||
    /\b(d\s*option|option\s*d|vikalp\s*d|uttar\s*d|d\s*hoga|d\s*hai|d\s*lagao|d\s*chuno|d\s*lock|d\s*sahi)\b/i.test(clean) ||
    clean.includes('ऑप्शन डी') || clean.includes('ऑप्शन d') || clean.includes('ऑप्शन 4') || clean.includes('ऑप्शन चार') ||
    clean.includes('विकल्प डी') || clean.includes('विकल्प d') || clean.includes('विकल्प 4') || clean.includes('विकल्प चार') || clean.includes('चौथा विकल्प') ||
    clean.includes('चौथा ऑप्शन') || clean.includes('उत्तर डी') || clean.includes('डी ऑप्शन') || clean.includes('डी विकल्प') ||
    clean.includes('चौथा वाला') || clean.includes('चौथा') ||
    clean.includes('vikalp 4') || clean.includes('vikalp char') || clean.includes('chautha vikalp') || clean.includes('chautha option') ||
    clean.includes('fourth option') || clean.includes('4th option') || clean.includes('char number') || clean.includes('chaar number') ||
    clean.includes('option char') || clean.includes('डी होगा') || clean.includes('डी है') ||
    clean.includes('डी लगाओ') || clean.includes('डी चुनो') || clean.includes('डी लॉक') || clean.includes('डी सही')
  ) {
    return { index: 3, label: 'D' };
  }

  // Fallback: If candidate speaks the text of the option
  if (optionsList && optionsList.length > 0) {
    for (let i = 0; i < optionsList.length; i++) {
      const opt = optionsList[i];
      if (opt.text && opt.text.trim().length > 1) {
        const optClean = opt.text.toLowerCase().trim().replace(/[.,/#!$%^&*;:{}=\-_`~()।?]/g, '');
        if (clean === optClean || clean.includes(optClean) || (clean.length > 3 && optClean.includes(clean))) {
          return { index: i, label: opt.label || ['A', 'B', 'C', 'D'][i] };
        }
      }
    }
  }

  return null;
}

interface SubscriberState {
  isListening: boolean;
  lastCommand: string | null;
  errorNotice: string | null;
}

interface Subscriber {
  id: string;
  handlersRef: React.MutableRefObject<VoiceCommandHandlers>;
  optionsRef: React.MutableRefObject<VoiceCommandOptions>;
  onStateChange: (state: SubscriberState) => void;
  onTranscript: (transcript: string) => boolean;
}

/**
 * Global Singleton Voice Recognition Manager.
 * Solves the Chromium single-recognition limitation by multiplexing all components
 * (HandsFreeScribeHUD, PracticeSessionPage, LiveExamSessionPage) through one persistent recognizer.
 */
class GlobalVoiceRecognitionManager {
  private recognition: any = null;
  private isListening = false;
  private subscribers = new Set<Subscriber>();
  private restartTimer: any = null;
  private lastHandled = { text: '', time: 0 };
  private currentLanguage = 'en';

  setLanguage(lang: string) {
    const newLang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    this.currentLanguage = lang;
    if (this.recognition && this.recognition.lang !== newLang) {
      this.recognition.lang = newLang;
    }
  }

  register(subscriber: Subscriber) {
    this.subscribers.add(subscriber);

    subscriber.onStateChange({
      isListening: this.isListening,
      lastCommand: null,
      errorNotice: null,
    });

    if (subscriber.optionsRef.current.autoStart && !this.isListening) {
      this.start();
    }

    return () => {
      this.subscribers.delete(subscriber);
      if (this.subscribers.size === 0) {
        this.stop();
      }
    };
  }

  async start() {
    const isSupported =
      typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
    if (!isSupported) {
      this.notifyState({
        isListening: false,
        lastCommand: null,
        errorNotice: 'Voice recognition not supported in this browser.',
      });
      return;
    }

    this.isListening = true;
    this.notifyState({ isListening: true, lastCommand: null, errorNotice: null });

    this.runRecognition();
  }

  private runRecognition() {
    if (!this.isListening) return;

    if (this.recognition) {
      try {
        this.recognition.onend = null;
        this.recognition.onerror = null;
        this.recognition.abort();
      } catch {}
      this.recognition = null;
    }

    const SpeechRecognitionClass =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionClass) return;

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = this.currentLanguage === 'hi' ? 'hi-IN' : 'en-IN';

      recognition.onstart = () => {
        this.notifyState({ isListening: true, lastCommand: null, errorNotice: null });
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

        const candidateText = final.trim() || interim.trim();
        if (candidateText) {
          this.dispatchTranscript(candidateText);
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          this.notifyState({
            isListening: this.isListening,
            lastCommand: null,
            errorNotice: `Voice notice: ${event.error}`,
          });
        }
      };

      recognition.onend = () => {
        if (this.isListening) {
          clearTimeout(this.restartTimer);
          this.restartTimer = setTimeout(() => {
            if (this.isListening) {
              this.runRecognition();
            }
          }, 300);
        } else {
          this.notifyState({ isListening: false, lastCommand: null, errorNotice: null });
        }
      };

      recognition.start();
      this.recognition = recognition;
    } catch (err) {
      console.warn('SpeechRecognition start notice:', err);
    }
  }

  stop() {
    this.isListening = false;
    clearTimeout(this.restartTimer);

    if (this.recognition) {
      try {
        this.recognition.onend = null;
        this.recognition.onerror = null;
        this.recognition.stop();
      } catch {}
      this.recognition = null;
    }

    this.notifyState({ isListening: false, lastCommand: null, errorNotice: null });
  }

  toggle() {
    if (this.isListening) {
      this.stop();
    } else {
      this.start();
    }
  }

  private notifyState(state: SubscriberState) {
    for (const sub of this.subscribers) {
      sub.onStateChange(state);
    }
  }

  /**
   * Detects if speech recognition output is acoustic speaker leakage from ongoing TTS playback
   * (e.g. computer reading multiple options, question statement, or platform prompt aloud)
   * vs an intentional, concise user command/barge-in.
   */
  private isSpeakerAcousticEcho(rawText: string): boolean {
    const text = rawText.trim().toLowerCase();
    if (!text) return true;

    // 1. Multiple options mentioned in the same phrase -> 100% choices prompt readout
    const hasA = /\b(option\s*[a1]|ऑप्शन\s*[एa1]|विकल्प\s*[एa1])\b/i.test(text);
    const hasB = /\b(option\s*[b2]|ऑप्शन\s*[बीb2]|विकल्प\s*[बीb2])\b/i.test(text);
    const hasC = /\b(option\s*[c3]|ऑप्शन\s*[सीc3]|विकल्प\s*[सीc3])\b/i.test(text);
    const hasD = /\b(option\s*[d4]|ऑप्शन\s*[डीd4]|विकल्प\s*[डीd4])\b/i.test(text);
    const optionMatches = (hasA ? 1 : 0) + (hasB ? 1 : 0) + (hasC ? 1 : 0) + (hasD ? 1 : 0);
    if (optionMatches >= 2) {
      return true;
    }

    // 2. Specific prompt phrases spoken by AI
    const promptPhrases = [
      'choose your answer',
      'अपना उत्तर चुनिए',
      'अपना उत्तर चुनें',
      'the options are',
      'विकल्प हैं',
      'विकल्प इस प्रकार हैं',
      'question number',
      'प्रश्न संख्या',
      'कुल 10 में से',
      'say next to continue',
      'say next to proceed',
      'अगले सवाल के लिए बोलिए',
      'say confirm or say change',
      'पुष्टि के लिए',
      'welcome to drishti',
      'दृष्टि में आपका स्वागत',
      'options available',
      'विकल्प उपलब्ध हैं',
      'you selected option',
      'आपने विकल्प',
      'say any option',
      'bol sakte hain',
      'बोल सकते हैं',
    ];

    for (const phrase of promptPhrases) {
      if (text.includes(phrase)) {
        return true;
      }
    }

    // 3. Substring of currently spoken utterance (if long prose)
    const activeUtterance =
      typeof window !== 'undefined'
        ? (window as any).__drishti_active_utterance?.text
        : null;

    if (activeUtterance && typeof activeUtterance === 'string') {
      const activeClean = activeUtterance.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()।?]/g, ' ');
      const textClean = text.replace(/[.,/#!$%^&*;:{}=\-_`~()।?]/g, ' ').trim();
      const wordCount = textClean.split(/\s+/).filter(Boolean).length;

      // If mic hears a long phrase (> 4 words) that is directly inside active utterance text,
      // it is acoustic leakage of the question or paragraph being read.
      if (wordCount >= 4 && activeClean.includes(textClean)) {
        return true;
      }
    }

    return false;
  }

  private dispatchTranscript(rawText: string) {
    const text = rawText.trim().toLowerCase();
    const now = Date.now();

    // Debounce duplicate commands within 1000ms
    if (this.lastHandled.text === text && now - this.lastHandled.time < 1000) {
      return;
    }

    const isSpeaking =
      typeof window !== 'undefined' &&
      'speechSynthesis' in window &&
      (window.speechSynthesis.speaking || window.speechSynthesis.pending);

    if (isSpeaking) {
      // 1. Filter out microphone acoustic feedback / prompt echo:
      if (this.isSpeakerAcousticEcho(text)) {
        return;
      }

      // 2. Candidate Voice Barge-In:
      // Candidate is intentionally speaking a command/option/interruption while AI is talking.
      // Immediately cancel speech synthesis so the candidate takes top priority:
      try {
        window.speechSynthesis.cancel();
        (window as any).__drishti_active_utterance = null;
      } catch {}
    }

    // Notify all subscribers of the last recognized command
    for (const sub of this.subscribers) {
      sub.onStateChange({
        isListening: this.isListening,
        lastCommand: rawText,
        errorNotice: null,
      });
    }

    // Iterate in reverse so the most recently mounted session component (e.g. PracticeSessionPage)
    // takes precedence over the global PageLayout HUD (e.g. HandsFreeScribeHUD)
    const subsArray = Array.from(this.subscribers).reverse();
    for (const sub of subsArray) {
      const handled = sub.onTranscript(rawText);
      if (handled) {
        this.lastHandled = { text, time: now };
        return;
      }
    }
  }
}

export const globalVoiceManager = new GlobalVoiceRecognitionManager();

export function useVoiceCommands(
  handlers: VoiceCommandHandlers,
  optionsConfig: VoiceCommandOptions = {}
) {
  const { announce, speak, preferences } = useAccessibility();
  const [isListening, setIsListening] = useState(false);
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Scribe MCQ confirmation state
  const [pendingSelection, setPendingSelection] = useState<PendingOptionSelection | null>(null);

  // Scribe Subjective Dictation state
  const [isDictating, setIsDictating] = useState<boolean>(false);
  const [dictatedText, setDictatedText] = useState<string>('');

  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const optionsRef = useRef(optionsConfig);
  optionsRef.current = optionsConfig;

  const pendingRef = useRef(pendingSelection);
  pendingRef.current = pendingSelection;

  const isDictatingRef = useRef(isDictating);
  isDictatingRef.current = isDictating;

  const dictatedTextRef = useRef(dictatedText);
  dictatedTextRef.current = dictatedText;

  const isSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // Sync language with global manager
  useEffect(() => {
    globalVoiceManager.setLanguage(preferences?.language || 'en');
  }, [preferences?.language]);

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

  // Dispatch processor for this subscriber
  const handleTranscript = useCallback(
    (rawTranscript: string): boolean => {
      const rawText = rawTranscript.trim();
      const text = rawText.toLowerCase();

      // ==========================================
      // 1. DICTATION MODE PARSING
      // ==========================================
      if (isDictatingRef.current) {
        if (text.includes('read back') || text.includes('read answer') || text.includes('sunao') || text.includes('read whole answer')) {
          readBackDictation();
          return true;
        }
        if (text.includes('read last sentence') || text.includes('last sentence sunao')) {
          readLastSentence();
          return true;
        }
        if (text.includes('delete last sentence') || text.includes('remove last sentence') || text.includes('undo last sentence') || text.includes('aakhri sentence hatao')) {
          deleteLastSentence();
          return true;
        }
        if (text === 'clear answer' || text === 'saaf karo' || text === 'clear dictation') {
          clearDictation();
          return true;
        }
        if (text.includes('confirm answer') || text.includes('stop dictating') || text.includes('save answer') || text.includes('theek hai')) {
          stopDictating();
          return true;
        }

        // Append spoken text to subjective answer
        const current = dictatedTextRef.current;
        const updated = current ? `${current} ${rawText}` : rawText;
        setDictatedText(updated);
        handlersRef.current.onSubjectiveAnswerChange?.(updated);
        return true;
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
          return true;
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
          return true;
        }
      }

      // ==========================================
      // 3. OPTION SELECTION (DIRECT OR CONFIRMATION)
      // ==========================================
      const optionsList = handlersRef.current.getCurrentOptions?.() || [];
      const matchedOpt = matchOptionCommand(text, optionsList);

      if (matchedOpt) {
        // Barge-in: immediately cancel ongoing speech
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }

        const opt = optionsList[matchedOpt.index];
        const label = opt ? opt.label : matchedOpt.label;

        if (optionsRef.current.requireConfirmation) {
          const optText = opt ? opt.text : `Option ${label}`;
          const pendingObj: PendingOptionSelection = {
            optionIndex: matchedOpt.index,
            label: label,
            text: optText,
          };
          setPendingSelection(pendingObj);

          const isHindi = preferences?.language === 'hi';
          const prompt = isHindi
            ? `आपने विकल्प ${label} चुना है: ${optText}। पुष्टि के लिए 'हाँ' या 'कन्फर्म' बोलें, या बदलने के लिए 'बदलो' बोलें।`
            : `You selected Option ${label}: ${optText}. Say confirm or say change.`;
          speak(prompt);
          announce(prompt, 'assertive');
          return true;
        }

        // Direct execution (Default): Immediately select option and evaluate
        setPendingSelection(null);
        handlersRef.current.onSelectOption?.(matchedOpt.index);

        // Broadcast custom events for candidate session components (Practice, Mock, Exam)
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('drishti:practice-select-option', {
              detail: { label, index: matchedOpt.index },
            })
          );
          window.dispatchEvent(
            new CustomEvent('drishti:mock-select-option', {
              detail: { label, index: matchedOpt.index },
            })
          );
          window.dispatchEvent(
            new CustomEvent('drishti:exam-select-option', {
              detail: { label, index: matchedOpt.index },
            })
          );
        }
        return true;
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
        text.includes('दोबारा') ||
        text.includes('phir se padho')
      ) {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
        handlersRef.current.onReadQuestion?.();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('drishti:practice-read-question'));
          window.dispatchEvent(new CustomEvent('drishti:mock-read-question'));
        }
        return true;
      }

      if (
        text.includes('read options') ||
        text.includes('options') ||
        text.includes('vikalp') ||
        text.includes('ऑप्शन बताओ') ||
        text.includes('विकल्प पढ़ो')
      ) {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
        handlersRef.current.onReadOptions?.();
        return true;
      }

      // ==========================================
      // 5. GENERAL NAVIGATION & TIME COMMANDS
      // ==========================================
      if (
        text.includes('next') || text.includes('agla') || text.includes('अगला') || text.includes('आगे') ||
        text === 'agla' || text === 'next question' || text === 'अगला सवाल'
      ) {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
        announce('Voice command: Next', 'polite');
        handlersRef.current.onNext?.();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('drishti:practice-next'));
          window.dispatchEvent(new CustomEvent('drishti:mock-next'));
          window.dispatchEvent(new CustomEvent('drishti:exam-next'));
        }
        return true;
      }

      if (
        text.includes('previous') || text.includes('back') || text.includes('pichhla') || text.includes('पिछला') || text.includes('पीछे') ||
        text === 'pichhla' || text === 'previous question' || text === 'पिछला सवाल'
      ) {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
        announce('Voice command: Previous', 'polite');
        handlersRef.current.onPrevious?.();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('drishti:practice-previous'));
          window.dispatchEvent(new CustomEvent('drishti:mock-previous'));
          window.dispatchEvent(new CustomEvent('drishti:exam-previous'));
        }
        return true;
      }

      if (text.includes('mark') || text.includes('review') || text.includes('flag') || text.includes('मार्क') || text.includes('निशान')) {
        announce('Voice command: Marked for review', 'polite');
        handlersRef.current.onMarkReview?.();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('drishti:mock-mark-review'));
        }
        return true;
      }

      // Universal Skip Question Command
      if (
        text.includes('skip') ||
        text.includes('chhod do') ||
        text.includes('chhor do') ||
        text.includes('chhodo') ||
        text.includes('छोड़ो') ||
        text.includes('छोड़ दें') ||
        text.includes('chhod do sawal') ||
        text === 'skip question' ||
        text === 'अगला छोड़ो'
      ) {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          (window as any).__drishti_active_utterance = null;
        }
        announce('Voice command: Skip', 'polite');
        handlersRef.current.onSkip?.();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('drishti:practice-skip'));
          window.dispatchEvent(new CustomEvent('drishti:mock-skip'));
        }
        return true;
      }

      // Universal Stop Audio / Silence Command
      if (
        text === 'stop' ||
        text === 'ruko' ||
        text === 'रुको' ||
        text === 'pause' ||
        text === 'chup' ||
        text === 'चुप' ||
        text === 'quiet' ||
        text === 'शांत' ||
        text.includes('stop audio') ||
        text.includes('आवाज बंद') ||
        text.includes('band karo')
      ) {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          (window as any).__drishti_active_utterance = null;
        }
        announce('Audio paused', 'polite');
        if (handlersRef.current.onPauseAudio) {
          handlersRef.current.onPauseAudio();
        }
        return true;
      }

      if (text.includes('clear') || text.includes('reset') || text.includes('saaf karo') || text.includes('हटाओ') || text.includes('साफ करो')) {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
        announce('Voice command: Cleared answer', 'polite');
        handlersRef.current.onClearAnswer?.();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('drishti:mock-clear'));
        }
        return true;
      }

      if (text.includes('confirm submit') || text.includes('yes submit') || text.includes('haan submit') || text.includes('हाँ सबमिट')) {
        handlersRef.current.onConfirmSubmit?.();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('drishti:mock-confirm-submit'));
        }
        return true;
      }

      if (text.includes('cancel submit') || text.includes('वापस जाओ')) {
        handlersRef.current.onCancelSubmit?.();
        return true;
      }

      if (text.includes('submit') || text.includes('finish') || text.includes('सबमिट') || text.includes('समाप्त')) {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
        announce('Voice command: Submit', 'polite');
        handlersRef.current.onSubmit?.();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('drishti:practice-submit'));
          window.dispatchEvent(new CustomEvent('drishti:mock-submit'));
        }
        return true;
      }

      if (text.includes('status') || text.includes('where am i') || text.includes('kahan hoon') || text.includes('स्थिति')) {
        if (handlersRef.current.onStatus) {
          handlersRef.current.onStatus();
          return true;
        }
      }

      if (text.includes('time') || text.includes('samay') || text.includes('kitna time') || text.includes('remaining') || text.includes('समय') || text.includes('समय बताओ')) {
        if (handlersRef.current.onAnnounceTime) {
          handlersRef.current.onAnnounceTime();
          return true;
        }
      }

      if (text.includes('dictate') || text.includes('scribe')) {
        startDictating();
        return true;
      }

      if (text.includes('play') || text.includes('start audio') || text.includes('listen')) {
        if (handlersRef.current.onPlayAudio) {
          announce('Voice command: Play audio', 'polite');
          handlersRef.current.onPlayAudio();
          return true;
        }
      }

      if (text.includes('pause') || text.includes('stop audio')) {
        if (handlersRef.current.onPauseAudio) {
          announce('Voice command: Pause audio', 'polite');
          handlersRef.current.onPauseAudio();
          return true;
        }
      }

      if (text.includes('bookmark') || text.includes('save note')) {
        if (handlersRef.current.onAddBookmark) {
          announce('Voice command: Added bookmark', 'polite');
          handlersRef.current.onAddBookmark();
          return true;
        }
      }

      // Conversational AI Intent & Platform Analysis Handler
      if (handlersRef.current.onVoiceQuery) {
        const handled = handlersRef.current.onVoiceQuery(rawTranscript);
        if (handled !== false) {
          return true;
        }
      }

      if (handlersRef.current.onNavigate) {
        if (text.includes('dashboard') || text.includes('home') || text.includes('डैशबोर्ड')) {
          handlersRef.current.onNavigate('/candidate/dashboard');
          return true;
        }
        if (text.includes('mock test') || text.includes('मॉक टेस्ट')) {
          handlersRef.current.onNavigate('/candidate/mock-tests');
          return true;
        }
        if (text.includes('exam') || text.includes('परीक्षा')) {
          handlersRef.current.onNavigate('/candidate/exams');
          return true;
        }
        if (text.includes('result') || text.includes('रिजल्ट')) {
          handlersRef.current.onNavigate('/candidate/results');
          return true;
        }
      }

      return false;
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

  // Register with Global Voice Manager
  useEffect(() => {
    const subscriberId = Math.random().toString(36).substring(2, 9);
    const unregister = globalVoiceManager.register({
      id: subscriberId,
      handlersRef,
      optionsRef,
      onStateChange: (state) => {
        setIsListening(state.isListening);
        if (state.lastCommand) setLastCommand(state.lastCommand);
        if (state.errorNotice !== undefined) setErrorNotice(state.errorNotice);
      },
      onTranscript: handleTranscript,
    });

    return unregister;
  }, [handleTranscript]);

  const startListening = useCallback(async () => {
    await globalVoiceManager.start();
  }, []);

  const stopListening = useCallback(() => {
    globalVoiceManager.stop();
  }, []);

  const toggleListening = useCallback(() => {
    globalVoiceManager.toggle();
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
