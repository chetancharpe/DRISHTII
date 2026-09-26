import React from 'react';
import { Card } from '../../components/common/Card';
import { AnalyticsCard } from '../../components/examiner/AnalyticsCard';

export const AnalyticsPage: React.FC = () => {
  return (
    <div className="flex flex-col gap-6">
      <Card title="Psychometric Item Parity & Analytics" subtitle="Item discrimination indices, differential item functioning (DIF), and distractor effectiveness">
        <p className="text-sm text-foreground-muted mb-4">
          Examiner Analytics Page Placeholder: Guarantees that visual questions converted to sonified and text descriptions deliver identical psychometric difficulty.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <AnalyticsCard title="Differential Item Functioning (DIF)" metric="0.02" note="Well below 0.10 parity threshold" />
          <AnalyticsCard title="Average Item Discrimination" metric="0.44" note="High psychometric reliability" />
          <AnalyticsCard title="Overall Reliability (Cronbach α)" metric="0.91" note="High test consistency" />
        </div>
      </Card>
    </div>
  );
};
