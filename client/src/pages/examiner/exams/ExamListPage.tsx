import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExaminerExam, ExamLifecycleStatus } from '../../../types/examiner';
import { examinerService } from '../../../services/examinerService';
import { Button } from '../../../components/common/Button';
import {
  PlusCircle,
  Search,
  Filter,
  Eye,
  Activity,
  BarChart3,
  Calendar,
  Layers,
  FileQuestion,
  Users,
} from 'lucide-react';


export const ExamListPage: React.FC = () => {
  const [exams, setExams] = useState<ExaminerExam[]>([]);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const data = await examinerService.getExams();
        setExams(data);
      } catch (err) {
        console.error('Failed to load examinations', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchExams();
  }, []);

  const filteredExams = exams.filter((exam) => {
    const matchesSearch =
      exam.title.toLowerCase().includes(search.toLowerCase()) ||
      exam.code.toLowerCase().includes(search.toLowerCase()) ||
      exam.organization.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || exam.lifecycleStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: ExamLifecycleStatus) => {
    switch (status) {
      case 'LIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-status-success/15 text-status-success border border-status-success/30">
            <span className="w-1.5 h-1.5 rounded-full bg-status-success animate-ping" />
            Live
          </span>
        );
      case 'SCHEDULED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-primary/15 text-primary border border-primary/30">
            Scheduled
          </span>
        );
      case 'DRAFT':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-status-warning/15 text-status-warning border border-status-warning/30">
            Draft
          </span>
        );
      case 'PAUSED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-status-error/15 text-status-error border border-status-error/30">
            Paused
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-surface-elevated text-foreground-muted border border-border">
            Completed
          </span>
        );
      case 'ARCHIVED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-surface text-foreground-muted border border-border">
            Archived
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="flex flex-col gap-6" role="main" aria-label="Examinations Directory">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-primary">
            Assessment Management
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Examinations Directory</h1>
          <p className="text-sm text-foreground-muted mt-1">
            Author, structure sections, schedule candidate windows, and evaluate assessment outcomes.
          </p>
        </div>

        <Link to="/examiner/exams/create">
          <Button variant="primary" className="flex items-center gap-2">
            <PlusCircle className="w-4 h-4" aria-hidden="true" />
            Create Examination
          </Button>
        </Link>
      </div>

      {/* Search & Filter Controls */}
      <div className="p-4 rounded-xl border border-border bg-surface flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by exam title, code, or organization..."
            aria-label="Search examinations by title, code, or organization"
            className="w-full pl-9 pr-4 py-2 text-sm bg-surface-elevated border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-foreground-muted shrink-0" aria-hidden="true" />
          <label htmlFor="status-filter-select" className="sr-only">
            Filter examinations by lifecycle status
          </label>
          <select
            id="status-filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-surface-elevated border border-border rounded-lg text-foreground font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Statuses ({exams.length})</option>
            <option value="LIVE">Live Now</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="DRAFT">Draft</option>
            <option value="PAUSED">Paused</option>
            <option value="COMPLETED">Completed</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>

      {/* Examinations Table */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" aria-label="Examinations list">
            <thead className="bg-surface-elevated border-b border-border text-xs uppercase text-foreground-muted font-bold font-mono">
              <tr>
                <th scope="col" className="p-4">Exam Name & Code</th>
                <th scope="col" className="p-4">Status</th>
                <th scope="col" className="p-4">Schedule Window</th>
                <th scope="col" className="p-4 text-center">Candidates</th>
                <th scope="col" className="p-4 text-center">Questions</th>
                <th scope="col" className="p-4 text-center">Duration</th>
                <th scope="col" className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-foreground-muted">
                    Loading examination records...
                  </td>
                </tr>
              ) : filteredExams.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-foreground-muted">
                    <p className="font-bold text-foreground">No examinations found.</p>
                    <p className="text-xs mt-1">Try adjusting your search criteria or create a new examination.</p>
                  </td>
                </tr>
              ) : (
                filteredExams.map((exam) => (
                  <tr key={exam.id} className="hover:bg-surface-elevated/50 transition-colors">
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-mono text-xs font-bold text-primary">{exam.code}</span>
                        <Link
                          to={`/examiner/exams/${exam.id}`}
                          className="font-bold text-foreground hover:text-primary transition-colors text-base"
                        >
                          {exam.title}
                        </Link>
                        <span className="text-xs text-foreground-muted">{exam.organization}</span>
                      </div>
                    </td>
                    <td className="p-4">{getStatusBadge(exam.lifecycleStatus)}</td>
                    <td className="p-4 text-xs">
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">
                          {exam.schedule.startDate} • {exam.schedule.startTime}
                        </span>
                        <span className="text-foreground-muted font-mono">{exam.schedule.timezone}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center font-bold text-foreground">
                      {exam.candidatesCount.toLocaleString()}
                    </td>
                    <td className="p-4 text-center font-bold text-foreground">{exam.totalQuestions}</td>
                    <td className="p-4 text-center font-bold text-foreground">
                      {exam.rules.durationMinutes} mins
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        <Link to={`/examiner/exams/${exam.id}/preview`} title="Preview as Candidate">
                          <Button variant="ghost" size="sm" aria-label={`Preview ${exam.title}`}>
                            <Eye className="w-4 h-4 text-foreground-muted hover:text-foreground" aria-hidden="true" />
                          </Button>
                        </Link>
                        <Link to={`/examiner/exams/${exam.id}/sections`} title="Manage Sections">
                          <Button variant="ghost" size="sm" aria-label={`Sections for ${exam.title}`}>
                            <Layers className="w-4 h-4 text-foreground-muted hover:text-foreground" aria-hidden="true" />
                          </Button>
                        </Link>
                        <Link to={`/examiner/exams/${exam.id}/questions`} title="Question Builder">
                          <Button variant="ghost" size="sm" aria-label={`Questions for ${exam.title}`}>
                            <FileQuestion className="w-4 h-4 text-foreground-muted hover:text-foreground" aria-hidden="true" />
                          </Button>
                        </Link>
                        <Link to={`/examiner/exams/${exam.id}/candidates`} title="Manage Candidates">
                          <Button variant="ghost" size="sm" aria-label={`Candidates for ${exam.title}`}>
                            <Users className="w-4 h-4 text-foreground-muted hover:text-foreground" aria-hidden="true" />
                          </Button>
                        </Link>
                        <Link to={`/examiner/exams/${exam.id}/schedule`} title="Schedule Window">
                          <Button variant="ghost" size="sm" aria-label={`Schedule for ${exam.title}`}>
                            <Calendar className="w-4 h-4 text-foreground-muted hover:text-foreground" aria-hidden="true" />
                          </Button>
                        </Link>

                        {exam.lifecycleStatus === 'LIVE' && (
                          <Link to={`/examiner/exams/${exam.id}/monitor`}>
                            <Button variant="primary" size="sm" className="flex items-center gap-1 font-bold">
                              <Activity className="w-3.5 h-3.5" aria-hidden="true" />
                              Monitor
                            </Button>
                          </Link>
                        )}

                        {exam.lifecycleStatus === 'COMPLETED' && (
                          <Link to={`/examiner/exams/${exam.id}/results`}>
                            <Button variant="secondary" size="sm" className="flex items-center gap-1 font-bold">
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
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
