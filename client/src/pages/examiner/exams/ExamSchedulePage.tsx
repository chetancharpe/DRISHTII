import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ExaminerExam, ExamScheduleConfig } from '../../../types/examiner';
import { examinerService } from '../../../services/examinerService';
import { scheduleService } from '../../../services/scheduleService';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import {
  Globe,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
} from 'lucide-react';


export const ExamSchedulePage: React.FC = () => {
  const { examId = 'exam-01' } = useParams<{ examId: string }>();
  const [exam, setExam] = useState<ExaminerExam | null>(null);
  const [schedule, setSchedule] = useState<ExamScheduleConfig>({
    startDate: '2026-10-10',
    startTime: '10:00',
    endDate: '2026-10-10',
    endTime: '12:00',
    durationMinutes: 60,
    timezone: 'IST (UTC+05:30)',
    attemptWindowHours: 2,
    candidateAvailability: 'all_assigned',
  });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

  useEffect(() => {
    const load = async () => {
      const data = await examinerService.getExamById(examId);
      if (data) {
        setExam(data);
        setSchedule(data.schedule);
      }
    };
    load();
  }, [examId]);

  if (!exam) {
    return <div className="p-8 text-center text-foreground-muted">Loading schedule settings...</div>;
  }

  const handleSave = async () => {
    const val = scheduleService.validateSchedule(schedule);
    if (!val.isValid) {
      setValidationErrors(val.errors);
      return;
    }
    setValidationErrors([]);
    setIsSaving(true);
    setSuccess(false);

    try {
      await scheduleService.updateSchedule(examId, schedule);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update schedule');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6" role="main" aria-label="Exam Schedule Window Configuration">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link to="/examiner/exams" className="text-xs text-primary font-bold hover:underline flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
              Back to Exams
            </Link>
            <span className="text-xs text-foreground-muted">/</span>
            <span className="font-mono text-xs text-foreground-muted">{exam.code}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Schedule Window: {exam.title}
          </h1>
          <p className="text-sm text-foreground-muted mt-1">
            Configure examination attempt window, session duration, and explicit institutional timezone.
          </p>
        </div>

        <Button variant="primary" onClick={handleSave} disabled={isSaving} className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
          {isSaving ? 'Saving...' : 'Save Schedule'}
        </Button>
      </div>

      {success && (
        <div className="p-3.5 rounded-xl bg-status-success/10 border border-status-success/30 text-xs text-status-success font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
          Schedule successfully synchronized across testing servers.
        </div>
      )}

      {validationErrors.length > 0 && (
        <div className="p-4 rounded-xl bg-status-error/10 border border-status-error/30 text-xs text-status-error space-y-1">
          <span className="font-bold flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
            Schedule Validation Errors:
          </span>
          <ul className="list-disc list-inside space-y-0.5 ml-2">
            {validationErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title="Assessment Timeline" subtitle="Start and conclusion bounds">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="sched-start-date" className="text-xs font-bold text-foreground block">
                    Start Date <span className="text-status-error">*</span>
                  </label>
                  <input
                    id="sched-start-date"
                    type="date"
                    value={schedule.startDate}
                    onChange={(e) => setSchedule({ ...schedule, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="sched-start-time" className="text-xs font-bold text-foreground block">
                    Start Time <span className="text-status-error">*</span>
                  </label>
                  <input
                    id="sched-start-time"
                    type="time"
                    value={schedule.startTime}
                    onChange={(e) => setSchedule({ ...schedule, startTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="sched-end-date" className="text-xs font-bold text-foreground block">
                    End Date <span className="text-status-error">*</span>
                  </label>
                  <input
                    id="sched-end-date"
                    type="date"
                    value={schedule.endDate}
                    onChange={(e) => setSchedule({ ...schedule, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="sched-end-time" className="text-xs font-bold text-foreground block">
                    End Time <span className="text-status-error">*</span>
                  </label>
                  <input
                    id="sched-end-time"
                    type="time"
                    value={schedule.endTime}
                    onChange={(e) => setSchedule({ ...schedule, endTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                  <label htmlFor="sched-dur" className="text-xs font-bold text-foreground block">
                    Session Duration (minutes)
                  </label>
                  <input
                    id="sched-dur"
                    type="number"
                    value={schedule.durationMinutes}
                    onChange={(e) => setSchedule({ ...schedule, durationMinutes: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="sched-avail" className="text-xs font-bold text-foreground block">
                    Candidate Availability Rule
                  </label>
                  <select
                    id="sched-avail"
                    value={schedule.candidateAvailability}
                    onChange={(e) => setSchedule({ ...schedule, candidateAvailability: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground text-sm"
                  >
                    <option value="all_assigned">All Assigned Cohorts</option>
                    <option value="group_only">Selected Groups Only</option>
                    <option value="verified_only">Verified Identity Only</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card title="Timezone Transparency" subtitle="Section 29 Core Requirement">
            <div className="p-4 rounded-xl bg-surface-elevated border border-border space-y-3 text-xs">
              <div className="flex items-center gap-2 font-bold text-foreground text-sm">
                <Globe className="w-4 h-4 text-primary" aria-hidden="true" />
                <span>Explicit Timezone Reference:</span>
              </div>
              <p className="text-foreground-muted leading-relaxed">
                To eliminate confusion across candidates in various regions and with diverse assistive setups,
                the platform explicitly displays timezone codes on all candidate timers.
              </p>
              <div className="p-2.5 rounded-lg bg-surface border border-border font-mono text-center text-sm font-bold text-primary">
                {schedule.timezone}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
