import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sliders,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Building2,
  Volume2,
} from 'lucide-react';
import { Button } from '../common/Button';

export interface HeroSectionProps {
  onOpenAccessibility: () => void;
  onOpenAudioOnboarding?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onOpenAccessibility, onOpenAudioOnboarding }) => {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative overflow-hidden pt-12 pb-16 md:py-20 lg:py-24"
    >
      {/* Decorative ambient background glows */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
        {/* Tagline Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-surface-elevated text-xs font-semibold text-primary mb-6 shadow-xs">
          <ShieldCheck className="w-4 h-4 text-primary" aria-hidden="true" />
          <span>Accessibility-First Examination Platform • WCAG 2.1 AA</span>
        </div>

        {/* Main Headline */}
        <h1
          id="hero-title"
          className="text-display tracking-tight text-foreground font-extrabold mb-6 max-w-4xl"
        >
          Exams Without Barriers.{' '}
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-400 to-indigo-400">
            Engineered for Independence.
          </span>
        </h1>

        {/* Subheading */}
        <p className="text-body-lg text-foreground-secondary max-w-3xl mb-8 leading-relaxed">
          Learn, practice, and take official competitive examinations with total autonomy. Built from first principles for blind, low-vision, and keyboard-reliant candidates, with complete authoring and proctoring tools for institutions.
        </p>

        {/* Call to Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3.5 w-full sm:w-auto mb-10">
          <Link to="/auth/signup?role=candidate" className="w-full sm:w-auto">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              iconRight={<ArrowRight className="w-5 h-5" />}
              className="shadow-md font-bold px-8"
            >
              Start Practicing Free
            </Button>
          </Link>

          <Link to="/auth/login?role=examiner" className="w-full sm:w-auto">
            <Button
              variant="secondary"
              size="lg"
              fullWidth
              icon={<Building2 className="w-4 h-4 text-primary" />}
              className="px-6"
            >
              Examiner Studio
            </Button>
          </Link>

          <Button
            variant="outline"
            size="lg"
            onClick={onOpenAccessibility}
            icon={<Sliders className="w-4 h-4 text-primary" />}
            className="w-full sm:w-auto px-6"
            aria-label="Open Accessibility Calibration Center (Shortcut: Alt+A)"
          >
            <span>Accessibility</span>
            <span className="keyboard-indicator ml-2 text-[10px]">Alt+A</span>
          </Button>

          {onOpenAudioOnboarding && (
            <Button
              variant="outline"
              size="lg"
              onClick={onOpenAudioOnboarding}
              icon={<Volume2 className="w-4 h-4 text-primary animate-pulse" />}
              className="w-full sm:w-auto px-6 border-primary/40 bg-primary/5 text-primary hover:bg-primary/10"
              aria-label="Start hands-free audio onboarding (Shortcut: Enter)"
            >
              <span>Audio Setup</span>
              <span className="keyboard-indicator ml-2 text-[10px] text-primary">Enter</span>
            </Button>
          )}
        </div>

        {/* Key Guarantees */}
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 pt-8 border-t border-border text-xs text-foreground-muted w-full max-w-3xl">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-status-success shrink-0" aria-hidden="true" />
            <span>100% Keyboard Operable</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-status-success shrink-0" aria-hidden="true" />
            <span>Screen-Reader Linearized</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-status-success shrink-0" aria-hidden="true" />
            <span>Calm Acoustic Countdown</span>
          </div>
        </div>
      </div>
    </section>
  );
};
