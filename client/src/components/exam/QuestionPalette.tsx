import React from 'react';

export interface QuestionPaletteProps {
  totalQuestions?: number;
  currentIndex?: number;
  onSelectIndex?: (index: number) => void;
}

export const QuestionPalette: React.FC<QuestionPaletteProps> = ({
  totalQuestions = 10,
  currentIndex = 0,
  onSelectIndex,
}) => {
  return (
    <nav className="p-4 bg-surface border border-border rounded-lg" aria-label="Question Grid Palette">
      <h3 className="text-sm font-bold text-foreground mb-3">Question Palette</h3>
      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: totalQuestions }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSelectIndex?.(i)}
            aria-label={`Go to question ${i + 1}`}
            aria-current={currentIndex === i ? 'true' : undefined}
            className={`w-9 h-9 rounded text-xs font-bold border cursor-pointer ${
              currentIndex === i
                ? 'bg-primary text-primary-contrast border-primary'
                : 'bg-surface-elevated text-foreground border-border hover:border-border-strong'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </nav>
  );
};
