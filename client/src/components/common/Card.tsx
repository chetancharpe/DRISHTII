import React from 'react';

export type CardVariant =
  | 'default'
  | 'elevated'
  | 'interactive'
  | 'exam'
  | 'statistics'
  | 'recommendation';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  badge?: React.ReactNode;
  headerAction?: React.ReactNode;
  footer?: React.ReactNode;
  variant?: CardVariant;
  as?: 'div' | 'section' | 'article';
  onCardClick?: () => void;
  interactiveLabel?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  badge,
  headerAction,
  footer,
  variant = 'default',
  as: Component = 'div',
  className = '',
  onCardClick,
  interactiveLabel,
  ...props
}) => {
  const isInteractive = variant === 'interactive' || Boolean(onCardClick);

  const baseStyles = 'rounded-2xl border text-foreground transition-all duration-200 overflow-hidden relative glass-specular';

  const variantStyles: Record<CardVariant, string> = {
    default: 'bg-surface backdrop-blur-xl border-border shadow-glass p-5 hover:border-border-strong/70',
    elevated: 'bg-surface-elevated backdrop-blur-2xl border-border-strong shadow-glass-elevated p-6',
    interactive:
      'bg-surface backdrop-blur-xl border-border hover:border-primary/60 hover:bg-surface-elevated hover:shadow-glow-primary hover:-translate-y-0.5 cursor-pointer shadow-glass p-5 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus',
    exam: 'bg-surface backdrop-blur-xl border-border shadow-glass p-5 flex flex-col justify-between hover:border-primary/50 hover:shadow-glow-cyan hover:-translate-y-0.5',
    statistics: 'bg-surface backdrop-blur-xl border-border shadow-glass p-5 flex flex-col hover:border-border-strong',
    recommendation: 'bg-surface backdrop-blur-xl border-border shadow-glass p-5 border-l-4 border-l-primary hover:border-primary/60',
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (isInteractive && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onCardClick?.();
    }
  };

  return (
    <Component
      tabIndex={isInteractive ? 0 : undefined}
      role={isInteractive ? 'button' : undefined}
      aria-label={isInteractive ? (interactiveLabel || title) : undefined}
      onClick={isInteractive ? onCardClick : undefined}
      onKeyDown={isInteractive ? handleKeyDown : undefined}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`.trim()}
      {...props}
    >
      {(title || subtitle || badge || headerAction) && (
        <div className="mb-4 pb-3 border-b border-border flex items-start justify-between gap-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              {title && (
                <h3 className="text-lg font-bold text-foreground tracking-tight">
                  {title}
                </h3>
              )}
              {badge && <span>{badge}</span>}
            </div>
            {subtitle && (
              <p className="text-sm text-foreground-muted mt-1 leading-snug">
                {subtitle}
              </p>
            )}
          </div>
          {headerAction && <div className="shrink-0">{headerAction}</div>}
        </div>
      )}

      <div className="flex-1">{children}</div>

      {footer && (
        <div className="mt-4 pt-3 border-t border-border flex items-center justify-between gap-3">
          {footer}
        </div>
      )}
    </Component>
  );
};
