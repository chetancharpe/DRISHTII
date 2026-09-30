import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../common/Card';
import { MockTest } from '../../types/mockTest';
import { Clock, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

interface MockTestCardProps {
  test: MockTest;
}

export const MockTestCard: React.FC<MockTestCardProps> = ({ test }) => {
  if (!test) return null;

  const isCompleted = test.status === 'completed';
  const isInProgress = test.status === 'in_progress';
  const examCode = test.examCode || 'UPSC-CDS';
  const title = test.title || 'Mock Examination';
  const description = test.description || 'Comprehensive mock practice test for exam preparation.';
  const totalQuestions = test.totalQuestions ?? 6;
  const durationMinutes = test.durationMinutes ?? 45;
  const difficulty = test.difficulty || 'medium';
  const sections = Array.isArray(test.sections) ? test.sections : [];

  return (
    <Card className="flex flex-col justify-between h-full hover:border-primary/40 transition-colors">
      <div className="flex flex-col gap-3.5">
        {/* Header badges */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
            {examCode} • Mock Simulation
          </span>

          {test.isRecommended && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
              <Sparkles className="w-2.5 h-2.5" aria-hidden="true" />
              <span>Recommended</span>
            </span>
          )}

          {isCompleted && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-success/10 text-success border border-success/20">
              <CheckCircle2 className="w-2.5 h-2.5" aria-hidden="true" />
              <span>Completed</span>
            </span>
          )}

          {isInProgress && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-primary/15 text-primary border border-primary/30">
              <span>In Progress</span>
            </span>
          )}
        </div>

        {/* Title & Description */}
        <div>
          <h3 className="text-base font-bold text-foreground leading-snug">
            {title}
          </h3>
          <p className="text-xs text-foreground-secondary leading-relaxed mt-1">
            {description}
          </p>
        </div>

        {/* Sections list */}
        {sections.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="text-[11px] font-semibold text-foreground-secondary mr-1 self-center">
              Sections:
            </span>
            {sections.map((s, sIdx) => {
              const secName = s?.name || (s as any)?.title || `Section ${sIdx + 1}`;
              return (
                <span
                  key={s?.id || `sec-${sIdx}`}
                  className="px-2 py-0.5 rounded text-[11px] font-medium bg-surface-elevated text-foreground border border-border"
                >
                  {secName}
                </span>
              );
            })}
          </div>
        )}

        {/* Test Parameters Metadata */}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border text-xs">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-foreground-secondary">Questions</span>
            <span className="font-bold text-foreground">{totalQuestions}</span>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-foreground-secondary">Duration</span>
            <span className="font-medium text-foreground inline-flex items-center gap-1">
              <Clock className="w-3 h-3 text-foreground-muted" aria-hidden="true" />
              <span>{durationMinutes} min</span>
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-foreground-secondary">Difficulty</span>
            <span className="font-medium text-foreground capitalize">{difficulty}</span>
          </div>
        </div>
      </div>

      {/* Action CTA */}
      <div className="pt-4 mt-auto flex items-center gap-2">
        <Link
          to={`/candidate/mock-tests/${test.id || 'cds-full-mock-01'}/session`}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-primary hover:bg-primary-hover active:bg-primary-hover text-primary-contrast font-bold text-xs min-h-[42px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-sm transition-colors"
          aria-label={`Start ${title}`}
        >
          <span>Start Test</span>
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
        <Link
          to={`/candidate/mock-tests/${test.id || 'cds-full-mock-01'}`}
          className="inline-flex items-center justify-center px-3 py-2.5 rounded-lg bg-surface hover:bg-surface-elevated active:bg-surface-elevated border border-border hover:border-primary/40 text-foreground font-semibold text-xs min-h-[42px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
          aria-label={`View syllabus and overview for ${title}`}
        >
          <span>Details</span>
        </Link>
      </div>
    </Card>
  );
};
