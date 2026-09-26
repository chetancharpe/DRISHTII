import React, { useEffect, useState, useRef } from 'react';
import { Clock, AlertTriangle, Pause, Play } from 'lucide-react';
import { useAccessibility } from '../../contexts/AccessibilityContext';

interface PracticeTimerProps {
  initialSeconds: number;
  isPaused: boolean;
  onTimeExpired?: () => void;
  onTogglePause?: () => void;
  onTick?: (elapsedSeconds: number) => void;
}

export const PracticeTimer: React.FC<PracticeTimerProps> = ({
  initialSeconds,
  isPaused,
  onTimeExpired,
  onTogglePause,
  onTick,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(initialSeconds);
  const elapsedRef = useRef(0);
  const { announce, preferences } = useAccessibility();
  const announcedWarningRef = useRef<boolean>(false);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onTimeExpired?.();
          return 0;
        }
        return prev - 1;
      });

      elapsedRef.current += 1;
      onTick?.(elapsedRef.current);
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, onTimeExpired, onTick]);

  // Handle low-time announcements without flashing
  useEffect(() => {
    if (secondsRemaining <= 120 && secondsRemaining > 115 && !announcedWarningRef.current) {
      announcedWarningRef.current = true;
      if (preferences.timerAnnouncements !== 'off') {
        announce('Notice: 2 minutes remaining in practice session.', 'polite');
      }
    }
  }, [secondsRemaining, preferences.timerAnnouncements, announce]);

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  const accessibleSpokenTime = `${minutes} minute${minutes !== 1 ? 's' : ''} ${seconds} second${seconds !== 1 ? 's' : ''} remaining`;

  const isLowTime = secondsRemaining <= 120 && secondsRemaining > 0;

  return (
    <div
      role="timer"
      aria-label={`Practice session timer: ${accessibleSpokenTime}`}
      className={`inline-flex items-center gap-2.5 px-3 py-1.5 rounded-lg border text-xs font-semibold ${
        isLowTime
          ? 'bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-400'
          : 'bg-surface border-border text-foreground'
      }`}
    >
      {isLowTime ? (
        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
      ) : (
        <Clock className="w-3.5 h-3.5 text-foreground-muted flex-shrink-0" aria-hidden="true" />
      )}

      <div className="flex flex-col">
        <span className="font-mono font-bold text-xs tracking-wide">
          {formattedTime}
        </span>
        <span className="sr-only">{accessibleSpokenTime}</span>
      </div>

      {isLowTime && (
        <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 px-1 rounded">
          Low Time
        </span>
      )}

      {onTogglePause && (
        <button
          type="button"
          onClick={onTogglePause}
          className="ml-1 p-1 rounded hover:bg-surface-elevated text-foreground-secondary hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[28px] min-w-[28px] inline-flex items-center justify-center"
          aria-label={isPaused ? 'Resume practice timer' : 'Pause practice timer'}
        >
          {isPaused ? (
            <Play className="w-3 h-3 fill-current" aria-hidden="true" />
          ) : (
            <Pause className="w-3 h-3" aria-hidden="true" />
          )}
        </button>
      )}
    </div>
  );
};
