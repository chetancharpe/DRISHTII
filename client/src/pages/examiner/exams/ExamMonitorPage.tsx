import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ExaminerExam, AggregateSessionMonitoring, ExamIncident, SystemAnnouncement } from '../../../types/examiner';
import { examinerService } from '../../../services/examinerService';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import {
  Play,
  Pause,
  StopCircle,
  Megaphone,
  ShieldCheck,
  ArrowLeft,
} from 'lucide-react';


export const ExamMonitorPage: React.FC = () => {
  const { examId = 'exam-01' } = useParams<{ examId: string }>();
  const [exam, setExam] = useState<ExaminerExam | null>(null);
  const [monitor, setMonitor] = useState<AggregateSessionMonitoring | null>(null);
  const [incidents, setIncidents] = useState<ExamIncident[]>([]);
  const [announcements, setAnnouncements] = useState<SystemAnnouncement[]>([]);
  const [announcementMsg, setAnnouncementMsg] = useState<string>('');
  const [announcementPriority, setAnnouncementPriority] = useState<'normal' | 'urgent'>('normal');
  const [isSendingAnn, setIsSendingAnn] = useState<boolean>(false);

  useEffect(() => {
    const load = async () => {
      const [examData, monData, incData, annData] = await Promise.all([
        examinerService.getExamById(examId),
        examinerService.getAggregateMonitoring(examId),
        examinerService.getIncidents(examId),
        examinerService.getAnnouncements(examId),
      ]);
      if (examData) setExam(examData);
      setMonitor(monData);
      setIncidents(incData);
      setAnnouncements(annData);
    };
    load();
  }, [examId]);

  if (!exam || !monitor) {
    return <div className="p-8 text-center text-foreground-muted">Connecting to aggregate session monitor...</div>;
  }

  const handlePauseExam = async () => {
    if (window.confirm('Are you sure you want to pause this active examination? All candidate timers will temporarily halt.')) {
      await examinerService.pauseExam(examId);
      setExam({ ...exam, lifecycleStatus: 'PAUSED' });
      setMonitor({ ...monitor, isPaused: true });
    }
  };

  const handleResumeExam = async () => {
    if (window.confirm('Resume active examination delivery for all connected candidates?')) {
      await examinerService.resumeExam(examId);
      setExam({ ...exam, lifecycleStatus: 'LIVE' });
      setMonitor({ ...monitor, isPaused: false });
    }
  };

  const handleEndExam = async () => {
    if (window.confirm('Warning: Ending the examination will trigger automatic submission for all in-progress candidates. Confirm?')) {
      await examinerService.endExam(examId);
      setExam({ ...exam, lifecycleStatus: 'COMPLETED' });
    }
  };

  const handleSendAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementMsg.trim()) return;

    setIsSendingAnn(true);
    try {
      const ann = await examinerService.broadcastAnnouncement(
        examId,
        announcementMsg,
        announcementPriority,
        'Chief Examiner'
      );
      setAnnouncements([ann, ...announcements]);
      setAnnouncementMsg('');
    } finally {
      setIsSendingAnn(false);
    }
  };

  return (
    <div className="flex flex-col gap-6" role="main" aria-label="Real-time Aggregate Live Examination Monitor">
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
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Live Monitor: {exam.title}
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-status-success/15 text-status-success border border-status-success/30">
              <span className="w-2 h-2 rounded-full bg-status-success animate-ping" />
              Live Telemetry
            </span>
          </div>
          <p className="text-sm text-foreground-muted mt-1">
            Non-invasive privacy-respecting session telemetry and network connection stability overview.
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2">
          {exam.lifecycleStatus === 'PAUSED' ? (
            <Button variant="primary" onClick={handleResumeExam} className="flex items-center gap-1.5">
              <Play className="w-4 h-4" aria-hidden="true" />
              Resume Exam
            </Button>
          ) : (
            <Button variant="secondary" onClick={handlePauseExam} className="flex items-center gap-1.5">
              <Pause className="w-4 h-4" aria-hidden="true" />
              Pause Exam
            </Button>
          )}

          <Button
            variant="danger"
            onClick={handleEndExam}
            className="flex items-center gap-1.5"
          >
            <StopCircle className="w-4 h-4" aria-hidden="true" />
            End Exam
          </Button>
        </div>
      </div>

      {/* Aggregate Session KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-xl border border-border bg-surface flex flex-col justify-between">
          <span className="text-xs font-bold uppercase text-foreground-muted">Total Enrolled</span>
          <span className="text-2xl font-black text-foreground mt-2">{monitor.totalCandidates}</span>
          <span className="text-[10px] text-foreground-muted">Registered candidates</span>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface flex flex-col justify-between">
          <span className="text-xs font-bold uppercase text-status-success">In Progress</span>
          <span className="text-2xl font-black text-status-success mt-2">{monitor.inProgress}</span>
          <span className="text-[10px] text-foreground-muted">Active answer sheets</span>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface flex flex-col justify-between">
          <span className="text-xs font-bold uppercase text-primary">Submitted</span>
          <span className="text-2xl font-black text-primary mt-2">{monitor.submitted}</span>
          <span className="text-[10px] text-foreground-muted">Completed & verified</span>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface flex flex-col justify-between">
          <span className="text-xs font-bold uppercase text-foreground-muted">Not Started</span>
          <span className="text-2xl font-black text-foreground mt-2">{monitor.notStarted}</span>
          <span className="text-[10px] text-foreground-muted">Awaiting candidate login</span>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface flex flex-col justify-between">
          <span className="text-xs font-bold uppercase text-status-warning">Temp Disconnected</span>
          <span className="text-2xl font-black text-status-warning mt-2">{monitor.temporarilyDisconnected}</span>
          <span className="text-[10px] text-foreground-muted">Local buffer active</span>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface flex flex-col justify-between">
          <span className="text-xs font-bold uppercase text-status-error">Expired / Absent</span>
          <span className="text-2xl font-black text-status-error mt-2">{monitor.expired}</span>
          <span className="text-[10px] text-foreground-muted">Window closed</span>
        </div>
      </div>

      {/* Non-Invasive Surveillance Transparency Guarantee */}
      <div className="p-4 rounded-xl bg-status-success/10 border border-status-success/30 flex items-start gap-3 text-xs text-foreground">
        <ShieldCheck className="w-5 h-5 text-status-success shrink-0 mt-0.5" aria-hidden="true" />
        <div className="space-y-1">
          <span className="font-bold block text-sm">Privacy & Accessible Proctoring Standard</span>
          <p className="text-foreground-muted leading-relaxed">
            GoWow strictly prohibits webcam surveillance, facial recognition, keystroke logging, emotion AI,
            and microphone monitoring. We monitor aggregate network connection health and server time synchronization
            to ensure visually impaired candidates can complete examinations with full dignity and peace of mind.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Incident Log Stream */}
        <div className="lg:col-span-2">
          <Card
            title="Session Incident Log"
            subtitle="Real-time connectivity and assistive interaction log"
          >
            <div className="space-y-3">
              {incidents.length === 0 ? (
                <div className="p-6 text-center text-foreground-muted text-xs">
                  Zero incidents recorded. All candidate sessions functioning smoothly.
                </div>
              ) : (
                incidents.map((inc) => (
                  <div
                    key={inc.id}
                    className="p-3.5 rounded-xl border border-border bg-surface-elevated/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-primary">{inc.id}</span>
                        <span className="text-foreground-muted">• {inc.timestamp}</span>
                        <span
                          className={`px-2 py-0.2 rounded text-[10px] font-bold uppercase ${
                            inc.status === 'resolved'
                              ? 'bg-status-success/15 text-status-success'
                              : 'bg-status-warning/15 text-status-warning'
                          }`}
                        >
                          {inc.status}
                        </span>
                      </div>
                      <p className="font-bold text-foreground">
                        Candidate {inc.candidateRef}:{' '}
                        <span className="font-normal capitalize">{inc.type.replace('_', ' ')}</span>
                      </p>
                      {inc.actionTaken && (
                        <p className="text-foreground-muted">{inc.actionTaken}</p>
                      )}
                    </div>

                    {inc.status !== 'resolved' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={async () => {
                          await examinerService.resolveIncident(inc.id, 'Resolved by examiner monitor.');
                          setIncidents(await examinerService.getIncidents(examId));
                        }}
                      >
                        Mark Resolved
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Broadcast System Announcement */}
        <div className="flex flex-col gap-6">
          <Card
            title="Send Announcement"
            subtitle="Broadcast accessible notice to active candidates"
          >
            <form onSubmit={handleSendAnnouncement} className="space-y-3">
              <div className="space-y-1">
                <label htmlFor="ann-msg" className="text-xs font-bold text-foreground block">
                  Announcement Message
                </label>
                <textarea
                  id="ann-msg"
                  rows={3}
                  value={announcementMsg}
                  onChange={(e) => setAnnouncementMsg(e.target.value)}
                  placeholder="e.g., 10 minutes remaining in standard examination window."
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={announcementPriority === 'urgent'}
                    onChange={(e) => setAnnouncementPriority(e.target.checked ? 'urgent' : 'normal')}
                    className="rounded text-status-error"
                  />
                  <span className="font-semibold text-foreground">Urgent Speech Alert</span>
                </label>

                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={!announcementMsg.trim() || isSendingAnn}
                  className="flex items-center gap-1.5"
                >
                  <Megaphone className="w-3.5 h-3.5" aria-hidden="true" />
                  {isSendingAnn ? 'Broadcasting...' : 'Broadcast'}
                </Button>
              </div>
            </form>

            <div className="mt-4 pt-4 border-t border-border space-y-2">
              <span className="text-[11px] font-bold text-foreground block uppercase font-mono">
                Recent Broadcasts:
              </span>
              <ul className="space-y-2 text-xs">
                {announcements.map((a) => (
                  <li key={a.id} className="p-2.5 rounded-lg bg-surface border border-border space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-foreground-muted">
                      <span>{a.sentAt}</span>
                      <span className="font-bold text-primary">{a.sentBy}</span>
                    </div>
                    <p className="text-foreground">{a.message}</p>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
