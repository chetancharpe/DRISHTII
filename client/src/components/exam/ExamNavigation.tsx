import React from 'react';
import { Button } from '../common/Button';

export interface ExamNavigationProps {
  onPrev?: () => void;
  onNext?: () => void;
  onSubmit?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export const ExamNavigation: React.FC<ExamNavigationProps> = ({
  onPrev,
  onNext,
  onSubmit,
  hasPrev = true,
  hasNext = true,
}) => {
  return (
    <nav className="flex items-center justify-between gap-4 py-4" aria-label="Question Navigation Controls">
      <Button variant="secondary" onClick={onPrev} disabled={!hasPrev}>
        ← Previous [P]
      </Button>
      <div className="flex gap-2">
        <Button variant="secondary" onClick={onSubmit}>
          Review & Submit
        </Button>
        <Button variant="primary" onClick={onNext} disabled={!hasNext}>
          Next [N] →
        </Button>
      </div>
    </nav>
  );
};
