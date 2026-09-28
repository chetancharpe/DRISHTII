import React from 'react';
import { Link } from 'react-router-dom';
import { Sliders, Sun, Moon, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useAccessibility } from '../../hooks/useAccessibility';
import { useTheme } from '../../contexts/ThemeContext';
import { Modal } from '../common/Modal';
import { AccessibilityPanel } from '../accessibility/AccessibilityPanel';
import { useKeyboardNavigation } from '../../hooks/useKeyboardNavigation';

export interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  badge?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
  badge = 'Accessible Examination Platform',
}) => {
  const { preferences, setHighContrast, isCalibrationOpen, openCalibration, closeCalibration } = useAccessibility();
  const { theme, toggleTheme } = useTheme();

  // Global hotkey: Alt+A toggles Accessibility Calibration Center anywhere
  useKeyboardNavigation({
    'Alt+A': () => {
      if (isCalibrationOpen) {
        closeCalibration();
      } else {
        openCalibration();
      }
    },
  });

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-fast">
      {/* Skip to Main Auth Form */}
      <a href="#auth-form-content" className="skip-link">
        Skip to form fields
      </a>

      {/* Top Accessible Bar */}
      <header className="w-full bg-surface border-b border-border py-3 px-4 sm:px-6 z-30" role="banner">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 text-foreground hover:text-primary font-bold text-xl tracking-tight focus-visible:outline-offset-4"
            aria-label="GoWow Home Page"
          >
            <span
              className="w-9 h-9 rounded-md bg-primary text-primary-contrast flex items-center justify-center font-extrabold text-lg select-none"
              aria-hidden="true"
            >
              G
            </span>
            <div className="flex flex-col">
              <span className="leading-tight font-extrabold tracking-tight">GoWow</span>
              <span className="text-[10px] text-foreground-muted uppercase tracking-wider font-semibold -mt-0.5">
                Authentication
              </span>
            </div>
          </Link>

          {/* Accessibility & Theme Quick Controls (Available without authentication!) */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openCalibration}
              aria-label="Open Accessibility Calibration Center (Shortcut: Alt+A)"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md border border-border-strong bg-surface-elevated hover:bg-surface text-foreground cursor-pointer min-h-[44px]"
            >
              <Sliders className="w-4 h-4 text-primary" aria-hidden="true" />
              <span className="hidden sm:inline">Accessibility</span>
              <span className="keyboard-indicator text-[10px]">Alt+A</span>
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Current theme: ${theme}. Click to cycle theme presets.`}
              className="p-2 sm:px-2.5 sm:py-2 text-xs font-semibold rounded-md border border-border bg-surface hover:bg-surface-elevated text-foreground cursor-pointer min-h-[44px] min-w-[44px] inline-flex items-center justify-center gap-1.5"
            >
              {theme === 'light' ? (
                <Sun className="w-4 h-4 text-amber-500" aria-hidden="true" />
              ) : theme === 'high_contrast' ? (
                <Sparkles className="w-4 h-4 text-primary" aria-hidden="true" />
              ) : (
                <Moon className="w-4 h-4 text-primary" aria-hidden="true" />
              )}
              <span className="hidden md:inline capitalize">{theme.replace('_', ' ')}</span>
            </button>

            <button
              type="button"
              onClick={() => setHighContrast(!preferences.highContrast)}
              aria-pressed={preferences.highContrast}
              aria-label={
                preferences.highContrast
                  ? 'Disable high contrast mode'
                  : 'Enable high contrast AAA mode'
              }
              className={`px-3 py-2 text-xs font-semibold rounded-md border cursor-pointer min-h-[44px] hidden sm:inline-flex items-center gap-1.5 ${
                preferences.highContrast
                  ? 'bg-primary text-primary-contrast border-primary font-bold'
                  : 'border-border bg-surface hover:bg-surface-elevated text-foreground'
              }`}
            >
              <span>Contrast</span>
              <span className="text-[10px] font-mono px-1 rounded bg-black/20">
                {preferences.highContrast ? 'AAA' : 'AA'}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main
        id="main-content"
        role="main"
        className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-12 flex items-center justify-center"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 w-full max-w-5xl items-center">
          {/* Left Column: Branding, Mission & Assurance */}
          <div className="lg:col-span-5 flex flex-col justify-center text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-surface-elevated text-xs font-semibold text-primary mb-4 w-fit">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
              <span>{badge}</span>
            </div>

            <h1 className="text-display font-extrabold text-foreground tracking-tight mb-3">
              {title}
            </h1>

            {subtitle && (
              <p className="text-body text-foreground-secondary mb-6 leading-relaxed">
                {subtitle}
              </p>
            )}

            <div className="hidden lg:flex flex-col gap-3 pt-6 border-t border-border text-xs text-foreground-muted">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-status-success shrink-0" aria-hidden="true" />
                <span>100% Keyboard Operable & Focus Preserving</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-status-success shrink-0" aria-hidden="true" />
                <span>Screen-Reader Tested & Structured Semantics</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-status-success shrink-0" aria-hidden="true" />
                <span>Configurable Font Zoom & OLED High Contrast</span>
              </div>
            </div>
          </div>

          {/* Right Column: Form Container Card */}
          <div
            id="auth-form-content"
            tabIndex={-1}
            className="lg:col-span-7 bg-surface border border-border rounded-xl p-6 sm:p-8 shadow-md outline-none focus-visible:outline-none"
          >
            {children}
          </div>
        </div>
      </main>

      {/* Accessible Footer */}
      <footer className="w-full bg-surface border-t border-border py-4 px-4 sm:px-6 text-center text-xs text-foreground-muted mt-auto" role="contentinfo">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>GoWow Platform — Independent Accessible Assessment</span>
          <span>Designed with WCAG 2.1 AA principles in mind.</span>
        </div>
      </footer>

      {/* Accessibility Calibration Modal (Can be triggered anywhere on Auth screens) */}
      <Modal
        isOpen={isCalibrationOpen}
        onClose={closeCalibration}
        title="Accessibility Calibration Center"
        description="Fine-tune sensory, typography, and keyboard controls. All settings persist on your device."
        maxWidth="lg"
      >
        <AccessibilityPanel onClose={closeCalibration} />
      </Modal>
    </div>
  );
};
