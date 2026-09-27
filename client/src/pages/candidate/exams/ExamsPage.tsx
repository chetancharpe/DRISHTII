import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Exam } from '../../../types/exam';
import { examService } from '../../../services/examService';
import { ExamCard } from '../../../components/exam/ExamCard';
import {
  Search,
  Play,
  Clock,
  Loader2,
  Calendar,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const ExamsPage: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'available' | 'scheduled' | 'in_progress' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadExams() {
      try {
        setIsLoading(true);
        const data = await examService.getExams();
        setExams(data);
      } catch (e) {
        console.error('Failed to load examinations', e);
      } finally {
        setIsLoading(false);
      }
    }
    loadExams();
  }, []);

  const inProgressExam = exams.find((e) => e.status === 'in_progress');

  const filteredExams = exams.filter((exam) => {
    const matchesSearch =
      exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.examCode.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === 'available') return exam.status === 'available';
    if (activeTab === 'scheduled') return exam.status === 'scheduled';
    if (activeTab === 'in_progress') return exam.status === 'in_progress';
    if (activeTab === 'completed') return exam.status === 'completed' || exam.status === 'submitted';

    return true;
  });

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded border border-primary/20">
            Candidate Assessment Portal
          </span>
          <span className="text-xs text-foreground-secondary">
            Demo Authority Integration
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          Examinations
        </h1>
        <p className="text-sm text-foreground-secondary max-w-2xl leading-relaxed">
          View examinations assigned or available to you. Prepare your accessibility preferences before launching any scheduled assessment.
        </p>
      </header>

      {/* In-Progress Active Session Banner (Section 40) */}
      {inProgressExam && (
        <div
          role="region"
          aria-labelledby="in-progress-heading"
          className="p-5 rounded-2xl border border-warning/40 bg-warning/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-warning/20 text-warning border border-warning/30 flex-shrink-0 mt-0.5">
              <Clock className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-warning/20 text-warning px-2 py-0.5 rounded border border-warning/40">
                  In Progress
                </span>
                <span className="text-xs text-foreground-secondary font-mono">
                  {inProgressExam.examCode}
                </span>
              </div>
              <h2 id="in-progress-heading" className="text-sm sm:text-base font-extrabold text-foreground mt-1">
                {inProgressExam.title}
              </h2>
              <p className="text-xs text-foreground-secondary mt-0.5">
                Your examination session is currently active. Click below to return to your questions.
              </p>
            </div>
          </div>

          <Link
            to={`/candidate/exams/${inProgressExam.id}/session`}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-warning hover:bg-warning-hover active:bg-warning-hover text-warning-contrast font-bold text-xs min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-warning shadow-xs transition-colors self-start sm:self-center"
          >
            <Play className="w-4 h-4" aria-hidden="true" />
            <span>Resume Examination</span>
          </Link>
        </div>
      )}

      {/* Tabs & Search Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-3">
        {/* Status Category Tabs */}
        <div
          role="tablist"
          aria-label="Filter examinations by status"
          className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none"
        >
          {[
            { id: 'all', label: 'All Exams', count: exams.length },
            { id: 'available', label: 'Available', count: exams.filter((e) => e.status === 'available').length },
            { id: 'scheduled', label: 'Upcoming', count: exams.filter((e) => e.status === 'scheduled').length },
            { id: 'in_progress', label: 'In Progress', count: exams.filter((e) => e.status === 'in_progress').length },
            { id: 'completed', label: 'Completed', count: exams.filter((e) => e.status === 'completed' || e.status === 'submitted').length },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[38px] flex items-center gap-1.5 whitespace-nowrap ${
                  isActive
                    ? 'bg-primary text-primary-contrast shadow-xs'
                    : 'bg-surface hover:bg-surface-elevated text-foreground-secondary border border-border'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isActive ? 'bg-black/20 text-white' : 'bg-surface-elevated text-foreground-secondary'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64 flex-shrink-0">
          <label htmlFor="search-exams-input" className="sr-only">
            Search examinations by name or code
          </label>
          <Search
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-foreground-secondary pointer-events-none"
            aria-hidden="true"
          />
          <input
            id="search-exams-input"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search exams..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface border border-border text-foreground placeholder:text-foreground-secondary text-xs focus:outline-none focus:ring-2 focus:ring-primary min-h-[38px]"
          />
        </div>
      </div>

      {/* Main Grid or Loading / Empty States */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-16 gap-3" role="status">
          <Loader2 className="w-8 h-8 animate-spin text-primary" aria-hidden="true" />
          <p className="text-xs font-semibold text-foreground-secondary">
            Loading examination registry...
          </p>
        </div>
      ) : filteredExams.length === 0 ? (
        <div
          role="status"
          className="p-12 rounded-2xl border border-dashed border-border bg-surface text-center flex flex-col items-center gap-3"
        >
          <div className="w-12 h-12 rounded-2xl bg-surface-elevated border border-border text-foreground-secondary flex items-center justify-center">
            {activeTab === 'scheduled' ? (
              <Calendar className="w-6 h-6" aria-hidden="true" />
            ) : activeTab === 'completed' ? (
              <CheckCircle2 className="w-6 h-6" aria-hidden="true" />
            ) : (
              <AlertCircle className="w-6 h-6" aria-hidden="true" />
            )}
          </div>
          <h3 className="text-sm font-bold text-foreground">
            {activeTab === 'scheduled'
              ? 'No upcoming examinations are scheduled.'
              : activeTab === 'completed'
              ? 'You have not completed an examination yet.'
              : activeTab === 'in_progress'
              ? 'You do not have an unfinished examination.'
              : 'No examinations are currently available.'}
          </h3>
          <p className="text-xs text-foreground-secondary max-w-sm">
            {searchQuery
              ? 'Try modifying your search query to locate other evaluations.'
              : 'Assigned examinations will appear here according to your examination authority schedule.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredExams.map((exam) => (
            <ExamCard key={exam.id} exam={exam} />
          ))}
        </div>
      )}

      {/* Prototype notice (Section 52, 58) */}
      <footer className="p-4 rounded-xl border border-border bg-surface-elevated/30 text-center text-xs text-foreground-secondary">
        <p>
          <strong className="text-foreground">Fictional Demonstration Disclaimer: </strong>
          All examination fixtures, authority names, and assessments on this prototype are demonstration models to evaluate accessibility workflows. Official examination security and authoritative timing will be enforced by the production backend.
        </p>
      </footer>
    </div>
  );
};
