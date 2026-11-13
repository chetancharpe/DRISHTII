/**
 * DRISHTI - SAARTHI AI TUTOR SERVICE
 * 
 * Human-like Conversational AI Companion for Accessible Onboarding & Authentication.
 * Supports natural Hindi, English, and Hinglish speech and text interaction.
 * Maintains dialogue state, remembers selections, clarifies doubts, and provides accessible feedback.
 */

import { speechService } from './speechService';

export type SaarthiStep =
  | 'WELCOME'
  | 'AUTH_METHOD'
  | 'LANGUAGE'
  | 'ROLE'
  | 'TEXT_SETTINGS'
  | 'THEME_SETTINGS'
  | 'VOICE_SETTINGS'
  | 'ACCESSIBILITY_FEATURES'
  | 'LEARNING_PREFERENCES'
  | 'SUMMARY'
  | 'VALIDATION'
  | 'COMPLETE';

export interface SaarthiPreferencesDraft {
  authMethod: 'face' | 'passkey' | 'password';
  interfaceLanguage: string;
  conversationLanguage: string;
  recognitionLanguage: string;
  ttsLanguage: string;
  selectedRole: 'candidate' | 'examiner' | 'admin';
  verifiedRole: 'candidate' | 'examiner' | 'admin';
  isRoleAuthorized: boolean;
  textSize: 'small' | 'default' | 'large' | 'extra-large';
  fontFamily: 'system' | 'atkinson' | 'opendyslexic';
  lineSpacing: 'normal' | 'relaxed' | 'loose';
  textMagnifier: boolean;
  theme: 'light' | 'dark' | 'high_contrast_light' | 'high_contrast_dark';
  voiceSpeed: number;
  voiceGender: 'female' | 'male' | 'system';
  accessibilityTools: string[];
  learningPreference: 'audio' | 'text' | 'braille' | 'combined';
}

export interface SaarthiDialogue {
  step: SaarthiStep;
  spokenHi: string;
  spokenEn: string;
  captionHi: string;
  captionEn: string;
  options?: Array<{ id: string; labelHi: string; labelEn: string; shortcut?: string }>;
}

