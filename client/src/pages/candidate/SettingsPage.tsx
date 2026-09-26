import React from 'react';
import { Card } from '../../components/common/Card';
import { AccessibilityPanel } from '../../components/accessibility/AccessibilityPanel';
import { useAuth } from '../../hooks/useAuth';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <Card title="Candidate Preferences & Account Settings" subtitle="Persistent configuration for profile details and accessibility parameters">
        <div className="text-sm text-foreground my-2">
          <span>Logged in as: </span>
          <strong>{user?.name || 'Candidate'}</strong> ({user?.email})
        </div>
      </Card>
      <AccessibilityPanel />
    </div>
  );
};
