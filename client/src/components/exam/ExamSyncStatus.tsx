import React from 'react';
import { CheckCircle2, RefreshCw, CloudOff, AlertCircle } from 'lucide-react';
import { ExamSyncState } from '../../types/exam';

interface ExamSyncStatusProps {
  syncState: ExamSyncState;
  unsyncedCount: number;
  onRetrySync?: () => void;
  className?: string;
}

export const ExamSyncStatus: React.FC<ExamSyncStatusProps> = ({
  syncState,
  unsyncedCount,
  onRetrySync,
  className = '',
}) => {
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
        syncState === 'SYNCED'
          ? 'bg-success/10 border-success/30 text-success'
          : syncState === 'SAVING'
          ? 'bg-primary/10 border-primary/30 text-primary'
          : syncState === 'OFFLINE'
          ? 'bg-warning/10 border-warning/40 text-warning'
          : 'bg-danger/10 border-danger/40 text-danger'
      } ${className}`}
      role="status"
      aria-live="polite"
    >
      {syncState === 'SYNCED' && (
        <>
          <CheckCircle2 className="w-3.5 h-3.5 text-success" aria-hidden="true" />
          <span className="text-[11px]">Synced with Server</span>
        </>
      )}

      {syncState === 'SAVING' && (
        <>
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary" aria-hidden="true" />
          <span className="text-[11px]">Saving answer...</span>
        </>
      )}

      {syncState === 'OFFLINE' && (
        <>
          <CloudOff className="w-3.5 h-3.5 text-warning" aria-hidden="true" />
          <span className="text-[11px]">
            Offline ({unsyncedCount} pending)
          </span>
          {onRetrySync && (
            <button
              type="button"
              onClick={onRetrySync}
              className="ml-1 text-[10px] underline font-bold hover:text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-warning"
              aria-label="Retry server synchronization"
            >
              Retry
            </button>
          )}
        </>
      )}

      {syncState === 'SYNC_ERROR' && (
        <>
          <AlertCircle className="w-3.5 h-3.5 text-danger" aria-hidden="true" />
          <span className="text-[11px]">Sync failed</span>
          {onRetrySync && (
            <button
              type="button"
              onClick={onRetrySync}
              className="ml-1 text-[10px] underline font-bold hover:text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-danger"
              aria-label="Retry synchronizing answers"
            >
              Retry
            </button>
          )}
        </>
      )}
    </div>
  );
};
