import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sliders } from 'lucide-react';
import { Button } from '../common/Button';

export interface FinalCTASectionProps {
  onOpenAccessibility: () => void;
}

export const FinalCTASection: React.FC<FinalCTASectionProps> = ({ onOpenAccessibility }) => {
  return (
    <section
      aria-labelledby="final-cta-heading"
      className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-border"
    >
      <div className="rounded-2xl border border-border-strong bg-gradient-to-b from-surface-elevated to-surface p-8 sm:p-12 lg:p-16 text-center max-w-4xl mx-auto shadow-md">
        <h2 id="final-cta-heading" className="text-display font-extrabold text-foreground mb-4 tracking-tight">
          Start Preparing Without Barriers
        </h2>
        <p className="text-body-lg text-foreground-secondary max-w-xl mx-auto mb-8 leading-relaxed">
          Build your preparation journey around the way you learn. Experience an examination platform created for complete independence.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link to="/auth/role-selection" className="w-full sm:w-auto">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              iconRight={<ArrowRight className="w-5 h-5" />}
              className="shadow-md"
            >
              Get Started
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
      </div>
    </section>
  );
};