export const SAARTHI_DIALOGUES: Record<SaarthiStep, SaarthiDialogue> = {
  WELCOME: {
    step: 'WELCOME',
    spokenHi: 'नमस्ते! दृष्टि में आपका स्वागत है। मैं सारथी, आपका एआई ट्यूटर हूँ। मैं आपको लॉगिन और पर्सनलाइज़्ड एक्सेसिबिलिटी सेटअप में गाइड करूँगा। क्या हम शुरू करें?',
    spokenEn: 'Welcome to Drishti! I am Saarthi, your AI Tutor. I will guide you through authentication and personalized accessibility setup. Shall we begin?',
    captionHi: 'नमस्ते! मैं सारथी, आपका Drishti AI Tutor हूँ। आइए आपकी सुविधा अनुसार सेटअप शुरू करें।',
    captionEn: 'Welcome! I am Saarthi, your Drishti AI Tutor. Let us set up the platform according to your comfort.',
    options: [
      { id: 'start', labelHi: 'शुरू करें (Start)', labelEn: 'Get Started', shortcut: 'Enter' },
      { id: 'help', labelHi: 'मदद चाहिए (Help)', labelEn: 'Need Help', shortcut: 'H' },
    ],
  },
  AUTH_METHOD: {
    step: 'AUTH_METHOD',
    spokenHi: 'आप किस तरीके से लॉगिन करना चाहेंगे? आप फेस ऑथेंटिकेशन या विंडोज़ हैलो पासकी चुन सकते हैं, या पासवर्ड का उपयोग कर सकते हैं।',
    spokenEn: 'How would you like to sign in? You can choose Face Authentication, Windows Hello / Passkey, or standard Password.',
    captionHi: 'लॉगिन का माध्यम चुनें: फेस ऑथेंटिकेशन, विंडोज़ हैलो पासकी, या पासवर्ड।',
    captionEn: 'Choose sign-in method: Face Authentication, Windows Hello / Passkey, or Password.',
    options: [
      { id: 'face', labelHi: 'फेस ऑथेंटिकेशन (Face ID)', labelEn: 'Face Authentication', shortcut: '1' },
      { id: 'passkey', labelHi: 'विंडोज़ हैलो / पासकी (Passkey)', labelEn: 'Windows Hello / Passkey', shortcut: '2' },
      { id: 'password', labelHi: 'पासवर्ड लॉगिन (Password)', labelEn: 'Password / Demo Login', shortcut: '3' },
    ],
  },
  LANGUAGE: {
    step: 'LANGUAGE',
    spokenHi: 'अब बताएं, आप दृष्टि किस भाषा में इस्तेमाल करना पसंद करेंगे? आप हिन्दी, इंग्लिश, हिंग्लिश, या अन्य भारतीय भाषाएं चुन सकते हैं।',
    spokenEn: 'Which language do you prefer to use with Drishti and your AI Tutor? You can select Hindi, English, Hinglish, or other supported languages.',
    captionHi: 'दृष्टि के लिए अपनी पसंदीदा भाषा चुनें। संपूर्ण इंटरफ़ेस तुरंत अपडेट हो जाएगा।',
    captionEn: 'Choose your preferred language for Drishti. The entire interface will update immediately.',
    options: [
      { id: 'hi', labelHi: 'हिन्दी (Hindi)', labelEn: 'Hindi', shortcut: '1' },
      { id: 'en', labelHi: 'English (अंग्रेज़ी)', labelEn: 'English', shortcut: '2' },
      { id: 'hinglish', labelHi: 'Hinglish (हिंग्लिश)', labelEn: 'Hinglish', shortcut: '3' },
      { id: 'mr', labelHi: 'मराठी (Marathi)', labelEn: 'Marathi', shortcut: '4' },
      { id: 'bn', labelHi: 'বাংলা (Bengali)', labelEn: 'Bengali', shortcut: '5' },
      { id: 'ta', labelHi: 'தமிழ் (Tamil)', labelEn: 'Tamil', shortcut: '6' },
      { id: 'te', labelHi: 'తెలుగు (Telugu)', labelEn: 'Telugu', shortcut: '7' },
    ],
  },
  ROLE: {
    step: 'ROLE',
    spokenHi: 'अब बताएं, आप दृष्टि का इस्तेमाल किस रूप में कर रहे हैं? विद्यार्थी यानी कैंडिडेट, परीक्षक यानी एग्जामिनर, या प्रशासक?',
    spokenEn: 'Please select your role in Drishti: Candidate learner, Examiner, or Administrator.',
    captionHi: 'अपनी भूमिका चुनें: विद्यार्थी (Candidate), परीक्षक (Examiner), या प्रशासक (Admin)।',
    captionEn: 'Select your role: Student / Candidate, Examiner, or Administrator.',
    options: [
      { id: 'candidate', labelHi: 'विद्यार्थी / कैंडिडेट (Student)', labelEn: 'Candidate / Student', shortcut: '1' },
      { id: 'examiner', labelHi: 'परीक्षक / एग्जामिनर (Examiner)', labelEn: 'Examiner (Faculty)', shortcut: '2' },
      { id: 'admin', labelHi: 'प्रशासक / एडमिन (Administrator)', labelEn: 'Administrator', shortcut: '3' },
    ],
  },
  TEXT_SETTINGS: {
    step: 'TEXT_SETTINGS',
    spokenHi: 'आपको स्क्रीन पर टेक्स्ट किस साइज में पढ़ना आरामदायक लगता है? आप डिफ़ॉल्ट, बड़ा, या अत्यधिक बड़ा साइज चुन सकते हैं।',
    spokenEn: 'What text size is most comfortable for you to read on screen? You can choose Small, Medium, Large, or Extra Large.',
    captionHi: 'टेक्स्ट साइज, फ़ॉन्ट, और लाइन स्पेसिंग चुनें। नीचे लाइव प्रिव्यू देखें।',
    captionEn: 'Choose text size, font, and line spacing. See live preview below.',
    options: [
      { id: 'default', labelHi: 'मध्यम (100% Medium)', labelEn: 'Medium (100%)', shortcut: '1' },
      { id: 'large', labelHi: 'बड़ा (125% Large)', labelEn: 'Large (125%)', shortcut: '2' },
      { id: 'extra-large', labelHi: 'अत्यधिक बड़ा (150% Extra Large)', labelEn: 'Extra Large (150%)', shortcut: '3' },
      { id: 'small', labelHi: 'छोटा (85% Small)', labelEn: 'Small (85%)', shortcut: '4' },
    ],
  },
  THEME_SETTINGS: {
    step: 'THEME_SETTINGS',
    spokenHi: 'आपको कौन सा थीम ज्यादा आरामदायक लगता है? लाइट मोड, डार्क मोड, या हाई कॉन्ट्रास्ट मोड?',
    spokenEn: 'Which visual theme is most comfortable for your vision? Light Mode, Dark Mode, High Contrast Light, or High Contrast Dark?',
    captionHi: 'कलर थीम चुनें: लाइट, डार्क, या हाई-कॉन्ट्रास्ट ब्लैक/व्हाइट।',
    captionEn: 'Select color theme: Light, Dark, High Contrast Light, or High Contrast Dark.',
    options: [
      { id: 'dark', labelHi: 'डार्क मोड (Dark Mode)', labelEn: 'Dark Mode', shortcut: '1' },
      { id: 'light', labelHi: 'लाइट मोड (Light Mode)', labelEn: 'Light Mode', shortcut: '2' },
      { id: 'high_contrast_dark', labelHi: 'हाई कॉन्ट्रास्ट ब्लैक (High Contrast Dark)', labelEn: 'High Contrast Dark', shortcut: '3' },
      { id: 'high_contrast_light', labelHi: 'हाई कॉन्ट्रास्ट व्हाइट (High Contrast Light)', labelEn: 'High Contrast Light', shortcut: '4' },
    ],
  },
  VOICE_SETTINGS: {
    step: 'VOICE_SETTINGS',
    spokenHi: 'आप मेरी आवाज़ किस स्पीड और भाषा में सुनना पसंद करेंगे? आप बोलने की गति को 0.75x से 2.0x तक सेट कर सकते हैं।',
    spokenEn: 'At what speed would you like me to speak? You can adjust my speech rate from 0.75x up to 2.0x.',
    captionHi: 'वॉयस स्पीड और ऑडिबल फीडबैक स्पीड चुनें।',
    captionEn: 'Choose speech speed and voice settings. Test sample voice playback.',
    options: [
      { id: '1.0', labelHi: 'सामान्य गति (1.0x Normal)', labelEn: '1.0x Normal Speed', shortcut: '1' },
      { id: '1.25', labelHi: 'तेज़ गति (1.25x Fast)', labelEn: '1.25x Brisk Speed', shortcut: '2' },
      { id: '0.8', labelHi: 'धीमी गति (0.8x Gentle)', labelEn: '0.8x Relaxed Speed', shortcut: '3' },
      { id: '1.5', labelHi: 'बहुत तेज़ (1.5x Rapid)', labelEn: '1.5x Screen Reader Speed', shortcut: '4' },
    ],
  },
  ACCESSIBILITY_FEATURES: {
    step: 'ACCESSIBILITY_FEATURES',
    spokenHi: 'दृष्टि में कई सुलभता टूल्स हैं जैसे स्क्रीन रीडर, कीबोर्ड नेविगेशन, वॉयस कमांड्स, और ऑडियो क्वेश्चन रीडिंग। अपनी आवश्यकता अनुसार चुनिए।',
    spokenEn: 'Drishti includes assistive tools such as Screen Reader Support, Keyboard Navigation, Voice Commands, and Audio Question Reading. Select the tools you need.',
    captionHi: 'सहायक तकनीकें चुनें: स्क्रीन रीडर, कीबोर्ड-ओनली, वॉयस कमांड, ऑडियो वाचन, ब्रेल सपोर्ट।',
    captionEn: 'Select assistive tools: Screen Reader, Keyboard First, Voice Commands, Audio Question Reading, Braille Support.',
    options: [
      { id: 'screen_reader', labelHi: 'स्क्रीन रीडर सपोर्ट', labelEn: 'Screen Reader Optimization' },
      { id: 'keyboard_nav', labelHi: 'कीबोर्ड नेविगेशन', labelEn: 'Keyboard First Navigation' },
      { id: 'voice_commands', labelHi: 'वॉयस कमांड्स', labelEn: 'Hands-Free Voice Commands' },
      { id: 'audio_questions', labelHi: 'ऑडियो प्रश्न वाचन', labelEn: 'Automatic Audio Question Reading' },
      { id: 'reduced_motion', labelHi: 'कम गति (Reduced Motion)', labelEn: 'Reduced Motion Animations' },
      { id: 'braille', labelHi: 'ब्रेल डिस्प्ले सपोर्ट', labelEn: 'Braille Display Compatibility' },
    ],
  },
  LEARNING_PREFERENCES: {
    step: 'LEARNING_PREFERENCES',
    spokenHi: 'आप सीखने और अभ्यास करने के लिए कौन सा तरीका पसंद करते हैं? ऑडियो-आधारित, पाठ्य-आधारित, ब्रेल-समर्थित, या दोनों का मिश्रण?',
    spokenEn: 'How do you prefer to study and practice? Audio-first learning, text-based learning, Braille-supported, or a multimodal combination?',
    captionHi: 'अध्ययन शैली चुनें: ऑडियो-प्रधान, पाठ्य-आधारित, ब्रेल-समर्थित, या मिश्रित।',
    captionEn: 'Choose learning preference: Audio-first, Text-based, Braille-supported, or Multimodal Combined.',
    options: [
      { id: 'audio', labelHi: 'ऑडियो-प्रधान शिक्षण (Audio-First)', labelEn: 'Audio-First Learning', shortcut: '1' },
      { id: 'text', labelHi: 'पाठ्य-आधारित शिक्षण (Text-Based)', labelEn: 'Text-Based Learning', shortcut: '2' },
      { id: 'combined', labelHi: 'मिश्रित शिक्षण (Combined Multimodal)', labelEn: 'Combined Multimodal', shortcut: '3' },
      { id: 'braille', labelHi: 'ब्रेल-समर्थित शिक्षण (Braille-Supported)', labelEn: 'Braille-Supported Learning', shortcut: '4' },
    ],
  },
  SUMMARY: {
    step: 'SUMMARY',
    spokenHi: 'बहुत बढ़िया! आपकी प्राथमिकताएं तैयार हैं। क्या मैं इन सेटिंग्स को सहेज कर आपका डैशबोर्ड तैयार कर दूँ?',
    spokenEn: 'Wonderful! Your accessibility setup is ready. Shall I save these preferences and open your personalized dashboard?',
    captionHi: 'अपनी प्राथमिकताओं की समीक्षा करें और पुष्टि करें। आप किसी भी विकल्प को एडिट कर सकते हैं।',
    captionEn: 'Review your complete setup summary. You can edit any section before saving.',
    options: [
      { id: 'confirm', labelHi: 'सेव करें और डैशबोर्ड खोलें (Confirm & Save)', labelEn: 'Confirm & Save', shortcut: 'Enter' },
      { id: 'edit', labelHi: 'बदलाव करें (Edit Preferences)', labelEn: 'Edit Settings', shortcut: 'E' },
    ],
  },
  VALIDATION: {
    step: 'VALIDATION',
    spokenHi: 'सिस्टम सत्यापन चल रहा है... प्रमाणीकरण, भाषा, थीम और अनुमतियां जांची जा रही हैं।',
    spokenEn: 'Running final system validation... Verifying session, language, theme, and authorization.',
    captionHi: 'अंतिम सिस्टम सत्यापन: सत्र, भूमिका, भाषा और एक्सेसिबिलिटी टूल्स की जांच।',
    captionEn: 'Final system validation: Session, role authorization, language, and accessibility profiles.',
    options: [],
  },
  COMPLETE: {
    step: 'COMPLETE',
    spokenHi: 'बहुत बढ़िया! आपका दृष्टि सेटअप सफलतापूर्वक पूरा हो गया है। अब हम आपकी सीखने की यात्रा शुरू करते हैं।',
    spokenEn: 'Outstanding! Your Drishti setup is complete. Let us begin your accessible learning journey now!',
    captionHi: 'सेटअप पूरा हुआ! आपका पर्सनलाइज़्ड डैशबोर्ड खुल रहा है...',
    captionEn: 'Setup complete! Navigating to your personalized dashboard...',
    options: [
      { id: 'dashboard', labelHi: 'डैशबोर्ड पर जाएं (Go to Dashboard)', labelEn: 'Open Dashboard', shortcut: 'Enter' },
    ],
  },
};

