import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Exam,
  ExamSession,
  ExamSyncState,
  ExamSessionStatus,
} from '../../../types/exam';
import { examService } from '../../../services/examService';
import { ExamHeader } from '../../../components/exam/ExamHeader';
import { ExamSectionNavigation } from '../../../components/exam/ExamSectionNavigation';
import { ExamQuestion } from '../../../components/exam/ExamQuestion';
import { ExamQuestionNavigator } from '../../../components/exam/ExamQuestionNavigator';
import { ExamSubmissionDialog } from '../../../components/exam/ExamSubmissionDialog';
import { ExamAccessibilityBar } from '../../../components/exam/ExamAccessibilityBar';
import { ExamSupportModal } from '../../../components/exam/ExamSupportModal';
import { ExamInterruptionDialog } from '../../../components/exam/ExamInterruptionDialog';
import { LayoutGrid, Loader2 } from 'lucide-react';
import { useAccessibility } from '../../../contexts/AccessibilityContext';

export const LiveExamSessionPage: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { announce } = useAccessibility();

  // Core examination state
  const [exam, setExam] = useState<Exam | null>(null);
  const [session, setSession] = useState<ExamSession | null>(null);
  const [sessionStatus, setSessionStatus] = useState<ExamSessionStatus>('STARTING');
  const [syncState, setSyncState] = useState<ExamSyncState>('SYNCED');
  const [isLoading, setIsLoading] = useState(true);

  // Active navigation pointers
  const [currentSectionId, setCurrentSectionId] = useState<string>('');
  const [currentQuestionId, setCurrentQuestionId] = useState<string>('');

  // Modals state
  const [isNavigatorOpen, setIsNavigatorOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isA11yModalOpen, setIsA11yModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isInterruptionModalOpen, setIsInterruptionModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Initialize or resume examination session
  useEffect(() => {
    async function initSession() {
      if (!examId) return;
      try {
        setIsLoading(true);
        const examData = await examService.getExam(examId);
        if (!examData) {
          navigate('/candidate/exams');
          return;
        }
        setExam(examData);

        // Check if an existing session exists
        let currentSession = await examService.getExamSession(examId);

        if (currentSession) {
          if (currentSession.status === 'SUBMITTED') {
            // Already submitted: go to status page
            navigate(`/candidate/exams/${examId}/status`);
            return;
          }
          if (currentSession.status === 'EXPIRED') {
            setSession(currentSession);
            setSessionStatus('EXPIRED');
            setIsInterruptionModalOpen(true);
            setIsLoading(false);
            return;
          }
          // Resume existing active session
          setSession(currentSession);
          setCurrentSectionId(currentSession.currentSectionId || examData.config.sections[0]?.id || '');
          setCurrentQuestionId(currentSession.currentQuestionId || examData.config.sections[0]?.questions[0]?.id || '');
          setSessionStatus('ACTIVE');
          setIsInterruptionModalOpen(true); // Notify candidate of resumption
        } else {
          // Create new authoritative session
          currentSession = await examService.createExamSession(examId);
          setSession(currentSession);
          setCurrentSectionId(examData.config.sections[0]?.id || '');
          setCurrentQuestionId(examData.config.sections[0]?.questions[0]?.id || '');
          setSessionStatus('ACTIVE');
        }
      } catch (err) {
        console.error('Failed to initialize live exam session', err);
        setSessionStatus('ERROR');
      } finally {
        setIsLoading(false);
      }
    }

    initSession();
  }, [examId, navigate]);

  // Warn if navigating away during active exam (Section 30)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (sessionStatus === 'ACTIVE') {
        e.preventDefault();
        e.returnValue = 'Your examination is currently in progress. Exiting may affect your attempt.';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [sessionStatus]);

  // Flattened questions list for navigation
  const allQuestions = useMemo(() => {
    if (!exam) return [];
    return exam.config.sections.flatMap((s) => s.questions);
  }, [exam]);

  const currentQuestion = useMemo(() => {
    return allQuestions.find((q) => q.id === currentQuestionId) || allQuestions[0];
  }, [allQuestions, currentQuestionId]);

  const currentQuestionIndex = useMemo(() => {
    return allQuestions.findIndex((q) => q.id === currentQuestionId);
  }, [allQuestions, currentQuestionId]);


  // Handle option selection / change
  const handleAnswerChange = async (selectedOptions: string[]) => {
    if (!exam || !session || !currentQuestion) return;

    setSyncState('SAVING');
    try {
      const currentAns = session.answers[currentQuestion.id];
      const isMarked = currentAns?.isMarkedForReview || false;

      const { session: updatedSession, syncState: newSyncState } = await examService.saveAnswer(
        exam.id,
        currentQuestion.id,
        selectedOptions,
        isMarked
      );

      setSession(updatedSession);
      setSyncState(newSyncState);
    } catch (err) {
      console.error('Error saving answer', err);
      setSyncState('SYNC_ERROR');
    }
  };

  // Clear answer
  const handleClearAnswer = async () => {
    await handleAnswerChange([]);
  };

  // Toggle Mark for Review
  const handleToggleReview = async () => {
    if (!exam || !session || !currentQuestion) return;

    const currentAns = session.answers[currentQuestion.id];
    const newMarkedState = !currentAns?.isMarkedForReview;

    try {
      const updatedSession = await examService.markQuestionForReview(
        exam.id,
        currentQuestion.id,
        newMarkedState
      );
      setSession(updatedSession);
      announce(newMarkedState ? 'Question marked for review.' : 'Review mark removed.');
    } catch (err) {
      console.error('Error marking question for review', err);
    }
  };

  // Question Navigation: Next
  const handleNext = () => {
    if (currentQuestionIndex < allQuestions.length - 1) {
      const nextQ = allQuestions[currentQuestionIndex + 1];
      setCurrentQuestionId(nextQ.id);
      setCurrentSectionId(nextQ.sectionId);
    }
  };

  // Question Navigation: Previous
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      const prevQ = allQuestions[currentQuestionIndex - 1];
      setCurrentQuestionId(prevQ.id);
      setCurrentSectionId(prevQ.sectionId);
    }
  };

  // Jump to specific question
  const handleSelectQuestion = (qId: string) => {
    const targetQ = allQuestions.find((q) => q.id === qId);
    if (targetQ) {
      setCurrentQuestionId(targetQ.id);
      setCurrentSectionId(targetQ.sectionId);
    }
  };

  // Switch section tab
  const handleSelectSection = (secId: string) => {
    const targetSec = exam?.config.sections.find((s) => s.id === secId);
    if (targetSec && targetSec.questions.length > 0) {
      setCurrentSectionId(secId);
      setCurrentQuestionId(targetSec.questions[0].id);
    }
  };

  // Retry synchronizing unsynced answers
  const handleRetrySync = async () => {
    if (!exam) return;
    setIsSyncing(true);
    try {
      const { success, session: updatedSession } = await examService.retrySync(exam.id);
      setSession(updatedSession);
      setSyncState(success ? 'SYNCED' : 'SYNC_ERROR');
      if (success) {
        announce('Answers synchronized with examination server.');
      }
    } catch (e) {
      console.error(e);
      setSyncState('SYNC_ERROR');
    } finally {
      setIsSyncing(false);
    }
  };

  // Auto-submit when timer expires
  const handleTimerExpired = async () => {
    if (!exam) return;
    announce('Official examination time has expired. Submitting your examination.');
    setSessionStatus('EXPIRED');
    try {
      await examService.submitExam(exam.id);
      navigate(`/candidate/exams/${exam.id}/status`);
    } catch (e) {
      console.error('Auto submission error', e);
      navigate(`/candidate/exams/${exam.id}/status`);
    }
  };

  // Manual final submission
  const handleConfirmSubmit = async () => {
    if (!exam) return;
    setIsSubmitting(true);
    setSessionStatus('SUBMITTING');
    try {
      await examService.submitExam(exam.id);
      setIsSubmitModalOpen(false);
      navigate(`/candidate/exams/${exam.id}/status`);
    } catch (err) {
      console.error('Submission failed', err);
      setIsSubmitting(false);
      setSessionStatus('ACTIVE');
      announce('Submission could not be completed. Please retry.');
    }
  };

  if (isLoading || !exam || !session || !currentQuestion) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-3 min-h-[60vh]" role="status">
        <Loader2 className="w-8 h-8 animate-spin text-primary" aria-hidden="true" />
        <p className="text-xs font-semibold text-foreground-secondary">
          Initializing examination cockpit...
        </p>
      </div>
    );
  }

  // Answer stats for submit dialog
  const answers = session.answers || {};
  let answeredCount = 0;
  let markedCount = 0;

  Object.values(answers).forEach((ans) => {
    if (ans.selectedOptions.length > 0) answeredCount++;
    if (ans.isMarkedForReview) markedCount++;
  });

  const unansweredCount = exam.config.totalQuestions - answeredCount;
  const unsyncedCount = session.unsyncedQuestionIds.length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Sticky Examination Header */}
      <ExamHeader
        title={exam.title}
        organization={exam.organization}
        examCode={exam.examCode}
        serverEndTime={session.serverEndTime}
        syncState={syncState}
        unsyncedCount={unsyncedCount}
        currentQuestionNumber={currentQuestionIndex + 1}
        totalQuestions={exam.config.totalQuestions}
        onExpire={handleTimerExpired}
        onRetrySync={handleRetrySync}
        onOpenAccessibility={() => setIsA11yModalOpen(true)}
        onOpenHelp={() => setIsHelpModalOpen(true)}
        onSubmitClick={() => setIsSubmitModalOpen(true)}
      />

      {/* Sub-Header: Section Navigation & Navigator button */}
      <div className="bg-surface border-b border-border px-4 py-1.5 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex-1 overflow-hidden">
            <ExamSectionNavigation
              sections={exam.config.sections}
              activeSectionId={currentSectionId}
              answers={answers}
              navigationPolicy={exam.config.navigationPolicy}
              onSelectSection={handleSelectSection}
            />
          </div>

          {/* Question Navigator Drawer Trigger */}
          <button
            type="button"
            onClick={() => setIsNavigatorOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-elevated hover:bg-surface-elevated/80 border border-border text-foreground text-xs font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[40px] flex-shrink-0 transition-colors"
            aria-label="Open question navigator grid"
          >
            <LayoutGrid className="w-4 h-4 text-primary" aria-hidden="true" />
            <span className="hidden sm:inline">Question Navigator</span>
          </button>
        </div>
      </div>

      {/* Main Focus Area: Question Card */}
      <main id="main-content" className="flex-1 max-w-5xl mx-auto w-full px-4 pt-6 sm:pt-8 flex flex-col justify-between">
        <ExamQuestion
          question={currentQuestion}
          currentNumber={currentQuestionIndex + 1}
          totalQuestions={exam.config.totalQuestions}
          answer={answers[currentQuestion.id]}
          navigationPolicy={exam.config.navigationPolicy}
          isFirstQuestion={currentQuestionIndex === 0}
          isLastQuestion={currentQuestionIndex === allQuestions.length - 1}
          onAnswerChange={handleAnswerChange}
          onClearAnswer={handleClearAnswer}
          onToggleReview={handleToggleReview}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onSubmit={() => setIsSubmitModalOpen(true)}
        />
      </main>

      {/* Modals & Dialogs */}
      <ExamQuestionNavigator
        isOpen={isNavigatorOpen}
        onClose={() => setIsNavigatorOpen(false)}
        questions={allQuestions}
        answers={answers}
        currentQuestionId={currentQuestion.id}
        onSelectQuestion={handleSelectQuestion}
      />

      <ExamSubmissionDialog
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onConfirmSubmit={handleConfirmSubmit}
        onRetrySync={handleRetrySync}
        totalQuestions={exam.config.totalQuestions}
        answeredCount={answeredCount}
        unansweredCount={unansweredCount}
        markedCount={markedCount}
        unsyncedCount={unsyncedCount}
        isSubmitting={isSubmitting}
        isSyncing={isSyncing}
      />

      <ExamAccessibilityBar
        isOpen={isA11yModalOpen}
        onClose={() => setIsA11yModalOpen(false)}
      />

      <ExamSupportModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
        organization={exam.organization}
      />

      <ExamInterruptionDialog
        isOpen={isInterruptionModalOpen}
        status={sessionStatus}
        lastSyncTimestamp={session.lastSyncTimestamp}
        onResume={() => setIsInterruptionModalOpen(false)}
        onViewStatus={() => navigate(`/candidate/exams/${exam.id}/status`)}
      />
    </div>
  );
};
