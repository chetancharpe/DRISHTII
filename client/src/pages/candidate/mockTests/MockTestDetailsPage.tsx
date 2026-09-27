import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MockTest } from '../../../types/mockTest';
import { mockTestService } from '../../../services/mockTestService';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

export const MockTestDetailsPage: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const [test, setTest] = useState<MockTest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTest() {
      if (!testId) return;
      try {
        setIsLoading(true);
        const data = await mockTestService.getMockTest(testId);
        if (!data) {
          setError('Mock examination could not be found.');
        } else {
          setTest(data);
        }
      } catch (err) {
        setError('Error loading test parameters.');
      } finally {
        setIsLoading(false);
      }
    }
    loadTest();
  }, [testId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 gap-3" role="status">
        <Loader2 className="w-8 h-8 animate-spin text-primary" aria-hidden="true" />
        <p className="text-xs font-semibold text-foreground-secondary">
          Loading test syllabus details...
        </p>
      </div>
    );
  }

  if (error || !test) {
    return (
      <div className="p-8 rounded-xl border border-border bg-surface text-center flex flex-col items-center gap-4 max-w-md mx-auto">
        <p className="text-sm font-bold text-foreground">{error || 'Test not found.'}</p>
        <Link
          to="/candidate/mock-tests"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-contrast text-xs font-bold min-h-[40px]"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Back to All Mock Tests</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto">
      {/* Top back navigation */}
      <div>
        <Link
          to="/candidate/mock-tests"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline p-1 min-h-[36px] rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Back to Mock Tests Directory</span>
        </Link>
      </div>

      {/* Main Test Title Header */}
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded border border-primary/20">
            {test.examCode} • {test.examName}
          </span>
          <span className="text-xs text-foreground-secondary">
            Practice Simulation
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          {test.title}
        </h1>

        <p className="text-sm text-foreground-secondary leading-relaxed">
          {test.description}
        </p>

        {/* Highlight Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 rounded-xl border border-border bg-surface flex flex-col">
            <span className="text-[10px] uppercase font-bold text-foreground-secondary">Questions</span>
            <span className="font-mono text-lg font-bold text-foreground">{test.totalQuestions}</span>
          </div>

          <div className="p-3.5 rounded-xl border border-border bg-surface flex flex-col">
            <span className="text-[10px] uppercase font-bold text-foreground-secondary">Duration</span>
            <span className="font-mono text-lg font-bold text-foreground">{test.durationMinutes} min</span>
          </div>

          <div className="p-3.5 rounded-xl border border-border bg-surface flex flex-col">
            <span className="text-[10px] uppercase font-bold text-foreground-secondary">Marking Scheme</span>
            <span className="font-mono text-xs font-bold text-foreground mt-1">
              +{test.markingScheme.correctMarks} / -{test.markingScheme.incorrectPenalty}
            </span>
          </div>

          <div className="p-3.5 rounded-xl border border-border bg-surface flex flex-col">
            <span className="text-[10px] uppercase font-bold text-foreground-secondary">Difficulty</span>
            <span className="text-xs font-bold text-foreground capitalize mt-1">{test.difficulty}</span>
          </div>
        </div>
      </header>

      {/* Section Distribution */}
      <section aria-labelledby="sections-dist-heading" className="flex flex-col gap-3">
        <h2 id="sections-dist-heading" className="text-sm font-bold uppercase tracking-wider text-foreground">
          Examination Sections
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {test.sections.map((sec) => (
            <div
              key={sec.id}
              className="p-4 rounded-xl border border-border bg-surface flex flex-col gap-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">{sec.name}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                  {sec.code}
                </span>
              </div>
              <p className="text-xs text-foreground-secondary">{sec.description}</p>
              <span className="text-[11px] font-semibold text-foreground mt-1">
                {sec.totalQuestions} questions
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Accessibility Support Breakdown (Requirement #6) */}
      <section aria-labelledby="a11y-support-heading" className="flex flex-col gap-3">
        <h2 id="a11y-support-heading" className="text-sm font-bold uppercase tracking-wider text-foreground">
          Accessibility Support Specifications
        </h2>
        <div className="p-5 rounded-2xl border border-border bg-surface-elevated/40 flex flex-col gap-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <strong className="text-foreground">Keyboard Navigation: </strong>
                <span className="text-foreground-secondary">{test.accessibilityHighlights.keyboard}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <strong className="text-foreground">Screen Reader Compatibility: </strong>
                <span className="text-foreground-secondary">{test.accessibilityHighlights.screenReader}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <strong className="text-foreground">Audio Assistance: </strong>
                <span className="text-foreground-secondary">{test.accessibilityHighlights.audio}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <strong className="text-foreground">Visual Adaptation: </strong>
                <span className="text-foreground-secondary">{test.accessibilityHighlights.visual}</span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-foreground-secondary border-t border-border pt-2 italic">
            Note: Designed for keyboard, screen-reader, and high-contrast usability. Does not claim official certification.
          </p>
        </div>
      </section>

      {/* Instructions Summary */}
      <section aria-labelledby="inst-sum-heading" className="flex flex-col gap-3">
        <h2 id="inst-sum-heading" className="text-sm font-bold uppercase tracking-wider text-foreground">
          Instructions Overview
        </h2>
        <ul className="flex flex-col gap-2 list-disc pl-5 text-xs text-foreground leading-relaxed">
          {test.instructionsSummary.map((inst, i) => (
            <li key={i}>{inst}</li>
          ))}
        </ul>
      </section>

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl border border-primary/30 bg-primary/5 mt-4">
        <div>
          <h3 className="text-sm font-bold text-foreground">
            Ready to simulate the examination?
          </h3>
          <p className="text-xs text-foreground-secondary">
            Read complete navigation guidelines and accept test rules to begin.
          </p>
        </div>

        <Link
          to={`/candidate/mock-tests/${test.id}/instructions`}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover active:bg-primary-hover text-primary-contrast font-bold text-xs min-h-[48px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-sm transition-colors flex-shrink-0"
        >
          <span>Continue to Instructions</span>
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
};
