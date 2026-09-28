import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Wand2,
  RefreshCw,
  Info,
} from 'lucide-react';
import { questionBankService, AltTextEvaluation } from '../../services/questionBankService';

export interface AiAltTextGateProps {
  altText: string;
  longDescription: string;
  questionContext: string;
  imageUrl?: string;
  onApplySuggestion: (suggestedAlt: string, suggestedLong?: string) => void;
  className?: string;
}

export const AiAltTextGate: React.FC<AiAltTextGateProps> = ({
  altText,
  longDescription,
  questionContext,
  imageUrl,
  onApplySuggestion,
  className = '',
}) => {
  const [evaluation, setEvaluation] = useState<AltTextEvaluation | null>(null);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [lastEvaluatedText, setLastEvaluatedText] = useState<string>('');

  const runEvaluation = async () => {
    setIsEvaluating(true);
    try {
      const res = await questionBankService.evaluateAltText({
        alt_text: altText,
        long_description: longDescription,
        question_context: questionContext,
        image_url: imageUrl,
      });
      setEvaluation(res);
      setLastEvaluatedText(altText);
    } catch (err) {
      console.error('Failed to run alt text evaluation', err);
    } finally {
      setIsEvaluating(false);
    }
  };

  // Auto-evaluate when alt-text changes after a short debounce
  useEffect(() => {
    if (altText === lastEvaluatedText) return;
    const timer = setTimeout(() => {
      runEvaluation();
    }, 600);
    return () => clearTimeout(timer);
  }, [altText, longDescription, questionContext]); // eslint-disable-line react-hooks/exhaustive-deps

  // Initial evaluation on mount if text exists
  useEffect(() => {
    runEvaluation();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!evaluation && !isEvaluating) return null;

  const score = evaluation?.quality_score ?? 0;
  const isSufficient = evaluation?.is_sufficient ?? false;

  return (
    <div
      role="region"
      aria-label="AI Alt-Text Verification Gate"
      className={`p-4 rounded-xl border transition-all ${
        isSufficient
          ? 'bg-status-success/5 border-status-success/30'
          : score > 30
          ? 'bg-status-warning/5 border-status-warning/30'
          : 'bg-status-error/5 border-status-error/30'
      } ${className}`}
    >
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2.5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" aria-hidden="true" />
          <span className="text-xs font-bold text-foreground">
            AI Alt-Text Verification Gate
          </span>
          {evaluation?.detected_diagram_type && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-surface-elevated border border-border text-foreground-secondary">
              {evaluation.detected_diagram_type}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Quality Score & Status Badge */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
              isSufficient
                ? 'bg-status-success/15 text-status-success'
                : score > 30
                ? 'bg-status-warning/15 text-status-warning'
                : 'bg-status-error/15 text-status-error'
            }`}
          >
            {isSufficient ? (
              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
            ) : score > 30 ? (
              <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
            ) : (
              <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
            )}
            <span>
              {score}% Quality ({evaluation?.wcag_tier === 'PASS_AAA' ? 'WCAG AAA' : evaluation?.wcag_tier === 'PASS_AA' ? 'WCAG AA' : 'Fails Gate'})
            </span>
          </div>

          <button
            type="button"
            onClick={runEvaluation}
            disabled={isEvaluating}
            className="p-1 rounded hover:bg-surface-elevated text-foreground-muted hover:text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            aria-label="Re-analyze alternative text"
            title="Re-analyze"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isEvaluating ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Issues & Warnings */}
      {evaluation && evaluation.issues.length > 0 && (
        <div className="mt-2.5 space-y-1">
          {evaluation.issues.map((issue, idx) => (
            <div key={idx} className="flex items-start gap-1.5 text-xs text-status-error">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{issue}</span>
            </div>
          ))}
        </div>
      )}

      {/* Suggestions & AI Autofill */}
      {evaluation && (
        <div className="mt-3 pt-2.5 border-t border-border/50 flex flex-col gap-2">
          {evaluation.suggestions.length > 0 && (
            <div className="text-xs text-foreground-secondary flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary" aria-hidden="true" />
              <span>{evaluation.suggestions[0]}</span>
            </div>
          )}

          {evaluation.suggested_alt_text && (
            <div className="p-2.5 rounded-lg bg-surface border border-border flex flex-col gap-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary block">
                  AI Recommended Alt-Text:
                </span>
                <p className="text-xs text-foreground font-mono mt-0.5 leading-relaxed">
                  &ldquo;{evaluation.suggested_alt_text}&rdquo;
                </p>
              </div>

              {evaluation.suggested_long_description && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted block">
                    AI Recommended Long Description:
                  </span>
                  <p className="text-xs text-foreground-secondary font-mono mt-0.5 leading-relaxed">
                    &ldquo;{evaluation.suggested_long_description}&rdquo;
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={() =>
                  onApplySuggestion(
                    evaluation.suggested_alt_text,
                    evaluation.suggested_long_description
                  )
                }
                className="self-start inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-primary-contrast font-bold text-xs shadow-2xs focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
              >
                <Wand2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Apply AI Recommendation</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
