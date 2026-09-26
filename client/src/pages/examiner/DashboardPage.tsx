import React from 'react';
import { Card } from '../../components/common/Card';
import { StatsCard } from '../../components/dashboard/StatsCard';
import { ExamTable } from '../../components/examiner/ExamTable';
import { AnalyticsCard } from '../../components/examiner/AnalyticsCard';
import { MOCK_EXAMS } from '../../utils/mockData';

export const DashboardPage: React.FC = () => {
  return (
    <div className="flex flex-col gap-6">
      <Card title="Examiner & Authoring Studio Dashboard" subtitle="Overview of created examinations, item health, and live candidate cohorts">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-2">
          <StatsCard label="Active Test Suites" value={MOCK_EXAMS.length} icon="📚" />
          <StatsCard label="Registered Candidates" value={42} icon="👥" />
          <StatsCard label="Accessibility Gate" value="100% PASS" icon="🛡️" />
          <StatsCard label="Completed Sessions" value={28} icon="✅" />
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ExamTable exams={MOCK_EXAMS} />
        </div>
        <div className="flex flex-col gap-4">
          <AnalyticsCard title="Screen Reader Pass Rate" metric="100%" note="All items verified with linear acoustic transcripts" />
          <AnalyticsCard title="Average Exam Duration" metric="54.2 mins" note="Sufficient buffer provided under WCAG AAA timing" />
        </div>
      </div>
    </div>
  );
};
