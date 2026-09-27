import React, { useState } from 'react';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import { accessibilityApi } from '../../services/api/accessibilityApi';

interface AccessibilityProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  isFirstTime?: boolean;
}

export const AccessibilityProfileModal: React.FC<AccessibilityProfileModalProps> = ({
  isOpen,
  onClose,
  isFirstTime = false,
}) => {
  const { preferences, updatePreferences, resetPreferences, speak } = useAccessibility();

  // Multi-select aid helpers for the first-time onboarding question:
  // "How do you prefer to access content?"
  const [selectedAids, setSelectedAids] = useState<string[]>(() => {
    const aids: string[] = [];
    if (preferences.screenReaderOptimized) aids.push('screen_reader');
    if (preferences.keyboardFirst) aids.push('keyboard');
    if (preferences.audioEnabled) aids.push('audio');
    if (preferences.fontSize !== 'default') aids.push('large_text');
    if (preferences.contrast !== 'standard') aids.push('high_contrast');
    if (preferences.simplifiedInterface) aids.push('simplified');
    return aids;
  });

  const [speechRate, setSpeechRate] = useState<string>(String(preferences.speechRate || 'normal'));
  const [timerAlerts, setTimerAlerts] = useState<string>(preferences.timerAnnouncements || 'warnings');

  // Keyboard handling: ESC to close dialog
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const toggleAid = (aidKey: string) => {
    setSelectedAids((prev) =>
      prev.includes(aidKey) ? prev.filter((a) => a !== aidKey) : [...prev, aidKey]
    );
  };

  const handleSave = async () => {
    const isScreenReader = selectedAids.includes('screen_reader');
    const isKeyboard = selectedAids.includes('keyboard');
    const isAudio = selectedAids.includes('audio');
    const isLargeText = selectedAids.includes('large_text');
    const isHighContrast = selectedAids.includes('high_contrast');
    const isSimplified = selectedAids.includes('simplified');

    const updates = {
      screenReaderOptimized: isScreenReader,
      keyboardFirst: isKeyboard,
      audioEnabled: isAudio,
      simplifiedInterface: isSimplified,
      fontSize: isLargeText ? 'large' : 'default',
      contrast: isHighContrast ? 'high' : 'standard',
      speechRate: speechRate as any,
      timerAnnouncements: timerAlerts as any,
    };

    updatePreferences(updates as any);

    // Sync with backend API
    await accessibilityApi.updateProfile({
      screen_reader_mode: isScreenReader,
      keyboard_navigation: isKeyboard,
      audio_assistance: isAudio,
      simplified_interface: isSimplified,
      text_scale: isLargeText ? 'large' : 'default',
      contrast_mode: isHighContrast ? 'high_contrast' : 'standard',
      speech_rate: speechRate === 'slow' ? 0.75 : speechRate === 'fast' ? 1.5 : 1.0,
      timer_announcement_mode: timerAlerts,
    });

    speak('Accessibility preferences saved successfully.');
    onClose();
  };

  const handleReset = async () => {
    resetPreferences();
    await accessibilityApi.resetProfile();
    speak('Accessibility preferences reset to platform defaults.');
    onClose();
  };

  const aidOptions = [
    {
      key: 'screen_reader',
      title: 'Screen Reader',
      description: 'Optimizes semantic headings, ARIA landmarks, and focus management for NVDA, JAWS, or TalkBack.',
      icon: '🎙️',
    },
    {
      key: 'keyboard',
      title: 'Keyboard-First',
      description: 'High-visibility focus outlines and shortcut keys for complete hands-on-keyboard navigation.',
      icon: '⌨️',
    },
    {
      key: 'audio',
      title: 'Audio Assistance',
      description: 'Built-in speech synthesis to listen to questions, options, and status updates on demand.',
      icon: '🔊',
    },
    {
      key: 'large_text',
      title: 'Large Text',
      description: 'Increases base typography sizing to 125% with comfortable letter spacing.',
      icon: '🔍',
    },
    {
      key: 'high_contrast',
      title: 'High Contrast',
      description: 'Deep black background with sharp amber and neon borders exceeding WCAG AAA standards.',
      icon: '🌓',
    },
    {
      key: 'simplified',
      title: 'Simplified Interface',
      description: 'Removes decorative banners and complex widgets, keeping only primary actions.',
      icon: '✨',
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
    >
      <div className="bg-slate-900 border-2 border-indigo-500/40 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl text-slate-100 focus:outline-none">
        {/* Header */}
        <div className="border-b border-slate-800 pb-4 mb-6">
          <span className="text-xs font-semibold tracking-wider text-indigo-400 uppercase">
            {isFirstTime ? 'Onboarding Setup' : 'Personalization'}
          </span>
          <h2 id="modal-title" className="text-2xl font-bold mt-1 text-white">
            Let's personalize your learning experience
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            How do you prefer to access content? Select what helps you use the platform.
            <span className="block mt-1 text-slate-500 text-xs">
              (We never require medical disability disclosures. You can adjust or reset these anytime.)
            </span>
          </p>
        </div>

        {/* Aid Options Grid */}
        <div className="space-y-3 mb-6" role="group" aria-label="Accessibility Assistance Options">
          {aidOptions.map((opt) => {
            const isSelected = selectedAids.includes(opt.key);
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => toggleAid(opt.key)}
                aria-pressed={isSelected}
                className={`w-full flex items-start gap-4 p-4 rounded-xl text-left border-2 transition-all ${
                  isSelected
                    ? 'border-indigo-400 bg-indigo-950/40 text-white'
                    : 'border-slate-800 bg-slate-800/40 text-slate-300 hover:border-slate-700'
                }`}
              >
                <span className="text-2xl mt-0.5" aria-hidden="true">
                  {opt.icon}
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-base">{opt.title}</span>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      {isSelected ? 'Enabled' : 'Off'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{opt.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Speech Rate & Timer Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700">
            <label htmlFor="speech-rate-select" className="block text-sm font-medium text-white mb-1">
              Speech Synthesis Speed
            </label>
            <p className="text-xs text-slate-400 mb-2">
              Default reading rate for audio assistance.
            </p>
            <select
              id="speech-rate-select"
              value={speechRate}
              onChange={(e) => setSpeechRate(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="slow">Slow (0.8x)</option>
              <option value="normal">Normal (1.0x)</option>
              <option value="fast">Fast (1.3x)</option>
            </select>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700">
            <label htmlFor="timer-announcements-select" className="block text-sm font-medium text-white mb-1">
              Timer Audio Alerts
            </label>
            <p className="text-xs text-slate-400 mb-2">
              Audible exam time announcements.
            </p>
            <select
              id="timer-announcements-select"
              value={timerAlerts}
              onChange={(e) => setTimerAlerts(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="warnings">Warnings Only (15m, 5m, 1m)</option>
              <option value="regular">Regular Intervals (10m)</option>
              <option value="off">Off (On-Demand Only)</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-slate-400 hover:text-slate-200 underline focus:ring-2 focus:ring-slate-400 px-2 py-1 rounded"
          >
            Reset to Platform Defaults
          </button>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {isFirstTime && (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-medium"
              >
                Skip for now
              </button>
            )}
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
