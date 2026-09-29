import React from 'react';
import { useAccessibility } from '../../hooks/useAccessibility';
import { FontSizeOption } from '../../types/accessibility';
import { Type } from 'lucide-react';

export interface FontSizeControlProps {
  showPreview?: boolean;
  className?: string;
}

export const FontSizeControl: React.FC<FontSizeControlProps> = ({
  showPreview = true,
  className = '',
}) => {
  const { preferences, updatePreference, announce } = useAccessibility();

  const options: { value: FontSizeOption; label: string; scale: string; desc: string }[] = [
    { value: 'default', label: 'Default', scale: '100%', desc: 'Standard 16px body text' },
    { value: 'large', label: 'Large', scale: '118%', desc: 'Enlarged text (~19px) for easier reading' },
    { value: 'extra-large', label: 'Extra Large', scale: '135%', desc: 'High visibility (~22px) scaling' },
    { value: 'maximum', label: 'Maximum', scale: '155%', desc: 'Maximum comfort (~25px) magnification' },
  ];

  const handleSelect = (val: FontSizeOption, label: string) => {
    updatePreference('fontSize', val);
    announce(`Text size changed to ${label}.`);
  };

  return (
    <section
      aria-labelledby="font-size-heading"
      className={`flex flex-col gap-3 py-3 border-b border-border ${className}`}
    >
      <div className="flex items-center gap-2">
        <Type className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
        <h3 id="font-size-heading" className="text-sm font-bold text-foreground">
          Text Size
        </h3>
      </div>
      <p className="text-xs text-foreground-secondary leading-relaxed">
        Choose a text size that is comfortable to read. DRISHTI scales content fluidly to prevent horizontal scrolling or cut-off text.
      </p>

      {/* Accessible Radio Selection Options */}
      <fieldset className="border-0 p-0 m-0">
        <legend className="sr-only">Choose comfortable text size option</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mt-1" role="radiogroup">
          {options.map((opt) => {
            const isSelected = preferences.fontSize === opt.value;
            const inputId = `font-size-opt-${opt.value}`;

            return (
              <label
                key={opt.value}
                htmlFor={inputId}
                className={`
                  relative flex flex-col justify-between p-3.5 rounded-lg border-2 cursor-pointer
                  transition-all select-none min-h-[64px]
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
                      name="font-size-selection"
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
                  <span className="text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded bg-surface-elevated border border-border text-foreground-muted">
                    {opt.scale}
                  </span>
                </div>
                <p className="text-xs text-foreground-muted mt-2 pl-6">
                  {opt.desc}
                </p>
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* Live Text Sample Preview */}
      {showPreview && (
        <div
          className="mt-2 p-4 rounded-lg border border-border bg-surface-elevated/70 flex flex-col gap-1.5"
          aria-label="Text size sample preview"
        >
          <span className="text-[11px] font-mono uppercase tracking-wider text-primary font-bold">
            Live Text Sizing Preview
          </span>
          <p className="text-foreground font-medium leading-relaxed">
            "Your preparation starts here."
          </p>
          <p className="text-xs text-foreground-muted leading-relaxed">
            Clear typography, balanced line heights, and ample tap targets ensure effortless navigation.
          </p>
        </div>
      )}
    </section>
  );
};