export class SaarthiAiService {

  /**
   * Parse user natural language input (Hindi, English, Hinglish) and return intent and parameters.
   */
  public parseNaturalInput(
    rawText: string,
    currentStep: SaarthiStep
  ): { intent: string; value?: any; confidence: number; replyHi: string; replyEn: string } {
    const text = rawText.trim().toLowerCase();

    // Universal Navigation Intents
    if (
      text.includes('repeat') ||
      text.includes('phir se') ||
      text.includes('fir se') ||
      text.includes('dobara') ||
      text.includes('re-read') ||
      text.includes('batao dobara') ||
      text.includes('दोहराएं') ||
      text.includes('दोहराओ') ||
      text.includes('फिर से') ||
      text.includes('दोबारा') ||
      text.includes('वापस बोलो')
    ) {
      return {
        intent: 'REPEAT',
        confidence: 0.95,
        replyHi: 'जी, मैं दोबारा निर्देश दोहरा रहा हूँ।',
        replyEn: 'Certainly, repeating the instructions for you.',
      };
    }

    if (
      text.includes('piche') ||
      text.includes('peeche') ||
      text.includes('back') ||
      text.includes('previous') ||
      text.includes('pichla') ||
      text.includes('wapas') ||
      text.includes('पीछे') ||
      text.includes('पिछला') ||
      text.includes('वापस')
    ) {
      return {
        intent: 'GO_BACK',
        confidence: 0.95,
        replyHi: 'ठीक है, हम पिछले स्टेप पर वापस जा रहे हैं।',
        replyEn: 'Navigating back to the previous step.',
      };
    }

    if (
      text.includes('samajh nahi') ||
      text.includes('help') ||
      text.includes('madad') ||
      text.includes('kya karein') ||
      text.includes('kya karna hai') ||
      text.includes('मदद') ||
      text.includes('सहायता') ||
      text.includes('क्या करें')
    ) {
      return {
        intent: 'HELP',
        confidence: 0.95,
        replyHi: 'कोई बात नहीं! मैं आपको समझाता हूँ। आपको बस अपनी पसंद बोलनी है, या आप 1, 2, 3 नंबर दबा सकते हैं।',
        replyEn: 'No problem! Simply tell me what feels most comfortable, or press keys 1, 2, or 3 on your keyboard.',
      };
    }

    // Step-Specific Intent Parsing
    switch (currentStep) {
      case 'WELCOME':
        if (
          text.includes('shuru') ||
          text.includes('start') ||
          text.includes('haan') ||
          text.includes('yes') ||
          text.includes('chalo') ||
          text.includes('theek hai') ||
          text.includes('theek') ||
          text.includes('karo') ||
          text.includes('next') ||
          text.includes('aage') ||
          text.includes('1') ||
          text.includes('शुरू') ||
          text.includes('हाँ') ||
          text.includes('हां') ||
          text.includes('स्टार्ट') ||
          text.includes('चालू करो') ||
          text.includes('शुरू करो') ||
          text.includes('आगे') ||
          text.includes('चलो') ||
          text.includes('ठीक है')
        ) {
          return {
            intent: 'START',
            value: 'start',
            confidence: 0.98,
            replyHi: 'नमस्ते! बहुत बढ़िया, चलिए सेटअप शुरू करते हैं।',
            replyEn: 'Namaste! Excellent, let us begin your setup.',
          };
        }
        if (text.includes('help') || text.includes('madad') || text.includes('2') || text.includes('मदद')) {
          return {
            intent: 'HELP',
            value: 'help',
            confidence: 0.95,
            replyHi: 'दृष्टि एक पूर्णतः सुलभ परीक्षा एवं अध्ययन मंच है। आप बिना माउस के सिर्फ बोलकर पूरा सेटअप कर सकते हैं।',
            replyEn: 'Drishti is fully accessible. You can complete the entire setup hands-free using your voice.',
          };
        }
        break;

      case 'AUTH_METHOD':
        if (
          text.includes('face') ||
          text.includes('chehra') ||
          text.includes('camera') ||
          text.includes('1') ||
          text.includes('फेस') ||
          text.includes('चेहरा') ||
          text.includes('कैमरा')
        ) {
          return {
            intent: 'SELECT_AUTH',
            value: 'face',
            confidence: 0.95,
            replyHi: 'फेस ऑथेंटिकेशन चुना गया। कृपया कैमरे के सामने चेहरा रखें।',
            replyEn: 'Face Authentication selected. Please position your face before the camera.',
          };
        }
        if (
          text.includes('passkey') ||
          text.includes('hello') ||
          text.includes('finger') ||
          text.includes('2') ||
          text.includes('पासकी') ||
          text.includes('हैलो') ||
          text.includes('फिंगरप्रिंट')
        ) {
          return {
            intent: 'SELECT_AUTH',
            value: 'passkey',
            confidence: 0.95,
            replyHi: 'विंडोज़ हैलो पासकी चुनी गई। डिवाइस बायोमेट्रिक्स सक्रिय किया जा रहा है।',
            replyEn: 'Windows Hello / Passkey selected. Initializing platform authenticator.',
          };
        }
        if (
          text.includes('password') ||
          text.includes('manual') ||
          text.includes('otp') ||
          text.includes('3') ||
          text.includes('पासवर्ड') ||
          text.includes('मैनुअल')
        ) {
          return {
            intent: 'SELECT_AUTH',
            value: 'password',
            confidence: 0.95,
            replyHi: 'पासवर्ड लॉगिन चुना गया।',
            replyEn: 'Password sign-in selected.',
          };
        }
        break;

      case 'LANGUAGE':
        if (
          text.includes('hindi') ||
          text.includes('हिन्दी') ||
          text.includes('हिंदी') ||
          text.includes('1')
        ) {
          return {
            intent: 'SELECT_LANGUAGE',
            value: 'hi',
            confidence: 0.98,
            replyHi: 'हिन्दी भाषा चुन ली गई है। पूरा इंटरफ़ेस हिन्दी में अपडेट हो गया है।',
            replyEn: 'Hindi selected. Interface has switched to Hindi.',
          };
        }
        if (
          text.includes('english') ||
          text.includes('angrezi') ||
          text.includes('अंग्रेजी') ||
          text.includes('अंग्रेज़ी') ||
          text.includes('2')
        ) {
          return {
            intent: 'SELECT_LANGUAGE',
            value: 'en',
            confidence: 0.98,
            replyHi: 'English भाषा चुन ली गई है।',
            replyEn: 'English selected. Interface language updated.',
          };
        }
        if (text.includes('hinglish') || text.includes('हिंग्लिश') || text.includes('3')) {
          return {
            intent: 'SELECT_LANGUAGE',
            value: 'hinglish',
            confidence: 0.95,
            replyHi: 'हिंग्लिश भाषा चुनी गई।',
            replyEn: 'Hinglish selected.',
          };
        }
        if (text.includes('marathi') || text.includes('मराठी') || text.includes('4')) {
          return { intent: 'SELECT_LANGUAGE', value: 'mr', confidence: 0.95, replyHi: 'मराठी भाषा निवडली गेली आहे.', replyEn: 'Marathi selected.' };
        }
        if (text.includes('bengali') || text.includes('bangla') || text.includes('বাংলা') || text.includes('बांग्ला') || text.includes('5')) {
          return { intent: 'SELECT_LANGUAGE', value: 'bn', confidence: 0.95, replyHi: 'বাংলা ভাষা নির্বাচিত হয়েছে।', replyEn: 'Bengali selected.' };
        }
        if (text.includes('tamil') || text.includes('தமிழ்') || text.includes('तमिल') || text.includes('6')) {
          return { intent: 'SELECT_LANGUAGE', value: 'ta', confidence: 0.95, replyHi: 'தமிழ் தேர்ந்தெடுக்கப்பட்டது.', replyEn: 'Tamil selected.' };
        }
        if (text.includes('telugu') || text.includes('తెలుగు') || text.includes('तेलुगु') || text.includes('7')) {
          return { intent: 'SELECT_LANGUAGE', value: 'te', confidence: 0.95, replyHi: 'తెలుగు ఎంపిక చేయబడింది.', replyEn: 'Telugu selected.' };
        }
        break;

      case 'ROLE':
        if (
          text.includes('student') ||
          text.includes('candidate') ||
          text.includes('vidyarthi') ||
          text.includes('1') ||
          text.includes('कैंडिडेट') ||
          text.includes('विद्यार्थी') ||
          text.includes('छात्र') ||
          text.includes('स्टूडेंट')
        ) {
          return {
            intent: 'SELECT_ROLE',
            value: 'candidate',
            confidence: 0.95,
            replyHi: 'विद्यार्थी प्रोफाइल सत्यापित किया गया। आपको संपूर्ण एक्सेसिबिलिटी और लर्निंग टूल्स मिलेंगे।',
            replyEn: 'Student / Candidate role confirmed with full learning & accessibility tools.',
          };
        }
        if (
          text.includes('examiner') ||
          text.includes('teacher') ||
          text.includes('parikshak') ||
          text.includes('2') ||
          text.includes('परीक्षक') ||
          text.includes('शिक्षक') ||
          text.includes('एग्जामिनर') ||
          text.includes('टीचर')
        ) {
          return {
            intent: 'SELECT_ROLE',
            value: 'examiner',
            confidence: 0.90,
            replyHi: 'परीक्षक रोल का अनुरोध प्राप्त हुआ। बैकएंड ऑथराइजेशन की जांच की जा रही है।',
            replyEn: 'Examiner role requested. Checking backend verification credentials.',
          };
        }
        if (
          text.includes('admin') ||
          text.includes('administrator') ||
          text.includes('prashasak') ||
          text.includes('3') ||
          text.includes('प्रशासक') ||
          text.includes('एडमिन')
        ) {
          return {
            intent: 'SELECT_ROLE',
            value: 'admin',
            confidence: 0.90,
            replyHi: 'प्रशासक रोल का अनुरोध प्राप्त हुआ। सुरक्षा अनुमतियों का सत्यापन किया जा रहा है।',
            replyEn: 'Administrator role requested. Verifying administrative privileges.',
          };
        }
        break;

      case 'TEXT_SETTINGS':
        if (
          text.includes('bada') ||
          text.includes('large') ||
          text.includes('mota') ||
          text.includes('2') ||
          text.includes('बड़ा') ||
          text.includes('लार्ज') ||
          text.includes('मोटा')
        ) {
          return { intent: 'SELECT_TEXT_SIZE', value: 'large', confidence: 0.95, replyHi: 'टेक्स्ट साइज बड़ा (125%) कर दिया गया है।', replyEn: 'Text size set to Large (125%).' };
        }
        if (
          text.includes('extra') ||
          text.includes('bahut bada') ||
          text.includes('maximum') ||
          text.includes('3') ||
          text.includes('अत्यधिक बड़ा') ||
          text.includes('बहुत बड़ा') ||
          text.includes('एक्स्ट्रा')
        ) {
          return { intent: 'SELECT_TEXT_SIZE', value: 'extra-large', confidence: 0.95, replyHi: 'टेक्स्ट साइज अत्यधिक बड़ा (150%) कर दिया गया है।', replyEn: 'Text size set to Extra Large (150%).' };
        }
        if (
          text.includes('chota') ||
          text.includes('small') ||
          text.includes('4') ||
          text.includes('छोटा') ||
          text.includes('स्मॉल')
        ) {
          return { intent: 'SELECT_TEXT_SIZE', value: 'small', confidence: 0.95, replyHi: 'टेक्स्ट साइज छोटा सेट किया गया है।', replyEn: 'Text size set to Small.' };
        }
        if (
          text.includes('normal') ||
          text.includes('medium') ||
          text.includes('default') ||
          text.includes('samanya') ||
          text.includes('theek') ||
          text.includes('aage') ||
          text.includes('next') ||
          text.includes('1') ||
          text.includes('सामान्य') ||
          text.includes('मध्यम') ||
          text.includes('डिफ़ॉल्ट') ||
          text.includes('मीडियम') ||
          text.includes('आगे') ||
          text.includes('ठीक है')
        ) {
          return { intent: 'SELECT_TEXT_SIZE', value: 'default', confidence: 0.95, replyHi: 'टेक्स्ट साइज सामान्य (100%) सेट किया गया है।', replyEn: 'Text size set to Medium (100%).' };
        }
        break;

      case 'THEME_SETTINGS':
        if (
          text.includes('dark') ||
          text.includes('kala') ||
          text.includes('raat') ||
          text.includes('1') ||
          text.includes('डार्क') ||
          text.includes('काला') ||
          text.includes('रात') ||
          text.includes('डार्क मोड')
        ) {
          return { intent: 'SELECT_THEME', value: 'dark', confidence: 0.95, replyHi: 'डार्क मोड सक्रिय कर दिया गया है।', replyEn: 'Dark Mode applied.' };
        }
        if (
          text.includes('light') ||
          text.includes('safed') ||
          text.includes('din') ||
          text.includes('2') ||
          text.includes('लाइट') ||
          text.includes('सफेद') ||
          text.includes('दिन') ||
          text.includes('लाइट मोड')
        ) {
          return { intent: 'SELECT_THEME', value: 'light', confidence: 0.95, replyHi: 'लाइट मोड सक्रिय कर दिया गया है।', replyEn: 'Light Mode applied.' };
        }
        if (
          text.includes('contrast') ||
          text.includes('high') ||
          text.includes('3') ||
          text.includes('कॉन्ट्रास्ट') ||
          text.includes('हाई कॉन्ट्रास्ट')
        ) {
          return { intent: 'SELECT_THEME', value: 'high_contrast_dark', confidence: 0.95, replyHi: 'हाई कॉन्ट्रास्ट मोड सक्रिय कर दिया गया है।', replyEn: 'High Contrast Mode applied.' };
        }
        if (
          text.includes('theek') ||
          text.includes('aage') ||
          text.includes('next') ||
          text.includes('आगे') ||
          text.includes('नेक्स्ट') ||
          text.includes('ठीक है')
        ) {
          return { intent: 'SELECT_THEME', value: 'dark', confidence: 0.95, replyHi: 'डार्क मोड चुना गया और आगे बढ़ रहे हैं।', replyEn: 'Dark Mode selected, proceeding.' };
        }
        break;

      case 'VOICE_SETTINGS':
        if (
          text.includes('tez') ||
          text.includes('fast') ||
          text.includes('2') ||
          text.includes('तेज़') ||
          text.includes('तेज') ||
          text.includes('फास्ट')
        ) {
          return { intent: 'SELECT_VOICE_SPEED', value: '1.25', confidence: 0.95, replyHi: 'बोलने की गति तेज़ (1.25x) सेट कर दी गई है।', replyEn: 'Voice speed set to 1.25x.' };
        }
        if (
          text.includes('dheere') ||
          text.includes('slow') ||
          text.includes('3') ||
          text.includes('धीमा') ||
          text.includes('धीरे') ||
          text.includes('स्लो')
        ) {
          return { intent: 'SELECT_VOICE_SPEED', value: '0.8', confidence: 0.95, replyHi: 'बोलने की गति धीमी (0.8x) सेट कर दी गई है।', replyEn: 'Voice speed set to 0.8x.' };
        }
        if (
          text.includes('rapid') ||
          text.includes('bahut tez') ||
          text.includes('4') ||
          text.includes('बहुत तेज़') ||
          text.includes('स्क्रीन रीडर स्पीड')
        ) {
          return { intent: 'SELECT_VOICE_SPEED', value: '1.5', confidence: 0.95, replyHi: 'बोलने की गति बहुत तेज़ (1.5x) सेट कर दी गई है।', replyEn: 'Voice speed set to 1.5x.' };
        }
        if (
          text.includes('normal') ||
          text.includes('samanya') ||
          text.includes('theek') ||
          text.includes('aage') ||
          text.includes('next') ||
          text.includes('1') ||
          text.includes('सामान्य') ||
          text.includes('नॉर्मल') ||
          text.includes('आगे') ||
          text.includes('नेक्स्ट') ||
          text.includes('ठीक है')
        ) {
          return { intent: 'SELECT_VOICE_SPEED', value: '1.0', confidence: 0.95, replyHi: 'बोलने की गति सामान्य (1.0x) सेट कर दी गई है।', replyEn: 'Voice speed set to Normal 1.0x.' };
        }
        break;

      case 'ACCESSIBILITY_FEATURES':
        if (
          text.includes('screen reader') ||
          text.includes('reader') ||
          text.includes('1') ||
          text.includes('स्क्रीन रीडर') ||
          text.includes('रीडर')
        ) {
          return {
            intent: 'TOGGLE_FEATURE',
            value: 'screen_reader',
            confidence: 0.95,
            replyHi: 'स्क्रीन रीडर मोड टॉगल किया गया।',
            replyEn: 'Screen reader mode toggled.',
          };
        }
        if (
          text.includes('keyboard') ||
          text.includes('key') ||
          text.includes('2') ||
          text.includes('कीबोर्ड') ||
          text.includes('कीबोर्ड नेविगेशन')
        ) {
          return {
            intent: 'TOGGLE_FEATURE',
            value: 'keyboard_nav',
            confidence: 0.95,
            replyHi: 'कीबोर्ड नेविगेशन मोड टॉगल किया गया।',
            replyEn: 'Keyboard-first navigation toggled.',
          };
        }
        if (
          text.includes('voice') ||
          text.includes('bol kar') ||
          text.includes('वॉयस') ||
          text.includes('बोलकर')
        ) {
          return {
            intent: 'TOGGLE_FEATURE',
            value: 'voice_commands',
            confidence: 0.95,
            replyHi: 'वॉयस कमांड्स मोड टॉगल किया गया।',
            replyEn: 'Voice commands toggled.',
          };
        }
        if (
          text.includes('audio') ||
          text.includes('questions') ||
          text.includes('prashna') ||
          text.includes('3') ||
          text.includes('ऑडियो') ||
          text.includes('प्रश्न') ||
          text.includes('सवाल')
        ) {
          return {
            intent: 'TOGGLE_FEATURE',
            value: 'audio_questions',
            confidence: 0.95,
            replyHi: 'ऑडियो प्रश्न वाचन मोड टॉगल किया गया।',
            replyEn: 'Audio question reading toggled.',
          };
        }
        if (
          text.includes('braille') ||
          text.includes('4') ||
          text.includes('ब्रेल') ||
          text.includes('ब्रेल डिस्प्ले')
        ) {
          return {
            intent: 'TOGGLE_FEATURE',
            value: 'braille',
            confidence: 0.95,
            replyHi: 'ब्रेल डिस्प्ले समर्थन टॉगल किया गया।',
            replyEn: 'Braille display support toggled.',
          };
        }
        if (
          text.includes('next') ||
          text.includes('aage') ||
          text.includes('theek') ||
          text.includes('done') ||
          text.includes('ho gaya') ||
          text.includes('chalo') ||
          text.includes('आगे') ||
          text.includes('आगे बढ़ो') ||
          text.includes('नेक्स्ट') ||
          text.includes('हो गया') ||
          text.includes('ठीक है')
        ) {
          return {
            intent: 'NEXT',
            value: 'next',
            confidence: 0.95,
            replyHi: 'सहायक उपकरण सहेजे गए। चलिए सीखने की शैली चुनते हैं।',
            replyEn: 'Assistive tools saved. Moving to learning style.',
          };
        }
        break;

      case 'LEARNING_PREFERENCES':
        if (
          text.includes('audio') ||
          text.includes('sun kar') ||
          text.includes('awaz') ||
          text.includes('1') ||
          text.includes('ऑडियो') ||
          text.includes('सुनकर') ||
          text.includes('आवाज़')
        ) {
          return { intent: 'SELECT_LEARNING', value: 'audio', confidence: 0.95, replyHi: 'ऑडियो-प्रधान शिक्षण प्राथमिकता चुनी गई।', replyEn: 'Audio-First Learning preference selected.' };
        }
        if (
          text.includes('text') ||
          text.includes('padh kar') ||
          text.includes('2') ||
          text.includes('टेक्स्ट') ||
          text.includes('पढ़कर') ||
          text.includes('लिखा हुआ')
        ) {
          return { intent: 'SELECT_LEARNING', value: 'text', confidence: 0.95, replyHi: 'पाठ्य-आधारित शिक्षण प्राथमिकता चुनी गई।', replyEn: 'Text-Based Learning preference selected.' };
        }
        if (
          text.includes('combined') ||
          text.includes('mishrit') ||
          text.includes('dono') ||
          text.includes('3') ||
          text.includes('मिश्रित') ||
          text.includes('दोनों') ||
          text.includes('सब') ||
          text.includes('कंबाइंड')
        ) {
          return { intent: 'SELECT_LEARNING', value: 'combined', confidence: 0.95, replyHi: 'मिश्रित मल्टीमॉडल शिक्षण चुना गया।', replyEn: 'Combined Multimodal Learning selected.' };
        }
        if (
          text.includes('braille') ||
          text.includes('4') ||
          text.includes('ब्रेल')
        ) {
          return { intent: 'SELECT_LEARNING', value: 'braille', confidence: 0.95, replyHi: 'ब्रेल-समर्थित शिक्षण प्राथमिकता चुनी गई।', replyEn: 'Braille-Supported Learning preference selected.' };
        }
        if (
          text.includes('next') ||
          text.includes('aage') ||
          text.includes('theek') ||
          text.includes('done') ||
          text.includes('आगे') ||
          text.includes('ठीक है')
        ) {
          return { intent: 'SELECT_LEARNING', value: 'combined', confidence: 0.95, replyHi: 'सीखने की शैली चुनी गई। आगे बढ़ रहे हैं।', replyEn: 'Learning style selected, proceeding.' };
        }
        break;

      case 'SUMMARY':
        if (
          text.includes('save') ||
          text.includes('confirm') ||
          text.includes('theek') ||
          text.includes('haan') ||
          text.includes('yes') ||
          text.includes('chalo') ||
          text.includes('karo') ||
          text.includes('done') ||
          text.includes('सहेजें') ||
          text.includes('सेव') ||
          text.includes('कन्फर्म') ||
          text.includes('ठीक है') ||
          text.includes('हाँ') ||
          text.includes('हां') ||
          text.includes('चलो')
        ) {
          return { intent: 'CONFIRM_SAVE', value: 'confirm', confidence: 0.98, replyHi: 'आपकी सेटिंग्स सहेजी जा रही हैं।', replyEn: 'Saving your preferences.' };
        }
        if (
          text.includes('edit') ||
          text.includes('badlo') ||
          text.includes('change') ||
          text.includes('बदलो') ||
          text.includes('चेंज') ||
          text.includes('सुधारो')
        ) {
          return { intent: 'EDIT_PREFERENCES', value: 'edit', confidence: 0.95, replyHi: 'आप किस विकल्प को बदलना चाहते हैं?', replyEn: 'Which preference would you like to edit?' };
        }
        break;

      default:
        break;
    }

    return {
      intent: 'UNKNOWN',
      confidence: 0.3,
      replyHi: 'क्षमा करें, मैं समझ नहीं पाया। क्या आप दोहरा सकते हैं, या स्क्रीन पर दिए गए विकल्पों में से चुन सकते हैं?',
      replyEn: "I didn't quite catch that. Could you please repeat, or choose one of the options on screen?",
    };
  }

  /**
   * Speak a dialogue through TTS with language selection and debouncing.
   */
  public speak(
    text: string,
    lang: 'hi' | 'en' = 'hi',
    rate: number = 1.0,
    onEnd?: () => void,
    priority: 'normal' | 'urgent' = 'urgent'
  ): void {
    if (typeof window === 'undefined') return;
    speechService.setLanguage(lang);
    speechService.setRate(rate as any);
    speechService.speak(text, { priority, onEnd });
  }

  public stopSpeaking(): void {
    speechService.stop();
  }
}

export const saarthiAiService = new SaarthiAiService();
