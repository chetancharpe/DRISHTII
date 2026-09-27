import React from 'react';
import { Link } from 'react-router-dom';
import { MockTestHistoryItem } from '../../types/mockTest';
import { RotateCcw, BookOpen, Award } from 'lucide-react';

interface MockTestHistoryTableProps {
  history: MockTestHistoryItem[];
  onRetake: (testId: string) => void;
}

export const MockTestHistoryTable: React.FC<MockTestHistoryTableProps> = ({
  history,
  onRetake,
}) => {
  return (
    <div className="flex flex-col gap-4">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-left text-xs border-collapse">
          <caption className="sr-only">Candidate completed mock examination attempts history</caption>
          <thead>
            <tr className="border-b border-border bg-surface-elevated/50 text-[11px] font-bold uppercase tracking-wider text-foreground-secondary">
              <th scope="col" className="py-3 px-4">Date</th>
              <th scope="col" className="py-3 px-4">Examination</th>
              <th scope="col" className="py-3 px-4">Score</th>
              <th scope="col" className="py-3 px-4">Percentage</th>
              <th scope="col" className="py-3 px-4">Time Taken</th>
              <th scope="col" className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {history.map((item) => (
              <tr key={item.attemptId} className="hover:bg-surface-elevated/30 transition-colors">
                <td className="py-3.5 px-4 font-medium text-foreground whitespace-nowrap">
                  {item.formattedDate}
                </td>
                <td className="py-3.5 px-4">
                  <div className="flex flex-col">
                    <span className="font-bold text-foreground">{item.testTitle}</span>
                    <span className="text-[11px] text-foreground-secondary">{item.examName}</span>
                  </div>
                </td>
                <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                  {item.scoreFormatted}
                </td>
                <td className="py-3.5 px-4">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                      item.percentage >= 70
                        ? 'bg-success/10 text-success-contrast border border-success/20'
                        : 'bg-surface-elevated text-foreground border border-border'
                    }`}
                  >
                    {item.percentage}%
                  </span>
                </td>
                <td className="py-3.5 px-4 text-foreground-secondary whitespace-nowrap">
                  {item.timeUsedFormatted}
                </td>
                <td className="py-3.5 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      to={`/candidate/mock-tests/${item.testId}/result`}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface hover:bg-surface-elevated border border-border text-xs font-semibold text-primary hover:underline min-h-[36px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
                      aria-label={`View result for ${item.testTitle}`}
                    >
                      <Award className="w-3 h-3 text-primary" aria-hidden="true" />
                      <span>Result</span>
                    </Link>

                    <Link
                      to={`/candidate/mock-tests/${item.testId}/review`}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface hover:bg-surface-elevated border border-border text-xs font-semibold text-foreground hover:bg-surface-elevated min-h-[36px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
                      aria-label={`Review questions for ${item.testTitle}`}
                    >
                      <BookOpen className="w-3 h-3 text-foreground-muted" aria-hidden="true" />
                      <span>Review</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => onRetake(item.testId)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs font-bold min-h-[36px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
                      aria-label={`Retake ${item.testTitle}`}
                    >
                      <RotateCcw className="w-3 h-3" aria-hidden="true" />
                      <span>Retake</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List */}
      <div className="md:hidden flex flex-col gap-3" role="list" aria-label="Mock tests history">
        {history.map((item) => (
          <article
            key={item.attemptId}
            role="listitem"
            className="p-4 rounded-xl border border-border bg-surface flex flex-col gap-3"
          >
            <div className="flex items-start justify-between gap-2 border-b border-border/60 pb-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-foreground-secondary">
                  {item.examName}
                </span>
                <h3 className="text-sm font-bold text-foreground leading-snug">
                  {item.testTitle}
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-primary/10 text-primary border border-primary/20">
                {item.percentage}%
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="flex flex-col">
                <span className="text-[10px] text-foreground-secondary">Date</span>
                <span className="font-medium text-foreground">{item.formattedDate}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-foreground-secondary">Score</span>
                <span className="font-mono font-bold text-foreground">{item.scoreFormatted}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-foreground-secondary">Time</span>
                <span className="text-foreground-secondary">{item.timeUsedFormatted}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <Link
                to={`/candidate/mock-tests/${item.testId}/result`}
                className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-surface border border-border text-xs font-bold text-primary min-h-[38px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <span>Result</span>
              </Link>
              <Link
                to={`/candidate/mock-tests/${item.testId}/review`}
                className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-surface border border-border text-xs font-semibold text-foreground min-h-[38px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <span>Review</span>
              </Link>
              <button
                type="button"
                onClick={() => onRetake(item.testId)}
                className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-primary text-primary-contrast text-xs font-bold min-h-[38px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <span>Retake</span>
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};
