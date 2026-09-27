import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MockTest, MockTestSession } from '../../../types/mockTest';
import { mockTestService } from '../../../services/mockTestService';
import { MockTestTimer } from '../../../components/mockTest/MockTestTimer';
import { MockTestSectionNav } from '../../../components/mockTest/MockTestSectionNav';
import { MockTestQuestionCard } from '../../../components/mockTest/MockTestQuestionCard';
import { MockTestNavigatorPalette } from '../../../components/mockTest/MockTestNavigatorPalette';
import { MockTestNavigatorModal } from '../../../components/mockTest/MockTestNavigatorModal';
import { MockTestPauseModal } from '../../../components/mockTest/MockTestPauseModal';
import { MockTestSubmitModal } from '../../../components/mockTest/MockTestSubmitModal';
import {
  ShieldAlert,
  SlidersHorizontal,
  LayoutGrid,
  Send,
  Loader2,
} from 'lucide-react';
import { useAccessibility } from '../../../contexts/AccessibilityContext';

export const MockTestSessionPage: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const { openCalibration, announce } = useAccessibility();

  const [test, setTest] = useState<MockTest | null>(null);
  const [session, setSession] = useState<MockTestSession | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string>('');
  const [activeQuestionId, setActiveQuestionId] = useState<string>('');

  // Modals state
  const [isPaused, setIsPaused] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const secondsRemainingRef = useRef<number>(2700);

  // Load session or initialize
  useEffect(() => {
    async function initSession() {
      if (!testId) return;
      try {
        setIsLoading(true);
        const [testData, activeSess] = await Promise.all([
          mockTestService.getMockTest(testId),
          mockTestService.getActiveSession(),
        ]);

        if (!testData) {
          throw new Error('Test not found');
        }
        setTest(testData);

        let currentSess = activeSess;
        if (!currentSess || currentSess.testId !== testId || currentSess.status === 'submitted') {
          currentSess = await mockTestService.startMockTest(testId);
        }

        setSession(currentSess);
        setActiveSectionId(currentSess.currentSectionId || testData.sections[0]?.id || '');
        setActiveQuestionId(currentSess.currentQuestionId || testData.sections[0]?.questions[0]?.id || '');
        secondsRemainingRef.current = currentSess.secondsRemaining;
      } catch (e) {
        console.error('Session loading error', e);
      } finally {
        setIsLoading(false);
      }
    }
    initSession();
  }, [testId]);

  // Prevent accidental tab close (Requirement #30)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Your mock examination is currently in progress.';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  if (isLoading || !test || !session) {
    return (
      <div className="flex flex-col items-center justify-center p-16 gap-3" role="status">
        <Loader2 className="w-8 h-8 animate-spin text-primary" aria-hidden="true" />
        <p className="text-xs font-semibold text-foreground-secondary">
          Initializing examination session environment...
        </p>
      </div>
    );
  }

  // Active section & question resolution
  const currentSection = test.sections.find((s) => s.id === activeSectionId) || test.sections[0];
  const sectionQuestions = currentSection.questions;
  const currentQuestionIndex = sectionQuestions.findIndex((q) => q.id === activeQuestionId);
  const currentQuestion = sectionQuestions[currentQuestionIndex >= 0 ? currentQuestionIndex : 0];

  // Global question number
  let globalQuestionNumber = 1;
  for (const sec of test.sections) {
    if (sec.id === currentSection.id) {
      globalQuestionNumber += currentQuestionIndex >= 0 ? currentQuestionIndex : 0;
      break;
    }
    globalQuestionNumber += sec.questions.length;
  }

  // Tallies for submit modal
  let answeredCount = 0;
  let markedCount = 0;
  test.sections.forEach((sec) => {
    sec.questions.forEach((q) => {
      const a = session.answers[q.id];
      if (a?.status === 'answered' || a?.status === 'answered_marked_for_review') {
        answeredCount++;
      }
      if (a?.markedForReview) {
        markedCount++;
      }
    });
  });
  const unansweredCount = test.totalQuestions - answeredCount;

  // Handlers
  const handleSaveOption = async (optionId: string, isMultiple: boolean = false) => {
    if (!currentQuestion) return;
    const existing = session.answers[currentQuestion.id]?.selectedOptionIds || [];
    let updatedIds: string[] = [];

    if (isMultiple) {
      updatedIds = existing.includes(optionId)
        ? existing.filter((id) => id !== optionId)
        : [...existing, optionId];
    } else {
      updatedIds = [optionId];
    }

    const updated = await mockTestService.saveMockAnswer(session.sessionId, currentQuestion.id, updatedIds, 1);
    setSession(updated);
  };

  const handleClearOption = async () => {
    if (!currentQuestion) return;
    const updated = await mockTestService.saveMockAnswer(session.sessionId, currentQuestion.id, [], 1);
    setSession(updated);
  };

  const handleToggleMarkReview = async () => {
    if (!currentQuestion) return;
    const updated = await mockTestService.toggleMarkForReview(session.sessionId, currentQuestion.id);
    setSession(updated);
    const nextMarked = updated.answers[currentQuestion.id]?.markedForReview;
    announce(nextMarked ? 'Question marked for review.' : 'Review mark removed.', 'polite');
  };

  const handleSelectQuestion = (qId: string) => {
    // Find which section contains this question
    for (const sec of test.sections) {
      const found = sec.questions.find((q) => q.id === qId);
      if (found) {
        setActiveSectionId(sec.id);
        setActiveQuestionId(qId);
        mockTestService.updateNavigationPosition(session.sessionId, sec.id, qId, secondsRemainingRef.current);
        break;
      }
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < sectionQuestions.length - 1) {
      const nextQ = sectionQuestions[currentQuestionIndex + 1];
      setActiveQuestionId(nextQ.id);
      mockTestService.updateNavigationPosition(session.sessionId, currentSection.id, nextQ.id, secondsRemainingRef.current);
    } else {
      // Advance to next section if available
      const secIdx = test.sections.findIndex((s) => s.id === currentSection.id);
      if (secIdx < test.sections.length - 1) {
        const nextSec = test.sections[secIdx + 1];
        setActiveSectionId(nextSec.id);
        setActiveQuestionId(nextSec.questions[0].id);
        mockTestService.updateNavigationPosition(session.sessionId, nextSec.id, nextSec.questions[0].id, secondsRemainingRef.current);
      } else {
        // Last question of entire test -> open submit modal
        setIsSubmitModalOpen(true);
      }
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      const prevQ = sectionQuestions[currentQuestionIndex - 1];
      setActiveQuestionId(prevQ.id);
      mockTestService.updateNavigationPosition(session.sessionId, currentSection.id, prevQ.id, secondsRemainingRef.current);
    } else {
      // Step into previous section's last question
      const secIdx = test.sections.findIndex((s) => s.id === currentSection.id);
      if (secIdx > 0) {
        const prevSec = test.sections[secIdx - 1];
        const lastQ = prevSec.questions[prevSec.questions.length - 1];
        setActiveSectionId(prevSec.id);
        setActiveQuestionId(lastQ.id);
        mockTestService.updateNavigationPosition(session.sessionId, prevSec.id, lastQ.id, secondsRemainingRef.current);
      }
    }
  };

  // Submit test (Explicit or Auto-submit on time expiry, Requirement #34)
  const handleFinalSubmit = async () => {
    try {
      setIsSubmitting(true);
      await mockTestService.finishMockTest(session.sessionId, secondsRemainingRef.current);
      navigate(`/candidate/mock-tests/${test.id}/result`);
    } catch (e) {
      console.error('Final submit failed', e);
      setIsSubmitting(false);
    }
  };

  const handleTimeExpired = () => {
    announce('Time is up. Your mock test is being submitted automatically.', 'assertive');
    handleFinalSubmit();
  };

  const isGlobalFirst = currentQuestionIndex === 0 && test.sections[0]?.id === currentSection.id;
  const isGlobalLast =
    currentQuestionIndex === sectionQuestions.length - 1 &&
    test.sections[test.sections.length - 1]?.id === currentSection.id;

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      {/* Session Top Bar */}
      <header
        aria-label="Mock examination status header"
        className="p-4 sm:p-5 rounded-2xl border border-border bg-surface flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary flex-shrink-0" aria-hidden="true">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
              {test.examCode} • Timed Mock Examination
            </span>
            <h1 className="text-base sm:text-lg font-bold text-foreground leading-tight">
              {test.title}
            </h1>
          </div>
        </div>

        {/* Timer, Palette trigger, and Final Submit button */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Accessible Timer */}
          <MockTestTimer
            initialSeconds={session.secondsRemaining}
            isPaused={isPaused}
            onTimeExpired={handleTimeExpired}
            onTogglePause={() => setIsPaused((prev) => !prev)}
            onTick={(rem) => {
              secondsRemainingRef.current = rem;
            }}
          />

          {/* Mobile Question Navigator trigger */}
          <button
            type="button"
            onClick={() => setIsMobileNavOpen(true)}
            className="lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface hover:bg-surface-elevated text-xs font-semibold text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[38px] transition-colors"
            aria-label="Open question navigator palette"
          >
            <LayoutGrid className="w-4 h-4 text-primary" aria-hidden="true" />
            <span>Palette</span>
          </button>

          {/* Quick A11y Settings Trigger (Does NOT reset timer/session, Requirement #47 & #48) */}
          <button
            type="button"
            onClick={openCalibration}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface hover:bg-surface-elevated text-xs font-semibold text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[38px] transition-colors"
            aria-label="Open accessibility settings (Alt+A)"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
            <span>A11y</span>
          </button>

          {/* Explicit Submit Mock Test CTA (Requirement #32) */}
          <button
            type="button"
            onClick={() => setIsSubmitModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover active:bg-primary-hover text-primary-contrast font-bold text-xs min-h-[40px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-sm transition-colors"
            aria-label="Submit mock test"
          >
            <Send className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Submit Test</span>
          </button>
        </div>
      </header>

      {/* Section Navigation Tabs (Requirement #24) */}
      <MockTestSectionNav
        sections={test.sections}
        activeSectionId={currentSection.id}
        answers={session.answers}
        onSelectSection={(secId) => {
          const sec = test.sections.find((s) => s.id === secId);
          if (sec && sec.questions.length > 0) {
            setActiveSectionId(secId);
            setActiveQuestionId(sec.questions[0].id);
          }
        }}
      />

      {/* Main Examination Workspace: 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Main Question Card: 3 columns */}
        <div className="lg:col-span-3">
          {currentQuestion && (
            <MockTestQuestionCard
              question={currentQuestion}
              currentNumber={globalQuestionNumber}
              totalQuestions={test.totalQuestions}
              answer={session.answers[currentQuestion.id]}
              onSaveOption={handleSaveOption}
              onClearOption={handleClearOption}
              onToggleMarkReview={handleToggleMarkReview}
              onNext={handleNext}
              onPrevious={handlePrevious}
              isFirst={isGlobalFirst}
              isLast={isGlobalLast}
            />
          )}
        </div>

        {/* Sidebar Question Navigator Palette: 1 column on Desktop */}
        <div className="hidden lg:block lg:col-span-1">
          <MockTestNavigatorPalette
            questions={currentSection.questions}
            answers={session.answers}
            currentQuestionId={currentQuestion?.id || ''}
            onSelectQuestion={handleSelectQuestion}
          />
        </div>
      </div>

      {/* Mobile Question Navigator Drawer / Modal */}
      <MockTestNavigatorModal
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
        questions={currentSection.questions}
        answers={session.answers}
        currentQuestionId={currentQuestion?.id || ''}
        onSelectQuestion={handleSelectQuestion}
      />

      {/* Pause Modal (Requirement #31) */}
      <MockTestPauseModal
        isOpen={isPaused}
        onResume={() => setIsPaused(false)}
        testTitle={test.title}
      />

      {/* Submit Confirmation Modal (Requirement #33) */}
      <MockTestSubmitModal
        isOpen={isSubmitModalOpen}
        answeredCount={answeredCount}
        unansweredCount={unansweredCount}
        markedForReviewCount={markedCount}
        totalQuestions={test.totalQuestions}
        onCancel={() => setIsSubmitModalOpen(false)}
        onConfirmSubmit={handleFinalSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};
