import React from 'react';
import { QuestionOption } from '../../types/question';

export interface QuestionOptionsProps {
  options?: QuestionOption[];
  selectedOptionId?: string;
  onSelectOption?: (optionId: string) => void;
}

export const QuestionOptions: React.FC<QuestionOptionsProps> = ({
  options = [],
  selectedOptionId,
  onSelectOption,
}) => {
  return (
    <fieldset className="flex flex-col gap-2.5 my-4 border-0 p-0 m-0">
      <legend className="sr-only">Available Answer Options</legend>
      {options.map((opt, idx) => (
        <label
          key={opt.id}
          className={`flex items-center gap-3 p-3.5 rounded border cursor-pointer select-none min-h-[44px] transition-colors ${
            selectedOptionId === opt.id
              ? 'border-primary bg-primary/10 text-foreground font-semibold'
              : 'border-border bg-surface hover:bg-surface-elevated text-foreground'
          }`}
        >
          <input
            type="radio"
            name="exam-option"
            value={opt.id}
            checked={selectedOptionId === opt.id}
            onChange={() => onSelectOption?.(opt.id)}
            className="w-4 h-4 text-primary focus-visible:outline focus-visible:outline-3 focus-visible:outline-focus"
          />
          <span className="font-bold text-foreground-muted">{String.fromCharCode(65 + idx)}.</span>
          <span>{opt.text}</span>
        </label>
      ))}
    </fieldset>
  );
};
