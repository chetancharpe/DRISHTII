import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAccessibility } from '../contexts/AccessibilityContext';
import { useAuth } from '../hooks/useAuth';
import { playEarcon } from '../utils/soundEffects';
import { resolveSectionDescriptor, SectionContext } from '../services/candidateSectionExplainer';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export interface CandidateVoiceState {
  isListening: boolean;
  isActuallyRecognizing: boolean;
  isSupported: boolean;
  hasPermissionError: boolean;
  liveTranscript: string;
  lastTranscript: string | null;
  lastActionFeedback: string | null;
  activeSectionName: string;
  toggleListening: () => Promise<void>;
  requestMicPermission: () => Promise<boolean>;
  speakPageGuidance: () => void;
  speakAvailableCommands: () => void;
  speakSectionExplanation: () => void;
  speakSectionOptions: () => void;
}

/**
 * Unicode-aware phrase boundary matching for multilingual (English + Devanagari) speech transcripts.
 * Standard JS RegExp \b ONLY matches ASCII \w ([a-zA-Z0-9_]), so \b will fail on Devanagari script.
 */
export function hasPhrase(text: string, phrases: string[]): boolean {
  if (!text || !phrases || phrases.length === 0) return false;
  const clean = text.trim().toLowerCase();
  for (const p of phrases) {
    if (!p) continue;
    const phraseLower = p.trim().toLowerCase();
    if (!phraseLower) continue;
    if (clean === phraseLower) return true;
    const escaped = phraseLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const rx = new RegExp(`(?:^|[^a-zA-Z0-9\\u0900-\\u097F])${escaped}(?:[^a-zA-Z0-9\\u0900-\\u097F]|$)`, 'iu');
    if (rx.test(clean)) return true;
  }
  return false;
}

