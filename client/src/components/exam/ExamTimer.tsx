import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { useAccessibility } from '../../contexts/AccessibilityContext';

interface ExamTimerProps {
  serverEndTime: number;
  onExpire: () => void;
  className?: string;
}

export const ExamTimer: React.FC<ExamTimerProps> = ({
  serverEndTime,
  onExpire,
  className = '',
}) => {
  const { preferences, announce } = useAccessibility();
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => {
    return Math.max(0, Math.floor((serverEndTime - Date.now()) / 1000));
  });

  const lastAnnouncedMilestoneRef = useRef<number | null>(null);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  // Recalculate remaining time every 1 second based on authoritative server timestamp
  useEffect(() => {
    const updateTimer = () => {
      const remaining = Math.max(0, Math.floor((serverEndTime - Date.now()) / 1000));
      setRemainingSeconds(remaining);

      if (remaining <= 0) {
        onExpireRef.current();
        return;
      }

      // Check for accessible announcements based on candidate preferences
      const minutesRemaining = Math.floor(remaining / 60);
      const secondsInMinute = remaining % 60;

      if (secondsInMinute === 0 && lastAnnouncedMilestoneRef.current !== minutesRemaining) {
        lastAnnouncedMilestoneRef.current = minutesRemaining;

        const isWarningMilestone =
          minutesRemaining === 30 ||
          minutesRemaining === 10 ||
          minutesRemaining === 5 ||
          minutesRemaining === 1;

        if (preferences.timerAnnouncements === 'regular') {
          if (minutesRemaining > 0 && minutesRemaining % 5 === 0) {
            announce(`${minutesRemaining} minutes remaining in examination.`);
          } else if (minutesRemaining === 1) {
            announce('1 minute remaining in examination. Prepare to submit.');
          }
        } else if (preferences.timerAnnouncements === 'warnings') {
          if (isWarningMilestone) {
            announce(`Notice: ${minutesRemaining} minute${minutesRemaining > 1 ? 's' : ''} remaining in examination.`);
          }
        }
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [serverEndTime, preferences.timerAnnouncements, announce]);

  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  // Accessible verbal string for screen readers
  const accessibleTimeText = useMemo(() => {
    const parts: string[] = [];
    if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
    if (minutes > 0 || hours > 0) parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
    parts.push(`${seconds} second${seconds !== 1 ? 's' : ''}`);
    return `Time remaining: ${parts.join(', ')}`;
  }, [hours, minutes, seconds]);

  const isLowTime = remainingSeconds > 0 && remainingSeconds <= 300; // Under 5 minutes

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-colors ${
        isLowTime
          ? 'bg-danger/10 border-danger/40 text-danger'
          : 'bg-surface-elevated border-border text-foreground'
      } ${className}`}
      role="timer"
      aria-label={accessibleTimeText}
      aria-live="off"
    >
      {isLowTime ? (
        <AlertTriangle className="w-4 h-4 text-danger flex-shrink-0" aria-hidden="true" />
      ) : (
        <Clock className="w-4 h-4 text-primary flex-shrink-0" aria-hidden="true" />
      )}

      <span className="tabular-nums tracking-wide">
        {hours > 0 ? `${pad(hours)}:` : ''}
        {pad(minutes)}:{pad(seconds)}
      </span>

      {isLowTime && (
        <span className="hidden sm:inline text-[10px] font-sans font-extrabold uppercase px-1.5 py-0.5 rounded bg-danger/20 text-danger border border-danger/30">
          5m Warning
        </span>
      )}
    </div>
  );
};
