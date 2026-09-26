import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { PracticeSession } from '../../../types/practice';
import { practiceService } from '../../../services/practiceService';
import { PracticeQuestionCard } from '../../../components/practice/PracticeQuestionCard';
import { PracticeNavigatorPalette } from '../../../components/practice/PracticeNavigatorPalette';
import { PracticeTimer } from '../../../components/practice/PracticeTimer';
import { PracticePauseModal } from '../../../components/practice/PracticePauseModal';
import { PracticeFinishModal } from '../../../components/practice/PracticeFinishModal';
import {
  ArrowLeft,
  Loader2,
  SlidersHorizontal,
} from 'lucide-react';
import { useAccessibility } from '../../../contexts/AccessibilityContext';

export const PracticeSessionPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { openCalibration } = useAccessibility();

  const [session, setSession] = useState<PracticeSession | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const elapsedSecondsRef = useRef(0);

  useEffect(() => {
    async function loadSession() {
      if (!sessionId) return;
      try {
        setIsLoading(true);
        const data = await practiceService.getPracticeSession(sessionId);
        if (!data) {
          setError('Practice session could not be located.');
        } else {
          setSession(data);
          setCurrentIdx(data.currentQuestionIndex || 0);
        }
      } catch (err) {
        setError('Error loading practice session.');
      } finally {
        setIsLoading(false);
      }
    }
    loadSession();
  }, [sessionId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 gap-3" role="status">
        <Loader2 className="w-8 h-8 animate-spin text-primary" aria-hidden="true" />
        <p className="text-xs font-semibold text-foreground-secondary">
          Initializing practice session...
        </p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="p-8 rounded-xl border border-border bg-surface text-center flex flex-col items-center gap-4 max-w-md mx-auto">
        <p className="text-sm font-bold text-foreground">{error || 'Session not found.'}</p>
        <Link
          to="/candidate/practice"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-contrast text-xs font-bold min-h-[40px]"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Return to Practice Menu</span>
        </Link>
      </div>
    );
  }

  const currentQuestion = session.questions[currentIdx];
  const savedAnswer = session.answers[currentQuestion?.id];

  // Count answered, skipped, remaining
  let answeredCount = 0;
  let skippedCount = 0;

  session.questions.forEach((q) => {
    const a = session.answers[q.id];
    if (a?.isSubmitted) answeredCount++;
    else if (a?.isSkipped) skippedCount++;
  });

  const remainingCount = session.totalQuestions - answeredCount - skippedCount;
  const unansweredCount = session.totalQuestions - answeredCount;

  // Handlers
  const handleSubmitAnswer = async (questionId: string, selectedOptionIds: string[]) => {
    try {
      const res = await practiceService.submitAnswer(
        session.id,
        questionId,
        selectedOptionIds,
        elapsedSecondsRef.current
      );
      setSession(res.session);
    } catch (err) {
      console.error('Answer submission error', err);
    }
  };

  const handleSkipQuestion = async (questionId: string) => {
    try {
      const updated = await practiceService.skipQuestion(session.id, questionId);
      setSession(updated);
      if (currentIdx < session.totalQuestions - 1) {
        setCurrentIdx((prev) => prev + 1);
      }
    } catch (err) {
      console.error('Skip question error', err);
    }
  };

  const handleNext = () => {
    if (currentIdx < session.totalQuestions - 1) {
      setCurrentIdx((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIdx > 0) {
      setCurrentIdx((prev) => prev - 1);
    }
  };

  const handleConfirmFinish = async () => {
    setIsFinishModalOpen(false);
    try {
      await practiceService.finishPracticeSession(session.id, elapsedSecondsRef.current);
      navigate(`/candidate/practice/session/${session.id}/result`);
    } catch (err) {
      console.error('Failed to finish practice', err);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      {/* Session Top Bar */}
      <header
        aria-label="Practice session status header"
        className="p-4 sm:p-5 rounded-2xl border border-border bg-surface flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
      >
        <div className="flex items-center gap-3">
          <Link
            to="/candidate/practice"
            className="p-2 rounded-lg hover:bg-surface-elevated text-foreground-secondary hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[38px] min-w-[38px] inline-flex items-center justify-center transition-colors"
            aria-label="Exit practice to practice home"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          </Link>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
              {session.subjectName}
            </span>
            <h1 className="text-base sm:text-lg font-bold text-foreground leading-tight">
              {session.topicName} Practice
            </h1>
          </div>
        </div>

        {/* Counters & Timer */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          {/* Answered / Skipped / Remaining Tally */}
          <div
            className="flex items-center gap-2 text-xs text-foreground-secondary font-medium"
            aria-label={`Progress summary: ${answeredCount} answered, ${skippedCount} skipped, ${remainingCount} remaining`}
          >
            <span className="inline-flex items-center gap-1 font-bold text-success">
              <span>{answeredCount}</span>
              <span className="text-foreground-secondary text-[11px] font-normal">answered</span>
            </span>
            <span className="text-foreground-muted" aria-hidden="true">•</span>
            <span className="inline-flex items-center gap-1 text-foreground-secondary">
              <span>{skippedCount}</span>
              <span className="text-[11px] font-normal">skipped</span>
            </span>
            <span className="text-foreground-muted" aria-hidden="true">•</span>
            <span className="inline-flex items-center gap-1 text-foreground-secondary">
              <span>{remainingCount}</span>
              <span className="text-[11px] font-normal">remaining</span>
            </span>
          </div>

          {/* Accessible Timer */}
          <PracticeTimer
            initialSeconds={session.timeLimitSeconds || 600}
            isPaused={isPaused}
            onTogglePause={() => setIsPaused((prev) => !prev)}
            onTick={(elapsed) => {
              elapsedSecondsRef.current = elapsed;
            }}
          />

          {/* Quick Accessibility Config */}
          <button
            type="button"
            onClick={openCalibration}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface hover:bg-surface-elevated text-xs font-semibold text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[36px] transition-colors"
            aria-label="Open accessibility calibration"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
            <span>A11y</span>
          </button>
        </div>
      </header>

      {/* Main Practice Workspace: 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Main Question Card: 3 columns */}
        <div className="lg:col-span-3">
          {currentQuestion && (
            <PracticeQuestionCard
              question={currentQuestion}
              currentIndex={currentIdx + 1}
              totalQuestions={session.totalQuestions}
              savedAnswer={savedAnswer}
              onSubmitAnswer={handleSubmitAnswer}
              onSkipQuestion={handleSkipQuestion}
              onGoPrevious={handlePrevious}
              onGoNext={handleNext}
              onFinishSession={() => setIsFinishModalOpen(true)}
              isLastQuestion={currentIdx === session.totalQuestions - 1}
            />
          )}
        </div>

        {/* Sidebar Question Navigator: 1 column */}
        <div className="lg:col-span-1">
          <PracticeNavigatorPalette
            questions={session.questions}
            answers={session.answers}
            currentIndex={currentIdx}
            onSelectQuestion={(idx) => setCurrentIdx(idx)}
          />
        </div>
      </div>

      {/* Pause Practice Dialog Modal */}
      <PracticePauseModal
        isOpen={isPaused}
        onResume={() => setIsPaused(false)}
        topicName={session.topicName}
      />

      {/* Finish Practice Confirmation Modal */}
      <PracticeFinishModal
        isOpen={isFinishModalOpen}
        unansweredCount={unansweredCount}
        totalQuestions={session.totalQuestions}
        onCancel={() => setIsFinishModalOpen(false)}
        onConfirmFinish={handleConfirmFinish}
      />
    </div>
  );
};
