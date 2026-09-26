import React from 'react';
import { Link } from 'react-router-dom';
import { Sliders, ArrowRight, ShieldCheck, CheckCircle2, Clock, Volume2 } from 'lucide-react';
import { Button } from '../common/Button';

export interface HeroSectionProps {
  onOpenAccessibility: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onOpenAccessibility }) => {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative overflow-hidden pt-8 pb-16 md:py-20 lg:py-24"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Hero Content Column */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            {/* Tagline Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-surface-elevated text-xs font-semibold text-primary mb-6">
              <ShieldCheck className="w-4 h-4 text-primary" aria-hidden="true" />
              <span>Accessibility-First Examination Platform</span>
            </div>

            {/* Main Headline */}
            <h1
              id="hero-title"
              className="text-display tracking-tight text-foreground font-extrabold mb-6"
            >
              Exams Without Barriers
            </h1>

            {/* Subheading */}
            <p className="text-body-lg text-foreground-secondary max-w-2xl mb-8 leading-relaxed">
              Learn, practice, and take competitive examinations independently with technology designed around accessibility.
            </p>

            {/* Call to Actions */}
            <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
              <Link to="/auth/role-selection" className="w-full sm:w-auto">
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  iconRight={<ArrowRight className="w-5 h-5" />}
                  className="shadow-md"
                >
                  Start Preparing
                </Button>
              </Link>

              <Button
                variant="outline"
                size="lg"
                onClick={onOpenAccessibility}
                icon={<Sliders className="w-5 h-5 text-primary" />}
                className="w-full sm:w-auto"
                aria-label="Open Accessibility Calibration Center (Shortcut: Alt+A)"
              >
                <span>Explore Accessibility</span>
                <span className="keyboard-indicator ml-2 text-[10px]">Alt+A</span>
              </Button>
            </div>

            {/* Quick Guarantees */}
            <div className="flex flex-wrap items-center gap-6 mt-10 pt-6 border-t border-border text-xs text-foreground-muted">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-status-success" aria-hidden="true" />
                <span>100% Keyboard Operable</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-status-success" aria-hidden="true" />
                <span>Screen-Reader Optimized</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-status-success" aria-hidden="true" />
                <span>High Contrast AAA Mode</span>
              </div>
            </div>
          </div>

          {/* Product-Focused Abstract Visual Card (Decorative for Assistive Tech) */}
          <div
            className="lg:col-span-5 w-full flex justify-center"
            aria-hidden="true"
          >
            <div className="w-full max-w-md bg-surface border border-border rounded-xl p-6 shadow-md relative">
              {/* Mock Header */}
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-status-error/80" />
                  <div className="w-3 h-3 rounded-full bg-status-warning/80" />
                  <div className="w-3 h-3 rounded-full bg-status-success/80" />
                  <span className="text-xs font-mono font-bold text-foreground-muted ml-2">
                    CSAT Mock Assessment
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-surface-elevated border border-border text-[11px] font-mono text-primary">
                  <Clock className="w-3 h-3" />
                  <span>45:20 Remaining</span>
                </div>
              </div>

              {/* Mock Question Preview */}
              <div className="py-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">
                    Question 04 of 50
                  </span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-surface-elevated border border-border text-foreground-muted">
                    Quantitative Aptitude
                  </span>
                </div>
                <p className="text-sm font-semibold text-foreground leading-snug mb-4">
                  Which principle ensures that a candidate can navigate interactive assessment controls using sequential Tab keys without losing focus context?
                </p>

                {/* Options List */}
                <div className="flex flex-col gap-2">
                  <div className="p-2.5 rounded-md border border-border bg-surface-elevated flex items-center justify-between text-xs text-foreground">
                    <span className="font-medium">A. Non-disabling visible focus outlines</span>
                    <span className="text-[10px] font-mono font-bold text-status-success bg-status-success-bg px-1.5 py-0.5 rounded border border-status-success">
                      Selected
                    </span>
                  </div>
                  <div className="p-2.5 rounded-md border border-border bg-surface flex items-center text-xs text-foreground-secondary">
                    <span>B. Mouse-hover only popups</span>
                  </div>
                  <div className="p-2.5 rounded-md border border-border bg-surface flex items-center text-xs text-foreground-secondary">
                    <span>C. Image-only questions without alt text</span>
                  </div>
                </div>
              </div>

              {/* Mock Action Bar */}
              <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-foreground-muted">
                  <Volume2 className="w-3.5 h-3.5 text-primary" />
                  <span>TTS Audio Ready</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded bg-primary text-primary-contrast font-bold text-xs">
                    Save & Next
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
