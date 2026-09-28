import React from 'react';
import { KaTeXMath } from './KaTeXMath';

interface RichMathTextProps {
  text: string;
  className?: string;
  spokenFallback?: string;
}

/**
 * Parses text containing inline ($...$) or block ($$...$$) LaTeX expressions
 * and renders them using KaTeX paired with screen-reader accessible alternatives.
 */
export const RichMathText: React.FC<RichMathTextProps> = ({
  text,
  className = '',
  spokenFallback,
}) => {
  if (!text) return null;

  // Split on $$...$$ or $...$
  const regex = /(\$\$[\s\S]+?\$\$|\$[^\$]+?\$)/g;
  const parts = text.split(regex);

  if (parts.length === 1) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          const math = part.slice(2, -2);
          return (
            <KaTeXMath
              key={index}
              math={math}
              displayMode={false}
              accessibleText={spokenFallback}
            />
          );
        } else if (part.startsWith('$') && part.endsWith('$')) {
          const math = part.slice(1, -1);
          return (
            <KaTeXMath
              key={index}
              math={math}
              displayMode={false}
              accessibleText={spokenFallback}
            />
          );
        }
        return <React.Fragment key={index}>{part}</React.Fragment>;
      })}
    </span>
  );
};
