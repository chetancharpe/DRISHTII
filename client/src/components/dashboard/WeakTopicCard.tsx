import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../common/Card';
import { WeakTopic } from '../../types/analytics';

export interface WeakTopicCardProps {
  weakTopics?: WeakTopic[];
}

export const WeakTopicCard: React.FC<WeakTopicCardProps> = ({ weakTopics = [] }) => {
  return (
    <Card title="Discovered Weak Areas & Practice" subtitle="Targeted remediation modules to bridge performance gaps">
      <div className="flex flex-col gap-3">
        {weakTopics.map((wt) => (
          <div
            key={wt.topic}
            className="p-3 bg-surface-elevated rounded border-l-4 border-status-warning flex flex-col gap-1 text-xs"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-foreground">{wt.topic}</span>
              <span className="font-semibold text-status-warning">{wt.accuracyPercentage}% Accuracy</span>
            </div>
            <p className="text-foreground-muted">{wt.rationale}</p>
            {wt.recommendedPracticeUrl && (
              <Link
                to={wt.recommendedPracticeUrl}
                className="mt-1 font-bold text-primary hover:underline inline-block"
              >
                Begin Targeted Practice Session →
              </Link>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};
