/**
 * GoWow Multilingual Foundation (i18n)
 * Provides centralized text tokens for English and Hindi,
 * engineered for straightforward extension to Marathi, Bengali, Tamil, Telugu, etc.
 */

export type SupportedLocale = 'en' | 'hi' | 'mr' | 'bn' | 'ta' | 'te';

export interface TranslationDictionary {
  // Navigation & Landmarks
  skipToContent: string;
  accessibilitySettings: string;
  closeDialog: string;
  loading: string;
  errorOccurred: string;
  tryAgain: string;
  goBack: string;

  // Accessibility Panel
  a11yPanelTitle: string;
  a11yPanelDesc: string;
  textSize: string;
  textSizeDesc: string;
  themePreset: string;
  contrastMode: string;
  screenReaderOpt: string;
  screenReaderDesc: string;
  auditoryAssistance: string;
  auditoryDesc: string;
  reducedMotion: string;
  reducedMotionDesc: string;
  keyboardMode: string;
  keyboardModeDesc: string;
  preferredLanguage: string;
  resetAll: string;

  // Common Actions
  submit: string;
  cancel: string;
  save: string;
  continue: string;
  previous: string;
  next: string;

  // Statuses
  statusSuccess: string;
  statusWarning: string;
  statusError: string;
  statusInfo: string;
  statusInProgress: string;
  statusCompleted: string;
  statusNotStarted: string;
  statusLocked: string;
}

export const translations: Record<SupportedLocale, Partial<TranslationDictionary>> = {
  en: {
    skipToContent: 'Skip to main content',
    accessibilitySettings: 'Accessibility Settings (Alt+A)',
    closeDialog: 'Close dialog',
    loading: 'Loading content...',
    errorOccurred: 'An unexpected issue occurred',
    tryAgain: 'Try Again',
    goBack: 'Go Back',

    a11yPanelTitle: 'Accessibility Calibration Center',
    a11yPanelDesc: 'Configure sensory and navigation preferences. Settings persist across examination sessions.',
    textSize: 'Text Sizing & Zoom',
    textSizeDesc: 'Adjust base typography scaling across the application.',
    themePreset: 'Theme Preset',
    contrastMode: 'Visual Contrast',
    screenReaderOpt: 'Screen-Reader Optimization',
    screenReaderDesc: 'Linearizes questions, math notations, and tables for descriptive speech order.',
    auditoryAssistance: 'Auditory Sonification & Feedback',
    auditoryDesc: 'Plays sound cues for timer warnings, selections, and alerts.',
    reducedMotion: 'Reduced Motion',
    reducedMotionDesc: 'Removes non-essential animations and transitions.',
    keyboardMode: 'Keyboard Navigation Badges',
    keyboardModeDesc: 'Displays key combination hints next to active controls.',
    preferredLanguage: 'Speech & Interface Language',
    resetAll: 'Reset to Defaults',

    submit: 'Submit',
    cancel: 'Cancel',
    save: 'Save Preferences',
    continue: 'Continue',
    previous: 'Previous',
    next: 'Next',

    statusSuccess: 'Completed Successfully',
    statusWarning: 'Review Required',
    statusError: 'Submission Error',
    statusInfo: 'Important Notice',
    statusInProgress: 'In Progress',
    statusCompleted: 'Completed',
    statusNotStarted: 'Not Started',
    statusLocked: 'Locked',
  },
  hi: {
    skipToContent: 'मुख्य सामग्री पर जाएं [Enter दबाएं]',
    accessibilitySettings: 'अभिगम्यता सेटिंग्स (Alt+A)',
    closeDialog: 'डायलॉग बंद करें',
    loading: 'सामग्री लोड हो रही है...',
    errorOccurred: 'एक अनपेक्षित त्रुटि हुई',
    tryAgain: 'पुनः प्रयास करें',
    goBack: 'वापस जाएं',

    a11yPanelTitle: 'अभिगम्यता नियंत्रण केंद्र (Accessibility Center)',
    a11yPanelDesc: 'संवेदी और नेविगेशन प्राथमिकताएं सेट करें। ये सेटिंग्स सुरक्षित रहेंगी।',
    textSize: 'टेक्स्ट का आकार (Text Size)',
    textSizeDesc: 'एप्लिकेशन में अक्षरों का आकार बढ़ाएं या घटाएं।',
    themePreset: 'थीम (Theme)',
    contrastMode: 'कंट्रास्ट (Contrast)',
    screenReaderOpt: 'स्क्रीन-रीडर अनुकूलन (Screen Reader Optimization)',
    screenReaderDesc: 'सवालों और तालिकाओं को स्पष्ट ऑडियो क्रम में व्यवस्थित करता है।',
    auditoryAssistance: 'ध्वनि संकेत (Audio Feedback)',
    auditoryDesc: 'टाइमर चेतावनी और उत्तर चयन के लिए ध्वनि संकेत प्रदान करता है।',
    reducedMotion: 'कम गति (Reduced Motion)',
    reducedMotionDesc: 'अनावश्यक एनिमेशन और गति को बंद करता है।',
    keyboardMode: 'कीबोर्ड नेविगेशन बैज',
    keyboardModeDesc: 'बटन के साथ कीबोर्ड शॉर्टकट दिखाता है।',
    preferredLanguage: 'भाषा (Language)',
    resetAll: 'डिफ़ॉल्ट पर रीसेट करें',

    submit: 'जमा करें (Submit)',
    cancel: 'रद्द करें (Cancel)',
    save: 'सेव करें (Save)',
    continue: 'जारी रखें (Continue)',
    previous: 'पिछला (Previous)',
    next: 'अगला (Next)',

    statusSuccess: 'सफलतापूर्वक पूर्ण',
    statusWarning: 'समीक्षा आवश्यक',
    statusError: 'त्रुटि',
    statusInfo: 'महत्वपूर्ण सूचना',
    statusInProgress: 'प्रगति में',
    statusCompleted: 'पूर्ण',
    statusNotStarted: 'शुरू नहीं हुआ',
    statusLocked: 'लॉक किया गया',
  },
  mr: {},
  bn: {},
  ta: {},
  te: {},
};

/**
 * Translation helper function with automatic fallback to English
 */
export function t(key: keyof TranslationDictionary, locale: string = 'en'): string {
  const currentLocale = (locale in translations ? locale : 'en') as SupportedLocale;
  const translation = translations[currentLocale]?.[key] || translations.en[key];
  return translation || key;
}
