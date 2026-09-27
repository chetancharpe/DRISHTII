import React from 'react';
import { ExamSection, ExamAnswer, ExamNavigationPolicy } from '../../types/exam';

interface ExamSectionNavigationProps {
  sections: ExamSection[];
  activeSectionId: string;
  answers: Record<string, ExamAnswer>;
  navigationPolicy: ExamNavigationPolicy;
  onSelectSection: (sectionId: string) => void;
}

export const ExamSectionNavigation: React.FC<ExamSectionNavigationProps> = ({
  sections,
  activeSectionId,
  answers,
  navigationPolicy,
  onSelectSection,
}) => {
  return (
    <nav aria-label="Examination sections" className="w-full">
      <div
        role="tablist"
        aria-label="Test sections"
        className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-border scrollbar-none"
      >
        {sections.map((section) => {
          const isActive = section.id === activeSectionId;

          // Count answered questions in this section
          let answeredCount = 0;
          section.questions.forEach((q) => {
            const ans = answers[q.id];
            if (ans && ans.selectedOptions.length > 0) {
              answeredCount++;
            }
          });

          const isLocked = navigationPolicy.sectionLocked && !isActive;

          return (
            <button
              key={section.id}
              role="tab"
              id={`tab-exam-sec-${section.id}`}
              aria-selected={isActive}
              aria-controls={`section-panel-${section.id}`}
              disabled={isLocked}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onSelectSection(section.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold border-b-2 whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[44px] transition-all ${
                isActive
                  ? 'border-primary text-primary bg-primary/5'
                  : isLocked
                  ? 'border-transparent text-foreground-secondary/40 cursor-not-allowed'
                  : 'border-transparent text-foreground-secondary hover:text-foreground hover:bg-surface-elevated/40'
              }`}
            >
              <span>{section.title}</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                  isActive
                    ? 'bg-primary/10 border-primary/30 text-primary'
                    : 'bg-surface-elevated border-border text-foreground-secondary'
                }`}
                aria-label={`${answeredCount} of ${section.totalQuestions} questions answered`}
              >
                {answeredCount}/{section.totalQuestions}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
