import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import {
  Users,
  History,
  ArrowRight,
} from 'lucide-react';


export const AdminDashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState({
    totalUsers: 28540,
    candidates: 26800,
    examiners: 96,
    organizations: 3,
    activeExams: 3,
    scheduledExams: 7,
    completedExams: 24,
    systemAlerts: 1,
  });

  useEffect(() => {
    const load = async () => {
      const data = await adminService.getAdminMetrics();
      setMetrics(data);
    };
    load();
  }, []);

  return (
    <div className="flex flex-col gap-6" role="main" aria-label="Platform Governance and Administration">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-primary">
            Platform Governance
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Central Administrative Dashboard
          </h1>
          <p className="text-sm text-foreground-muted mt-1">
            Global role-based access control, organizational tenant management, and compliance auditing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/admin/audit-logs">
            <Button variant="secondary" className="flex items-center gap-2">
              <History className="w-4 h-4" aria-hidden="true" />
              Audit Logs
            </Button>
          </Link>
          <Link to="/admin/users">
            <Button variant="primary" className="flex items-center gap-2">
              <Users className="w-4 h-4" aria-hidden="true" />
              Manage Users
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <section aria-labelledby="admin-kpi-heading">
        <h2 id="admin-kpi-heading" className="sr-only">
          Platform-Wide Governance Metrics
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          <div className="p-3.5 rounded-xl border border-border bg-surface flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase text-foreground-muted">Total Users</span>
            <span className="text-xl sm:text-2xl font-black text-foreground mt-1">
              {metrics.totalUsers.toLocaleString()}
            </span>
            <span className="text-[10px] text-foreground-muted">Across platform</span>
          </div>

          <div className="p-3.5 rounded-xl border border-border bg-surface flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase text-secondary">Candidates</span>
            <span className="text-xl sm:text-2xl font-black text-foreground mt-1">
              {metrics.candidates.toLocaleString()}
            </span>
            <span className="text-[10px] text-foreground-muted">Enrolled learners</span>
          </div>

          <div className="p-3.5 rounded-xl border border-border bg-surface flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase text-primary">Examiners</span>
            <span className="text-xl sm:text-2xl font-black text-primary mt-1">
              {metrics.examiners}
            </span>
            <span className="text-[10px] text-foreground-muted">Authoring faculty</span>
          </div>

          <div className="p-3.5 rounded-xl border border-border bg-surface flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase text-foreground-muted">Organizations</span>
            <span className="text-xl sm:text-2xl font-black text-foreground mt-1">
              {metrics.organizations}
            </span>
            <span className="text-[10px] text-foreground-muted">Active tenants</span>
          </div>

          <div className="p-3.5 rounded-xl border border-border bg-surface flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase text-status-success">Active Exams</span>
            <span className="text-xl sm:text-2xl font-black text-status-success mt-1">
              {metrics.activeExams}
            </span>
            <span className="text-[10px] text-foreground-muted">Live right now</span>
          </div>

          <div className="p-3.5 rounded-xl border border-border bg-surface flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase text-primary">Scheduled</span>
            <span className="text-xl sm:text-2xl font-black text-foreground mt-1">
              {metrics.scheduledExams}
            </span>
            <span className="text-[10px] text-foreground-muted">Upcoming windows</span>
          </div>

          <div className="p-3.5 rounded-xl border border-border bg-surface flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase text-foreground-muted">Completed</span>
            <span className="text-xl sm:text-2xl font-black text-foreground mt-1">
              {metrics.completedExams}
            </span>
            <span className="text-[10px] text-foreground-muted">Concluded</span>
          </div>

          <div className="p-3.5 rounded-xl border border-border bg-surface flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase text-status-warning">Alerts</span>
            <span className="text-xl sm:text-2xl font-black text-status-warning mt-1">
              {metrics.systemAlerts}
            </span>
            <span className="text-[10px] text-foreground-muted">High priority</span>
          </div>
        </div>
      </section>

      {/* Main Governance Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Organizations Summary */}
        <div className="lg:col-span-2 space-y-6">
          <Card
            title="Institutional Tenant Governance"
            subtitle="Verified academic and governmental examination bodies"
          >
            <div className="divide-y divide-border text-xs">
              <div className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-bold text-foreground text-sm block">
                    National Assessment Council (NAC)
                  </span>
                  <span className="text-foreground-muted font-mono">domain: nac.gov.in • 48 Faculty</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-status-success/15 text-status-success font-bold">
                  Verified Tier-1
                </span>
              </div>

              <div className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-bold text-foreground text-sm block">
                    Digital Accessibility Institute (DAI)
                  </span>
                  <span className="text-foreground-muted font-mono">domain: accessibility.edu • 16 Faculty</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-status-success/15 text-status-success font-bold">
                  Verified Tier-1
                </span>
              </div>

              <div className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-bold text-foreground text-sm block">
                    Apex Civil Testing Services
                  </span>
                  <span className="text-foreground-muted font-mono">domain: apexcivil.org • 32 Faculty</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-status-success/15 text-status-success font-bold">
                  Verified Tier-1
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-border mt-3 flex justify-end">
              <Link to="/admin/organizations" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                Manage all organizations <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </Link>
            </div>
          </Card>

          {/* Quick RBAC Quick Guide */}
          <Card title="Role Separation Architecture" subtitle="Candidate vs Examiner vs Admin boundaries">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-surface-elevated border border-border space-y-1">
                <span className="font-bold text-foreground block">CANDIDATE</span>
                <p className="text-foreground-muted">
                  Takes exams, consumes learning modules, takes mock tests, reviews personal progress.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-surface-elevated border border-border space-y-1">
                <span className="font-bold text-primary block">EXAMINER</span>
                <p className="text-foreground-muted">
                  Authors questions, configures sections, schedules cohorts, monitors sessions, evaluates subjective items.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-surface-elevated border border-border space-y-1">
                <span className="font-bold text-secondary block">ADMINISTRATOR</span>
                <p className="text-foreground-muted">
                  Provisions tenants, manages user permissions, monitors audit logs, enforces security compliance.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Audit Log Quick Stream */}
        <div className="flex flex-col gap-6">
          <Card title="Security & Audit Stream" subtitle="Section 44 Administrative Events">
            <ul className="space-y-3 text-xs">
              <li className="p-2.5 rounded-lg bg-surface-elevated border border-border space-y-1">
                <div className="flex items-center justify-between text-[10px] text-foreground-muted">
                  <span className="font-mono text-primary font-bold">EXAM_PUBLISHED</span>
                  <span>Today 16:45 IST</span>
                </div>
                <p className="text-foreground font-semibold">Exam EXAM-2026-AAA published</p>
                <span className="text-foreground-muted block text-[10px]">Operator: Dr. Aris Thorne</span>
              </li>

              <li className="p-2.5 rounded-lg bg-surface-elevated border border-border space-y-1">
                <div className="flex items-center justify-between text-[10px] text-foreground-muted">
                  <span className="font-mono text-primary font-bold">QUESTION_VERSIONED</span>
                  <span>Today 16:30 IST</span>
                </div>
                <p className="text-foreground font-semibold">QA-MATH-01 incremented to v2</p>
                <span className="text-foreground-muted block text-[10px]">Added ClearSpeak transcript</span>
              </li>

              <li className="p-2.5 rounded-lg bg-surface-elevated border border-border space-y-1">
                <div className="flex items-center justify-between text-[10px] text-foreground-muted">
                  <span className="font-mono text-primary font-bold">ROLE_UPDATED</span>
                  <span>Sep 20 10:00 IST</span>
                </div>
                <p className="text-foreground font-semibold">Permissions modified for Kavita Menon</p>
                <span className="text-foreground-muted block text-[10px]">Operator: Administrator</span>
              </li>
            </ul>

            <div className="pt-3 border-t border-border mt-3">
              <Link to="/admin/audit-logs" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                View complete audit trail <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
