import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '../common/Button';

export interface DashboardErrorStateProps {
  message?: string;
  onRetry: () => void;
  className?: string;
}

export const DashboardErrorState: React.FC<DashboardErrorStateProps> = ({
  message = "We couldn't load your preparation telemetry right now.",
  onRetry,
  className = '',
}) => {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`p-8 rounded-2xl border-2 border-status-error/40 bg-status-error/5 text-foreground flex flex-col items-center text-center gap-4 max-w-lg mx-auto my-12 ${className}`}
    >
      <div className="p-3 rounded-full bg-status-error/15 text-status-error">
        <AlertCircle className="w-8 h-8" aria-hidden="true" />
      </div>

      <div className="flex flex-col gap-1.5">
        <h2 className="text-lg font-bold text-foreground">
          Temporary Loading Interruption
        </h2>
        <p className="text-xs text-foreground-secondary leading-relaxed">
          {message} Please verify your connection or attempt to refresh your dashboard.
        </p>
      </div>

      <Button
        variant="primary"
        onClick={onRetry}
        icon={<RotateCcw className="w-4 h-4" aria-hidden="true" />}
        aria-label="Try loading candidate dashboard data again"
      >
        Try Again
      </Button>
    </div>
  );
};
