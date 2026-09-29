import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccessibility } from '../../hooks/useAccessibility';
import { useAuth } from '../../hooks/useAuth';
import {
  Volume2,
  Gauge,
  Eye,
  Languages,
  CheckCircle2,
  X,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Radio,
} from 'lucide-react';
import { ContrastOption, SpeechRateOption } from '../../types/accessibility';

export interface AudioGuidedOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export const DRISHTI_ONBOARDING_KEY = 'drishti_onboarding_completed';

export const AudioGuidedOnboardingModal: React.FC<AudioGuidedOnboardingModalProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  const { preferences, updatePreference, updatePreferences, savePreferences, speak, stopSpeaking, announce } = useAccessibility();
  const { role } = useAuth();
  const navigate = useNavigate();

  // Wizard steps: 0 = Intro, 1 = Speech Rate, 2 = Contrast, 3 = Language, 4 = Screen Reader / Audio, 5 = Complete
  const [step, setStep] = useState<number>(0);
  const [selectedSpeed, setSelectedSpeed] = useState<number>(preferences.speechRateMultiplier ?? 1.0);
  const [selectedContrast, setSelectedContrast] = useState<ContrastOption>(preferences.contrast || 'standard');
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark'>('dark');
  const [selectedLang, setSelectedLang] = useState<string>(preferences.language || 'en');
  const [selectedAssist, setSelectedAssist] = useState<boolean>(true);

  const modalRef = useRef<HTMLDivElement>(null);
  const hasAnnouncedIntroRef = useRef(false);

  // Announce step audio prompt
  const speakStepPrompt = useCallback(
    (currentStep: number) => {
      stopSpeaking();
      if (currentStep === 0) {
        speak(
          'Welcome to Drishti. An accessible examination platform. Press Enter to begin audio setup, or press H for help, or press Escape to skip.'
        );
        announce('Welcome to Drishti. Press Enter to begin audio setup, or press H for help.');
      } else if (currentStep === 1) {
        speak(
          'Question 1 of 4: Speech Rate. Press 1 for Normal speed, 2 for Fast speed, 3 for Slow speed, or press Space to test the current voice. Press Enter to confirm.'
        );
        announce('Question 1 of 4: Speech Rate. Press 1 for Normal, 2 for Fast, 3 for Slow, Space to test, Enter to confirm.');
      } else if (currentStep === 2) {
        speak(
          'Question 2 of 4: Visual Contrast. Press 1 for Standard mode, 2 for High Contrast Dark mode, 3 for High Contrast Light mode. Press Enter to confirm.'
        );
        announce('Question 2 of 4: Visual Contrast. Press 1 for Standard, 2 for High Contrast Dark, 3 for High Contrast Light, Enter to confirm.');
      } else if (currentStep === 3) {
        speak(
          'Question 3 of 4: Interface Language. Press 1 for English, 2 for Hindi. Press Enter to confirm.'
        );
        announce('Question 3 of 4: Language. Press 1 for English, 2 for Hindi, Enter to confirm.');
      } else if (currentStep === 4) {
        speak(
          'Question 4 of 4: Assistive Technology. Press 1 to enable continuous voice assistance and screen reader optimization, or 2 for standard mode. Press Enter to finish.'
        );
        announce('Question 4 of 4: Press 1 for Voice & Screen Reader Optimized, 2 for Standard, Enter to finish.');
      } else if (currentStep === 5) {
        speak(
          'Setup complete! All your accessibility preferences have been saved. Press Enter to open your examination dashboard, or Escape to close.'
        );
        announce('Setup complete! Press Enter to proceed to dashboard.');
      }
    },
    [speak, stopSpeaking, announce]
  );

  // Initial trigger when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(0);
      hasAnnouncedIntroRef.current = false;
      const timer = setTimeout(() => {
        speakStepPrompt(0);
        hasAnnouncedIntroRef.current = true;
      }, 300);
      return () => {
        clearTimeout(timer);
        stopSpeaking();
      };
    }
  }, [isOpen, speakStepPrompt, stopSpeaking]);

  const handleFinish = useCallback(() => {
    stopSpeaking();
    // Persist all choices
    const rateCategory: SpeechRateOption =
      selectedSpeed <= 0.85 ? 'slow' : selectedSpeed >= 1.25 ? 'fast' : 'normal';

    updatePreferences({
      speechRateMultiplier: selectedSpeed,
      speechRate: rateCategory,
      contrast: selectedContrast,
      theme: selectedTheme,
      language: selectedLang,
      audioEnabled: selectedAssist,
      screenReaderOptimized: selectedAssist,
      keyboardFirst: true,
    });
    savePreferences();
    localStorage.setItem(DRISHTI_ONBOARDING_KEY, 'true');

    if (onComplete) {
      onComplete();
    } else {
      onClose();
      if (role === 'examiner') {
        navigate('/examiner/dashboard');
      } else {
        navigate('/candidate/dashboard');
      }
    }
  }, [
    selectedSpeed,
    selectedContrast,
    selectedTheme,
    selectedLang,
    selectedAssist,
    updatePreferences,
    savePreferences,
    onComplete,
    onClose,
    role,
    navigate,
    stopSpeaking,
  ]);

  // Global Keyboard Navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow closing with Escape
      if (e.key === 'Escape') {
        e.preventDefault();
        stopSpeaking();
        localStorage.setItem(DRISHTI_ONBOARDING_KEY, 'true');
        onClose();
        return;
      }

      // Help hotkey H
      if (e.key.toLowerCase() === 'h') {
        e.preventDefault();
        stopSpeaking();
        if (step === 0) {
          speak(
            'Help: Drishti provides high accessibility for candidates. Press Enter to proceed through 4 short audio questions to set speech speed, visual contrast, language, and screen reader mode.'
          );
        } else if (step === 1) {
          speak(
            'Help: Choose how fast speech reads questions. Press 1 for Normal, 2 for Fast, 3 for Slow. Press Space to hear a sample at the current speed.'
          );
        } else if (step === 2) {
          speak(
            'Help: Choose visual contrast. Option 1 is standard colors. Option 2 is high contrast white text on pure black. Option 3 is black text on pure white.'
          );
        } else if (step === 3) {
          speak(
            'Help: Choose your preferred examination language. Press 1 for English or 2 for Hindi.'
          );
        } else if (step === 4) {
          speak(
            'Help: Option 1 optimizes all interactive elements for screen readers and speech synthesis.'
          );
        } else {
          speak('Press Enter to complete your setup and open your dashboard.');
        }
        return;
      }

      // Step navigation via Enter
      if (e.key === 'Enter') {
        e.preventDefault();
        if (step === 0) {
          setStep(1);
          speakStepPrompt(1);
        } else if (step === 1) {
          setStep(2);
          speakStepPrompt(2);
        } else if (step === 2) {
          setStep(3);
          speakStepPrompt(3);
        } else if (step === 3) {
          setStep(4);
          speakStepPrompt(4);
        } else if (step === 4) {
          setStep(5);
          speakStepPrompt(5);
        } else if (step === 5) {
          handleFinish();
        }
        return;
      }

      // Back navigation via Backspace
      if (e.key === 'Backspace' && step > 0 && step < 5) {
        e.preventDefault();
        const prevStep = step - 1;
        setStep(prevStep);
        speakStepPrompt(prevStep);
        return;
      }

      // Step 1: Speech rate controls (1, 2, 3, Space)
      if (step === 1) {
        if (e.key === '1') {
          e.preventDefault();
          setSelectedSpeed(1.0);
          updatePreference('speechRateMultiplier', 1.0);
          updatePreference('speechRate', 'normal');
          speak('Normal speech speed selected: 1.0 times speed. Press Space to test or Enter to confirm.');
        } else if (e.key === '2') {
          e.preventDefault();
          setSelectedSpeed(1.5);
          updatePreference('speechRateMultiplier', 1.5);
          updatePreference('speechRate', 'fast');
          speak('Fast speech speed selected: 1.5 times speed. Press Space to test or Enter to confirm.');
        } else if (e.key === '3') {
          e.preventDefault();
          setSelectedSpeed(0.8);
          updatePreference('speechRateMultiplier', 0.8);
          updatePreference('speechRate', 'slow');
          speak('Slow speech speed selected: 0.8 times speed. Press Space to test or Enter to confirm.');
        } else if (e.key === ' ' || e.code === 'Space') {
          e.preventDefault();
          speak(`This is a test of Drishti speech output at ${selectedSpeed.toFixed(1)} times speed.`);
        }
      }

      // Step 2: Contrast controls (1, 2, 3)
      if (step === 2) {
        if (e.key === '1') {
          e.preventDefault();
          setSelectedContrast('standard');
          setSelectedTheme('dark');
          updatePreference('contrast', 'standard');
          speak('Standard contrast selected. Press Enter to confirm.');
        } else if (e.key === '2') {
          e.preventDefault();
          setSelectedContrast('high');
          setSelectedTheme('dark');
          updatePreference('contrast', 'high');
          speak('High contrast dark mode selected. Pure black background with bright gold accents. Press Enter to confirm.');
        } else if (e.key === '3') {
          e.preventDefault();
          setSelectedContrast('high');
          setSelectedTheme('light');
          updatePreference('contrast', 'high');
          speak('High contrast light mode selected. Pure white background with maximum dark borders. Press Enter to confirm.');
        }
      }

      // Step 3: Language controls (1, 2)
      if (step === 3) {
        if (e.key === '1') {
          e.preventDefault();
          setSelectedLang('en');
          updatePreference('language', 'en');
          speak('English language selected. Press Enter to confirm.');
        } else if (e.key === '2') {
          e.preventDefault();
          setSelectedLang('hi');
          updatePreference('language', 'hi');
          speak('Hindi language selected. Drishti me aapka swagat hai. Press Enter to confirm.');
        }
      }

      // Step 4: Assistive Technology (1, 2)
      if (step === 4) {
        if (e.key === '1') {
          e.preventDefault();
          setSelectedAssist(true);
          updatePreference('audioEnabled', true);
          updatePreference('screenReaderOptimized', true);
          speak('Voice assistance and screen reader optimization enabled. Press Enter to finish setup.');
        } else if (e.key === '2') {
          e.preventDefault();
          setSelectedAssist(false);
          updatePreference('audioEnabled', false);
          speak('Standard navigation mode selected. Press Enter to finish setup.');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isOpen,
    step,
    selectedSpeed,
    selectedContrast,
    selectedTheme,
    selectedLang,
    selectedAssist,
    speakStepPrompt,
    handleFinish,
    onClose,
    speak,
    stopSpeaking,
    updatePreference,
  ]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="audio-onboarding-title"
      aria-describedby="audio-onboarding-desc"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/85 backdrop-blur-md"
    >
      <div
        ref={modalRef}
        className="w-full max-w-2xl bg-surface rounded-3xl border-2 border-primary/40 shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Top Sound Wave Header Bar */}
        <div className="bg-primary/10 border-b border-primary/20 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-primary text-primary-contrast shadow-md flex items-center justify-center animate-pulse">
              <Radio className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest font-extrabold text-primary px-2 py-0.5 rounded-full bg-primary/15 border border-primary/30">
                  Audio-Guided Setup
                </span>
                <span className="text-xs font-mono text-foreground-secondary">
                  Step {step === 0 ? 'Intro' : step === 5 ? 'Done' : `${step} of 4`}
                </span>
              </div>
              <h1 id="audio-onboarding-title" className="text-lg font-black text-foreground tracking-tight mt-0.5">
                DRISHTI Hands-Free Voice Onboarding
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              stopSpeaking();
              localStorage.setItem(DRISHTI_ONBOARDING_KEY, 'true');
              onClose();
            }}
            className="p-2 rounded-xl text-foreground-secondary hover:text-foreground hover:bg-surface-elevated focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[40px] min-w-[40px] flex items-center justify-center transition-colors"
            aria-label="Skip and close audio setup (Escape)"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 flex flex-col gap-6" id="audio-onboarding-desc">
          {/* Animated Audio Waveform Graphic */}
          <div className="flex items-center justify-center gap-1.5 py-2">
            {[40, 70, 100, 60, 90, 45, 80, 50, 95, 65, 85, 40].map((h, i) => (
              <span
                key={i}
                style={{ height: `${h}%` }}
                className="w-1.5 bg-primary/70 rounded-full transition-all duration-300 animate-pulse"
              />
            ))}
          </div>

          {/* STEP 0: Welcome / Intro */}
          {step === 0 && (
            <div className="flex flex-col gap-4 text-center sm:text-left">
              <div className="p-5 rounded-2xl bg-surface-elevated/70 border border-border flex flex-col gap-3">
                <div className="flex items-center gap-2.5 text-primary font-bold text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>Zero-Screen-Reader Dependency Setup</span>
                </div>
                <p className="text-base font-medium text-foreground leading-relaxed">
                  Welcome to <strong className="text-primary font-bold">DRISHTI</strong>. Even if you do not have an active screen reader installed, our built-in voice guide will set up your examination environment in under one minute.
                </p>
                <p className="text-xs text-foreground-secondary">
                  Listen to the voice instructions and press single keyboard keys to answer each question.
                </p>
              </div>

              {/* Primary Keyboard Controls Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                <div className="p-3 rounded-xl border border-primary/30 bg-primary/10 flex items-center gap-2.5">
                  <kbd className="px-2 py-1 rounded bg-surface border border-primary/40 font-mono font-bold text-xs text-primary shadow-xs">
                    Enter
                  </kbd>
                  <span className="text-xs font-semibold text-foreground">Start Setup</span>
                </div>
                <div className="p-3 rounded-xl border border-border bg-surface-elevated flex items-center gap-2.5">
                  <kbd className="px-2 py-1 rounded bg-surface border border-border font-mono font-bold text-xs text-foreground shadow-xs">
                    H
                  </kbd>
                  <span className="text-xs font-semibold text-foreground">Speak Help</span>
                </div>
                <div className="p-3 rounded-xl border border-border bg-surface-elevated flex items-center gap-2.5">
                  <kbd className="px-2 py-1 rounded bg-surface border border-border font-mono font-bold text-xs text-foreground shadow-xs">
                    Esc
                  </kbd>
                  <span className="text-xs font-semibold text-foreground">Skip</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 1: Speech Rate */}
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2.5">
                <Gauge className="w-5 h-5 text-primary flex-shrink-0" />
                <div>
                  <h2 className="text-base font-extrabold text-foreground">Question 1: Speech Synthesis Speed</h2>
                  <p className="text-xs text-foreground-secondary">How fast should questions and instructions be read to you?</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { key: '1', label: 'Normal (1.0x)', speed: 1.0, desc: 'Natural pacing' },
                  { key: '2', label: 'Fast (1.5x)', speed: 1.5, desc: 'Brisk reading' },
                  { key: '3', label: 'Slow (0.8x)', speed: 0.8, desc: 'Careful cadence' },
                ].map((opt) => {
                  const isSelected = Math.abs(selectedSpeed - opt.speed) < 0.1;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => {
                        setSelectedSpeed(opt.speed);
                        updatePreference('speechRateMultiplier', opt.speed);
                        speak(`${opt.label} selected. Press Space to test or Enter to proceed.`);
                      }}
                      className={`p-4 rounded-2xl border-2 text-left flex flex-col gap-1 transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/15 shadow-sm ring-1 ring-primary'
                          : 'border-border bg-surface hover:bg-surface-elevated'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <kbd className="px-2 py-0.5 rounded bg-surface border font-mono font-bold text-xs text-primary">
                          [{opt.key}]
                        </kbd>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-primary" />}
                      </div>
                      <span className="text-sm font-bold text-foreground mt-1">{opt.label}</span>
                      <span className="text-xs text-foreground-secondary">{opt.desc}</span>
                    </button>
                  );
                })}
              </div>

              {/* Space to test voice */}
              <div className="p-3 rounded-xl bg-surface-elevated border border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <kbd className="px-2.5 py-1 rounded bg-surface border font-mono font-bold text-xs text-foreground shadow-xs">
                    Space
                  </kbd>
                  <span className="text-xs font-semibold text-foreground">Test Speech at {selectedSpeed.toFixed(1)}x</span>
                </div>
                <button
                  type="button"
                  onClick={() => speak(`Testing speech rate at ${selectedSpeed.toFixed(1)} times normal speed.`)}
                  className="px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-colors"
                >
                  Listen Sample
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Contrast & Display */}
          {step === 2 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2.5">
                <Eye className="w-5 h-5 text-primary flex-shrink-0" />
                <div>
                  <h2 className="text-base font-extrabold text-foreground">Question 2: Display Contrast & Theme</h2>
                  <p className="text-xs text-foreground-secondary">Choose the color scheme easiest on your eyes.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    key: '1',
                    label: 'Standard Contrast',
                    contrast: 'standard' as const,
                    theme: 'dark' as const,
                    desc: 'Balanced dark palette',
                  },
                  {
                    key: '2',
                    label: 'High Contrast Dark',
                    contrast: 'high' as const,
                    theme: 'dark' as const,
                    desc: 'Pure black & gold (7:1+)',
                  },
                  {
                    key: '3',
                    label: 'High Contrast Light',
                    contrast: 'high' as const,
                    theme: 'light' as const,
                    desc: 'Pure white & deep black',
                  },
                ].map((opt) => {
                  const isSelected = selectedContrast === opt.contrast && selectedTheme === opt.theme;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => {
                        setSelectedContrast(opt.contrast);
                        setSelectedTheme(opt.theme);
                        updatePreference('contrast', opt.contrast);
                        speak(`${opt.label} selected. Press Enter to proceed.`);
                      }}
                      className={`p-4 rounded-2xl border-2 text-left flex flex-col gap-1 transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/15 shadow-sm ring-1 ring-primary'
                          : 'border-border bg-surface hover:bg-surface-elevated'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <kbd className="px-2 py-0.5 rounded bg-surface border font-mono font-bold text-xs text-primary">
                          [{opt.key}]
                        </kbd>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-primary" />}
                      </div>
                      <span className="text-sm font-bold text-foreground mt-1">{opt.label}</span>
                      <span className="text-xs text-foreground-secondary">{opt.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: Language */}
          {step === 3 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2.5">
                <Languages className="w-5 h-5 text-primary flex-shrink-0" />
                <div>
                  <h2 className="text-base font-extrabold text-foreground">Question 3: Interface Language</h2>
                  <p className="text-xs text-foreground-secondary">Select your preferred audio and display language.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: '1', lang: 'en', label: 'English', desc: 'Standard English voice & UI' },
                  { key: '2', lang: 'hi', label: 'हिन्दी (Hindi)', desc: 'हिंदी आवाज और इंटरफेस' },
                ].map((opt) => {
                  const isSelected = selectedLang === opt.lang;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => {
                        setSelectedLang(opt.lang);
                        updatePreference('language', opt.lang);
                        speak(`${opt.label} selected. Press Enter to proceed.`);
                      }}
                      className={`p-5 rounded-2xl border-2 text-left flex flex-col gap-1.5 transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/15 shadow-sm ring-1 ring-primary'
                          : 'border-border bg-surface hover:bg-surface-elevated'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <kbd className="px-2.5 py-1 rounded bg-surface border font-mono font-bold text-xs text-primary">
                          [{opt.key}]
                        </kbd>
                        {isSelected && <CheckCircle2 className="w-5 h-5 text-primary" />}
                      </div>
                      <span className="text-base font-bold text-foreground mt-1">{opt.label}</span>
                      <span className="text-xs text-foreground-secondary">{opt.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: Screen Reader / Audio Assistance */}
          {step === 4 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2.5">
                <Volume2 className="w-5 h-5 text-primary flex-shrink-0" />
                <div>
                  <h2 className="text-base font-extrabold text-foreground">Question 4: Assistive Mode</h2>
                  <p className="text-xs text-foreground-secondary">Configure continuous voice feedback and screen reader optimizations.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    key: '1',
                    val: true,
                    label: 'Voice & Screen Reader Optimized',
                    desc: 'Spoken question stems, audio confirmations, ARIA-live alerts, and keyboard hotkeys.',
                  },
                  {
                    key: '2',
                    val: false,
                    label: 'Standard Interface Mode',
                    desc: 'Standard examination view with optional on-demand speech.',
                  },
                ].map((opt) => {
                  const isSelected = selectedAssist === opt.val;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => {
                        setSelectedAssist(opt.val);
                        updatePreference('audioEnabled', opt.val);
                        speak(`${opt.label} selected. Press Enter to finish.`);
                      }}
                      className={`p-5 rounded-2xl border-2 text-left flex flex-col gap-1.5 transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/15 shadow-sm ring-1 ring-primary'
                          : 'border-border bg-surface hover:bg-surface-elevated'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <kbd className="px-2.5 py-1 rounded bg-surface border font-mono font-bold text-xs text-primary">
                          [{opt.key}]
                        </kbd>
                        {isSelected && <CheckCircle2 className="w-5 h-5 text-primary" />}
                      </div>
                      <span className="text-sm font-bold text-foreground mt-1">{opt.label}</span>
                      <span className="text-xs text-foreground-secondary leading-relaxed">{opt.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 5: Complete */}
          {step === 5 && (
            <div className="flex flex-col items-center justify-center py-6 text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-status-success/20 border-2 border-status-success flex items-center justify-center text-status-success animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl font-black text-foreground">Setup Successfully Configured!</h2>
                <p className="text-xs text-foreground-secondary mt-1 max-w-md">
                  Your customized accessibility profile is saved and applied immediately across examinations.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-surface-elevated border border-border w-full max-w-md grid grid-cols-2 gap-2 text-xs text-left">
                <div>
                  <span className="text-foreground-muted">Speech Speed:</span>{' '}
                  <strong className="text-foreground font-mono">{selectedSpeed.toFixed(1)}x</strong>
                </div>
                <div>
                  <span className="text-foreground-muted">Contrast:</span>{' '}
                  <strong className="text-foreground capitalize">{selectedContrast}</strong>
                </div>
                <div>
                  <span className="text-foreground-muted">Language:</span>{' '}
                  <strong className="text-foreground uppercase">{selectedLang}</strong>
                </div>
                <div>
                  <span className="text-foreground-muted">Audio Assistance:</span>{' '}
                  <strong className="text-foreground">{selectedAssist ? 'Active' : 'Off'}</strong>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="bg-surface-elevated border-t border-border p-4 sm:p-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {step > 0 && step < 5 && (
              <button
                type="button"
                onClick={() => {
                  const prev = step - 1;
                  setStep(prev);
                  speakStepPrompt(prev);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface hover:bg-surface-elevated border border-border text-foreground text-xs font-bold min-h-[40px] transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back [Backspace]</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                speakStepPrompt(step);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface hover:bg-surface-elevated border border-border text-foreground text-xs font-semibold min-h-[40px] transition-colors"
              aria-label="Re-speak current question"
            >
              <Volume2 className="w-3.5 h-3.5 text-primary" />
              <span className="hidden sm:inline">Repeat Voice</span>
            </button>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {step < 5 ? (
              <button
                type="button"
                onClick={() => {
                  const next = step + 1;
                  setStep(next);
                  speakStepPrompt(next);
                }}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover active:bg-primary-hover text-primary-contrast text-xs font-bold shadow-md min-h-[44px] transition-colors"
              >
                <span>{step === 0 ? 'Start Audio Setup' : 'Next Question'}</span>
                <kbd className="hidden sm:inline px-1.5 py-0.5 rounded bg-primary-contrast/20 text-[10px] font-mono">
                  Enter
                </kbd>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover active:bg-primary-hover text-primary-contrast text-xs font-bold shadow-md min-h-[44px] transition-colors"
              >
                <span>Go to Dashboard</span>
                <kbd className="hidden sm:inline px-1.5 py-0.5 rounded bg-primary-contrast/20 text-[10px] font-mono">
                  Enter
                </kbd>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
