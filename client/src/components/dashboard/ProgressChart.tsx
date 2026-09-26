import React from 'react';
import { Card } from '../common/Card';
import { SubjectScore } from '../../types/analytics';

export interface ProgressChartProps {
  scores?: SubjectScore[];
}

export const ProgressChart: React.FC<ProgressChartProps> = ({ scores = [] }) => {
  return (
    <Card title="Subject Performance Parity" subtitle="Empirical accuracy breakdown across tested subject areas">
      {/* Visual Chart Placeholder */}
      <div className="flex flex-col gap-3 my-2">
        {scores.map((s) => (
          <div key={s.subject} className="flex flex-col gap-1">
            <div className="flex justify-between text-xs font-semibold">
              <span>{s.subject}</span>
              <span>{s.accuracyPercentage}%</span>
            </div>
            <div className="w-full bg-surface-elevated rounded-full h-2 overflow-hidden border border-border">
              <div
                className="bg-primary h-full rounded-full transition-all"
                style={{ width: `${s.accuracyPercentage}%` }}
                aria-hidden="true"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Screen Reader Data Table Fallback */}
      <table className="sr-only">
        <caption>Subject Performance Telemetry Table</caption>
        <thead>
          <tr>
            <th scope="col">Subject</th>
            <th scope="col">Accuracy</th>
            <th scope="col">Raw Score</th>
          </tr>
        </thead>
        <tbody>
          {scores.map((s) => (
            <tr key={s.subject}>
              <td>{s.subject}</td>
              <td>{s.accuracyPercentage}%</td>
              <td>
                {s.score} of {s.total}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
};
