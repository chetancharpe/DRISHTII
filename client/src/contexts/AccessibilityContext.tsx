import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import {
  AccessibilityPreferences,
  FontSizeOption,
  FontSizeScale,
  ContrastOption,
  ThemeOption,
  SpeechRateOption,
  ReducedMotionOption,
} from '../types/accessibility';

export interface AnnouncementItem {
  id: number;
  message: string;
  politeness: 'polite' | 'assertive';
}

export interface AccessibilityContextType {
  preferences: AccessibilityPreferences;
  isCalibrationOpen: boolean;
  openCalibration: () => void;
  closeCalibration: () => void;
  
  // Preference update methods
  updatePreference: <K extends keyof AccessibilityPreferences>(
    key: K,
    value: AccessibilityPreferences[K]
  ) => void;
  updatePreferences: (updates: Partial<AccessibilityPreferences>) => void;
  resetPreferences: () => void;
  savePreferences: () => void;
  loadPreferences: () => AccessibilityPreferences;

  // Reset Confirmation Modal State
  isResetModalOpen: boolean;
  openResetModal: () => void;
  closeResetModal: () => void;
  confirmReset: () => void;

  // Audio / Speech utilities
  speak: (text: string) => void;
  stopSpeaking: () => void;
  isSpeaking: boolean;
  isSpeechSupported: boolean;

  // Screen reader announcements
  announce: (message: string, politeness?: 'polite' | 'assertive') => void;
  currentAnnouncement: AnnouncementItem | null;

  // Resolved runtime theme
  resolvedTheme: 'light' | 'dark' | 'high_contrast';

  // Backward-compatible individual setters
  setFontSize: (fontSize: FontSizeScale) => void;
  setHighContrast: (enabled: boolean) => void;
  setReducedMotion: (val: boolean | ReducedMotionOption) => void;
  setAudioEnabled: (enabled: boolean) => void;
  setScreenReaderOptimized: (enabled: boolean) => void;
  setKeyboardOnlyMode: (enabled: boolean) => void;
  setPreferredLanguage: (language: string) => void;
}

export const ACCESSIBILITY_STORAGE_KEY = 'gowow_accessibility_preferences';
const LEGACY_STORAGE_KEY = 'gowow_a11y_prefs';

export const DEFAULT_PREFERENCES: AccessibilityPreferences = {
  fontSize: 'default',
  contrast: 'standard',
  theme: 'system',
  audioEnabled: false,
  speechRate: 'normal',
  readQuestions: true,
  readOptions: true,
  readInstructions: true,
  announceStatus: true,
  timerAnnouncements: 'warnings',
  keyboardFirst: false,
  screenReaderOptimized: false,
  reducedMotion: 'system',
  simplifiedInterface: false,
  language: 'en',

  // Backward compatibility mirrors
  highContrast: false,
  audioFeedbackEnabled: false,
  keyboardOnlyMode: false,
  preferredLanguage: 'en',
};

/**
 * Normalizes any loaded or updated preferences to conform to the standard model.
 */
