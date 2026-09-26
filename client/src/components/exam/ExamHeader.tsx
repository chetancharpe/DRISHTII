import React from 'react';

export interface ExamHeaderProps {
  title?: string;
  category?: string;
}

export const ExamHeader: React.FC<ExamHeaderProps> = ({
  title = 'Active Examination Session',
  category = 'General Assessment',
}) => {
  return (
    <header className="p-4 bg-surface border-b border-border flex items-center justify-between" role="banner">
      <div>
        <span className="text-xs uppercase font-bold text-primary">{category}</span>
        <h1 className="text-xl font-extrabold text-foreground">{title}</h1>
      </div>
      <div className="text-xs font-semibold px-2.5 py-1 rounded bg-surface-elevated border border-border text-foreground-muted">
        Exam Component Placeholder
      </div>
    </header>
  );
};
