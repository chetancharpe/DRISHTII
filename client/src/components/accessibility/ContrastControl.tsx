import React from 'react';
import { useAccessibility } from '../../hooks/useAccessibility';
import { ContrastOption } from '../../types/accessibility';
import { SunDim, Check } from 'lucide-react';

export interface ContrastControlProps {
  className?: string;
}

export const ContrastControl: React.FC<ContrastControlProps> = ({ className = '' }) => {
  const { preferences, updatePreference, announce } = useAccessibility();

  const handleSelect = (contrast: ContrastOption) => {
    updatePreference('contrast', contrast);
    announce(contrast === 'high' ? 'High contrast mode enabled.' : 'Standard contrast restored.');
  };

  const options: { value: ContrastOption; title: string; badge: string; desc: string }[] = [
    {
      value: 'standard',
      title: 'Standard Contrast',
      badge: 'WCAG AA Compliant',
      desc: 'Balanced color palette optimized for low visual fatigue during extended study sessions.',
    },
    {
      value: 'high',
      title: 'High Contrast',
      badge: 'WCAG AAA (7:1+)',
      desc: 'High contrast increases the distinction between text, controls, and backgrounds using pure black backgrounds, neon yellow accents, and 2px borders.',
    },
  ];

  return (
    <section
      aria-labelledby="contrast-heading"
      className={`flex flex-col gap-3 py-3 border-b border-border ${className}`}
    >
      <div className="flex items-center gap-2">
        <SunDim className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
        <h3 id="contrast-heading" className="text-sm font-bold text-foreground">
          Contrast Mode
        </h3>
      </div>
      <p className="text-xs text-foreground-secondary leading-relaxed">
        High contrast increases the distinction between text, controls, and backgrounds. The change is reflected immediately.
      </p>

      <fieldset className="border-0 p-0 m-0">
        <legend className="sr-only">Select contrast preference</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1" role="radiogroup">
          {options.map((opt) => {
            const isSelected = preferences.contrast === opt.value;
            const inputId = `contrast-opt-${opt.value}`;

            return (
              <label
                key={opt.value}
                htmlFor={inputId}
                className={`
                  relative flex flex-col justify-between p-4 rounded-lg border-2 cursor-pointer
                  transition-all select-none min-h-[90px]
                  ${
                    isSelected
                      ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary'
                      : 'border-border bg-surface hover:bg-surface-elevated hover:border-border-strong'
                  }
                `.trim()}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id={inputId}
                      name="contrast-selection"
                      value={opt.value}
                      checked={isSelected}
                      onChange={() => handleSelect(opt.value)}
                      className="sr-only"
                    />
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        isSelected ? 'border-primary bg-primary text-primary-contrast' : 'border-border-strong bg-surface'
                      }`}
                      aria-hidden="true"
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <span className="text-sm font-bold text-foreground">
                      {opt.title}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-surface-elevated border border-border text-foreground-muted">
                    {opt.badge}
                  </span>
                </div>
                <p className="text-xs text-foreground-muted mt-2 pl-6">
                  {opt.desc}
                </p>
                {isSelected && (
                  <div className="mt-3 pl-6 flex items-center gap-1.5 text-xs font-semibold text-primary">
                    <Check className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Active contrast profile</span>
                  </div>
                )}
              </label>
            );
          })}
        </div>
      </fieldset>
    </section>
  );
};
