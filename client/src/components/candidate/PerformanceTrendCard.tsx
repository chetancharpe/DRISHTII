import React from 'react';
import { PerformanceTrendData } from '../../types/candidateDashboard';
import { TrendingUp, Info } from 'lucide-react';

export interface PerformanceTrendCardProps {
  trend: PerformanceTrendData;
  className?: string;
}

export const PerformanceTrendCard: React.FC<PerformanceTrendCardProps> = ({
  trend,
  className = '',
}) => {
  return (
    <section
      aria-labelledby="performance-trend-heading"
      className={`rounded-xl border border-border bg-surface p-5 sm:p-6 shadow-sm flex flex-col gap-4 text-foreground ${className}`}
    >
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-status-success shrink-0" aria-hidden="true" />
          <h2 id="performance-trend-heading" className="text-base sm:text-lg font-bold text-foreground">
            Performance Progression
          </h2>
        </div>
        <span className="text-xs font-semibold text-status-success">
          +18% Net Gain
        </span>
      </div>

      {/* Screen Reader & Text-First Summary (Section 19) */}
      <div
        role="region"
        aria-label="Performance trend textual analysis"
        className="p-3.5 rounded-lg border border-primary/20 bg-primary/5 text-xs text-foreground leading-relaxed flex items-start gap-2.5"
      >
        <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
        <p>
          <strong className="font-semibold text-foreground">Score Trend: </strong>
          {trend.textAlternative} {trend.trendDescription}
        </p>
      </div>

      {/* Accessible Bar Visualizer */}
      <div
        className="flex items-end justify-between gap-3 pt-6 pb-2 px-4 h-48 bg-surface-elevated/30 rounded-xl border border-border"
        role="group"
        aria-label="Bar chart showing score progression across five recent mock exams"
      >
        {trend.scores.map((score, index) => {
          const heightPercent = score; // 0 to 100
          const label = trend.testLabels[index] || `Test ${index + 1}`;

          return (
            <div
              key={index}
              className="flex-1 flex flex-col items-center gap-2 h-full justify-end group"
              tabIndex={0}
              role="figure"
              aria-label={`${label}: Score ${score}%`}
            >
              <span className="text-xs font-mono font-bold text-foreground">
                {score}%
              </span>
              <div className="w-full max-w-[44px] bg-surface rounded-t-lg border-t-2 border-x-2 border-primary/40 h-full flex items-end overflow-hidden">
                <div
                  className="w-full bg-primary hover:bg-primary-hover transition-all duration-300 rounded-t-md"
                  style={{ height: `${heightPercent}%` }}
                />
              </div>
              <span className="text-[11px] font-mono text-foreground-muted truncate max-w-full">
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Text Data Table Fallback for Screen Readers */}
      <div className="sr-only">
        <table>
          <caption>Progressive Mock Test Results</caption>
          <thead>
            <tr>
              <th scope="col">Test Identifier</th>
              <th scope="col">Score Achieved</th>
            </tr>
          </thead>
          <tbody>
            {trend.scores.map((score, idx) => (
              <tr key={idx}>
                <td>{trend.testLabels[idx]}</td>
                <td>{score}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
