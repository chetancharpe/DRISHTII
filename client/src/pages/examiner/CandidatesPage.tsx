import React from 'react';
import { Card } from '../../components/common/Card';

export const CandidatesPage: React.FC = () => {
  return (
    <div className="flex flex-col gap-6">
      <Card title="Candidate Cohort Directory" subtitle="Inspect enrolled candidates, verified accommodations, and exam session eligibility">
        <p className="text-sm text-foreground-muted">
          Candidates Page Placeholder: Manage cohort rosters, verify disability documentation, and assign accessibility accommodations.
        </p>
      </Card>
    </div>
  );
};
