import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MockTest, MockTestSession } from '../../../types/mockTest';
import { mockTestService } from '../../../services/mockTestService';
import { MockTestCard } from '../../../components/mockTest/MockTestCard';
import { MockTestDiscardModal } from '../../../components/mockTest/MockTestDiscardModal';
import {
  ShieldAlert,
  Sparkles,
  History,
  Play,
  Trash2,
  Clock,
  Loader2,
} from 'lucide-react';

export const MockTestsPage: React.FC = () => {
  const [tests, setTests] = useState<MockTest[]>([]);
  const [activeSession, setActiveSession] = useState<MockTestSession | null>(null);
  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Filters state
  const [selectedExam, setSelectedExam] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const [testList, session] = await Promise.all([
          mockTestService.getMockTests(),
          mockTestService.getActiveSession(),
        ]);
        setTests(testList);
        setActiveSession(session);
      } catch (err) {
        console.error('Failed to load mock tests', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleDiscardAttempt = async () => {
    if (!activeSession) return;
    await mockTestService.discardMockSession(activeSession.sessionId);
    setActiveSession(null);
    setIsDiscardModalOpen(false);
  };

  const filteredTests = tests.filter((t) => {
    if (selectedExam !== 'all' && t.examCode !== selectedExam) return false;
    if (selectedDifficulty !== 'all' && t.difficulty !== selectedDifficulty) return false;
    if (selectedStatus !== 'all' && t.status !== selectedStatus) return false;
    return true;
  });

  const recommendedTests = filteredTests.filter((t) => t.isRecommended);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 gap-3" role="status">
        <Loader2 className="w-8 h-8 animate-spin text-primary" aria-hidden="true" />
        <p className="text-xs font-semibold text-foreground-secondary">
          Loading mock examinations catalog...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto">
      {/* Top Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-1">
            <ShieldAlert className="w-4 h-4" aria-hidden="true" />
            <span>Examination Simulation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Mock Tests
          </h1>
          <p className="text-sm text-foreground-secondary mt-1">
            Practice under realistic examination conditions and understand your performance across timed sections.
          </p>
        </div>

        <Link
          to="/candidate/mock-tests/history"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-surface border border-border hover:bg-surface-elevated text-xs font-semibold text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[44px] transition-colors self-start sm:self-auto"
        >
          <History className="w-4 h-4 text-foreground-muted" aria-hidden="true" />
          <span>Attempt History</span>
        </Link>
      </header>

      {/* In-Progress Session Resume Banner (Requirement #46) */}
      {activeSession && activeSession.status === 'in_progress' && (
        <section
          aria-labelledby="in-progress-heading"
          className="p-5 sm:p-6 rounded-2xl border border-primary/40 bg-primary/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in"
        >
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-primary text-primary-contrast flex-shrink-0" aria-hidden="true">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                Unfinished Attempt In Progress
              </span>
              <h2 id="in-progress-heading" className="text-base font-bold text-foreground mt-0.5">
                {activeSession.testTitle}
              </h2>
              <p className="text-xs text-foreground-secondary mt-1">
                You have an active session preserved in browser memory. Timer was paused.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsDiscardModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface border border-border text-foreground-secondary hover:text-foreground text-xs font-semibold min-h-[40px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 text-error" aria-hidden="true" />
              <span>Discard Attempt</span>
            </button>

            <Link
              to={`/candidate/mock-tests/${activeSession.testId}/session`}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-primary hover:bg-primary-hover text-primary-contrast font-bold text-xs min-h-[40px] shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
              <span>Resume Test</span>
            </Link>
          </div>
        </section>
      )}

      {/* Accessible Filters Bar */}
      <section aria-labelledby="filters-heading" className="p-4 rounded-xl border border-border bg-surface">
        <h2 id="filters-heading" className="sr-only">
          Filter available mock tests
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Exam Filter */}
          <div className="flex flex-col gap-1">
            <label htmlFor="filter-exam" className="text-[11px] font-bold text-foreground">
              Examination
            </label>
            <select
              id="filter-exam"
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="px-3 py-2 rounded-lg bg-surface-elevated border border-border text-xs text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[40px]"
            >
              <option value="all">All Examinations</option>
              <option value="UPSC-CDS">CDS (Combined Defence Services)</option>
              <option value="GMA">General Mental Ability</option>
            </select>
          </div>

          {/* Difficulty Filter */}
          <div className="flex flex-col gap-1">
            <label htmlFor="filter-diff" className="text-[11px] font-bold text-foreground">
              Difficulty
            </label>
            <select
              id="filter-diff"
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="px-3 py-2 rounded-lg bg-surface-elevated border border-border text-xs text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[40px]"
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex flex-col gap-1">
            <label htmlFor="filter-status" className="text-[11px] font-bold text-foreground">
              Status
            </label>
            <select
              id="filter-status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 rounded-lg bg-surface-elevated border border-border text-xs text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[40px]"
            >
              <option value="all">All Statuses</option>
              <option value="not_started">Not Started</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </section>

      {/* Recommended Mocks */}
      {recommendedTests.length > 0 && (
        <section aria-labelledby="rec-mocks-heading" className="flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Sparkles className="w-4 h-4 text-primary" aria-hidden="true" />
            <div>
              <h2 id="rec-mocks-heading" className="text-base font-bold text-foreground">
                Recommended For Your Preparation
              </h2>
              <p className="text-xs text-foreground-secondary">
                Full-length examinations matching your active syllabus coverage
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {recommendedTests.map((t) => (
              <MockTestCard key={t.id} test={t} />
            ))}
          </div>
        </section>
      )}

      {/* All Available Tests */}
      <section aria-labelledby="all-tests-heading" className="flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h2 id="all-tests-heading" className="text-base font-bold text-foreground">
              All Practice Mock Examinations
            </h2>
            <p className="text-xs text-foreground-secondary">
              Select any mock test to inspect instructions, section distributions, and start your attempt.
            </p>
          </div>
          <span className="text-xs font-semibold text-foreground px-2 py-0.5 rounded bg-surface border border-border">
            {filteredTests.length} Tests
          </span>
        </div>

        {filteredTests.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTests.map((t) => (
              <MockTestCard key={t.id} test={t} />
            ))}
          </div>
        ) : (
          <div className="p-10 rounded-2xl border border-dashed border-border bg-surface text-center flex flex-col items-center gap-3">
            <p className="text-sm font-bold text-foreground">No mock tests found matching your filters.</p>
            <button
              type="button"
              onClick={() => {
                setSelectedExam('all');
                setSelectedDifficulty('all');
                setSelectedStatus('all');
              }}
              className="px-4 py-2 rounded-lg bg-surface border border-border text-xs font-semibold text-primary hover:underline"
            >
              Reset Filters
            </button>
          </div>
        )}
      </section>

      {/* Discard Confirmation Modal */}
      {activeSession && (
        <MockTestDiscardModal
          isOpen={isDiscardModalOpen}
          testTitle={activeSession.testTitle}
          onCancel={() => setIsDiscardModalOpen(false)}
          onConfirmDiscard={handleDiscardAttempt}
        />
      )}
    </div>
  );
};
