import React, { useId } from 'react';
import { Check } from 'lucide-react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  description?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  description,
  id,
  className = '',
  disabled,
  checked,
  ...props
}) => {
  const generatedId = useId();
  const checkboxId = id || generatedId;
  const descId = `${checkboxId}-desc`;

  return (
    <div className={`flex items-start gap-3 py-1 cursor-pointer select-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
      <div className="relative flex items-center justify-center min-h-[44px] min-w-[24px]">
        <input
          id={checkboxId}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          aria-describedby={description ? descId : undefined}
          className="peer sr-only"
          {...props}
        />
        <div className="w-5 h-5 rounded border border-border-strong bg-surface transition-colors duration-fast peer-checked:bg-primary peer-checked:border-primary peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-focus flex items-center justify-center">
          {checked && <Check className="w-3.5 h-3.5 text-primary-contrast stroke-[3]" aria-hidden="true" />}
        </div>
      </div>

      <div className="flex flex-col pt-2.5">
        <label htmlFor={checkboxId} className="text-sm font-semibold text-foreground cursor-pointer">
          {label}
        </label>
        {description && (
          <p id={descId} className="text-xs text-foreground-muted mt-0.5">
            {description}
          </p>
        )}
      </div>
    </div>
  );
};
