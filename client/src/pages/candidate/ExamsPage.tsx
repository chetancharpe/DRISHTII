import React from 'react';
import { Card } from '../../components/common/Card';
import { ExamCard } from '../../components/dashboard/ExamCard';
import { MOCK_EXAMS } from '../../utils/mockData';

export const ExamsPage: React.FC = () => {
  return (
    <div className="flex flex-col gap-6">
      <Card title="Official Examination Library" subtitle="Live certified examination catalogs for UPSC, GRE, SAT, and institutional suites">
        <p className="text-sm text-foreground-muted mb-4">
          Select an assessment to review official instructions, duration requirements, and begin.
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
