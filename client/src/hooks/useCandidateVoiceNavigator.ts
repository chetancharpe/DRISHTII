import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAccessibility } from '../contexts/AccessibilityContext';
import { useAuth } from '../hooks/useAuth';
import { playEarcon } from '../utils/soundEffects';
import {
  resolveSectionDescriptor,
  SectionContext,
} from '../services/candidateSectionExplainer';

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
  activeElementCount: number;
  toggleListening: () => Promise<void>;
  requestMicPermission: () => Promise<boolean>;
  speakPageGuidance: () => void;
  speakAvailableCommands: () => void;
}

export function useCandidateVoiceNavigator(): CandidateVoiceState {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    speak,
    stopSpeaking,
    announce,
    preferences,
    setHighContrast,
    setFontSize,
  } = useAccessibility();
  const { user, logout } = useAuth();

  const isHindi =
    preferences.language === 'hi' || (preferences as any).preferredLanguage === 'hi';

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

  // Global toggle listener
  const toggleListening = useCallback(async () => {
    if (!isListening) {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach((t) => t.stop());
          setHasPermissionError(false);
        } catch {
          setHasPermissionError(true);
        }
      }
      setIsListening(true);
      try {
        sessionStorage.setItem('drishti_candidate_voice_active', 'true');
      } catch {}
      playEarcon('listen');
      const startMsg = isHindi
        ? 'वॉइस असिस्टेंट सक्रिय है। विकल्प 1 से 7 बोलें, या सीखें, अभ्यास, या डैशबोर्ड कहें।'
        : 'Voice assistant active. Say Option 1, Learn, Practice, or Dashboard.';
      speak(startMsg);
      announce(startMsg, 'polite');
      setLastActionFeedback(
        isHindi ? 'वॉइस लिसनिंग सक्रिय (रोकने के लिए Alt+V दबाएं)' : 'Voice listening active (Alt+V to pause).'
      );
    } else {
      setIsListening(false);
      try {
        sessionStorage.setItem('drishti_candidate_voice_active', 'false');
      } catch {}
      playEarcon('pause');
      stopSpeaking();
      const pauseMsg = isHindi
        ? 'वॉइस असिस्टेंट रोक दिया गया है। पुनः चालू करने के लिए Alt+V दबाएं।'
        : 'Voice assistant paused. Press Alt+V to resume.';
      announce(pauseMsg, 'polite');
      setLastActionFeedback(
        isHindi ? 'वॉइस असिस्टेंट रोका गया (Alt+V चालू करने के लिए)' : 'Voice assistant paused.'
      );
      setLiveTranscript('');
    }
  }, [isListening, isHindi, speak, stopSpeaking, announce]);

  // Read available commands
  const speakAvailableCommands = useCallback(() => {
    playEarcon('action');
    const helpText = isHindi
      ? "वॉइस कमांड्स: " +
        "'विकल्प 1' से 'विकल्प 7' बोलकर किसी भी विकल्प को चुनें। " +
        "'समझाओ' बोलकर पृष्ठ के सभी विकल्प सुनें। " +
        "'सीखें' से पाठ्यक्रम खोलें। " +
        "'अभ्यास' से प्रश्न अभ्यास करें। " +
        "'डैशबोर्ड' से मुख्य पृष्ठ पर जाएं। " +
        "'मॉक टेस्ट' से टेस्ट दें। " +
        "'परीक्षा' से निर्धारित परीक्षाएं देखें। " +
        "'परिणाम' से स्कोरकार्ड सुनें। " +
        "'प्रगति' से अध्ययन स्ट्रीक सुनें। " +
        "'सेटिंग्स' से एक्सेसिबिलिटी बदलें। " +
        "'रुकिए' बोलकर आवाज बंद करें।"
      : "Voice commands: " +
        "Say 'Option 1' through 'Option 7' to select any element. " +
        "Say 'Explain' to hear all options on this page. " +
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
    setLastActionFeedback(isHindi ? 'वॉइस कमांड सूची सुनाई जा रही है।' : 'Reading voice commands list.');
  }, [isHindi, speak, announce]);

  // Section context builder
  const createSectionContext = useCallback((): SectionContext => {
    return {
      navigate,
      speak,
      preferences,
      setHighContrast,
      setFontSize,
      toggleListening,
      speakAvailableCommands,
      userName: user?.name ? user.name.split(' ')[0] : undefined,
    };
  }, [navigate, speak, preferences, setHighContrast, setFontSize, toggleListening, speakAvailableCommands, user?.name]);

  // Current active section
  const currentSection = resolveSectionDescriptor(location.pathname, createSectionContext());

  // Announce page summary on demand
  const speakPageGuidance = useCallback(() => {
    playEarcon('recognize');
    const section = resolveSectionDescriptor(location.pathname, createSectionContext());
    speak(section.introSpeech);
    announce(section.introSpeech, 'polite');
    setLastActionFeedback(
      isHindi
        ? `${section.name}: ${section.elementsSummary}`
        : `${section.name}: ${section.elementsSummary}`
    );
  }, [location.pathname, createSectionContext, isHindi, speak, announce]);

  // Request mic permission
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

  // High-Precision Multilingual Command Matcher
  const executeCommand = useCallback(
    (rawTranscript: string) => {
      const cleanText = rawTranscript
        .toLowerCase()
        .replace(/[.,!?;:'"-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (!cleanText) return;

      const words = cleanText.split(/\s+/).filter(Boolean);

      // Debounce: prevent executing same utterance within 1.5s
      const now = Date.now();
      if (cleanText === lastExecutedTextRef.current && now - lastExecutedTimeRef.current < 1500) {
        return;
      }

      setLastTranscript(rawTranscript);

      // Conversational Filter:
      // If candidate speaks a long sentence (4+ words), require a command intent verb
      const isLongUtterance = words.length >= 4;
      const hasCommandIntent =
        /\b(open|go to|take me to|navigate|show|start|kholo|chalo|jao|drishti|please|karna|chahiye|dekho|chuno|select|option)\b/i.test(
          cleanText
        ) ||
        /(खोलो|चलो|जाओ|दृष्टि|कृपया|बताओ|चुनो|दिखाओ|शुरू|विकल्प)/.test(cleanText);

      if (isLongUtterance && !hasCommandIntent) {
        setLastActionFeedback(
          isHindi
            ? `बातचीत सुनी गई: "${rawTranscript}"। स्पष्ट कमांड जैसे "विकल्प 1" या "अभ्यास" कहें।`
            : `Conversational speech noted: "${rawTranscript}". Say a direct command like "Option 1" or "Learn".`
        );
        return;
      }

      const sectionCtx = createSectionContext();
      const section = resolveSectionDescriptor(location.pathname, sectionCtx);

      // ----------------------------------------------------
      // A. STOP / MUTE SPEECH
      // ----------------------------------------------------
      if (
        /\b(stop|mute|quiet|silence|chup|shant|ruko|band karo)\b/i.test(cleanText) ||
        /(रुकिए|रुकें|शांत|चुप|आवाज बंद|बंद करो)/.test(cleanText)
      ) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        stopSpeaking();
        playEarcon('pause');
        setLastActionFeedback(isHindi ? 'आवाज बंद की गई।' : 'Speech muted.');
        setLiveTranscript('');
        return;
      }

      // ----------------------------------------------------
      // B. MICROPHONE PAUSE
      // ----------------------------------------------------
      if (
        /\b(stop listening|turn off mic|mic band|pause voice|pause mic)\b/i.test(cleanText) ||
        /(माइक बंद|आवाज रोको|लिसनिंग बंद)/.test(cleanText)
      ) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        setIsListening(false);
        try {
          sessionStorage.setItem('drishti_candidate_voice_active', 'false');
        } catch {}
        playEarcon('pause');
        const pMsg = isHindi
          ? 'वॉइस असिस्टेंट रोका गया। पुनः चालू करने के लिए Alt+V दबाएं।'
          : 'Voice assistant paused. Press Alt plus V to resume listening.';
        speak(pMsg);
        announce(pMsg, 'polite');
        setLastActionFeedback(isHindi ? 'माइक रोका गया (Alt+V)' : 'Microphone paused (Alt+V to resume).');
        setLiveTranscript('');
        return;
      }

      // ----------------------------------------------------
      // C. HELP & COMMANDS
      // ----------------------------------------------------
      if (
        /\b(help|madad|commands?|what can i say|kya bolu)\b/i.test(cleanText) ||
        /(मदद|सहायता|कमांड्स|क्या बोलूं)/.test(cleanText)
      ) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        speakAvailableCommands();
        setLiveTranscript('');
        return;
      }

      // ----------------------------------------------------
      // D. EXPLAIN PAGE & SECTION ELEMENTS ("समझाओ" / "explain")
      // ----------------------------------------------------
      if (
        /\b(explain|explain page|explain section|explain elements|where am i|what is on this page|status)\b/i.test(
          cleanText
        ) ||
        /(समझाओ|सारे विकल्प बताओ|सारे एलिमेंट समझाओ|कहाँ हूँ मैं|कहाँ हूँ|विवरण बताओ)/.test(cleanText)
      ) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('recognize');
        speak(section.introSpeech);
        announce(section.introSpeech, 'polite');
        setLastActionFeedback(
          isHindi
            ? `${section.name} के सभी विकल्प समझाए जा रहे हैं।`
            : `Explaining all options in ${section.name}.`
        );
        setLiveTranscript('');
        return;
      }

      // ----------------------------------------------------
      // E. REPEAT OPTIONS ("दोबारा बोलो" / "repeat options")
      // ----------------------------------------------------
      if (
        /\b(repeat|repeat options|options|dubara bolo|options batao|kya options hai)\b/i.test(cleanText) ||
        /(दोबारा बोलो|फिर से बताओ|विकल्प बताओ|क्या विकल्प हैं)/.test(cleanText)
      ) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('recognize');
        speak(section.elementsSummary);
        announce(section.elementsSummary, 'polite');
        setLastActionFeedback(
          isHindi ? `विकल्प: ${section.elementsSummary}` : `Options: ${section.elementsSummary}`
        );
        setLiveTranscript('');
        return;
      }

      // ----------------------------------------------------
      // F. NUMBER SELECTION: OPTION 1 THROUGH 7
      // Supports "Option 1", "Select 1", "First", "विकल्प 1", "पहला", "एक"
      // ----------------------------------------------------
      let selectedNumber: number | null = null;

      // Option 1
      if (
        /\b(option 1|select 1|choice 1|number 1|first|one)\b/i.test(cleanText) ||
        /(विकल्प 1|पहला|पहला विकल्प|नंबर 1|एक)/.test(cleanText)
      ) {
        selectedNumber = 1;
      }
      // Option 2
      else if (
        /\b(option 2|select 2|choice 2|number 2|second|two)\b/i.test(cleanText) ||
        /(विकल्प 2|दूसरा|दूसरा विकल्प|नंबर 2|दो)/.test(cleanText)
      ) {
        selectedNumber = 2;
      }
      // Option 3
      else if (
        /\b(option 3|select 3|choice 3|number 3|third|three)\b/i.test(cleanText) ||
        /(विकल्प 3|तीसरा|तीसरा विकल्प|नंबर 3|तीन)/.test(cleanText)
      ) {
        selectedNumber = 3;
      }
      // Option 4
      else if (
        /\b(option 4|select 4|choice 4|number 4|fourth|four)\b/i.test(cleanText) ||
        /(विकल्प 4|चौथा|चौथा विकल्प|नंबर 4|चार)/.test(cleanText)
      ) {
        selectedNumber = 4;
      }
      // Option 5
      else if (
        /\b(option 5|select 5|choice 5|number 5|fifth|five)\b/i.test(cleanText) ||
        /(विकल्प 5|पांचवा|पांचवा विकल्प|नंबर 5|पांच)/.test(cleanText)
      ) {
        selectedNumber = 5;
      }
      // Option 6
      else if (
        /\b(option 6|select 6|choice 6|number 6|sixth|six)\b/i.test(cleanText) ||
        /(विकल्प 6|छठा|छठा विकल्प|नंबर 6|छह)/.test(cleanText)
      ) {
        selectedNumber = 6;
      }
      // Option 7
      else if (
        /\b(option 7|select 7|choice 7|number 7|seventh|seven)\b/i.test(cleanText) ||
        /(विकल्प 7|सातवां|सातवां विकल्प|नंबर 7|सात)/.test(cleanText)
      ) {
        selectedNumber = 7;
      }

      if (selectedNumber !== null) {
        const targetElement = section.elements.find((el) => el.number === selectedNumber);
        if (targetElement) {
          lastExecutedTextRef.current = cleanText;
          lastExecutedTimeRef.current = now;
          playEarcon('action');
          targetElement.action(sectionCtx);
          if (targetElement.confirmSpeech) {
            speak(targetElement.confirmSpeech);
          }
          announce(
            isHindi
              ? `विकल्प ${targetElement.number}: ${targetElement.label} चुना गया।`
              : `Selected Option ${targetElement.number}: ${targetElement.label}.`,
            'polite'
          );
          setLastActionFeedback(
            isHindi
              ? `विकल्प ${targetElement.number}: ${targetElement.label} चुना गया`
              : `Selected Option ${targetElement.number}: ${targetElement.label}`
          );
          setLiveTranscript('');
          return;
        }
      }

      // ----------------------------------------------------
      // G. SECTION ELEMENT ALIASES MATCHING
      // Matches specific item aliases defined for the current section
      // ----------------------------------------------------
      for (const elem of section.elements) {
        const matched = elem.aliases.some((alias) => {
          const cleanAlias = alias.toLowerCase().trim();
          if (cleanAlias.length <= 3) {
            const regex = new RegExp(`\\b${cleanAlias}\\b`, 'i');
            return regex.test(cleanText) || cleanText === cleanAlias;
          }
          return cleanText.includes(cleanAlias);
        });

        if (matched) {
          lastExecutedTextRef.current = cleanText;
          lastExecutedTimeRef.current = now;
          playEarcon('action');
          elem.action(sectionCtx);
          if (elem.confirmSpeech) {
            speak(elem.confirmSpeech);
          }
          announce(
            isHindi
              ? `विकल्प ${elem.number}: ${elem.label} चुना गया।`
              : `Selected Option ${elem.number}: ${elem.label}.`,
            'polite'
          );
          setLastActionFeedback(
            isHindi
              ? `विकल्प ${elem.number}: ${elem.label} चुना गया`
              : `Selected Option ${elem.number}: ${elem.label}`
          );
          setLiveTranscript('');
          return;
        }
      }

      // ----------------------------------------------------
      // H. UNIVERSAL GLOBAL NAVIGATION (ANYTIME / ANYWHERE)
      // ----------------------------------------------------
      // Dashboard
      if (
        /\b(dashboard|main menu|candidate home|home)\b/i.test(cleanText) ||
        /(डैशबोर्ड|होम|मुख्य पृष्ठ|घर)/.test(cleanText)
      ) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/dashboard');
        const msg = isHindi ? 'अभ्यर्थी डैशबोर्ड खोला जा रहा है।' : 'Opening Candidate Dashboard.';
        speak(msg);
        announce(msg, 'polite');
        setLastActionFeedback(isHindi ? 'डैशबोर्ड खोला गया' : 'Opened Dashboard.');
        setLiveTranscript('');
        return;
      }

      // Learn / Curriculum
      if (
        /\b(learn|curriculum|syllabus|subjects?|padho|sikho)\b/i.test(cleanText) ||
        /(सीखें|पाठ्यक्रम|सिलेबस|विषय|पढ़ाई)/.test(cleanText)
      ) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/learn');
        const msg = isHindi ? 'सीखने का पाठ्यक्रम खोला जा रहा है।' : 'Opening Learning Curriculum.';
        speak(msg);
        announce(msg, 'polite');
        setLastActionFeedback(isHindi ? 'पाठ्यक्रम खोला गया' : 'Opened Curriculum.');
        setLiveTranscript('');
        return;
      }

      // Practice Hub
      if (
        /\b(practice|practice questions|interactive practice|practice hub|abhyas)\b/i.test(cleanText) ||
        /(अभ्यास|प्रैक्टिस|अभ्यास केंद्र)/.test(cleanText)
      ) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/practice');
        const msg = isHindi ? 'अभ्यास केंद्र खोला जा रहा है।' : 'Opening Practice Hub.';
        speak(msg);
        announce(msg, 'polite');
        setLastActionFeedback(isHindi ? 'अभ्यास केंद्र खोला गया' : 'Opened Practice Hub.');
        setLiveTranscript('');
        return;
      }

      // Official Exams
      if (
        /\b(exams?|official exams?|pariksha|examinations?)\b/i.test(cleanText) ||
        /(परीक्षा|परीक्षाएं|एग्जाम)/.test(cleanText)
      ) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/exams');
        const msg = isHindi ? 'आधिकारिक परीक्षा पोर्टल खोला जा रहा है।' : 'Opening Official Exams Portal.';
        speak(msg);
        announce(msg, 'polite');
        setLastActionFeedback(isHindi ? 'परीक्षा पोर्टल खोला गया' : 'Opened Exams Portal.');
        setLiveTranscript('');
        return;
      }

      // Mock Tests
      if (
        /\b(mock tests?|test series|mocks?)\b/i.test(cleanText) ||
        /(मॉक टेस्ट|मॉक|टेस्ट सीरीज)/.test(cleanText)
      ) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/mock-tests');
        const msg = isHindi ? 'मॉक टेस्ट पोर्टल खोला जा रहा है।' : 'Opening Mock Tests Portal.';
        speak(msg);
        announce(msg, 'polite');
        setLastActionFeedback(isHindi ? 'मॉक टेस्ट पोर्टल खोला गया' : 'Opened Mock Tests Portal.');
        setLiveTranscript('');
        return;
      }

      // Results & Analytics
      if (
        /\b(results?|scores?|analytics|scorecards?|parinam)\b/i.test(cleanText) ||
        /(परिणाम|रिजल्ट|स्कोर|स्कोरकार्ड)/.test(cleanText)
      ) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/results');
        const msg = isHindi ? 'परिणाम और विश्लेषण खोला जा रहा है।' : 'Opening Results and Analytics.';
        speak(msg);
        announce(msg, 'polite');
        setLastActionFeedback(isHindi ? 'परिणाम खोला गया' : 'Opened Results.');
        setLiveTranscript('');
        return;
      }

      // Progress & Activity
      if (
        /\b(progress|activity|streak|mastery|pragati)\b/i.test(cleanText) ||
        /(प्रगति|प्रोग्रेस|स्ट्रीक|महारत)/.test(cleanText)
      ) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/progress');
        const msg = isHindi ? 'प्रगति और गतिविधि ट्रैकिंग खोली जा रही है।' : 'Opening Progress and Activity.';
        speak(msg);
        announce(msg, 'polite');
        setLastActionFeedback(isHindi ? 'प्रगति खोली गई' : 'Opened Progress.');
        setLiveTranscript('');
        return;
      }

      // Settings
      if (
        /\b(settings?|preferences?|configuration)\b/i.test(cleanText) ||
        /(सेटिंग्स|प्राथमिकताएं)/.test(cleanText)
      ) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/settings');
        const msg = isHindi ? 'एक्सेसिबिलिटी सेटिंग्स खोली जा रही हैं।' : 'Opening Settings.';
        speak(msg);
        announce(msg, 'polite');
        setLastActionFeedback(isHindi ? 'सेटिंग्स खोली गईं' : 'Opened Settings.');
        setLiveTranscript('');
        return;
      }

      // Help
      if (
        /\b(help|guides?|faq|madad)\b/i.test(cleanText) ||
        /(मदद|सहायता|गाइड)/.test(cleanText)
      ) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('action');
        navigate('/candidate/help');
        const msg = isHindi ? 'सहायता और मार्गदर्शन खोला जा रहा है।' : 'Opening Help and Guides.';
        speak(msg);
        announce(msg, 'polite');
        setLastActionFeedback(isHindi ? 'सहायता खोली गई' : 'Opened Help.');
        setLiveTranscript('');
        return;
      }

      // Logout
      if (
        /\b(logout|log out|sign out|signout|bahar niklo)\b/i.test(cleanText) ||
        /(लॉगआउट|साइन आउट|बाहर निकलो)/.test(cleanText)
      ) {
        lastExecutedTextRef.current = cleanText;
        lastExecutedTimeRef.current = now;
        playEarcon('pause');
        const msg = isHindi ? 'दृष्टि से लॉग आउट किया जा रहा है।' : 'Signing you out of Drishti.';
        speak(msg);
        announce(msg, 'assertive');
        setLastActionFeedback(isHindi ? 'लॉग आउट किया जा रहा है...' : 'Signing out...');
        setLiveTranscript('');
        logout();
        return;
      }

      // Unrecognized phrase
      playEarcon('error');
      setLastActionFeedback(
        isHindi
          ? `सुना: "${rawTranscript}"। "विकल्प 1", "अभ्यास", या "समझाओ" कहें।`
          : `Heard: "${rawTranscript}". Say e.g. "Option 1" or "Explain".`
      );
    },
    [
      navigate,
      createSectionContext,
      location.pathname,
      isHindi,
      speak,
      stopSpeaking,
      announce,
      logout,
      speakAvailableCommands,
    ]
  );

  // ----------------------------------------------------
  // Dynamic Speech Recognition Engine
  // Recognizes en-US or hi-IN based on preferences.language!
  // ----------------------------------------------------
  useEffect(() => {
    if (!isSupported) return;

    let isComponentMounted = true;
    let restartTimer: any = null;

    const SpeechRecognitionClass =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    function createAndStartRecognition() {
      if (!isComponentMounted || !isListeningRef.current) return;

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

        // Set recognition language dynamically: 'hi-IN' when Hindi is selected, 'en-US' otherwise!
        const activeLang = preferences.language === 'hi' ? 'hi-IN' : 'en-US';
        recognition.lang = activeLang;

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
          if (final.trim()) {
            executeCommand(final.trim());
          } else if (interim.trim()) {
            // For interim speech: ONLY trigger if it is a crisp, standalone 1-or-2 word direct command
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
                lower === 'continue practice' ||
                lower === 'सीखें' ||
                lower === 'अभ्यास' ||
                lower === 'डैशबोर्ड' ||
                lower === 'परीक्षा' ||
                lower === 'परिणाम' ||
                lower === 'रुकिए' ||
                lower === 'रुकें' ||
                lower === 'विकल्प 1' ||
                lower === 'विकल्प 2' ||
                lower === 'विकल्प 3' ||
                lower === 'पहला' ||
                lower === 'दूसरा' ||
                lower === 'तीसरा'
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
  }, [isSupported, isListening, preferences.language, executeCommand]);

  // ----------------------------------------------------
  // Automatic Voice Guidance on Route Change
  // Explains every element of the section in Hindi or English!
  // ----------------------------------------------------
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
        const sectionCtx = createSectionContext();
        const section = resolveSectionDescriptor(location.pathname, sectionCtx);
        speak(section.introSpeech);
        announce(section.introSpeech, 'polite');
        setLastActionFeedback(`${section.name}: ${section.elementsSummary}`);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [location.pathname, createSectionContext, speak, announce]);

  // ----------------------------------------------------
  // Global Keyboard Shortcuts
  // ----------------------------------------------------
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
      if (e.altKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        playEarcon('action');
        navigate('/candidate/learn');
        speak(isHindi ? 'सीखने का पाठ्यक्रम खोला जा रहा है।' : 'Opening Learn curriculum.');
      }
      if (e.altKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        playEarcon('action');
        navigate('/candidate/dashboard');
        speak(isHindi ? 'अभ्यर्थी डैशबोर्ड खोला जा रहा है।' : 'Opening Candidate Dashboard.');
      }
      if (e.altKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        playEarcon('action');
        navigate('/candidate/practice');
        speak(isHindi ? 'अभ्यास केंद्र खोला जा रहा है।' : 'Opening Practice Hub.');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleListening, speakPageGuidance, navigate, speak, isHindi]);

  return {
    isListening,
    isActuallyRecognizing,
    isSupported,
    hasPermissionError,
    liveTranscript,
    lastTranscript,
    lastActionFeedback,
    activeSectionName: currentSection.name,
    activeElementCount: currentSection.elements.length,
    toggleListening,
    requestMicPermission,
    speakPageGuidance,
    speakAvailableCommands,
  };
}
