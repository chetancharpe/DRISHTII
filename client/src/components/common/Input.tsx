import React, { useId, useState } from 'react';
import { Eye, EyeOff, Search, XCircle, AlertCircle, CheckCircle2 } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  successMessage?: string;
  required?: boolean;
  prefixIcon?: React.ReactNode;
  isSearch?: boolean;
  onClearSearch?: () => void;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  successMessage,
  required = false,
  id,
  type = 'text',
  className = '',
  disabled,
  prefixIcon,
  isSearch = false,
  onClearSearch,
  value,
  ...props
}) => {
  const generatedId = useId();
  const inputId = id || generatedId;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;
  const successId = `${inputId}-success`;

  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const effectiveType = isPassword ? (showPassword ? 'text' : 'password') : type;

  const hasError = Boolean(error);
  const hasSuccess = Boolean(successMessage) && !hasError;

  // Build aria-describedby references
  const descriptionIds: string[] = [];
  if (hasError) descriptionIds.push(errorId);
  if (hasSuccess) descriptionIds.push(successId);
  if (helperText) descriptionIds.push(helperId);
  const ariaDescribedBy = descriptionIds.join(' ') || undefined;

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-semibold text-foreground flex items-center justify-between"
        >
          <span className="flex items-center gap-1">
            {label}
            {required && (
              <span className="text-status-error font-bold" aria-hidden="true">
                *
              </span>
            )}
          </span>
          {required && (
            <span className="text-xs font-normal text-foreground-muted">
              Required
            </span>
          )}
        </label>
      )}

      <div className="relative flex items-center">
        {/* Leading icon or search icon */}
        {(prefixIcon || isSearch) && (
          <span
            className="absolute left-3 text-foreground-muted pointer-events-none flex items-center"
            aria-hidden="true"
          >
            {prefixIcon || <Search className="w-4 h-4" />}
          </span>
        )}

        <input
          id={inputId}
          type={effectiveType}
          required={required}
          disabled={disabled}
          value={value}
          aria-invalid={hasError ? 'true' : 'false'}
          aria-describedby={ariaDescribedBy}
          className={`
            w-full rounded-md border bg-surface text-foreground text-base
            min-h-[44px] py-2 transition-colors duration-fast
            placeholder:text-foreground-muted
            disabled:opacity-50 disabled:cursor-not-allowed
            ${prefixIcon || isSearch ? 'pl-9' : 'pl-3.5'}
            ${isPassword || (isSearch && value) ? 'pr-11' : 'pr-3.5'}
            ${hasError ? 'border-status-error focus-visible:!outline-status-error' : hasSuccess ? 'border-status-success' : 'border-border'}
            ${className}
          `.trim()}
          {...props}
        />

        {/* Action button inside input: password reveal or search clear */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            disabled={disabled}
            aria-label={showPassword ? 'Hide password text' : 'Show password text'}
            className="absolute right-2.5 p-1.5 text-foreground-muted hover:text-foreground rounded focus-visible:outline-none"
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" aria-hidden="true" />
            ) : (
              <Eye className="w-4 h-4" aria-hidden="true" />
            )}
          </button>
        )}

        {isSearch && Boolean(value) && onClearSearch && (
          <button
            type="button"
            onClick={onClearSearch}
            disabled={disabled}
            aria-label="Clear search input"
            className="absolute right-2.5 p-1.5 text-foreground-muted hover:text-foreground rounded focus-visible:outline-none"
          >
            <XCircle className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Dynamic Validation Error (Live Region Alert) */}
      {hasError && (
        <div
          id={errorId}
          role="alert"
          aria-live="polite"
          className="text-xs font-semibold text-status-error flex items-center gap-1.5 mt-0.5"
        >
          <AlertCircle className="w-4 h-4 shrink-0 text-status-error" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {/* Success Notification */}
      {hasSuccess && (
        <div
          id={successId}
          role="status"
          className="text-xs font-semibold text-status-success flex items-center gap-1.5 mt-0.5"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0 text-status-success" aria-hidden="true" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Informative Helper Text */}
      {!hasError && !hasSuccess && helperText && (
        <div id={helperId} className="text-xs text-foreground-muted mt-0.5">
          {helperText}
        </div>
      )}
    </div>
  );
};
