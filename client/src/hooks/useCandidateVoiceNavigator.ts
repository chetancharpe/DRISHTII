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
  isSupported: boolean;
  lastTranscript: string | null;
  lastActionFeedback: string | null;
  toggleListening: () => void;
  speakPageGuidance: () => void;
  speakAvailableCommands: () => void;
}

export function useCandidateVoiceNavigator(): CandidateVoiceState {
  const navigate = useNavigate();
  const location = useLocation();
  const { speak, stopSpeaking, announce, openCalibration } = useAccessibility();
  const { user, logout } = useAuth();

  const [isListening, setIsListening] = useState<boolean>(() => {
    // Default to true for candidate ease of use, persisted in session
    try {
      const stored = sessionStorage.getItem('drishti_candidate_voice_active');
      return stored !== null ? stored === 'true' : true;
    } catch {
      return true;
    }
  });

  const [lastTranscript, setLastTranscript] = useState<string | null>(null);
  const [lastActionFeedback, setLastActionFeedback] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef<boolean>(isListening);
  isListeningRef.current = isListening;

  const currentPathRef = useRef<string>(location.pathname);
  currentPathRef.current = location.pathname;

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

  // 4. Execute recognized voice command
  const executeCommand = useCallback(
    (rawTranscript: string) => {
      const text = rawTranscript.toLowerCase().trim();
      setLastTranscript(rawTranscript);

      // Stop speech synthesis on "stop" / "mute"
      if (
        text === 'stop' ||
        text === 'mute' ||
        text === 'quiet' ||
        text === 'silence' ||
        text === 'shut up' ||
        text.includes('stop speaking') ||
        text.includes('stop talking')
      ) {
        stopSpeaking();
        playEarcon('pause');
        setLastActionFeedback('Speech muted.');
        return;
      }

      // Voice Assistant Microphone Controls
      if (
        text.includes('stop listening') ||
        text.includes('turn off mic') ||
        text.includes('pause voice') ||
        text.includes('mute mic')
      ) {
        setIsListening(false);
        try {
          sessionStorage.setItem('drishti_candidate_voice_active', 'false');
        } catch {}
        playEarcon('pause');
        speak('Voice assistant paused. Press Alt plus V to resume listening.');
        announce('Voice assistant paused.', 'polite');
        setLastActionFeedback('Microphone paused (Alt+V to resume).');
        return;
      }

      // Help & Command References
      if (
        text === 'help' ||
        text.includes('what can i say') ||
        text.includes('commands') ||
        text.includes('voice commands') ||
        text.includes('options')
      ) {
        speakAvailableCommands();
        return;
      }

      // Page Orientation / Location
      if (
        text.includes('where am i') ||
        text.includes('current page') ||
        text.includes('what page') ||
        text.includes('status')
      ) {
        speakPageGuidance();
        return;
      }

      // Read Screen Summary / Repeat
      if (
        text.includes('read page') ||
        text.includes('read summary') ||
        text.includes('repeat') ||
        text.includes('say again')
      ) {
        speakPageGuidance();
        return;
      }

      // Navigation: Dashboard
      if (
        text === 'dashboard' ||
        text === 'home' ||
        text === 'main menu' ||
        text.includes('go to dashboard') ||
        text.includes('open dashboard') ||
        text.includes('back to dashboard') ||
        text.includes('take me home')
      ) {
        playEarcon('action');
        navigate('/candidate/dashboard');
        speak('Opening Candidate Dashboard.');
        announce('Navigating to Candidate Dashboard.', 'polite');
        setLastActionFeedback('Navigating to Dashboard.');
        return;
      }

      // Navigation: Learn / Curriculum
      if (
        text === 'learn' ||
        text === 'learning' ||
        text === 'curriculum' ||
        text === 'study' ||
        text === 'topics' ||
        text.includes('go to learn') ||
        text.includes('open learn') ||
        text.includes('view curriculum')
      ) {
        playEarcon('action');
        navigate('/candidate/learn');
        speak('Opening Learning Curriculum.');
        announce('Navigating to Learning Curriculum.', 'polite');
        setLastActionFeedback('Navigating to Learn.');
        return;
      }

      // Navigation: Practice
      if (
        text === 'practice' ||
        text === 'practice hub' ||
        text === 'questions' ||
        text.includes('go to practice') ||
        text.includes('open practice')
      ) {
        playEarcon('action');
        navigate('/candidate/practice');
        speak('Opening Practice Hub.');
        announce('Navigating to Practice Hub.', 'polite');
        setLastActionFeedback('Navigating to Practice.');
        return;
      }

      // Direct Action: Continue Practice / Start Recommended Practice
      if (
        text.includes('continue practice') ||
        text.includes('start practice set') ||
        text.includes('recommended practice') ||
        text.includes('start recommended') ||
        text.includes('start practice') ||
        text.includes('begin practice')
      ) {
        playEarcon('action');
        speak('Starting practice session.');
        announce('Launching Practice Session.', 'polite');
        setLastActionFeedback('Starting Practice Session.');
        navigate('/candidate/practice');
        return;
      }

      // Navigation: Mock Tests
      if (
        text === 'mock test' ||
        text === 'mock tests' ||
        text === 'mocks' ||
        text.includes('go to mock tests') ||
        text.includes('open mock tests') ||
        text.includes('start mock test')
      ) {
        playEarcon('action');
        navigate('/candidate/mock-tests');
        speak('Opening Mock Tests.');
        announce('Navigating to Mock Tests.', 'polite');
        setLastActionFeedback('Navigating to Mock Tests.');
        return;
      }

      // Navigation: Exams
      if (
        text === 'exam' ||
        text === 'exams' ||
        text === 'examinations' ||
        text.includes('go to exams') ||
        text.includes('open exams') ||
        text.includes('view exams')
      ) {
        playEarcon('action');
        navigate('/candidate/exams');
        speak('Opening Examination Portal.');
        announce('Navigating to Examination Portal.', 'polite');
        setLastActionFeedback('Navigating to Examinations.');
        return;
      }

      // Direct Action: Start Demo Exam
      if (
        text.includes('start demo exam') ||
        text.includes('take exam') ||
        text.includes('start examination')
      ) {
        playEarcon('action');
        speak('Entering exam verification room for Demo Examination.');
        announce('Launching Demo Exam Verification.', 'polite');
        setLastActionFeedback('Starting Demo Exam Verification.');
        navigate('/candidate/exams/demo-exam-01/verify');
        return;
      }

      // Navigation: Results
      if (
        text === 'result' ||
        text === 'results' ||
        text === 'score' ||
        text === 'scorecard' ||
        text === 'analytics' ||
        text.includes('go to results') ||
        text.includes('my score') ||
        text.includes('view results')
      ) {
        playEarcon('action');
        navigate('/candidate/results');
        speak('Opening Results and Analytics.');
        announce('Navigating to Results.', 'polite');
        setLastActionFeedback('Navigating to Results.');
        return;
      }

      // Navigation: Progress
      if (
        text === 'progress' ||
        text === 'performance' ||
        text.includes('go to progress') ||
        text.includes('my progress') ||
        text.includes('view progress')
      ) {
        playEarcon('action');
        navigate('/candidate/progress');
        speak('Opening Progress Analytics.');
        announce('Navigating to Progress.', 'polite');
        setLastActionFeedback('Navigating to Progress.');
        return;
      }

      // Action: Accessibility Settings / Calibration
      if (
        text === 'accessibility' ||
        text === 'calibration' ||
        text.includes('open accessibility') ||
        text.includes('accessibility preferences') ||
        text.includes('adjust contrast') ||
        text.includes('text size')
      ) {
        playEarcon('action');
        openCalibration();
        speak('Opening Accessibility Calibration Center.');
        announce('Accessibility Calibration Center opened.', 'polite');
        setLastActionFeedback('Opened Accessibility Center.');
        return;
      }

      // Navigation: Settings / Profile
      if (
        text === 'settings' ||
        text === 'profile' ||
        text === 'account' ||
        text.includes('go to settings') ||
        text.includes('open settings') ||
        text.includes('my profile')
      ) {
        playEarcon('action');
        navigate('/candidate/settings');
        speak('Opening Candidate Settings.');
        announce('Navigating to Settings.', 'polite');
        setLastActionFeedback('Navigating to Settings.');
        return;
      }

      // Navigation: Help & Guides
      if (
        text === 'help' ||
        text === 'guide' ||
        text === 'voice help' ||
        text === 'how to use' ||
        text === 'help and guides' ||
        text.includes('candidate help') ||
        text.includes('open help') ||
        text.includes('go to help') ||
        text.includes('faq')
      ) {
        playEarcon('action');
        navigate('/candidate/help');
        speak('Opening Candidate Help and Guides.');
        announce('Navigating to Help.', 'polite');
        setLastActionFeedback('Navigating to Help.');
        return;
      }

      // Subject Specific Jumps (Inside Learn)
      if (text.includes('mathematics') || text === 'math' || text === 'maths') {
        playEarcon('action');
        navigate('/candidate/learn/mathematics');
        speak('Opening Mathematics curriculum.');
        announce('Navigating to Mathematics.', 'polite');
        setLastActionFeedback('Opened Mathematics.');
        return;
      }

      if (text.includes('english')) {
        playEarcon('action');
        navigate('/candidate/learn/english');
        speak('Opening English Language curriculum.');
        announce('Navigating to English Language.', 'polite');
        setLastActionFeedback('Opened English Language.');
        return;
      }

      if (text.includes('general knowledge') || text === 'gk' || text.includes('current affairs')) {
        playEarcon('action');
        navigate('/candidate/learn/general-knowledge');
        speak('Opening General Knowledge curriculum.');
        announce('Navigating to General Knowledge.', 'polite');
        setLastActionFeedback('Opened General Knowledge.');
        return;
      }

      if (text.includes('reasoning') || text.includes('logic')) {
        playEarcon('action');
        navigate('/candidate/learn/reasoning');
        speak('Opening Reasoning Ability curriculum.');
        announce('Navigating to Reasoning Ability.', 'polite');
        setLastActionFeedback('Opened Reasoning.');
        return;
      }

      // Specific Topic Direct Voice Jumps
      if (text.includes('percentage') || text.includes('percentages')) {
        playEarcon('action');
        navigate('/candidate/learn/mathematics/percentages');
        speak('Opening Percentages topic in Mathematics.');
        announce('Navigating to Percentages.', 'polite');
        setLastActionFeedback('Opened Percentages.');
        return;
      }

      if (text.includes('algebra')) {
        playEarcon('action');
        navigate('/candidate/learn/mathematics/algebra');
        speak('Opening Algebra topic in Mathematics.');
        announce('Navigating to Algebra.', 'polite');
        setLastActionFeedback('Opened Algebra.');
        return;
      }

      if (text.includes('geometry')) {
        playEarcon('action');
        navigate('/candidate/learn/mathematics/geometry');
        speak('Opening Geometry topic in Mathematics.');
        announce('Navigating to Geometry.', 'polite');
        setLastActionFeedback('Opened Geometry.');
        return;
      }

      if (text.includes('reading comprehension') || text.includes('comprehension')) {
        playEarcon('action');
        navigate('/candidate/learn/english/reading-comprehension');
        speak('Opening Reading Comprehension topic in English.');
        announce('Navigating to Reading Comprehension.', 'polite');
        setLastActionFeedback('Opened Reading Comprehension.');
        return;
      }

      if (text.includes('grammar')) {
        playEarcon('action');
        navigate('/candidate/learn/english/grammar-rules');
        speak('Opening Grammar Rules topic in English.');
        announce('Navigating to Grammar Rules.', 'polite');
        setLastActionFeedback('Opened Grammar Rules.');
        return;
      }

      if (text.includes('vocabulary')) {
        playEarcon('action');
        navigate('/candidate/learn/english/vocabulary-building');
        speak('Opening Vocabulary Building topic in English.');
        announce('Navigating to Vocabulary.', 'polite');
        setLastActionFeedback('Opened Vocabulary.');
        return;
      }

      if (text.includes('history') || text.includes('modern history')) {
        playEarcon('action');
        navigate('/candidate/learn/general-knowledge/modern-history');
        speak('Opening Modern History topic in General Knowledge.');
        announce('Navigating to Modern History.', 'polite');
        setLastActionFeedback('Opened Modern History.');
        return;
      }

      if (text.includes('polity') || text.includes('constitution') || text.includes('indian polity')) {
        playEarcon('action');
        navigate('/candidate/learn/general-knowledge/indian-polity');
        speak('Opening Indian Polity topic in General Knowledge.');
        announce('Navigating to Indian Polity.', 'polite');
        setLastActionFeedback('Opened Indian Polity.');
        return;
      }

      if (text.includes('geography') || text.includes('physical geography')) {
        playEarcon('action');
        navigate('/candidate/learn/general-knowledge/physical-geography');
        speak('Opening Physical Geography topic in General Knowledge.');
        announce('Navigating to Physical Geography.', 'polite');
        setLastActionFeedback('Opened Physical Geography.');
        return;
      }

      if (text.includes('coding and decoding') || text.includes('coding decoding')) {
        playEarcon('action');
        navigate('/candidate/learn/reasoning/coding-decoding');
        speak('Opening Coding and Decoding topic in Reasoning.');
        announce('Navigating to Coding and Decoding.', 'polite');
        setLastActionFeedback('Opened Coding and Decoding.');
        return;
      }

      if (text.includes('number series') || text.includes('series')) {
        playEarcon('action');
        navigate('/candidate/learn/reasoning/number-series');
        speak('Opening Number Series topic in Reasoning.');
        announce('Navigating to Number Series.', 'polite');
        setLastActionFeedback('Opened Number Series.');
        return;
      }

      // Action: Logout
      if (
        text === 'logout' ||
        text === 'sign out' ||
        text === 'log out' ||
        text.includes('sign me out')
      ) {
        playEarcon('pause');
        speak('Signing you out of Drishti.');
        announce('Signing out.', 'assertive');
        setLastActionFeedback('Signing out...');
        logout();
        return;
      }

      // Unrecognized phrase: gentle earcon + feedback
      playEarcon('error');
      setLastActionFeedback(`Heard: "${rawTranscript}". Say 'Help' for command list.`);
    },
    [navigate, openCalibration, speak, stopSpeaking, announce, logout, speakAvailableCommands, speakPageGuidance]
  );

  // 5. Speech Recognition Lifecycle (Continuous auto-restart)
  useEffect(() => {
    if (!isSupported || !isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
      return;
    }

    const SpeechRecognitionClass =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-IN'; // Optimized for Indian English accents

    recognition.onresult = (event: any) => {
      const current = event.resultIndex;
      const transcript = event.results[current][0].transcript;
      if (transcript && transcript.trim()) {
        executeCommand(transcript);
      }
    };

    recognition.onerror = (event: any) => {
      // Ignore normal silence/no-speech events
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        console.warn('Candidate voice recognition notice:', event.error);
      }
    };

    recognition.onend = () => {
      // Auto-restart if user still has voice assistant active
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
    } catch {}

    return () => {
      try {
        recognition.abort();
      } catch {}
    };
  }, [isSupported, isListening, executeCommand]);

  // 6. Voice Guidance on Route Change
  useEffect(() => {
    // Only give arrival guidance on candidate workspace routes
    if (!location.pathname.startsWith('/candidate')) return;

    // Skip arrival guidance inside live exam or practice question session to not interfere with question audio
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

  // 7. Global Keyboard Shortcut: Alt + V toggles Voice Navigator
  const toggleListening = useCallback(() => {
    setIsListening((prev) => {
      const next = !prev;
      try {
        sessionStorage.setItem('drishti_candidate_voice_active', String(next));
      } catch {}
      if (next) {
        playEarcon('listen');
        speak('Voice assistant active. Say a command or say Help.');
        announce('Voice assistant active.', 'polite');
        setLastActionFeedback('Voice listening active (Alt+V to pause).');
      } else {
        playEarcon('pause');
        stopSpeaking();
        announce('Voice assistant paused.', 'polite');
        setLastActionFeedback('Voice assistant paused.');
      }
      return next;
    });
  }, [speak, stopSpeaking, announce]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt + V shortcut toggles Voice Navigator
      if (e.altKey && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        toggleListening();
      }
      // Alt + G shortcut re-reads current page guidance
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
    isSupported,
    lastTranscript,
    lastActionFeedback,
    toggleListening,
    speakPageGuidance,
    speakAvailableCommands,
  };
}
