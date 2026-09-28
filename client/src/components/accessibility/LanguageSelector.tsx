import React, { useState, useEffect } from 'react';
import { useAccessibility } from '../../hooks/useAccessibility';
import { useTranslation } from '../../i18n';
import { speechService } from '../../services/speechService';
import { Languages, Check, Globe, Volume2, Mic } from 'lucide-react';
import { Button } from '../common/Button';

export interface LanguageSelectorProps {
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ className = '' }) => {
  const { preferences, updatePreference, announce } = useAccessibility();
  const { t, language } = useTranslation();

  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isPlayingSample, setIsPlayingSample] = useState(false);

  // Discover and filter voices matching active language
  useEffect(() => {
    const updateVoices = () => {
      const filtered = speechService.getVoicesForLanguage(preferences.language || 'en');
      setAvailableVoices(filtered);
    };

    updateVoices();
    const unsubscribe = speechService.onVoicesChanged(() => {
      updateVoices();
    });

    return () => {
      unsubscribe();
    };
  }, [preferences.language]);

  const handleSelectLanguage = (code: string, nativeName: string) => {
    updatePreference('language', code);
    speechService.setLanguage(code);

    // Auto-select first matching voice for new language if available
    const newVoices = speechService.getVoicesForLanguage(code);
    if (newVoices.length > 0) {
      updatePreference('voiceURI', newVoices[0].voiceURI);
      speechService.setSelectedVoice(newVoices[0].voiceURI);
    } else {
      updatePreference('voiceURI', '');
      speechService.setSelectedVoice(null);
    }

    const announceMsg = code === 'hi'
      ? `भाषा बदलकर ${nativeName} कर दी गई है।`
      : `Language changed to ${nativeName}.`;
    announce(announceMsg);
  };

  const handleSelectVoice = (voiceURI: string) => {
    updatePreference('voiceURI', voiceURI);
    speechService.setSelectedVoice(voiceURI);
    const selectedVoiceObj = availableVoices.find((v) => v.voiceURI === voiceURI);
    if (selectedVoiceObj) {
      announce(`Selected synthesizer voice: ${selectedVoiceObj.name}`);
    }
  };

  const handleTestVoiceSample = () => {
    setIsPlayingSample(true);
    speechService.testVoiceSample(preferences.language || 'en', preferences.voiceURI);
    announce(t('accessibility.sampleUtterance'));
    setTimeout(() => {
      setIsPlayingSample(false);
    }, 2500);
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
      className={`flex flex-col gap-4 py-3 border-b border-border ${className}`}
    >
      <div className="flex items-center gap-2">
        <Languages className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
        <h3 id="language-selection-heading" className="text-sm font-bold text-foreground">
          {t('accessibility.chooseLanguage')}
        </h3>
      </div>
      <p className="text-xs text-foreground-secondary leading-relaxed">
        {t('accessibility.languageDesc')}
      </p>

      {/* Primary Supported Languages */}
      <fieldset className="border-0 p-0 m-0">
        <legend className="sr-only">{t('accessibility.chooseLanguage')}</legend>
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
                    <span>{t('languages.activeStatus')}</span>
                  </div>
                )}
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* Language-Aware Speech Synthesizer Voice Selector */}
      <div className="p-3.5 rounded-lg border border-border bg-surface-elevated/40 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
            <h4 className="text-xs font-bold text-foreground">
              {t('accessibility.speechVoices')} ({language === 'hi' ? 'हिन्दी' : 'English'})
            </h4>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleTestVoiceSample}
            disabled={isPlayingSample}
            icon={<Volume2 className={`w-3.5 h-3.5 text-primary ${isPlayingSample ? 'animate-pulse' : ''}`} />}
            aria-label={`${t('accessibility.testSampleSpeech')} (${language === 'hi' ? 'हिन्दी' : 'English'})`}
          >
            {isPlayingSample ? t('learning.audioPlaying') : t('accessibility.testSampleSpeech')}
          </Button>
        </div>

        {availableVoices.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="voice-synthesizer-select" className="text-[11px] font-medium text-foreground-muted">
              {t('accessibility.selectedVoice')}:
            </label>
            <select
              id="voice-synthesizer-select"
              value={preferences.voiceURI || (availableVoices[0]?.voiceURI ?? '')}
              onChange={(e) => handleSelectVoice(e.target.value)}
              className="w-full text-xs p-2 rounded-md border border-border bg-surface text-foreground focus:ring-2 focus:ring-primary focus:outline-none min-h-[44px]"
            >
              {availableVoices.map((voice) => (
                <option key={voice.voiceURI} value={voice.voiceURI}>
                  {voice.name} ({voice.lang}) {voice.default ? '— Default' : ''}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <p className="text-[11px] text-foreground-muted leading-relaxed">
            {language === 'hi'
              ? 'आपके सिस्टम पर डिफ़ॉल्ट वेब स्पीच सिंथेसाइज़र सक्रिय है। उच्च गुणवत्ता वाली हिन्दी आवाज़ों के लिए आप ऑपरेटिंग सिस्टम में हिन्दी भाषा पैक स्थापित कर सकते हैं।'
              : 'Standard system speech synthesizer is active. You can install enhanced language voices in your OS settings for human-quality audio.'}
          </p>
        )}
      </div>

      {/* Extensible Architecture for Future Regional Languages */}
      <div className="p-3.5 rounded-lg border border-border bg-surface-elevated/40 flex flex-col gap-2">
        <div className="flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-foreground-muted" aria-hidden="true" />
          <span className="text-xs font-semibold text-foreground-muted">
            {t('languages.expandingRegionalSupport')}
          </span>
        </div>
        <p className="text-[11px] text-foreground-muted leading-relaxed">
          {t('languages.expandingRegionalDesc')}
        </p>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {upcomingLanguages.map((lang) => (
            <span
              key={lang.code}
              className="text-[11px] px-2 py-0.5 rounded-full bg-surface border border-border text-foreground-muted select-none"
              title={`${lang.english} - ${t('languages.upcomingStatus')}`}
            >
              <strong className="font-medium text-foreground">{lang.native}</strong> ({lang.english})
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};
