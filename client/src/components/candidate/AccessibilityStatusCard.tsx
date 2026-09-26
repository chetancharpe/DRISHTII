import React from 'react';
import { useAccessibility } from '../../hooks/useAccessibility';
import { Sliders, Type, SunDim, Volume2, Keyboard, ArrowRight } from 'lucide-react';
import { Button } from '../common/Button';

export interface AccessibilityStatusCardProps {
  className?: string;
}

export const AccessibilityStatusCard: React.FC<AccessibilityStatusCardProps> = ({
  className = '',
}) => {
  const { preferences, openCalibration } = useAccessibility();

  const activeSpecs = [
    {
      label: 'Text Scale',
      val: preferences.fontSize.charAt(0).toUpperCase() + preferences.fontSize.slice(1),
      icon: <Type className="w-4 h-4 text-primary" aria-hidden="true" />,
    },
    {
      label: 'Contrast',
      val: preferences.contrast === 'high' ? 'High Contrast' : 'Standard',
      icon: <SunDim className="w-4 h-4 text-primary" aria-hidden="true" />,
    },
    {
      label: 'Audio Feedback',
      val: preferences.audioEnabled ? 'Active Voice' : 'Off (Screen Reader)',
      icon: <Volume2 className="w-4 h-4 text-primary" aria-hidden="true" />,
    },
    {
      label: 'Navigation',
      val: preferences.keyboardFirst ? 'Keyboard-First' : 'Standard Pointer',
      icon: <Keyboard className="w-4 h-4 text-primary" aria-hidden="true" />,
    },
  ];

  return (
    <section
      aria-labelledby="accessibility-status-heading"
      className={`rounded-xl border border-border bg-surface p-5 sm:p-6 shadow-sm flex flex-col gap-4 text-foreground ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
          <h2 id="accessibility-status-heading" className="text-base sm:text-lg font-bold text-foreground">
            Your Accessibility Settings
          </h2>
        </div>
        <span className="text-xs text-foreground-muted">
          Active Device Calibration
        </span>
      </div>

      <p className="text-xs text-foreground-secondary leading-relaxed">
        GoWow dynamically tailors typography scaling, high contrast borders, and keyboard shortcuts to match your personal requirements.
      </p>

      {/* 4 Specifications */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {activeSpecs.map((spec, i) => (
          <div
            key={i}
            className="p-3 rounded-lg border border-border bg-surface-elevated/40 flex flex-col gap-1.5"
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground-muted">
              {spec.icon}
              <span>{spec.label}</span>
            </div>
            <span className="text-xs sm:text-sm font-bold text-foreground">
              {spec.val}
            </span>
          </div>
        ))}
      </div>

      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-border">
        <span className="text-xs text-foreground-muted">
          Adjust sensory and motor preferences anytime using <kbd className="px-1.5 py-0.5 rounded border border-border bg-surface-elevated font-mono font-bold text-primary">Alt+A</kbd>
        </span>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={openCalibration}
          iconRight={<ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />}
          aria-label="Open Accessibility Calibration Center to change settings"
        >
          Change Settings
        </Button>
      </div>
    </section>
  );
};
