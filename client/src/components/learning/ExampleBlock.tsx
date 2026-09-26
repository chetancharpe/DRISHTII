import React from 'react';
import { LearningExample } from '../../types/learning';
import { HelpCircle, CheckCircle2 } from 'lucide-react';

interface ExampleBlockProps {
  example: LearningExample;
  index?: number;
}

export const ExampleBlock: React.FC<ExampleBlockProps> = ({ example, index }) => {
  return (
    <article
      aria-labelledby={`example-heading-${example.id}`}
      className="p-5 rounded-xl border border-border bg-surface-elevated/40 my-4 flex flex-col gap-3.5"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="p-1 rounded bg-secondary/10 text-secondary" aria-hidden="true">
          <HelpCircle className="w-4 h-4" />
        </div>
        <h4 id={`example-heading-${example.id}`} className="text-xs font-bold uppercase tracking-wider text-foreground">
          Worked Example {index ? `#${index}` : ''}
        </h4>
      </div>

      {/* Question */}
      <div className="p-3.5 rounded-lg bg-surface border border-border">
        <p className="text-xs font-semibold text-foreground-secondary mb-1 uppercase tracking-wide">
          Question
        </p>
        <p className="text-sm font-bold text-foreground leading-relaxed">
          {example.question}
        </p>
      </div>

      {/* Step by step solution */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-bold text-foreground-secondary uppercase tracking-wide">
          Step-by-Step Solution:
        </p>
        <ol className="flex flex-col gap-1.5 list-decimal pl-5 text-xs text-foreground leading-relaxed">
          {example.steps.map((step, idx) => (
            <li key={idx} className="pl-1">
              {step}
            </li>
          ))}
        </ol>
      </div>

      {/* Final Answer */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-success/10 border border-success/20">
        <span className="text-xs font-bold text-success-contrast inline-flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-success" aria-hidden="true" />
          <span>Final Answer:</span>
        </span>
        <span className="font-mono text-sm font-bold text-foreground bg-surface px-2.5 py-1 rounded border border-border">
          {example.answer}
        </span>
      </div>

      {/* Explanation */}
      {example.explanation && (
        <p className="text-xs text-foreground-secondary leading-relaxed border-t border-border pt-2 italic">
          <strong className="not-italic font-semibold text-foreground">Why: </strong>
          {example.explanation}
        </p>
      )}
    </article>
  );
};
