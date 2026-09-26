import React from 'react';
import { Card } from '../../components/common/Card';
import { AccessibilityPanel } from '../../components/accessibility/AccessibilityPanel';

export const AccessibilityPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-8 flex flex-col gap-6">
      <Card title="Accessibility Commitment & Guidance" subtitle="Architectural compliance standards and assistive technology compatibility">
        <p className="text-foreground leading-relaxed">
          Accessibility Page Placeholder: Outlines semantic HTML architecture, zero-focus suppression rules, keyboard navigation models, and screen-reader compatibility standards.
        </p>
      </Card>
      <AccessibilityPanel />
    </div>
  );
};
