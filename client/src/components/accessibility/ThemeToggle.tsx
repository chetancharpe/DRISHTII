import React from 'react';
import { useAccessibility } from '../../hooks/useAccessibility';
import { ThemeOption } from '../../types/accessibility';
import { Sun, Moon, Laptop, Palette, Check } from 'lucide-react';

export interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { preferences, updatePreference, announce, resolvedTheme } = useAccessibility();

  const handleSelect = (theme: ThemeOption, label: string) => {
    updatePreference('theme', theme);
    announce(`Theme changed to ${label}.`);
  };

  const options: { value: ThemeOption; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      value: 'light',
      label: 'Light',
      icon: <Sun className="w-4 h-4 text-status-warning" aria-hidden="true" />,
      desc: 'High legibility dark text on crisp paper-white backgrounds.',
    },
    {
      value: 'dark',
      label: 'Dark',
      icon: <Moon className="w-4 h-4 text-primary" aria-hidden="true" />,
      desc: 'Restful slate surfaces reducing eye fatigue in dim lighting.',
    },
    {
      value: 'system',
      label: 'System',
      icon: <Laptop className="w-4 h-4 text-foreground-muted" aria-hidden="true" />,
      desc: 'Synchronizes automatically with your device OS settings.',
    },
  ];

  return (
    <section
      aria-labelledby="theme-heading"
      className={`flex flex-col gap-3 py-3 border-b border-border ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
          <h3 id="theme-heading" className="text-sm font-bold text-foreground">
            Visual Theme
          </h3>
        </div>
        <span className="text-[11px] font-mono text-foreground-muted">
          Active: {resolvedTheme}
        </span>
      </div>
      <p className="text-xs text-foreground-secondary leading-relaxed">
        Choose the appearance that feels most comfortable. When System is selected, GoWow matches your operating system.
      </p>

      <fieldset className="border-0 p-0 m-0">
        <legend className="sr-only">Choose visual theme</legend>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-1" role="radiogroup">
          {options.map((opt) => {
            const isSelected = preferences.theme === opt.value;
            const inputId = `theme-opt-${opt.value}`;

            return (
              <label
                key={opt.value}
                htmlFor={inputId}
                className={`
                  relative flex flex-col justify-between p-3.5 rounded-lg border-2 cursor-pointer
                  transition-all select-none min-h-[80px]
                  ${
                    isSelected
                      ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary'
                      : 'border-border bg-surface hover:bg-surface-elevated hover:border-border-strong'
                  }
                `.trim()}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id={inputId}
                      name="theme-selection"
                      value={opt.value}
                      checked={isSelected}
                      onChange={() => handleSelect(opt.value, opt.label)}
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
                      {opt.label}
                    </span>
                  </div>
                  {opt.icon}
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
