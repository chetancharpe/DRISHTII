import React from 'react';
import { Card } from '../../components/common/Card';

export const ContactPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <Card title="Contact & Institutional Support" subtitle="Get in touch with accessibility coordinators and exam proctors">
        <p className="text-foreground leading-relaxed">
          Contact Page Placeholder: Help desk contact coordinates, accommodation request channels, and institutional support lines for testing centers.
        </p>
      </Card>
    </div>
  );
};
