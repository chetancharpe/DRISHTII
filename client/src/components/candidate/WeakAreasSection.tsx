import React from 'react';
import { Link } from 'react-router-dom';
import { WeakAreaTopicItem } from '../../types/candidateDashboard';
import { Target, ArrowRight, CheckCircle2 } from 'lucide-react';

export interface WeakAreasSectionProps {
  topics: WeakAreaTopicItem[];
  className?: string;
}

export const WeakAreasSection: React.FC<WeakAreasSectionProps> = ({ topics, className = '' }) => {
  return (
    <section
      aria-labelledby="weak-areas-heading"
      className={`rounded-xl border border-border bg-surface p-5 sm:p-6 shadow-sm flex flex-col gap-4 text-foreground ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-status-warning shrink-0" aria-hidden="true" />
          <h2 id="weak-areas-heading" className="text-base sm:text-lg font-bold text-foreground">
            Topics to Strengthen
          </h2>
        </div>
        <span className="text-xs text-foreground-muted">
          Targeted Practice Areas
        </span>
      </div>

      <p className="text-xs text-foreground-secondary leading-relaxed">
        Focusing a brief 10-question practice on these areas will yield the highest performance gains for your next mock examination.
      </p>

      {topics.length > 0 ? (
        <div className="flex flex-col gap-3">
          {topics.map((item) => (
            <div
              key={item.id}
              className="p-3.5 rounded-lg border border-border bg-surface-elevated/40 hover:bg-surface-elevated transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-foreground-secondary uppercase font-mono">
                    {item.subject}
                  </span>
                  <span>•</span>
                  <h3 className="text-sm font-bold text-foreground">
                    {item.topic}
                  </h3>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-foreground-muted">Recent Accuracy:</span>
                  <span className="font-mono font-bold text-status-warning">
                    {item.accuracyPercent}%
                  </span>
                </div>
              </div>

              <div className="shrink-0">
                <Link
                  to={item.practiceRoute}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-strong bg-surface hover:bg-surface-elevated text-primary text-xs font-bold transition-colors min-h-[38px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label={`Practice topic to strengthen: ${item.topic} in ${item.subject}. Current accuracy is ${item.accuracyPercent}%.`}
                >
                  <span>Practice This Topic</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-6 rounded-lg border border-dashed border-border bg-surface-elevated/30 flex flex-col items-center text-center gap-2">
          <CheckCircle2 className="w-6 h-6 text-status-success" aria-hidden="true" />
          <p className="text-xs text-foreground font-semibold">
            All practiced topics currently demonstrate high accuracy!
          </p>
        </div>
      )}
    </section>
  );
};
