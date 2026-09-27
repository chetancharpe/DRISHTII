import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../common/Card';
import { Exam } from '../../types/exam';

export interface ExamCardProps {
  exam: Exam;
}

export const ExamCard: React.FC<ExamCardProps> = ({ exam }) => {
  return (
    <Card className="flex flex-col justify-between gap-4">
      <div>
        <div className="flex items-center justify-between text-xs text-foreground-muted mb-2">
          <span className="font-semibold text-primary">{exam.category || 'Standard Assessment'}</span>
          <span>⏱️ {exam.durationMinutes || exam.duration} mins</span>
        </div>
        <h4 className="text-base font-bold text-foreground mb-1">{exam.title}</h4>
        <p className="text-xs text-foreground-muted line-clamp-2">{exam.description}</p>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-border text-xs">
        <span className="text-foreground-muted font-medium">{exam.totalQuestions} Questions</span>
        <Link
          to={`/candidate/exam/${exam.id}`}
          className="font-bold text-primary hover:underline"
          aria-label={`Start or resume examination: ${exam.title}`}
        >
          Take Exam →
        </Link>
      </div>
    </Card>
  );
};
