import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Exam } from '../../../types/exam';
import { examService } from '../../../services/examService';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

export const ExamDetailsPage: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const [exam, setExam] = useState<Exam | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadExam() {
      if (!examId) return;
      try {
        setIsLoading(true);
        const data = await examService.getExam(examId);
        if (!data) {
          setError('Examination not found in authority registry.');
        } else {
          setExam(data);
        }
      } catch (e) {
        console.error('Failed to load examination', e);
        setError('We could not load this examination. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
    loadExam();
  }, [examId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 gap-3" role="status">
        <Loader2 className="w-8 h-8 animate-spin text-primary" aria-hidden="true" />
        <p className="text-xs font-semibold text-foreground-secondary">
          Verifying examination specification...
        </p>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="p-8 rounded-xl border border-border bg-surface text-center flex flex-col items-center gap-4 max-w-md mx-auto">
        <p className="text-sm font-bold text-foreground">{error || 'Examination record unavailable.'}</p>
        <Link
          to="/candidate/exams"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-contrast text-xs font-bold min-h-[40px]"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Back to Examinations</span>
        </Link>
      </div>
    );
  }

  const isEligible = exam.eligibility.isEligible;

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto pb-12">
      {/* Top back navigation */}
      <div>
        <Link
          to="/candidate/exams"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline p-1 min-h-[36px] rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Back to Examinations Directory</span>
        </Link>
      </div>

      {/* Main Title Header */}
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded border border-primary/20">
            {exam.examCode}
          </span>
          <span className="text-xs text-foreground-secondary font-medium">
            {exam.organization}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          {exam.title}
        </h1>

        <p className="text-sm text-foreground-secondary leading-relaxed">
          {exam.description}
        </p>

        {/* Primary Meta Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
          <div className="p-3.5 rounded-xl border border-border bg-surface flex flex-col">
            <span className="text-[10px] uppercase font-bold text-foreground-secondary">Total Items</span>
            <span className="font-mono text-lg font-bold text-foreground">{exam.totalQuestions} Questions</span>
          </div>

          <div className="p-3.5 rounded-xl border border-border bg-surface flex flex-col">
            <span className="text-[10px] uppercase font-bold text-foreground-secondary">Allocated Duration</span>
            <span className="font-mono text-lg font-bold text-foreground">{exam.durationMinutes} Minutes</span>
          </div>

          <div className="p-3.5 rounded-xl border border-border bg-surface flex flex-col">
            <span className="text-[10px] uppercase font-bold text-foreground-secondary">Marking Scheme</span>
            <span className="font-mono text-xs font-bold text-foreground mt-1">
              +{exam.config.markingScheme.correctMarks} / -{exam.config.markingScheme.incorrectPenalty}
            </span>
          </div>

          <div className="p-3.5 rounded-xl border border-border bg-surface flex flex-col">
            <span className="text-[10px] uppercase font-bold text-foreground-secondary">Schedule</span>
            <span className="text-xs font-bold text-foreground mt-1 capitalize">{exam.date}</span>
          </div>
        </div>
      </header>

      {/* Eligibility State Banner (Section 6) */}
      <section aria-labelledby="eligibility-status-heading">
        <h2 id="eligibility-status-heading" className="sr-only">
          Candidate Eligibility
        </h2>
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 text-xs ${
            isEligible
              ? 'bg-success/10 border-success/30 text-success'
              : 'bg-warning/10 border-warning/30 text-warning'
          }`}
        >
          {isEligible ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
          ) : (
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
          )}
          <div className="flex flex-col gap-1 text-foreground">
            <strong className="text-xs font-bold">
              {isEligible
                ? 'You are eligible to attempt this examination.'
                : 'This examination is not currently available for your account.'}
            </strong>
            <p className="text-xs text-foreground-secondary">
              {exam.eligibility.reason} • Candidate: {exam.eligibility.candidateName} (Roll: {exam.eligibility.rollNumber})
            </p>
          </div>
        </div>
      </section>

      {/* Section Distribution */}
      <section aria-labelledby="exam-sections-heading" className="flex flex-col gap-3">
        <h2 id="exam-sections-heading" className="text-sm font-bold uppercase tracking-wider text-foreground">
          Examination Structure & Sections
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {exam.config.sections.map((sec) => (
            <div
              key={sec.id}
              className="p-4 rounded-xl border border-border bg-surface flex flex-col gap-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">{sec.title}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                  {sec.code}
                </span>
              </div>
              <p className="text-xs text-foreground-secondary leading-relaxed">{sec.description}</p>
              <span className="text-[11px] font-semibold text-foreground mt-1">
                {sec.totalQuestions} questions
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Accessibility Support Specifications */}
      <section aria-labelledby="a11y-specs-heading" className="flex flex-col gap-3">
        <h2 id="a11y-specs-heading" className="text-sm font-bold uppercase tracking-wider text-foreground">
          Accessibility Compliance Features
        </h2>
        <div className="p-5 rounded-2xl border border-border bg-surface-elevated/40 flex flex-col gap-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <strong className="text-foreground">Keyboard Operability: </strong>
                <span className="text-foreground-secondary">{exam.accessibilityHighlights.keyboard}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <strong className="text-foreground">Screen Reader Semantics: </strong>
                <span className="text-foreground-secondary">{exam.accessibilityHighlights.screenReader}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <strong className="text-foreground">Self-Paced Audio: </strong>
                <span className="text-foreground-secondary">{exam.accessibilityHighlights.audio}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <strong className="text-foreground">Visual Adaptation: </strong>
                <span className="text-foreground-secondary">{exam.accessibilityHighlights.visual}</span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-foreground-secondary border-t border-border pt-2 italic">
            Designed to empower visually impaired and low-vision candidates. Does not claim universal certification.
          </p>
        </div>
      </section>

      {/* Instructions Summary */}
      <section aria-labelledby="instructions-sum-heading" className="flex flex-col gap-3">
        <h2 id="instructions-sum-heading" className="text-sm font-bold uppercase tracking-wider text-foreground">
          Essential Examination Rules
        </h2>
        <ul className="flex flex-col gap-2 list-disc pl-5 text-xs text-foreground leading-relaxed">
          {exam.instructionsSummary.map((inst, i) => (
            <li key={i}>{inst}</li>
          ))}
        </ul>
      </section>

      {/* CTA Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl border border-primary/30 bg-primary/5 mt-4">
        <div>
          <h3 className="text-sm font-bold text-foreground">
            Ready to review full instructions?
          </h3>
          <p className="text-xs text-foreground-secondary">
            Read complete technical guidelines and verify your accessibility preferences.
          </p>
        </div>

        <Link
          to={`/candidate/exams/${exam.id}/instructions`}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover active:bg-primary-hover text-primary-contrast font-bold text-xs min-h-[48px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-xs transition-colors flex-shrink-0"
        >
          <span>Proceed to Instructions</span>
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
};
