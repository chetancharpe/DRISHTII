/**
 * Shared Application Constants
 */

export const APP_NAME = 'DRISHTI';
export const APP_TAGLINE = 'Accessible Examination & Practice Learning Platform';

export const USER_ROLES = {
  CANDIDATE: 'candidate' as const,
  EXAMINER: 'examiner' as const,
  ADMIN: 'admin' as const,
};

export const DEFAULT_ACCESSIBILITY_PREFERENCES = {
  fontSize: 'normal' as const,
  highContrast: false,
  theme: 'dark' as const,
  reducedMotion: false,
  audioFeedbackEnabled: true,
  screenReaderOptimized: true,
  keyboardOnlyMode: true,
  preferredLanguage: 'en',
};

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi (हिंदी)' },
  { code: 'ta', label: 'Tamil (தமிழ்)' },
  { code: 'te', label: 'Telugu (తెలుగు)' },
];
