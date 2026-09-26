import React from 'react';
import { Link } from 'react-router-dom';
import { MockTestDashboardItem } from '../../types/candidateDashboard';
import { Award, Clock, HelpCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export interface MockTestsSectionProps {
  tests: MockTestDashboardItem[];
  className?: string;
}

export const MockTestsSection: React.FC<MockTestsSectionProps> = ({ tests, className = '' }) => {
  return (
    <section
      aria-labelledby="mock-tests-heading"
      className={`rounded-xl border border-border bg-surface p-5 sm:p-6 shadow-sm flex flex-col gap-4 text-foreground ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-status-warning shrink-0" aria-hidden="true" />
          <h2 id="mock-tests-heading" className="text-base sm:text-lg font-bold text-foreground">
            Available Mock Tests
          </h2>
        </div>
        <Link
          to="/candidate/mock-tests"
          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
        >
          <span>View All Mock Tests</span>
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tests.map((test) => (
          <div
            key={test.id}
            className="p-5 rounded-xl border border-border bg-surface-elevated/40 hover:bg-surface-elevated/80 transition-colors flex flex-col justify-between gap-3 shadow-xs"
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm sm:text-base font-extrabold text-foreground leading-snug">
                  {test.title}
                </h3>
                {test.isNew && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-primary/15 border border-primary/30 text-primary shrink-0">
                    New Test
                  </span>
                )}
              </div>

              {/* Metrics */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-foreground-secondary font-mono">
                <div className="flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5 text-foreground-muted" aria-hidden="true" />
                  <span>{test.questionCount} Questions</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-foreground-muted" aria-hidden="true" />
                  <span>{test.durationMinutes} Minutes</span>
                </div>
                <span>•</span>
                <span>Difficulty: {test.difficulty}</span>
              </div>

              {/* Verified Accessibility Support Statement (Section 15) */}
              <div className="mt-1 p-2 rounded-lg bg-surface border border-border/80 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                <span className="text-[11px] text-foreground-muted leading-tight">
                  <strong className="text-foreground font-semibold">Accessibility support: </strong>
                  {test.accessibilitySupport}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-border flex justify-end">
              <Link
                to={test.testRoute}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-primary-contrast text-xs font-bold transition-colors min-h-[40px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label={`View test details for ${test.title}. ${test.questionCount} questions, ${test.durationMinutes} minutes.`}
              >
                <span>View Test</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
