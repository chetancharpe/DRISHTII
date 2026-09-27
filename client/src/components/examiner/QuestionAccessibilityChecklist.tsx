import React from 'react';
import { AccessibilityChecklistResult } from '../../services/questionBankService';
import { CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';

interface QuestionAccessibilityChecklistProps {
  validation: AccessibilityChecklistResult;
  showDetails?: boolean;
}

export const QuestionAccessibilityChecklist: React.FC<QuestionAccessibilityChecklistProps> = ({
  validation,
  showDetails = true,
}) => {
  const items = [
    {
      label: 'Question has readable prompt text',
      passed: validation.hasReadableText,
      required: true,
    },
    {
      label: 'Image contains descriptive Alt Text',
      passed: validation.hasAltTextIfImage,
      required: true,
    },
    {
      label: 'Information is not provided in image only',
      passed: validation.noImageOnlyInformation,
      required: true,
    },
    {
      label: 'Tables have semantic header columns',
      passed: validation.tableHasHeaders,
      required: true,
    },
    {
      label: 'Formulas have accessible ClearSpeak transcription',
      passed: validation.formulaHasAccessibleSpeech,
      required: true,
    },
    {
      label: 'Options have meaningful and distinct labels',
      passed: validation.optionsHaveMeaningfulLabels,
      required: true,
    },
    {
      label: 'Primary content language is specified',
      passed: validation.languageSpecified,
      required: false,
    },
    {
      label: 'No color-only instructions detected',
      passed: validation.noColorOnlyInstructions,
      required: false,
    },
  ];

  return (
    <div
      className="p-4 rounded-xl border border-border bg-surface-elevated flex flex-col gap-3"
      role="region"
      aria-label="Question Accessibility Validation Checklist"
    >
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-foreground">Accessibility Gate Status:</span>
          {validation.isFullyAccessible ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-status-success/15 text-status-success border border-status-success/30">
              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
              Passed 100%
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-status-error/15 text-status-error border border-status-error/30">
              <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
              {validation.blockingErrors.length} Blocking Issue{validation.blockingErrors.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
        {validation.warnings.length > 0 && (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-status-warning/15 text-status-warning border border-status-warning/30">
            <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
            {validation.warnings.length} Warning{validation.warnings.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {showDetails && (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-border/70 text-xs">
          {items.map((item, idx) => (
            <li
              key={idx}
              className={`flex items-center gap-2 p-2 rounded-lg border ${
                item.passed
                  ? 'bg-surface border-border text-foreground'
                  : item.required
                  ? 'bg-status-error/5 border-status-error/30 text-status-error'
                  : 'bg-status-warning/5 border-status-warning/30 text-status-warning'
              }`}
            >
              {item.passed ? (
                <CheckCircle2 className="w-4 h-4 text-status-success shrink-0" aria-hidden="true" />
              ) : item.required ? (
                <XCircle className="w-4 h-4 text-status-error shrink-0" aria-hidden="true" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-status-warning shrink-0" aria-hidden="true" />
              )}
              <span className="truncate">{item.label}</span>
            </li>
          ))}
        </ul>
      )}

      {validation.blockingErrors.length > 0 && (
        <div className="p-3 rounded-lg bg-status-error/10 border border-status-error/30 text-xs text-status-error flex flex-col gap-1">
          <span className="font-bold flex items-center gap-1.5">
            <XCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            Blocking Accessibility Errors (Must Resolve Before Publish):
          </span>
          <ul className="list-disc list-inside space-y-0.5 ml-2">
            {validation.blockingErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {validation.warnings.length > 0 && (
        <div className="p-3 rounded-lg bg-status-warning/10 border border-status-warning/30 text-xs text-status-warning flex flex-col gap-1">
          <span className="font-bold flex items-center gap-1.5">
            <Info className="w-4 h-4 shrink-0" aria-hidden="true" />
            Inclusive Design Recommendations:
          </span>
          <ul className="list-disc list-inside space-y-0.5 ml-2">
            {validation.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
