import React, { useEffect, useRef } from 'react';
import { LearningTopic, LearningFormula } from '../../types/learning';
import { FormulaBlock } from './FormulaBlock';
import { Variable, X, Volume2, Sparkles, ArrowRight, BookOpen } from 'lucide-react';
import { useAccessibility } from '../../contexts/AccessibilityContext';

interface TopicFormulasModalProps {
  isOpen: boolean;
  onClose: () => void;
  topic: LearningTopic;
  formulas: (LearningFormula & { sectionTitle?: string })[];
  onStartPractice?: () => void;
}

export const TopicFormulasModal: React.FC<TopicFormulasModalProps> = ({
  isOpen,
  onClose,
  topic,
  formulas,
  onStartPractice,
}) => {
  const { speak, isSpeaking, announce } = useAccessibility();
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Focus management and Escape key handler
  useEffect(() => {
    if (!isOpen) return;

    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        announce('Formulas modal closed.', 'polite');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, announce]);

  if (!isOpen) return null;

  const isPercentages = topic.id === 'percentages' || topic.name.toLowerCase().includes('percentage');
  const isAlgebra = topic.id === 'algebra' || topic.name.toLowerCase().includes('algebra');
  const isGeometry = topic.id === 'geometry' || topic.name.toLowerCase().includes('geometry');

  // Read all formulas aloud sequentially
  const handleReadAllFormulas = () => {
    let fullText = `Formulas for ${topic.name}. `;
    if (formulas.length > 0) {
      fullText += formulas
        .map((f, i) => `Formula ${i + 1}: ${f.accessibleText}. ${f.explanation || ''}`)
        .join(' ');
    } else {
      fullText += 'Review the key reference rules below.';
    }

    if (isPercentages) {
      fullText += ' Common Fraction to Percentage conversions: 1 by 2 is 50 percent, 1 by 3 is 33.33 percent, 1 by 4 is 25 percent, 1 by 5 is 20 percent, 1 by 8 is 12.5 percent, and 1 by 10 is 10 percent.';
    }

    fullText += ' Say Option 3 or click Start Practice to test your knowledge.';
    speak(fullText);
    announce(`Reading all formulas for ${topic.name}`, 'polite');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="topic-formulas-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-background/80 backdrop-blur-sm animate-fade-in"
    >
      <div
        ref={modalRef}
        className="w-full max-w-2xl max-h-[85vh] rounded-3xl border border-border bg-surface shadow-2xl flex flex-col overflow-hidden animate-scale-in"
      >
        {/* Modal Header */}
        <header className="p-5 sm:p-6 border-b border-border flex items-center justify-between gap-4 bg-surface-elevated/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-primary/10 text-primary flex-shrink-0" aria-hidden="true">
              <Variable className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                Formula Cheat-Sheet (Option 2)
              </span>
              <h2 id="topic-formulas-modal-title" className="text-base sm:text-lg font-extrabold text-foreground leading-tight">
                {topic.name} — Essential Formulas
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReadAllFormulas}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary font-bold text-xs min-h-[38px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-xs"
              aria-label="Listen to all formulas aloud"
            >
              <Volume2 className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">{isSpeaking ? 'Listening...' : 'Listen All'}</span>
            </button>

            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl border border-border hover:bg-surface-elevated text-foreground-secondary hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[38px] min-w-[38px] transition-colors"
              aria-label="Close formulas dialog (Escape)"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </header>

        {/* Modal Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex flex-col gap-6 text-xs text-foreground">
          {/* Formula Blocks */}
          {formulas.length > 0 ? (
            <div className="flex flex-col gap-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground-secondary">
                Standard Mathematical Formulas ({formulas.length})
              </h3>
              {formulas.map((formula) => (
                <FormulaBlock key={formula.id} formula={formula} />
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-2xl border border-dashed border-border bg-surface-elevated/30 text-center flex flex-col items-center gap-2">
              <BookOpen className="w-8 h-8 text-foreground-muted" aria-hidden="true" />
              <p className="font-semibold text-foreground">Core Topic Reference Rules</p>
              <p className="text-foreground-secondary text-[11px] leading-relaxed">
                Review the foundational concept principles and proceed to practice questions.
              </p>
            </div>
          )}

          {/* Special Percentages Reference Table */}
          {isPercentages && (
            <div className="p-4 sm:p-5 rounded-2xl border border-primary/30 bg-primary/5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Key Fraction to Percentage Conversions</span>
                </h3>
                <span className="text-[10px] font-semibold text-foreground-secondary">High-Frequency Table</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div className="p-2.5 rounded-xl bg-surface border border-border text-center">
                  <span className="font-mono font-bold text-foreground">1/2</span> = <span className="font-bold text-primary">50%</span>
                </div>
                <div className="p-2.5 rounded-xl bg-surface border border-border text-center">
                  <span className="font-mono font-bold text-foreground">1/3</span> = <span className="font-bold text-primary">33.33%</span>
                </div>
                <div className="p-2.5 rounded-xl bg-surface border border-border text-center">
                  <span className="font-mono font-bold text-foreground">1/4</span> = <span className="font-bold text-primary">25%</span>
                </div>
                <div className="p-2.5 rounded-xl bg-surface border border-border text-center">
                  <span className="font-mono font-bold text-foreground">1/5</span> = <span className="font-bold text-primary">20%</span>
                </div>
                <div className="p-2.5 rounded-xl bg-surface border border-border text-center">
                  <span className="font-mono font-bold text-foreground">1/8</span> = <span className="font-bold text-primary">12.5%</span>
                </div>
                <div className="p-2.5 rounded-xl bg-surface border border-border text-center">
                  <span className="font-mono font-bold text-foreground">1/10</span> = <span className="font-bold text-primary">10%</span>
                </div>
              </div>
            </div>
          )}

          {/* Special Algebra Reference Table */}
          {isAlgebra && (
            <div className="p-4 sm:p-5 rounded-2xl border border-primary/30 bg-primary/5 flex flex-col gap-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary">
                Fundamental Algebraic Identities
              </h3>
              <ul className="flex flex-col gap-1.5 font-mono text-xs text-foreground bg-surface p-3 rounded-xl border border-border">
                <li>• (a + b)² = a² + 2ab + b²</li>
                <li>• (a - b)² = a² - 2ab + b²</li>
                <li>• a² - b² = (a - b)(a + b)</li>
                <li>• (a + b)³ = a³ + b³ + 3ab(a + b)</li>
              </ul>
            </div>
          )}

          {/* Special Geometry Reference Table */}
          {isGeometry && (
            <div className="p-4 sm:p-5 rounded-2xl border border-primary/30 bg-primary/5 flex flex-col gap-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary">
                Core Mensuration & Geometry Formulas
              </h3>
              <ul className="flex flex-col gap-1.5 font-mono text-xs text-foreground bg-surface p-3 rounded-xl border border-border">
                <li>• Triangle Area = ½ × base × height</li>
                <li>• Pythagoras Theorem: a² + b² = c²</li>
                <li>• Circle Area = πr², Circumference = 2πr</li>
                <li>• Rectangle Area = length × breadth</li>
              </ul>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <footer className="p-4 sm:p-5 border-t border-border flex items-center justify-between gap-3 bg-surface-elevated/40">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-border hover:bg-surface-elevated text-xs font-semibold text-foreground min-h-[40px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Close (Esc)
          </button>

          {onStartPractice && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onStartPractice();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover active:bg-primary-hover text-primary-contrast font-bold text-xs min-h-[40px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-sm transition-colors"
            >
              <span>Start Practice (Option 3)</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}
        </footer>
      </div>
    </div>
  );
};
