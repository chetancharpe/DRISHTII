import React from 'react';
import { AlertTriangle, RotateCcw, ArrowLeft } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  whatHappened: string;
  whatYouCanDo?: string;
  onRetry?: () => void;
  onGoBack?: () => void;
  errorCode?: string | number;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  whatHappened,
  whatYouCanDo = 'Please check your connection and try again. If the issue persists, your test answers are auto-saved locally.',
  onRetry,
  onGoBack,
  errorCode,
  className = '',
}) => {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`
        flex flex-col items-center justify-center text-center p-8 md:p-12
        rounded-lg border border-status-error/40 bg-status-error-bg/30
        max-w-xl mx-auto my-6 text-foreground ${className}
      `.trim()}
    >
      <div
        className="w-14 h-14 rounded-full bg-status-error-bg border border-status-error flex items-center justify-center text-status-error mb-4"
        aria-hidden="true"
      >
        <AlertTriangle className="w-7 h-7 stroke-[2.25]" />
      </div>

      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-xl font-bold text-foreground">{title}</h3>
        {errorCode && (
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-surface border border-border text-foreground-muted">
            Code: {errorCode}
          </span>
        )}
      </div>

      <div className="bg-surface/80 rounded-md border border-border p-4 my-4 text-left w-full">
        <div className="mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-foreground-muted block mb-1">
            What happened:
          </span>
          <p className="text-sm text-foreground">{whatHappened}</p>
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-foreground-muted block mb-1">
            What you can do:
          </span>
          <p className="text-sm text-foreground-secondary">{whatYouCanDo}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
        {onRetry && (
          <Button
            variant="primary"
            onClick={onRetry}
            icon={<RotateCcw className="w-4 h-4" />}
          >
            Try Again
          </Button>
        )}
        {onGoBack && (
          <Button
            variant="outline"
            onClick={onGoBack}
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            Go Back
          </Button>
        )}
      </div>
    </div>
  );
};
