import React, { useMemo } from 'react';
import katex from 'katex';

export interface KaTeXMathProps {
  math: string;
  displayMode?: boolean;
  accessibleText?: string;
  phoneticLabel?: string;
  className?: string;
}

/**
 * Accessible KaTeX Mathematical Formula Component.
 * Renders mathematical expressions with proper typography,
 * paired with mandatory phonetic screen-reader text.
 */
export const KaTeXMath: React.FC<KaTeXMathProps> = ({
  math,
  displayMode = false,
  accessibleText,
  phoneticLabel,
  className = '',
}) => {
  const label = phoneticLabel || accessibleText || math;
  const html = useMemo(() => {
    try {
      return katex.renderToString(math.trim(), {
        displayMode,
        throwOnError: false,
        output: 'htmlAndMathml',
      });
    } catch {
      return null;
    }
  }, [math, displayMode]);

  return (
    <span
      role="math"
      aria-label={label}
      className={`inline-block font-serif ${displayMode ? 'block my-2 text-center overflow-x-auto' : ''} ${className}`}
    >
      {html ? (
        <span dangerouslySetInnerHTML={{ __html: html }} aria-hidden="true" />
      ) : (
        <code className="font-mono text-sm px-1.5 py-0.5 rounded bg-surface-elevated border border-border">
          {math}
        </code>
      )}
      {/* Visually hidden phonetic text for screen readers */}
      <span className="sr-only">
        {label}
      </span>
    </span>
  );
};
