import { useState, useEffect, useRef, useCallback } from 'react';
import { useAccessibility } from '../contexts/AccessibilityContext';
import { playEarcon } from '../utils/soundEffects';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

/**
 * Normalizes naturally spoken email strings into valid email formats:
 * e.g. "rahul at gmail dot com" -> "rahul@gmail.com"
 * e.g. "candidate one at gowow dot org" -> "candidate1@gowow.org"
 */
export function parseSpokenEmail(rawText: string): string {
  let cleaned = rawText.toLowerCase().trim();
  // Strip common introductory prefixes
  cleaned = cleaned.replace(/^(my email is|email is|enter email|set email|type email|email)\s+/i, '');

  // Convert spoken number words commonly transcribed in handles
  cleaned = cleaned
    .replace(/\bzero\b/g, '0')
    .replace(/\bone\b/g, '1')
    .replace(/\btwo\b/g, '2')
    .replace(/\bthree\b/g, '3')
    .replace(/\bfour\b/g, '4')
    .replace(/\bfive\b/g, '5')
    .replace(/\bsix\b/g, '6')
    .replace(/\bseven\b/g, '7')
    .replace(/\beight\b/g, '8')
    .replace(/\bnine\b/g, '9');

  // Convert spoken symbols
  cleaned = cleaned
    .replace(/\s+at\s+the\s+rate\s+/gi, '@')
    .replace(/\s+at\s+rate\s+/gi, '@')
    .replace(/\s+at\s+/gi, '@')
    .replace(/\s+dot\s+/gi, '.')
    .replace(/\s+period\s+/gi, '.')
    .replace(/\s+underscore\s+/gi, '_')
    .replace(/\s+dash\s+/gi, '-')
    .replace(/\s+hyphen\s+/gi, '-');

  // Strip all internal whitespace
  cleaned = cleaned.replace(/\s+/g, '');

  return cleaned;
}

/**
 * Extracts password from spoken input:
 * e.g. "password MySecretPass123" -> "MySecretPass123"
 */
export function parseSpokenPassword(rawText: string): string {
  let cleaned = rawText.trim();
  cleaned = cleaned.replace(/^(my password is|password is|enter password|set password|type password|password)\s+/i, '');
  return cleaned;
}

/**
 * Extracts clean full name from spoken input:
 * e.g. "my name is Aarav Sharma" -> "Aarav Sharma"
 */
