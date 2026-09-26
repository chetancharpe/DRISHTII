import React from 'react';
import { Card } from '../../components/common/Card';
import { ExamCard } from '../../components/dashboard/ExamCard';
import { MOCK_EXAMS } from '../../utils/mockData';

export const MockTestsPage: React.FC = () => {
  return (
    <div className="flex flex-col gap-6">
      <Card title="Simulated Mock Examinations" subtitle="Full-length timed mock tests simulating certified proctored conditions">
        <p className="text-sm text-foreground-muted mb-4">
          Timed mock tests help gauge actual time management and stamina under realistic assessment conditions.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {MOCK_EXAMS.map((exam) => (
            <ExamCard key={exam.id} exam={exam} />
          ))}
        </div>
      </Card>
    </div>
  );
};
