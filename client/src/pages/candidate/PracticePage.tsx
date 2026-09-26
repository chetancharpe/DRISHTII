import React from 'react';
import { Card } from '../../components/common/Card';
import { QuestionCard } from '../../components/exam/QuestionCard';
import { MOCK_QUESTIONS } from '../../utils/mockData';

export const PracticePage: React.FC = () => {
  return (
    <div className="flex flex-col gap-6">
      <Card title="Interactive Practice Learning Mode" subtitle="Untimed practice sessions with immediate step-by-step explanatory feedback">
        <p className="text-sm text-foreground-muted mb-4">
          Practice questions reinforce conceptual understanding without exam pressure.
        </p>
        <QuestionCard question={MOCK_QUESTIONS[0]} currentIndex={1} totalQuestions={10} />
      </Card>
    </div>
  );
};
