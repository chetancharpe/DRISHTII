import React from 'react';
import { useAccessibility } from '../../hooks/useAccessibility';
import { ReducedMotionOption } from '../../types/accessibility';
import { Activity, Check } from 'lucide-react';

export interface ReducedMotionControlProps {
  className?: string;
}

export const ReducedMotionControl: React.FC<ReducedMotionControlProps> = ({ className = '' }) => {
  const { preferences, updatePreference, announce } = useAccessibility();

  const handleSelect = (val: ReducedMotionOption) => {
    updatePreference('reducedMotion', val);
    announce(`Reduced motion preference set to ${val}.`);
  };

  const options: { value: ReducedMotionOption; label: string; desc: string }[] = [
    {
      value: 'system',
      label: 'Follow System',
      desc: 'Matches your OS accessibility motion preference automatically.',
    },
    {
      value: 'on',
      label: 'On (Reduced Motion)',
      desc: 'Disables transitions and animations to prevent visual vestibular discomfort.',
    },
    {
      value: 'off',
      label: 'Off (Full Motion)',
      desc: 'Enables fluid micro-animations and smooth page transitions.',
    },
  ];

  return (
    <section
      aria-labelledby="reduced-motion-heading"
      className={`flex flex-col gap-3 py-3 border-b border-border ${className}`}
    >
      <div className="flex items-center gap-2">
        <Activity className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
        <h3 id="reduced-motion-heading" className="text-sm font-bold text-foreground">
          Reduced Motion
        </h3>
      </div>
      <p className="text-xs text-foreground-secondary leading-relaxed">
        Eliminates fast transitions, moving backgrounds, and decorative effects to support vestibular health.
      </p>

      <fieldset className="border-0 p-0 m-0">
        <legend className="sr-only">Choose motion setting</legend>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-1" role="radiogroup">
          {options.map((opt) => {
            const isSelected = preferences.reducedMotion === opt.value;
            const inputId = `motion-opt-${opt.value}`;

            return (
              <label
                key={opt.value}
                htmlFor={inputId}
                className={`
                  relative flex flex-col justify-between p-3.5 rounded-lg border-2 cursor-pointer
                  transition-all select-none min-h-[76px]
                  ${
                    isSelected
                      ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary'
                      : 'border-border bg-surface hover:bg-surface-elevated hover:border-border-strong'
                  }
                `.trim()}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id={inputId}
                    name="reduced-motion-group"
                    value={opt.value}
                    checked={isSelected}
                    onChange={() => handleSelect(opt.value)}
                    className="sr-only"
                  />
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      isSelected ? 'border-primary bg-primary' : 'border-border-strong bg-surface'
                    }`}
                    aria-hidden="true"
                  >
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <span className="text-xs font-bold text-foreground">
                    {opt.label}
                  </span>
                </div>
                <p className="text-xs text-foreground-muted mt-2 pl-6">
                  {opt.desc}
                </p>
                {isSelected && (
                  <div className="mt-2 pl-6 flex items-center gap-1 text-[11px] font-semibold text-primary">
                    <Check className="w-3 h-3" aria-hidden="true" />
                    <span>Selected</span>
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
