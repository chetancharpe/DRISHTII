import React, { useState } from 'react';
import { PracticeQuestion, PracticeAnswerRecord } from '../../types/practice';
import { Check, X, SkipForward, ChevronDown, ChevronUp } from 'lucide-react';

interface PracticeNavigatorPaletteProps {
  questions: PracticeQuestion[];
  answers: Record<string, PracticeAnswerRecord>;
  currentIndex: number;
  onSelectQuestion: (index: number) => void;
}

export const PracticeNavigatorPalette: React.FC<PracticeNavigatorPaletteProps> = ({
  questions,
  answers,
  currentIndex,
  onSelectQuestion,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      aria-label="Practice questions navigator"
      className="p-4 sm:p-5 rounded-2xl border border-border bg-surface flex flex-col gap-4 shadow-sm"
    >
      <div className="flex items-center justify-between gap-2 border-b border-border pb-3">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Question Navigator
          </h2>
          <p className="text-[11px] text-foreground-secondary">
            Jump to any question directly
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="md:hidden p-1.5 rounded-lg border border-border text-foreground-secondary hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[36px]"
          aria-expanded={!isCollapsed}
          aria-label={isCollapsed ? 'Expand question navigator' : 'Collapse question navigator'}
        >
          {isCollapsed ? (
            <ChevronDown className="w-4 h-4" aria-hidden="true" />
          ) : (
            <ChevronUp className="w-4 h-4" aria-hidden="true" />
          )}
        </button>
      </div>

      {!isCollapsed && (
        <>
          {/* Question Buttons Grid */}
          <div className="grid grid-cols-5 sm:grid-cols-5 gap-2" role="list">
            {questions.map((q, idx) => {
              const ans = answers[q.id];
              const isCurrent = idx === currentIndex;
              const isSubmitted = ans?.isSubmitted || false;
              const isCorrect = ans?.isCorrect || false;
              const isSkipped = ans?.isSkipped || false;

              let stateLabel = 'unanswered';
              let badgeIcon = null;
              let btnClass = 'bg-surface border-border text-foreground hover:bg-surface-elevated';

              if (isSubmitted) {
                if (isCorrect) {
                  stateLabel = 'correct';
                  btnClass = 'bg-success/10 border-success text-success-contrast font-bold';
                  badgeIcon = <Check className="w-2.5 h-2.5 text-success" aria-hidden="true" />;
                } else {
                  stateLabel = 'needs review';
                  btnClass = 'bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-400 font-bold';
                  badgeIcon = <X className="w-2.5 h-2.5 text-amber-600" aria-hidden="true" />;
                }
              } else if (isSkipped) {
                stateLabel = 'skipped';
                btnClass = 'bg-surface-elevated border-border text-foreground-muted';
                badgeIcon = <SkipForward className="w-2.5 h-2.5 text-foreground-muted" aria-hidden="true" />;
              }

              if (isCurrent) {
                btnClass += ' ring-2 ring-primary ring-offset-2 ring-offset-background';
              }

              const fullAccessibleLabel = `Question ${idx + 1}, ${stateLabel}${isCurrent ? ', current question' : ''}`;

              return (
                <div key={q.id} role="listitem">
                  <button
                    type="button"
                    onClick={() => onSelectQuestion(idx)}
                    className={`w-full aspect-square rounded-xl border flex flex-col items-center justify-center p-1 relative text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all ${btnClass}`}
                    aria-label={fullAccessibleLabel}
                    aria-current={isCurrent ? 'true' : undefined}
                  >
                    <span>{idx + 1}</span>
                    {badgeIcon && (
                      <span className="absolute top-1 right-1" aria-hidden="true">
                        {badgeIcon}
                      </span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="pt-3 border-t border-border flex flex-col gap-1.5 text-[11px] text-foreground-secondary">
            <p className="font-semibold text-foreground text-[11px] mb-0.5">Status Legend:</p>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-success/80 border border-success" aria-hidden="true" />
              <span>Correct (Answer verified)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 border border-amber-500" aria-hidden="true" />
              <span>Needs Review</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-surface-elevated border border-border" aria-hidden="true" />
              <span>Unanswered / Skipped</span>
            </div>
          </div>
        </>
      )}
    </aside>
  );
};
