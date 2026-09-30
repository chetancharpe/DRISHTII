import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAccessibility } from '../contexts/AccessibilityContext';
import { useAuth } from '../hooks/useAuth';
import { playEarcon } from '../utils/soundEffects';

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
  toggleListening: () => Promise<void>;
  requestMicPermission: () => Promise<boolean>;
  speakPageGuidance: () => void;
  speakAvailableCommands: () => void;
}

export function useCandidateVoiceNavigator(): CandidateVoiceState {
  const navigate = useNavigate();
  const location = useLocation();
  const { speak, stopSpeaking, announce, openCalibration } = useAccessibility();
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

  // 1. Spoken Guidance for each Candidate Page
  const getPageGuidance = useCallback((path: string): string => {
    if (path.startsWith('/candidate/dashboard')) {
      const name = user?.name ? user.name.split(' ')[0] : 'Candidate';
      return `Welcome to your Workspace, ${name}. Say 'Learn' to explore curriculum, 'Continue Practice' to start questions, or say 'Exams', 'Results', 'Progress', or 'Help'.`;
    }
    if (path.startsWith('/candidate/learn')) {
      if (path.includes('mathematics')) {
        return 'Mathematics Curriculum. Say Percentages, Algebra, or Geometry to begin a topic, or say Dashboard to return.';
      }
      if (path.includes('english')) {
        return 'English Language Curriculum. Say Reading Comprehension, Grammar, or Vocabulary, or say Dashboard.';
      }
      if (path.includes('general-knowledge')) {
        return 'General Knowledge Curriculum. Say Indian History, Current Affairs, or Geography, or say Dashboard.';
      }
      if (path.includes('reasoning')) {
        return 'Reasoning Ability Curriculum. Say Coding and Decoding, Series, or Analogy, or say Dashboard.';
      }
      return 'Learning Curriculum. Available subjects: Mathematics, English Language, General Knowledge, and Reasoning. Say any subject name to open it, or say Dashboard to go back.';
    }
    if (path.startsWith('/candidate/practice/session')) {
      return 'Practice Question Session. Say Option A, Option B, Option C, or Option D to choose an answer, or say Next Question, or Finish Practice.';
    }
    if (path.startsWith('/candidate/practice/history')) {
      return 'Practice Session History. Say Practice to start a new set, or say Dashboard to return.';
    }
    if (path.startsWith('/candidate/practice')) {
      return 'Practice Hub. Say Start Practice to launch your questions, or say Select Mathematics or Select Reasoning to filter.';
    }
    if (path.startsWith('/candidate/mock-tests')) {
      return 'Mock Tests Portal. Simulated competitive examinations. Say Start Mock Test, or say Dashboard to return.';
    }
    if (path.startsWith('/candidate/exams')) {
      return 'Official Examination Portal. Say Start Demo Exam to enter exam verification, or say Dashboard.';
    }
    if (path.startsWith('/candidate/results')) {
      return 'Results and Analytics. Review your test scores and accuracy breakdown. Say Read Summary, or say Dashboard to return.';
    }
    if (path.startsWith('/candidate/progress')) {
      return 'Progress and Activity. Review your study streak and topic mastery. Say Dashboard to return.';
    }
    if (path.startsWith('/candidate/settings')) {
      return 'Candidate Settings. Say Accessibility to adjust sensory and text preferences, or say Dashboard to go back.';
    }
    if (path.startsWith('/candidate/help')) {
      return 'Help and Guides. Say Commands to hear all voice navigation options, or say Dashboard to return.';
    }
    return 'Candidate Workspace. Say Dashboard, Learn, Practice, Exams, Results, or Help.';
  }, [user]);

  // 2. Announce available commands
  const speakAvailableCommands = useCallback(() => {
    playEarcon('action');
    const helpText =
      "Voice commands: " +
      "Say 'Learn' to view curriculum subjects. " +
      "Say 'Practice' to practice questions. " +
      "Say 'Dashboard' to go home. " +
      "Say 'Exams' to view examinations. " +
      "Say 'Mock Tests' for mock tests. " +
      "Say 'Results' for scorecards. " +
      "Say 'Progress' for analytics. " +
      "Say 'Accessibility' for sensory controls. " +
      "Say 'Stop' to silence audio.";
    speak(helpText);
    announce(helpText, 'polite');
    setLastActionFeedback('Reading voice commands list.');
  }, [speak, announce]);

  // 3. Announce page summary on demand
  const speakPageGuidance = useCallback(() => {
    playEarcon('recognize');
    const guidance = getPageGuidance(location.pathname);
    speak(guidance);
    announce(guidance, 'polite');
    setLastActionFeedback('Speaking page orientation guide.');
  }, [getPageGuidance, location.pathname, speak, announce]);

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

      // C. Help & Commands
      if (/\b(help|madad|commands?|what can i say|kya bolu|options)\b/i.test(cleanText)) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        speakAvailableCommands();
        setLiveTranscript('');
        return;
      }

      // D. Page Orientation
      if (/\b(where am i|kahan hu|read page|read summary|current page|what page|status)\b/i.test(cleanText)) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        speakPageGuidance();
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

      // J. MOCK TESTS
      if (/\b(mock|mocks|mock tests?)\b/i.test(cleanText)) {
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
        recognition.lang = 'en-US';

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
  }, [isSupported, isListening, executeCommand]);

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
    toggleListening,
    requestMicPermission,
    speakPageGuidance,
    speakAvailableCommands,
  };
}
