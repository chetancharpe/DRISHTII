import React, { useState } from 'react';
import { useNavigate, useSearchParams, useParams, Link } from 'react-router-dom';
import { practiceService } from '../../../services/practiceService';
import { PracticeFilterCard } from '../../../components/practice/PracticeFilterCard';
import { PracticeSessionFilter } from '../../../types/practice';
import { Target, History, BookOpen, Sparkles } from 'lucide-react';

export const PracticeHomePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { subjectId: routeSubjectId } = useParams<{ subjectId?: string }>();

  const initialSubject = routeSubjectId || searchParams.get('subject') || 'mathematics';
  const initialTopic = searchParams.get('topic') || 'percentages';

  const [isStarting, setIsStarting] = useState(false);

  const handleStartPractice = async (filter: PracticeSessionFilter) => {
    try {
      setIsStarting(true);
      const session = await practiceService.startPracticeSession(filter);
      navigate(`/candidate/practice/session/${session.id}`);
    } catch (err) {
      console.error('Failed to start practice session', err);
      setIsStarting(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-1">
            <Target className="w-4 h-4" aria-hidden="true" />
            <span>Interactive Practice Mode</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Practice
          </h1>
          <p className="text-sm text-foreground-secondary mt-1">
            Practice questions by examination, subject, topic, and difficulty with immediate step-by-step explanatory feedback.
          </p>
        </div>

        <Link
          to="/candidate/practice/history"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-surface border border-border hover:bg-surface-elevated text-xs font-semibold text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[44px] transition-colors self-start sm:self-auto"
        >
          <History className="w-4 h-4 text-foreground-muted" aria-hidden="true" />
          <span>Practice History</span>
        </Link>
      </header>

      {/* Primary Filter & Start Component */}
      <PracticeFilterCard
        initialSubjectId={initialSubject}
        initialTopicId={initialTopic}
        onStartPractice={handleStartPractice}
        isLoading={isStarting}
      />

      {/* Quick Start Practice Topics */}
      <section aria-labelledby="featured-topics-heading" className="flex flex-col gap-4">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <Sparkles className="w-4 h-4 text-primary" aria-hidden="true" />
          <h2 id="featured-topics-heading" className="text-sm font-bold uppercase tracking-wider text-foreground">
            Featured Practice Sets
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1 */}
          <div className="p-4 rounded-xl border border-border bg-surface hover:border-primary/40 flex flex-col justify-between gap-3 transition-colors">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                Mathematics
              </span>
              <h3 className="text-sm font-bold text-foreground mt-0.5">
                Percentages & Fractions
              </h3>
              <p className="text-xs text-foreground-secondary mt-1">
                10 questions on conversion, percentage changes, and ratio word problems.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                handleStartPractice({
                  examId: 'cds',
                  subjectId: 'mathematics',
                  topicId: 'percentages',
                  difficulty: 'easy',
                  questionCount: 5,
                })
              }
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-surface-elevated hover:bg-primary hover:text-primary-contrast text-foreground font-bold text-xs border border-border min-h-[38px] transition-colors"
            >
              <span>Quick 5 Questions</span>
            </button>
          </div>

          {/* Card 2 */}
          <div className="p-4 rounded-xl border border-border bg-surface hover:border-primary/40 flex flex-col justify-between gap-3 transition-colors">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                Reasoning Ability
              </span>
              <h3 className="text-sm font-bold text-foreground mt-0.5">
                Coding & Decoding
              </h3>
              <p className="text-xs text-foreground-secondary mt-1">
                Alphabetical shift patterns, opposite pairs, and numerical substitutions.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                handleStartPractice({
                  examId: 'cds',
                  subjectId: 'reasoning',
                  topicId: 'coding-decoding',
                  difficulty: 'medium',
                  questionCount: 5,
                })
              }
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-surface-elevated hover:bg-primary hover:text-primary-contrast text-foreground font-bold text-xs border border-border min-h-[38px] transition-colors"
            >
              <span>Quick 5 Questions</span>
            </button>
          </div>

          {/* Card 3 */}
          <div className="p-4 rounded-xl border border-border bg-surface hover:border-primary/40 flex flex-col justify-between gap-3 transition-colors">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                General Knowledge
              </span>
              <h3 className="text-sm font-bold text-foreground mt-0.5">
                Current Affairs & Defence
              </h3>
              <p className="text-xs text-foreground-secondary mt-1">
                Joint military exercises, national awards, and multilateral summits.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                handleStartPractice({
                  examId: 'cds',
                  subjectId: 'general-knowledge',
                  topicId: 'current-affairs',
                  difficulty: 'medium',
                  questionCount: 5,
                })
              }
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-surface-elevated hover:bg-primary hover:text-primary-contrast text-foreground font-bold text-xs border border-border min-h-[38px] transition-colors"
            >
              <span>Quick 5 Questions</span>
            </button>
          </div>
        </div>
      </section>

      {/* Distinction Reminder: Practice vs Exam */}
      <section
        aria-labelledby="practice-mode-guide"
        className="p-5 rounded-xl border border-border bg-surface-elevated/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary" aria-hidden="true">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 id="practice-mode-guide" className="font-bold text-foreground">
              Practice Mode vs Live Competitive Examination
            </h2>
            <p className="text-foreground-secondary mt-0.5">
              Practice sessions allow immediate feedback, step-by-step explanations, and session pausing. Live examinations follow formal timed regulations without hints.
            </p>
          </div>
        </div>

        <Link
          to="/candidate/learn"
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface border border-border text-foreground font-semibold hover:bg-surface-elevated min-h-[36px] whitespace-nowrap transition-colors"
        >
          <span>Browse Learning Notes</span>
        </Link>
      </section>
    </div>
  );
};
