import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatsCard } from '../../components/dashboard/StatsCard';
import { ProgressChart } from '../../components/dashboard/ProgressChart';
import { WeakTopicCard } from '../../components/dashboard/WeakTopicCard';
import { MOCK_ANALYTICS } from '../../utils/mockData';

export const ResultsPage: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      <Card title="Assessment Results & Psychometric Score" subtitle="Certified examination evaluation and performance parity breakdown">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 my-3">
          <StatsCard label="Total Score" value={`${MOCK_ANALYTICS.score} / 100`} icon="🏆" />
          <StatsCard label="Accuracy" value={`${MOCK_ANALYTICS.accuracy}%`} icon="🎯" />
          <StatsCard label="Correct Items" value={MOCK_ANALYTICS.correct} icon="✅" />
          <StatsCard label="Incorrect Items" value={MOCK_ANALYTICS.incorrect} icon="❌" />
        </div>

        <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-border">
          <Link to="/candidate/practice">
            <Button variant="primary">Practice Recommended Weak Topics →</Button>
          </Link>
          <Link to="/candidate/dashboard">
            <Button variant="secondary">Return to Dashboard</Button>
          </Link>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ProgressChart scores={MOCK_ANALYTICS.subjectPerformance} />
        <WeakTopicCard weakTopics={MOCK_ANALYTICS.weakTopics} />
      </div>
    </div>
  );
};
