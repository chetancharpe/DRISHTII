import { useAccessibility } from '../contexts/AccessibilityContext';
import { enCommon } from './en/common';
import { hiCommon } from './hi/common';

const dictionaries: Record<string, any> = {
  en: enCommon,
  hi: hiCommon,
};

/**
 * Lightweight, typed translation hook.
 * Separates UI language from Exam content language (Section 18).
 */
export function useTranslation() {
  const { preferences } = useAccessibility();
  const currentLang = preferences.language === 'hi' ? 'hi' : 'en';
  const dict = dictionaries[currentLang] || enCommon;

  function t(path: string, fallback?: string): string {
    const parts = path.split('.');
    let current = dict;
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        // Fallback to English
        let fallbackVal = enCommon;
        for (const fbPart of parts) {
          if (fallbackVal && typeof fallbackVal === 'object' && fbPart in fallbackVal) {
            fallbackVal = (fallbackVal as any)[fbPart];
          } else {
            return fallback || path;
          }
        }
        return typeof fallbackVal === 'string' ? fallbackVal : fallback || path;
      }
    }
    return typeof current === 'string' ? current : fallback || path;
  }

  return { t, language: currentLang };
}
