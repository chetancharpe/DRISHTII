import React from 'react';
import { Link } from 'react-router-dom';
import { UpcomingExamDashboardItem } from '../../types/candidateDashboard';
import { Calendar, Clock, ArrowRight } from 'lucide-react';

export interface UpcomingExamsSectionProps {
  exams: UpcomingExamDashboardItem[];
  className?: string;
}

export const UpcomingExamsSection: React.FC<UpcomingExamsSectionProps> = ({
  exams,
  className = '',
}) => {
  return (
    <section
      aria-labelledby="upcoming-exams-heading"
      className={`rounded-xl border border-border bg-surface p-5 sm:p-6 shadow-sm flex flex-col gap-4 text-foreground ${className}`}
    >
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
          <h2 id="upcoming-exams-heading" className="text-base sm:text-lg font-bold text-foreground">
            Upcoming Examinations
          </h2>
        </div>
        <span className="text-xs text-foreground-muted">
          Scheduled Competitive Tests
        </span>
      </div>

      {exams.length > 0 ? (
        <div className="flex flex-col gap-3">
          {exams.map((exam) => (
            <div
              key={exam.id}
              className="p-4 rounded-xl border border-border bg-surface-elevated/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-foreground">
                    {exam.title}
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-status-success/15 border border-status-success/30 text-status-success">
                    {exam.status}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-foreground-secondary">
                  <div className="flex items-center gap-1 font-semibold text-foreground">
                    <Calendar className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                    <span>{exam.dateFormatted}</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-foreground-muted" aria-hidden="true" />
                    <span>{exam.durationMinutes} Minutes Duration</span>
                  </div>
                  {exam.registrationNumber && (
                    <>
                      <span>•</span>
                      <span className="font-mono text-foreground-muted">
                        Reg: {exam.registrationNumber}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="shrink-0 flex items-center">
                <Link
                  to={exam.detailsRoute}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border bg-surface hover:bg-surface-elevated text-foreground text-xs font-bold transition-colors min-h-[40px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label={`View schedule details for ${exam.title} on ${exam.dateFormatted}`}
                >
                  <span>View Details</span>
                  <ArrowRight className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State (Section 16) */
        <div className="p-6 rounded-lg border border-dashed border-border bg-surface-elevated/30 flex flex-col items-center text-center gap-2">
          <Calendar className="w-7 h-7 text-foreground-muted" aria-hidden="true" />
          <h3 className="text-sm font-bold text-foreground">No upcoming examinations</h3>
          <p className="text-xs text-foreground-muted max-w-sm">
            You do not currently have any scheduled competitive examinations. You can practice full-length mocks at your own pace.
          </p>
          <Link
            to="/candidate/mock-tests"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-surface-elevated hover:bg-surface border border-border text-foreground text-xs font-bold transition-colors min-h-[40px] mt-2"
          >
            <span>Explore Mock Tests</span>
            <ArrowRight className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
          </Link>
        </div>
      )}
    </section>
  );
};
