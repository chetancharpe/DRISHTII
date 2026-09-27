import React from 'react';
import { ExamOption, ExamQuestionType } from '../../types/exam';
import { Check, RotateCcw } from 'lucide-react';

interface ExamAnswerControlProps {
  questionId: string;
  type: ExamQuestionType;
  options: ExamOption[];
  selectedOptions: string[];
  onChange: (selected: string[]) => void;
  onClear: () => void;
  disabled?: boolean;
}

export const ExamAnswerControl: React.FC<ExamAnswerControlProps> = ({
  questionId,
  type,
  options,
  selectedOptions,
  onChange,
  onClear,
  disabled = false,
}) => {
  const isMultiple = type === 'multiple_choice';

  const handleOptionToggle = (optionId: string) => {
    if (disabled) return;

    if (isMultiple) {
      if (selectedOptions.includes(optionId)) {
        onChange(selectedOptions.filter((id) => id !== optionId));
      } else {
        onChange([...selectedOptions, optionId]);
      }
    } else {
      onChange([optionId]);
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      <div
        role={isMultiple ? 'group' : 'radiogroup'}
        aria-label="Answer choices"
        className="flex flex-col gap-2.5"
      >
        {options.map((opt) => {
          const isSelected = selectedOptions.includes(opt.id);
          const inputId = `opt-${questionId}-${opt.id}`;

          return (
            <label
              key={opt.id}
              htmlFor={inputId}
              className={`flex items-start gap-3.5 p-4 rounded-xl border cursor-pointer select-none transition-all min-h-[52px] ${
                isSelected
                  ? 'border-primary bg-primary/10 shadow-xs ring-1 ring-primary'
                  : 'border-border bg-surface hover:bg-surface-elevated/60 hover:border-foreground/20'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {/* Native Accessible Input (Radio or Checkbox) */}
              <input
                type={isMultiple ? 'checkbox' : 'radio'}
                id={inputId}
                name={`question-${questionId}`}
                value={opt.id}
                checked={isSelected}
                onChange={() => handleOptionToggle(opt.id)}
                disabled={disabled}
                className="mt-0.5 w-5 h-5 rounded-full border-border text-primary focus:ring-primary focus:ring-offset-0 focus:ring-2 flex-shrink-0"
                aria-describedby={`opt-text-${inputId}`}
              />

              {/* Label identifier (e.g. A, B, C, D) */}
              <div className="flex items-center justify-center w-6 h-6 rounded-lg text-xs font-bold border flex-shrink-0 transition-colors bg-surface-elevated border-border text-foreground">
                {opt.label}
              </div>

              {/* Option Text content */}
              <div className="flex-1 text-sm font-medium text-foreground leading-relaxed pt-0.5" id={`opt-text-${inputId}`}>
                {opt.text}
              </div>

              {/* Visual & High-Contrast Selected Badge */}
              {isSelected && (
                <span
                  className="flex items-center gap-1 text-[11px] font-bold text-primary bg-primary/20 px-2 py-0.5 rounded border border-primary/30 flex-shrink-0"
                  aria-hidden="true"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Selected</span>
                </span>
              )}
            </label>
          );
        })}
      </div>

      {/* Clear Selection Button */}
      {selectedOptions.length > 0 && !disabled && (
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground-secondary hover:text-danger p-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-danger transition-colors min-h-[36px]"
            aria-label="Clear selected answer choice for this question"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Clear Response</span>
          </button>
        </div>
      )}
    </div>
  );
};
