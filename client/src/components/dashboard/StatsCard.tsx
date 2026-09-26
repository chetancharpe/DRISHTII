import React from 'react';
import { Card } from '../common/Card';

export interface StatsCardProps {
  label: string;
  value: string | number;
  description?: string;
  icon?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  label,
  value,
  description,
  icon = '📊',
}) => {
  return (
    <Card className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase font-bold text-foreground-muted tracking-wider">
          {label}
        </span>
        <span aria-hidden="true">{icon}</span>
      </div>
      <div className="text-2xl sm:text-3xl font-extrabold text-foreground mt-1">{value}</div>
      {description && <div className="text-xs text-foreground-muted mt-0.5">{description}</div>}
    </Card>
  );
};
