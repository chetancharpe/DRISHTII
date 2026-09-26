import React from 'react';
import { Card } from '../../components/common/Card';

export const UsersPage: React.FC = () => {
  return (
    <div className="flex flex-col gap-6">
      <Card title="Global User Management" subtitle="Manage candidate, examiner, and administrative role assignments">
        <p className="text-sm text-foreground-muted">
          Admin Users Page Placeholder: RBAC role provisioning, institutional user invitations, and identity verification logs.
        </p>
      </Card>
    </div>
  );
};
