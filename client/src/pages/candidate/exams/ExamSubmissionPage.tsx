import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Exam, ExamSession } from '../../../types/exam';
import { examService } from '../../../services/examService';
import {
  ArrowLeft,
  Send,
  AlertTriangle,
  RefreshCw,
  ShieldAlert,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { useAccessibility } from '../../../contexts/AccessibilityContext';

export const ExamSubmissionPage: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { announce } = useAccessibility();

  const [exam, setExam] = useState<Exam | null>(null);
  const [session, setSession] = useState<ExamSession | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!examId) return;
      try {
        setIsLoading(true);
        const examData = await examService.getExam(examId);
        const sessionData = await examService.getExamSession(examId);

        if (!examData) {
          navigate('/candidate/exams');
          return;
        }

        if (sessionData?.status === 'SUBMITTED') {
          navigate(`/candidate/exams/${examId}/status`);
          return;
        }

        setExam(examData);
        setSession(sessionData);
      } catch (err) {
        console.error('Error loading submission data', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [examId, navigate]);

  const handleRetrySync = async () => {
    if (!examId) return;
    setIsSyncing(true);
    try {
      const { success, session: updatedSession } = await examService.retrySync(examId);
      setSession(updatedSession);
      announce(
        success
          ? 'All answers synchronized with the examination server.'
          : 'Could not synchronize. Please verify internet connection.'
      );
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleFinalSubmit = async () => {
    if (!examId) return;
    setIsSubmitting(true);
    try {
      await examService.submitExam(examId);
      navigate(`/candidate/exams/${examId}/status`);
    } catch (err) {
      console.error('Failed to submit exam', err);
      setIsSubmitting(false);
      announce('Submission could not be completed. Please retry.');
    }
  };

  if (isLoading || !exam) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-3" role="status">
        <Loader2 className="w-8 h-8 animate-spin text-primary" aria-hidden="true" />
        <p className="text-xs font-semibold text-foreground-secondary">
          Preparing submission verification...
        </p>
      </div>
    );
  }

  const answers = session?.answers || {};
  let answeredCount = 0;
  let markedCount = 0;

  Object.values(answers).forEach((ans) => {
    if (ans.selectedOptions.length > 0) answeredCount++;
    if (ans.isMarkedForReview) markedCount++;
  });

  const unansweredCount = exam.config.totalQuestions - answeredCount;
  const unsyncedCount = session?.unsyncedQuestionIds.length || 0;
  const hasUnsynced = unsyncedCount > 0;

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto pb-12">
      {/* Back button */}
      <div>
        <Link
          to={`/candidate/exams/${exam.id}/session`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline p-1 min-h-[36px] rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Return to Examination Questions</span>
        </Link>
      </div>

      {/* Header */}
      <header className="flex flex-col gap-2 border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-danger bg-danger/10 px-2.5 py-1 rounded border border-danger/20">
            Final Step: Submission Verification
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mt-1">
          Review & Submit Examination
        </h1>
        <p className="text-sm text-foreground-secondary leading-relaxed">
          Verify your completed question counts below. Once submitted, your examination answers will be locked for official evaluation.
        </p>
      </header>

      {/* Verification Summary Card (Section 43) */}
      <div className="p-6 rounded-2xl border border-border bg-surface flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h2 className="text-base font-extrabold text-foreground">{exam.title}</h2>
            <p className="text-xs text-foreground-secondary mt-0.5">{exam.organization}</p>
          </div>
          <span className="font-mono text-xs font-bold text-foreground px-2.5 py-1 rounded bg-surface-elevated border border-border">
            Roll: {exam.eligibility.rollNumber}
          </span>
        </div>

        {/* Tallies */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl border border-border bg-surface-elevated/40 flex flex-col">
            <span className="text-[10px] uppercase font-bold text-foreground-secondary">Total Questions</span>
            <span className="font-mono text-xl font-bold text-foreground mt-0.5">
              {exam.config.totalQuestions}
            </span>
          </div>

          <div className="p-4 rounded-xl border border-success/30 bg-success/10 flex flex-col">
            <span className="text-[10px] uppercase font-bold text-success">Answered</span>
            <span className="font-mono text-xl font-bold text-success mt-0.5">
              {answeredCount}
            </span>
          </div>

          <div className="p-4 rounded-xl border border-warning/30 bg-warning/10 flex flex-col">
            <span className="text-[10px] uppercase font-bold text-warning">Unanswered</span>
            <span className="font-mono text-xl font-bold text-warning mt-0.5">
              {unansweredCount}
            </span>
          </div>

          <div className="p-4 rounded-xl border border-accent/30 bg-accent/10 flex flex-col">
            <span className="text-[10px] uppercase font-bold text-accent">Marked for Review</span>
            <span className="font-mono text-xl font-bold text-accent mt-0.5">
              {markedCount}
            </span>
          </div>
        </div>

        {/* Section Breakdown */}
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Section-wise Attempt Status
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {exam.config.sections.map((sec) => {
              let secAnswered = 0;
              sec.questions.forEach((q) => {
                if (answers[q.id]?.selectedOptions?.length) secAnswered++;
              });
              return (
                <div
                  key={sec.id}
                  className="p-3.5 rounded-xl border border-border bg-surface-elevated/30 flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-bold text-foreground block">{sec.title}</span>
                    <span className="text-[11px] text-foreground-secondary font-mono">{sec.code}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-foreground px-2 py-0.5 rounded bg-surface border border-border">
                    {secAnswered} / {sec.totalQuestions}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Unsynchronized Warning Banner (Section 45) */}
        {hasUnsynced ? (
          <div
            className="p-5 rounded-xl border border-danger/40 bg-danger/10 text-danger flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            role="alert"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <strong className="text-xs font-bold block">
                  {unsyncedCount} answer{unsyncedCount > 1 ? 's have' : ' has'} not yet been confirmed by the server.
                </strong>
                <p className="text-xs text-danger/90 mt-0.5 leading-relaxed">
                  Do not submit until all answers are confirmed. Please verify your internet connection and click retry.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRetrySync}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-danger hover:bg-danger/90 active:bg-danger text-white text-xs font-bold min-h-[40px] focus:outline-none focus-visible:ring-2 focus-visible:ring-danger flex-shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} aria-hidden="true" />
              <span>{isSyncing ? 'Synchronizing...' : 'Retry Synchronization'}</span>
            </button>
          </div>
        ) : (
          <div className="p-4 rounded-xl border border-success/30 bg-success/10 flex items-center gap-2.5 text-xs text-success">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span className="font-semibold">
              All responses are synchronized with the examination authority server.
            </span>
          </div>
        )}

        {/* Important final notice */}
        <div className="p-4 rounded-xl border border-border bg-surface-elevated/40 text-xs text-foreground-secondary flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" aria-hidden="true" />
          <span>
            Confirmation of submission concludes your examination attempt. Unanswered questions receive 0 marks. Official results will be released according to authority policy.
          </span>
        </div>

        {/* Submission Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border">
          <Link
            to={`/candidate/exams/${exam.id}/session`}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-surface hover:bg-surface-elevated border border-border text-foreground font-bold text-xs min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Return to Examination</span>
          </Link>

          <button
            type="button"
            onClick={handleFinalSubmit}
            disabled={hasUnsynced || isSubmitting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-danger hover:bg-danger/90 active:bg-danger text-white font-bold text-xs min-h-[48px] focus:outline-none focus-visible:ring-2 focus-visible:ring-danger shadow-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" aria-hidden="true" />
            <span>{isSubmitting ? 'Submitting to Authority...' : 'Confirm Final Submission'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
