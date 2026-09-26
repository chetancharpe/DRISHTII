import React, { useId } from 'react';
import { AlertCircle } from 'lucide-react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  helperText,
  required = false,
  id,
  className = '',
  disabled,
  rows = 4,
  ...props
}) => {
  const generatedId = useId();
  const textareaId = id || generatedId;
  const errorId = `${textareaId}-error`;
  const helperId = `${textareaId}-helper`;

  const hasError = Boolean(error);
  const descriptionIds: string[] = [];
  if (hasError) descriptionIds.push(errorId);
  if (helperText) descriptionIds.push(helperId);
  const ariaDescribedBy = descriptionIds.join(' ') || undefined;

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={textareaId}
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

      <textarea
        id={textareaId}
        rows={rows}
        required={required}
        disabled={disabled}
        aria-invalid={hasError ? 'true' : 'false'}
        aria-describedby={ariaDescribedBy}
        className={`
          w-full rounded-md border bg-surface text-foreground text-base
          p-3 transition-colors duration-fast
          placeholder:text-foreground-muted
          disabled:opacity-50 disabled:cursor-not-allowed
          ${hasError ? 'border-status-error focus-visible:!outline-status-error' : 'border-border'}
          ${className}
        `.trim()}
        {...props}
      />

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

      {!hasError && helperText && (
        <div id={helperId} className="text-xs text-foreground-muted mt-0.5">
          {helperText}
        </div>
      )}
    </div>
  );
};
