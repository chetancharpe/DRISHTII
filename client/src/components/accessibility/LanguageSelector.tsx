import React from 'react';
import { useAccessibility } from '../../hooks/useAccessibility';
import { Languages, Check, Globe } from 'lucide-react';

export interface LanguageSelectorProps {
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ className = '' }) => {
  const { preferences, updatePreference, announce } = useAccessibility();

  const handleSelectLanguage = (code: string, nativeName: string) => {
    updatePreference('language', code);
    announce(`Language selected: ${nativeName}`);
  };

  const activeLanguages = [
    { code: 'en', native: 'English', english: 'English', script: 'Latin' },
    { code: 'hi', native: 'हिन्दी', english: 'Hindi', script: 'Devanagari' },
  ];

  const upcomingLanguages = [
    { code: 'mr', native: 'मराठी', english: 'Marathi' },
    { code: 'bn', native: 'বাংলা', english: 'Bengali' },
    { code: 'ta', native: 'தமிழ்', english: 'Tamil' },
    { code: 'te', native: 'తెలుగు', english: 'Telugu' },
    { code: 'gu', native: 'ગુજરાતી', english: 'Gujarati' },
    { code: 'kn', native: 'ಕನ್ನಡ', english: 'Kannada' },
    { code: 'ml', native: 'മലയാളം', english: 'Malayalam' },
    { code: 'pa', native: 'ਪੰਜਾਬੀ', english: 'Punjabi' },
  ];

  return (
    <section
      aria-labelledby="language-selection-heading"
      className={`flex flex-col gap-3 py-3 border-b border-border ${className}`}
    >
      <div className="flex items-center gap-2">
        <Languages className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
        <h3 id="language-selection-heading" className="text-sm font-bold text-foreground">
          Choose Your Language
        </h3>
      </div>
      <p className="text-xs text-foreground-secondary leading-relaxed">
        Select your preferred language for questions, options, and system prompts. GoWow avoids country flags as the sole indicator and renders each language in its native script.
      </p>

      {/* Primary Supported Languages */}
      <fieldset className="border-0 p-0 m-0">
        <legend className="sr-only">Available primary interface languages</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1" role="radiogroup">
          {activeLanguages.map((lang) => {
            const isSelected = preferences.language === lang.code;
            const inputId = `lang-opt-${lang.code}`;

            return (
              <label
                key={lang.code}
                htmlFor={inputId}
                className={`
                  relative flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer
                  transition-all select-none min-h-[64px]
                  ${
                    isSelected
                      ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary'
                      : 'border-border bg-surface hover:bg-surface-elevated hover:border-border-strong'
                  }
                `.trim()}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    id={inputId}
                    name="language-selection-group"
                    value={lang.code}
                    checked={isSelected}
                    onChange={() => handleSelectLanguage(lang.code, lang.native)}
                    className="sr-only"
                  />
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      isSelected ? 'border-primary bg-primary' : 'border-border-strong bg-surface'
                    }`}
                    aria-hidden="true"
                  >
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-base font-bold text-foreground" lang={lang.code}>
                      {lang.native}
                    </span>
                    <span className="text-xs text-foreground-muted">
                      {lang.english} • {lang.script} script
                    </span>
                  </div>
                </div>

                {isSelected && (
                  <div className="flex items-center gap-1 text-xs font-semibold text-primary">
                    <Check className="w-4 h-4" aria-hidden="true" />
                    <span>Active</span>
                  </div>
                )}
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* Extensible Architecture for Future Languages */}
      <div className="mt-3 p-3.5 rounded-lg border border-border bg-surface-elevated/40 flex flex-col gap-2">
        <div className="flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-foreground-muted" aria-hidden="true" />
          <span className="text-xs font-semibold text-foreground-muted">
            Expanding Regional Language Support:
          </span>
        </div>
        <p className="text-[11px] text-foreground-muted leading-relaxed">
          GoWow's localization engine is designed to support 10+ Indian official languages. Additional translations are currently in preparation:
        </p>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {upcomingLanguages.map((lang) => (
            <span
              key={lang.code}
              className="text-[11px] px-2 py-0.5 rounded-full bg-surface border border-border text-foreground-muted select-none"
              title={`${lang.english} - In Preparation`}
            >
              <strong className="font-medium text-foreground">{lang.native}</strong> ({lang.english})
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};
