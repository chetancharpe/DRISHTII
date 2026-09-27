import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Exam, ExamSubmission } from '../../../types/exam';
import { examService } from '../../../services/examService';
import {
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';

export const ExamStatusPage: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const [exam, setExam] = useState<Exam | null>(null);
  const [submission, setSubmission] = useState<ExamSubmission | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStatus() {
      if (!examId) return;
      try {
        setIsLoading(true);
        const [examData, subData] = await Promise.all([
          examService.getExam(examId),
          examService.getSubmissionStatus(examId),
        ]);

        setExam(examData);
        setSubmission(subData);
      } catch (err) {
        console.error('Failed to load submission status', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadStatus();
  }, [examId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-3" role="status">
        <Loader2 className="w-8 h-8 animate-spin text-primary" aria-hidden="true" />
        <p className="text-xs font-semibold text-foreground-secondary">
          Retrieving official submission acknowledgment...
        </p>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="p-8 rounded-xl border border-border bg-surface text-center flex flex-col items-center gap-4 max-w-md mx-auto">
        <AlertCircle className="w-8 h-8 text-warning" aria-hidden="true" />
        <p className="text-sm font-bold text-foreground">Examination record not found.</p>
        <Link
          to="/candidate/exams"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-contrast text-xs font-bold min-h-[40px]"
        >
          <span>Return to Examinations</span>
        </Link>
      </div>
    );
  }

  const submittedAtFormatted = submission?.submittedAt
    ? new Date(submission.submittedAt).toLocaleString()
    : 'Confirmed by Authority';

  return (
    <div className="flex flex-col gap-8 max-w-3xl mx-auto pb-12">
      {/* Top Confirmation Card */}
      <div className="p-6 sm:p-8 rounded-2xl border border-success/30 bg-success/5 flex flex-col items-center text-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-success/15 text-success border border-success/30 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8" aria-hidden="true" />
        </div>

        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-success bg-success/10 px-2.5 py-1 rounded border border-success/20">
            Submission Confirmed
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mt-2">
            Examination Submitted Successfully
          </h1>
          <p className="text-xs sm:text-sm text-foreground-secondary max-w-lg mt-1 leading-relaxed">
            Your responses for <strong className="text-foreground">{exam.title}</strong> have been received and sealed for official evaluation.
          </p>
        </div>

        {/* Submission Reference Box */}
        <div className="w-full p-4 rounded-xl border border-border bg-surface text-left text-xs grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
          <div>
            <span className="text-[10px] uppercase font-bold text-foreground-secondary block">
              Official Submission ID
            </span>
            <span className="font-mono text-sm font-bold text-foreground select-all">
              {submission?.submissionId || `DEMO-EXAM-CONFIRMED`}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-foreground-secondary block">
              Submission Timestamp
            </span>
            <span className="font-mono text-xs font-semibold text-foreground">
              {submittedAtFormatted}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-foreground-secondary block">
              Candidate Roll Number
            </span>
            <span className="font-mono text-xs font-semibold text-foreground">
              {exam.eligibility.rollNumber}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-foreground-secondary block">
              Examination Authority
            </span>
            <span className="text-xs font-semibold text-foreground truncate">
              {exam.organization}
            </span>
          </div>
        </div>
      </div>

      {/* Response Breakdown Summary */}
      {submission && (
        <section aria-labelledby="receipt-breakdown-heading" className="p-6 rounded-2xl border border-border bg-surface flex flex-col gap-4">
          <h2 id="receipt-breakdown-heading" className="text-sm font-bold uppercase tracking-wider text-foreground">
            Attempt Receipt Summary
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-xl border border-border bg-surface-elevated/40 flex flex-col">
              <span className="text-[10px] uppercase font-bold text-foreground-secondary">Total Items</span>
              <span className="font-mono text-lg font-bold text-foreground">{submission.totalQuestions}</span>
            </div>

            <div className="p-3.5 rounded-xl border border-success/30 bg-success/10 flex flex-col">
              <span className="text-[10px] uppercase font-bold text-success">Recorded Answers</span>
              <span className="font-mono text-lg font-bold text-success">{submission.answeredCount}</span>
            </div>

            <div className="p-3.5 rounded-xl border border-warning/30 bg-warning/10 flex flex-col">
              <span className="text-[10px] uppercase font-bold text-warning">Unattempted</span>
              <span className="font-mono text-lg font-bold text-warning">{submission.unansweredCount}</span>
            </div>

            <div className="p-3.5 rounded-xl border border-accent/30 bg-accent/10 flex flex-col">
              <span className="text-[10px] uppercase font-bold text-accent">Marked for Review</span>
              <span className="font-mono text-lg font-bold text-accent">{submission.markedCount}</span>
            </div>
          </div>
        </section>
      )}

      {/* Official Result Access Notice (Section 50, 51) */}
      <section aria-labelledby="result-notice-heading" className="p-5 rounded-2xl border border-primary/20 bg-primary/5 flex items-start gap-3.5 text-xs">
        <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" aria-hidden="true" />
        <div className="flex flex-col gap-1 text-foreground">
          <h2 id="result-notice-heading" className="font-bold text-xs">
            Result Release Policy
          </h2>
          <p className="text-foreground-secondary leading-relaxed">
            {submission?.resultNotice ||
              'In accordance with examination authority guidelines, official candidate scorecards, answer rationales, and category merit standings will be released after normalization and board evaluation.'}
          </p>
        </div>
      </section>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <Link
          to="/candidate/dashboard"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-surface hover:bg-surface-elevated border border-border text-foreground font-bold text-xs min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
        >
          <span>Return to Candidate Dashboard</span>
        </Link>

        <Link
          to="/candidate/exams"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover active:bg-primary-hover text-primary-contrast font-bold text-xs min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-xs transition-colors"
        >
          <span>View All Examinations</span>
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
};
