import React, { useState } from 'react';
import { LearningFormula } from '../../types/learning';
import { Variable, Volume2, Copy, Check } from 'lucide-react';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import { KaTeXMath } from '../common/KaTeXMath';

interface FormulaBlockProps {
  formula: LearningFormula;
}

export const FormulaBlock: React.FC<FormulaBlockProps> = ({ formula }) => {
  const { speak, isSpeaking, announce } = useAccessibility();
  const [copied, setCopied] = useState(false);

  const handleReadFormula = () => {
    const textToSpeak = `Mathematical formula: ${formula.accessibleText}. ${formula.explanation || ''}`;
    speak(textToSpeak);
    announce(`Reading formula: ${formula.accessibleText}`);
  };

  const handleCopyLatex = async () => {
    try {
      await navigator.clipboard.writeText(formula.visualText);
      setCopied(true);
      announce('Formula LaTeX copied to clipboard.');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <figure
      aria-labelledby={`formula-label-${formula.id}`}
      className="p-4 sm:p-5 rounded-2xl border-2 border-primary/20 bg-surface-elevated/40 my-3 flex flex-col gap-3 shadow-xs"
    >
      <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2.5">
        <figcaption
          id={`formula-label-${formula.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary"
        >
          <Variable className="w-4 h-4 text-primary" aria-hidden="true" />
          <span>Mathematical Notation</span>
        </figcaption>

        <div className="flex items-center gap-2">
          {/* Copy LaTeX for screen reader STEM users or notes */}
          <button
            type="button"
            onClick={handleCopyLatex}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-foreground-secondary hover:text-foreground bg-surface border border-border hover:bg-surface-elevated min-h-[34px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={`Copy formula LaTeX: ${formula.visualText}`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-status-success" aria-hidden="true" />
                <span className="text-status-success font-bold">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Copy LaTeX</span>
              </>
            )}
          </button>

          {/* Listen to phonetic formula audio */}
          <button
            type="button"
            onClick={handleReadFormula}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/30 min-h-[34px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={`Listen to formula: ${formula.accessibleText}`}
          >
            <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{isSpeaking ? 'Listening...' : 'Listen'}</span>
          </button>
        </div>
      </div>

      {/* Visual mathematical formula representation with KaTeX rendering */}
      <div className="py-3 px-4 rounded-xl bg-surface border border-border overflow-x-auto text-center flex items-center justify-center min-h-[60px]">
        <KaTeXMath
          math={formula.visualText}
          displayMode
          accessibleText={formula.accessibleText}
          className="text-base sm:text-lg text-foreground font-semibold"
        />
      </div>

      {/* Screen reader plain-language phonetic alternative */}
      <div className="p-3 rounded-lg bg-surface border border-border/80 text-xs">
        <span className="font-mono text-[10px] uppercase font-bold text-foreground-muted block mb-1">
          Phonetic Speech Transcript:
        </span>
        <p className="text-xs font-medium text-foreground italic leading-relaxed">
          &ldquo;{formula.accessibleText}&rdquo;
        </p>
      </div>

      {formula.explanation && (
        <p className="text-xs text-foreground-secondary leading-relaxed pt-1">
          <strong className="font-semibold text-foreground">Usage &amp; Context:</strong>{' '}
          {formula.explanation}
        </p>
      )}
    </figure>
  );
};
