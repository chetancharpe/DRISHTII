import React from 'react';
import { Card } from '../../components/common/Card';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <Card title="About GoWow" subtitle="Our mission and commitment to equitable test-taking parity">
        <p className="text-foreground leading-relaxed">
          About Page Placeholder: Details our mission to eliminate visual discrimination in digital competitive examinations and provide rigorous accessibility for every candidate.
        </p>
      </Card>
    </div>
  );
};
