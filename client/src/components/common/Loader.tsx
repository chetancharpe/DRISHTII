import React from 'react';
import { Loader2 } from 'lucide-react';

export interface LoaderProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  fullPage?: boolean;
}

export const Loader: React.FC<LoaderProps> = ({
  label = 'Loading content...',
  size = 'md',
  fullPage = false,
}) => {
  const sizeStyles = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const content = (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center p-6 gap-3 text-foreground"
    >
      <Loader2
        className={`${sizeStyles[size]} text-primary animate-spin`}
        aria-hidden="true"
      />
      <span className="text-sm font-medium text-foreground-muted">{label}</span>
      <span className="sr-only">{label}</span>
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-modal flex items-center justify-center bg-background/80 backdrop-blur-xs">
        {content}
      </div>
    );
  }

  return content;
};
