import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../common/Card';
import { Exam, ExamStatus } from '../../types/exam';
import { Clock, HelpCircle, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

interface ExamCardProps {
  exam: Exam;
}

export const ExamCard: React.FC<ExamCardProps> = ({ exam }) => {
  const getStatusBadge = (status: ExamStatus) => {
    switch (status) {
      case 'available':
        return {
          label: 'Available Now',
          classes: 'bg-success/10 text-success border-success/30 font-bold',
          icon: <CheckCircle2 className="w-3.5 h-3.5" />,
        };
      case 'in_progress':
        return {
          label: 'In Progress',
          classes: 'bg-warning/10 text-warning border-warning/40 font-bold',
          icon: <Clock className="w-3.5 h-3.5" />,
        };
      case 'scheduled':
        return {
          label: 'Scheduled',
          classes: 'bg-primary/10 text-primary border-primary/30 font-bold',
          icon: <Clock className="w-3.5 h-3.5" />,
        };
      case 'submitted':
      case 'completed':
        return {
          label: 'Submitted',
          classes: 'bg-surface-elevated text-foreground-secondary border-border font-medium',
          icon: <CheckCircle2 className="w-3.5 h-3.5" />,
        };
      case 'expired':
        return {
          label: 'Expired',
          classes: 'bg-danger/10 text-danger border-danger/30 font-bold',
          icon: <AlertCircle className="w-3.5 h-3.5" />,
        };
      default:
        return {
          label: 'Unavailable',
          classes: 'bg-surface-elevated text-foreground-secondary border-border',
          icon: <AlertCircle className="w-3.5 h-3.5" />,
        };
    }
  };

  const statusBadge = getStatusBadge(exam.status);
  const isAvailable = exam.status === 'available';
  const isInProgress = exam.status === 'in_progress';
  const isSubmitted = exam.status === 'submitted' || exam.status === 'completed';

  return (
    <Card className="flex flex-col justify-between h-full hover:border-primary/40 transition-colors">
      <div className="flex flex-col gap-3.5">
        {/* Header badges */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
            {exam.examCode}
          </span>

          <span
            className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs border ${statusBadge.classes}`}
          >
            {statusBadge.icon}
            <span>{statusBadge.label}</span>
          </span>
        </div>

        {/* Title and Organization */}
        <div>
          <h3 className="text-base font-extrabold text-foreground tracking-tight leading-snug">
            {exam.title}
          </h3>
          <p className="text-xs text-foreground-secondary mt-1">
            {exam.organization}
          </p>
        </div>

        {/* Schedule & Duration Highlights */}
        <div className="grid grid-cols-2 gap-2 text-xs border-y border-border py-2.5 my-1">
          <div className="flex items-center gap-1.5 text-foreground-secondary">
            <Clock className="w-3.5 h-3.5 text-primary flex-shrink-0" aria-hidden="true" />
            <span>{exam.durationMinutes} minutes</span>
          </div>

          <div className="flex items-center gap-1.5 text-foreground-secondary">
            <HelpCircle className="w-3.5 h-3.5 text-primary flex-shrink-0" aria-hidden="true" />
            <span>{exam.totalQuestions} questions</span>
          </div>
        </div>

        {/* Sections Preview */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold text-foreground-secondary mr-1">Sections:</span>
          {exam.sections.map((sec) => (
            <span
              key={sec.id}
              className="text-[10px] font-medium bg-surface-elevated text-foreground-secondary px-2 py-0.5 rounded border border-border"
            >
              {sec.title} ({sec.questionCount})
            </span>
          ))}
        </div>

        {/* Accessibility support guarantee badge */}
        <div className="flex items-center gap-1.5 text-[11px] text-foreground-secondary">
          <ShieldCheck className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
          <span>Screen-reader & keyboard compatible</span>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-4 mt-2 border-t border-border flex items-center justify-between gap-3">
        <span className="text-[11px] font-semibold text-foreground-secondary">
          {exam.date}
        </span>

        {isSubmitted ? (
          <Link
            to={`/candidate/exams/${exam.id}/status`}
            className="inline-flex items-center gap-1 text-xs font-bold text-foreground hover:text-primary min-h-[38px] px-3 rounded-lg hover:bg-surface-elevated transition-colors"
          >
            <span>View Status</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        ) : isInProgress ? (
          <Link
            to={`/candidate/exams/${exam.id}/session`}
            className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-warning hover:bg-warning-hover active:bg-warning-hover text-warning-contrast min-h-[40px] focus:outline-none focus-visible:ring-2 focus-visible:ring-warning transition-colors"
          >
            <span>Resume Exam</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        ) : (
          <Link
            to={`/candidate/exams/${exam.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover active:bg-primary-hover text-primary-contrast min-h-[40px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
          >
            <span>{isAvailable ? 'View Examination' : 'View Details'}</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        )}
      </div>
    </Card>
  );
};
