import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MockTest } from '../../../types/mockTest';
import { mockTestService, findFallbackMockTest } from '../../../services/mockTestService';
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Loader2,
  Volume2,
} from 'lucide-react';
import { useAccessibility } from '../../../contexts/AccessibilityContext';

export const MockTestInstructionsPage: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const { speak, preferences } = useAccessibility();

  const [test, setTest] = useState<MockTest | null>(() => (testId ? findFallbackMockTest(testId) : null));
  const [hasAgreed, setHasAgreed] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadTest() {
      if (!testId) return;
      try {
        const data = await mockTestService.getMockTest(testId);
        if (isMounted && data) {
          setTest(data);
        }
      } catch (e) {
        console.warn('Could not refresh test in instructions page:', e);
      }
    }
    loadTest();
    return () => {
      isMounted = false;
    };
  }, [testId]);

  const handleStart = async () => {
    if (!test || !hasAgreed) return;
    try {
      setIsStarting(true);
      await mockTestService.startMockTest(test.id);
      navigate(`/candidate/mock-tests/${test.id}/session`);
    } catch (e) {
      console.error('Failed to start mock session', e);
      setIsStarting(false);
    }
  };

  const handleReadInstructions = () => {
    if (!test) return;
    speak(
      `Before You Begin. Test instructions for ${test.title}. Total questions: ${test.totalQuestions}. Duration: ${test.durationMinutes} minutes. Correct answers receive 1 mark. Incorrect answers incur 0.33 negative mark penalty. You can freely navigate between sections and mark questions for review before submitting.`
    );
  };

  useEffect(() => {
    const onVoiceStartTest = async () => {
      if (!test) return;
      setHasAgreed(true);
      try {
        setIsStarting(true);
        await mockTestService.startMockTest(test.id);
        navigate(`/candidate/mock-tests/${test.id}/session`);
      } catch (e) {
        console.error('Failed to start mock session via voice', e);
        setIsStarting(false);
      }
    };

    const onVoiceReadInstructions = () => {
      handleReadInstructions();
    };

    window.addEventListener('drishti:mock-start-test', onVoiceStartTest);
    window.addEventListener('drishti:mock-read-instructions', onVoiceReadInstructions);

    return () => {
      window.removeEventListener('drishti:mock-start-test', onVoiceStartTest);
      window.removeEventListener('drishti:mock-read-instructions', onVoiceReadInstructions);
    };
  }, [test, navigate]);

  if (isLoading || !test) {
    return (
      <div className="flex flex-col items-center justify-center p-16 gap-3" role="status">
        <Loader2 className="w-8 h-8 animate-spin text-primary" aria-hidden="true" />
        <p className="text-xs font-semibold text-foreground-secondary">
          Loading test instructions...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto">
      {/* Back button */}
      <div>
        <Link
          to={`/candidate/mock-tests/${test.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline p-1 min-h-[36px] rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Back to Test Overview</span>
        </Link>
      </div>

      {/* Main Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            {test.title}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mt-1">
            Before You Begin
          </h1>
          <p className="text-xs text-foreground-secondary mt-1">
            Please read these guidelines thoroughly. The examination timer starts only after you confirm and launch.
          </p>
        </div>

        {preferences.audioEnabled && (
          <button
            type="button"
            onClick={handleReadInstructions}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-elevated border border-border text-foreground text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[38px] transition-colors self-start sm:self-auto"
            aria-label="Listen to test instructions readout"
          >
            <Volume2 className="w-4 h-4 text-primary" aria-hidden="true" />
            <span>Listen to Summary</span>
          </button>
        )}
      </header>

      {/* Instructions Sections (Requirements #7 & #8) */}
      <div className="flex flex-col gap-6 text-xs text-foreground leading-relaxed">
        {/* H2: Test Structure */}
        <section aria-labelledby="heading-structure" className="p-5 rounded-2xl border border-border bg-surface flex flex-col gap-3">
          <h2 id="heading-structure" className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border pb-2">
            <span>1. Test Structure</span>
          </h2>
          <ul className="flex flex-col gap-2 list-disc pl-5 text-foreground-secondary">
            <li>
              Total Questions: <strong className="text-foreground">{test.totalQuestions}</strong> distributed across {test.sections?.length || 0} sections ({test.sections?.map((s) => s.name || s.title || 'Section').join(', ') || 'Comprehensive'}).
            </li>
            <li>
              Total Duration: <strong className="text-foreground">{test.durationMinutes} minutes</strong>.
            </li>
            <li>
              All questions are objective-type (Multiple Choice / True-False) with 4 options unless otherwise indicated.
            </li>
          </ul>
        </section>

        {/* H2: How Navigation Works */}
        <section aria-labelledby="heading-navigation" className="p-5 rounded-2xl border border-border bg-surface flex flex-col gap-3">
          <h2 id="heading-navigation" className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border pb-2">
            <span>2. How Navigation Works</span>
          </h2>
          <ul className="flex flex-col gap-2 list-disc pl-5 text-foreground-secondary">
            <li>
              <strong className="text-foreground">Section Navigation:</strong> You can switch between sections at any time by selecting the Section tabs at the top of the test window.
            </li>
            <li>
              <strong className="text-foreground">Question Palette:</strong> The question navigator lets you jump directly to any question by number.
            </li>
            <li>
              <strong className="text-foreground">Mobile Access:</strong> On mobile screens, tap &ldquo;Question Navigator&rdquo; to open an accessible drawer overlay.
            </li>
          </ul>
        </section>

        {/* H2: Answering Questions */}
        <section aria-labelledby="heading-answering" className="p-5 rounded-2xl border border-border bg-surface flex flex-col gap-3">
          <h2 id="heading-answering" className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border pb-2">
            <span>3. Answering Questions</span>
          </h2>
          <ul className="flex flex-col gap-2 list-disc pl-5 text-foreground-secondary">
            <li>
              <strong className="text-foreground">Save & Next:</strong> Select an option and press &ldquo;Save & Next&rdquo; to record your response and advance.
            </li>
            <li>
              <strong className="text-foreground">Mark for Review:</strong> If you are unsure of an answer or want to revisit a question later, click &ldquo;Mark for Review&rdquo;.
            </li>
            <li>
              <strong className="text-foreground">Clear Selection:</strong> Click &ldquo;Clear Selection&rdquo; to erase an existing choice on a question.
            </li>
            <li>
              <strong className="text-foreground">Marking Scheme:</strong> Correct responses receive <strong className="text-success font-bold">+{test.markingScheme?.correctMarks ?? 1} mark</strong>. Incorrect attempts incur a penalty of <strong className="text-amber-600 dark:text-amber-400 font-bold">-{test.markingScheme?.incorrectPenalty ?? 0.33} mark</strong>. Unanswered questions receive 0 marks with no penalty.
            </li>
          </ul>
        </section>

        {/* H2: Time Management */}
        <section aria-labelledby="heading-timing" className="p-5 rounded-2xl border border-border bg-surface flex flex-col gap-3">
          <h2 id="heading-timing" className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border pb-2">
            <span>4. Time Management</span>
          </h2>
          <ul className="flex flex-col gap-2 list-disc pl-5 text-foreground-secondary">
            <li>
              The countdown timer is continuously displayed at the top right of the examination interface.
            </li>
            <li>
              Audible notifications are announced at 30 minutes, 10 minutes, 5 minutes, and 1 minute according to your accessibility preferences.
            </li>
            <li>
              <strong className="text-foreground">Auto-Submission:</strong> When the countdown timer reaches zero, your test will be automatically submitted with all saved answers.
            </li>
          </ul>
        </section>

        {/* H2: Accessibility */}
        <section aria-labelledby="heading-a11y" className="p-5 rounded-2xl border border-border bg-surface flex flex-col gap-3">
          <h2 id="heading-a11y" className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border pb-2">
            <span>5. Accessibility</span>
          </h2>
          <ul className="flex flex-col gap-2 list-disc pl-5 text-foreground-secondary">
            <li>
              Keyboard shortcut: You can open the global Accessibility Calibration Center at any time using <kbd className="font-mono px-1.5 py-0.5 rounded bg-surface-elevated border border-border">Alt + A</kbd>.
            </li>
            <li>
              Adjusting font size, contrast, or theme <strong className="text-foreground">will not reset your timer or answers</strong>.
            </li>
            <li>
              All mathematical formulas contain screen-reader friendly spoken transcriptions.
            </li>
          </ul>
        </section>

        {/* H2: Submitting the Test */}
        <section aria-labelledby="heading-submitting" className="p-5 rounded-2xl border border-border bg-surface flex flex-col gap-3">
          <h2 id="heading-submitting" className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border pb-2">
            <span>6. Submitting the Test</span>
          </h2>
          <ul className="flex flex-col gap-2 list-disc pl-5 text-foreground-secondary">
            <li>
              When you have reviewed your answers, click &ldquo;Submit Mock Test&rdquo;.
            </li>
            <li>
              A confirmation dialog will display your answered, unanswered, and flagged questions count before finalizing.
            </li>
            <li>
              After submission, you will immediately receive your sectional performance breakdown and question explanations.
            </li>
          </ul>
        </section>
      </div>

      {/* Test Agreement Checkbox (Requirement #9) */}
      <section
        aria-labelledby="agreement-heading"
        className="p-5 rounded-2xl border border-primary/30 bg-primary/5 flex flex-col gap-4"
      >
        <h2 id="agreement-heading" className="sr-only">
          Candidate Acknowledgement
        </h2>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={hasAgreed}
            onChange={(e) => setHasAgreed(e.target.checked)}
            className="w-5 h-5 rounded border-border text-primary focus:ring-primary focus:ring-offset-0 mt-0.5"
          />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-foreground">
              I have read and understood the test instructions.
            </span>
            <span className="text-[11px] text-foreground-secondary mt-0.5">
              I understand that this is a timed practice simulation with negative marking and that my examination session begins upon clicking below.
            </span>
          </div>
        </label>

        {/* Transition Summary & Start CTA (Requirement #10) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-primary/20">
          <div className="flex items-center gap-3 text-xs text-foreground-secondary">
            <Clock className="w-4 h-4 text-primary" aria-hidden="true" />
            <span>
              Duration: <strong className="text-foreground">{test.durationMinutes} minutes</strong> • Questions: <strong className="text-foreground">{test.totalQuestions}</strong>
            </span>
          </div>

          <button
            type="button"
            onClick={handleStart}
            disabled={!hasAgreed || isStarting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-primary hover:bg-primary-hover active:bg-primary-hover disabled:opacity-40 text-primary-contrast font-bold text-xs min-h-[48px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-sm transition-colors"
          >
            <span>{isStarting ? 'Starting Mock Test...' : 'Start Mock Test'}</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </section>
    </div>
  );
};
