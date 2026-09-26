import React from 'react';
import { Question } from '../../types/question';
import { QuestionOptions } from './QuestionOptions';

export interface QuestionCardProps {
  question?: Question;
  currentIndex?: number;
  totalQuestions?: number;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  currentIndex = 1,
  totalQuestions = 1,
}) => {
  if (!question) {
    return (
      <div className="p-6 bg-surface border border-border rounded-lg text-foreground-muted">
        QuestionCard Placeholder (No question loaded)
      </div>
    );
  }

  return (
    <article className="p-6 bg-surface border border-border rounded-lg text-foreground" aria-labelledby="question-heading">
      <div className="flex items-center justify-between border-b border-border pb-2 mb-4 text-xs font-semibold text-foreground-muted">
        <span id="question-heading">
          Question {currentIndex} of {totalQuestions}
        </span>
        <span className="uppercase px-2 py-0.5 rounded bg-surface-elevated border border-border">
          {question.subject} • {question.topic}
        </span>
      </div>

      <p className="text-lg font-medium leading-relaxed my-3">{question.text}</p>

      <QuestionOptions options={question.options} />
    </article>
  );
};
