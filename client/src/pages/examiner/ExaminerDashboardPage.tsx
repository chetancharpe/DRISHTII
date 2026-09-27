import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { examinerService } from '../../services/examinerService';
import { ExaminerExam } from '../../types/examiner';
import {
  Calendar,
  CheckCircle,

  Users,
  Clock,
  PlusCircle,
  ShieldCheck,
  Eye,
  Activity,
  ArrowRight,
  Database,
  BarChart3,
} from 'lucide-react';

export const ExaminerDashboardPage: React.FC = () => {
  const [kpis, setKpis] = useState({
    activeExams: 3,
    upcomingExams: 7,
    draftExams: 1,
    completedExams: 24,
    totalCandidates: 1284,
    pendingEvaluations: 43,
  });
  const [recentExams, setRecentExams] = useState<ExaminerExam[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [stats, exams] = await Promise.all([
          examinerService.getDashboardKPIs(),
          examinerService.getExams(),
        ]);
        setKpis(stats);
        setRecentExams(exams.slice(0, 4));
      } catch (err) {
        console.error('Failed to load examiner dashboard telemetry', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <div className="flex flex-col gap-6" role="main" aria-label="Examiner Authoring and Monitoring Dashboard">
      {/* Page Title & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-primary">
            Examiner & Authoring Studio
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Examination Management Dashboard
          </h1>
          <p className="text-sm text-foreground-muted mt-1">
            Author accessible question items, monitor real-time candidate attempts, and evaluate submissions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/examiner/question-bank">
            <Button variant="secondary" className="flex items-center gap-2">
              <Database className="w-4 h-4" aria-hidden="true" />
              Question Bank
            </Button>
          </Link>
          <Link to="/examiner/exams/create">
            <Button variant="primary" className="flex items-center gap-2">
              <PlusCircle className="w-4 h-4" aria-hidden="true" />
              Create Exam
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid with Semantic Headings & Accessible Text */}
      <section aria-labelledby="kpi-section-title">
        <h2 id="kpi-section-title" className="sr-only">
          Platform Summary Statistics
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
          {/* Active Exams */}
          <div className="p-4 rounded-xl border border-border bg-surface flex flex-col justify-between">
            <div className="flex items-center justify-between text-status-success">
              <span className="text-xs font-bold uppercase text-foreground-muted">Active Exams</span>
              <Activity className="w-4 h-4 animate-pulse" aria-hidden="true" />
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-black text-foreground">
                {isLoading ? '...' : kpis.activeExams}
              </span>
              <span className="block text-[11px] text-foreground-muted mt-0.5">Live sessions</span>
            </div>
          </div>

          {/* Upcoming Exams */}
          <div className="p-4 rounded-xl border border-border bg-surface flex flex-col justify-between">
            <div className="flex items-center justify-between text-primary">
              <span className="text-xs font-bold uppercase text-foreground-muted">Upcoming</span>
              <Calendar className="w-4 h-4" aria-hidden="true" />
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-black text-foreground">
                {isLoading ? '...' : kpis.upcomingExams}
              </span>
              <span className="block text-[11px] text-foreground-muted mt-0.5">Scheduled windows</span>
            </div>
          </div>

          {/* Completed Exams */}
          <div className="p-4 rounded-xl border border-border bg-surface flex flex-col justify-between">
            <div className="flex items-center justify-between text-status-info">
              <span className="text-xs font-bold uppercase text-foreground-muted">Completed</span>
              <CheckCircle className="w-4 h-4" aria-hidden="true" />
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-black text-foreground">
                {isLoading ? '...' : kpis.completedExams}
              </span>
              <span className="block text-[11px] text-foreground-muted mt-0.5">Archived sessions</span>
            </div>
          </div>

          {/* Candidates */}
          <div className="p-4 rounded-xl border border-border bg-surface flex flex-col justify-between">
            <div className="flex items-center justify-between text-secondary">
              <span className="text-xs font-bold uppercase text-foreground-muted">Candidates</span>
              <Users className="w-4 h-4" aria-hidden="true" />
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-black text-foreground">
                {isLoading ? '...' : kpis.totalCandidates.toLocaleString()}
              </span>
              <span className="block text-[11px] text-foreground-muted mt-0.5">Enrolled candidates</span>
            </div>
          </div>

          {/* Pending Evaluation */}
          <div className="p-4 rounded-xl border border-border bg-surface flex flex-col justify-between">
            <div className="flex items-center justify-between text-status-warning">
              <span className="text-xs font-bold uppercase text-foreground-muted">Pending Eval</span>
              <Clock className="w-4 h-4" aria-hidden="true" />
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-black text-foreground">
                {isLoading ? '...' : kpis.pendingEvaluations}
              </span>
              <span className="block text-[11px] text-foreground-muted mt-0.5">Subjective answers</span>
            </div>
          </div>

          {/* Accessibility Compliance */}
          <div className="p-4 rounded-xl border border-border bg-surface flex flex-col justify-between">
            <div className="flex items-center justify-between text-status-success">
              <span className="text-xs font-bold uppercase text-foreground-muted">Accessibility</span>
              <ShieldCheck className="w-4 h-4" aria-hidden="true" />
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-black text-foreground">100%</span>
              <span className="block text-[11px] text-status-success font-semibold mt-0.5">WCAG AAA gated</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Grid: Recent Exams & Live Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Exams List */}
        <div className="lg:col-span-2">
          <Card
            title="Managed Examinations"
            subtitle="Recent live, scheduled, and draft examinations authored under your organization"
          >
            <div className="flex flex-col divide-y divide-border">
              {recentExams.map((exam) => (
                <div key={exam.id} className="py-4 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-primary">{exam.code}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          exam.lifecycleStatus === 'LIVE'
                            ? 'bg-status-success/15 text-status-success'
                            : exam.lifecycleStatus === 'SCHEDULED'
                            ? 'bg-primary/15 text-primary'
                            : exam.lifecycleStatus === 'COMPLETED'
                            ? 'bg-surface-elevated text-foreground-muted border border-border'
                            : 'bg-status-warning/15 text-status-warning'
                        }`}
                      >
                        {exam.lifecycleStatus}
                      </span>
                    </div>
                    <Link
                      to={`/examiner/exams/${exam.id}`}
                      className="font-bold text-foreground text-sm hover:text-primary transition-colors truncate"
                    >
                      {exam.title}
                    </Link>
                    <div className="flex items-center gap-4 text-xs text-foreground-muted">
                      <span>{exam.totalQuestions} Questions</span>
                      <span>{exam.rules.durationMinutes} Minutes</span>
                      <span>{exam.candidatesCount} Candidates</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link to={`/examiner/exams/${exam.id}/preview`}>
                      <Button variant="ghost" size="sm" aria-label={`Preview ${exam.title} as candidate`}>
                        <Eye className="w-4 h-4" aria-hidden="true" />
                      </Button>
                    </Link>
                    {exam.lifecycleStatus === 'LIVE' && (
                      <Link to={`/examiner/exams/${exam.id}/monitor`}>
                        <Button variant="primary" size="sm" className="flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5" aria-hidden="true" />
                          Monitor
                        </Button>
                      </Link>
                    )}
                    {exam.lifecycleStatus === 'COMPLETED' && (
                      <Link to={`/examiner/exams/${exam.id}/results`}>
                        <Button variant="secondary" size="sm" className="flex items-center gap-1.5">
                          <BarChart3 className="w-3.5 h-3.5" aria-hidden="true" />
                          Results
                        </Button>
                      </Link>
                    )}
                    {exam.lifecycleStatus === 'DRAFT' && (
                      <Link to={`/examiner/exams/${exam.id}/edit`}>
                        <Button variant="secondary" size="sm">
                          Edit
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-border mt-3 flex items-center justify-between">
              <span className="text-xs text-foreground-muted">
                Showing {recentExams.length} of {kpis.activeExams + kpis.upcomingExams + kpis.completedExams + kpis.draftExams} total examinations
              </span>
              <Link
                to="/examiner/exams"
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
              >
                View all examinations
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </Link>
            </div>
          </Card>
        </div>

        {/* Recent Examiner Activity & Inclusive Highlights */}
        <div className="flex flex-col gap-6">
          <Card title="Recent Activity" subtitle="Audited operations stream">
            <ul className="space-y-3 text-xs" aria-label="Recent administrative operations">
              <li className="flex items-start gap-2.5">
                <span className="w-2 h-2 rounded-full bg-status-success mt-1.5 shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-foreground">Exam EXAM-2026-AAA published</p>
                  <span className="text-foreground-muted">Today at 16:45 IST by Dr. Aris Thorne</span>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-foreground">Added speech ClearSpeak to Question QA-MATH-01</p>
                  <span className="text-foreground-muted">Elena Rostova • Version bumped to v2</span>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-2 h-2 rounded-full bg-secondary mt-1.5 shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-foreground">Assigned Cohort: PwD Scholarship Applicants</p>
                  <span className="text-foreground-muted">350 candidates with 100% assistive accommodations</span>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-2 h-2 rounded-full bg-status-warning mt-1.5 shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-foreground">Evaluated subjective response (Ananya V.)</p>
                  <span className="text-foreground-muted">Awarded 4.5/5.0 with rubric rationale</span>
                </div>
              </li>
            </ul>
          </Card>

          <Card title="Examiner Accessibility Notice" subtitle="GoWow Core Differentiator">
            <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/20 text-xs text-foreground space-y-2">
              <p className="font-bold flex items-center gap-1.5 text-primary">
                <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                Accessible Authoring Philosophy
              </p>
              <p className="text-foreground-muted leading-relaxed">
                Before publishing any examination, always ask: <em>"Can a visually impaired candidate independently navigate, read formulas, and comprehend tabular figures in this test?"</em>
              </p>
              <Link
                to="/examiner/question-bank"
                className="text-primary font-bold hover:underline inline-flex items-center gap-1"
              >
                Inspect question bank health →
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
