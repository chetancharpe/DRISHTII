import React, { useId } from 'react';

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  name: string;
  label: string;
  description?: string;
  options: RadioOption[];
  selectedValue?: string;
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  name,
  label,
  description,
  options,
  selectedValue,
  onChange,
  required = false,
  className = '',
}) => {
  const groupId = useId();
  const legendId = `${groupId}-legend`;
  const descId = `${groupId}-desc`;

  return (
    <fieldset
      className={`border-0 p-0 m-0 flex flex-col gap-2 ${className}`}
      aria-labelledby={legendId}
      aria-describedby={description ? descId : undefined}
    >
      <legend id={legendId} className="text-sm font-semibold text-foreground flex items-center gap-1 mb-1">
        {label}
        {required && <span className="text-status-error font-bold" aria-hidden="true">*</span>}
      </legend>

      {description && (
        <p id={descId} className="text-xs text-foreground-muted mb-2">
          {description}
        </p>
      )}

      <div className="flex flex-col gap-2">
        {options.map((opt) => {
          const optionId = `${groupId}-${opt.value}`;
          const isSelected = selectedValue === opt.value;

          return (
            <label
              key={opt.value}
              htmlFor={optionId}
              className={`
                flex items-start gap-3 p-3 rounded-md border cursor-pointer select-none transition-colors duration-fast
                ${isSelected ? 'bg-surface-elevated border-primary' : 'bg-surface border-border hover:bg-surface-elevated'}
                ${opt.disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `.trim()}
            >
              <div className="relative flex items-center justify-center pt-0.5">
                <input
                  id={optionId}
                  type="radio"
                  name={name}
                  value={opt.value}
                  checked={isSelected}
                  disabled={opt.disabled}
                  onChange={() => onChange(opt.value)}
                  className="peer sr-only"
                />
                <div className="w-5 h-5 rounded-full border border-border-strong bg-surface transition-colors duration-fast peer-checked:border-primary peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-focus flex items-center justify-center">
                  {isSelected && (
                    <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                  )}
                </div>
              </div>

              <div className="flex flex-col">
                <span className="text-sm font-semibold text-foreground">
                  {opt.label}
                </span>
                {opt.description && (
                  <span className="text-xs text-foreground-muted mt-0.5">
                    {opt.description}
                  </span>
                )}
              </div>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
};
