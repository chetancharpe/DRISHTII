import React from 'react';
import { Card } from '../common/Card';

export interface AnalyticsCardProps {
  title?: string;
  metric?: string | number;
  note?: string;
}

export const AnalyticsCard: React.FC<AnalyticsCardProps> = ({
  title = 'Cohort Completion Rate',
  metric = '94.8%',
  note = 'Empirical baseline parity across candidate groups',
}) => {
  return (
    <Card className="flex flex-col gap-1">
      <div className="text-xs uppercase font-bold text-foreground-muted">{title}</div>
      <div className="text-2xl font-extrabold text-foreground mt-1">{metric}</div>
      <div className="text-xs text-foreground-muted mt-0.5">{note}</div>
    </Card>
  );
};
