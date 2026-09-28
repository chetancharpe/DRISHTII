import { useAccessibility } from '../contexts/AccessibilityContext';
import { enCommon, TranslationDictionary } from './en/common';
import { hiCommon } from './hi/common';

export { enCommon, hiCommon };
export type { TranslationDictionary };

export const dictionaries: Record<string, TranslationDictionary> = {
  en: enCommon,
  hi: hiCommon,
};

export type TranslationPath = string;

/**
 * Resolves a nested dot path in a translation dictionary.
 */
export function resolveTranslationPath(dict: Record<string, any>, path: string): string | null {
  const parts = path.split('.');
  let current: any = dict;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return null;
    }
  }
  return typeof current === 'string' ? current : null;
}

/**
 * Standalone translation getter for outside-React contexts.
 */
export function getTranslation(language: string, path: string, fallback?: string): string {
  const currentLang = language === 'hi' ? 'hi' : 'en';
  const dict = dictionaries[currentLang] || enCommon;
  const resolved = resolveTranslationPath(dict, path);
  if (resolved !== null) return resolved;
  const englishFallback = resolveTranslationPath(enCommon, path);
  return englishFallback !== null ? englishFallback : fallback || path;
}

/**
 * Lightweight, typed translation hook.
 * Separates UI language from Exam content language (Section 18).
 */
export function useTranslation() {
  const { preferences, updatePreference, announce } = useAccessibility();
  const currentLang = preferences.language === 'hi' ? 'hi' : 'en';
  const dict = dictionaries[currentLang] || enCommon;

  function t(path: TranslationPath, fallback?: string): string {
    const resolved = resolveTranslationPath(dict, path);
    if (resolved !== null) return resolved;

    // Fallback to English
    const englishVal = resolveTranslationPath(enCommon, path);
    if (englishVal !== null) return englishVal;

    return fallback || path;
  }

  function setLanguage(lang: 'en' | 'hi') {
    updatePreference('language', lang);
    const msg = lang === 'hi' ? dict.accessibility.languageChangedAnnounce : enCommon.accessibility.languageChangedAnnounce;
    announce(msg);
  }

  return {
    t,
    language: currentLang,
    dict,
    setLanguage,
  };
}
