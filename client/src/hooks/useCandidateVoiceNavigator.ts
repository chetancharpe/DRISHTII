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

export function useCandidateVoiceNavigator(): CandidateVoiceState {
  const navigate = useNavigate();
  const location = useLocation();
  const { speak, stopSpeaking, announce, openCalibration, preferences, setHighContrast, setFontSize } = useAccessibility();
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
    const helpText =
      "Voice commands: " +
      "Say 'Option 1', 'Option 2', 'Option 3' to select screen elements. " +
      "Say 'Learn' to view curriculum subjects. " +
      "Say 'Practice' to practice questions. " +
      "Say 'Dashboard' to go home. " +
      "Say 'Exams' to view examinations. " +
      "Say 'Mock Tests' for mock tests catalog. " +
      "Say 'Math Mock', 'English Mock', 'GK Mock', 'Reasoning Mock', or 'Full Mock' for subject tests. " +
      "Say 'Results' for scorecards. " +
      "Say 'Progress' for analytics. " +
      "Say 'Explain' to describe this section. " +
      "Say 'Repeat' to hear options again. " +
      "Say 'Stop' to silence audio.";
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
      return true;
    } catch (err) {
      console.warn('Microphone permission request rejected:', err);
      setHasPermissionError(true);
      return false;
    }
  }, []);

  // 5. High-Precision Command Matcher (Word Boundaries & Intent Filter)
  const executeCommand = useCallback(
    (rawTranscript: string) => {
      const cleanText = rawTranscript
        .toLowerCase()
        .replace(/[.,!?;:'"-]/g, ' ')
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

      // Conversational Filter:
      // If the candidate speaks a sentence of 4 or more words, it must contain a clear command intent verb:
      // e.g. "open", "go to", "take me to", "navigate", "show", "start", "kholo", "chalo", "jao", "drishti", "please"
      // Otherwise, it is casual background conversation and should NOT trigger accidental navigation!
      const isLongUtterance = words.length >= 4;
      const hasCommandIntent =
        /\b(open|go to|take me to|navigate|show|start|kholo|chalo|jao|drishti|please|karna|chahiye)\b/i.test(
          cleanText
        );

      // Special exemption for long exact command phrases like "take me to examinations" or "start recommended practice"
      if (isLongUtterance && !hasCommandIntent) {
        setLastActionFeedback(`Conversational speech noted: "${rawTranscript}". Say a direct command like "Learn" or "Open Practice".`);
        return;
      }

      // A. Stop speech synthesis on "stop" / "mute"
      if (/\b(stop|mute|quiet|silence|chup|shant|ruko|band karo)\b/i.test(cleanText)) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        stopSpeaking();
        playEarcon('pause');
        setLastActionFeedback('Speech muted.');
        setLiveTranscript('');
        return;
      }

      // B. Microphone Controls
      if (/\b(stop listening|turn off mic|mic band|pause voice|pause mic)\b/i.test(cleanText)) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        setIsListening(false);
        try {
          sessionStorage.setItem('drishti_candidate_voice_active', 'false');
        } catch {}
        playEarcon('pause');
        speak('Voice assistant paused. Press Alt plus V to resume listening.');
        announce('Voice assistant paused.', 'polite');
        setLastActionFeedback('Microphone paused (Alt+V to resume).');
        setLiveTranscript('');
        return;
      }

      // C. Active Practice Session Question Answering (when on /candidate/practice/session)
      if (location.pathname.includes('/candidate/practice/session')) {
        if (/\b(option a|first option|pehla option)\b/i.test(cleanText) || cleanText === 'a') {
          lastExecutedTextRef.current = cleanText;
          lastExecutedTimeRef.current = now;
          playEarcon('action');
          window.dispatchEvent(new CustomEvent('drishti:practice-select-option', { detail: { label: 'A' } }));
          setLastActionFeedback('Voice: Option A');
          return;
        }
        if (/\b(option b|second option|dusra option)\b/i.test(cleanText) || cleanText === 'b') {
          lastExecutedTextRef.current = cleanText;
          lastExecutedTimeRef.current = now;
          playEarcon('action');
          window.dispatchEvent(new CustomEvent('drishti:practice-select-option', { detail: { label: 'B' } }));
          setLastActionFeedback('Voice: Option B');
          return;
        }
        if (/\b(option c|third option|teesra option)\b/i.test(cleanText) || cleanText === 'c') {
          lastExecutedTextRef.current = cleanText;
          lastExecutedTimeRef.current = now;
          playEarcon('action');
          window.dispatchEvent(new CustomEvent('drishti:practice-select-option', { detail: { label: 'C' } }));
          setLastActionFeedback('Voice: Option C');
          return;
        }
        if (/\b(option d|fourth option|chautha option)\b/i.test(cleanText) || cleanText === 'd') {
          lastExecutedTextRef.current = cleanText;
          lastExecutedTimeRef.current = now;
          playEarcon('action');
          window.dispatchEvent(new CustomEvent('drishti:practice-select-option', { detail: { label: 'D' } }));
          setLastActionFeedback('Voice: Option D');
          return;
        }
        if (/\b(read question|sawal padho|repeat question|explain question|question sunao)\b/i.test(cleanText)) {
          lastExecutedTextRef.current = cleanText;
          lastExecutedTimeRef.current = now;
          playEarcon('recognize');
          window.dispatchEvent(new CustomEvent('drishti:practice-read-question'));
          setLastActionFeedback('Voice: Reading question');
          return;
        }
        if (/\b(next question|agla sawal|next)\b/i.test(cleanText)) {
          lastExecutedTextRef.current = cleanText;
          lastExecutedTimeRef.current = now;
          playEarcon('action');
          window.dispatchEvent(new CustomEvent('drishti:practice-next'));
          setLastActionFeedback('Voice: Next question');
          return;
        }
        if (/\b(previous question|pichhla sawal|previous|back)\b/i.test(cleanText)) {
          lastExecutedTextRef.current = cleanText;
          lastExecutedTimeRef.current = now;
          playEarcon('action');
          window.dispatchEvent(new CustomEvent('drishti:practice-previous'));
          setLastActionFeedback('Voice: Previous question');
          return;
        }
        if (/\b(skip question|chhodo|skip)\b/i.test(cleanText)) {
          lastExecutedTextRef.current = cleanText;
          lastExecutedTimeRef.current = now;
          playEarcon('action');
          window.dispatchEvent(new CustomEvent('drishti:practice-skip'));
          setLastActionFeedback('Voice: Skipped question');
          return;
        }
        if (/\b(finish practice|submit practice|submit|finish|khatam)\b/i.test(cleanText)) {
          lastExecutedTextRef.current = cleanText;
          lastExecutedTimeRef.current = now;
          playEarcon('action');
          window.dispatchEvent(new CustomEvent('drishti:practice-submit'));
          setLastActionFeedback('Voice: Submit practice');
          return;
        }
      }

      // C1. Active Mock Test Session (when on /candidate/mock-tests/.../session)
      if (location.pathname.includes('/candidate/mock-tests/') && location.pathname.includes('/session')) {
        if (/\b(option a|first option|pehla option)\b/i.test(cleanText) || cleanText === 'a') {
          lastExecutedTextRef.current = cleanText;
          lastExecutedTimeRef.current = now;
          playEarcon('action');
          window.dispatchEvent(new CustomEvent('drishti:mock-select-option', { detail: { label: 'A' } }));
          setLastActionFeedback('Voice: Option A');
          return;
        }
        if (/\b(option b|second option|dusra option)\b/i.test(cleanText) || cleanText === 'b') {
          lastExecutedTextRef.current = cleanText;
          lastExecutedTimeRef.current = now;
          playEarcon('action');
          window.dispatchEvent(new CustomEvent('drishti:mock-select-option', { detail: { label: 'B' } }));
          setLastActionFeedback('Voice: Option B');
          return;
        }
        if (/\b(option c|third option|teesra option)\b/i.test(cleanText) || cleanText === 'c') {
          lastExecutedTextRef.current = cleanText;
          lastExecutedTimeRef.current = now;
          playEarcon('action');
          window.dispatchEvent(new CustomEvent('drishti:mock-select-option', { detail: { label: 'C' } }));
          setLastActionFeedback('Voice: Option C');
          return;
        }
        if (/\b(option d|fourth option|chautha option)\b/i.test(cleanText) || cleanText === 'd') {
          lastExecutedTextRef.current = cleanText;
          lastExecutedTimeRef.current = now;
          playEarcon('action');
          window.dispatchEvent(new CustomEvent('drishti:mock-select-option', { detail: { label: 'D' } }));
          setLastActionFeedback('Voice: Option D');
          return;
        }
        if (/\b(read question|sawal padho|repeat question|explain question|question sunao|options padho|read options)\b/i.test(cleanText)) {
          lastExecutedTextRef.current = cleanText;
          lastExecutedTimeRef.current = now;
          playEarcon('recognize');
          window.dispatchEvent(new CustomEvent('drishti:mock-read-question'));
          setLastActionFeedback('Voice: Reading question');
          return;
        }
        if (/\b(next question|agla sawal|next|agla)\b/i.test(cleanText)) {
          lastExecutedTextRef.current = cleanText;
          lastExecutedTimeRef.current = now;
          playEarcon('action');
          window.dispatchEvent(new CustomEvent('drishti:mock-next'));
          setLastActionFeedback('Voice: Next question');
          return;
        }
        if (/\b(previous question|pichhla sawal|previous|back|piche)\b/i.test(cleanText)) {
          lastExecutedTextRef.current = cleanText;
          lastExecutedTimeRef.current = now;
          playEarcon('action');
          window.dispatchEvent(new CustomEvent('drishti:mock-previous'));
          setLastActionFeedback('Voice: Previous question');
          return;
        }
        if (/\b(mark for review|mark review|review|flag|bookmark|yaad rakhna)\b/i.test(cleanText)) {
          lastExecutedTextRef.current = cleanText;
          lastExecutedTimeRef.current = now;
          playEarcon('action');
          window.dispatchEvent(new CustomEvent('drishti:mock-mark-review'));
          setLastActionFeedback('Voice: Marked for review');
          return;
        }
        if (/\b(clear option|clear selection|clear answer|clear|mitao|reset)\b/i.test(cleanText)) {
          lastExecutedTextRef.current = cleanText;
          lastExecutedTimeRef.current = now;
          playEarcon('action');
          window.dispatchEvent(new CustomEvent('drishti:mock-clear'));
          setLastActionFeedback('Voice: Cleared option');
          return;
        }
        if (/\b(finish test|submit test|submit mock|finish mock|submit|khatam)\b/i.test(cleanText)) {
          lastExecutedTextRef.current = cleanText;
          lastExecutedTimeRef.current = now;
          playEarcon('action');
          window.dispatchEvent(new CustomEvent('drishti:mock-submit'));
          setLastActionFeedback('Voice: Submit mock test');
          return;
        }
      }

      // C2. Active Mock Test Instructions (when on /candidate/mock-tests/.../instructions)
      if (location.pathname.includes('/candidate/mock-tests/') && location.pathname.includes('/instructions')) {
        if (/\b(start test|begin test|start mock|begin mock|start|begin|shuru karo|agree and start|launch test|launch)\b/i.test(cleanText)) {
          lastExecutedTextRef.current = cleanText;
          lastExecutedTimeRef.current = now;
          playEarcon('action');
          window.dispatchEvent(new CustomEvent('drishti:mock-start-test'));
          setLastActionFeedback('Voice: Starting mock test');
          return;
        }
        if (/\b(read instructions|listen instructions|instructions padho|nirdesh padho|summary)\b/i.test(cleanText)) {
          lastExecutedTextRef.current = cleanText;
          lastExecutedTimeRef.current = now;
          playEarcon('recognize');
          window.dispatchEvent(new CustomEvent('drishti:mock-read-instructions'));
          setLastActionFeedback('Voice: Reading test instructions');
          return;
        }
      }

      // D. Universal Section Explanation & Orientation
      if (/\b(explain|sare element explain karo|explain elements|explain page|explain section|kahan hu|where am i|what is on this page|status)\b/i.test(cleanText)) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        speakSectionExplanation();
        setLiveTranscript('');
        return;
      }

      // E. Universal Section Options Summary / Repeat
      if (/\b(repeat|repeat options|dubara bolo|options batao|kya options hai|list options|options)\b/i.test(cleanText)) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        speakSectionOptions();
        setLiveTranscript('');
        return;
      }

      // F. Section Elements Selection by Number (Option 1 to Option 7)
      const currentSection = resolveSectionDescriptor(location.pathname, getSectionContext());
      let matchedIndex = -1;

      if (/\b(option 1|select 1|choose 1|number 1|first|pehla|vikalp 1)\b/i.test(cleanText) || cleanText === '1') matchedIndex = 0;
      else if (/\b(option 2|select 2|choose 2|number 2|second|dusra|vikalp 2)\b/i.test(cleanText) || cleanText === '2') matchedIndex = 1;
      else if (/\b(option 3|select 3|choose 3|number 3|third|teesra|vikalp 3)\b/i.test(cleanText) || cleanText === '3') matchedIndex = 2;
      else if (/\b(option 4|select 4|choose 4|number 4|fourth|chautha|vikalp 4)\b/i.test(cleanText) || cleanText === '4') matchedIndex = 3;
      else if (/\b(option 5|select 5|choose 5|number 5|fifth|paanchwa|vikalp 5)\b/i.test(cleanText) || cleanText === '5') matchedIndex = 4;
      else if (/\b(option 6|select 6|choose 6|number 6|sixth|chhatwa|vikalp 6)\b/i.test(cleanText) || cleanText === '6') matchedIndex = 5;
      else if (/\b(option 7|select 7|choose 7|number 7|seventh|saatwa|vikalp 7)\b/i.test(cleanText) || cleanText === '7') matchedIndex = 6;

      if (matchedIndex !== -1 && currentSection.elements[matchedIndex]) {
        const elem = currentSection.elements[matchedIndex];
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        elem.action(getSectionContext());
        if (elem.confirmSpeech) {
          speak(elem.confirmSpeech);
          announce(elem.confirmSpeech, 'polite');
        }
        setLastActionFeedback(`Selected Option ${elem.number}: ${elem.label}`);
        setLiveTranscript('');
        return;
      }

      // G. Section Element Selection by Alias
      for (const elem of currentSection.elements) {
        if (elem.aliases.some((alias) => new RegExp(`\\b${alias}\\b`, 'i').test(cleanText))) {
          lastExecutedTextRef.current = cleanText;
          lastExecutedTimeRef.current = now;
          playEarcon('action');
          elem.action(getSectionContext());
          if (elem.confirmSpeech) {
            speak(elem.confirmSpeech);
            announce(elem.confirmSpeech, 'polite');
          }
          setLastActionFeedback(`Selected: ${elem.label}`);
          setLiveTranscript('');
          return;
        }
      }

      // H. Help & Commands
      if (/\b(help|madad|commands?|what can i say|kya bolu)\b/i.test(cleanText)) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        speakAvailableCommands();
        setLiveTranscript('');
        return;
      }

      // E. Continue Practice / Start Recommended Practice (Higher priority than generic practice)
      if (
        /\b(continue practice|start practice set|recommended practice|start recommended|begin practice|resume practice)\b/i.test(cleanText) ||
        (/\bcontinue\b/i.test(cleanText) && !/\blearning\b/i.test(cleanText))
      ) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        speak('Starting practice session.');
        announce('Launching Practice Session.', 'polite');
        setLastActionFeedback('Starting Practice Session.');
        setLiveTranscript('');
        navigate('/candidate/practice');
        return;
      }

      // F. Demo Exam
      if (/\b(start demo exam|demo exam|take exam|start examination)\b/i.test(cleanText)) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        speak('Entering exam verification room for Demo Examination.');
        announce('Launching Demo Exam Verification.', 'polite');
        setLastActionFeedback('Starting Demo Exam Verification.');
        setLiveTranscript('');
        navigate('/candidate/exams/demo-exam-01/verify');
        return;
      }

      // G. LEARN: Learn / Curriculum / Syllabus / Padho / Sikho
      if (/\b(learn|curriculum|syllabus|padho|sikho|padhai|learning)\b/i.test(cleanText)) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/learn');
        speak('Opening Learning Curriculum.');
        announce('Navigating to Learning Curriculum.', 'polite');
        setLastActionFeedback('Navigating to Learn.');
        setLiveTranscript('');
        return;
      }

      // H. DASHBOARD: Dashboard / Home / Main Menu / Ghar / Wapas
      if (/\b(dashboard|home|main menu|ghar|wapas)\b/i.test(cleanText)) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/dashboard');
        speak('Opening Candidate Dashboard.');
        announce('Navigating to Candidate Dashboard.', 'polite');
        setLastActionFeedback('Navigating to Dashboard.');
        setLiveTranscript('');
        return;
      }

      // I. PRACTICE: Practice / Questions / Sawal
      if (/\b(practice|questions?|sawal)\b/i.test(cleanText)) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/practice');
        speak('Opening Practice Hub.');
        announce('Navigating to Practice Hub.', 'polite');
        setLastActionFeedback('Navigating to Practice.');
        setLiveTranscript('');
        return;
      }

      // J0. SUBJECT-SPECIFIC MOCK TESTS (High Priority before generic mock and subject learn)
      // Mathematics Mock
      if (
        /\b(maths?|mathematics|ganit)\b.*?\b(mock|test)\b|\b(mock|test)\b.*?\b(maths?|mathematics|ganit)\b/i.test(cleanText)
      ) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/mock-tests/mock-math-01');
        speak('Opening Elementary Mathematics Subject Mock Test.');
        announce('Navigating to Elementary Mathematics Mock Test.', 'polite');
        setLastActionFeedback('Navigating to Mathematics Mock Test.');
        setLiveTranscript('');
        return;
      }

      // English Mock
      if (
        /\b(english|angrezi)\b.*?\b(mock|test)\b|\b(mock|test)\b.*?\b(english|angrezi)\b/i.test(cleanText)
      ) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/mock-tests/mock-eng-01');
        speak('Opening English Language and Comprehension Mock Test.');
        announce('Navigating to English Mock Test.', 'polite');
        setLastActionFeedback('Navigating to English Mock Test.');
        setLiveTranscript('');
        return;
      }

      // GK Mock
      if (
        /\b(gk|general knowledge|samanya gyan|current affairs|defense)\b.*?\b(mock|test)\b|\b(mock|test)\b.*?\b(gk|general knowledge|samanya gyan|current affairs|defense)\b/i.test(cleanText)
      ) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/mock-tests/mock-gk-01');
        speak('Opening General Knowledge and Defense Mock Test.');
        announce('Navigating to General Knowledge Mock Test.', 'polite');
        setLastActionFeedback('Navigating to GK Mock Test.');
        setLiveTranscript('');
        return;
      }

      // Reasoning Mock
      if (
        /\b(reasoning|logic|tarkik|aptitude)\b.*?\b(mock|test)\b|\b(mock|test)\b.*?\b(reasoning|logic|tarkik|aptitude)\b/i.test(cleanText)
      ) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/mock-tests/mock-reas-01');
        speak('Opening Reasoning Ability and Aptitude Mock Test.');
        announce('Navigating to Reasoning Mock Test.', 'polite');
        setLastActionFeedback('Navigating to Reasoning Mock Test.');
        setLiveTranscript('');
        return;
      }

      // CDS Full Mock
      if (
        /\b(cds|full)\b.*?\b(mock|test)\b|\b(mock|test)\b.*?\b(cds|full)\b/i.test(cleanText)
      ) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/mock-tests/cds-full-mock-01');
        speak('Opening CDS Full Practice Examination.');
        announce('Navigating to CDS Full Mock Test.', 'polite');
        setLastActionFeedback('Navigating to CDS Full Mock Test.');
        setLiveTranscript('');
        return;
      }

      // J. MOCK TESTS
      if (/\b(mock|mocks|mock tests?|test series)\b/i.test(cleanText)) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/mock-tests');
        speak('Opening Mock Tests.');
        announce('Navigating to Mock Tests.', 'polite');
        setLastActionFeedback('Navigating to Mock Tests.');
        setLiveTranscript('');
        return;
      }

      // K. EXAMS: Exams / Examinations / Pariksha
      if (/\b(exams?|examinations?|pariksha)\b/i.test(cleanText)) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/exams');
        speak('Opening Examination Portal.');
        announce('Navigating to Examination Portal.', 'polite');
        setLastActionFeedback('Navigating to Examinations.');
        setLiveTranscript('');
        return;
      }

      // L. RESULTS: Results / Scorecard / Marks / Parinam
      if (/\b(results?|scores?|scorecards?|marks?|grades?|parinam)\b/i.test(cleanText)) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/results');
        speak('Opening Results and Analytics.');
        announce('Navigating to Results.', 'polite');
        setLastActionFeedback('Navigating to Results.');
        setLiveTranscript('');
        return;
      }

      // M. PROGRESS: Progress / Performance / Streak / Tarakki
      if (/\b(progress|performance|streaks?|growth|tarakki)\b/i.test(cleanText)) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/progress');
        speak('Opening Progress Analytics.');
        announce('Navigating to Progress.', 'polite');
        setLastActionFeedback('Navigating to Progress.');
        setLiveTranscript('');
        return;
      }

      // N. ACCESSIBILITY CALIBRATION
      if (/\b(accessibility|calibration|contrast|font size|text size|bada karo)\b/i.test(cleanText)) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        openCalibration();
        speak('Opening Accessibility Calibration Center.');
        announce('Accessibility Calibration Center opened.', 'polite');
        setLastActionFeedback('Opened Accessibility Center.');
        setLiveTranscript('');
        return;
      }

      // O. SETTINGS
      if (/\b(settings?|profiles?|accounts?)\b/i.test(cleanText)) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/settings');
        speak('Opening Candidate Settings.');
        announce('Navigating to Settings.', 'polite');
        setLastActionFeedback('Navigating to Settings.');
        setLiveTranscript('');
        return;
      }

      // P. SUBJECTS
      if (/\b(mathematics|maths?|ganit)\b/i.test(cleanText)) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/learn/mathematics');
        speak('Opening Mathematics curriculum.');
        announce('Navigating to Mathematics.', 'polite');
        setLastActionFeedback('Opened Mathematics.');
        setLiveTranscript('');
        return;
      }

      if (/\b(english|angrezi)\b/i.test(cleanText)) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/learn/english');
        speak('Opening English Language curriculum.');
        announce('Navigating to English Language.', 'polite');
        setLastActionFeedback('Opened English Language.');
        setLiveTranscript('');
        return;
      }

      if (/\b(general knowledge|gk|current affairs|samanya gyan)\b/i.test(cleanText)) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/learn/general-knowledge');
        speak('Opening General Knowledge curriculum.');
        announce('Navigating to General Knowledge.', 'polite');
        setLastActionFeedback('Opened General Knowledge.');
        setLiveTranscript('');
        return;
      }

      if (/\b(reasoning|logic|tarkik)\b/i.test(cleanText)) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/learn/reasoning');
        speak('Opening Reasoning Ability curriculum.');
        announce('Navigating to Reasoning Ability.', 'polite');
        setLastActionFeedback('Opened Reasoning.');
        setLiveTranscript('');
        return;
      }

      // Q. SPECIFIC TOPICS
      if (/\b(percentages?|pratishat)\b/i.test(cleanText)) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/learn/mathematics/percentages');
        speak('Opening Percentages topic in Mathematics.');
        announce('Navigating to Percentages.', 'polite');
        setLastActionFeedback('Opened Percentages.');
        setLiveTranscript('');
        return;
      }

      if (/\b(algebra|beejganit)\b/i.test(cleanText)) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/learn/mathematics/algebra');
        speak('Opening Algebra topic in Mathematics.');
        announce('Navigating to Algebra.', 'polite');
        setLastActionFeedback('Opened Algebra.');
        setLiveTranscript('');
        return;
      }

      if (/\b(geometry|jyamiti)\b/i.test(cleanText)) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/learn/mathematics/geometry');
        speak('Opening Geometry topic in Mathematics.');
        announce('Navigating to Geometry.', 'polite');
        setLastActionFeedback('Opened Geometry.');
        setLiveTranscript('');
        return;
      }

      if (/\b(reading comprehension|comprehension|passage)\b/i.test(cleanText)) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/learn/english/reading-comprehension');
        speak('Opening Reading Comprehension topic in English.');
        announce('Navigating to Reading Comprehension.', 'polite');
        setLastActionFeedback('Opened Reading Comprehension.');
        setLiveTranscript('');
        return;
      }

      if (/\b(grammar|vyakaran)\b/i.test(cleanText)) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/learn/english/grammar-rules');
        speak('Opening Grammar Rules topic in English.');
        announce('Navigating to Grammar Rules.', 'polite');
        setLastActionFeedback('Opened Grammar Rules.');
        setLiveTranscript('');
        return;
      }

      if (/\b(vocabulary|vocab)\b/i.test(cleanText)) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/learn/english/vocabulary-building');
        speak('Opening Vocabulary Building topic in English.');
        announce('Navigating to Vocabulary.', 'polite');
        setLastActionFeedback('Opened Vocabulary.');
        setLiveTranscript('');
        return;
      }

      if (/\b(modern history|history|itihas)\b/i.test(cleanText)) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/learn/general-knowledge/modern-history');
        speak('Opening Modern History topic in General Knowledge.');
        announce('Navigating to Modern History.', 'polite');
        setLastActionFeedback('Opened Modern History.');
        setLiveTranscript('');
        return;
      }

      if (/\b(indian polity|polity|constitution|samvidhan)\b/i.test(cleanText)) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/learn/general-knowledge/indian-polity');
        speak('Opening Indian Polity topic in General Knowledge.');
        announce('Navigating to Indian Polity.', 'polite');
        setLastActionFeedback('Opened Indian Polity.');
        setLiveTranscript('');
        return;
      }

      if (/\b(physical geography|geography|bhugol)\b/i.test(cleanText)) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/learn/general-knowledge/physical-geography');
        speak('Opening Physical Geography topic in General Knowledge.');
        announce('Navigating to Physical Geography.', 'polite');
        setLastActionFeedback('Opened Physical Geography.');
        setLiveTranscript('');
        return;
      }

      if (/\b(coding and decoding|coding decoding)\b/i.test(cleanText)) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/learn/reasoning/coding-decoding');
        speak('Opening Coding and Decoding topic in Reasoning.');
        announce('Navigating to Coding and Decoding.', 'polite');
        setLastActionFeedback('Opened Coding and Decoding.');
        setLiveTranscript('');
        return;
      }

      if (/\b(number series|series)\b/i.test(cleanText)) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/learn/reasoning/number-series');
        speak('Opening Number Series topic in Reasoning.');
        announce('Navigating to Number Series.', 'polite');
        setLastActionFeedback('Opened Number Series.');
        setLiveTranscript('');
        return;
      }

      // R. LOGOUT
      if (/\b(logout|log out|sign out|signout|bahar niklo)\b/i.test(cleanText)) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('pause');
        speak('Signing you out of Drishti.');
        announce('Signing out.', 'assertive');
        setLastActionFeedback('Signing out...');
        setLiveTranscript('');
        logout();
        return;
      }

      // Unrecognized phrase: gentle earcon + feedback
      playEarcon('error');
      setLastActionFeedback(`Heard: "${rawTranscript}". Say e.g. 'Learn' or 'Practice'.`);
    },
    [navigate, openCalibration, speak, stopSpeaking, announce, logout, speakAvailableCommands, speakPageGuidance]
  );

  // 6. Resilient Speech Recognition Engine (Fresh Instance Per Cycle)
  useEffect(() => {
    if (!isSupported) return;

    let isComponentMounted = true;
    let restartTimer: any = null;

    const SpeechRecognitionClass =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    function createAndStartRecognition() {
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
        recognition.lang = preferences?.language === 'hi' ? 'hi-IN' : 'en-US';

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
            executeCommand(final.trim());
          } else if (interim.trim()) {
            // 2. For interim speech: ONLY trigger if it is a crisp, standalone 1-or-2 word command
            // This prevents triggering mid-sentence while someone is speaking longer phrases!
            const words = interim.trim().toLowerCase().split(/\s+/);
            if (words.length <= 2) {
              const lower = interim.trim().toLowerCase();
              if (
                lower === 'learn' ||
                lower === 'practice' ||
                lower === 'dashboard' ||
                lower === 'exams' ||
                lower === 'exam' ||
                lower === 'results' ||
                lower === 'progress' ||
                lower === 'stop' ||
                lower === 'continue' ||
                lower === 'continue practice'
              ) {
                executeCommand(interim.trim());
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
  }, [isSupported, isListening, executeCommand, preferences?.language]);

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
    if (!isListening) {
      // User is enabling listening: prompt for mic permission if needed
      await requestMicPermission();
      setIsListening(true);
      try {
        sessionStorage.setItem('drishti_candidate_voice_active', 'true');
      } catch {}
      playEarcon('listen');
      speak('Voice assistant active. Say Learn, Practice, or Dashboard.');
      announce('Voice assistant active.', 'polite');
      setLastActionFeedback('Voice listening active (Alt+V to pause).');
    } else {
      setIsListening(false);
      try {
        sessionStorage.setItem('drishti_candidate_voice_active', 'false');
      } catch {}
      playEarcon('pause');
      stopSpeaking();
      announce('Voice assistant paused.', 'polite');
      setLastActionFeedback('Voice assistant paused.');
      setLiveTranscript('');
    }
  }, [isListening, requestMicPermission, speak, stopSpeaking, announce]);

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
