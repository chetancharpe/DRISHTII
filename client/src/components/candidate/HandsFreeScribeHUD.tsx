import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Mic, MicOff, Volume2, HelpCircle, Compass, CheckCircle2 } from 'lucide-react';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import { useAuth } from '../../contexts/AuthContext';
import { useVoiceCommands } from '../../hooks/useVoiceCommands';
import { playEarcon } from '../../utils/soundEffects';
import { resumeAudioContext } from '../../utils/audioEarcons';
import { resolveSectionDescriptor, SectionContext } from '../../services/candidateSectionExplainer';

/**
 * Unicode-aware phrase boundary matching for multilingual (English + Hindi/Devanagari) speech transcripts.
 */
function hasPhrase(text: string, phrases: string[]): boolean {
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

export const HandsFreeScribeHUD: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    preferences,
    isSpeaking,
    speak,
    stopSpeaking,
    announce,
    hasHindiVoice,
    setPreferredLanguage,
    setHighContrast,
    setFontSize,
  } = useAccessibility();
  const { user } = useAuth();
  const isHindi = preferences.language === 'hi';

  const [hasInteracted, setHasInteracted] = useState<boolean>(false);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [lastActionFeedback, setLastActionFeedback] = useState<string | null>(null);
  const [lastRawTranscript, setLastRawTranscript] = useState<string | null>(null);
  const [liveDashboardData, setLiveDashboardData] = useState<any>(null);

  const hasWelcomedRef = useRef<boolean>(false);
  const lastSpokenRouteRef = useRef<string>('');

  const userName = user?.name ? user.name.split(' ')[0] : 'Candidate';

  // Listen for live dashboard data updates to maintain 100% audio-visual synchronization
  useEffect(() => {
    const handleDashboardData = (e: any) => {
      if (e?.detail) {
        setLiveDashboardData(e.detail);
      }
    };
    window.addEventListener('drishti_dashboard_loaded', handleDashboardData);
    return () => window.removeEventListener('drishti_dashboard_loaded', handleDashboardData);
  }, []);

  // Section Context for dynamic screen inspection
  const getSectionContext = useCallback(
    (): SectionContext => {
      let dashboardData: any = liveDashboardData;
      if (!dashboardData && typeof sessionStorage !== 'undefined') {
        try {
          const raw = sessionStorage.getItem('drishti_candidate_dashboard_data');
          if (raw) dashboardData = JSON.parse(raw);
        } catch {}
      }
      return {
        navigate,
        speak: (t) => speak(t),
        preferences,
        setHighContrast,
        setFontSize,
        userName,
        dashboardData,
      };
    },
    [navigate, speak, preferences, setHighContrast, setFontSize, userName, liveDashboardData]
  );

  /**
   * Dual-language speech assistance:
   * Speaks Hindi if candidate prefers Hindi AND system has Hindi TTS voices installed.
   * If the host system has only English TTS (e.g. Windows MS David/Zira), speaks English fallback
   * so speech is never rendered silent, while still sending Hindi to ARIA screen readers!
   */
  const speakAssistance = useCallback(
    (englishText: string, hindiText: string, onDone?: () => void) => {
      const textToSpeak = isHindi && hasHindiVoice ? hindiText : englishText;
      speak(textToSpeak, () => {
        playEarcon('listen');
        onDone?.();
      });
      announce(isHindi ? hindiText : englishText, 'assertive');
    },
    [isHindi, hasHindiVoice, speak, announce]
  );

  // Status / Where Am I handler for current route
  const handleAnnounceStatus = useCallback(() => {
    playEarcon('recognize');
    const descriptor = resolveSectionDescriptor(location.pathname, getSectionContext());
    const statusEn = `You are on ${descriptor.name}. ${descriptor.elementsSummaryEn || descriptor.elementsSummary}`;
    const statusHi = `आप ${descriptor.name} पर हैं। ${descriptor.elementsSummaryHi || descriptor.elementsSummary}`;

    setLastActionFeedback(`Location: ${descriptor.name}`);
    speakAssistance(statusEn, statusHi);
  }, [location.pathname, getSectionContext, speakAssistance]);

  // Read full page explanation using section descriptor
  const handleExplainPage = useCallback(() => {
    playEarcon('recognize');
    const descriptor = resolveSectionDescriptor(location.pathname, getSectionContext());
    setLastActionFeedback(`Explaining ${descriptor.name}`);
    speakAssistance(
      descriptor.introSpeechEn || descriptor.introSpeech,
      descriptor.introSpeechHi || descriptor.introSpeech
    );
  }, [location.pathname, getSectionContext, speakAssistance]);

  // Read available voice commands
  const handleSpeakHelp = useCallback(() => {
    playEarcon('action');
    const descriptor = resolveSectionDescriptor(location.pathname, getSectionContext());
    const sumEn = descriptor.elementsSummaryEn || descriptor.elementsSummary;
    const sumHi = descriptor.elementsSummaryHi || descriptor.elementsSummary;
    const helpEn =
      `On ${descriptor.name}, you have ${descriptor.elements.length} options available. ${sumEn} Say any option number from Option 1 to Option ${descriptor.elements.length}, or say the name of any feature to open it. You can also say 'Explain' to hear full details again, or 'Dashboard' to go back. Say 'Stop' to silence speech anytime.`;
    const helpHi =
      `${descriptor.name} पर आपके पास ${descriptor.elements.length} विकल्प हैं। ${sumHi} आप विकल्प 1 से लेकर विकल्प ${descriptor.elements.length} तक कोई भी संख्या बोल सकते हैं, या किसी फीचर का नाम बोल सकते हैं। पेज को दोबारा सुनने के लिए 'पेज समझाओ' बोलें, या वापस जाने के लिए 'डैशबोर्ड' बोलें। आवाज़ रोकने के लिए 'रुको' बोलें।`;
    setLastActionFeedback(isHindi ? 'मदद कमांड्स सुनाई गईं' : 'Voice commands list announced');
    speakAssistance(helpEn, helpHi);
  }, [location.pathname, getSectionContext, isHindi, speakAssistance]);

  // Explain platform identity
  const handleExplainPlatform = useCallback(() => {
    playEarcon('recognize');
    const infoEn =
      'This is an AI-powered accessible examination platform designed for visually impaired and blind candidates. It provides 100% hands-free voice control, audio question reading, instant voice answering, mock tests, and smart performance analysis.';
    const infoHi =
      'यह दृष्टिबाधित और दिव्यांग उम्मीदवारों के लिए बनाया गया एक संपूर्ण सुलभ परीक्षा पोर्टल है। यह 100% हैंड्स-फ्री वॉइस नेविगेशन, बोलकर सवाल पढ़ने, आवाज़ से उत्तर देने, मॉक टेस्ट, और परीक्षा विश्लेषण की सुविधा देता है।';
    setLastActionFeedback(isHindi ? 'प्लेटफ़ॉर्म का परिचय' : 'Platform overview');
    speakAssistance(infoEn, infoHi);
  }, [isHindi, speakAssistance]);

  // Proactive Arrival Greeting on Candidate Dashboard
  const triggerArrivalGreeting = useCallback(() => {
    if (hasWelcomedRef.current) return;
    hasWelcomedRef.current = true;
    resumeAudioContext();

    const descriptor = resolveSectionDescriptor(location.pathname, getSectionContext());
    setLastActionFeedback(`Explaining ${descriptor.name}`);
    speakAssistance(
      descriptor.introSpeechEn || descriptor.introSpeech,
      descriptor.introSpeechHi || descriptor.introSpeech
    );
  }, [location.pathname, getSectionContext, speakAssistance]);

  /**
   * Deep NLP Intent Analyzer tailored specifically to DRISHTI Candidate Platform
   */
  const handleAnalyzeVoiceInput = useCallback(
    (rawTranscript: string): boolean => {
      const clean = rawTranscript
        .trim()
        .toLowerCase()
        .replace(/[.,!?;:'"–—।॥-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (!clean) return false;
      setLastRawTranscript(rawTranscript);

      // 1. STOP / SILENCE / PAUSE AUDIO
      if (hasPhrase(clean, ['stop', 'mute', 'quiet', 'silence', 'chup', 'shant', 'ruko', 'band karo', 'शांत', 'रुको', 'चुप', 'आवाज़ बंद', 'बंद करो', 'रोको'])) {
        stopSpeaking();
        playEarcon('pause');
        setLastActionFeedback(isHindi ? 'आवाज़ रोक दी गई' : 'Speech silenced');
        return true;
      }

      // 2. LANGUAGE SWITCHING
      if (
        hasPhrase(clean, [
          'hindi me bolo', 'switch to hindi', 'hindi bhasha', 'hindi karo', 'change to hindi', 'hindi',
          'हिंदी में बोलो', 'हिंदी चुनो', 'हिंदी भाषा', 'हिंदी करो', 'हिन्दी', 'भाषा बदलो'
        ])
      ) {
        playEarcon('action');
        setPreferredLanguage('hi');
        const feedbackEn = 'Language changed to Hindi. Voice and screen are now in Hindi.';
        const feedbackHi = 'भाषा बदलकर हिन्दी कर दी गई है। स्क्रीन और सभी सवाल अब हिन्दी में हैं।';
        setLastActionFeedback('भाषा: हिन्दी (Hindi)');
        speakAssistance(feedbackEn, feedbackHi);
        return true;
      }

      if (
        hasPhrase(clean, [
          'english me bolo', 'switch to english', 'english language', 'speak in english', 'change to english', 'english',
          'अंग्रेजी में बोलो', 'इंग्लिश में बोलो', 'अंग्रेजी चुनो', 'अंग्रेजी भाषा'
        ])
      ) {
        playEarcon('action');
        setPreferredLanguage('en');
        const feedbackEn = 'Language changed to English. Voice companion is now in English.';
        const feedbackHi = 'Language switched to English.';
        setLastActionFeedback('Language: English');
        speakAssistance(feedbackEn, feedbackHi);
        return true;
      }

      // 3. WHERE AM I / LOCATION / STATUS
      if (
        hasPhrase(clean, [
          'where am i', 'kahan hoon', 'kahan hu', 'kahan pe hoon', 'status', 'current page', 'which page', 'main kahan hoon', 'location',
          'मैं कहाँ हूँ', 'कहाँ हूँ', 'स्थिति बताओ', 'यह कौन सा पेज है', 'स्थिति'
        ])
      ) {
        handleAnnounceStatus();
        return true;
      }

      // 4. READ PAGE / EXPLAIN SECTION
      if (
        hasPhrase(clean, [
          'read page', 'explain page', 'page padho', 'kya hai yahan', 'read options', 'what is here', 'options batao', 'describe page', 'explain',
          'पेज पढ़ो', 'यहाँ क्या है', 'पेज सुनाओ', 'विकल्प बताओ', 'विवरण बताओ', 'समझाओ', 'पेज समझाओ'
        ])
      ) {
        handleExplainPage();
        return true;
      }

      // 5. HELP & COMMANDS
      if (
        hasPhrase(clean, [
          'help', 'madad', 'sahayata', 'kya bol sakte hain', 'commands', 'what can i say', 'how to use', 'kaise use kare', 'voice commands', 'guide',
          'मदद', 'सहायता', 'क्या बोल सकते हैं', 'कमांड्स बताओ', 'कमांड बताओ', 'कैसे इस्तेमाल करें'
        ])
      ) {
        handleSpeakHelp();
        return true;
      }

      // 6. WHAT IS DRISHTI / PLATFORM INFO
      if (
        hasPhrase(clean, [
          'what is drishti', 'drishti kya hai', 'tell me about drishti', 'about platform', 'yeh kya hai', 'what is this', 'about drishti',
          'दृष्टि क्या है', 'यह क्या है', 'दृष्टि के बारे में बताओ', 'प्लेटफॉर्म क्या है'
        ])
      ) {
        handleExplainPlatform();
        return true;
      }

      // 7. GREETINGS & SOCIAL
      if (
        hasPhrase(clean, [
          'hello', 'hi', 'namaste', 'hey', 'good morning', 'good afternoon', 'good evening', 'kaise ho', 'namaskar',
          'नमस्ते', 'हेलो', 'हाय', 'नमस्कार', 'कैसे हो', 'सुप्रभात'
        ])
      ) {
        playEarcon('recognize');
        const replyEn = `Hello ${userName}! I am your AI Voice Companion. I am ready to assist you. You can say "Start Practice", "Mock Tests", "Exams", "Results", or "Help". What would you like to do?`;
        const replyHi = `नमस्ते ${userName}! मैं आपका एआई वॉयस साथी हूँ। मैं आपकी सहायता के लिए तैयार हूँ। आप "अभ्यास शुरू करो", "मॉक टेस्ट", "परीक्षा", या "मदद" कह सकते हैं। आप क्या करना चाहेंगे?`;
        setLastActionFeedback(isHindi ? 'नमस्ते! बोलिए क्या करना है' : 'Hello! Ready to assist');
        speakAssistance(replyEn, replyHi);
        return true;
      }

      // 8. SECTION ELEMENTS SELECTION BY NUMBER (Options 1 to 7)
      const currentSection = resolveSectionDescriptor(location.pathname, getSectionContext());
      let matchedIndex = -1;

      if (
        hasPhrase(clean, [
          'option 1', 'option one', 'select 1', 'select one', 'choose 1', 'first', 'pehla', 'vikalp 1',
          'पहला विकल्प', 'विकल्प 1', 'विकल्प एक', 'ऑप्शन 1', 'पहला'
        ]) || clean === '1' || clean === 'one' || clean === 'एक'
      ) matchedIndex = 0;
      else if (
        hasPhrase(clean, [
          'option 2', 'option two', 'select 2', 'select two', 'choose 2', 'second', 'dusra', 'vikalp 2',
          'दूसरा विकल्प', 'विकल्प 2', 'विकल्प दो', 'ऑप्शन 2', 'दूसरा'
        ]) || clean === '2' || clean === 'two' || clean === 'दो'
      ) matchedIndex = 1;
      else if (
        hasPhrase(clean, [
          'option 3', 'option three', 'select 3', 'select three', 'choose 3', 'third', 'teesra', 'vikalp 3',
          'तीसरा विकल्प', 'विकल्प 3', 'विकल्प तीन', 'ऑप्शन 3', 'तीसरा'
        ]) || clean === '3' || clean === 'three' || clean === 'तीन'
      ) matchedIndex = 2;
      else if (
        hasPhrase(clean, [
          'option 4', 'option four', 'select 4', 'select four', 'choose 4', 'fourth', 'chautha', 'vikalp 4',
          'चौथा विकल्प', 'विकल्प 4', 'विकल्प चार', 'ऑप्शन 4', 'चौथा'
        ]) || clean === '4' || clean === 'four' || clean === 'चार'
      ) matchedIndex = 3;
      else if (
        hasPhrase(clean, [
          'option 5', 'option five', 'select 5', 'select five', 'choose 5', 'fifth', 'paanchwa', 'vikalp 5',
          'पांचवां विकल्प', 'विकल्प 5', 'विकल्प पांच', 'ऑप्शन 5', 'पांचवां'
        ]) || clean === '5' || clean === 'five' || clean === 'पाँच' || clean === 'पांच'
      ) matchedIndex = 4;
      else if (
        hasPhrase(clean, [
          'option 6', 'option six', 'select 6', 'select six', 'choose 6', 'sixth', 'chhatwa', 'vikalp 6',
          'छठा विकल्प', 'विकल्प 6', 'विकल्प छह', 'ऑप्शन 6', 'छठा'
        ]) || clean === '6' || clean === 'six' || clean === 'छह'
      ) matchedIndex = 5;
      else if (
        hasPhrase(clean, [
          'option 7', 'option seven', 'select 7', 'select seven', 'choose 7', 'seventh', 'saatwa', 'vikalp 7',
          'सातवां विकल्प', 'विकल्प 7', 'विकल्प सात', 'ऑप्शन 7', 'सातवां'
        ]) || clean === '7' || clean === 'seven' || clean === 'सात'
      ) matchedIndex = 6;

      if (matchedIndex !== -1 && currentSection.elements[matchedIndex]) {
        const elem = currentSection.elements[matchedIndex];
        playEarcon('action');
        setLastActionFeedback(`Selected Option ${elem.number}: ${elem.label}`);
        elem.action(getSectionContext());
        if (elem.confirmSpeech) {
          speakAssistance(elem.confirmSpeech, elem.confirmSpeech);
        }
        return true;
      }

      // 9. SECTION ELEMENTS BY SPECIFIC ALIAS
      for (const elem of currentSection.elements) {
        if (hasPhrase(clean, elem.aliases)) {
          playEarcon('action');
          setLastActionFeedback(`Selected: ${elem.label}`);
          elem.action(getSectionContext());
          if (elem.confirmSpeech) {
            speakAssistance(elem.confirmSpeech, elem.confirmSpeech);
          }
          return true;
        }
      }

      // 10. GLOBAL DESTINATION NAVIGATION WITH SPOKEN CONFIRMATION
      // A. PRACTICE ARENA
      if (
        hasPhrase(clean, [
          'practice', 'abhyas', 'start practice', 'practice session', 'practice questions', 'solve questions', 'question practice',
          'percentages', 'math practice', 'sawal solve', 'prashna', 'अभ्यास', 'अभ्यास शुरू करो', 'प्रैक्टिस', 'सवाल हल करने हैं',
          'सवाल पूछो', 'सवाल अभ्यास', 'सत्र शुरू करो'
        ])
      ) {
        playEarcon('action');
        const msgEn = 'Opening Practice Arena. Loading questions now.';
        const msgHi = 'अभ्यास केंद्र खोला जा रहा है। सवाल लोड हो रहे हैं।';
        setLastActionFeedback(isHindi ? 'अभ्यास केंद्र खोला जा रहा है' : 'Opening Practice Arena');
        speakAssistance(msgEn, msgHi);
        navigate('/candidate/practice/session/demo-percentages');
        return true;
      }

      // B. MOCK TESTS
      if (
        hasPhrase(clean, [
          'mock test', 'mock tests', 'mock', 'test series', 'mock pariksha', 'take mock', 'start mock', 'मॉक टेस्ट', 'मॉक', 'मॉक परीक्षा', 'टेस्ट सीरीज'
        ])
      ) {
        playEarcon('action');
        const msgEn = 'Opening Official Mock Tests portal. Here you can attempt simulated exams.';
        const msgHi = 'आधिकारिक मॉक टेस्ट सूची खोली जा रही है। यहाँ आप पूरे टेस्ट दे सकते हैं।';
        setLastActionFeedback(isHindi ? 'मॉक टेस्ट पोर्टल खोला जा रहा है' : 'Opening Mock Tests');
        speakAssistance(msgEn, msgHi);
        navigate('/candidate/mock-tests');
        return true;
      }

      // C. SCHEDULED EXAMINATIONS
      if (
        hasPhrase(clean, [
          'exam', 'exams', 'pariksha', 'examination', 'official exam', 'scheduled exam', 'meri pariksha', 'pariksha hall',
          'परीक्षा', 'परीक्षाएं', 'मेरी परीक्षा', 'आधिकारिक परीक्षा', 'एग्जाम'
        ])
      ) {
        playEarcon('action');
        const msgEn = 'Opening Scheduled Examinations page. Here you can view your official tests.';
        const msgHi = 'निर्धारित परीक्षा पृष्ठ खोला जा रहा है। यहाँ आपकी आगामी परीक्षाएं उपलब्ध हैं।';
        setLastActionFeedback(isHindi ? 'परीक्षा सूची खोली जा रही है' : 'Opening Scheduled Exams');
        speakAssistance(msgEn, msgHi);
        navigate('/candidate/exams');
        return true;
      }

      // D. RESULTS & SCORECARDS
      if (
        hasPhrase(clean, [
          'result', 'results', 'score', 'scores', 'scorecard', 'performance', 'parinam', 'mera result', 'kitne number', 'marks',
          'परिणाम', 'रिजल्ट', 'स्कोरकार्ड', 'नंबर', 'प्राप्तांक', 'प्रगति'
        ])
      ) {
        playEarcon('action');
        const msgEn = 'Opening Results and Performance. Here you can check your scorecards.';
        const msgHi = 'परिणाम और रिपोर्ट कार्ड पृष्ठ खोला जा रहा है। यहाँ आप अपने अंक देख सकते हैं।';
        setLastActionFeedback(isHindi ? 'परिणाम पृष्ठ खोला जा रहा है' : 'Opening Results');
        speakAssistance(msgEn, msgHi);
        navigate('/candidate/results');
        return true;
      }

      // E. DASHBOARD / HOME
      if (
        hasPhrase(clean, [
          'dashboard', 'home', 'main page', 'mukhya prishth', 'ghar', 'wapas jao', 'back to home', 'डैशबोर्ड', 'होम', 'मुख्य पृष्ठ', 'शुरुआत'
        ])
      ) {
        playEarcon('action');
        const msgEn = 'Returning to Candidate Dashboard.';
        const msgHi = 'कैंडिडेट डैशबोर्ड पर वापस ले जा रहा हूँ।';
        setLastActionFeedback(isHindi ? 'डैशबोर्ड पर वापस' : 'Navigating to Dashboard');
        speakAssistance(msgEn, msgHi);
        navigate('/candidate/dashboard');
        return true;
      }

      // F. LEARN / CURRICULUM
      if (
        hasPhrase(clean, [
          'learn', 'study', 'curriculum', 'syllabus', 'padhai', 'sikho', 'subjects', 'पढ़ाई', 'पाठ्यक्रम', 'सीखो', 'विषय'
        ])
      ) {
        playEarcon('action');
        const msgEn = 'Opening Learning Curriculum with Mathematics, English, General Knowledge, and Reasoning.';
        const msgHi = 'अध्ययन पाठ्यक्रम खोला जा रहा है: गणित, अंग्रेजी, सामान्य ज्ञान और रीजनिंग।';
        setLastActionFeedback(isHindi ? 'पाठ्यक्रम खोला जा रहा है' : 'Opening Curriculum');
        speakAssistance(msgEn, msgHi);
        navigate('/candidate/learn');
        return true;
      }

      // G. SETTINGS
      if (
        hasPhrase(clean, [
          'settings', 'accessibility', 'contrast', 'font size', 'voice speed', 'preferences', 'सेटिंग्स', 'सुलभता', 'कंट्रास्ट'
        ])
      ) {
        playEarcon('action');
        const msgEn = 'Opening Accessibility Settings. You can calibrate sound, contrast, and font size here.';
        const msgHi = 'सुलभता सेटिंग्स खोली जा रही है। यहाँ आप आवाज़ और कंट्रास्ट बदल सकते हैं।';
        setLastActionFeedback(isHindi ? 'सुलभता सेटिंग्स खोली जा रही है' : 'Opening Settings');
        speakAssistance(msgEn, msgHi);
        navigate('/candidate/settings');
        return true;
      }

      // 11. INTELLIGENT CONVERSATIONAL FALLBACK TAILORED TO DRISHTI
      playEarcon('recognize');

      // Check contextual keywords:
      if (hasPhrase(clean, ['kab', 'date', 'tareekh', 'kisi', 'time table', 'तारीख', 'कब है'])) {
        const replyEn = 'To view your scheduled exam dates and timings, say "Exams" to open your official schedule.';
        const replyHi = 'अपनी परीक्षा तारीख और समय सारिणी देखने के लिए "परीक्षा" बोलें।';
        setLastActionFeedback(isHindi ? 'सलाह: "परीक्षा" बोलें' : 'Tip: Say "Exams"');
        speakAssistance(replyEn, replyHi);
        return true;
      }

      if (hasPhrase(clean, ['padhna', 'study', 'question', 'sawal', 'topic', 'गणित', 'सवाल'])) {
        const replyEn = 'To practice questions with instant voice feedback, say "Start Practice".';
        const replyHi = 'सवाल हल करने और अभ्यास करने के लिए "अभ्यास शुरू करो" बोलें।';
        setLastActionFeedback(isHindi ? 'सलाह: "अभ्यास" बोलें' : 'Tip: Say "Start Practice"');
        speakAssistance(replyEn, replyHi);
        return true;
      }

      if (hasPhrase(clean, ['number', 'marks', 'kitne', 'score', 'pass', 'फेल', 'अंक'])) {
        const replyEn = 'To review your scores and accuracy breakdown, say "Results".';
        const replyHi = 'अपने प्राप्तांक और रिपोर्ट कार्ड देखने के लिए "रिजल्ट" बोलें।';
        setLastActionFeedback(isHindi ? 'सलाह: "रिजल्ट" बोलें' : 'Tip: Say "Results"');
        speakAssistance(replyEn, replyHi);
        return true;
      }

      // REPEAT / OPTIONS SUMMARY
      if (
        hasPhrase(clean, [
          'repeat', 'options', 'vikalp', 'repeat options', 'dubara bolo', 'options batao', 'kya options hai', 'list options',
          'विकल्प बताओ', 'दोबारा बोलो', 'ऑप्शन बताओ', 'विकल्प सुनाओ', 'विकल्प'
        ])
      ) {
        playEarcon('action');
        const descriptor = resolveSectionDescriptor(location.pathname, getSectionContext());
        setLastActionFeedback(`Options: ${descriptor.name}`);
        speakAssistance(
          descriptor.elementsSummaryEn || descriptor.elementsSummary,
          descriptor.elementsSummaryHi || descriptor.elementsSummary
        );
        return true;
      }

      // General Conversational Fallback:
      const descriptor = resolveSectionDescriptor(location.pathname, getSectionContext());
      const fallbackEn = `I heard you say: "${rawTranscript}". On ${descriptor.name}, you have ${descriptor.elements.length} options available. ${descriptor.elementsSummary} Say any option number or feature name, or say 'Explain' to hear full details.`;
      const fallbackHi = `मैंने सुना: "${rawTranscript}"। ${descriptor.name} पर आपके पास ${descriptor.elements.length} विकल्प हैं। ${descriptor.elementsSummary} आप कोई भी विकल्प संख्या या नाम बोल सकते हैं, या पेज को दोबारा सुनने के लिए 'पेज समझाओ' बोलें।`;
      setLastActionFeedback(isHindi ? `सुना: "${rawTranscript}"` : `Heard: "${rawTranscript}"`);
      speakAssistance(fallbackEn, fallbackHi);
      return true;
    },
    [
      isHindi,
      userName,
      location.pathname,
      getSectionContext,
      navigate,
      stopSpeaking,
      setPreferredLanguage,
      handleAnnounceStatus,
      handleExplainPage,
      handleSpeakHelp,
      handleExplainPlatform,
      speakAssistance,
    ]
  );

  // Global Hands-Free Voice Commands Hook
  const voice = useVoiceCommands(
    {
      onStatus: handleAnnounceStatus,
      onVoiceQuery: handleAnalyzeVoiceInput,
    },
    { autoStart: true }
  );

  // Unlock Audio on First User Gesture (Click, Keydown, Touch)
  useEffect(() => {
    const unlockAudioAndGreet = () => {
      resumeAudioContext();
      setHasInteracted(true);
      if (!voice.isListening && voice.isSupported) {
        voice.startListening();
      }
      if (!hasWelcomedRef.current && location.pathname.includes('/candidate/dashboard')) {
        triggerArrivalGreeting();
      }
    };

    window.addEventListener('click', unlockAudioAndGreet, { once: true });
    window.addEventListener('keydown', unlockAudioAndGreet, { once: true });
    window.addEventListener('touchstart', unlockAudioAndGreet, { once: true });

    return () => {
      window.removeEventListener('click', unlockAudioAndGreet);
      window.removeEventListener('keydown', unlockAudioAndGreet);
      window.removeEventListener('touchstart', unlockAudioAndGreet);
    };
  }, [voice, location.pathname, triggerArrivalGreeting]);

  // Attempt proactive greeting on mount if already unlocked / permitted
  useEffect(() => {
    if (location.pathname.includes('/candidate/dashboard') && !hasWelcomedRef.current) {
      const timer = setTimeout(() => {
        triggerArrivalGreeting();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [location.pathname, triggerArrivalGreeting]);

  // Proactive Guidance on Route Change (explaining section content and all options)
  useEffect(() => {
    const path = location.pathname;
    if (!path.startsWith('/candidate')) return;

    // Do NOT speak route change guidance inside an active exam or practice session (the session speaks the question)
    if (
      path.includes('/candidate/practice/session/') ||
      (path.includes('/candidate/mock-tests/') && path.includes('/session')) ||
      (path.includes('/candidate/exams/') && path.includes('/session'))
    ) {
      lastSpokenRouteRef.current = path;
      return;
    }

    if (lastSpokenRouteRef.current === path) return;
    lastSpokenRouteRef.current = path;

    const timer = setTimeout(() => {
      playEarcon('navigate');
      try {
        const descriptor = resolveSectionDescriptor(path, getSectionContext());
        setLastActionFeedback(`Explaining ${descriptor.name}`);
        speakAssistance(
          descriptor.introSpeechEn || descriptor.introSpeech,
          descriptor.introSpeechHi || descriptor.introSpeech
        );
      } catch (err) {
        console.warn('Section explainer error:', err);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [location.pathname, getSectionContext, speakAssistance]);

  // Keyboard shortcuts: Alt+S toggles mic, Spacebar toggles if not in input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      if (e.altKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        voice.toggleListening();
      } else if (
        e.code === 'Space' &&
        !isInput &&
        !e.altKey &&
        !e.ctrlKey &&
        !e.metaKey
      ) {
        e.preventDefault();
        voice.toggleListening();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [voice]);

  // If browser does not support Web Speech, render unobtrusive notice
  if (!voice.isSupported) {
    return null;
  }

  return (
    <>
      {/* Floating Hands-Free Scribe HUD */}
      <aside
        role="region"
        aria-label={
          isHindi
            ? 'दृष्टि एआई हैंड्स-फ्री वॉयस साथी स्थिति बार'
            : 'DRISHTI AI Hands-Free Voice Companion Status Bar'
        }
        className="fixed bottom-4 right-4 z-40 flex items-center gap-3 p-2.5 rounded-2xl bg-surface/95 backdrop-blur-md border-2 border-primary/50 shadow-2xl text-foreground transition-all duration-200 max-w-md sm:max-w-lg"
      >
        {/* Mic Toggle Button */}
        <button
          type="button"
          onClick={voice.toggleListening}
          aria-pressed={voice.isListening}
          aria-label={
            voice.isListening
              ? isHindi
                ? 'हैंड्स-फ्री मोड सक्रिय है और सुन रहा है। रोकने के लिए स्पेस या क्लिक करें।'
                : 'Hands-Free Voice Companion active and listening. Press Space or Click to pause.'
              : isHindi
                ? 'हैंड्स-फ्री मोड रुका हुआ है। चालू करने के लिए स्पेस या क्लिक करें।'
                : 'Hands-Free Voice Companion paused. Press Space or Click to listen.'
          }
          className={`relative p-3 rounded-xl flex items-center justify-center min-w-[50px] min-h-[50px] font-bold text-sm transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-primary ${voice.isListening
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/30'
              : 'bg-surface-elevated hover:bg-border/60 text-foreground border border-border'
            }`}
        >
          {voice.isListening ? (
            <>
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
              </span>
              <Mic className="w-5 h-5 animate-pulse" aria-hidden="true" />
            </>
          ) : (
            <MicOff className="w-5 h-5 opacity-70" aria-hidden="true" />
          )}
        </button>

        {/* State & Telemetry Information */}
        <div className="flex flex-col pr-1 min-w-[180px] max-w-[260px] sm:max-w-[320px]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black tracking-wide uppercase text-primary">
              {voice.isListening
                ? isHindi
                  ? 'एआई साथी: सक्रिय'
                  : 'AI Companion Active'
                : isHindi
                  ? 'एआई साथी: रुका हुआ'
                  : 'AI Companion Paused'}
            </span>

            {isSpeaking && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                <Volume2 className="w-3 h-3 animate-pulse" aria-hidden="true" />
                <span>{isHindi ? 'बोल रहा है...' : 'Speaking...'}</span>
              </span>
            )}
          </div>

          {/* Last Heard Transcript */}
          <p className="text-[11px] text-foreground font-semibold truncate">
            {voice.isListening
              ? lastRawTranscript || voice.lastCommand
                ? `🎙️ "${lastRawTranscript || voice.lastCommand}"`
                : isHindi
                  ? 'बोलिए: "अभ्यास", "मॉक टेस्ट", "स्थिति", "मदद"'
                  : 'Speak: "Practice", "Mock Tests", "Where am I"'
              : isHindi
                ? 'चालू करने के लिए [Space] दबाएं'
                : 'Press [Spacebar] to listen'}
          </p>

          {/* Last Action Feedback */}
          {lastActionFeedback && (
            <p className="text-[10px] text-foreground-muted flex items-center gap-1 truncate">
              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500 flex-shrink-0" aria-hidden="true" />
              <span className="truncate">{lastActionFeedback}</span>
            </p>
          )}
        </div>

        {/* Quick "Where am I" status button */}
        <button
          type="button"
          onClick={handleAnnounceStatus}
          aria-label={isHindi ? 'वर्तमान स्थिति और विकल्प सुनें' : 'Hear current location and options'}
          title={isHindi ? 'स्थिति सुनें' : 'Hear Location Status'}
          className="p-2 rounded-lg text-foreground-muted hover:text-foreground hover:bg-surface-elevated transition-colors"
        >
          <Compass className="w-4 h-4" aria-hidden="true" />
        </button>

        {/* Voice Commands Help button */}
        <button
          type="button"
          onClick={() => setShowHelpModal(true)}
          aria-label={isHindi ? 'वॉइस कमांड्स मदद' : 'Voice commands help'}
          title={isHindi ? 'कमांड्स मदद' : 'Commands Help'}
          className="p-2 rounded-lg text-foreground-muted hover:text-foreground hover:bg-surface-elevated transition-colors"
        >
          <HelpCircle className="w-4 h-4" aria-hidden="true" />
        </button>

        {!hasInteracted && (
          <span className="sr-only">
            {isHindi
              ? 'हैंड्स-फ्री वॉइस शुरू करने के लिए स्पेस या किसी भी बटन को दबाएं।'
              : 'Press Spacebar or any key to activate hands-free voice.'}
          </span>
        )}
      </aside>

      {/* Voice Commands Help Modal */}
      {showHelpModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="voice-help-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        >
          <div className="bg-surface border-2 border-primary rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h2 id="voice-help-title" className="text-xl font-bold text-foreground">
              {isHindi ? '🎙️ हैंड्स-फ्री एआई वॉयस साथी गाइड' : '🎙️ AI Voice Companion Guide'}
            </h2>
            <div className="space-y-3 text-sm text-foreground">
              <p className="text-foreground-muted">
                {isHindi
                  ? 'दृष्टि पोर्टल पर आप स्क्रीन को बिना छुए सिर्फ अपनी आवाज़ से सब कुछ नियंत्रित कर सकते हैं:'
                  : 'You can navigate and control the entire platform completely hands-free:'}
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
                <li>
                  <strong>{isHindi ? 'अभ्यास शुरू करना:' : 'Start Practice:'}</strong> "Start practice", "अभ्यास शुरू करो", "सवाल हल करने हैं"
                </li>
                <li>
                  <strong>{isHindi ? 'मॉक टेस्ट देना:' : 'Mock Tests:'}</strong> "Mock test", "मॉक टेस्ट", "Test series"
                </li>
                <li>
                  <strong>{isHindi ? 'आधिकारिक परीक्षाएं:' : 'Scheduled Exams:'}</strong> "Exams", "परीक्षाएं", "मेरी परीक्षा"
                </li>
                <li>
                  <strong>{isHindi ? 'रिजल्ट व स्कोरकार्ड:' : 'Results:'}</strong> "Results", "परिणाम", "स्कोरकार्ड", "कितने नंबर आए"
                </li>
                <li>
                  <strong>{isHindi ? 'कहाँ हैं जानना:' : 'Where Am I:'}</strong> "Where am I", "मैं कहाँ हूँ", "Status"
                </li>
                <li>
                  <strong>{isHindi ? 'पेज का विवरण:' : 'Read Page:'}</strong> "Read page", "पेज पढ़ो", "यहाँ क्या है"
                </li>
                <li>
                  <strong>{isHindi ? 'सवाल के दौरान उत्तर:' : 'During Tests:'}</strong> "Option A", "Option B", "अगला", "पिछला", "सबमिट"
                </li>
                <li>
                  <strong>{isHindi ? 'आवाज़ रोकना:' : 'Silence Audio:'}</strong> "Stop", "रुको", "चुप"
                </li>
                <li>
                  <strong>{isHindi ? 'भाषा बदलना:' : 'Switch Language:'}</strong> "Hindi me bolo", "Switch to English"
                </li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => setShowHelpModal(false)}
              className="w-full py-2.5 px-4 rounded-xl bg-primary text-primary-contrast font-bold hover:bg-primary-hover focus:ring-4 focus:ring-primary/40 transition-all"
            >
              {isHindi ? 'समझ गया (बंद करें)' : 'Got it (Close)'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
