import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger'
  | 'success'
  | 'icon'
  | 'link';

export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  isLoading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  'aria-label'?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  loadingText,
  icon,
  iconRight,
  className = '',
  disabled,
  type = 'button',
  'aria-label': ariaLabel,
  ...props
}) => {
  // WCAG 2.5.5 / 2.5.8 Target Size: Ensure min 44px height for interactive targets
  const sizeStyles: Record<ButtonSize, string> = {
    sm: 'text-sm px-3.5 py-2 min-h-[44px] gap-1.5',
    md: 'text-base px-4 py-2.5 min-h-[44px] gap-2',
    lg: 'text-lg px-6 py-3.5 min-h-[50px] gap-2.5',
  };

  // Base styles: predictable transitions, semantic borders, visible focus
  const baseStyles =
    'inline-flex items-center justify-center font-bold rounded-xl border select-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

  const variantStyles: Record<ButtonVariant, string> = {
    primary:
      'bg-gradient-to-r from-indigo-500 to-primary text-white border-transparent hover:from-indigo-600 hover:to-primary-hover active:from-indigo-700 active:to-primary-active shadow-sm hover:shadow-glow-primary',
    secondary:
      'bg-surface backdrop-blur-md text-secondary-text border-border hover:bg-surface-elevated hover:border-primary/40 shadow-sm',
    outline:
      'bg-surface/40 backdrop-blur-md text-foreground border-border-strong hover:bg-surface-elevated hover:border-primary/60 active:bg-surface',
    ghost:
      'bg-transparent text-foreground border-transparent hover:bg-surface-elevated hover:text-primary active:bg-surface',
    danger:
      'bg-status-error text-white border-transparent hover:opacity-90 active:opacity-100 shadow-sm',
    success:
      'bg-status-success text-white border-transparent hover:opacity-90 active:opacity-100 shadow-sm',
    icon:
      'p-2.5 min-w-[44px] min-h-[44px] rounded-xl bg-surface backdrop-blur-md text-foreground border-border hover:bg-surface-elevated hover:border-primary/40 active:bg-surface',
    link:
      'bg-transparent text-primary hover:underline underline-offset-4 border-transparent p-0 min-h-0 h-auto font-medium',
  };

  const isDisabled = disabled || isLoading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={isLoading}
      aria-disabled={isDisabled}
      aria-label={ariaLabel}
      className={`
        ${baseStyles}
        ${variant !== 'link' && variant !== 'icon' ? sizeStyles[size] : ''}
        ${variantStyles[variant]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `.trim()}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-current" aria-hidden="true" />
          <span>{loadingText || children || 'Loading...'}</span>
          <span className="sr-only">Loading, please wait</span>
        </>
      ) : (
        <>
          {icon && <span className="inline-flex shrink-0" aria-hidden="true">{icon}</span>}
          {children}
          {iconRight && <span className="inline-flex shrink-0" aria-hidden="true">{iconRight}</span>}
        </>
      )}
    </button>
  );
};
