import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  AccessibilityPreferences,
  FontSizeOption,
  FontSizeScale,
  ContrastOption,
  ThemeOption,
  SpeechRateOption,
  ReducedMotionOption,
} from '../types/accessibility';
import { accessibilityApi } from '../services/api/accessibilityApi';
import { translateToHindi } from '../services/translator';
import { speechService } from '../services/speechService';

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
  speak: (text: string, onEnd?: () => void) => void;
  stopSpeaking: () => void;
  isSpeaking: boolean;
  isSpeechSupported: boolean;
  hasHindiVoice: boolean;

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
  speechRateMultiplier: 1.0,
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
  voiceURI: '',

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

  // Map speech rate and granular multiplier (0.5x to 3.0x)
  let speechRateMultiplier = typeof raw.speechRateMultiplier === 'number'
    ? Math.min(3.0, Math.max(0.5, raw.speechRateMultiplier))
    : raw.speechRate === 'slow'
    ? 0.8
    : raw.speechRate === 'fast'
    ? 1.3
    : 1.0;

  let speechRate: SpeechRateOption = raw.speechRate || (
    speechRateMultiplier <= 0.85 ? 'slow' : speechRateMultiplier >= 1.25 ? 'fast' : 'normal'
  );

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
    speechRateMultiplier,
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

  const location = useLocation();
  const storedUser = typeof window !== 'undefined' ? localStorage.getItem('drishti_current_user') : null;
  const userRole = storedUser ? (() => { try { return JSON.parse(storedUser)?.role; } catch { return null; } })() : null;
  const isExaminerOrAdmin =
    location.pathname.startsWith('/examiner') ||
    location.pathname.startsWith('/admin') ||
    userRole === 'examiner' ||
    userRole === 'admin';

  const [isCalibrationOpen, setIsCalibrationOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentAnnouncement, setCurrentAnnouncement] = useState<AnnouncementItem | null>(null);
  const announcementTimeoutRef = useRef<number | null>(null);

  const isSpeechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Immediately cancel any speech synthesis when navigating to examiner or admin areas
  useEffect(() => {
    if (isExaminerOrAdmin && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, [isExaminerOrAdmin]);

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

  // 3. Screen Reader Announcement Service - Scoped to Candidate Portal
  const announce = useCallback((message: string, politeness: 'polite' | 'assertive' = 'polite') => {
    if (isExaminerOrAdmin) return;
    if (announcementTimeoutRef.current) {
      window.clearTimeout(announcementTimeoutRef.current);
    }
    setCurrentAnnouncement({ id: Date.now(), message, politeness });
    announcementTimeoutRef.current = window.setTimeout(() => {
      setCurrentAnnouncement(null);
    }, 4000);
  }, [isExaminerOrAdmin]);

  // 4. Speech Synthesis Service - Scoped to Candidate Portal
  const speakTimeoutRef = useRef<number | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      return window.speechSynthesis.getVoices();
    }
    return [];
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const handleVoicesChanged = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length > 0) {
        setAvailableVoices(v);
      }
    };
    handleVoicesChanged();
    window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
    };
  }, []);

  const hasHindiVoice = availableVoices.some(
    (v) =>
      v.lang.toLowerCase().startsWith('hi') ||
      v.name.toLowerCase().includes('hindi') ||
      v.name.toLowerCase().includes('kalpana') ||
      v.name.toLowerCase().includes('hemant')
  );

  const stopSpeaking = useCallback(() => {
    if (speakTimeoutRef.current) {
      window.clearTimeout(speakTimeoutRef.current);
      speakTimeoutRef.current = null;
    }
    if (isSpeechSupported) {
      window.speechSynthesis.cancel();
      (window as any).__drishti_active_utterance = null;
      setIsSpeaking(false);
    }
  }, [isSpeechSupported]);

  const speak = useCallback(
    (text: string, onEnd?: () => void) => {
      if (isExaminerOrAdmin) return;
      if (!isSpeechSupported || !text.trim()) {
        onEnd?.();
        return;
      }

      if (speakTimeoutRef.current) {
        window.clearTimeout(speakTimeoutRef.current);
        speakTimeoutRef.current = null;
      }

      window.speechSynthesis.cancel();

      let textToSpeak = text;
      const isHindiText = /[\u0900-\u097F]/.test(text);

      const voices = availableVoices.length > 0
        ? availableVoices
        : (typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis.getVoices() : []);

      const hindiVoice = voices.find((v) =>
        v.lang.toLowerCase().startsWith('hi') ||
        v.name.toLowerCase().includes('hindi') ||
        v.name.toLowerCase().includes('kalpana') ||
        v.name.toLowerCase().includes('hemant')
      );

      // Only translate English text to Devanagari Hindi IF the user's OS has an actual Hindi TTS voice!
      // If the OS only has English voices (e.g. David/Zira), Devanagari will be skipped resulting in silence!
      if (preferences.language === 'hi' && hindiVoice && !isHindiText) {
        textToSpeak = translateToHindi(text);
      }

      const utterance = new SpeechSynthesisUtterance(textToSpeak);

      // Voice selection
      if (preferences.voiceURI) {
        const matchingVoice = voices.find((v) => v.voiceURI === preferences.voiceURI);
        if (matchingVoice) utterance.voice = matchingVoice;
      }

      if (!utterance.voice && voices.length > 0) {
        if (hindiVoice && (preferences.language === 'hi' || isHindiText)) {
          utterance.voice = hindiVoice;
          utterance.lang = 'hi-IN';
        } else {
          const indianVoice = voices.find((v) =>
            v.lang.toLowerCase().includes('en-in') ||
            v.name.toLowerCase().includes('india') ||
            v.name.toLowerCase().includes('heera') ||
            v.name.toLowerCase().includes('ravi') ||
            v.name.toLowerCase().includes('neerja')
          );
          const englishVoice =
            indianVoice ||
            voices.find((v) => v.lang.toLowerCase().startsWith('en')) ||
            voices[0];
          if (englishVoice) {
            utterance.voice = englishVoice;
            utterance.lang = englishVoice.lang || 'en-US';
          }
        }
      }

      // Pitch & rate
      utterance.pitch = 1.0;
      const targetRate = preferences.speechRateMultiplier ?? (
        preferences.speechRate === 'slow' ? 0.8 :
        preferences.speechRate === 'fast' ? 1.25 : 1.0
      );
      utterance.rate = Math.min(2.0, Math.max(0.7, targetRate));

      // Maintain active reference on window to prevent Chromium garbage collection bug
      (window as any).__drishti_active_utterance = utterance;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        (window as any).__drishti_active_utterance = null;
        setIsSpeaking(false);
        onEnd?.();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('drishti:speech-end'));
        }
      };
      utterance.onerror = (e: any) => {
        console.warn('Speech synthesis notice:', e?.error);
        (window as any).__drishti_active_utterance = null;
        setIsSpeaking(false);
        onEnd?.();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('drishti:speech-end'));
        }
      };

      // 40ms tick to allow Chromium speech engine cancel IPC to settle before speaking
      speakTimeoutRef.current = window.setTimeout(() => {
        try {
          if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
          }
          window.speechSynthesis.speak(utterance);
        } catch (err) {
          console.warn('speechSynthesis.speak error:', err);
        }
      }, 40);
    },
    [isExaminerOrAdmin, isSpeechSupported, availableVoices, preferences.language, preferences.speechRate, preferences.speechRateMultiplier, preferences.voiceURI]
  );

  // Sync with backend profile on mount/authentication
  useEffect(() => {
    let isMounted = true;
    async function syncBackendProfile() {
      try {
        const backendProfile = await accessibilityApi.getProfile();
        if (backendProfile && isMounted) {
          setPreferences((prev) => {
            const merged = normalizePreferences({
              ...prev,
              fontSize: (backendProfile.text_scale as any) || prev.fontSize,
              contrast: (backendProfile.contrast_mode as any) || prev.contrast,
              theme: (backendProfile.theme as any) || prev.theme,
              reducedMotion: backendProfile.reduced_motion ? 'on' : 'system',
              simplifiedInterface: backendProfile.simplified_interface,
              screenReaderOptimized: backendProfile.screen_reader_mode,
              keyboardFirst: backendProfile.keyboard_navigation,
              audioEnabled: backendProfile.audio_assistance,
              language: backendProfile.preferred_language || prev.language,
              timerAnnouncements: (backendProfile.timer_announcement_mode as any) || prev.timerAnnouncements,
            });
            persist(merged);
            return merged;
          });
        }
      } catch {
        // Offline mode: localStorage preferences remain active
      }
    }
    syncBackendProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  // 5. Preference Updating & Persistence
  const persist = (next: AccessibilityPreferences) => {
    try {
      localStorage.setItem(ACCESSIBILITY_STORAGE_KEY, JSON.stringify(next));
      // Keep legacy in sync for safety
      localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(next));
      // Asynchronously sync with backend if online
      const textScale = next.fontSize === 'extra-large' ? 'x-large' : (next.fontSize as any);
      const contrastMode = next.contrast === 'high' ? 'high_contrast' : 'standard';
      accessibilityApi.updateProfile({
        text_scale: textScale,
        contrast_mode: contrastMode,
        theme: next.theme,
        reduced_motion: next.reducedMotion === 'on',
        simplified_interface: next.simplifiedInterface,
        screen_reader_mode: next.screenReaderOptimized,
        keyboard_navigation: next.keyboardFirst,
        audio_assistance: next.audioEnabled,
        preferred_language: next.language,
        timer_announcement_mode: next.timerAnnouncements,
      }).catch(() => {
        // Safe offline fallback
      });
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
    speechService.setLanguage(language);
    const msg = language === 'hi'
      ? 'भाषा बदलकर हिन्दी कर दी गई है। स्क्रीन और आवाज़ अब हिन्दी में हैं।'
      : 'Language changed to English. Screen and voice are now in English.';
    announce(msg);
    speak(msg);
  }, [updatePreference, announce, speak]);

  // 8. Synchronize Document Root Attributes for Global CSS Styling & Accessibility
  // Visually impaired accessibility modes (high contrast, extra-large fonts, simplified interface)
  // are strictly scoped to Candidate portal routes and public portal. Examiner & Admin workspaces retain standard UI.
  useEffect(() => {
    const root = document.documentElement;

    if (isExaminerOrAdmin) {
      // Clean, standard desktop UI for Examiner and Admin portals
      root.setAttribute('data-font-size', 'default');
      root.setAttribute('data-contrast', 'standard');
      root.setAttribute(
        'data-theme',
        preferences.theme === 'system'
          ? systemDark
            ? 'dark'
            : 'light'
          : preferences.theme
      );
      root.setAttribute('data-reduced-motion', preferences.reducedMotion);
      root.setAttribute('data-simplified', 'false');
      root.setAttribute('data-keyboard-mode', 'false');
      root.setAttribute('lang', preferences.language || 'en');
      root.setAttribute('dir', 'ltr');
      root.classList.remove('high-contrast');
    } else {
      // Candidate and accessible public portal
      root.setAttribute('data-font-size', preferences.fontSize);
      root.setAttribute('data-contrast', preferences.contrast);
      root.setAttribute('data-theme', resolvedTheme);
      root.setAttribute('data-reduced-motion', preferences.reducedMotion);
      root.setAttribute('data-simplified', String(preferences.simplifiedInterface));
      root.setAttribute('data-keyboard-mode', String(preferences.keyboardFirst));
      root.setAttribute('lang', preferences.language || 'en');
      root.setAttribute('dir', 'ltr');

      if (preferences.contrast === 'high') {
        root.classList.add('high-contrast');
      } else {
        root.classList.remove('high-contrast');
      }
    }
  }, [preferences, resolvedTheme, isExaminerOrAdmin, systemDark]);

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
        hasHindiVoice,
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
