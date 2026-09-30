/**
 * Accessibility Preference Types for GoWow
 * Principle: "Accessibility should create independence."
 */

export type ThemeMode = 'light' | 'dark' | 'high_contrast' | 'system';
export type ThemeOption = 'light' | 'dark' | 'system';

export type FontSizeOption = 'default' | 'large' | 'extra-large' | 'maximum';
export type FontSizeScale = 'small' | 'normal' | 'large' | 'extra_large' | FontSizeOption;

export type ContrastOption = 'standard' | 'high';

export type SpeechRateOption = 'slow' | 'normal' | 'fast';

export type TimerAnnouncementsOption = 'off' | 'warnings' | 'regular';

export type ReducedMotionOption = 'system' | 'on' | 'off';

export type SupportedLanguage = 
  | 'en' 
  | 'hi' 
  | 'mr' 
  | 'bn' 
  | 'ta' 
  | 'te' 
  | 'gu' 
  | 'kn' 
  | 'ml' 
  | 'pa';

export interface AccessibilityPreferences {
  // Core text and visual sizing
  fontSize: FontSizeOption;
  contrast: ContrastOption;
  theme: ThemeOption;

  // Audio assistance
  audioEnabled: boolean;
  speechRate: SpeechRateOption;
  speechRateMultiplier?: number; // Granular multiplier (0.5x to 3.0x) for screen-reader users
  readQuestions: boolean;
  readOptions: boolean;
  readInstructions: boolean;
  announceStatus: boolean;
  timerAnnouncements: TimerAnnouncementsOption;

  // Navigation and motor
  keyboardFirst: boolean;
  screenReaderOptimized: boolean;
  reducedMotion: ReducedMotionOption;
  simplifiedInterface: boolean;

  // Internationalization
  language: string;
  voiceURI?: string;

  // Child Mode / Accessibility Extension (Requirement #6)
  accessibilityMode?: 'STANDARD' | 'VISUALLY_IMPAIRED' | 'CHILD';
  childModeSettings?: {
    largerControls: boolean;
    slowerVoice: boolean;
    simplifiedNavigation: boolean;
    gestureInteraction: boolean;
    voiceFirstInteraction: boolean;
    speechRateMultiplier: number;
  };

  // Backward compatibility aliases
  highContrast?: boolean;
  audioFeedbackEnabled?: boolean;
  keyboardOnlyMode?: boolean;
  preferredLanguage?: string;
}

export type AccessibilityStatusType =
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'in_progress'
  | 'completed'
  | 'not_started'
  | 'locked';

