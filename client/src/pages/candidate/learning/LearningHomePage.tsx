import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LearningSubject, LearningTopic } from '../../../types/learning';
import { learningService } from '../../../services/learningService';
import { SubjectCard } from '../../../components/learning/SubjectCard';
import { TopicListItem } from '../../../components/learning/TopicListItem';
import { LearningBreadcrumbs } from '../../../components/learning/LearningBreadcrumbs';
import { BookOpen, Sparkles, Clock, Target, Loader2, Award } from 'lucide-react';

export const LearningHomePage: React.FC = () => {
  const [subjects, setSubjects] = useState<LearningSubject[]>([]);
  const [recommendedTopics, setRecommendedTopics] = useState<LearningTopic[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<LearningTopic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const [subs, recs, recents] = await Promise.all([
          learningService.getSubjects(),
          learningService.getRecommendedTopics(),
          learningService.getRecentlyViewedTopics(),
        ]);
        setSubjects(subs);
        setRecommendedTopics(recs);
        setRecentlyViewed(recents);
      } catch (err) {
        setError('Unable to load learning curriculum. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 gap-3" role="status">
        <Loader2 className="w-8 h-8 animate-spin text-primary" aria-hidden="true" />
        <p className="text-xs font-semibold text-foreground-secondary">
          Loading learning modules...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-xl border border-amber-500/30 bg-amber-500/10 text-center flex flex-col items-center gap-3">
        <p className="text-sm font-bold text-foreground">{error}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-lg bg-primary text-primary-contrast text-xs font-bold"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto">
      {/* Breadcrumbs */}
      <LearningBreadcrumbs items={[{ label: 'Learn', isCurrent: true }]} />

      {/* Main Page Title & Intro */}
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
          <BookOpen className="w-4 h-4" aria-hidden="true" />
          <span>CDS Examination Preparation</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          Learn
        </h1>
        <p className="text-sm text-foreground-secondary leading-relaxed max-w-3xl">
          Build your preparation step by step with accessible learning content. Master core subjects, listen to audio walkthroughs, and practice topic-by-topic.
        </p>
      </header>

      {/* Overall Learning Progress Banner */}
      <section
        aria-labelledby="overall-learning-progress"
        className="p-5 sm:p-6 rounded-2xl border border-primary/20 bg-primary/5 flex flex-col md:flex-row md:items-center justify-between gap-5"
      >
        <div className="flex items-start gap-3.5">
          <div className="p-3 rounded-xl bg-primary/10 text-primary flex-shrink-0" aria-hidden="true">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h2 id="overall-learning-progress" className="text-sm font-bold text-foreground">
              Overall Syllabus Coverage
            </h2>
            <p className="text-xs text-foreground-secondary mt-0.5">
              You have completed 7 of 12 foundational topics across 4 subjects.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex flex-col gap-1 w-full md:w-44">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-foreground-secondary">Completed</span>
              <span className="text-primary font-bold">58%</span>
            </div>
            <div
              role="progressbar"
              aria-valuenow={58}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuetext="Overall syllabus progress: 58 percent"
              className="w-full h-2 rounded-full bg-surface-elevated overflow-hidden border border-border"
            >
              <div className="h-full bg-primary rounded-full" style={{ width: '58%' }} />
            </div>
          </div>

          <Link
            to="/candidate/practice"
            className="hidden sm:inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-surface border border-border text-foreground hover:bg-surface-elevated text-xs font-bold min-h-[40px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary whitespace-nowrap transition-colors"
          >
            <Target className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
            <span>Go to Practice</span>
          </Link>
        </div>
      </section>

      {/* Subjects Grid */}
      <section aria-labelledby="subjects-heading" className="flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h2 id="subjects-heading" className="text-lg font-bold text-foreground">
              Preparation Subjects
            </h2>
            <p className="text-xs text-foreground-secondary">
              Select a subject to explore syllabus topics and structured lessons.
            </p>
          </div>
          <span className="text-xs font-semibold text-foreground px-2.5 py-1 rounded bg-surface border border-border">
            {subjects.length} Subjects
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {subjects.map((sub) => (
            <SubjectCard key={sub.id} subject={sub} />
          ))}
        </div>
      </section>

      {/* Recommended Topics */}
      {recommendedTopics.length > 0 && (
        <section aria-labelledby="recommended-topics-heading" className="flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Sparkles className="w-4 h-4 text-primary" aria-hidden="true" />
            <div>
              <h2 id="recommended-topics-heading" className="text-base font-bold text-foreground">
                Recommended For You
              </h2>
              <p className="text-xs text-foreground-secondary">
                Key foundational areas recommended based on your recent activity
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {recommendedTopics.map((top) => (
              <TopicListItem key={top.id} topic={top} subjectId={top.subjectId} />
            ))}
          </div>
        </section>
      )}

      {/* Recently Viewed Topics */}
      {recentlyViewed.length > 0 && (
        <section aria-labelledby="recently-viewed-heading" className="flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Clock className="w-4 h-4 text-foreground-muted" aria-hidden="true" />
            <div>
              <h2 id="recently-viewed-heading" className="text-base font-bold text-foreground">
                Recently Viewed Topics
              </h2>
              <p className="text-xs text-foreground-secondary">
                Pick up right where you left off
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {recentlyViewed.map((top) => (
              <TopicListItem key={top.id} topic={top} subjectId={top.subjectId} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
