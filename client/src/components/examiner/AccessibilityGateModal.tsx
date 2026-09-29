import React from 'react';
import { ExaminerExam, ExamPublishChecklist } from '../../types/examiner';
import { Button } from '../common/Button';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Lock,
  X,
  FileCheck2,
} from 'lucide-react';

interface AccessibilityGateModalProps {
  exam: ExaminerExam;
  checklist: ExamPublishChecklist;
  isOpen: boolean;
  onClose: () => void;
  onConfirmPublish: () => void;
  isPublishing?: boolean;
}

export const AccessibilityGateModal: React.FC<AccessibilityGateModalProps> = ({
  exam,
  checklist,
  isOpen,
  onClose,
  onConfirmPublish,
  isPublishing = false,
}) => {
  if (!isOpen) return null;

  const checks = [
    { label: 'Basic Information & Title', passed: checklist.basicInfoComplete },
    { label: 'Exam Structure & Sections', passed: checklist.structureValid },
    { label: 'Questions Configured & Active', passed: checklist.questionsAssigned },
    { label: 'Answer Keys & Explanations', passed: checklist.correctAnswersVerified },
    { label: 'Marking & Negative Schemes', passed: checklist.markingSchemeConfigured },
    { label: 'Screen Reader & WCAG Standards', passed: checklist.accessibilityChecksPassed },
    { label: 'Assigned Candidate Cohorts', passed: checklist.candidateGroupAssigned },
    { label: 'Schedule & Timezone Bounds', passed: checklist.scheduleValid },
    { label: 'Accessible Candidate Instructions', passed: checklist.instructionsAccessible },
    { label: 'Candidate Preview Verified', passed: checklist.previewVerified },
  ];

  const hasBlocking = checklist.blockingErrors.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gate-modal-title"
    >
      <div className="bg-surface border border-border rounded-2xl max-w-2xl w-full p-6 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl border ${
                hasBlocking
                  ? 'bg-status-error/15 text-status-error border-status-error/30'
                  : 'bg-status-success/15 text-status-success border-status-success/30'
              }`}
            >
              <FileCheck2 className="w-6 h-6" aria-hidden="true" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-primary">
                Mandatory Institutional Publish Gate
              </span>
              <h2 id="gate-modal-title" className="text-xl font-bold text-foreground">
                Publish Audit: {exam.title}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Audit Modal"
            className="p-2 rounded-lg text-foreground-muted hover:text-foreground hover:bg-surface-elevated transition-colors"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* 10-Point Checklist Grid */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold text-foreground uppercase tracking-wider">
            Automated Pre-Flight Checklist:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {checks.map((c, i) => (
              <div
                key={i}
                className={`flex items-center gap-2 p-2.5 rounded-lg border ${
                  c.passed
                    ? 'bg-surface-elevated/50 border-border text-foreground'
                    : 'bg-status-error/5 border-status-error/30 text-status-error font-semibold'
                }`}
              >
                {c.passed ? (
                  <CheckCircle2 className="w-4 h-4 text-status-success shrink-0" aria-hidden="true" />
                ) : (
                  <XCircle className="w-4 h-4 text-status-error shrink-0" aria-hidden="true" />
                )}
                <span>{c.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Blocking Errors Display */}
        {hasBlocking && (
          <div className="p-4 rounded-xl bg-status-error/10 border border-status-error/30 text-xs text-status-error flex flex-col gap-2">
            <div className="flex items-center gap-2 font-bold text-sm">
              <ShieldAlert className="w-5 h-5 shrink-0" aria-hidden="true" />
              <span>Publication Blocked: Unresolved Inconsistencies</span>
            </div>
            <p>
              The DRISHTI platform prevents incomplete or inaccessible examinations from reaching live candidate delivery.
            </p>
            <ul className="list-disc list-inside space-y-1 ml-1 font-medium">
              {checklist.blockingErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Warnings Display */}
        {checklist.warnings.length > 0 && (
          <div className="p-4 rounded-xl bg-status-warning/10 border border-status-warning/30 text-xs text-status-warning flex flex-col gap-1.5">
            <div className="flex items-center gap-2 font-bold">
              <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Non-Blocking Advisory Notes:</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 ml-1">
              {checklist.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Immutability Warning */}
        {!hasBlocking && (
          <div className="p-4 rounded-xl bg-primary/10 border border-primary/30 text-xs text-foreground flex items-start gap-3">
            <Lock className="w-5 h-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-1">
              <span className="font-bold block text-sm">Integrity & Immutability Notice</span>
              <p className="text-foreground-muted leading-relaxed">
                After publishing, examination parameters—including question wording, correct answer keys, marking scheme,
                and maximum duration—will become locked to guarantee examination fairness and institutional integrity.
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <Button variant="secondary" onClick={onClose} disabled={isPublishing}>
            Cancel
          </Button>

          <Button
            variant="primary"
            onClick={onConfirmPublish}
            disabled={hasBlocking || isPublishing}
            isLoading={isPublishing}
            className="flex items-center gap-2"
          >
            <FileCheck2 className="w-4 h-4" aria-hidden="true" />
            {isPublishing ? 'Publishing...' : 'Publish Examination'}
          </Button>
        </div>
      </div>
    </div>
  );
};
