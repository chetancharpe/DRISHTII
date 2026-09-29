import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useAccessibility } from '../../hooks/useAccessibility';
import { AccessibilityWizard } from '../../components/accessibility/AccessibilityWizard';
import { AudioGuidedOnboardingModal } from '../../components/accessibility/AudioGuidedOnboardingModal';
import { Volume2, Radio } from 'lucide-react';

export const AccessibilitySetupPage: React.FC = () => {
  const { role } = useAuth();
  const { speak, announce } = useAccessibility();
  const navigate = useNavigate();
  const [isAudioOnboardingOpen, setIsAudioOnboardingOpen] = useState(false);

  const handleFinish = () => {
    if (role === 'examiner') {
      navigate('/examiner/dashboard');
    } else {
      navigate('/candidate/dashboard');
    }
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        isAudioOnboardingOpen ||
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT'
      ) {
        return;
      }

      if (e.key === 'Enter' && target.tagName !== 'BUTTON' && target.tagName !== 'A') {
        e.preventDefault();
        setIsAudioOnboardingOpen(true);
      } else if (e.key.toLowerCase() === 'h') {
        e.preventDefault();
        speak('Welcome to Drishti Accessibility Setup. Press Enter to start hands-free audio onboarding, or Tab to configure visual options.');
        announce('Welcome to Drishti Accessibility Setup. Press Enter for audio onboarding.');
      } else if (e.altKey && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        setIsAudioOnboardingOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAudioOnboardingOpen, speak, announce]);

  return (
    <main
      id="accessibility-setup-page"
      className="min-h-screen bg-background text-foreground py-8 px-4 sm:px-6 lg:px-8 flex flex-col justify-start"
    >
      {/* WCAG Skip Navigation Link */}
      <a href="#accessibility-wizard-main" className="skip-link">
        Skip to accessibility configuration options
      </a>

      {/* Voice Onboarding Hero Prompt */}
      <div className="w-full max-w-4xl mx-auto mb-6">
        <div className="p-5 rounded-3xl bg-gradient-to-r from-primary/20 via-blue-500/10 to-indigo-500/15 border-2 border-primary/30 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-primary text-primary-contrast shadow-md flex items-center justify-center animate-pulse">
              <Radio className="w-6 h-6" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest font-extrabold text-primary px-2 py-0.5 rounded-full bg-primary/20 border border-primary/30">
                  Recommended for Blind & Low-Vision Users
                </span>
              </div>
              <h2 className="text-base font-black text-foreground mt-0.5">
                Guided Audio Setup (Hands-Free Voice Assistant)
              </h2>
              <p className="text-xs text-foreground-secondary mt-0.5">
                Press <kbd className="px-1.5 py-0.5 rounded bg-surface border font-mono font-bold text-primary">Enter</kbd> to listen to audio prompts and configure using keys 1-2-3.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsAudioOnboardingOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary hover:bg-primary-hover active:bg-primary-hover text-primary-contrast font-bold text-xs shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[44px] transition-all flex-shrink-0"
          >
            <Volume2 className="w-4 h-4" aria-hidden="true" />
            <span>Start Voice Setup</span>
            <kbd className="px-1.5 py-0.5 rounded bg-primary-contrast/20 text-[10px] font-mono">
              Enter
            </kbd>
          </button>
        </div>
      </div>

      {/* Main Accessible Container */}
      <div id="accessibility-wizard-main" tabIndex={-1} className="w-full focus:outline-none">
        <AccessibilityWizard onComplete={handleFinish} />
      </div>

      {/* Audio Guided Onboarding Modal */}
      <AudioGuidedOnboardingModal
        isOpen={isAudioOnboardingOpen}
        onClose={() => setIsAudioOnboardingOpen(false)}
        onComplete={handleFinish}
      />
    </main>
  );
};
