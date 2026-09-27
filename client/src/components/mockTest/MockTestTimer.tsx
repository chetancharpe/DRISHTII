import React, { useEffect, useState, useRef } from 'react';
import { Clock, AlertTriangle, Pause, Play } from 'lucide-react';
import { useAccessibility } from '../../contexts/AccessibilityContext';

interface MockTestTimerProps {
  initialSeconds: number;
  isPaused: boolean;
  onTimeExpired: () => void;
  onTogglePause?: () => void;
  onTick?: (secondsRemaining: number) => void;
}

export const MockTestTimer: React.FC<MockTestTimerProps> = ({
  initialSeconds,
  isPaused,
  onTimeExpired,
  onTogglePause,
  onTick,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(initialSeconds);
  const { announce, preferences } = useAccessibility();
  const announcedMilestonesRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    setSecondsRemaining(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onTimeExpired();
          return 0;
        }
        const updated = prev - 1;
        onTick?.(updated);
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, onTimeExpired, onTick]);

  // Handle accessible announcements (30m, 10m, 5m, 1m) without flashing
  useEffect(() => {
    if (preferences.timerAnnouncements === 'off') return;

    const milestones = [
      { sec: 1800, text: '30 minutes remaining in mock examination.' },
      { sec: 600, text: '10 minutes remaining in mock examination.' },
      { sec: 300, text: '5 minutes remaining in mock examination.' },
      { sec: 60, text: '1 minute remaining in mock examination.' },
    ];

    milestones.forEach(({ sec, text }) => {
      if (
        secondsRemaining <= sec &&
        secondsRemaining > sec - 4 &&
        !announcedMilestonesRef.current.has(sec)
      ) {
        announcedMilestonesRef.current.add(sec);
        announce(text, 'polite');
      }
    });
  }, [secondsRemaining, preferences.timerAnnouncements, announce]);

  const hours = Math.floor(secondsRemaining / 3600);
  const minutes = Math.floor((secondsRemaining % 3600) / 60);
  const seconds = secondsRemaining % 60;

  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const formattedDigital = hours > 0 ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;

  const accessibleSpokenTime =
    hours > 0
      ? `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''} ${seconds} second${seconds !== 1 ? 's' : ''} remaining`
      : `${minutes} minute${minutes !== 1 ? 's' : ''} ${seconds} second${seconds !== 1 ? 's' : ''} remaining`;

  const isLowTime = secondsRemaining <= 300 && secondsRemaining > 0; // 5 mins

  return (
    <div
      role="timer"
      aria-label={`Time remaining: ${accessibleSpokenTime}`}
      className={`inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl border text-xs font-semibold ${
        isLowTime
          ? 'bg-amber-500/10 border-amber-500/50 text-amber-700 dark:text-amber-400'
          : 'bg-surface border-border text-foreground'
      }`}
    >
      {isLowTime ? (
        <AlertTriangle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
      ) : (
        <Clock className="w-4 h-4 text-foreground-muted flex-shrink-0" aria-hidden="true" />
      )}

      <div className="flex flex-col">
        <span className="font-mono text-sm font-bold tracking-wider">
          {formattedDigital}
        </span>
        <span className="sr-only">{accessibleSpokenTime}</span>
      </div>

      {isLowTime && (
        <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 px-1.5 py-0.5 rounded">
          Low Time
        </span>
      )}

      {onTogglePause && (
        <button
          type="button"
          onClick={onTogglePause}
          className="ml-1 p-1 rounded-md hover:bg-surface-elevated text-foreground-secondary hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[30px] min-w-[30px] inline-flex items-center justify-center transition-colors"
          aria-label={isPaused ? 'Resume examination timer' : 'Pause examination timer'}
        >
          {isPaused ? (
            <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
          ) : (
            <Pause className="w-3.5 h-3.5" aria-hidden="true" />
          )}
        </button>
      )}
    </div>
  );
};
