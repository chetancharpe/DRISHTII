import React from 'react';
import { Link } from 'react-router-dom';
import { PerformanceRecordItem } from '../../types/candidateDashboard';
import { BarChart3, CheckCircle2, ArrowRight } from 'lucide-react';

export interface RecentPerformanceSectionProps {
  records: PerformanceRecordItem[];
  className?: string;
}

export const RecentPerformanceSection: React.FC<RecentPerformanceSectionProps> = ({
  records,
  className = '',
}) => {
  return (
    <section
      aria-labelledby="recent-performance-heading"
      className={`rounded-xl border border-border bg-surface p-5 sm:p-6 shadow-sm flex flex-col gap-4 text-foreground ${className}`}
    >
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
          <h2 id="recent-performance-heading" className="text-base sm:text-lg font-bold text-foreground">
            Recent Performance
          </h2>
        </div>
        <Link
          to="/candidate/results"
          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
        >
          <span>All Results</span>
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
      </div>

      {/* Desktop Accessible Table (Section 17) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <caption className="sr-only">
            Recent candidate mock test evaluation scores and dates
          </caption>
          <thead>
            <tr className="border-b border-border text-xs font-mono font-bold text-foreground-muted uppercase">
              <th scope="col" className="pb-3 pr-4">Test Name</th>
              <th scope="col" className="pb-3 px-4">Score</th>
              <th scope="col" className="pb-3 px-4">Evaluation</th>
              <th scope="col" className="pb-3 px-4">Date</th>
              <th scope="col" className="pb-3 pl-4 text-right">Review Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-sm">
            {records.map((rec) => (
              <tr key={rec.id} className="hover:bg-surface-elevated/50 transition-colors">
                <td className="py-3.5 pr-4 font-bold text-foreground">
                  {rec.testTitle}
                </td>
                <td className="py-3.5 px-4 font-mono font-extrabold text-foreground">
                  {rec.scorePercent}%
                </td>
                <td className="py-3.5 px-4">
                  {/* Non-color dependent status badge */}
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                      rec.scorePercent >= 70
                        ? 'bg-status-success/10 border-status-success/30 text-status-success'
                        : 'bg-status-warning/10 border-status-warning/30 text-status-warning'
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3 shrink-0" aria-hidden="true" />
                    <span>{rec.scorePercent >= 70 ? 'Target Achieved' : 'Developing'}</span>
                  </span>
                </td>
                <td className="py-3.5 px-4 text-xs text-foreground-secondary">
                  {rec.dateFormatted}
                </td>
                <td className="py-3.5 pl-4 text-right">
                  <Link
                    to={rec.viewRoute}
                    className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded p-1"
                    aria-label={`View performance report for ${rec.testTitle} (${rec.scorePercent}%)`}
                  >
                    <span>View Analysis</span>
                    <ArrowRight className="w-3 h-3" aria-hidden="true" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Layout (Section 17) */}
      <div className="md:hidden flex flex-col gap-3" role="list">
        {records.map((rec) => (
          <div
            key={rec.id}
            role="listitem"
            className="p-4 rounded-lg border border-border bg-surface-elevated/40 flex flex-col gap-2.5"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-bold text-foreground">{rec.testTitle}</h3>
              <span className="text-xs text-foreground-muted">{rec.dateFormatted}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-foreground font-mono">
                  {rec.scorePercent}%
                </span>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                    rec.scorePercent >= 70
                      ? 'bg-status-success/10 border-status-success/30 text-status-success'
                      : 'bg-status-warning/10 border-status-warning/30 text-status-warning'
                  }`}
                >
                  {rec.scorePercent >= 70 ? 'Target Achieved' : 'Developing'}
                </span>
              </div>

              <Link
                to={rec.viewRoute}
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                aria-label={`Review ${rec.testTitle}`}
              >
                <span>Analysis</span>
                <ArrowRight className="w-3 h-3" aria-hidden="true" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