function normalizePreferences(raw: Partial<AccessibilityPreferences> | null): AccessibilityPreferences {
  if (!raw) return { ...DEFAULT_PREFERENCES };

  // Map legacy font sizes if needed
  let fontSize: FontSizeOption = 'default';
  if (raw.fontSize) {
    const rawSize = String(raw.fontSize);
    if (rawSize === 'normal' || rawSize === 'default') fontSize = 'default';
    else if (rawSize === 'large') fontSize = 'large';
    else if (rawSize === 'extra_large' || rawSize === 'extra-large') fontSize = 'extra-large';
    else if (rawSize === 'maximum') fontSize = 'maximum';
    else if (rawSize === 'small') fontSize = 'default';
  }

  // Map contrast
  let contrast: ContrastOption = 'standard';
  if (raw.contrast === 'high' || raw.highContrast === true || (raw.theme as unknown as string) === 'high_contrast') {
    contrast = 'high';
  }

  // Map theme
  let theme: ThemeOption = 'system';
  if (raw.theme === 'light' || raw.theme === 'dark' || raw.theme === 'system') {
    theme = raw.theme;
  } else if ((raw.theme as unknown as string) === 'high_contrast') {
    theme = 'dark'; // High contrast overrides standard theme presentation
  }

  // Map audio
  const audioEnabled = Boolean(raw.audioEnabled ?? raw.audioFeedbackEnabled ?? false);

  // Map speech rate
  const speechRate: SpeechRateOption = raw.speechRate || 'normal';

  // Map navigation mode
  const keyboardFirst = Boolean(raw.keyboardFirst ?? raw.keyboardOnlyMode ?? false);

  // Map reduced motion
  let reducedMotion: ReducedMotionOption = 'system';
  const rawMotion = raw.reducedMotion as unknown;
  if (rawMotion === 'on' || rawMotion === true) reducedMotion = 'on';
  else if (rawMotion === 'off' || rawMotion === false) reducedMotion = 'off';
  else reducedMotion = 'system';

  const language = raw.language || raw.preferredLanguage || 'en';

  return {
    fontSize,
    contrast,
    theme,
    audioEnabled,
    speechRate,
    readQuestions: raw.readQuestions ?? true,
    readOptions: raw.readOptions ?? true,
    readInstructions: raw.readInstructions ?? true,
    announceStatus: raw.announceStatus ?? true,
    timerAnnouncements: raw.timerAnnouncements || 'warnings',
    keyboardFirst,
    screenReaderOptimized: Boolean(raw.screenReaderOptimized ?? false),
    reducedMotion,
    simplifiedInterface: Boolean(raw.simplifiedInterface ?? false),
    language,

    // Aliases
    highContrast: contrast === 'high',
    audioFeedbackEnabled: audioEnabled,
    keyboardOnlyMode: keyboardFirst,
    preferredLanguage: language,
  };
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Initial State from localStorage with safe fallback
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(() => {
    try {
      const stored = localStorage.getItem(ACCESSIBILITY_STORAGE_KEY);
      if (stored) {
        return normalizePreferences(JSON.parse(stored));
      }
      // Check legacy key
      const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacy) {
        return normalizePreferences(JSON.parse(legacy));
      }
    } catch {
      // localStorage may be unavailable in private browsing or restricted environments
    }
    return { ...DEFAULT_PREFERENCES };
  });

  const [isCalibrationOpen, setIsCalibrationOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentAnnouncement, setCurrentAnnouncement] = useState<AnnouncementItem | null>(null);
  const announcementTimeoutRef = useRef<number | null>(null);

  const isSpeechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // 2. Resolve Theme Mode (System / Light / Dark / High Contrast)
  const [systemDark, setSystemDark] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return true;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const resolvedTheme: 'light' | 'dark' | 'high_contrast' = 
    preferences.contrast === 'high'
      ? 'high_contrast'
      : preferences.theme === 'system'
      ? systemDark
        ? 'dark'
        : 'light'
      : preferences.theme;

  // 3. Screen Reader Announcement Service
  const announce = useCallback((message: string, politeness: 'polite' | 'assertive' = 'polite') => {
    if (announcementTimeoutRef.current) {
      window.clearTimeout(announcementTimeoutRef.current);
    }
    setCurrentAnnouncement({ id: Date.now(), message, politeness });
    announcementTimeoutRef.current = window.setTimeout(() => {
      setCurrentAnnouncement(null);
    }, 4000);
  }, []);

  // 4. Speech Synthesis Service (Manual user action only, never autoplays)
  const stopSpeaking = useCallback(() => {
    if (isSpeechSupported) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [isSpeechSupported]);

  const speak = useCallback(
    (text: string) => {
      if (!isSpeechSupported || !text.trim()) return;

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = preferences.language === 'hi' ? 'hi-IN' : 'en-US';

      // Rate mapping
      if (preferences.speechRate === 'slow') utterance.rate = 0.8;
      else if (preferences.speechRate === 'fast') utterance.rate = 1.3;
      else utterance.rate = 1.0;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    },
    [isSpeechSupported, preferences.language, preferences.speechRate]
  );

  // 5. Preference Updating & Persistence
  const persist = (next: AccessibilityPreferences) => {
    try {
      localStorage.setItem(ACCESSIBILITY_STORAGE_KEY, JSON.stringify(next));
      // Keep legacy in sync for safety
      localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Storage quota or restriction handled silently
    }
  };

  const updatePreference = useCallback(
    <K extends keyof AccessibilityPreferences>(key: K, value: AccessibilityPreferences[K]) => {
      setPreferences((prev) => {
        const updated = { ...prev, [key]: value };
        // Synchronize complementary fields
        if (key === 'contrast') {
          updated.highContrast = value === 'high';
        } else if (key === 'audioEnabled') {
          updated.audioFeedbackEnabled = Boolean(value);
        } else if (key === 'keyboardFirst') {
          updated.keyboardOnlyMode = Boolean(value);
        } else if (key === 'language') {
          updated.preferredLanguage = String(value);
        }

        persist(updated);
        return updated;
      });
    },
    []
  );

  const updatePreferences = useCallback((updates: Partial<AccessibilityPreferences>) => {
    setPreferences((prev) => {
      const updated = normalizePreferences({ ...prev, ...updates });
      persist(updated);
      return updated;
    });
  }, []);

  const savePreferences = useCallback(() => {
    persist(preferences);
    announce('Accessibility preferences saved successfully.');
  }, [preferences, announce]);

  const loadPreferences = useCallback((): AccessibilityPreferences => {
    try {
      const stored = localStorage.getItem(ACCESSIBILITY_STORAGE_KEY);
      if (stored) {
        const loaded = normalizePreferences(JSON.parse(stored));
        setPreferences(loaded);
        return loaded;
      }
    } catch {
      // Fallback
    }
    return preferences;
  }, [preferences]);

  // 6. Reset Modal Flow
  const openResetModal = () => setIsResetModalOpen(true);
  const closeResetModal = () => setIsResetModalOpen(false);

  const confirmReset = useCallback(() => {
    const defaults = { ...DEFAULT_PREFERENCES };
    setPreferences(defaults);
    persist(defaults);
    setIsResetModalOpen(false);
    announce('All accessibility settings have been reset to factory defaults.');
  }, [announce]);

  const resetPreferences = useCallback(() => {
    openResetModal();
  }, []);

  // 7. Backward Compatibility Setters
  const setFontSize = useCallback((fontSize: FontSizeScale) => {
    let normalized: FontSizeOption = 'default';
    if (fontSize === 'large') normalized = 'large';
    else if (fontSize === 'extra_large' || fontSize === 'extra-large') normalized = 'extra-large';
    else if (fontSize === 'maximum') normalized = 'maximum';
    updatePreference('fontSize', normalized);
    announce(`Text size changed to ${normalized}.`);
  }, [updatePreference, announce]);

  const setHighContrast = useCallback((enabled: boolean) => {
    const mode: ContrastOption = enabled ? 'high' : 'standard';
    updatePreference('contrast', mode);
    announce(enabled ? 'High contrast enabled.' : 'Standard contrast restored.');
  }, [updatePreference, announce]);

  const setReducedMotion = useCallback((val: boolean | ReducedMotionOption) => {
    const mode: ReducedMotionOption = typeof val === 'boolean' ? (val ? 'on' : 'off') : val;
    updatePreference('reducedMotion', mode);
    announce(`Reduced motion set to ${mode}.`);
  }, [updatePreference, announce]);

  const setAudioEnabled = useCallback((enabled: boolean) => {
    updatePreference('audioEnabled', enabled);
    announce(enabled ? 'Audio assistance enabled.' : 'Audio assistance disabled.');
  }, [updatePreference, announce]);

  const setScreenReaderOptimized = useCallback((enabled: boolean) => {
    updatePreference('screenReaderOptimized', enabled);
    announce(enabled ? 'Screen reader optimization mode enabled.' : 'Standard mode restored.');
  }, [updatePreference, announce]);

  const setKeyboardOnlyMode = useCallback((enabled: boolean) => {
    updatePreference('keyboardFirst', enabled);
    announce(enabled ? 'Keyboard-first navigation mode enabled.' : 'Standard navigation restored.');
  }, [updatePreference, announce]);

  const setPreferredLanguage = useCallback((language: string) => {
    updatePreference('language', language);
    announce(`Language changed to ${language === 'hi' ? 'Hindi' : 'English'}.`);
  }, [updatePreference, announce]);

  // 8. Synchronize Document Root Attributes for Global CSS Styling
  useEffect(() => {
    const root = document.documentElement;

    root.setAttribute('data-font-size', preferences.fontSize);
    root.setAttribute('data-contrast', preferences.contrast);
    root.setAttribute('data-theme', resolvedTheme);
    root.setAttribute('data-reduced-motion', preferences.reducedMotion);
    root.setAttribute('data-simplified', String(preferences.simplifiedInterface));
    root.setAttribute('data-keyboard-mode', String(preferences.keyboardFirst));
    root.setAttribute('lang', preferences.language);

    // High contrast class support for Tailwind variants
    if (preferences.contrast === 'high') {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
  }, [preferences, resolvedTheme]);

  return (
    <AccessibilityContext.Provider
      value={{
        preferences,
        isCalibrationOpen,
        openCalibration: () => setIsCalibrationOpen(true),
        closeCalibration: () => setIsCalibrationOpen(false),
        updatePreference,
        updatePreferences,
        resetPreferences,
        savePreferences,
        loadPreferences,
        isResetModalOpen,
        openResetModal,
        closeResetModal,
        confirmReset,
        speak,
        stopSpeaking,
        isSpeaking,
        isSpeechSupported,
        announce,
        currentAnnouncement,
        resolvedTheme,
        setFontSize,
        setHighContrast,
        setReducedMotion,
        setAudioEnabled,
        setScreenReaderOptimized,
        setKeyboardOnlyMode,
        setPreferredLanguage,
      }}
    >
      {children}

      {/* Screen Reader Global Live Region */}
      <div
        className="sr-only"
        role="status"
        aria-live={currentAnnouncement?.politeness || 'polite'}
        aria-atomic="true"
      >
        {currentAnnouncement?.message}
      </div>
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = (): AccessibilityContextType => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};
