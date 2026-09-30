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
      return `Welcome to your Workspace, ${name}. Say 'Continue Practice' to start your recommended Coding and Decoding session, or say 'Learn', 'Practice', 'Mock Tests', 'Exams', 'Results', or say 'Help' for all voice commands.`;
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
      "Here are the voice commands you can say at any time: " +
      "Say 'Dashboard' to go to home. " +
      "Say 'Learn' to view curriculum subjects. " +
      "Say 'Practice' to practice questions. " +
      "Say 'Continue Practice' to start your recommended practice set. " +
      "Say 'Exams' to view official examinations. " +
      "Say 'Mock Tests' for simulated tests. " +
      "Say 'Results' for scorecards. " +
      "Say 'Progress' for analytics. " +
      "Say 'Accessibility' to adjust text size and contrast. " +
      "Say 'Read Page' to hear screen summary. " +
      "Say 'Stop' to silence audio, or say 'Stop Listening' to pause microphone.";
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

  // 4. Request microphone permission explicitly
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

  // 5. Intelligent Multi-lingual Command Matcher
  const executeCommand = useCallback(
    (rawTranscript: string) => {
      const text = rawTranscript
        .toLowerCase()
        .replace(/[.,!?;:'"-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (!text) return;

      // Debounce: prevent executing the same utterance twice within 1.5s
      const now = Date.now();
      if (text === lastExecutedTextRef.current && now - lastExecutedTimeRef.current < 1500) {
        return;
      }

      setLastTranscript(rawTranscript);

      // A. Stop speech synthesis on "stop" / "mute"
      if (
        text.includes('stop') ||
        text.includes('mute') ||
        text.includes('quiet') ||
        text.includes('silence') ||
        text.includes('chup') ||
        text.includes('shant') ||
        text.includes('ruko') ||
        text.includes('band karo')
      ) {
        lastExecutedTextRef.current = text;
        lastExecutedTimeRef.current = now;
        stopSpeaking();
        playEarcon('pause');
        setLastActionFeedback('Speech muted.');
        setLiveTranscript('');
        return;
      }

      // B. Microphone Controls
      if (
        text.includes('stop listening') ||
        text.includes('turn off mic') ||
        text.includes('mic band') ||
        text.includes('pause voice') ||
        text.includes('pause mic')
      ) {
        lastExecutedTextRef.current = text;
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
      if (
        text.includes('help') ||
        text.includes('madad') ||
        text.includes('command') ||
        text.includes('what can i say') ||
        text.includes('kya bolu') ||
        text.includes('options')
      ) {
        lastExecutedTextRef.current = text;
        lastExecutedTimeRef.current = now;
        speakAvailableCommands();
        setLiveTranscript('');
        return;
      }

      // D. Page Orientation
      if (
        text.includes('where am i') ||
        text.includes('kahan') ||
        text.includes('read page') ||
        text.includes('read summary') ||
        text.includes('current page') ||
        text.includes('what page') ||
        text.includes('status')
      ) {
        lastExecutedTextRef.current = text;
        lastExecutedTimeRef.current = now;
        speakPageGuidance();
        setLiveTranscript('');
        return;
      }

      // E. Continue Practice / Start Recommended (High priority)
      if (
        text.includes('continue practice') ||
        text.includes('start practice set') ||
        text.includes('recommended practice') ||
        text.includes('start recommended') ||
        text.includes('start practice') ||
        text.includes('begin practice') ||
        text.includes('resume practice') ||
        (text.includes('continue') && !text.includes('learning'))
      ) {
        lastExecutedTextRef.current = text;
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
      if (
        text.includes('start demo exam') ||
        text.includes('demo exam') ||
        text.includes('take exam') ||
        text.includes('start examination')
      ) {
        lastExecutedTextRef.current = text;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        speak('Entering exam verification room for Demo Examination.');
        announce('Launching Demo Exam Verification.', 'polite');
        setLastActionFeedback('Starting Demo Exam Verification.');
        setLiveTranscript('');
        navigate('/candidate/exams/demo-exam-01/verify');
        return;
      }

      // G. Main Sections
      if (
        text.includes('dashboard') ||
        text.includes('home') ||
        text.includes('main menu') ||
        text.includes('ghar') ||
        text.includes('wapas')
      ) {
        lastExecutedTextRef.current = text;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/dashboard');
        speak('Opening Candidate Dashboard.');
        announce('Navigating to Candidate Dashboard.', 'polite');
        setLastActionFeedback('Navigating to Dashboard.');
        setLiveTranscript('');
        return;
      }

      if (
        text.includes('learn') ||
        text.includes('curriculum') ||
        text.includes('study') ||
        text.includes('syllabus') ||
        text.includes('padho') ||
        text.includes('sikho')
      ) {
        lastExecutedTextRef.current = text;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/learn');
        speak('Opening Learning Curriculum.');
        announce('Navigating to Learning Curriculum.', 'polite');
        setLastActionFeedback('Navigating to Learn.');
        setLiveTranscript('');
        return;
      }

      if (
        text.includes('practice') ||
        text.includes('pratice') ||
        text.includes('question') ||
        text.includes('sawal')
      ) {
        lastExecutedTextRef.current = text;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/practice');
        speak('Opening Practice Hub.');
        announce('Navigating to Practice Hub.', 'polite');
        setLastActionFeedback('Navigating to Practice.');
        setLiveTranscript('');
        return;
      }

      if (text.includes('mock')) {
        lastExecutedTextRef.current = text;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/mock-tests');
        speak('Opening Mock Tests.');
        announce('Navigating to Mock Tests.', 'polite');
        setLastActionFeedback('Navigating to Mock Tests.');
        setLiveTranscript('');
        return;
      }

      if (
        text.includes('exam') ||
        text.includes('pariksha') ||
        text.includes('test')
      ) {
        lastExecutedTextRef.current = text;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/exams');
        speak('Opening Examination Portal.');
        announce('Navigating to Examination Portal.', 'polite');
        setLastActionFeedback('Navigating to Examinations.');
        setLiveTranscript('');
        return;
      }

      if (
        text.includes('result') ||
        text.includes('score') ||
        text.includes('mark') ||
        text.includes('grade') ||
        text.includes('parinam')
      ) {
        lastExecutedTextRef.current = text;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/results');
        speak('Opening Results and Analytics.');
        announce('Navigating to Results.', 'polite');
        setLastActionFeedback('Navigating to Results.');
        setLiveTranscript('');
        return;
      }

      if (
        text.includes('progress') ||
        text.includes('streak') ||
        text.includes('growth') ||
        text.includes('performance') ||
        text.includes('tarakki')
      ) {
        lastExecutedTextRef.current = text;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/progress');
        speak('Opening Progress Analytics.');
        announce('Navigating to Progress.', 'polite');
        setLastActionFeedback('Navigating to Progress.');
        setLiveTranscript('');
        return;
      }

      if (
        text.includes('accessib') ||
        text.includes('calibration') ||
        text.includes('contrast') ||
        text.includes('font size') ||
        text.includes('text size') ||
        text.includes('bada karo')
      ) {
        lastExecutedTextRef.current = text;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        openCalibration();
        speak('Opening Accessibility Calibration Center.');
        announce('Accessibility Calibration Center opened.', 'polite');
        setLastActionFeedback('Opened Accessibility Center.');
        setLiveTranscript('');
        return;
      }

      if (
        text.includes('setting') ||
        text.includes('profile') ||
        text.includes('account')
      ) {
        lastExecutedTextRef.current = text;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/settings');
        speak('Opening Candidate Settings.');
        announce('Navigating to Settings.', 'polite');
        setLastActionFeedback('Navigating to Settings.');
        setLiveTranscript('');
        return;
      }

      // H. Subjects
      if (text.includes('math') || text.includes('ganit')) {
        lastExecutedTextRef.current = text;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/learn/mathematics');
        speak('Opening Mathematics curriculum.');
        announce('Navigating to Mathematics.', 'polite');
        setLastActionFeedback('Opened Mathematics.');
        setLiveTranscript('');
        return;
      }

      if (text.includes('english') || text.includes('angrezi')) {
        lastExecutedTextRef.current = text;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/learn/english');
        speak('Opening English Language curriculum.');
        announce('Navigating to English Language.', 'polite');
        setLastActionFeedback('Opened English Language.');
        setLiveTranscript('');
        return;
      }

      if (
        text.includes('general knowledge') ||
        text.includes(' gk') ||
        text.startsWith('gk') ||
        text.includes('current affairs') ||
        text.includes('samanya gyan')
      ) {
        lastExecutedTextRef.current = text;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/learn/general-knowledge');
        speak('Opening General Knowledge curriculum.');
        announce('Navigating to General Knowledge.', 'polite');
        setLastActionFeedback('Opened General Knowledge.');
        setLiveTranscript('');
        return;
      }

      if (
        text.includes('reasoning') ||
        text.includes('logic') ||
        text.includes('tarkik')
      ) {
        lastExecutedTextRef.current = text;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/learn/reasoning');
        speak('Opening Reasoning Ability curriculum.');
        announce('Navigating to Reasoning Ability.', 'polite');
        setLastActionFeedback('Opened Reasoning.');
        setLiveTranscript('');
        return;
      }

      // I. Specific Topics
      if (text.includes('percent') || text.includes('pratishat')) {
        lastExecutedTextRef.current = text;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/learn/mathematics/percentages');
        speak('Opening Percentages topic in Mathematics.');
        announce('Navigating to Percentages.', 'polite');
        setLastActionFeedback('Opened Percentages.');
        setLiveTranscript('');
        return;
      }

      if (text.includes('algebra') || text.includes('beejganit')) {
        lastExecutedTextRef.current = text;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/learn/mathematics/algebra');
        speak('Opening Algebra topic in Mathematics.');
        announce('Navigating to Algebra.', 'polite');
        setLastActionFeedback('Opened Algebra.');
        setLiveTranscript('');
        return;
      }

      if (text.includes('geometry') || text.includes('jyamiti')) {
        lastExecutedTextRef.current = text;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/learn/mathematics/geometry');
        speak('Opening Geometry topic in Mathematics.');
        announce('Navigating to Geometry.', 'polite');
        setLastActionFeedback('Opened Geometry.');
        setLiveTranscript('');
        return;
      }

      if (text.includes('comprehension') || text.includes('passage')) {
        lastExecutedTextRef.current = text;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/learn/english/reading-comprehension');
        speak('Opening Reading Comprehension topic in English.');
        announce('Navigating to Reading Comprehension.', 'polite');
        setLastActionFeedback('Opened Reading Comprehension.');
        setLiveTranscript('');
        return;
      }

      if (text.includes('grammar') || text.includes('vyakaran')) {
        lastExecutedTextRef.current = text;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/learn/english/grammar-rules');
        speak('Opening Grammar Rules topic in English.');
        announce('Navigating to Grammar Rules.', 'polite');
        setLastActionFeedback('Opened Grammar Rules.');
        setLiveTranscript('');
        return;
      }

      if (text.includes('vocabulary') || text.includes('vocab') || text.includes('words')) {
        lastExecutedTextRef.current = text;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/learn/english/vocabulary-building');
        speak('Opening Vocabulary Building topic in English.');
        announce('Navigating to Vocabulary.', 'polite');
        setLastActionFeedback('Opened Vocabulary.');
        setLiveTranscript('');
        return;
      }

      if (text.includes('history') || text.includes('itihas')) {
        lastExecutedTextRef.current = text;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/learn/general-knowledge/modern-history');
        speak('Opening Modern History topic in General Knowledge.');
        announce('Navigating to Modern History.', 'polite');
        setLastActionFeedback('Opened Modern History.');
        setLiveTranscript('');
        return;
      }

      if (text.includes('polity') || text.includes('constitution') || text.includes('samvidhan')) {
        lastExecutedTextRef.current = text;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/learn/general-knowledge/indian-polity');
        speak('Opening Indian Polity topic in General Knowledge.');
        announce('Navigating to Indian Polity.', 'polite');
        setLastActionFeedback('Opened Indian Polity.');
        setLiveTranscript('');
        return;
      }

      if (text.includes('geography') || text.includes('bhugol')) {
        lastExecutedTextRef.current = text;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/learn/general-knowledge/physical-geography');
        speak('Opening Physical Geography topic in General Knowledge.');
        announce('Navigating to Physical Geography.', 'polite');
        setLastActionFeedback('Opened Physical Geography.');
        setLiveTranscript('');
        return;
      }

      if (text.includes('coding') || text.includes('decoding')) {
        lastExecutedTextRef.current = text;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/learn/reasoning/coding-decoding');
        speak('Opening Coding and Decoding topic in Reasoning.');
        announce('Navigating to Coding and Decoding.', 'polite');
        setLastActionFeedback('Opened Coding and Decoding.');
        setLiveTranscript('');
        return;
      }

      if (text.includes('series')) {
        lastExecutedTextRef.current = text;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/learn/reasoning/number-series');
        speak('Opening Number Series topic in Reasoning.');
        announce('Navigating to Number Series.', 'polite');
        setLastActionFeedback('Opened Number Series.');
        setLiveTranscript('');
        return;
      }

      // J. Logout
      if (
        text.includes('logout') ||
        text.includes('log out') ||
        text.includes('sign out') ||
        text.includes('signout') ||
        text.includes('bahar')
      ) {
        lastExecutedTextRef.current = text;
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
      setLastActionFeedback(`Heard: "${rawTranscript}". Say 'Help' for command list.`);
    },
    [navigate, openCalibration, speak, stopSpeaking, announce, logout, speakAvailableCommands, speakPageGuidance]
  );

  // 6. Speech Recognition Lifecycle (Continuous auto-restart with interim results)
  useEffect(() => {
    if (!isSupported || !isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
      setIsActuallyRecognizing(false);
      return;
    }

    const SpeechRecognitionClass =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = true; // Ultra-fast real-time speech feedback
    recognition.lang = 'en-IN';

    recognition.onstart = () => {
      setIsActuallyRecognizing(true);
      setHasPermissionError(false);
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

      const activeText = (final || interim).trim();
      if (activeText) {
        setLiveTranscript(activeText);
      }

      // If final transcript is available, execute immediately
      if (final.trim()) {
        executeCommand(final.trim());
      } else if (interim.trim()) {
        // Quick match for single-word urgent commands (e.g. "stop", "dashboard", "practice", "learn")
        const lower = interim.toLowerCase().trim();
        if (
          lower === 'stop' ||
          lower === 'mute' ||
          lower === 'dashboard' ||
          lower === 'learn' ||
          lower === 'practice' ||
          lower === 'exams' ||
          lower === 'results' ||
          lower === 'progress' ||
          lower === 'continue practice'
        ) {
          executeCommand(interim.trim());
        }
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'not-allowed') {
        console.warn('Candidate voice: microphone permission denied.');
        setHasPermissionError(true);
        setIsActuallyRecognizing(false);
      } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
        console.warn('Candidate voice recognition notice:', event.error);
      }
    };

    recognition.onend = () => {
      setIsActuallyRecognizing(false);
      // Auto-restart if user still wants voice active and permission wasn't revoked
      if (isListeningRef.current) {
        setTimeout(() => {
          if (isListeningRef.current) {
            try {
              recognition.start();
            } catch {}
          }
        }, 300);
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (err) {
      console.warn('Initial recognition.start() notice:', err);
    }

    return () => {
      try {
        recognition.abort();
      } catch {}
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
      speak('Voice assistant active. Say a command or say Help.');
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
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleListening, speakPageGuidance]);

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
