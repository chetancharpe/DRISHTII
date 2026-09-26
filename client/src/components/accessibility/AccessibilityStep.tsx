import React from 'react';
import { Button } from '../common/Button';
import { ArrowLeft, ArrowRight, Check, Sliders } from 'lucide-react';

export interface AccessibilityStepProps {
  stepNumber: number;
  totalSteps: number;
  title: string;
  description: string;
  children: React.ReactNode;
  onBack?: () => void;
  onNext?: () => void;
  onSkip?: () => void;
  nextLabel?: string;
  isNextDisabled?: boolean;
  isLastStep?: boolean;
  className?: string;
}

export const AccessibilityStep: React.FC<AccessibilityStepProps> = ({
  stepNumber,
  totalSteps,
  title,
  description,
  children,
  onBack,
  onNext,
  onSkip,
  nextLabel,
  isNextDisabled = false,
  isLastStep = false,
  className = '',
}) => {
  return (
    <section
      aria-labelledby={`step-${stepNumber}-title`}
      className={`flex flex-col gap-6 w-full ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col gap-2 border-b border-border pb-5">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-surface-elevated text-xs font-semibold text-primary">
            <Sliders className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
            <span>
              Step {stepNumber} of {totalSteps}
            </span>
          </div>

          {onSkip && stepNumber < totalSteps && (
            <button
              type="button"
              onClick={onSkip}
              className="text-xs font-semibold text-foreground-muted hover:text-foreground underline underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded p-1"
              aria-label="Skip remaining accessibility configuration steps and continue with defaults"
            >
              Skip for Now
            </button>
          )}
        </div>

        <h2 id={`step-${stepNumber}-title`} className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
          {title}
        </h2>

        <p className="text-sm text-foreground-secondary leading-relaxed max-w-2xl">
          {description}
        </p>
      </div>

      {/* Main Step Body */}
      <div className="flex flex-col gap-4">
        {children}
      </div>

      {/* Action Footer Navigation */}
      <div className="flex items-center justify-between pt-6 border-t border-border mt-2">
        {onBack ? (
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            icon={<ArrowLeft className="w-4 h-4" aria-hidden="true" />}
            aria-label={`Go back to step ${stepNumber - 1}`}
          >
            Back
          </Button>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-3">
          {onNext && (
            <Button
              type="button"
              variant="primary"
              onClick={onNext}
              disabled={isNextDisabled}
              iconRight={
                isLastStep ? (
                  <Check className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                )
              }
              aria-label={nextLabel || (isLastStep ? 'Complete and save settings' : `Continue to step ${stepNumber + 1}`)}
            >
              {nextLabel || (isLastStep ? 'Complete Setup' : 'Continue')}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
};
