import React from 'react';
import { Link } from 'react-router-dom';
import { QuickActionItem } from '../../types/candidateDashboard';
import { BookOpen, Award, Calendar, BarChart3, ArrowRight } from 'lucide-react';

export interface QuickActionsGridProps {
  actions: QuickActionItem[];
  className?: string;
}

export const QuickActionsGrid: React.FC<QuickActionsGridProps> = ({ actions, className = '' }) => {
  const getIcon = (name: QuickActionItem['iconName']) => {
    switch (name) {
      case 'practice':
        return <BookOpen className="w-5 h-5 text-primary" aria-hidden="true" />;
      case 'mock':
        return <Award className="w-5 h-5 text-status-warning" aria-hidden="true" />;
      case 'exams':
        return <Calendar className="w-5 h-5 text-primary" aria-hidden="true" />;
      case 'results':
        return <BarChart3 className="w-5 h-5 text-status-success" aria-hidden="true" />;
      default:
        return <BookOpen className="w-5 h-5 text-primary" aria-hidden="true" />;
    }
  };

  return (
    <section aria-labelledby="quick-actions-heading" className={`flex flex-col gap-3 ${className}`}>
      <h2 id="quick-actions-heading" className="text-base sm:text-lg font-bold text-foreground">
        Quick Actions
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5" role="list">
        {actions.map((act) => (
          <Link
            key={act.id}
            to={act.route}
            role="listitem"
            className="group relative flex flex-col justify-between p-4 rounded-xl border border-border bg-surface hover:bg-surface-elevated hover:border-primary/50 transition-all duration-fast min-h-[110px] shadow-sm focus:outline-none focus-visible:ring-3 focus-visible:ring-primary focus-visible:ring-offset-2"
            aria-label={`${act.title}: ${act.description}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="p-2 rounded-lg bg-surface-elevated border border-border group-hover:border-primary/40 transition-colors">
                {getIcon(act.iconName)}
              </div>
              {act.badge && (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary">
                  {act.badge}
                </span>
              )}
            </div>

            <div className="mt-3 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                  {act.title}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-foreground-muted group-hover:text-primary transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </div>
              <p className="text-xs text-foreground-muted leading-relaxed">
                {act.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};
