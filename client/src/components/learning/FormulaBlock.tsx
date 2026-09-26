import React from 'react';
import { LearningFormula } from '../../types/learning';
import { Variable, Volume2 } from 'lucide-react';
import { useAccessibility } from '../../contexts/AccessibilityContext';

interface FormulaBlockProps {
  formula: LearningFormula;
}

export const FormulaBlock: React.FC<FormulaBlockProps> = ({ formula }) => {
  const { speak, isSpeaking, preferences } = useAccessibility();

  const handleReadFormula = () => {
    speak(`Formula: ${formula.accessibleText}. ${formula.explanation || ''}`);
  };

  return (
    <figure
      aria-labelledby={`formula-label-${formula.id}`}
      className="p-4 sm:p-5 rounded-xl border border-primary/20 bg-primary/5 my-3 flex flex-col gap-2.5"
    >
      <div className="flex items-center justify-between gap-2">
        <figcaption
          id={`formula-label-${formula.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary"
        >
          <Variable className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Formula</span>
        </figcaption>

        {preferences.audioEnabled && (
          <button
            type="button"
            onClick={handleReadFormula}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold text-primary bg-surface hover:bg-surface-elevated border border-primary/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[32px] transition-colors"
            aria-label={`Listen to formula: ${formula.accessibleText}`}
          >
            <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{isSpeaking ? 'Listening...' : 'Listen'}</span>
          </button>
        )}
      </div>

      {/* Visual mathematical formula representation */}
      <div
        className="font-mono text-sm sm:text-base font-bold text-foreground py-2 px-3 rounded-lg bg-surface border border-border overflow-x-auto"
        aria-hidden="true"
      >
        {formula.visualText}
      </div>

      {/* Screen reader plain-language phonetic alternative */}
      <div className="sr-only">
        <p>Spoken mathematical expression: {formula.accessibleText}</p>
      </div>

      {/* Contextual description/explanation */}
      <p className="text-xs text-foreground-secondary italic">
        Spoken alternative: &ldquo;{formula.accessibleText}&rdquo;
      </p>

      {formula.explanation && (
        <p className="text-xs text-foreground leading-relaxed pt-1 border-t border-primary/10">
          <strong className="font-semibold text-foreground">Usage:</strong> {formula.explanation}
        </p>
      )}
    </figure>
  );
};
