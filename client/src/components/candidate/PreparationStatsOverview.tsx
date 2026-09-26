import React from 'react';
import { DashboardStats } from '../../types/candidateDashboard';
import { BarChart, CheckCircle2, Award, TrendingUp, Info } from 'lucide-react';

export interface PreparationStatsOverviewProps {
  stats: DashboardStats;
  className?: string;
}

export const PreparationStatsOverview: React.FC<PreparationStatsOverviewProps> = ({
  stats,
  className = '',
}) => {
  return (
    <section
      aria-labelledby="preparation-overview-heading"
      className={`flex flex-col gap-3.5 ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
          <h2 id="preparation-overview-heading" className="text-base sm:text-lg font-bold text-foreground">
            Your Preparation
          </h2>
        </div>
        <span className="text-[11px] font-mono text-foreground-muted flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-primary shrink-0" aria-hidden="true" />
          Prototype candidate telemetry demo values
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* 1. Overall Progress */}
        <div className="p-4 rounded-xl border border-border bg-surface flex flex-col justify-between gap-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-foreground-muted">
              Overall Progress
            </span>
            <BarChart className="w-4 h-4 text-primary" aria-hidden="true" />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="text-2xl sm:text-3xl font-black text-foreground">
              {stats.overallProgressPercent}%
            </div>
            {/* Accessible Progress Indicator (Section 10) */}
            <div
              role="progressbar"
              aria-valuenow={stats.overallProgressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Overall preparation: ${stats.overallProgressPercent}%`}
              className="w-full bg-surface-elevated rounded-full h-2.5 overflow-hidden border border-border mt-1"
            >
              <div
                className="bg-primary h-full rounded-full transition-all duration-300"
                style={{ width: `${stats.overallProgressPercent}%` }}
              />
            </div>
          </div>

          <span className="text-[11px] text-foreground-secondary">
            Overall preparation: {stats.overallProgressPercent}% completed
          </span>
        </div>

        {/* 2. Questions Practiced */}
        <div className="p-4 rounded-xl border border-border bg-surface flex flex-col justify-between gap-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-foreground-muted">
              Questions Practiced
            </span>
            <CheckCircle2 className="w-4 h-4 text-status-success" aria-hidden="true" />
          </div>

          <div>
            <div className="text-2xl sm:text-3xl font-black text-foreground">
              {stats.questionsPracticedCount}
            </div>
            <p className="text-xs text-foreground-secondary mt-1">
              Total questions attempted across all topics
            </p>
          </div>

          <span className="text-[11px] font-semibold text-status-success">
            +32 questions this week
          </span>
        </div>

        {/* 3. Mock Tests Completed */}
        <div className="p-4 rounded-xl border border-border bg-surface flex flex-col justify-between gap-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-foreground-muted">
              Mock Tests
            </span>
            <Award className="w-4 h-4 text-status-warning" aria-hidden="true" />
          </div>

          <div>
            <div className="text-2xl sm:text-3xl font-black text-foreground">
              {stats.mockTestsCompletedCount}
            </div>
            <p className="text-xs text-foreground-secondary mt-1">
              Full-length timed simulated exams
            </p>
          </div>

          <span className="text-[11px] font-semibold text-primary">
            Next scheduled test in 4 days
          </span>
        </div>

        {/* 4. Average Score */}
        <div className="p-4 rounded-xl border border-border bg-surface flex flex-col justify-between gap-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-foreground-muted">
              Average Score
            </span>
            <TrendingUp className="w-4 h-4 text-primary" aria-hidden="true" />
          </div>

          <div>
            <div className="text-2xl sm:text-3xl font-black text-foreground">
              {stats.averageScorePercent}%
            </div>
            <p className="text-xs text-foreground-secondary mt-1">
              Aggregate score across completed mock exams
            </p>
          </div>

          <span className="text-[11px] font-semibold text-status-success">
            +6% improvement from first attempt
          </span>
        </div>
      </div>
    </section>
  );
};
