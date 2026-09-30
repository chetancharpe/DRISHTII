import React from 'react';
import {
  MockTestQuestion,
  MockTestAnswer,
  QuestionAttemptStatus,
} from '../../types/mockTest';
import { Check, Bookmark, CheckCheck } from 'lucide-react';

interface MockTestNavigatorPaletteProps {
  questions: MockTestQuestion[];
  answers: Record<string, MockTestAnswer>;
  currentQuestionId: string;
  onSelectQuestion: (questionId: string) => void;
}

export const MockTestNavigatorPalette: React.FC<MockTestNavigatorPaletteProps> = ({
  questions = [],
  answers = {},
  currentQuestionId,
  onSelectQuestion,
}) => {
  return (
    <aside
      aria-label="Question palette navigator"
      className="p-4 sm:p-5 rounded-2xl border border-border bg-surface flex flex-col gap-4 shadow-sm"
    >
      <div className="border-b border-border pb-2.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
          Question Palette
        </h3>
        <p className="text-[11px] text-foreground-secondary">
          Click any number to jump directly
        </p>
      </div>

      {/* Grid of questions */}
      <div
        className="grid grid-cols-5 sm:grid-cols-5 gap-2"
        role="group"
        aria-label="Question selection buttons"
      >
        {questions.map((q) => {
          const ans = answers[q.id];
          const isCurrent = q.id === currentQuestionId;
          const status: QuestionAttemptStatus = ans?.status || 'unanswered';

          let btnClass = 'bg-surface border-border text-foreground hover:bg-surface-elevated';
          let statusText = 'Unanswered';
          let icon = null;

          switch (status) {
            case 'answered':
              btnClass = 'bg-success/15 border-success text-success-contrast font-bold';
              statusText = 'Answered';
              icon = <Check className="w-2.5 h-2.5 text-success" aria-hidden="true" />;
              break;
            case 'answered_marked_for_review':
              btnClass = 'bg-purple-500/15 border-purple-500 text-purple-700 dark:text-purple-300 font-bold';
              statusText = 'Answered and marked for review';
              icon = <CheckCheck className="w-2.5 h-2.5 text-purple-600 dark:text-purple-400" aria-hidden="true" />;
              break;
            case 'marked_for_review':
              btnClass = 'bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-400 font-bold';
              statusText = 'Marked for review';
              icon = <Bookmark className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" aria-hidden="true" />;
              break;
            default:
              btnClass = 'bg-surface border-border text-foreground-secondary hover:bg-surface-elevated';
              statusText = 'Unanswered';
              break;
          }

          if (isCurrent) {
            btnClass += ' ring-2 ring-primary ring-offset-2 ring-offset-background';
          }

          const accessibleLabel = `Question ${q.questionNumber}, ${statusText}${isCurrent ? ', currently active' : ''}`;

          return (
            <button
              key={q.id}
              type="button"
              onClick={() => onSelectQuestion(q.id)}
              className={`w-full aspect-square rounded-xl border flex flex-col items-center justify-center p-1 relative text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all ${btnClass}`}
              aria-label={accessibleLabel}
              aria-current={isCurrent ? 'true' : undefined}
            >
              <span>{q.questionNumber}</span>
              {icon && (
                <span className="absolute top-1 right-1" aria-hidden="true">
                  {icon}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Palette Legend */}
      <div className="pt-3 border-t border-border flex flex-col gap-1.5 text-[11px] text-foreground-secondary">
        <p className="font-semibold text-foreground text-[11px] mb-0.5">Palette Legend:</p>

        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-success/80 border border-success" aria-hidden="true" />
          <span>Answered</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-purple-500/80 border border-purple-500" aria-hidden="true" />
          <span>Answered & Marked Review</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-500/80 border border-amber-500" aria-hidden="true" />
          <span>Marked for Review</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-surface-elevated border border-border" aria-hidden="true" />
          <span>Unanswered</span>
        </div>
      </div>
    </aside>
  );
};
