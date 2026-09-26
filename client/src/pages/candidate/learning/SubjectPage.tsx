import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { LearningSubject } from '../../../types/learning';
import { learningService } from '../../../services/learningService';
import { LearningBreadcrumbs } from '../../../components/learning/LearningBreadcrumbs';
import { TopicListItem } from '../../../components/learning/TopicListItem';
import { Target, Sparkles, CheckCircle2, ArrowLeft, Loader2, ArrowRight } from 'lucide-react';

export const SubjectPage: React.FC = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const [subject, setSubject] = useState<LearningSubject | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSubject() {
      if (!subjectId) return;
      try {
        setIsLoading(true);
        const data = await learningService.getSubject(subjectId);
        if (!data) {
          setError('Subject not found.');
        } else {
          setSubject(data);
        }
      } catch (err) {
        setError('Failed to load subject. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
    fetchSubject();
  }, [subjectId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 gap-3" role="status">
        <Loader2 className="w-8 h-8 animate-spin text-primary" aria-hidden="true" />
        <p className="text-xs font-semibold text-foreground-secondary">
          Loading subject topics...
        </p>
      </div>
    );
  }

  if (error || !subject) {
    return (
      <div className="p-8 rounded-xl border border-border bg-surface text-center flex flex-col items-center gap-4 max-w-md mx-auto">
        <p className="text-sm font-bold text-foreground">{error || 'Subject not found.'}</p>
        <Link
          to="/candidate/learn"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-contrast text-xs font-bold min-h-[40px]"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Back to All Subjects</span>
        </Link>
      </div>
    );
  }

  const recommendedTopic = subject.topics.find((t) => t.id === subject.recommendedTopicId);

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto">
      {/* Breadcrumbs */}
      <LearningBreadcrumbs
        items={[
          { label: 'Learn', path: '/candidate/learn' },
          { label: subject.name, isCurrent: true },
        ]}
      />

      {/* Subject Header */}
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
              {subject.code}
            </span>
            <span className="text-xs text-foreground-secondary">
              CDS Examination Syllabus
            </span>
          </div>

          <Link
            to={`/candidate/practice?subject=${subject.id}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-surface hover:bg-surface-elevated border border-border text-foreground text-xs font-semibold min-h-[40px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
          >
            <Target className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
            <span>Practice {subject.name} Questions</span>
          </Link>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          {subject.name}
        </h1>

        <p className="text-sm text-foreground-secondary leading-relaxed max-w-3xl">
          {subject.description}
        </p>

        {/* Progress Bar Card */}
        <div className="p-4 sm:p-5 rounded-xl border border-border bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary" aria-hidden="true">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">
                Progress: {subject.completedTopicsCount} of {subject.totalTopicsCount} topics completed
              </p>
              <p className="text-[11px] text-foreground-secondary">
                Continue with {recommendedTopic?.name || 'the next topic'} to complete your preparation.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-1 w-full sm:w-40">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-foreground-secondary">Completed</span>
              <span className="text-foreground font-bold">{subject.progressPercent}%</span>
            </div>
            <div
              role="progressbar"
              aria-valuenow={subject.progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuetext={`${subject.name} syllabus progress: ${subject.progressPercent} percent`}
              className="w-full h-2 rounded-full bg-surface-elevated overflow-hidden border border-border"
            >
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${subject.progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Recommended Topic Highlight */}
      {recommendedTopic && (
        <section
          aria-labelledby="recommended-topic-heading"
          className="p-5 sm:p-6 rounded-2xl border border-primary/30 bg-primary/5 flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary flex-shrink-0" aria-hidden="true">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                Recommended Topic to Continue
              </span>
              <h2 id="recommended-topic-heading" className="text-base font-bold text-foreground mt-0.5">
                {recommendedTopic.name}
              </h2>
              <p className="text-xs text-foreground-secondary mt-1 max-w-xl">
                {recommendedTopic.shortDescription}
              </p>
            </div>
          </div>

          <Link
            to={`/candidate/learn/${subject.id}/${recommendedTopic.id}`}
            className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg bg-primary hover:bg-primary-hover active:bg-primary-hover text-primary-contrast text-xs font-bold min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-sm whitespace-nowrap transition-colors flex-shrink-0"
          >
            <span>Learn Topic</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </section>
      )}

      {/* Topic List */}
      <section aria-labelledby="all-topics-heading" className="flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h2 id="all-topics-heading" className="text-lg font-bold text-foreground">
              All {subject.name} Topics
            </h2>
            <p className="text-xs text-foreground-secondary">
              Select any topic to begin reading concept notes and formulas.
            </p>
          </div>
          <span className="text-xs font-semibold text-foreground px-2 py-0.5 rounded bg-surface border border-border">
            {subject.topics.length} Topics
          </span>
        </div>

        <div className="flex flex-col gap-3">
          {subject.topics.map((t) => (
            <TopicListItem key={t.id} topic={t} subjectId={subject.id} />
          ))}
        </div>
      </section>
    </div>
  );
};
