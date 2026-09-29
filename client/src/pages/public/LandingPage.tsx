import React, { useState, useEffect } from 'react';
import { useAccessibility } from '../../hooks/useAccessibility';
import {
  HeroSection,
  TrustStrip,
  ProblemSection,
  AccessibilityFeaturesSection,
  HowItWorksSection,
  CandidateExperienceSection,
  ExaminerSection,
  IndependenceSection,
  AccessibilityCommitmentSection,
  FinalCTASection,
} from '../../components/landing';
import { AudioGuidedOnboardingModal } from '../../components/accessibility/AudioGuidedOnboardingModal';
import { Volume2, Radio } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { openCalibration, speak, announce } = useAccessibility();
  const [isAudioOnboardingOpen, setIsAudioOnboardingOpen] = useState(false);

  // Global Key Listener for First-Run Voice Setup (Enter / H / Alt+O)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not trigger if user is typing in form controls or if onboarding is already open
      const target = e.target as HTMLElement;
      if (
        isAudioOnboardingOpen ||
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === 'Enter') {
        // If focus is not on an interactive link/button, open audio onboarding
        if (target.tagName !== 'BUTTON' && target.tagName !== 'A') {
          e.preventDefault();
          setIsAudioOnboardingOpen(true);
        }
      } else if (e.key.toLowerCase() === 'h') {
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          speak('Welcome to Drishti. Press Enter to start audio setup, or click the Start Audio Setup button.');
          announce('Welcome to Drishti. Press Enter to start audio setup, or press H for help.');
        }
      } else if (e.altKey && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        setIsAudioOnboardingOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAudioOnboardingOpen, speak, announce]);

  return (
    <div className="flex flex-col w-full text-foreground">
      {/* 0. Top Audio Guided Onboarding Invitation Banner */}
      <div
        role="region"
        aria-label="Audio setup invitation"
        className="w-full bg-gradient-to-r from-primary/20 via-blue-500/15 to-indigo-500/20 border-b border-primary/30 px-4 py-2.5 shadow-xs"
      >
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="p-1 rounded-lg bg-primary text-primary-contrast flex items-center justify-center animate-pulse">
              <Radio className="w-3.5 h-3.5" aria-hidden="true" />
            </span>
            <span className="font-bold text-foreground">
              Welcome to Drishti. Press <kbd className="px-1.5 py-0.5 rounded bg-surface border font-mono font-bold text-primary">Enter</kbd> to start audio setup, or press <kbd className="px-1.5 py-0.5 rounded bg-surface border font-mono font-bold text-foreground">H</kbd> for spoken help.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAudioOnboardingOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-hover active:bg-primary-hover text-primary-contrast font-bold text-xs shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
            >
              <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Start Audio Setup</span>
              <kbd className="hidden sm:inline px-1 py-0.2 rounded bg-primary-contrast/20 text-[10px] font-mono">
                Enter
              </kbd>
            </button>
          </div>
        </div>
      </div>

      {/* 1. Hero Section */}
      <HeroSection
        onOpenAccessibility={openCalibration}
        onOpenAudioOnboarding={() => setIsAudioOnboardingOpen(true)}
      />

      {/* 2. Trust / Value Strip */}
      <TrustStrip />

      {/* 3. Problem Section */}
      <ProblemSection />

      {/* 4. Accessibility Features Section */}
      <AccessibilityFeaturesSection />

      {/* 5. How It Works Section (5-Step Journey) */}
      <HowItWorksSection />

      {/* 6. Candidate Experience Section */}
      <CandidateExperienceSection />

      {/* 7. Examiner & Institution Section */}
      <ExaminerSection />

      {/* 10. Independence & Lifecycle Section */}
      <IndependenceSection />

      {/* 11. Accessibility Commitment & Philosophy */}
      <AccessibilityCommitmentSection />

      {/* 12. Final Call-to-Action */}
      <FinalCTASection onOpenAccessibility={openCalibration} />

      {/* Audio Guided Onboarding Modal */}
      <AudioGuidedOnboardingModal
        isOpen={isAudioOnboardingOpen}
        onClose={() => setIsAudioOnboardingOpen(false)}
      />
    </div>
  );
};
