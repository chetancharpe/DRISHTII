import React from 'react';

export interface ExamTimerProps {
  remainingMinutes?: number;
}

export const ExamTimer: React.FC<ExamTimerProps> = ({ remainingMinutes = 60 }) => {
  return (
    <div
      role="timer"
      aria-live="polite"
      className="p-3 bg-surface-elevated border border-border rounded flex items-center justify-between text-foreground"
    >
      <span className="text-sm font-semibold">Remaining Time:</span>
      <span className="font-mono font-bold text-lg text-primary">{remainingMinutes}:00</span>
    </div>
  );
};
