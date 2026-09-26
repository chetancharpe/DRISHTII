/**
 * Shared Type Definitions between Client and Future Backend
 */

export type UserRole = 'candidate' | 'examiner' | 'admin';

export type ExamStatus = 'draft' | 'published' | 'archived' | 'ongoing' | 'completed';

export type QuestionType = 'single_choice' | 'multiple_choice' | 'true_false' | 'numerical';

export type QuestionDifficulty = 'easy' | 'medium' | 'hard';

export type ThemeMode = 'light' | 'dark' | 'high_contrast';

export interface AccessibilityPreferences {
  fontSize: 'normal' | 'large' | 'extra_large';
  highContrast: boolean;
  theme: ThemeMode;
  reducedMotion: boolean;
  audioFeedbackEnabled: boolean;
  screenReaderOptimized: boolean;
  keyboardOnlyMode: boolean;
  preferredLanguage: string;
}
