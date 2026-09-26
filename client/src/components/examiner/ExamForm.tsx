import React from 'react';
import { Card } from '../common/Card';
import { Input } from '../common/Input';
import { Button } from '../common/Button';

export const ExamForm: React.FC = () => {
  return (
    <Card title="Exam Authoring Specification" subtitle="Configure title, duration, and accessibility gating">
      <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
        <Input label="Examination Title" placeholder="e.g. UPSC General Studies Mock 2026" required />
        <Input label="Duration (Minutes)" type="number" placeholder="120" required />
        <Input label="Category / Department" placeholder="Competitive Public Service" />
        <Button variant="primary" type="submit">
          Save Examination Metadata (Placeholder)
        </Button>
      </form>
    </Card>
  );
};
