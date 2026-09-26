import React from 'react';
import { RecentActivityItem } from '../../types/candidateDashboard';
import { History, CheckCircle2, Award, BookOpen, BarChart3 } from 'lucide-react';

export interface RecentActivityTimelineProps {
  activities: RecentActivityItem[];
  className?: string;
}

export const RecentActivityTimeline: React.FC<RecentActivityTimelineProps> = ({
  activities,
  className = '',
}) => {
  const getActivityIcon = (type: RecentActivityItem['type']) => {
    switch (type) {
      case 'mock':
        return <Award className="w-4 h-4 text-status-warning" aria-hidden="true" />;
      case 'practice':
        return <CheckCircle2 className="w-4 h-4 text-status-success" aria-hidden="true" />;
      case 'review':
        return <BarChart3 className="w-4 h-4 text-primary" aria-hidden="true" />;
      default:
        return <BookOpen className="w-4 h-4 text-foreground-muted" aria-hidden="true" />;
    }
  };

  return (
    <section
      aria-labelledby="recent-activity-heading"
      className={`rounded-xl border border-border bg-surface p-5 sm:p-6 shadow-sm flex flex-col gap-4 text-foreground ${className}`}
    >
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
          <h2 id="recent-activity-heading" className="text-base sm:text-lg font-bold text-foreground">
            Recent Activity
          </h2>
        </div>
        <span className="text-xs text-foreground-muted">
          Latest Interactions
        </span>
      </div>

      <ul className="flex flex-col gap-3" role="list">
        {activities.map((item) => (
          <li
            key={item.id}
            className="flex items-start justify-between gap-3 p-3 rounded-lg border border-border/80 bg-surface-elevated/40"
          >
            <div className="flex items-start gap-2.5">
              <div className="p-1.5 rounded-md bg-surface border border-border shrink-0 mt-0.5">
                {getActivityIcon(item.type)}
              </div>
              <div className="flex flex-col">
                <span className="text-xs sm:text-sm font-semibold text-foreground">
                  {item.title}
                </span>
                <span className="text-[11px] text-foreground-muted capitalize">
                  {item.type} session logged
                </span>
              </div>
            </div>

            <span className="text-xs font-mono text-foreground-muted shrink-0 text-right">
              {item.timestamp}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
};
