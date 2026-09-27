import React, { useState } from 'react';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import { AccessibilityProfileModal } from './AccessibilityProfileModal';

export const AccessibilityQuickBar: React.FC = () => {
  const { preferences, updatePreferences, speak } = useAccessibility();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Toggle Font Size Cycle: default -> large -> x-large -> default
  const cycleFontSize = () => {
    const nextSize =
      preferences.fontSize === 'default'
        ? 'large'
        : preferences.fontSize === 'large'
        ? 'extra-large'
        : 'default';
    updatePreferences({ fontSize: nextSize });
    speak(`Text size set to ${nextSize}`);
  };

  // Toggle Contrast Cycle: standard -> high -> standard
  const cycleContrast = () => {
    const nextContrast = preferences.contrast === 'standard' ? 'high' : 'standard';
    updatePreferences({ contrast: nextContrast });
    speak(`Contrast set to ${nextContrast}`);
  };

  // Toggle Audio
  const toggleAudio = () => {
    const nextVal = !preferences.audioEnabled;
    updatePreferences({ audioEnabled: nextVal });
    speak(nextVal ? 'Audio assistance enabled.' : 'Audio assistance disabled.');
  };

  // Toggle Theme
  const toggleTheme = () => {
    const nextTheme = preferences.theme === 'dark' ? 'light' : 'dark';
    updatePreferences({ theme: nextTheme });
    speak(`Theme set to ${nextTheme} mode.`);
  };

  // Toggle Reduced Motion: system -> on -> off -> system
  const toggleMotion = () => {
    const nextVal = preferences.reducedMotion === 'on' ? 'off' : 'on';
    updatePreferences({ reducedMotion: nextVal });
    speak(`Reduced motion ${nextVal === 'on' ? 'enabled' : 'disabled'}.`);
  };

  return (
    <>
      <nav
        aria-label="Quick Accessibility Controls"
        className="fixed bottom-4 right-4 z-40 flex items-center gap-1.5 p-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 backdrop-blur-md shadow-xl text-slate-200 text-xs transition-opacity hover:opacity-100 focus-within:opacity-100"
      >
        {/* Text Size */}
        <button
          type="button"
          onClick={cycleFontSize}
          title={`Text Size: ${preferences.fontSize}. Press to toggle larger text.`}
          aria-label={`Cycle text size. Currently ${preferences.fontSize}.`}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-full hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 font-semibold"
        >
          <span aria-hidden="true">A</span>
          <span className="font-bold text-sm" aria-hidden="true">
            A
          </span>
          <span className="sr-only">Change Text Scale</span>
        </button>

        <span className="w-px h-4 bg-slate-700" aria-hidden="true" />

        {/* Contrast */}
        <button
          type="button"
          onClick={cycleContrast}
          title={`Contrast: ${preferences.contrast}. Press to toggle high contrast.`}
          aria-label={`Cycle contrast mode. Currently ${preferences.contrast}.`}
          className="p-1.5 rounded-full hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <span aria-hidden="true" className="text-sm">
            🌓
          </span>
          <span className="sr-only">Toggle Contrast</span>
        </button>

        {/* Audio Assistance */}
        <button
          type="button"
          onClick={toggleAudio}
          title={`Audio Assistance: ${preferences.audioEnabled ? 'On' : 'Off'}.`}
          aria-label={`Toggle audio assistance. Currently ${preferences.audioEnabled ? 'enabled' : 'disabled'}.`}
          aria-pressed={preferences.audioEnabled}
          className={`p-1.5 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
            preferences.audioEnabled ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300'
          }`}
        >
          <span aria-hidden="true" className="text-sm">
            {preferences.audioEnabled ? '🔊' : '🔇'}
          </span>
          <span className="sr-only">Toggle Audio</span>
        </button>

        {/* Dark/Light Theme */}
        <button
          type="button"
          onClick={toggleTheme}
          title={`Theme: ${preferences.theme}. Press to toggle.`}
          aria-label={`Toggle theme. Currently ${preferences.theme}.`}
          className="p-1.5 rounded-full hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <span aria-hidden="true" className="text-sm">
            {preferences.theme === 'dark' ? '🌙' : '☀️'}
          </span>
          <span className="sr-only">Toggle Theme</span>
        </button>

        {/* Reduced Motion */}
        <button
          type="button"
          onClick={toggleMotion}
          title={`Reduced Motion: ${preferences.reducedMotion}. Press to toggle.`}
          aria-label={`Toggle reduced motion. Currently ${preferences.reducedMotion}.`}
          className="p-1.5 rounded-full hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <span aria-hidden="true" className="text-sm">
            🎬
          </span>
          <span className="sr-only">Toggle Reduced Motion</span>
        </button>

        <span className="w-px h-4 bg-slate-700" aria-hidden="true" />

        {/* Settings Full Modal */}
        <button
          type="button"
          onClick={() => setIsProfileModalOpen(true)}
          title="Open Full Accessibility Settings"
          aria-label="Open Full Accessibility Settings Modal"
          className="px-2.5 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          ⚙️ <span className="hidden sm:inline">Settings</span>
        </button>
      </nav>

      <AccessibilityProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </>
  );
};
