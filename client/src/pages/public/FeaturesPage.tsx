import React from 'react';
import { Card } from '../../components/common/Card';

export const FeaturesPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <Card title="Features Overview" subtitle="Core platform capabilities for accessible examinations">
        <p className="text-foreground leading-relaxed">
          Features Page Placeholder: Showcases sonified graphs, ClearSpeak spoken math formulas, server-synchronized accessible timers, and keyboard-first workflows.
        </p>
      </Card>
    </div>
  );
};
