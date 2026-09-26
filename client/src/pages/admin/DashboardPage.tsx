import React from 'react';
import { Card } from '../../components/common/Card';
import { StatsCard } from '../../components/dashboard/StatsCard';

export const DashboardPage: React.FC = () => {
  return (
    <div className="flex flex-col gap-6">
      <Card title="System Administration Dashboard" subtitle="Platform health, organizational tenant management, and accessibility compliance auditing">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-2">
          <StatsCard label="Registered Users" value="1,240" icon="👤" />
          <StatsCard label="Testing Centers" value="18" icon="🏫" />
          <StatsCard label="Audited Sessions" value="5,820" icon="🔒" />
          <StatsCard label="Platform Uptime" value="99.98%" icon="⚡" />
        </div>
      </Card>
    </div>
  );
};
