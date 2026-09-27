import React from 'react';
import { MockTestSection, MockTestAnswer } from '../../types/mockTest';

interface MockTestSectionNavProps {
  sections: MockTestSection[];
  activeSectionId: string;
  answers: Record<string, MockTestAnswer>;
  onSelectSection: (sectionId: string) => void;
}

export const MockTestSectionNav: React.FC<MockTestSectionNavProps> = ({
  sections,
  activeSectionId,
  answers,
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
            if (ans?.status === 'answered' || ans?.status === 'answered_marked_for_review') {
              answeredCount++;
            }
          });

          return (
            <button
              key={section.id}
              role="tab"
              id={`tab-${section.id}`}
              aria-selected={isActive}
              aria-controls={`section-panel-${section.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onSelectSection(section.id)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-t-xl text-xs font-bold border-b-2 whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[44px] transition-all ${
                isActive
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-foreground-secondary hover:text-foreground hover:bg-surface-elevated/40'
              }`}
            >
              <span>{section.name}</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                  isActive
                    ? 'bg-primary/10 border-primary/30 text-primary'
                    : 'bg-surface-elevated border-border text-foreground-secondary'
                }`}
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
