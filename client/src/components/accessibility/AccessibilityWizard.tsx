import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccessibility } from '../../hooks/useAccessibility';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../common/Button';
import { AccessibilityStep } from './AccessibilityStep';
import { FontSizeControl } from './FontSizeControl';
import { ContrastControl } from './ContrastControl';
import { ThemeToggle } from './ThemeToggle';
import { KeyboardNavigationTest } from './KeyboardNavigationTest';
import { AudioControl } from './AudioControl';
import { LanguageSelector } from './LanguageSelector';
import { ReducedMotionControl } from './ReducedMotionControl';
import { AccessibilityPreview } from './AccessibilityPreview';
import { AccessibilitySummary } from './AccessibilitySummary';
import { ResetSettingsModal } from './ResetSettingsModal';
import {
  Sparkles,
  Sliders,
  RotateCcw,
  CheckCircle2,
  Navigation,
  Keyboard,
  ArrowRight,
} from 'lucide-react';

export interface AccessibilityWizardProps {
  onComplete?: () => void;
  className?: string;
}

export const AccessibilityWizard: React.FC<AccessibilityWizardProps> = ({
  onComplete,
  className = '',
}) => {
  const {
    preferences,
    updatePreference,
    savePreferences,
    resetPreferences,
    isResetModalOpen,
    closeResetModal,
    confirmReset,
    announce,
  } = useAccessibility();

  const { role } = useAuth();
  const navigate = useNavigate();

  // Wizard state: 1 to 7
  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = 7;

  // Step metadata
  const stepTitles = [
    'Welcome',
    'Text & Display',
    'Navigation & Motion',
    'Audio Assistance',
    'Language',
    'Preview & Test',
    'Setup Complete',
  ];

  const handleStepChange = (nextStep: number) => {
    setCurrentStep(nextStep);
    announce(`You are on step ${nextStep} of ${totalSteps}: ${stepTitles[nextStep - 1]}`);
    window.scrollTo({ top: 0, behavior: preferences.reducedMotion === 'on' ? 'auto' : 'smooth' });
  };

  const handleSkip = () => {
    savePreferences();
    announce('Setup skipped. Using current accessibility preferences.');
    redirectToDashboard();
  };

  const handleFinish = () => {
    savePreferences();
    if (onComplete) {
      onComplete();
    } else {
      redirectToDashboard();
    }
  };

  const redirectToDashboard = () => {
    if (role === 'examiner') {
      navigate('/examiner/dashboard');
    } else {
      navigate('/candidate/dashboard');
    }
  };

  return (
    <div className={`w-full max-w-4xl mx-auto flex flex-col gap-6 ${className}`}>
      {/* Wizard Header Bar with Quick Reset and Steps Progress */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        {/* Visual & Accessible Step Counter */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-primary">
            Step {currentStep} of {totalSteps}
          </span>
          <span className="text-sm font-bold text-foreground hidden sm:inline">
            — {stepTitles[currentStep - 1]}
          </span>
        </div>

        {/* Global Reset Settings Button */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={resetPreferences}
          icon={<RotateCcw className="w-3.5 h-3.5 text-foreground-muted" aria-hidden="true" />}
          aria-label="Reset all accessibility preferences to factory defaults"
        >
          Reset Settings
        </Button>
      </div>

      {/* STEP 1: WELCOME */}
      {currentStep === 1 && (
        <AccessibilityStep
          stepNumber={1}
          totalSteps={totalSteps}
          title="Set Up GoWow for You"
          description="Choose the settings that make learning and examinations easier for you. You can change these preferences anytime."
          onNext={() => handleStepChange(2)}
          onSkip={handleSkip}
          nextLabel="Start Setup"
        >
          <div className="flex flex-col gap-6 py-2">
            <div className="p-5 rounded-xl border border-primary/30 bg-primary/5 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
                <h3 className="text-base font-bold text-foreground">
                  Designed for Complete Independence
                </h3>
              </div>
              <p className="text-sm text-foreground-secondary leading-relaxed">
                GoWow is built from the ground up for visually impaired and low-vision candidates. These settings personalize your interface with tailored font sizes, high-contrast themes, keyboard controls, and acoustic assistance.
              </p>
              <p className="text-xs text-foreground-muted">
                These settings personalize your experience. GoWow remains fully accessible even if you skip optional settings.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-lg border border-border bg-surface flex flex-col gap-1.5">
                <span className="text-xs font-bold text-primary">1. Visual Ergonomics</span>
                <p className="text-xs text-foreground-muted">Fluid text magnification and WCAG AAA high contrast themes.</p>
              </div>
              <div className="p-4 rounded-lg border border-border bg-surface flex flex-col gap-1.5">
                <span className="text-xs font-bold text-primary">2. Native Navigation</span>
                <p className="text-xs text-foreground-muted">Seamless keyboard-first hotkeys and native screen reader compatibility.</p>
              </div>
              <div className="p-4 rounded-lg border border-border bg-surface flex flex-col gap-1.5">
                <span className="text-xs font-bold text-primary">3. Voice Assistance</span>
                <p className="text-xs text-foreground-muted">Optional read-aloud support for questions, instructions, and timers.</p>
              </div>
            </div>
          </div>
        </AccessibilityStep>
      )}

      {/* STEP 2: TEXT & DISPLAY */}
      {currentStep === 2 && (
        <AccessibilityStep
          stepNumber={2}
          totalSteps={totalSteps}
          title="Make Content Comfortable to Read"
          description="Adjust typography scale, contrast, and color palette. All adjustments take effect immediately."
          onBack={() => handleStepChange(1)}
          onNext={() => handleStepChange(3)}
          onSkip={handleSkip}
          nextLabel="Continue to Navigation"
        >
          <div className="flex flex-col gap-6">
            <FontSizeControl showPreview={true} />
            <ContrastControl />
            <ThemeToggle />
          </div>
        </AccessibilityStep>
      )}

      {/* STEP 3: NAVIGATION & MOTOR */}
      {currentStep === 3 && (
        <AccessibilityStep
          stepNumber={3}
          totalSteps={totalSteps}
          title="Choose How You Want to Navigate"
          description="Configure keyboard controls, motion reductions, and layout simplifications."
          onBack={() => handleStepChange(2)}
          onNext={() => handleStepChange(4)}
          onSkip={handleSkip}
          nextLabel="Continue to Audio"
        >
          <div className="flex flex-col gap-6">
            {/* Navigation Mode Choice */}
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-bold text-foreground">
                Primary Navigation Mode
              </h3>
              <p className="text-xs text-foreground-secondary leading-relaxed">
                All controls remain keyboard accessible regardless of this setting. Keyboard-first mode enhances shortcut key indicators across questions and actions.
              </p>

              <fieldset className="border-0 p-0 m-0">
                <legend className="sr-only">Choose navigation mode</legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="radiogroup">
                  <label
                    htmlFor="nav-standard"
                    className={`
                      p-4 rounded-lg border-2 cursor-pointer select-none transition-all
                      ${
                        !preferences.keyboardFirst
                          ? 'border-primary bg-primary/10 ring-1 ring-primary'
                          : 'border-border bg-surface hover:bg-surface-elevated'
                      }
                    `.trim()}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        id="nav-standard"
                        name="nav-mode-selection"
                        checked={!preferences.keyboardFirst}
                        onChange={() => {
                          updatePreference('keyboardFirst', false);
                          announce('Standard navigation mode selected.');
                        }}
                        className="sr-only"
                      />
                      <Navigation className="w-4 h-4 text-foreground-muted" aria-hidden="true" />
                      <span className="text-sm font-bold text-foreground">Standard Navigation</span>
                    </div>
                    <p className="text-xs text-foreground-muted mt-2 pl-6">
                      Use keyboard, touch, or pointer controls. Standard browser navigation.
                    </p>
                  </label>

                  <label
                    htmlFor="nav-keyboard"
                    className={`
                      p-4 rounded-lg border-2 cursor-pointer select-none transition-all
                      ${
                        preferences.keyboardFirst
                          ? 'border-primary bg-primary/10 ring-1 ring-primary'
                          : 'border-border bg-surface hover:bg-surface-elevated'
                      }
                    `.trim()}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        id="nav-keyboard"
                        name="nav-mode-selection"
                        checked={preferences.keyboardFirst}
                        onChange={() => {
                          updatePreference('keyboardFirst', true);
                          announce('Keyboard-first navigation mode selected.');
                        }}
                        className="sr-only"
                      />
                      <Keyboard className="w-4 h-4 text-primary" aria-hidden="true" />
                      <span className="text-sm font-bold text-foreground">Keyboard-First</span>
                    </div>
                    <p className="text-xs text-foreground-muted mt-2 pl-6">
                      Use the keyboard to navigate and operate GoWow. Displays visual hotkey shortcut badges.
                    </p>
                  </label>
                </div>
              </fieldset>
            </div>

            {/* Interactive Keyboard Test & Focus Preview */}
            <KeyboardNavigationTest />

            {/* Reduced Motion */}
            <ReducedMotionControl />

            {/* Additional Interaction Optimizations */}
            <div className="p-4 rounded-xl border border-border bg-surface flex flex-col gap-4">
              <h4 className="text-sm font-bold text-foreground">
                Specialized Reading & Layout Options
              </h4>

              {/* Screen Reader Optimized Mode */}
              <div className="flex items-start justify-between gap-4 border-b border-border pb-3">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-foreground">
                    Screen-Reader Optimized Experience
                  </span>
                  <p className="text-[11px] text-foreground-muted leading-relaxed">
                    Streamlines live-region updates and removes decorative noise. Note: The entire GoWow application is built to be screen-reader compatible by default.
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="opt-screen-reader"
                  checked={preferences.screenReaderOptimized}
                  onChange={(e) => {
                    updatePreference('screenReaderOptimized', e.target.checked);
                    announce(`Screen reader optimization ${e.target.checked ? 'enabled' : 'disabled'}.`);
                  }}
                  className="w-5 h-5 rounded border-border-strong text-primary focus:ring-primary shrink-0 mt-1"
                  aria-label="Toggle Screen-Reader Optimized Experience"
                />
              </div>

              {/* Simplified Interface Mode */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-foreground">
                    Simplified Interface (Cognitive Support)
                  </span>
                  <p className="text-[11px] text-foreground-muted leading-relaxed">
                    Reduces visual decorations and backgrounds to minimize cognitive fatigue while preserving all functionality.
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="opt-simplified-ui"
                  checked={preferences.simplifiedInterface}
                  onChange={(e) => {
                    updatePreference('simplifiedInterface', e.target.checked);
                    announce(`Simplified interface ${e.target.checked ? 'enabled' : 'disabled'}.`);
                  }}
                  className="w-5 h-5 rounded border-border-strong text-primary focus:ring-primary shrink-0 mt-1"
                  aria-label="Toggle Simplified Interface mode"
                />
              </div>
            </div>
          </div>
        </AccessibilityStep>
      )}

      {/* STEP 4: AUDIO ASSISTANCE */}
      {currentStep === 4 && (
        <AccessibilityStep
          stepNumber={4}
          totalSteps={totalSteps}
          title="Configure Audio Assistance"
          description="Set up optional speech feedback, voice rate, and timer warnings."
          onBack={() => handleStepChange(3)}
          onNext={() => handleStepChange(5)}
          onSkip={handleSkip}
          nextLabel="Continue to Language"
        >
          <AudioControl />
        </AccessibilityStep>
      )}

      {/* STEP 5: LANGUAGE */}
      {currentStep === 5 && (
        <AccessibilityStep
          stepNumber={5}
          totalSteps={totalSteps}
          title="Choose Your Language"
          description="Select your preferred language for examinations and instructions."
          onBack={() => handleStepChange(4)}
          onNext={() => handleStepChange(6)}
          onSkip={handleSkip}
          nextLabel="Preview Experience"
        >
          <LanguageSelector />
        </AccessibilityStep>
      )}

      {/* STEP 6: PREVIEW & TEST */}
      {currentStep === 6 && (
        <AccessibilityStep
          stepNumber={6}
          totalSteps={totalSteps}
          title="Your GoWow Experience"
          description="Verify your selected settings on a live simulated exam question. Test reading, keyboard navigation, and contrast."
          onBack={() => handleStepChange(5)}
          onNext={() => handleStepChange(7)}
          onSkip={handleSkip}
          nextLabel="Save & Continue"
        >
          <div className="flex flex-col gap-6">
            {/* Miniature Interactive Exam Preview */}
            <AccessibilityPreview />

            {/* Profile Recap Summary */}
            <AccessibilitySummary />
          </div>
        </AccessibilityStep>
      )}

      {/* STEP 7: SETUP COMPLETE */}
      {currentStep === 7 && (
        <AccessibilityStep
          stepNumber={7}
          totalSteps={totalSteps}
          title="Your GoWow Experience Is Ready"
          description="Your accessibility profile is calibrated and saved. You have complete independence to adjust your settings anytime."
          onBack={() => handleStepChange(6)}
          onNext={handleFinish}
          nextLabel="Go to My Dashboard"
          isLastStep={true}
        >
          <div className="flex flex-col gap-6 py-3">
            <div className="p-6 rounded-xl border border-status-success/40 bg-status-success/10 flex items-start gap-4">
              <CheckCircle2 className="w-8 h-8 text-status-success shrink-0 mt-0.5" aria-hidden="true" />
              <div className="flex flex-col gap-1.5">
                <h3 className="text-lg font-bold text-foreground">
                  Configuration Saved Successfully
                </h3>
                <p className="text-sm text-foreground-secondary leading-relaxed">
                  Your personalized settings will automatically apply whenever you practice, review questions, or attempt competitive examinations on this device.
                </p>
                <p className="text-xs text-foreground-muted mt-1">
                  You can change these settings anytime from Accessibility Settings in the navigation header or your profile menu.
                </p>
              </div>
            </div>

            <AccessibilitySummary />

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleStepChange(2)}
                icon={<Sliders className="w-4 h-4" aria-hidden="true" />}
                aria-label="Review and adjust settings again"
              >
                Review Settings
              </Button>

              <Button
                type="button"
                variant="primary"
                onClick={handleFinish}
                iconRight={<ArrowRight className="w-4 h-4" aria-hidden="true" />}
                aria-label="Proceed to candidate dashboard"
                className="w-full sm:w-auto"
              >
                Go to My Dashboard
              </Button>
            </div>
          </div>
        </AccessibilityStep>
      )}

      {/* Reset Confirmation Modal */}
      <ResetSettingsModal
        isOpen={isResetModalOpen}
        onClose={closeResetModal}
        onConfirm={confirmReset}
      />
    </div>
  );
};
