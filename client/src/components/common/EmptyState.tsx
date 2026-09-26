import React from 'react';
import { Inbox } from 'lucide-react';

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  secondaryAction,
  className = '',
}) => {
  return (
    <div
      role="region"
      aria-label={title}
      className={`
        flex flex-col items-center justify-center text-center p-8 md:p-12
        rounded-lg border border-dashed border-border bg-surface/50
        max-w-2xl mx-auto my-6 ${className}
      `.trim()}
    >
      <div
        className="w-14 h-14 rounded-full bg-surface-elevated border border-border flex items-center justify-center text-foreground-muted mb-4"
        aria-hidden="true"
      >
        {icon || <Inbox className="w-7 h-7" />}
      </div>

      <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-foreground-muted max-w-md mb-6 leading-relaxed">
        {description}
      </p>

      {(action || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
};
