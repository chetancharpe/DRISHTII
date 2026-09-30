import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MockTest, MockTestSession } from '../../../types/mockTest';
import { mockTestService, FALLBACK_MOCK_TESTS } from '../../../services/mockTestService';
import { MockTestCard } from '../../../components/mockTest/MockTestCard';
import { MockTestDiscardModal } from '../../../components/mockTest/MockTestDiscardModal';
import { useAccessibility } from '../../../contexts/AccessibilityContext';
import {
  ShieldAlert,
  Sparkles,
  History,
  Play,
  Trash2,
  Clock,
  Loader2,
  Volume2,
} from 'lucide-react';

export const MockTestsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const testQuery = searchParams.get('test')?.toLowerCase() || '';
  const { speak, announce } = useAccessibility();

  // Initialize immediately with rich fallback catalog so the page NEVER displays a blank screen
  const [tests, setTests] = useState<MockTest[]>(() => FALLBACK_MOCK_TESTS);
  const [activeSession, setActiveSession] = useState<MockTestSession | null>(null);
  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false);
  const [isLoading] = useState(false);

  // Spoken voice guidance for available mock test sections
  const handleReadAvailableMocks = React.useCallback(() => {
    const listSpeech =
      'Mock Tests Directory. 5 examinations are ready: ' +
      'Option 1: CDS Full Practice Examination 1. ' +
      'Option 2: Elementary Mathematics Mock Test. ' +
      'Option 3: English Language Mock Test. ' +
      'Option 4: General Knowledge and Defense Mock Test. ' +
      'Option 5: Reasoning Ability Mock Test. ' +
      'Option 6: Attempt History. ' +
      'Say Option 1 through 5, or say Math Mock, English Mock, GK Mock, or Reasoning Mock to start testing immediately.';
    speak(listSpeech);
    announce(listSpeech, 'polite');
  }, [speak, announce]);

  // Read out available tests on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      handleReadAvailableMocks();
    }, 600);
    return () => clearTimeout(timer);
  }, [handleReadAvailableMocks]);

  // Alt+R hotkey to re-read mock tests catalog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key.toLowerCase() === 'r' || e.key === 'R')) {
        e.preventDefault();
        handleReadAvailableMocks();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleReadAvailableMocks]);

  // Filters state
  const [selectedExam, setSelectedExam] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [testList, session] = await Promise.all([
          mockTestService.getMockTests(),
          mockTestService.getActiveSession(),
        ]);
        if (isMounted) {
          if (Array.isArray(testList) && testList.length > 0) {
            setTests(testList);
          }
          setActiveSession(session);
        }
      } catch (err) {
        console.warn('Background sync for mock tests encountered error:', err);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleDiscardAttempt = async () => {
    if (!activeSession) return;
    await mockTestService.discardMockSession(activeSession.sessionId);
    setActiveSession(null);
    setIsDiscardModalOpen(false);
  };

  const filteredTests = tests.filter((t) => {
    if (!t) return false;
    const testId = (t.id || '').toLowerCase();
    const testTitle = (t.title || '').toLowerCase();
    const testExamCode = (t.examCode || '').toLowerCase();
    const testExamName = (t.examName || '').toLowerCase();
    const testDesc = (t.description || '').toLowerCase();
    const testDifficulty = (t.difficulty || '').toLowerCase();
    const testStatus = t.status || 'not_started';

    if (testQuery) {
      const q = testQuery.toLowerCase().trim();
      const matchesId = testId.includes(q);
      const matchesTitle = testTitle.includes(q);
      const matchesExam = testExamCode.includes(q) || testExamName.includes(q);
      const matchesDesc = testDesc.includes(q);
      const matchesSec = (t.sections || []).some(
        (s) => (s?.name || '').toLowerCase().includes(q) || (s?.code || '').toLowerCase().includes(q)
      );
      if (!matchesId && !matchesTitle && !matchesExam && !matchesDesc && !matchesSec) {
        return false;
      }
    }

    if (selectedSubject !== 'all') {
      const subj = selectedSubject.toLowerCase();
      if (subj === 'math') {
        const isMath = testId.includes('math') || testTitle.includes('math') || testExamCode.includes('math');
        if (!isMath) return false;
      } else if (subj === 'english') {
        const isEng = testId.includes('eng') || testTitle.includes('english') || testExamCode.includes('eng');
        if (!isEng) return false;
      } else if (subj === 'gk') {
        const isGk = testId.includes('gk') || testTitle.includes('knowledge') || testExamCode.includes('gk');
        if (!isGk) return false;
      } else if (subj === 'reasoning') {
        const isReas = testId.includes('reas') || testTitle.includes('reasoning') || testExamCode.includes('reas');
        if (!isReas) return false;
      } else if (subj === 'full') {
        const isFull = testId.includes('full') || testTitle.includes('full');
        if (!isFull) return false;
      }
    }

    if (selectedExam !== 'all') {
      const isCds = selectedExam === 'UPSC-CDS' && (testExamCode.includes('cds') || testExamCode === 'upsc-cds');
      if (!isCds && (t.examCode || '') !== selectedExam) return false;
    }
    if (selectedDifficulty !== 'all' && testDifficulty !== selectedDifficulty.toLowerCase()) return false;
    if (selectedStatus !== 'all' && testStatus !== selectedStatus) return false;
    return true;
  });

  const recommendedTests = filteredTests.filter((t) => Boolean(t && t.isRecommended));

  if (isLoading && tests.length === 0) {
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

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleReadAvailableMocks}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-surface border border-border hover:bg-surface-elevated text-xs font-semibold text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[44px] transition-colors shadow-sm"
            aria-label="Listen to available mock examinations list (Alt+R)"
          >
            <Volume2 className="w-4 h-4 text-primary" aria-hidden="true" />
            <span>Listen to Mocks (Alt+R)</span>
          </button>

          <Link
            to="/candidate/mock-tests/history"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-surface border border-border hover:bg-surface-elevated text-xs font-semibold text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[44px] transition-colors"
          >
            <History className="w-4 h-4 text-foreground-muted" aria-hidden="true" />
            <span>Attempt History</span>
          </Link>
        </div>
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

        {/* Subject Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 mb-3 pb-3 border-b border-border">
          <span className="text-[11px] font-bold text-foreground-secondary mr-1">Subject:</span>
          {[
            { id: 'all', label: 'All Subjects' },
            { id: 'full', label: 'Full CDS Mocks' },
            { id: 'math', label: 'Mathematics' },
            { id: 'english', label: 'English Language' },
            { id: 'gk', label: 'General Knowledge' },
            { id: 'reasoning', label: 'Reasoning Ability' },
          ].map((subj) => (
            <button
              key={subj.id}
              type="button"
              onClick={() => setSelectedSubject(subj.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors min-h-[36px] ${
                selectedSubject === subj.id
                  ? 'bg-primary text-primary-contrast'
                  : 'bg-surface-elevated text-foreground hover:bg-surface border border-border'
              }`}
            >
              {subj.label}
            </button>
          ))}
        </div>

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
