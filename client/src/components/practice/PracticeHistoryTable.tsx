import React from 'react';
import { Link } from 'react-router-dom';
import { PracticeHistoryItem } from '../../types/practice';
import { ArrowRight } from 'lucide-react';

interface PracticeHistoryTableProps {
  history: PracticeHistoryItem[];
}

export const PracticeHistoryTable: React.FC<PracticeHistoryTableProps> = ({ history }) => {
  return (
    <div className="flex flex-col gap-4">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-left text-xs border-collapse">
          <caption className="sr-only">
            Candidate historical practice sessions log
          </caption>
          <thead>
            <tr className="border-b border-border bg-surface-elevated/50 text-[11px] font-bold uppercase tracking-wider text-foreground-secondary">
              <th scope="col" className="py-3 px-4">Date</th>
              <th scope="col" className="py-3 px-4">Subject & Topic</th>
              <th scope="col" className="py-3 px-4">Questions</th>
              <th scope="col" className="py-3 px-4">Score</th>
              <th scope="col" className="py-3 px-4">Accuracy</th>
              <th scope="col" className="py-3 px-4">Time Used</th>
              <th scope="col" className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {history.map((item) => (
              <tr key={item.id} className="hover:bg-surface-elevated/40 transition-colors">
                <td className="py-3.5 px-4 font-medium text-foreground whitespace-nowrap">
                  {item.formattedDate}
                </td>
                <td className="py-3.5 px-4">
                  <div className="flex flex-col">
                    <span className="font-bold text-foreground">{item.topicName}</span>
                    <span className="text-[11px] text-foreground-secondary">{item.subjectName}</span>
                  </div>
                </td>
                <td className="py-3.5 px-4 text-foreground font-mono">
                  {item.questionsCount}
                </td>
                <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                  {item.scoreFormatted}
                </td>
                <td className="py-3.5 px-4">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                      item.accuracyPercent >= 75
                        ? 'bg-success/10 text-success-contrast border border-success/20'
                        : 'bg-surface-elevated text-foreground border border-border'
                    }`}
                  >
                    {item.accuracyPercent}%
                  </span>
                </td>
                <td className="py-3.5 px-4 text-foreground-secondary whitespace-nowrap">
                  {item.timeUsedFormatted}
                </td>
                <td className="py-3.5 px-4 text-right">
                  <Link
                    to={`/candidate/practice/session/${item.sessionId}/result`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-elevated border border-border text-xs font-semibold text-primary hover:text-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[36px] transition-colors"
                    aria-label={`Review practice session for ${item.topicName} from ${item.formattedDate}`}
                  >
                    <span>Review</span>
                    <ArrowRight className="w-3 h-3" aria-hidden="true" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View */}
      <div className="md:hidden flex flex-col gap-3" role="list" aria-label="Practice sessions history">
        {history.map((item) => (
          <article
            key={item.id}
            role="listitem"
            className="p-4 rounded-xl border border-border bg-surface flex flex-col gap-3"
          >
            <div className="flex items-start justify-between gap-2 border-b border-border/60 pb-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-foreground-secondary">
                  {item.subjectName}
                </span>
                <h3 className="text-sm font-bold text-foreground leading-tight">
                  {item.topicName}
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-primary/10 text-primary border border-primary/20">
                {item.accuracyPercent}%
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

            <div className="pt-1">
              <Link
                to={`/candidate/practice/session/${item.sessionId}/result`}
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-surface border border-border hover:bg-surface-elevated text-xs font-bold text-primary min-h-[40px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
                aria-label={`Review practice session for ${item.topicName} on ${item.formattedDate}`}
              >
                <span>Review Answers</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};
