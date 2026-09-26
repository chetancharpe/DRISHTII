import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { MOCK_EXAMS } from '../../utils/mockData';

export const ExamDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const exam = MOCK_EXAMS.find((e) => e.id === id) || MOCK_EXAMS[0];

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <Card title={exam.title} subtitle={`Official Instructions & Gating Specifications • Code: ${exam.id}`}>
        <div className="flex flex-col gap-4 text-sm text-foreground my-2">
          <p>{exam.description}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-surface-elevated rounded border border-border">
            <div>
              <span className="text-xs text-foreground-muted block">Duration</span>
              <strong className="text-base">{exam.duration} Minutes</strong>
            </div>
            <div>
              <span className="text-xs text-foreground-muted block">Questions</span>
              <strong className="text-base">{exam.totalQuestions} Items</strong>
            </div>
            <div>
              <span className="text-xs text-foreground-muted block">Total Marks</span>
              <strong className="text-base">{exam.totalMarks || 100} Pts</strong>
            </div>
            <div>
              <span className="text-xs text-foreground-muted block">Passing Target</span>
              <strong className="text-base">{exam.passingMarks || 40}%</strong>
            </div>
          </div>
          <div className="p-4 bg-surface-elevated rounded border border-border">
            <h4 className="font-bold mb-2">Accessibility Navigation Keybindings:</h4>
            <ul className="list-disc list-inside space-y-1 text-xs text-foreground-muted">
              <li><kbd>N</kbd> / <kbd>→</kbd> Advance to Next Question</li>
              <li><kbd>P</kbd> / <kbd>←</kbd> Return to Previous Question</li>
              <li><kbd>1</kbd> to <kbd>4</kbd> Direct Option Selection</li>
              <li><kbd>Alt</kbd> + <kbd>T</kbd> Announce Remaining Exam Time</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border">
          <Link to="/candidate/exams">
            <Button variant="secondary">Back to Library</Button>
          </Link>
          <Link to={`/candidate/exam/${exam.id}`}>
            <Button variant="primary" size="lg">
              Begin Live Assessment →
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};
