import React from 'react';
import { Card } from '../common/Card';
import { Exam } from '../../types/exam';

export interface ExamTableProps {
  exams?: Exam[];
}

export const ExamTable: React.FC<ExamTableProps> = ({ exams = [] }) => {
  return (
    <Card title="Published Test Suites" subtitle="Authoritative examination catalog and candidate registration status">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-foreground">
          <thead className="text-xs uppercase bg-surface-elevated text-foreground-muted border-b border-border">
            <tr>
              <th scope="col" className="px-4 py-3">Code / ID</th>
              <th scope="col" className="px-4 py-3">Title</th>
              <th scope="col" className="px-4 py-3">Duration</th>
              <th scope="col" className="px-4 py-3">Questions</th>
              <th scope="col" className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {exams.map((ex) => (
              <tr key={ex.id} className="border-b border-border hover:bg-surface-elevated/50">
                <td className="px-4 py-3 font-mono text-xs">{ex.id}</td>
                <td className="px-4 py-3 font-medium">{ex.title}</td>
                <td className="px-4 py-3">{ex.duration}m</td>
                <td className="px-4 py-3">{ex.totalQuestions}</td>
                <td className="px-4 py-3 capitalize">
                  <span className="px-2 py-0.5 rounded text-xs bg-status-success/10 text-status-success border border-status-success/30 font-semibold">
                    {ex.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
