import React from 'react';
import { ExamTimer } from './ExamTimer';
import { ExamSyncStatus } from './ExamSyncStatus';
import { ExamSyncState } from '../../types/exam';
import { SlidersHorizontal, HelpCircle, Send } from 'lucide-react';

interface ExamHeaderProps {
  title: string;
  organization: string;
  examCode: string;
  serverEndTime: number;
  syncState: ExamSyncState;
  unsyncedCount: number;
  currentQuestionNumber: number;
  totalQuestions: number;
  onExpire: () => void;
  onRetrySync?: () => void;
  onOpenAccessibility: () => void;
  onOpenHelp: () => void;
  onSubmitClick: () => void;
}

export const ExamHeader: React.FC<ExamHeaderProps> = ({
  title,
  organization,
  examCode,
  serverEndTime,
  syncState,
  unsyncedCount,
  currentQuestionNumber,
  totalQuestions,
  onExpire,
  onRetrySync,
  onOpenAccessibility,
  onOpenHelp,
  onSubmitClick,
}) => {
  return (
    <header
      role="banner"
      className="sticky top-0 z-30 w-full bg-surface/95 backdrop-blur-md border-b border-border shadow-xs px-4 py-3"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left: Exam title & Organization */}
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
              {examCode}
            </span>
            <span className="text-[11px] text-foreground-secondary truncate max-w-[200px] sm:max-w-xs">
              {organization}
            </span>
          </div>
          <h1 className="text-sm sm:text-base font-extrabold text-foreground truncate mt-0.5">
            {title}
          </h1>
        </div>

        {/* Center: Live Timer & Sync Status */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <ExamTimer serverEndTime={serverEndTime} onExpire={onExpire} />
          <ExamSyncStatus
            syncState={syncState}
            unsyncedCount={unsyncedCount}
            onRetrySync={onRetrySync}
          />
        </div>

        {/* Right: Progress, A11y, Help, and Submit CTA */}
        <div className="flex items-center gap-2">
          {/* Question tally */}
          <div
            className="hidden md:flex flex-col text-right pr-2 border-r border-border"
            aria-label={`Question progress: ${currentQuestionNumber} of ${totalQuestions}`}
          >
            <span className="text-[10px] font-bold uppercase text-foreground-secondary">
              Progress
            </span>
            <span className="font-mono text-xs font-bold text-foreground">
              {currentQuestionNumber} / {totalQuestions}
            </span>
          </div>

          {/* Quick Accessibility Button */}
          <button
            type="button"
            onClick={onOpenAccessibility}
            className="inline-flex items-center justify-center p-2 rounded-xl bg-surface-elevated hover:bg-surface-elevated/80 border border-border text-foreground hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[40px] min-w-[40px] transition-colors"
            aria-label="Open exam accessibility preferences"
            title="Accessibility settings"
          >
            <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
          </button>

          {/* Technical Help Modal Button */}
          <button
            type="button"
            onClick={onOpenHelp}
            className="inline-flex items-center justify-center p-2 rounded-xl bg-surface-elevated hover:bg-surface-elevated/80 border border-border text-foreground hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[40px] min-w-[40px] transition-colors"
            aria-label="Open technical support and keyboard shortcuts"
            title="Technical support"
          >
            <HelpCircle className="w-4 h-4" aria-hidden="true" />
          </button>

          {/* Submit Examination Button */}
          <button
            type="button"
            onClick={onSubmitClick}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-danger hover:bg-danger/90 active:bg-danger text-white font-bold text-xs min-h-[40px] focus:outline-none focus-visible:ring-2 focus-visible:ring-danger shadow-xs transition-colors"
            aria-label="Submit Examination"
          >
            <span>Submit Exam</span>
            <Send className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
};