export function useCandidateVoiceNavigator(): CandidateVoiceState {
  const navigate = useNavigate();
  const location = useLocation();
  const { speak, stopSpeaking, announce, openCalibration, preferences, setHighContrast, setFontSize, setPreferredLanguage } = useAccessibility();
  const { user, logout } = useAuth();

  const [isListening, setIsListening] = useState<boolean>(() => {
    try {
      const stored = sessionStorage.getItem('drishti_candidate_voice_active');
      return stored !== null ? stored === 'true' : true;
    } catch {
      return true;
    }
  });

  const [isActuallyRecognizing, setIsActuallyRecognizing] = useState<boolean>(false);
  const [hasPermissionError, setHasPermissionError] = useState<boolean>(false);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [lastTranscript, setLastTranscript] = useState<string | null>(null);
  const [lastActionFeedback, setLastActionFeedback] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef<boolean>(isListening);
  isListeningRef.current = isListening;

  const lastExecutedTextRef = useRef<string>('');
  const lastExecutedTimeRef = useRef<number>(0);
  const restartTimerRef = useRef<any>(null);
  const executeCommandRef = useRef<(raw: string) => void>(() => {});
  const createAndStartRef = useRef<() => void>(() => {});

  const isSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // 1. Universal Section Context for resolving active screen elements
  const getSectionContext = useCallback(
    (): SectionContext => ({
      navigate,
      speak,
      preferences,
      setHighContrast,
      setFontSize,
      userName: user?.name ? user.name.split(' ')[0] : 'Candidate',
    }),
    [navigate, speak, preferences, setHighContrast, setFontSize, user]
  );

  const activeSectionDescriptor = resolveSectionDescriptor(location.pathname, getSectionContext());
  const activeSectionName = activeSectionDescriptor.name;

  // 2. Spoken Guidance for each Candidate Section
  const getPageGuidance = useCallback(
    (path: string): string => {
      try {
        const descriptor = resolveSectionDescriptor(path, getSectionContext());
        return descriptor.introSpeech;
      } catch {
        return 'Candidate Workspace. Say Dashboard, Learn, Practice, Exams, Results, or Help.';
      }
    },
    [getSectionContext]
  );

  // 3. Announce available commands
  const speakAvailableCommands = useCallback(() => {
    playEarcon('action');
    const isHindi = preferences?.language === 'hi';
    const helpText = isHindi
      ? "दृष्टि वॉयस नेविगेशन सहायता: आप बोल सकते हैं - 'विकल्प 1', 'विकल्प 2' स्क्रीन चुनने के लिए। 'पढ़ाई' पाठ्यक्रम के लिए। 'अभ्यास' सवाल हल करने के लिए। 'मॉक टेस्ट' टेस्ट देने के लिए। 'डैशबोर्ड' घर जाने के लिए। 'अगला' अगले सवाल के लिए। 'पिछला' पिछले सवाल के लिए। 'सवाल पढ़ो' सवाल सुनने के लिए। 'भाषा बदलो' हिंदी या इंग्लिश करने के लिए। आवाज़ रोकने के लिए 'रुको' बोलें।"
      : "Voice commands: Say 'Option 1', 'Option 2', 'Option 3' to select screen elements. Say 'Learn' to view curriculum subjects. Say 'Practice' to practice questions. Say 'Dashboard' to go home. Say 'Exams' to view examinations. Say 'Mock Tests' for mock tests catalog. Say 'Results' for scorecards. Say 'Explain' to describe this section. Say 'Repeat' to hear options again. Say 'Switch to Hindi' to change language. Say 'Stop' to silence audio.";
    speak(helpText);
    announce(helpText, 'polite');
    setLastActionFeedback('Reading voice commands list.');
  }, [speak, announce]);

  // 4. Announce section explanation on demand
  const speakSectionExplanation = useCallback(() => {
    playEarcon('recognize');
    const descriptor = resolveSectionDescriptor(location.pathname, getSectionContext());
    speak(descriptor.introSpeech);
    announce(descriptor.introSpeech, 'polite');
    setLastActionFeedback(`Explaining ${descriptor.name}.`);
  }, [location.pathname, getSectionContext, speak, announce]);

  // 5. Announce section options summary on demand
  const speakSectionOptions = useCallback(() => {
    playEarcon('action');
    const descriptor = resolveSectionDescriptor(location.pathname, getSectionContext());
    speak(descriptor.elementsSummary);
    announce(descriptor.elementsSummary, 'polite');
    setLastActionFeedback(`Reading options for ${descriptor.name}.`);
  }, [location.pathname, getSectionContext, speak, announce]);

  const speakPageGuidance = useCallback(() => {
    speakSectionExplanation();
  }, [speakSectionExplanation]);

  // 4. Request microphone permission explicitly via getUserMedia
  const requestMicPermission = useCallback(async (): Promise<boolean> => {
    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      return false;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setHasPermissionError(false);
      setIsListening(true);
      isListeningRef.current = true;
      try {
        sessionStorage.setItem('drishti_candidate_voice_active', 'true');
      } catch {}
      createAndStartRef.current?.();
      return true;
    } catch (err) {
      console.warn('Microphone permission request rejected:', err);
      setHasPermissionError(true);
      return false;
    }
  }, []);

  // 5. High-Precision Command Matcher (Unicode Boundary & Bilingual Intent Engine)
  const executeCommand = useCallback(
    (rawTranscript: string) => {
      const cleanText = rawTranscript
        .toLowerCase()
        .replace(/[.,!?;:'"–—।॥-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (!cleanText) return;

      const words = cleanText.split(/\s+/).filter(Boolean);

      // Debounce: prevent executing the same utterance twice within 1.5s
      const now = Date.now();
      if (cleanText === lastExecutedTextRef.current && now - lastExecutedTimeRef.current < 1500) {
        return;
      }

      setLastTranscript(rawTranscript);
      const isHindi = preferences?.language === 'hi';

      // ==========================================
      // 0. EXPLICIT VOICE LANGUAGE SWITCHING & AUTO-ADAPTATION
      // ==========================================
      const isSwitchToHindi =
        hasPhrase(cleanText, [
          'hindi', 'हिन्दी', 'हिंदी', 'hindi me karo', 'hindi me bolo', 'hindi bhasha',
          'hindi chuno', 'hindi badlo', 'hindi set karo', 'switch to hindi', 'change to hindi',
          'हिंदी में करो', 'हिंदी में बोलो', 'हिंदी चुनो', 'हिंदी बदलो', 'हिंदी करो', 'हिंदी भाषा',
          'भाषा हिंदी', 'भाषा बदलो', 'हिंदी चाहिए'
        ]) ||
        (hasPhrase(cleanText, ['hindi', 'हिन्दी', 'हिंदी']) &&
          hasPhrase(cleanText, [
            'switch', 'change', 'karo', 'bolo', 'chuno', 'badlo', 'set', 'lagao', 'kijiye',
            'chahiye', 'language', 'bhasha', 'boliye', 'करो', 'बोलो', 'चुनो', 'बदलो', 'भाषा',
            'कीजिए', 'चाहिए'
          ]));

      const isSwitchToEnglish =
        hasPhrase(cleanText, [
          'english', 'अंग्रेजी', 'इंग्लिश', 'english me bolo', 'english me karo', 'english language',
          'switch to english', 'change to english', 'अंग्रेजी में बोलो', 'अंग्रेजी में करो',
          'इंग्लिश में बोलो', 'इंग्लिश में करो', 'अंग्रेजी चुनो', 'अंग्रेजी भाषा', 'अंग्रेजी करो'
        ]) ||
        (hasPhrase(cleanText, ['english', 'अंग्रेजी', 'इंग्लिश']) &&
          hasPhrase(cleanText, [
            'switch', 'change', 'karo', 'bolo', 'chuno', 'badlo', 'set', 'lagao', 'kijiye',
            'chahiye', 'language', 'bhasha', 'boliye', 'करो', 'बोलो', 'चुनो', 'बदलो', 'भाषा',
            'कीजिए', 'चाहिए'
          ]));

      if (isSwitchToHindi) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        setPreferredLanguage('hi');
        const feedback = 'भाषा बदलकर हिन्दी कर दी गई है। स्क्रीन और सभी सवाल अब हिन्दी में हैं।';
        speak(feedback);
        announce(feedback, 'assertive');
        setLastActionFeedback('भाषा: हिन्दी (Hindi)');
        setLiveTranscript('');
        return;
      }

      if (isSwitchToEnglish) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        setPreferredLanguage('en');
        const feedback = 'Language changed to English. Screen and voice prompts are now in English.';
        speak(feedback);
        announce(feedback, 'assertive');
        setLastActionFeedback('Language: English');
        setLiveTranscript('');
        return;
      }

      // Smart Voice Auto-Adaptation: If candidate speaks Devanagari or pure Hindi phrases while in English mode, auto-switch to Hindi
      if (!isHindi && (
        /[\u0900-\u097F]/.test(rawTranscript) ||
        hasPhrase(cleanText, [
          'agla sawal', 'pichhla sawal', 'sawal padho', 'abhyas shuru', 'madad karo', 'vikalp',
          'padhai kholo', 'samay kitna', 'hindi', 'namaste', 'shuru karo'
        ])
      )) {
        setPreferredLanguage('hi');
      }

      // Conversational Filter:
      // If candidate speaks 6 or more words, ensure it has a clear intent word
      const isLongUtterance = words.length >= 6;
      const hasCommandIntent = hasPhrase(cleanText, [
        'option', 'vikalp', 'choice', 'answer', 'next', 'previous', 'agla', 'pichhla', 'back', 'aage', 'piche',
        'learn', 'practice', 'dashboard', 'exam', 'exams', 'pariksha', 'mock', 'mocks', 'result', 'results',
        'score', 'scores', 'progress', 'help', 'madad', 'read', 'padho', 'repeat', 'explain', 'sunao', 'mark',
        'review', 'flag', 'clear', 'mitao', 'reset', 'submit', 'finish', 'khatam', 'time', 'samay', 'stop', 'ruko',
        'quiet', 'mute', 'chup', 'shant', 'band', 'open', 'go to', 'take me to', 'navigate', 'show', 'start',
        'kholo', 'chalo', 'jao', 'drishti', 'please', 'karna', 'chahiye', 'select', 'choose', 'chuno', 'pehle',
        'pehla', 'dusra', 'teesra', 'chautha',
        'सवाल', 'विकल्प', 'अगला', 'पिछला', 'पढ़ाई', 'अभ्यास', 'मदद', 'सहायता', 'सबमिट', 'कन्फर्म', 'मॉक',
        'रिजल्ट', 'डैशबोर्ड', 'होम', 'रुको', 'शांत', 'चुप', 'हिंदी', 'अंग्रेजी', 'खोलो', 'शुरू', 'चलो', 'बताओ',
        'सुनाओ', 'दिखाओ', 'जाओ', 'चुनो', 'पहला', 'दूसरा', 'तीसरा', 'चौथा', 'पांचवां', 'छठा', 'सातवां'
      ]);

      if (isLongUtterance && !hasCommandIntent) {
        setLastActionFeedback(`Conversational speech noted: "${rawTranscript}". Say a direct command like "Learn" or "Open Practice".`);
        return;
      }

      // ==========================================
      // A. STOP SPEECH SYNTHESIS / MUTE AUDIO
      // ==========================================
      if (hasPhrase(cleanText, [
        'stop', 'mute', 'quiet', 'silence', 'chup', 'shant', 'ruko', 'band karo',
        'शांत', 'रुको', 'चुप', 'आवाज़ बंद', 'बंद करो', 'रोको'
      ])) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        stopSpeaking();
        playEarcon('pause');
        setLastActionFeedback(isHindi ? 'आवाज़ म्यूट' : 'Speech muted.');
        setLiveTranscript('');
        return;
      }

      // ==========================================
      // B. MICROPHONE PAUSE
      // ==========================================
      if (hasPhrase(cleanText, [
        'stop listening', 'turn off mic', 'mic band', 'pause voice', 'pause mic',
        'माइक बंद', 'माइक रोको', 'माइक बंद करो'
      ])) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        setIsListening(false);
        try {
          sessionStorage.setItem('drishti_candidate_voice_active', 'false');
        } catch {}
        playEarcon('pause');
        speak(isHindi ? 'वॉयस असिस्टेंट रोक दिया गया है। पुनः चालू करने के लिए ऑल्ट और वी दबाएं।' : 'Voice assistant paused. Press Alt plus V to resume listening.');
        announce('Voice assistant paused.', 'polite');
        setLastActionFeedback('Microphone paused (Alt+V to resume).');
        setLiveTranscript('');
        return;
      }

      // ==========================================
      // C. ACTIVE PRACTICE SESSION QUESTION ANSWERING
      // ==========================================
      if (location.pathname.includes('/candidate/practice/session')) {
        if (
          hasPhrase(cleanText, [
            'option a', 'first option', 'pehla option', 'pehla vikalp', 'vikalp a', 'vikalp 1',
            'पहला विकल्प', 'विकल्प ए', 'विकल्प 1', 'विकल्प एक', 'ऑप्शन ए', 'ऑप्शन 1', 'पहला'
          ]) ||
          cleanText === 'a' ||
          cleanText === '1'
        ) {
          lastExecutedTextRef.current = cleanText;
          lastExecutedTimeRef.current = now;
          playEarcon('action');
          window.dispatchEvent(new CustomEvent('drishti:practice-select-option', { detail: { label: 'A' } }));
          speak(isHindi ? 'विकल्प ए चुना गया।' : 'Option A selected.');
          setLastActionFeedback(isHindi ? 'विकल्प ए' : 'Voice: Option A');
          return;
        }

        if (
          hasPhrase(cleanText, [
            'option b', 'second option', 'dusra option', 'dusra vikalp', 'vikalp b', 'vikalp 2',
            'दूसरा विकल्प', 'विकल्प बी', 'विकल्प 2', 'विकल्प दो', 'ऑप्शन बी', 'ऑप्शन 2', 'दूसरा'
          ]) ||
          cleanText === 'b' ||
          cleanText === '2'
        ) {
          lastExecutedTextRef.current = cleanText;
          lastExecutedTimeRef.current = now;
          playEarcon('action');
          window.dispatchEvent(new CustomEvent('drishti:practice-select-option', { detail: { label: 'B' } }));
          speak(isHindi ? 'विकल्प बी चुना गया।' : 'Option B selected.');
          setLastActionFeedback(isHindi ? 'विकल्प बी' : 'Voice: Option B');
          return;
        }

        if (
          hasPhrase(cleanText, [
            'option c', 'third option', 'teesra option', 'teesra vikalp', 'vikalp c', 'vikalp 3',
            'तीसरा विकल्प', 'विकल्प सी', 'विकल्प 3', 'विकल्प तीन', 'ऑप्शन सी', 'ऑप्शन 3', 'तीसरा'
          ]) ||
          cleanText === 'c' ||
          cleanText === '3'
        ) {
          lastExecutedTextRef.current = cleanText;
          lastExecutedTimeRef.current = now;
          playEarcon('action');
          window.dispatchEvent(new CustomEvent('drishti:practice-select-option', { detail: { label: 'C' } }));
          speak(isHindi ? 'विकल्प सी चुना गया।' : 'Option C selected.');
          setLastActionFeedback(isHindi ? 'विकल्प सी' : 'Voice: Option C');
          return;
        }

        if (
          hasPhrase(cleanText, [
            'option d', 'fourth option', 'chautha option', 'chautha vikalp', 'vikalp d', 'vikalp 4',
            'चौथा विकल्प', 'विकल्प डी', 'विकल्प 4', 'विकल्प चार', 'ऑप्शन डी', 'ऑप्शन 4', 'चौथा'
          ]) ||
          cleanText === 'd' ||
          cleanText === '4'
        ) {
          lastExecutedTextRef.current = cleanText;
          lastExecutedTimeRef.current = now;
          playEarcon('action');
          window.dispatchEvent(new CustomEvent('drishti:practice-select-option', { detail: { label: 'D' } }));
          speak(isHindi ? 'विकल्प डी चुना गया।' : 'Option D selected.');
          setLastActionFeedback(isHindi ? 'विकल्प डी' : 'Voice: Option D');
          return;
        }

        if (hasPhrase(cleanText, [
          'read question', 'sawal padho', 'repeat question', 'explain question', 'question sunao',
          'सवाल पढ़ो', 'प्रश्न पढ़ो', 'सवाल सुनाओ', 'प्रश्न सुनाओ', 'दोबारा पढ़ो'
        ])) {
          lastExecutedTextRef.current = cleanText;
          lastExecutedTimeRef.current = now;
          playEarcon('recognize');
          window.dispatchEvent(new CustomEvent('drishti:practice-read-question'));
          setLastActionFeedback(isHindi ? 'सवाल पढ़ा जा रहा है' : 'Voice: Reading question');
          return;
        }

        if (hasPhrase(cleanText, [
          'next question', 'agla sawal', 'next', 'agla', 'aage',
          'अगला सवाल', 'अगला प्रश्न', 'आगे', 'अगला'
        ])) {
          lastExecutedTextRef.current = cleanText;
          lastExecutedTimeRef.current = now;
          playEarcon('action');
          window.dispatchEvent(new CustomEvent('drishti:practice-next'));
          setLastActionFeedback(isHindi ? 'अगला सवाल' : 'Voice: Next question');
          return;
        }

        if (hasPhrase(cleanText, [
          'previous question', 'pichhla sawal', 'previous', 'back', 'piche', 'pehle ka',
          'पिछला सवाल', 'पिछला प्रश्न', 'पीछे', 'पिछला'
        ])) {
          lastExecutedTextRef.current = cleanText;
          lastExecutedTimeRef.current = now;
          playEarcon('action');
          window.dispatchEvent(new CustomEvent('drishti:practice-previous'));
          setLastActionFeedback(isHindi ? 'पिछला सवाल' : 'Voice: Previous question');
          return;
        }

        if (hasPhrase(cleanText, ['skip question', 'chhodo', 'skip', 'छोड़ो', 'स्किप'])) {
          lastExecutedTextRef.current = cleanText;
          lastExecutedTimeRef.current = now;
          playEarcon('action');
          window.dispatchEvent(new CustomEvent('drishti:practice-skip'));
          setLastActionFeedback(isHindi ? 'सवाल छोड़ा गया' : 'Voice: Skipped question');
          return;
        }

        if (hasPhrase(cleanText, [
          'finish practice', 'submit practice', 'submit', 'finish', 'khatam',
          'सबमिट करो', 'सबमिट', 'समाप्त करो', 'खत्म करो'
        ])) {
          lastExecutedTextRef.current = cleanText;
          lastExecutedTimeRef.current = now;
          playEarcon('action');
          window.dispatchEvent(new CustomEvent('drishti:practice-submit'));
          setLastActionFeedback(isHindi ? 'अभ्यास सबमिट किया गया' : 'Voice: Submit practice');
          return;
        }
      }

      // ==========================================
      // C1. ACTIVE MOCK TEST SESSION
      // ==========================================
      if (location.pathname.includes('/candidate/mock-tests/') && location.pathname.includes('/session')) {
        if (
          hasPhrase(cleanText, [
            'option a', 'select a', 'choose a', 'answer a', 'first option', 'pehla option', 'vikalp a', 'vikalp 1',
            'पहला विकल्प', 'विकल्प ए', 'विकल्प 1', 'विकल्प एक', 'ऑप्शन ए', 'ऑप्शन 1', 'पहला'
          ]) ||
          cleanText === 'a' ||
          cleanText === 'option 1' ||
          cleanText === '1'
        ) {
          lastExecutedTextRef.current = cleanText;
          lastExecutedTimeRef.current = now;
          playEarcon('action');
          window.dispatchEvent(new CustomEvent('drishti:mock-select-option', { detail: { label: 'A' } }));
          speak(isHindi ? 'विकल्प ए चुना गया।' : 'Option A selected.');
          setLastActionFeedback(isHindi ? 'विकल्प ए' : 'Voice: Option A');
          return;
        }

        if (
          hasPhrase(cleanText, [
            'option b', 'select b', 'choose b', 'answer b', 'second option', 'dusra option', 'vikalp b', 'vikalp 2',
            'दूसरा विकल्प', 'विकल्प बी', 'विकल्प 2', 'विकल्प दो', 'ऑप्शन बी', 'ऑप्शन 2', 'दूसरा'
          ]) ||
          cleanText === 'b' ||
          cleanText === 'option 2' ||
          cleanText === '2'
        ) {
          lastExecutedTextRef.current = cleanText;
          lastExecutedTimeRef.current = now;
          playEarcon('action');
          window.dispatchEvent(new CustomEvent('drishti:mock-select-option', { detail: { label: 'B' } }));
          speak(isHindi ? 'विकल्प बी चुना गया।' : 'Option B selected.');
          setLastActionFeedback(isHindi ? 'विकल्प बी' : 'Voice: Option B');
          return;
        }

        if (
          hasPhrase(cleanText, [
            'option c', 'select c', 'choose c', 'answer c', 'third option', 'teesra option', 'vikalp c', 'vikalp 3',
            'तीसरा विकल्प', 'विकल्प सी', 'विकल्प 3', 'विकल्प तीन', 'ऑप्शन सी', 'ऑप्शन 3', 'तीसरा'
          ]) ||
          cleanText === 'c' ||
          cleanText === 'option 3' ||
          cleanText === '3'
        ) {
          lastExecutedTextRef.current = cleanText;
          lastExecutedTimeRef.current = now;
          playEarcon('action');
          window.dispatchEvent(new CustomEvent('drishti:mock-select-option', { detail: { label: 'C' } }));
          speak(isHindi ? 'विकल्प सी चुना गया।' : 'Option C selected.');
          setLastActionFeedback(isHindi ? 'विकल्प सी' : 'Voice: Option C');
          return;
        }

        if (
          hasPhrase(cleanText, [
            'option d', 'select d', 'choose d', 'answer d', 'fourth option', 'chautha option', 'vikalp d', 'vikalp 4',
            'चौथा विकल्प', 'विकल्प डी', 'विकल्प 4', 'विकल्प चार', 'ऑप्शन डी', 'ऑप्शन 4', 'चौथा'
          ]) ||
          cleanText === 'd' ||
          cleanText === 'option 4' ||
          cleanText === '4'
        ) {
          lastExecutedTextRef.current = cleanText;
          lastExecutedTimeRef.current = now;
          playEarcon('action');
          window.dispatchEvent(new CustomEvent('drishti:mock-select-option', { detail: { label: 'D' } }));
          speak(isHindi ? 'विकल्प डी चुना गया।' : 'Option D selected.');
          setLastActionFeedback(isHindi ? 'विकल्प डी' : 'Voice: Option D');
          return;
        }

        if (hasPhrase(cleanText, [
          'read question', 'sawal padho', 'repeat question', 'explain question', 'question sunao',
          'options padho', 'read options', 'repeat', 'dobara', 'fir se', 'phir se',
          'सवाल पढ़ो', 'प्रश्न सुनाओ', 'विकल्प पढ़ो', 'विकल्प सुनाओ', 'दोबारा पढ़ो'
        ])) {
          lastExecutedTextRef.current = cleanText;
          lastExecutedTimeRef.current = now;
          playEarcon('recognize');
          window.dispatchEvent(new CustomEvent('drishti:mock-read-question'));
          setLastActionFeedback(isHindi ? 'सवाल सुनाया जा रहा है' : 'Voice: Reading question');
          return;
        }

        if (hasPhrase(cleanText, [
          'next question', 'agla sawal', 'next', 'agla', 'aage',
          'अगला सवाल', 'अगला प्रश्न', 'आगे', 'अगला'
        ])) {
          lastExecutedTextRef.current = cleanText;
          lastExecutedTimeRef.current = now;
          playEarcon('action');
          window.dispatchEvent(new CustomEvent('drishti:mock-next'));
          setLastActionFeedback(isHindi ? 'अगला सवाल' : 'Voice: Next question');
          return;
        }

        if (hasPhrase(cleanText, [
          'previous question', 'pichhla sawal', 'previous', 'back', 'piche', 'pehle ka',
          'पिछला सवाल', 'पिछला प्रश्न', 'पीछे', 'पिछला'
        ])) {
          lastExecutedTextRef.current = cleanText;
          lastExecutedTimeRef.current = now;
          playEarcon('action');
          window.dispatchEvent(new CustomEvent('drishti:mock-previous'));
          setLastActionFeedback(isHindi ? 'पिछला सवाल' : 'Voice: Previous question');
          return;
        }

        if (hasPhrase(cleanText, [
          'mark for review', 'mark review', 'review', 'flag', 'bookmark', 'yaad rakhna',
          'मार्क करो', 'रिव्यू के लिए रखो', 'निशान लगाओ', 'मार्क'
        ])) {
          lastExecutedTextRef.current = cleanText;
          lastExecutedTimeRef.current = now;
          playEarcon('action');
          window.dispatchEvent(new CustomEvent('drishti:mock-mark-review'));
          setLastActionFeedback(isHindi ? 'रिव्यू के लिए मार्क किया' : 'Voice: Marked for review');
          return;
        }

        if (hasPhrase(cleanText, [
          'clear option', 'clear selection', 'clear answer', 'clear', 'mitao', 'reset',
          'विकल्प मिटाओ', 'उत्तर मिटाओ', 'हटाओ', 'साफ करो', 'क्लियर'
        ])) {
          lastExecutedTextRef.current = cleanText;
          lastExecutedTimeRef.current = now;
          playEarcon('action');
          window.dispatchEvent(new CustomEvent('drishti:mock-clear'));
          setLastActionFeedback(isHindi ? 'विकल्प हटाया गया' : 'Voice: Cleared option');
          return;
        }

        if (hasPhrase(cleanText, [
          'finish test', 'submit test', 'submit mock', 'finish mock', 'submit', 'khatam',
          'सबमिट करो', 'सबमिट', 'टेस्ट खत्म करो', 'परीक्षा समाप्त करो'
        ])) {
          lastExecutedTextRef.current = cleanText;
          lastExecutedTimeRef.current = now;
          playEarcon('action');
          window.dispatchEvent(new CustomEvent('drishti:mock-submit'));
          setLastActionFeedback(isHindi ? 'मॉक टेस्ट सबमिट किया गया' : 'Voice: Submit mock test');
          return;
        }
      }

      // ==========================================
      // C2. ACTIVE MOCK TEST INSTRUCTIONS
      // ==========================================
      if (location.pathname.includes('/candidate/mock-tests/') && location.pathname.includes('/instructions')) {
        if (hasPhrase(cleanText, [
          'start test', 'begin test', 'start mock', 'begin mock', 'start', 'begin', 'shuru karo',
          'agree and start', 'launch test', 'launch', 'शुरू करो', 'टेस्ट शुरू करो', 'परीक्षा शुरू करो'
        ])) {
          lastExecutedTextRef.current = cleanText;
          lastExecutedTimeRef.current = now;
          playEarcon('action');
          window.dispatchEvent(new CustomEvent('drishti:mock-start-test'));
          setLastActionFeedback(isHindi ? 'मॉक टेस्ट शुरू हो रहा है' : 'Voice: Starting mock test');
          return;
        }

        if (hasPhrase(cleanText, [
          'read instructions', 'listen instructions', 'instructions padho', 'nirdesh padho', 'summary',
          'निर्देश पढ़ो', 'निर्देश सुनाओ'
        ])) {
          lastExecutedTextRef.current = cleanText;
          lastExecutedTimeRef.current = now;
          playEarcon('recognize');
          window.dispatchEvent(new CustomEvent('drishti:mock-read-instructions'));
          setLastActionFeedback(isHindi ? 'निर्देश पढ़े जा रहे हैं' : 'Voice: Reading test instructions');
          return;
        }
      }

      // ==========================================
      // D. UNIVERSAL SECTION EXPLANATION & ORIENTATION
      // ==========================================
      if (hasPhrase(cleanText, [
        'explain', 'sare element explain karo', 'explain elements', 'explain page', 'explain section',
        'kahan hu', 'where am i', 'what is on this page', 'status',
        'समझाओ', 'पेज समझाओ', 'कहाँ हूँ', 'स्क्रीन समझाओ'
      ])) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        speakSectionExplanation();
        setLiveTranscript('');
        return;
      }

      // ==========================================
      // E. UNIVERSAL SECTION OPTIONS SUMMARY / REPEAT
      // ==========================================
      if (hasPhrase(cleanText, [
        'repeat', 'repeat options', 'dubara bolo', 'options batao', 'kya options hai', 'list options', 'options',
        'विकल्प बताओ', 'दोबारा बोलो', 'ऑप्शन बताओ'
      ])) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        speakSectionOptions();
        setLiveTranscript('');
        return;
      }

      // ==========================================
      // F. SECTION ELEMENTS SELECTION BY NUMBER (Options 1 to 7)
      // ==========================================
      const currentSection = resolveSectionDescriptor(location.pathname, getSectionContext());
      let matchedIndex = -1;

      if (
        hasPhrase(cleanText, [
          'option 1', 'option one', 'select 1', 'select one', 'choose 1', 'choose one', 'number 1', 'number one',
          'first', 'pehla', 'vikalp 1', 'vikalp one', 'पहला विकल्प', 'विकल्प 1', 'विकल्प एक', 'ऑप्शन 1', 'पहला', 'नंबर 1'
        ]) ||
        cleanText === '1' || cleanText === 'one' || cleanText === 'एक'
      ) matchedIndex = 0;
      else if (
        hasPhrase(cleanText, [
          'option 2', 'option two', 'select 2', 'select two', 'choose 2', 'choose two', 'number 2', 'number two',
          'second', 'dusra', 'vikalp 2', 'vikalp two', 'दूसरा विकल्प', 'विकल्प 2', 'विकल्प दो', 'ऑप्शन 2', 'दूसरा', 'नंबर 2'
        ]) ||
        cleanText === '2' || cleanText === 'two' || cleanText === 'दो'
      ) matchedIndex = 1;
      else if (
        hasPhrase(cleanText, [
          'option 3', 'option three', 'select 3', 'select three', 'choose 3', 'choose three', 'number 3', 'number three',
          'third', 'teesra', 'vikalp 3', 'vikalp three', 'तीसरा विकल्प', 'विकल्प 3', 'विकल्प तीन', 'ऑप्शन 3', 'तीसरा', 'नंबर 3'
        ]) ||
        cleanText === '3' || cleanText === 'three' || cleanText === 'तीन'
      ) matchedIndex = 2;
      else if (
        hasPhrase(cleanText, [
          'option 4', 'option four', 'select 4', 'select four', 'choose 4', 'choose four', 'number 4', 'number four',
          'fourth', 'chautha', 'vikalp 4', 'vikalp four', 'चौथा विकल्प', 'विकल्प 4', 'विकल्प चार', 'ऑप्शन 4', 'चौथा', 'नंबर 4'
        ]) ||
        cleanText === '4' || cleanText === 'four' || cleanText === 'चार'
      ) matchedIndex = 3;
      else if (
        hasPhrase(cleanText, [
          'option 5', 'option five', 'select 5', 'select five', 'choose 5', 'choose five', 'number 5', 'number five',
          'fifth', 'paanchwa', 'vikalp 5', 'vikalp five', 'पांचवां विकल्प', 'विकल्प 5', 'विकल्प पांच', 'ऑप्शन 5', 'पांचवां', 'नंबर 5'
        ]) ||
        cleanText === '5' || cleanText === 'five' || cleanText === 'पाँच' || cleanText === 'पांच'
      ) matchedIndex = 4;
      else if (
        hasPhrase(cleanText, [
          'option 6', 'option six', 'select 6', 'select six', 'choose 6', 'choose six', 'number 6', 'number six',
          'sixth', 'chhatwa', 'vikalp 6', 'vikalp six', 'छठा विकल्प', 'विकल्प 6', 'विकल्प छह', 'ऑप्शन 6', 'छठा', 'नंबर 6'
        ]) ||
        cleanText === '6' || cleanText === 'six' || cleanText === 'छह'
      ) matchedIndex = 5;
      else if (
        hasPhrase(cleanText, [
          'option 7', 'option seven', 'select 7', 'select seven', 'choose 7', 'choose seven', 'number 7', 'number seven',
          'seventh', 'saatwa', 'vikalp 7', 'vikalp seven', 'सातवां विकल्प', 'विकल्प 7', 'विकल्प सात', 'ऑप्शन 7', 'सातवां', 'नंबर 7'
        ]) ||
        cleanText === '7' || cleanText === 'seven' || cleanText === 'सात'
      ) matchedIndex = 6;

      if (matchedIndex !== -1 && currentSection.elements[matchedIndex]) {
        const elem = currentSection.elements[matchedIndex];
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        elem.action(getSectionContext());
        if (elem.confirmSpeech && !elem.speaksOwnContent) {
          speak(elem.confirmSpeech);
          announce(elem.confirmSpeech, 'polite');
        } else if (elem.confirmSpeech) {
          announce(elem.confirmSpeech, 'polite');
        }
        setLastActionFeedback(`Selected Option ${elem.number}: ${elem.label}`);
        setLiveTranscript('');
        return;
      }

      // ==========================================
      // G. SECTION ELEMENT SELECTION BY ALIAS (Unicode aware)
      // ==========================================
      for (const elem of currentSection.elements) {
        if (hasPhrase(cleanText, elem.aliases)) {
          lastExecutedTextRef.current = cleanText;
          lastExecutedTimeRef.current = now;
          playEarcon('action');
          elem.action(getSectionContext());
          if (elem.confirmSpeech && !elem.speaksOwnContent) {
            speak(elem.confirmSpeech);
            announce(elem.confirmSpeech, 'polite');
          } else if (elem.confirmSpeech) {
            announce(elem.confirmSpeech, 'polite');
          }
          setLastActionFeedback(`Selected: ${elem.label}`);
          setLiveTranscript('');
          return;
        }
      }

      // ==========================================
      // G2. CLOSE MODALS / DIALOGS
      // ==========================================
      if (hasPhrase(cleanText, [
        'close formulas', 'close cheat sheet', 'close modal', 'close dialog', 'close',
        'band karo', 'hatao', 'बंद करो', 'हटाओ', 'बंद'
      ])) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        window.dispatchEvent(new CustomEvent('drishti:learn-close-formulas'));
        setLastActionFeedback('Closed dialog.');
        speak(isHindi ? 'बंद कर दिया गया।' : 'Closed.');
        announce('Dialog closed.', 'polite');
        setLiveTranscript('');
        return;
      }

      // ==========================================
      // H. HELP & COMMANDS
      // ==========================================
      if (hasPhrase(cleanText, [
        'help', 'madad', 'commands', 'what can i say', 'kya bolu',
        'मदद', 'सहायता', 'क्या बोलूँ', 'कमांड्स बताओ', 'कमांड बताओ', 'सहायता करो'
      ])) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        speakAvailableCommands();
        setLiveTranscript('');
        return;
      }

      // ==========================================
      // I. CONTINUE PRACTICE / START RECOMMENDED PRACTICE
      // ==========================================
      if (
        hasPhrase(cleanText, [
          'continue practice', 'start practice set', 'recommended practice', 'start recommended',
          'begin practice', 'resume practice', 'अभ्यास जारी रखो', 'प्रैक्टिस जारी रखो', 'अभ्यास चालू करो'
        ]) ||
        (hasPhrase(cleanText, ['continue', 'जारी रखो']) && !hasPhrase(cleanText, ['learning', 'पढ़ाई']))
      ) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        speak(isHindi ? 'अभ्यास सत्र शुरू हो रहा है।' : 'Starting practice session.');
        announce('Launching Practice Session.', 'polite');
        setLastActionFeedback('Starting Practice Session.');
        setLiveTranscript('');
        navigate('/candidate/practice');
        return;
      }

      // ==========================================
      // J. DEMO EXAM
      // ==========================================
      if (hasPhrase(cleanText, [
        'start demo exam', 'demo exam', 'take exam', 'start examination',
        'डेमो परीक्षा', 'डेमो एग्जाम', 'परीक्षा शुरू करो'
      ])) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        speak(isHindi ? 'डेमो परीक्षा सत्यापन कक्ष में प्रवेश कर रहे हैं।' : 'Entering exam verification room for Demo Examination.');
        announce('Launching Demo Exam Verification.', 'polite');
        setLastActionFeedback('Starting Demo Exam Verification.');
        setLiveTranscript('');
        navigate('/candidate/exams/demo-exam-01/verify');
        return;
      }

      // ==========================================
      // K. LEARN: CURRICULUM / SYLLABUS / PADHO
      // ==========================================
      if (hasPhrase(cleanText, [
        'learn', 'curriculum', 'syllabus', 'padho', 'sikho', 'padhai', 'learning',
        'पढ़ाई', 'पाठ्यक्रम', 'सीखो', 'पढ़ाई खोलो', 'लर्न'
      ])) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/learn');
        speak(isHindi ? 'अध्ययन पाठ्यक्रम खुल रहा है।' : 'Opening Learning Curriculum.');
        announce('Navigating to Learning Curriculum.', 'polite');
        setLastActionFeedback('Navigating to Learn.');
        setLiveTranscript('');
        return;
      }

      // ==========================================
      // L. SPECIFIC DASHBOARD TELEMETRY QUERIES
      // ==========================================
      if (hasPhrase(cleanText, [
        'subject progress', 'vishay pragati', 'vishay batao', 'subjects score', 'subject score',
        'विषय प्रगति', 'विषय बताओ', 'सब्जेक्ट प्रोग्रेस', 'विषय की स्थिति'
      ])) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('recognize');
        const speech = isHindi
          ? 'विषयवार तैयारी प्रगति: गणित 85 प्रतिशत, रीजनिंग 90 प्रतिशत, अंग्रेजी 78 प्रतिशत, और सामान्य ज्ञान 65 प्रतिशत पूर्ण है।'
          : 'Subject progress: Mathematics 85 percent, Reasoning 90 percent, English 78 percent, and General Knowledge 65 percent mastered.';
        speak(speech);
        announce(speech, 'polite');
        setLastActionFeedback(isHindi ? 'विषय प्रगति सुनाई गई' : 'Subject progress spoken.');
        setLiveTranscript('');
        return;
      }

      if (hasPhrase(cleanText, [
        'weak areas', 'kamzor vishay', 'kamzori batao', 'topics to strengthen',
        'कमजोर विषय', 'सुधार क्षेत्र', 'कमजोरी बताओ', 'कमजोर टॉपिक'
      ])) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('recognize');
        const speech = isHindi
          ? 'सुधार के लिए अनुशंसित विषय: प्रतिशत और कोडिंग-डिकोडिंग। 10 प्रश्नों का लक्षित अभ्यास करने से आपकी सटीकता तेजी से सुधरेगी।'
          : 'Topics to strengthen: Percentages and Coding-Decoding. A targeted 10-question drill will yield the highest performance gains.';
        speak(speech);
        announce(speech, 'polite');
        setLastActionFeedback(isHindi ? 'कमजोर विषय सुनाए गए' : 'Weak areas spoken.');
        setLiveTranscript('');
        return;
      }

      if (hasPhrase(cleanText, [
        'daily goal', 'aaj ka lakshya', 'lakshya batao', 'today goal',
        'आज का लक्ष्य', 'लक्ष्य बताओ', 'टारगेट बताओ', 'लक्ष्य'
      ])) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('recognize');
        const speech = isHindi
          ? 'आज का लक्ष्य: 45 में से 30 मिनट अध्ययन पूरा हो चुका है। आपका 7 दिनों का अध्ययन सिलसिला सक्रिय है।'
          : "Today's Goal: 30 of 45 minutes practiced today. Your 7-day preparation streak is active.";
        speak(speech);
        announce(speech, 'polite');
        setLastActionFeedback(isHindi ? 'आज का लक्ष्य सुनाया गया' : 'Daily goal spoken.');
        setLiveTranscript('');
        return;
      }

      if (hasPhrase(cleanText, [
        'overall progress', 'readiness score', 'taiyari kaisi hai', 'pragati batao',
        'तैयारी कैसी है', 'प्रगति बताओ', 'स्कोर बताओ', 'ओवरऑल प्रोग्रेस', 'कुल प्रगति'
      ])) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('recognize');
        const speech = isHindi
          ? 'समग्र तैयारी अवलोकन: कुल 78 प्रतिशत पाठ्यक्रम पूर्ण है। 142 प्रश्न हल किए गए हैं और औसत सटीकता 82 प्रतिशत है।'
          : 'Overall readiness overview: 78 percent completed across all domains. 142 questions attempted with 82 percent average accuracy.';
        speak(speech);
        announce(speech, 'polite');
        setLastActionFeedback(isHindi ? 'तैयारी का हाल सुनाया गया' : 'Overall readiness spoken.');
        setLiveTranscript('');
        return;
      }

      // ==========================================
      // M. DASHBOARD: SPOKEN READOUT & NAVIGATION
      // ==========================================
      if (hasPhrase(cleanText, [
        'read dashboard', 'explain dashboard', 'dashboard sunao', 'pura dashboard', 'dashboard padho',
        'dashboard batao', 'dashboard me kya hai', 'kya hai dashboard me',
        'डैशबोर्ड पढ़ो', 'पूरा डैशबोर्ड', 'डैशबोर्ड सुनाओ', 'डैशबोर्ड बताओ', 'डैशबोर्ड में क्या है',
        'डैशबोर्ड समझाओ', 'डैशबोर्ड स्थिति', 'डैशबोर्ड का हाल', 'डैशबोर्ड की स्थिति'
      ])) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('recognize');
        const descriptor = resolveSectionDescriptor('/candidate/dashboard', getSectionContext());
        speak(descriptor.introSpeech);
        announce(descriptor.introSpeech, 'assertive');
        setLastActionFeedback(isHindi ? 'डैशबोर्ड विवरण सुनाया जा रहा है' : 'Reading Dashboard details.');
        setLiveTranscript('');
        return;
      }

      if (hasPhrase(cleanText, [
        'dashboard', 'home', 'main menu', 'ghar', 'wapas',
        'डैशबोर्ड', 'होम', 'घर', 'मुख्य पृष्ठ', 'डैशबोर्ड खोलो'
      ])) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/dashboard');
        speak(isHindi ? 'कैंडिडेट डैशबोर्ड खुल रहा है।' : 'Opening Candidate Dashboard.');
        announce('Navigating to Candidate Dashboard.', 'polite');
        setLastActionFeedback('Navigating to Dashboard.');
        setLiveTranscript('');
        return;
      }

      // ==========================================
      // N. PRACTICE: INTERACTIVE HUB
      // ==========================================
      if (hasPhrase(cleanText, [
        'practice', 'questions', 'question', 'sawal', 'abhyas',
        'अभ्यास', 'अभ्यास खोलो', 'सवाल हल करो', 'प्रैक्टिस'
      ])) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/practice');
        speak(isHindi ? 'अभ्यास केंद्र खुल रहा है।' : 'Opening Practice Hub.');
        announce('Navigating to Practice Hub.', 'polite');
        setLastActionFeedback('Navigating to Practice.');
        setLiveTranscript('');
        return;
      }

      // ==========================================
      // O. SUBJECT-SPECIFIC MOCK TESTS
      // ==========================================
      // Mathematics Mock
      if (
        (hasPhrase(cleanText, ['math', 'maths', 'mathematics', 'ganit', 'गणित', 'मैथ्स']) &&
          hasPhrase(cleanText, ['mock', 'test', 'मॉक', 'टेस्ट']))
      ) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/mock-tests/mock-math-01/session');
        speak(isHindi ? 'प्रारंभिक गणित मॉक टेस्ट खुल रहा है। पहला सवाल लोड हो रहा है।' : 'Opening Elementary Mathematics Subject Mock Test. Loading question one.');
        announce('Navigating to Elementary Mathematics Mock Test.', 'polite');
        setLastActionFeedback('Navigating to Mathematics Mock Test.');
        setLiveTranscript('');
        return;
      }

      // English Mock
      if (
        (hasPhrase(cleanText, ['english', 'angrezi', 'अंग्रेजी', 'इंग्लिश']) &&
          hasPhrase(cleanText, ['mock', 'test', 'मॉक', 'टेस्ट']))
      ) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/mock-tests/mock-eng-01/session');
        speak(isHindi ? 'अंग्रेजी भाषा मॉक टेस्ट खुल रहा है। पहला सवाल लोड हो रहा है।' : 'Opening English Language Mock Test. Loading question one.');
        announce('Navigating to English Mock Test.', 'polite');
        setLastActionFeedback('Navigating to English Mock Test.');
        setLiveTranscript('');
        return;
      }

      // GK Mock
      if (
        (hasPhrase(cleanText, ['gk', 'general knowledge', 'samanya gyan', 'current affairs', 'defense', 'सामान्य ज्ञान', 'जीके']) &&
          hasPhrase(cleanText, ['mock', 'test', 'मॉक', 'टेस्ट']))
      ) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/mock-tests/mock-gk-01/session');
        speak(isHindi ? 'सामान्य ज्ञान मॉक टेस्ट खुल रहा है। पहला सवाल लोड हो रहा है।' : 'Opening General Knowledge and Defense Mock Test. Loading question one.');
        announce('Navigating to General Knowledge Mock Test.', 'polite');
        setLastActionFeedback('Navigating to GK Mock Test.');
        setLiveTranscript('');
        return;
      }

      // Reasoning Mock
      if (
        (hasPhrase(cleanText, ['reasoning', 'logic', 'tarkik', 'aptitude', 'रीजनिंग', 'तार्किक']) &&
          hasPhrase(cleanText, ['mock', 'test', 'मॉक', 'टेस्ट']))
      ) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/mock-tests/mock-reas-01/session');
        speak(isHindi ? 'रीजनिंग मॉक टेस्ट खुल रहा है। पहला सवाल लोड हो रहा है।' : 'Opening Reasoning Ability Mock Test. Loading question one.');
        announce('Navigating to Reasoning Mock Test.', 'polite');
        setLastActionFeedback('Navigating to Reasoning Mock Test.');
        setLiveTranscript('');
        return;
      }

      // CDS Full Mock
      if (
        (hasPhrase(cleanText, ['cds', 'full', 'फुल']) &&
          hasPhrase(cleanText, ['mock', 'test', 'मॉक', 'टेस्ट']))
      ) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/mock-tests/cds-full-mock-01/session');
        speak(isHindi ? 'सीडीएस फुल मॉक टेस्ट खुल रहा है। पहला सवाल लोड हो रहा है।' : 'Opening CDS Full Practice Examination. Loading question one.');
        announce('Navigating to CDS Full Mock Test.', 'polite');
        setLastActionFeedback('Navigating to CDS Full Mock Test.');
        setLiveTranscript('');
        return;
      }

      // Generic Mock Tests
      if (hasPhrase(cleanText, [
        'mock', 'mocks', 'mock tests', 'mock test', 'test series',
        'मॉक टेस्ट', 'मॉक', 'टेस्ट सीरीज', 'मॉक खोलो'
      ])) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/mock-tests');
        speak(isHindi ? 'मॉक टेस्ट पोर्टल खुल रहा है।' : 'Opening Mock Tests.');
        announce('Navigating to Mock Tests.', 'polite');
        setLastActionFeedback('Navigating to Mock Tests.');
        setLiveTranscript('');
        return;
      }

      // ==========================================
      // P. EXAMS / EXAMINATIONS / PARIKSHA
      // ==========================================
      if (hasPhrase(cleanText, [
        'exams', 'exam', 'examinations', 'examination', 'pariksha',
        'परीक्षाएं', 'परीक्षा', 'परीक्षा सूची', 'एग्जाम', 'परीक्षा पोर्टल'
      ])) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/exams');
        speak(isHindi ? 'परीक्षा पोर्टल खुल रहा है।' : 'Opening Examination Portal.');
        announce('Navigating to Examination Portal.', 'polite');
        setLastActionFeedback('Navigating to Examinations.');
        setLiveTranscript('');
        return;
      }

      // ==========================================
      // Q. RESULTS / SCORECARDS / PARINAM
      // ==========================================
      if (hasPhrase(cleanText, [
        'results', 'result', 'scores', 'score', 'scorecards', 'scorecard', 'marks', 'grades', 'parinam',
        'परिणाम', 'स्कोरकार्ड', 'नतीजे', 'रिजल्ट'
      ])) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/results');
        speak(isHindi ? 'परिणाम और विश्लेषण खुल रहा है।' : 'Opening Results and Analytics.');
        announce('Navigating to Results.', 'polite');
        setLastActionFeedback('Navigating to Results.');
        setLiveTranscript('');
        return;
      }

      // ==========================================
      // R. PROGRESS / PERFORMANCE / TARAKKI
      // ==========================================
      if (hasPhrase(cleanText, [
        'progress', 'performance', 'streaks', 'streak', 'growth', 'tarakki',
        'प्रगति', 'तरक्की', 'परफॉर्मेंस', 'प्रोग्रेस'
      ])) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/progress');
        speak(isHindi ? 'प्रगति और विश्लेषण खुल रहा है।' : 'Opening Progress Analytics.');
        announce('Navigating to Progress.', 'polite');
        setLastActionFeedback('Navigating to Progress.');
        setLiveTranscript('');
        return;
      }

      // ==========================================
      // S. ACCESSIBILITY CALIBRATION
      // ==========================================
      if (hasPhrase(cleanText, [
        'accessibility', 'calibration', 'contrast', 'font size', 'text size', 'bada karo',
        'सुलभता', 'सेटिंग्स', 'कंट्रास्ट', 'फॉन्ट बड़ा करो', 'एक्सेसिबिलिटी'
      ])) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        openCalibration();
        speak(isHindi ? 'सुलभता कैलिब्रेशन केंद्र खुल गया है।' : 'Opening Accessibility Calibration Center.');
        announce('Accessibility Calibration Center opened.', 'polite');
        setLastActionFeedback('Opened Accessibility Center.');
        setLiveTranscript('');
        return;
      }

      // ==========================================
      // T. SETTINGS
      // ==========================================
      if (hasPhrase(cleanText, [
        'settings', 'setting', 'profiles', 'profile', 'accounts', 'account',
        'सेटिंग्स', 'प्रोफाइल'
      ])) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/settings');
        speak(isHindi ? 'कैंडिडेट सेटिंग्स खुल रही हैं।' : 'Opening Candidate Settings.');
        announce('Navigating to Settings.', 'polite');
        setLastActionFeedback('Navigating to Settings.');
        setLiveTranscript('');
        return;
      }

      // ==========================================
      // U. SUBJECTS
      // ==========================================
      if (hasPhrase(cleanText, ['mathematics', 'maths', 'math', 'ganit', 'गणित', 'मैथ्स', 'गणित खोलो'])) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/learn/mathematics');
        speak(isHindi ? 'गणित पाठ्यक्रम खुल रहा है।' : 'Opening Mathematics curriculum.');
        announce('Navigating to Mathematics.', 'polite');
        setLastActionFeedback('Opened Mathematics.');
        setLiveTranscript('');
        return;
      }

      if (hasPhrase(cleanText, ['english', 'angrezi', 'अंग्रेजी', 'इंग्लिश', 'अंग्रेजी खोलो'])) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/learn/english');
        speak(isHindi ? 'अंग्रेजी विषय खुल रहा है। टॉपिक: रीडिंग कॉम्प्रिहेंशन, ग्रामर, वोकैबुलरी।' : 'Opening English Language curriculum.');
        announce('Navigating to English Language.', 'polite');
        setLastActionFeedback('Opened English Language.');
        setLiveTranscript('');
        return;
      }

      if (hasPhrase(cleanText, ['general knowledge', 'gk', 'current affairs', 'samanya gyan', 'सामान्य ज्ञान', 'जीके', 'सामान्य ज्ञान खोलो'])) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/learn/general-knowledge');
        speak(isHindi ? 'सामान्य ज्ञान खुल रहा है। टॉपिक: आधुनिक इतिहास, भारतीय संविधान, भूगोल।' : 'Opening General Knowledge curriculum.');
        announce('Navigating to General Knowledge.', 'polite');
        setLastActionFeedback('Opened General Knowledge.');
        setLiveTranscript('');
        return;
      }

      if (hasPhrase(cleanText, ['reasoning', 'logic', 'tarkik', 'रीजनिंग', 'तार्किक क्षमता', 'तर्कशक्ति'])) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/learn/reasoning');
        speak(isHindi ? 'रीजनिंग पाठ्यक्रम खुल रहा है।' : 'Opening Reasoning Ability curriculum.');
        announce('Navigating to Reasoning Ability.', 'polite');
        setLastActionFeedback('Opened Reasoning.');
        setLiveTranscript('');
        return;
      }

      // ==========================================
      // V. SPECIFIC TOPICS
      // ==========================================
      if (hasPhrase(cleanText, ['percentages', 'percentage', 'pratishat', 'प्रतिशत'])) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/learn/mathematics/percentages');
        speak(isHindi ? 'गणित में प्रतिशत टॉपिक खुल रहा है।' : 'Opening Percentages topic in Mathematics.');
        announce('Navigating to Percentages.', 'polite');
        setLastActionFeedback('Opened Percentages.');
        setLiveTranscript('');
        return;
      }

      if (hasPhrase(cleanText, ['algebra', 'beejganit', 'बीजगणित'])) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/learn/mathematics/algebra');
        speak(isHindi ? 'गणित में बीजगणित टॉपिक खुल रहा है।' : 'Opening Algebra topic in Mathematics.');
        announce('Navigating to Algebra.', 'polite');
        setLastActionFeedback('Opened Algebra.');
        setLiveTranscript('');
        return;
      }

      if (hasPhrase(cleanText, ['geometry', 'jyamiti', 'ज्यामिति'])) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/learn/mathematics/geometry');
        speak(isHindi ? 'गणित में ज्यामिति टॉपिक खुल रहा है।' : 'Opening Geometry topic in Mathematics.');
        announce('Navigating to Geometry.', 'polite');
        setLastActionFeedback('Opened Geometry.');
        setLiveTranscript('');
        return;
      }

      if (hasPhrase(cleanText, ['reading comprehension', 'comprehension', 'passage', 'कॉम्प्रिहेंशन', 'गद्यांश'])) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/learn/english/reading-comprehension');
        speak(isHindi ? 'अंग्रेजी में रीडिंग कॉम्प्रिहेंशन टॉपिक खुल रहा है।' : 'Opening Reading Comprehension topic in English.');
        announce('Navigating to Reading Comprehension.', 'polite');
        setLastActionFeedback('Opened Reading Comprehension.');
        setLiveTranscript('');
        return;
      }

      if (hasPhrase(cleanText, ['grammar', 'vyakaran', 'व्याकरण'])) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/learn/english/grammar-rules');
        speak(isHindi ? 'अंग्रेजी में व्याकरण नियम टॉपिक खुल रहा है।' : 'Opening Grammar Rules topic in English.');
        announce('Navigating to Grammar Rules.', 'polite');
        setLastActionFeedback('Opened Grammar Rules.');
        setLiveTranscript('');
        return;
      }

      if (hasPhrase(cleanText, ['vocabulary', 'vocab', 'शब्दावली'])) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/learn/english/vocabulary-building');
        speak(isHindi ? 'अंग्रेजी में शब्दावली टॉपिक खुल रहा है।' : 'Opening Vocabulary Building topic in English.');
        announce('Navigating to Vocabulary.', 'polite');
        setLastActionFeedback('Opened Vocabulary.');
        setLiveTranscript('');
        return;
      }

      if (hasPhrase(cleanText, ['modern history', 'history', 'itihas', 'इतिहास', 'आधुनिक इतिहास'])) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/learn/general-knowledge/modern-history');
        speak(isHindi ? 'सामान्य ज्ञान में आधुनिक इतिहास टॉपिक खुल रहा है।' : 'Opening Modern History topic in General Knowledge.');
        announce('Navigating to Modern History.', 'polite');
        setLastActionFeedback('Opened Modern History.');
        setLiveTranscript('');
        return;
      }

      if (hasPhrase(cleanText, ['indian polity', 'polity', 'constitution', 'samvidhan', 'संविधान', 'राजव्यवस्था'])) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/learn/general-knowledge/indian-polity');
        speak(isHindi ? 'सामान्य ज्ञान में भारतीय संविधान टॉपिक खुल रहा है।' : 'Opening Indian Polity topic in General Knowledge.');
        announce('Navigating to Indian Polity.', 'polite');
        setLastActionFeedback('Opened Indian Polity.');
        setLiveTranscript('');
        return;
      }

      if (hasPhrase(cleanText, ['physical geography', 'geography', 'bhugol', 'भूगोल'])) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/learn/general-knowledge/physical-geography');
        speak(isHindi ? 'सामान्य ज्ञान में भौतिक भूगोल टॉपिक खुल रहा है।' : 'Opening Physical Geography topic in General Knowledge.');
        announce('Navigating to Physical Geography.', 'polite');
        setLastActionFeedback('Opened Physical Geography.');
        setLiveTranscript('');
        return;
      }

      if (hasPhrase(cleanText, ['coding and decoding', 'coding decoding', 'कोडिंग डिकोडिंग'])) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/learn/reasoning/coding-decoding');
        speak(isHindi ? 'रीजनिंग में कोडिंग-डिकोडिंग टॉपिक खुल रहा है।' : 'Opening Coding and Decoding topic in Reasoning.');
        announce('Navigating to Coding and Decoding.', 'polite');
        setLastActionFeedback('Opened Coding and Decoding.');
        setLiveTranscript('');
        return;
      }

      if (hasPhrase(cleanText, ['number series', 'series', 'संख्या श्रृंखला', 'नंबर सीरीज'])) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/learn/reasoning/number-series');
        speak(isHindi ? 'रीजनिंग में संख्या श्रृंखला टॉपिक खुल रहा है।' : 'Opening Number Series topic in Reasoning.');
        announce('Navigating to Number Series.', 'polite');
        setLastActionFeedback('Opened Number Series.');
        setLiveTranscript('');
        return;
      }

      // ==========================================
      // W. LOGOUT
      // ==========================================
      if (hasPhrase(cleanText, ['logout', 'log out', 'sign out', 'signout', 'bahar niklo', 'लॉग आउट', 'बाहर निकलो'])) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('pause');
        speak(isHindi ? 'दृष्टि से लॉग आउट कर रहे हैं।' : 'Signing you out of Drishti.');
        announce('Signing out.', 'assertive');
        setLastActionFeedback('Signing out...');
        setLiveTranscript('');
        logout();
        return;
      }

      // Unrecognized phrase: gentle earcon + feedback
      playEarcon('error');
      setLastActionFeedback(isHindi ? `सुना: "${rawTranscript}"। कमांड बोलें जैसे 'पढ़ाई' या 'अभ्यास'।` : `Heard: "${rawTranscript}". Say e.g. 'Learn' or 'Practice'.`);
    },
    [
      navigate,
      location.pathname,
      openCalibration,
      speak,
      stopSpeaking,
      announce,
      logout,
      speakAvailableCommands,
      speakSectionExplanation,
      speakSectionOptions,
      preferences,
      setPreferredLanguage,
      getSectionContext,
    ]
  );

  // Sync latest executeCommand reference for recognition callbacks
  useEffect(() => {
    executeCommandRef.current = executeCommand;
  }, [executeCommand]);

  // 6. Resilient Speech Recognition Engine (Fresh Instance Per Cycle)
  useEffect(() => {
    if (!isSupported) return;

    let isComponentMounted = true;
    let restartTimer: any = null;

    const SpeechRecognitionClass =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    const createAndStartRecognition = () => {
      createAndStartRef.current = createAndStartRecognition;
      if (!isComponentMounted || !isListeningRef.current) return;

      // Clean up previous instance cleanly
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
          if (!isComponentMounted) return;
          setIsActuallyRecognizing(true);
          setHasPermissionError(false);
        };

        recognition.onresult = (event: any) => {
          if (!isComponentMounted) return;
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

          const activeText = (final || interim).trim();
          if (activeText) {
            setLiveTranscript(activeText);
          }

          // Strict trigger logic:
          // 1. If final transcript is available, execute with full word boundary matching
          if (final.trim()) {
            executeCommandRef.current(final.trim());
          } else if (interim.trim()) {
            // 2. For interim speech: ONLY trigger if it is a crisp, standalone 1-or-2 word command
            // This prevents triggering mid-sentence while someone is speaking longer phrases!
            const words = interim.trim().toLowerCase().split(/\s+/);
            if (words.length <= 2) {
              const lower = interim.trim().toLowerCase();
              const quickCommands = [
                'learn', 'practice', 'dashboard', 'exams', 'exam', 'results', 'progress', 'stop',
                'continue', 'continue practice', 'mock', 'mocks', 'mock test', 'mock tests',
                'math mock', 'english mock', 'gk mock', 'reasoning mock', 'full mock',
                'option 1', 'option 2', 'option 3', 'option 4', 'option 5', 'option 6', 'option 7',
                'option a', 'option b', 'option c', 'option d', 'next', 'previous', 'submit',
                'read question', 'explain', 'repeat',
                'डैशबोर्ड', 'पढ़ाई', 'अभ्यास', 'मॉक टेस्ट', 'मॉक', 'परीक्षा', 'रिजल्ट', 'प्रगति',
                'रुको', 'मदद', 'सवाल पढ़ो', 'अगला', 'पिछला', 'सबमिट', 'विकल्प 1', 'विकल्प 2',
                'विकल्प 3', 'विकल्प 4', 'विकल्प 5', 'विकल्प 6', 'विकल्प 7', 'विकल्प ए', 'विकल्प बी',
                'विकल्प सी', 'विकल्प डी', 'हिंदी', 'अंग्रेजी', 'समझाओ', 'विकल्प बताओ'
              ];
              if (quickCommands.includes(lower)) {
  executeCommandRef.current(interim.trim());
              }
            }
          }
        };

        recognition.onerror = (event: any) => {
          if (!isComponentMounted) return;
          if (event.error === 'not-allowed') {
            setHasPermissionError(true);
            setIsActuallyRecognizing(false);
          }
        };

        recognition.onend = () => {
          if (!isComponentMounted) return;
          setIsActuallyRecognizing(false);
          // Auto-restart with fresh instance
          if (isListeningRef.current) {
            clearTimeout(restartTimer);
            restartTimer = setTimeout(() => {
              if (isComponentMounted && isListeningRef.current) {
                createAndStartRecognition();
              }
            }, 300);
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
      } catch (err) {
        // If initial start without user gesture fails, flag permission error so UI shows button
        setHasPermissionError(true);
        setIsActuallyRecognizing(false);
      }
    }

    if (isListening) {
      createAndStartRecognition();
    }

    return () => {
      isComponentMounted = false;
      clearTimeout(restartTimer);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onend = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.abort();
        } catch {}
          recognitionRef.current = null;
      }
      setIsActuallyRecognizing(false);
    };
  }, [isSupported, isListening, preferences?.language]);

  // 7. Voice Guidance on Route Change
  useEffect(() => {
    if (!location.pathname.startsWith('/candidate')) return;

    if (
      location.pathname.includes('/candidate/exams/') &&
      location.pathname.includes('/session')
    ) {
      return;
    }
    if (
      location.pathname.includes('/candidate/practice/session/') &&
      !location.pathname.includes('/result')
    ) {
      return;
    }
    if (
      location.pathname.includes('/candidate/mock-tests/') &&
      location.pathname.includes('/session')
    ) {
      return;
    }

    const timer = setTimeout(() => {
      if (isListeningRef.current) {
        playEarcon('navigate');
        const guidance = getPageGuidance(location.pathname);
        speak(guidance);
        announce(guidance, 'polite');
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [location.pathname, getPageGuidance, speak, announce]);

  // 8. Global Keyboard Shortcuts: Alt + V (Toggle Voice) & Alt + G (Guidance)
  const toggleListening = useCallback(async () => {
    if (!isListeningRef.current) {
      // User is enabling listening: prompt for mic permission if needed
      const granted = await requestMicPermission();
      if (!granted) return;
      setIsListening(true);
      isListeningRef.current = true;
      try {
        sessionStorage.setItem('drishti_candidate_voice_active', 'true');
      } catch {}
      playEarcon('listen');
      speak('Voice assistant active. Say Learn, Practice, or Dashboard.');
      announce('Voice assistant active.', 'polite');
      setLastActionFeedback('Voice listening active (Alt+V to pause).');
      createAndStartRef.current?.();
    } else {
      setIsListening(false);
      isListeningRef.current = false;
      try {
        sessionStorage.setItem('drishti_candidate_voice_active', 'false');
      } catch {}
      clearTimeout(restartTimerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onend = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.abort();
        } catch {}
        recognitionRef.current = null;
      }
      setIsActuallyRecognizing(false);
      playEarcon('pause');
      stopSpeaking();
      announce('Voice assistant paused.', 'polite');
      setLastActionFeedback('Voice assistant paused.');
      setLiveTranscript('');
    }
  }, [requestMicPermission, speak, stopSpeaking, announce]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        toggleListening();
      }
      if (e.altKey && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        speakPageGuidance();
      }
      // Instant access shortcuts:
      // Alt + L -> Learn
      if (e.altKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        playEarcon('action');
        navigate('/candidate/learn');
        speak('Opening Learn curriculum.');
      }
      // Alt + D -> Dashboard
      if (e.altKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        playEarcon('action');
        navigate('/candidate/dashboard');
        speak('Opening Candidate Dashboard.');
      }
      // Alt + P -> Practice
      if (e.altKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        playEarcon('action');
        navigate('/candidate/practice');
        speak('Opening Practice Hub.');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleListening, speakPageGuidance, navigate, speak]);

  return {
    isListening,
    isActuallyRecognizing,
    isSupported,
    hasPermissionError,
    liveTranscript,
    lastTranscript,
    lastActionFeedback,
    activeSectionName,
    toggleListening,
    requestMicPermission,
    speakPageGuidance,
    speakAvailableCommands,
    speakSectionExplanation,
    speakSectionOptions,
  };
}