export function parseSpokenName(rawText: string): string {
  let cleaned = rawText.trim();
  cleaned = cleaned.replace(/^(my name is|name is|enter name|set name|full name|name)\s+/i, '');
  return cleaned
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export interface UseAuthVoiceNavigatorOptions {
  page: 'login' | 'signup' | 'role-selection' | 'forgot-password';
  enabled?: boolean;
  onFillEmail?: (email: string) => void;
  onFillPassword?: (password: string) => void;
  onFillName?: (name: string) => void;
  onSubmitForm?: () => void;
  onQuickCandidateLogin?: () => void;
  onQuickExaminerLogin?: () => void;
  onQuickAdminLogin?: () => void;
  onQuickCandidateRegister?: () => void;
  onSelectRole?: (role: 'candidate' | 'examiner') => void;
  onNavigateLogin?: () => void;
  onNavigateSignup?: () => void;
  onNavigateForgotPassword?: () => void;
  onStartFaceAccess?: () => void;
  currentEmail?: string;
  isPasswordSet?: boolean;
  currentName?: string;
}

export interface AuthVoiceState {
  isListening: boolean;
  isActuallyRecognizing: boolean;
  isSupported: boolean;
  hasPermissionError: boolean;
  liveTranscript: string;
  lastTranscript: string | null;
  lastActionFeedback: string | null;
  toggleListening: () => void;
  speakGuidance: () => void;
  speakCommandsHelp: () => void;
  requestMicPermission: () => Promise<boolean>;
}

export function useAuthVoiceNavigator(options: UseAuthVoiceNavigatorOptions): AuthVoiceState {
  const { speak, announce } = useAccessibility();
  const isEnabled = options.enabled !== false;

  const [isListening, setIsListening] = useState<boolean>(() => {
    if (options.enabled === false) return false;
    try {
      const stored = sessionStorage.getItem('drishti_auth_voice_active');
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
  const restartTimerRef = useRef<any>(null);
  const executeAuthCommandRef = useRef<(cmd: string) => void>(() => {});
  const createAndStartRef = useRef<() => void>(() => {});

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const lastExecutedTextRef = useRef<string>('');
  const lastExecutedTimeRef = useRef<number>(0);
  const hasSpokenWelcomeRef = useRef<boolean>(false);

  const isSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // Spoken Guidance generator based on active auth screen
  const speakGuidance = useCallback(() => {
    playEarcon('action');
    const { page, currentEmail, isPasswordSet } = optionsRef.current;

    if (page === 'login') {
      const msg =
        'Welcome to DRISHTI Sign In. You can navigate and sign in completely using your voice. ' +
        'Option 1: Quick Candidate Demo Sign In. ' +
        'Option 2: Speak Email Address. ' +
        'Option 3: Speak Password. ' +
        'Option 4: Submit Sign In. ' +
        'Option 5: Create a New Account. ' +
        (currentEmail ? `Currently entered email is ${currentEmail}. ` : '') +
        (isPasswordSet ? 'Password has been entered. ' : '') +
        'To sign in immediately as candidate, say Option 1 or Candidate. To enter credentials, say Email followed by your email, or Password followed by your password.';
      speak(msg);
      announce(msg, 'assertive');
      setLastActionFeedback('Reading Sign In voice options.');
    } else if (page === 'signup') {
      const msg =
        'Welcome to DRISHTI Registration. ' +
        'Option 1: Quick Register as Demo Candidate. ' +
        'Option 2: Speak Full Name. ' +
        'Option 3: Speak Email Address. ' +
        'Option 4: Speak Password. ' +
        'Option 5: Submit Registration. ' +
        'Option 6: Already have an account? Go to Sign In. ' +
        'Say Option 1 to quickly create a test candidate account, or say Name, Email, and Password.';
      speak(msg);
      announce(msg, 'assertive');
      setLastActionFeedback('Reading Registration voice options.');
    } else if (page === 'role-selection') {
      const msg =
        'Choose your DRISHTI Account Type. ' +
        'Option 1: Candidate - Student, examinee, or competitive test taker. ' +
        'Option 2: Examiner - Author and manage accessible examinations. ' +
        'Option 3: Already have an account? Sign In. ' +
        'Say Option 1 for Candidate or Option 2 for Examiner.';
      speak(msg);
      announce(msg, 'assertive');
      setLastActionFeedback('Reading Role Selection voice options.');
    } else if (page === 'forgot-password') {
      const msg =
        'Password Recovery. ' +
        'Option 1: Speak Email Address. ' +
        'Option 2: Send Recovery Link. ' +
        'Option 3: Return to Sign In. ' +
        'Say Email followed by your registered email address, or say Option 3 to go back.';
      speak(msg);
      announce(msg, 'assertive');
      setLastActionFeedback('Reading Password Recovery voice options.');
    }
  }, [speak, announce]);

  const speakCommandsHelp = useCallback(() => {
    playEarcon('action');
    const { page } = optionsRef.current;
    let helpText = '';
    if (page === 'login') {
      helpText =
        'Available voice commands for Sign In: ' +
        'Say Candidate or Option 1 to sign in instantly. ' +
        'Say Examiner to sign in as examiner. ' +
        'Say Email followed by your email address to enter email. ' +
        'Say Password followed by your password to enter password. ' +
        'Say Submit or Option 4 to log in. ' +
        'Say Sign Up or Option 5 to create an account. ' +
        'Say Read Form to hear what is currently filled. ' +
        'Press Alt plus V to pause or resume microphone.';
    } else if (page === 'signup') {
      helpText =
        'Available voice commands for Registration: ' +
        'Say Candidate or Option 1 to register quickly. ' +
        'Say Name followed by your name. ' +
        'Say Email followed by your email. ' +
        'Say Password followed by your password. ' +
        'Say Submit or Option 5 to register. ' +
        'Say Sign In or Option 6 to go to login.';
    } else {
      helpText =
        'Say Option 1 for Candidate, Option 2 for Examiner, or Option 3 to Sign In.';
    }
    speak(helpText);
    announce(helpText, 'polite');
    setLastActionFeedback('Spoke voice commands cheatsheet.');
  }, [speak, announce]);

  // Command Execution Engine
  const executeAuthCommand = useCallback(
    (transcript: string) => {
      const cleanText = transcript.trim().toLowerCase();
      const now = Date.now();

      // Prevent duplicate triggers within 1.2s for identical commands
      if (
        cleanText === lastExecutedTextRef.current &&
        now - lastExecutedTimeRef.current < 1200
      ) {
        return;
      }

      const opts = optionsRef.current;

      // 1. HELP / GUIDANCE / INSTRUCTIONS
      if (
        /\b(help|madad|guidance|instructions|kya bolu|commands|options|cheatsheet)\b/i.test(
          cleanText
        )
      ) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        speakCommandsHelp();
        return;
      }

      // 2. READ FORM / STATUS
      if (
        /\b(read form|check form|status|kya likha hai|kya bhara hai|form status)\b/i.test(
          cleanText
        )
      ) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('recognize');
        const emailMsg = opts.currentEmail
          ? `Email is set to ${opts.currentEmail}.`
          : 'Email has not been entered yet.';
        const passMsg = opts.isPasswordSet
          ? 'Password is entered.'
          : 'Password has not been entered yet.';
        const nameMsg = opts.currentName ? `Name is ${opts.currentName}.` : '';
        const readout = `${nameMsg} ${emailMsg} ${passMsg} Say Submit to proceed or say Option 1 for demo login.`.trim();
        speak(readout);
        announce(readout, 'polite');
        setLastActionFeedback('Read form status.');
        return;
      }

      // 3. PAGE-SPECIFIC COMMANDS: LOGIN PAGE
      if (opts.page === 'login') {
        // Option 1: Quick Candidate Sign In
        if (
          /\b(option (1|one)|candidate|student|demo candidate|candidate login|login as candidate|sign in as candidate|chalo candidate)\b/i.test(
            cleanText
          ) ||
          cleanText === '1' ||
          cleanText === 'one' ||
          cleanText === 'first' ||
          cleanText === 'pehla'
        ) {
          lastExecutedTextRef.current = cleanText;
          lastExecutedTimeRef.current = now;
          playEarcon('action');
          speak('Signing in as Candidate. Loading workspace.');
          announce('Signing in as Candidate.', 'assertive');
          setLastActionFeedback('Signing in as Candidate...');
          if (opts.onQuickCandidateLogin) opts.onQuickCandidateLogin();
          return;
        }

        // Quick Examiner Sign In
        if (
          /\b(examiner|teacher|demo examiner|examiner login|login as examiner|sign in as examiner)\b/i.test(
            cleanText
          )
        ) {
          lastExecutedTextRef.current = cleanText;
          lastExecutedTimeRef.current = now;
          playEarcon('action');
          speak('Signing in as Examiner. Loading examiner dashboard.');
          announce('Signing in as Examiner.', 'assertive');
          setLastActionFeedback('Signing in as Examiner...');
          if (opts.onQuickExaminerLogin) opts.onQuickExaminerLogin();
          return;
        }

        // Quick Admin Sign In
        if (/\b(admin|administrator|admin login|login as admin)\b/i.test(cleanText)) {
          lastExecutedTextRef.current = cleanText;
          lastExecutedTimeRef.current = now;
          playEarcon('action');
          speak('Signing in as Administrator.');
          announce('Signing in as Administrator.', 'assertive');
          setLastActionFeedback('Signing in as Admin...');
          if (opts.onQuickAdminLogin) opts.onQuickAdminLogin();
          return;
        }

        // Option 2: Enter Email
        if (
          cleanText === 'option 2' ||
          cleanText === 'option two' ||
          cleanText === 'two' ||
          cleanText === '2' ||
          cleanText === 'second' ||
          cleanText === 'dusra' ||
          cleanText === 'email' ||
          cleanText === 'enter email'
        ) {
          lastExecutedTextRef.current = cleanText;
          lastExecutedTimeRef.current = now;
          playEarcon('recognize');
          speak(
            'Please say: Email followed by your email address. For example: Email student at example dot com.'
          );
          announce('Please speak your email address.', 'polite');
          setLastActionFeedback('Awaiting spoken email address...');
          return;
        }

        // Spoken Email Value: "email [address]" or "my email is [address]"
        if (
          /^(email|my email is|set email|enter email|type email)\s+/i.test(cleanText) ||
          cleanText.includes('@') ||
          cleanText.includes(' at ')
        ) {
          const parsed = parseSpokenEmail(cleanText);
          if (parsed && parsed.length > 2) {
            lastExecutedTextRef.current = cleanText;
            lastExecutedTimeRef.current = now;
            playEarcon('recognize');
            if (opts.onFillEmail) opts.onFillEmail(parsed);
            const feedback = `Email set to ${parsed}. Now say Password followed by your password, or say Option 3.`;
            speak(feedback);
            announce(`Email entered: ${parsed}`, 'polite');
            setLastActionFeedback(`Email set: ${parsed}`);
            return;
          }
        }

        // Option 3: Enter Password
        if (
          cleanText === 'option 3' ||
          cleanText === 'option three' ||
          cleanText === 'three' ||
          cleanText === '3' ||
          cleanText === 'third' ||
          cleanText === 'teesra' ||
          cleanText === 'password' ||
          cleanText === 'enter password'
        ) {
          lastExecutedTextRef.current = cleanText;
          lastExecutedTimeRef.current = now;
          playEarcon('recognize');
          speak(
            'Please say: Password followed by your password. For example: Password MySecret123.'
          );
          announce('Please speak your password.', 'polite');
          setLastActionFeedback('Awaiting spoken password...');
          return;
        }

        // Spoken Password Value: "password [val]"
        if (
          /^(password|my password is|set password|enter password|type password)\s+/i.test(
            cleanText
          )
        ) {
          const parsedPass = parseSpokenPassword(cleanText);
          if (parsedPass && parsedPass.length > 0) {
            lastExecutedTextRef.current = cleanText;
            lastExecutedTimeRef.current = now;
            playEarcon('recognize');
            if (opts.onFillPassword) opts.onFillPassword(parsedPass);
            const feedback = 'Password entered. Say Submit or Option 4 to sign in.';
            speak(feedback);
            announce('Password entered.', 'polite');
            setLastActionFeedback('Password entered.');
            return;
          }
        }

        // Option Face Access: "face login", "face access", "camera login", "face authentication"
        if (
          /\b(face login|face access|camera login|face authentication|face scan|chehra login)\b/i.test(
            cleanText
          )
        ) {
          lastExecutedTextRef.current = cleanText;
          lastExecutedTimeRef.current = now;
          playEarcon('action');
          speak('Opening Drishti FaceAccess AI camera guided authentication.');
          announce('Opening FaceAccess AI.', 'polite');
          if (opts.onStartFaceAccess) opts.onStartFaceAccess();
          return;
        }

        // Option 4: Submit Sign In
        if (
          /\b(option (4|four)|submit|sign in|login|log in|enter|proceed|done)\b/i.test(
            cleanText
          ) ||
          cleanText === '4' ||
          cleanText === 'four' ||
          cleanText === 'fourth' ||
          cleanText === 'chautha'
        ) {
          lastExecutedTextRef.current = cleanText;
          lastExecutedTimeRef.current = now;
          playEarcon('action');
          if (!opts.currentEmail) {
            speak(
              'Email is required. Please say Email followed by your email address, or say Option 1 for demo candidate sign in.'
            );
            announce('Email required.', 'assertive');
            setLastActionFeedback('Email is required to sign in.');
            return;
          }
          if (!opts.isPasswordSet) {
            speak('Password is required. Please say Password followed by your password.');
            announce('Password required.', 'assertive');
            setLastActionFeedback('Password is required.');
            return;
          }
          speak('Submitting sign in credentials...');
          announce('Submitting sign in.', 'assertive');
          setLastActionFeedback('Submitting sign in...');
          if (opts.onSubmitForm) opts.onSubmitForm();
          return;
        }

        // Option 5: Register / Sign Up / Create Account
        if (
          /\b(option (5|five)|sign up|signup|register|create account|new account|naya account)\b/i.test(
            cleanText
          ) ||
          cleanText === '5' ||
          cleanText === 'five' ||
          cleanText === 'fifth' ||
          cleanText === 'panchwa'
        ) {
          lastExecutedTextRef.current = cleanText;
          lastExecutedTimeRef.current = now;
          playEarcon('action');
          speak('Opening Registration page. Choose your account type.');
          announce('Navigating to Registration.', 'polite');
          setLastActionFeedback('Opening Registration...');
          if (opts.onNavigateSignup) opts.onNavigateSignup();
          return;
        }

        // Forgot Password
        if (/\b(forgot password|lost password|password bhul gaya)\b/i.test(cleanText)) {
          lastExecutedTextRef.current = cleanText;
          lastExecutedTimeRef.current = now;
          playEarcon('action');
          speak('Opening Forgot Password recovery page.');
          announce('Navigating to Forgot Password.', 'polite');
          setLastActionFeedback('Opening Forgot Password...');
          if (opts.onNavigateForgotPassword) opts.onNavigateForgotPassword();
          return;
        }

        // Clear fields
        if (/\b(clear email|email hatao)\b/i.test(cleanText)) {
          lastExecutedTextRef.current = cleanText;
          lastExecutedTimeRef.current = now;
          playEarcon('action');
          if (opts.onFillEmail) opts.onFillEmail('');
          speak('Email cleared.');
          setLastActionFeedback('Email cleared.');
          return;
        }

        if (/\b(clear password|password hatao)\b/i.test(cleanText)) {
          lastExecutedTextRef.current = cleanText;
          lastExecutedTimeRef.current = now;
          playEarcon('action');
          if (opts.onFillPassword) opts.onFillPassword('');
          speak('Password cleared.');
          setLastActionFeedback('Password cleared.');
          return;
        }
      }

      // 4. PAGE-SPECIFIC COMMANDS: SIGNUP PAGE
      if (opts.page === 'signup') {
        // Option 1: Quick Register Demo Candidate
        if (
          /\b(option (1|one)|candidate|quick register|demo candidate|register candidate)\b/i.test(
            cleanText
          ) ||
          cleanText === '1' ||
          cleanText === 'one' ||
          cleanText === 'first' ||
          cleanText === 'pehla'
        ) {
          lastExecutedTextRef.current = cleanText;
          lastExecutedTimeRef.current = now;
          playEarcon('action');
          speak('Quickly registering demo Candidate account.');
          announce('Registering Candidate account.', 'assertive');
          setLastActionFeedback('Registering Candidate...');
          if (opts.onQuickCandidateRegister) opts.onQuickCandidateRegister();
          return;
        }

        // Option 2: Enter Name
        if (
          cleanText === 'option 2' ||
          cleanText === 'option two' ||
          cleanText === 'two' ||
          cleanText === '2' ||
          cleanText === 'second' ||
          cleanText === 'dusra' ||
          cleanText === 'name' ||
          cleanText === 'enter name'
        ) {
          lastExecutedTextRef.current = cleanText;
          lastExecutedTimeRef.current = now;
          playEarcon('recognize');
          speak('Please say: Name followed by your full name. For example: Name Aarav Sharma.');
          announce('Please speak your full name.', 'polite');
          setLastActionFeedback('Awaiting spoken name...');
          return;
        }

        // Spoken Name: "name [name]"
        if (/^(name|my name is|enter name|set name)\s+/i.test(cleanText)) {
          const parsed = parseSpokenName(cleanText);
          if (parsed && parsed.length > 1) {
            lastExecutedTextRef.current = cleanText;
            lastExecutedTimeRef.current = now;
            playEarcon('recognize');
            if (opts.onFillName) opts.onFillName(parsed);
            speak(`Name set to ${parsed}. Now say Email followed by your email address.`);
            announce(`Name entered: ${parsed}`, 'polite');
            setLastActionFeedback(`Name set: ${parsed}`);
            return;
          }
        }

        // Option 3: Enter Email
        if (
          cleanText === 'option 3' ||
          cleanText === 'option three' ||
          cleanText === 'three' ||
          cleanText === '3' ||
          cleanText === 'third' ||
          cleanText === 'teesra' ||
          cleanText === 'email' ||
          cleanText === 'enter email'
        ) {
          lastExecutedTextRef.current = cleanText;
          lastExecutedTimeRef.current = now;
          playEarcon('recognize');
          speak('Please say: Email followed by your email address.');
          announce('Please speak your email address.', 'polite');
          setLastActionFeedback('Awaiting spoken email address...');
          return;
        }

        // Spoken Email Value
        if (
          /^(email|my email is|set email|enter email)\s+/i.test(cleanText) ||
          cleanText.includes('@') ||
          cleanText.includes(' at ')
        ) {
          const parsed = parseSpokenEmail(cleanText);
          if (parsed && parsed.length > 2) {
            lastExecutedTextRef.current = cleanText;
            lastExecutedTimeRef.current = now;
            playEarcon('recognize');
            if (opts.onFillEmail) opts.onFillEmail(parsed);
            speak(`Email set to ${parsed}. Now say Password followed by your password.`);
            announce(`Email entered: ${parsed}`, 'polite');
            setLastActionFeedback(`Email set: ${parsed}`);
            return;
          }
        }

        // Option 4: Enter Password
        if (
          cleanText === 'option 4' ||
          cleanText === 'option four' ||
          cleanText === 'four' ||
          cleanText === '4' ||
          cleanText === 'fourth' ||
          cleanText === 'chautha' ||
          cleanText === 'password'
        ) {
          lastExecutedTextRef.current = cleanText;
          lastExecutedTimeRef.current = now;
          playEarcon('recognize');
          speak('Please say: Password followed by your secure password.');
          announce('Please speak your password.', 'polite');
          setLastActionFeedback('Awaiting spoken password...');
          return;
        }

        // Spoken Password Value
        if (/^(password|my password is|set password|enter password)\s+/i.test(cleanText)) {
          const parsedPass = parseSpokenPassword(cleanText);
          if (parsedPass && parsedPass.length > 0) {
            lastExecutedTextRef.current = cleanText;
            lastExecutedTimeRef.current = now;
            playEarcon('recognize');
            if (opts.onFillPassword) opts.onFillPassword(parsedPass);
            speak('Password entered. Say Submit or Option 5 to complete registration.');
            announce('Password entered.', 'polite');
            setLastActionFeedback('Password entered.');
            return;
          }
        }

        // Option 5: Submit Registration
        if (
          /\b(option (5|five)|submit|register|create account|sign up|proceed|done)\b/i.test(
            cleanText
          ) ||
          cleanText === '5' ||
          cleanText === 'five' ||
          cleanText === 'fifth' ||
          cleanText === 'panchwa'
        ) {
          lastExecutedTextRef.current = cleanText;
          lastExecutedTimeRef.current = now;
          playEarcon('action');
          speak('Submitting registration form...');
          announce('Submitting registration.', 'assertive');
          setLastActionFeedback('Submitting registration...');
          if (opts.onSubmitForm) opts.onSubmitForm();
          return;
        }

        // Option 6: Go to Sign In
        if (
          /\b(option (6|six)|sign in|login|log in|already have an account|wapas login)\b/i.test(
            cleanText
          ) ||
          cleanText === '6' ||
          cleanText === 'six' ||
          cleanText === 'sixth' ||
          cleanText === 'chatha'
        ) {
          lastExecutedTextRef.current = cleanText;
          lastExecutedTimeRef.current = now;
          playEarcon('action');
          speak('Returning to Sign In page.');
          announce('Navigating to Sign In.', 'polite');
          setLastActionFeedback('Opening Sign In...');
          if (opts.onNavigateLogin) opts.onNavigateLogin();
          return;
        }
      }

      // 5. PAGE-SPECIFIC COMMANDS: ROLE SELECTION
      if (opts.page === 'role-selection') {
        // Option 1: Candidate
        if (
          /\b(option (1|one)|candidate|student|examinee)\b/i.test(cleanText) ||
          cleanText === '1' ||
          cleanText === 'one' ||
          cleanText === 'first' ||
          cleanText === 'pehla'
        ) {
          lastExecutedTextRef.current = cleanText;
          lastExecutedTimeRef.current = now;
          playEarcon('action');
          speak('Candidate selected. Opening Candidate registration.');
          announce('Candidate selected.', 'assertive');
          setLastActionFeedback('Candidate selected.');
          if (opts.onSelectRole) opts.onSelectRole('candidate');
          return;
        }

        // Option 2: Examiner
        if (
          /\b(option (2|two)|examiner|teacher|institution|creator)\b/i.test(cleanText) ||
          cleanText === '2' ||
          cleanText === 'two' ||
          cleanText === 'second' ||
          cleanText === 'dusra'
        ) {
          lastExecutedTextRef.current = cleanText;
          lastExecutedTimeRef.current = now;
          playEarcon('action');
          speak('Examiner selected. Opening Examiner registration.');
          announce('Examiner selected.', 'assertive');
          setLastActionFeedback('Examiner selected.');
          if (opts.onSelectRole) opts.onSelectRole('examiner');
          return;
        }

        // Option 3: Already have an account -> Sign In
        if (
          /\b(option (3|three)|sign in|login|already have account)\b/i.test(cleanText) ||
          cleanText === '3' ||
          cleanText === 'three' ||
          cleanText === 'third' ||
          cleanText === 'teesra'
        ) {
          lastExecutedTextRef.current = cleanText;
          lastExecutedTimeRef.current = now;
          playEarcon('action');
          speak('Opening Sign In page.');
          announce('Opening Sign In.', 'polite');
          setLastActionFeedback('Opening Sign In...');
          if (opts.onNavigateLogin) opts.onNavigateLogin();
          return;
        }
      }

      // 6. PAGE-SPECIFIC COMMANDS: FORGOT PASSWORD
      if (opts.page === 'forgot-password') {
        if (
          /^(email|my email is|enter email)\s+/i.test(cleanText) ||
          cleanText.includes('@') ||
          cleanText.includes(' at ')
        ) {
          const parsed = parseSpokenEmail(cleanText);
          if (parsed && parsed.length > 2) {
            lastExecutedTextRef.current = cleanText;
            lastExecutedTimeRef.current = now;
            playEarcon('recognize');
            if (opts.onFillEmail) opts.onFillEmail(parsed);
            speak(`Email set to ${parsed}. Say Option 2 or Submit to send recovery link.`);
            announce(`Email set to ${parsed}`, 'polite');
            setLastActionFeedback(`Email set: ${parsed}`);
            return;
          }
        }

        if (
          /\b(option (2|two)|submit|send|send link|reset|proceed)\b/i.test(cleanText) ||
          cleanText === '2' ||
          cleanText === 'two'
        ) {
          lastExecutedTextRef.current = cleanText;
          lastExecutedTimeRef.current = now;
          playEarcon('action');
          speak('Sending password reset instructions.');
          if (opts.onSubmitForm) opts.onSubmitForm();
          return;
        }

        if (
          /\b(option (3|three)|back|sign in|login|wapas)\b/i.test(cleanText) ||
          cleanText === '3' ||
          cleanText === 'three'
        ) {
          lastExecutedTextRef.current = cleanText;
          lastExecutedTimeRef.current = now;
          playEarcon('action');
          speak('Returning to Sign In page.');
          if (opts.onNavigateLogin) opts.onNavigateLogin();
          return;
        }
      }
    },
    [speak, announce, speakCommandsHelp]
  );

  useEffect(() => {
    executeAuthCommandRef.current = executeAuthCommand;
  }, [executeAuthCommand]);

  // Request explicit mic permission
  const requestMicPermission = useCallback(async (): Promise<boolean> => {
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
        setHasPermissionError(false);
        setIsListening(true);
        isListeningRef.current = true;
        try {
          sessionStorage.setItem('drishti_auth_voice_active', 'true');
        } catch {}
        createAndStartRef.current?.();
        return true;
      }
      return false;
    } catch {
      setHasPermissionError(true);
      return false;
    }
  }, []);

  // Toggle listening
  const toggleListening = useCallback(async () => {
    if (isListeningRef.current) {
      setIsListening(false);
      isListeningRef.current = false;
      try {
        sessionStorage.setItem('drishti_auth_voice_active', 'false');
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
      speak('Voice Assistant paused. Press Alt plus V or click to resume.');
      announce('Voice Assistant paused.', 'polite');
      setLastActionFeedback('Microphone paused.');
      setLiveTranscript('');
    } else {
      const granted = await requestMicPermission();
      if (!granted) return;
      setIsListening(true);
      isListeningRef.current = true;
      try {
        sessionStorage.setItem('drishti_auth_voice_active', 'true');
      } catch {}
      playEarcon('listen');
      speak('Voice Assistant listening. Say Candidate to sign in, or say Help for commands.');
      announce('Voice Assistant active.', 'polite');
      setLastActionFeedback('Microphone listening.');
      createAndStartRef.current?.();
    }
  }, [requestMicPermission, speak, announce]);

  // Speech Recognition Lifecycle
  useEffect(() => {
    if (!isEnabled || !isSupported) {
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
      return;
    }

    let isMounted = true;
    const SpeechClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechClass) return;

    function createAndStart() {
      if (!isMounted || !isListeningRef.current) return;

      if (recognitionRef.current) {
        try {
          recognitionRef.current.onend = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.abort();
        } catch {}
        recognitionRef.current = null;
      }

      try {
        const recognition = new SpeechClass();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-IN';

        recognition.onstart = () => {
          if (!isMounted) return;
          setIsActuallyRecognizing(true);
          setHasPermissionError(false);
        };

        recognition.onresult = (event: any) => {
          if (!isMounted) return;
          let interim = '';
          let final = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const piece = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              final += piece;
            } else {
              interim += piece;
            }
          }

          const activeText = final.trim() || interim.trim();
          if (activeText) {
            setLiveTranscript(activeText);
          }

          if (final.trim()) {
            setLastTranscript(final.trim());
            executeAuthCommandRef.current(final.trim());
          } else if (interim.trim().length > 2) {
            const lower = interim.trim().toLowerCase();
            if (
              lower === 'candidate' ||
              lower === 'student' ||
              lower === 'examiner' ||
              lower === 'admin' ||
              lower === 'option 1' ||
              lower === 'option one' ||
              lower === 'option 2' ||
              lower === 'option two' ||
              lower === 'option 3' ||
              lower === 'option three' ||
              lower === 'option 4' ||
              lower === 'option four' ||
              lower === 'option 5' ||
              lower === 'option five' ||
              lower === 'submit' ||
              lower === 'help'
            ) {
              executeAuthCommandRef.current(lower);
            }
          }
        };

        recognition.onerror = (event: any) => {
          if (!isMounted) return;
          if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            setHasPermissionError(true);
            setIsActuallyRecognizing(false);
          }
        };

        recognition.onend = () => {
          if (!isMounted) return;
          setIsActuallyRecognizing(false);
          if (isListeningRef.current && isEnabled) {
            clearTimeout(restartTimerRef.current);
            restartTimerRef.current = setTimeout(() => {
              if (isMounted && isListeningRef.current) {
                createAndStart();
              }
            }, 300);
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
      } catch (err: any) {
        if (err?.name === 'NotAllowedError') {
          setHasPermissionError(true);
        }
        setIsActuallyRecognizing(false);
      }
    }

    createAndStartRef.current = createAndStart;

    if (isListening) {
      createAndStart();
    }

    return () => {
      isMounted = false;
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
    };
  }, [isEnabled, isSupported, isListening]);

  // Global Keyboard Shortcuts (Alt+V toggles mic, Alt+H speaks commands, Alt+G speaks guidance)
  useEffect(() => {
    if (!isEnabled) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        toggleListening();
      } else if (e.altKey && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        speakCommandsHelp();
      } else if (e.altKey && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        speakGuidance();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEnabled, toggleListening, speakCommandsHelp, speakGuidance]);

  // Welcome Announcement on Mount
  useEffect(() => {
    if (!isEnabled) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      return;
    }
    if (hasSpokenWelcomeRef.current) return;
    hasSpokenWelcomeRef.current = true;

    const timer = setTimeout(() => {
      speakGuidance();
    }, 450);

    return () => clearTimeout(timer);
  }, [isEnabled, speakGuidance]);

  return {
    isListening,
    isActuallyRecognizing,
    isSupported,
    hasPermissionError,
    liveTranscript,
    lastTranscript,
    lastActionFeedback,
    toggleListening,
    speakGuidance,
    speakCommandsHelp,
    requestMicPermission,
  };
}
