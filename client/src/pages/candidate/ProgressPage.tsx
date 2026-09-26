import React from 'react';
import { Card } from '../../components/common/Card';
import { ProgressChart } from '../../components/dashboard/ProgressChart';
import { WeakTopicCard } from '../../components/dashboard/WeakTopicCard';
import { MOCK_ANALYTICS } from '../../utils/mockData';

export const ProgressPage: React.FC = () => {
  return (
    <div className="flex flex-col gap-6">
      <Card title="Candidate Longitudinal Telemetry" subtitle="Tracking historical performance, stamina metrics, and weak topic closure">
        <p className="text-sm text-foreground-muted mb-4">
          Historical analysis tracks empirical retention and conceptual accuracy across practice and live examination sessions.
        </p>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ProgressChart scores={MOCK_ANALYTICS.subjectPerformance} />
        <WeakTopicCard weakTopics={MOCK_ANALYTICS.weakTopics} />
      </div>
    </div>
  );
};
