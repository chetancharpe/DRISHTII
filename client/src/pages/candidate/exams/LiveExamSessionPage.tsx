import React, { useEffect, useState, useMemo, useCallback } from 'react';
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
import { ExamShortcutsModal } from '../../../components/exam/ExamShortcutsModal';
import { ExamInterruptionDialog } from '../../../components/exam/ExamInterruptionDialog';
import { LayoutGrid, Loader2, AlertTriangle, Keyboard } from 'lucide-react';
import { useAccessibility } from '../../../contexts/AccessibilityContext';
import { VoiceCommandBar } from '../../../components/common/VoiceCommandBar';
import { useVoiceCommands } from '../../../hooks/useVoiceCommands';

export const LiveExamSessionPage: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { announce, speak } = useAccessibility();

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
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isInterruptionModalOpen, setIsInterruptionModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Time remaining tracking for low-time warning banner (15m, 5m, 1m)
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [dismissedWarningMilestone, setDismissedWarningMilestone] = useState<number | null>(null);

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

  // Track remaining seconds from authoritative server timer
  useEffect(() => {
    if (!session || sessionStatus !== 'ACTIVE') return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((session.serverEndTime - Date.now()) / 1000));
      setRemainingSeconds(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [session, sessionStatus]);

  // Warn if navigating away during active exam
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

  // Screen reader announcement on question change (Polite Live Region)
  useEffect(() => {
    if (currentQuestion && currentQuestionIndex >= 0) {
      announce(
        `Question ${currentQuestionIndex + 1} of ${allQuestions.length}: ${currentQuestion.sectionTitle}. ${currentQuestion.prompt}`,
        'polite'
      );
    }
  }, [currentQuestionId, announce]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle option selection / change
  const handleAnswerChange = useCallback(async (selectedOptions: string[]) => {
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
  }, [exam, session, currentQuestion]);

  // Clear answer
  const handleClearAnswer = useCallback(async () => {
    await handleAnswerChange([]);
    announce('Answer cleared.', 'polite');
  }, [handleAnswerChange, announce]);

  // Toggle Mark for Review
  const handleToggleReview = useCallback(async () => {
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
      announce(newMarkedState ? 'Question marked for review.' : 'Review mark removed.', 'polite');
    } catch (err) {
      console.error('Error marking question for review', err);
    }
  }, [exam, session, currentQuestion, announce]);

  // Question Navigation: Next
  const handleNext = useCallback(() => {
    if (currentQuestionIndex < allQuestions.length - 1) {
      const nextQ = allQuestions[currentQuestionIndex + 1];
      setCurrentQuestionId(nextQ.id);
      setCurrentSectionId(nextQ.sectionId);
    }
  }, [currentQuestionIndex, allQuestions]);

  // Question Navigation: Previous
  const handlePrevious = useCallback(() => {
    // Check forwardOnly policy
    if (exam?.config.navigationPolicy.forwardOnly) {
      announce('Backward navigation is not permitted for this examination section.', 'assertive');
      return;
    }
    if (currentQuestionIndex > 0) {
      const prevQ = allQuestions[currentQuestionIndex - 1];
      setCurrentQuestionId(prevQ.id);
      setCurrentSectionId(prevQ.sectionId);
    }
  }, [currentQuestionIndex, allQuestions, exam, announce]);

  // Jump to specific question
  const handleSelectQuestion = (qId: string) => {
    const targetQ = allQuestions.find((q) => q.id === qId);
    if (targetQ) {
      // Check section locked policy if jumping to a different section
      if (exam?.config.navigationPolicy.sectionLocked && targetQ.sectionId !== currentSectionId) {
        const currentSecQuestions = allQuestions.filter((q) => q.sectionId === currentSectionId);
        const unansweredInSec = currentSecQuestions.some((q) => !session?.answers[q.id]?.selectedOptions?.length);
        if (unansweredInSec) {
          announce('Section Locked: You must answer all questions in this section before jumping sections.', 'assertive');
          return;
        }
      }
      setCurrentQuestionId(targetQ.id);
      setCurrentSectionId(targetQ.sectionId);
    }
  };

  // Switch section tab
  const handleSelectSection = (secId: string) => {
    if (secId === currentSectionId) return;

    // Check sectionLocked policy
    if (exam?.config.navigationPolicy.sectionLocked) {
      const currentSecQuestions = allQuestions.filter((q) => q.sectionId === currentSectionId);
      const unansweredInSec = currentSecQuestions.some((q) => !session?.answers[q.id]?.selectedOptions?.length);
      if (unansweredInSec) {
        announce('Section Locked: Complete all questions in this section before moving to the next section.', 'assertive');
        return;
      }
    }

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
        announce('All answers synchronized with examination server.', 'polite');
      }
    } catch (e) {
      console.error(e);
      setSyncState('SYNC_ERROR');
    } finally {
      setIsSyncing(false);
    }
  };

  // Auto-submit when authoritative timer expires
  const handleTimerExpired = async () => {
    if (!exam) return;
    announce('Official examination time has expired. Submitting your examination.', 'assertive');
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
      announce('Submission could not be completed. Please retry.', 'assertive');
    }
  };

  // Audio assistance: speak question stem
  const handleListenQuestion = useCallback(() => {
    if (!currentQuestion) return;
    let textToSpeak = `Question ${currentQuestionIndex + 1} of ${allQuestions.length}. Section: ${currentQuestion.sectionTitle}. ${currentQuestion.prompt}`;
    if (currentQuestion.formulaAriaLabel) {
      textToSpeak += ` Formula: ${currentQuestion.formulaAriaLabel}.`;
    }
    speak(textToSpeak);
  }, [currentQuestion, currentQuestionIndex, allQuestions.length, speak]);

  // Audio assistance: speak all options
  const handleListenOptions = useCallback(() => {
    if (!currentQuestion) return;
    const optionsText = currentQuestion.options
      .map((opt) => `Option ${opt.label}: ${opt.text}`)
      .join('. ');
    speak(`Available answer choices: ${optionsText}`);
  }, [currentQuestion, speak]);

  // Hands-free voice commands hook
  const voice = useVoiceCommands({
    onNext: handleNext,
    onPrevious: handlePrevious,
    onSelectOption: (optIndex) => {
      if (currentQuestion && currentQuestion.options[optIndex]) {
        const optId = currentQuestion.options[optIndex].id;
        const currentAns = session?.answers[currentQuestion.id]?.selectedOptions || [];
        if (currentQuestion.type === 'multiple_choice') {
          const nextOpts = currentAns.includes(optId)
            ? currentAns.filter((id) => id !== optId)
            : [...currentAns, optId];
          handleAnswerChange(nextOpts);
        } else {
          handleAnswerChange([optId]);
        }
        announce(`Selected option ${currentQuestion.options[optIndex].label}`, 'polite');
      }
    },
    onMarkReview: handleToggleReview,
    onClearAnswer: handleClearAnswer,
    onSubmit: () => setIsSubmitModalOpen(true),
  });

  // Global Keyboard Shortcuts (N, P, 1-4, M, C, S, ?, R, O)
  useEffect(() => {
    const anyModalOpen =
      isNavigatorOpen ||
      isSubmitModalOpen ||
      isA11yModalOpen ||
      isHelpModalOpen ||
      isShortcutsModalOpen ||
      isInterruptionModalOpen;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not trigger shortcuts when typing in inputs, textareas, or if a modal is active
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable ||
        anyModalOpen
      ) {
        return;
      }

      // Check shortcuts
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setIsShortcutsModalOpen(true);
        return;
      }

      const key = e.key.toLowerCase();

      if (key === 'n') {
        e.preventDefault();
        handleNext();
      } else if (key === 'p') {
        e.preventDefault();
        handlePrevious();
      } else if (key === 'm') {
        e.preventDefault();
        handleToggleReview();
      } else if (key === 'c') {
        e.preventDefault();
        handleClearAnswer();
      } else if (key === 's') {
        e.preventDefault();
        setIsSubmitModalOpen(true);
      } else if (key === 'r') {
        e.preventDefault();
        handleListenQuestion();
      } else if (key === 'o') {
        e.preventDefault();
        handleListenOptions();
      } else if (['1', '2', '3', '4'].includes(e.key)) {
        e.preventDefault();
        const optIndex = parseInt(e.key, 10) - 1;
        if (currentQuestion && currentQuestion.options[optIndex]) {
          const optId = currentQuestion.options[optIndex].id;
          const currentAns = session?.answers[currentQuestion.id]?.selectedOptions || [];
          if (currentQuestion.type === 'multiple_choice') {
            const nextOpts = currentAns.includes(optId)
              ? currentAns.filter((id) => id !== optId)
              : [...currentAns, optId];
            handleAnswerChange(nextOpts);
          } else {
            handleAnswerChange([optId]);
          }
          announce(`Selected option ${currentQuestion.options[optIndex].label}`, 'polite');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isNavigatorOpen,
    isSubmitModalOpen,
    isA11yModalOpen,
    isHelpModalOpen,
    isShortcutsModalOpen,
    isInterruptionModalOpen,
    handleNext,
    handlePrevious,
    handleToggleReview,
    handleClearAnswer,
    handleListenQuestion,
    handleListenOptions,
    handleAnswerChange,
    currentQuestion,
    session,
    announce,
  ]);

  if (isLoading || !exam || !session || !currentQuestion) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-3 min-h-[60vh]" role="status">
        <Loader2 className="w-8 h-8 animate-spin text-primary" aria-hidden="true" />
        <p className="text-xs font-semibold text-foreground-secondary">
          Initializing authoritative examination cockpit...
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

  // Determine low-time warning banner text
  let lowTimeMessage: string | null = null;
  let isUrgentTime = false;
  if (remainingSeconds !== null && remainingSeconds > 0) {
    if (remainingSeconds <= 60 && dismissedWarningMilestone !== 1) {
      lowTimeMessage = 'Final 60 Seconds: Your examination will be submitted automatically when the server timer expires.';
      isUrgentTime = true;
    } else if (remainingSeconds <= 300 && dismissedWarningMilestone !== 5) {
      lowTimeMessage = 'Attention: Less than 5 minutes remaining. Please finalize and confirm your answers.';
      isUrgentTime = true;
    } else if (remainingSeconds <= 900 && dismissedWarningMilestone !== 15) {
      lowTimeMessage = 'Notice: 15 minutes remaining in this examination session.';
      isUrgentTime = false;
    }
  }

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

      {/* Low-Time Non-Flashing Warning Banner */}
      {lowTimeMessage && (
        <div
          role="alert"
          aria-live="polite"
          className={`px-4 py-2 text-xs font-bold flex items-center justify-between gap-3 border-b ${
            isUrgentTime
              ? 'bg-danger/10 border-danger/30 text-danger'
              : 'bg-warning/10 border-warning/30 text-warning'
          }`}
        >
          <div className="flex items-center gap-2 max-w-5xl mx-auto w-full">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span>{lowTimeMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              if (remainingSeconds && remainingSeconds <= 60) setDismissedWarningMilestone(1);
              else if (remainingSeconds && remainingSeconds <= 300) setDismissedWarningMilestone(5);
              else if (remainingSeconds && remainingSeconds <= 900) setDismissedWarningMilestone(15);
            }}
            className="text-[11px] underline hover:no-underline font-semibold flex-shrink-0 focus:outline-none focus-visible:ring-1 focus-visible:ring-current rounded"
            aria-label="Dismiss time warning banner"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Sub-Header: Section Navigation, Question Navigator, & Shortcuts Button */}
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

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Keyboard Shortcuts Trigger Button */}
            <button
              type="button"
              onClick={() => setIsShortcutsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-elevated hover:bg-surface-elevated/80 border border-border text-foreground text-xs font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[40px] transition-colors"
              aria-label="Open accessible keyboard shortcuts reference (Press ?)"
              title="Keyboard Shortcuts (?)"
            >
              <Keyboard className="w-4 h-4 text-primary" aria-hidden="true" />
              <span className="hidden sm:inline">Shortcuts (?)</span>
            </button>

            {/* Question Navigator Drawer Trigger */}
            <button
              type="button"
              onClick={() => setIsNavigatorOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-elevated hover:bg-surface-elevated/80 border border-border text-foreground text-xs font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[40px] transition-colors"
              aria-label="Open question navigator grid"
            >
              <LayoutGrid className="w-4 h-4 text-primary" aria-hidden="true" />
              <span className="hidden sm:inline">Navigator</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Focus Area: Question Card */}
      <main id="main-content" className="flex-1 max-w-5xl mx-auto w-full px-4 pt-6 sm:pt-8 flex flex-col justify-between">
        <VoiceCommandBar
          isListening={voice.isListening}
          isSupported={voice.isSupported}
          lastCommand={voice.lastCommand}
          errorNotice={voice.errorNotice}
          onToggle={voice.toggleListening}
          className="mb-4"
        />

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

      <ExamShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
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
