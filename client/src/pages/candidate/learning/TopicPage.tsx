import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { LearningSubject, LearningTopic } from '../../../types/learning';
import { learningService } from '../../../services/learningService';
import { LearningBreadcrumbs } from '../../../components/learning/LearningBreadcrumbs';
import { FormulaBlock } from '../../../components/learning/FormulaBlock';
import { ExampleBlock } from '../../../components/learning/ExampleBlock';
import { AudioLearningPlayer } from '../../../components/learning/AudioLearningPlayer';
import { TopicNavigationFooter } from '../../../components/learning/TopicNavigationFooter';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowLeft,
  ListChecks,
  Loader2,
} from 'lucide-react';

export const TopicPage: React.FC = () => {
  const { subjectId, topicId } = useParams<{ subjectId: string; topicId: string }>();
  const [subject, setSubject] = useState<LearningSubject | null>(null);
  const [topic, setTopic] = useState<LearningTopic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTopicData() {
      if (!subjectId || !topicId) return;
      try {
        setIsLoading(true);
        const [sub, top] = await Promise.all([
          learningService.getSubject(subjectId),
          learningService.getTopic(subjectId, topicId),
        ]);

        if (!sub || !top) {
          setError('Topic or subject could not be located.');
        } else {
          setSubject(sub);
          setTopic(top);
        }
      } catch (err) {
        setError('Error loading topic content. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
    loadTopicData();
  }, [subjectId, topicId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 gap-3" role="status">
        <Loader2 className="w-8 h-8 animate-spin text-primary" aria-hidden="true" />
        <p className="text-xs font-semibold text-foreground-secondary">
          Loading learning material...
        </p>
      </div>
    );
  }

  if (error || !subject || !topic) {
    return (
      <div className="p-8 rounded-xl border border-border bg-surface text-center flex flex-col items-center gap-4 max-w-md mx-auto">
        <p className="text-sm font-bold text-foreground">{error || 'Topic not found.'}</p>
        <Link
          to={`/candidate/learn/${subjectId || ''}`}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-contrast text-xs font-bold min-h-[40px]"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Back to Subject Topics</span>
        </Link>
      </div>
    );
  }

  // Find previous and next topics for non-linear navigation
  const currentIndex = subject.topics.findIndex((t) => t.id === topic.id);
  const previousTopic = currentIndex > 0 ? subject.topics[currentIndex - 1] : null;
  const nextTopic = currentIndex < subject.topics.length - 1 ? subject.topics[currentIndex + 1] : null;

  // Prepare full speech transcript
  const narrativeText =
    topic.audioNarrative ||
    `${topic.name}. ${topic.overview}. ${topic.sections.map((s) => `${s.title}. ${s.paragraphs.join(' ')}`).join(' ')}`;

  return (
    <article className="flex flex-col gap-8 max-w-4xl mx-auto">
      {/* Breadcrumbs */}
      <LearningBreadcrumbs
        items={[
          { label: 'Learn', path: '/candidate/learn' },
          { label: subject.name, path: `/candidate/learn/${subject.id}` },
          { label: topic.name, isCurrent: true },
        ]}
      />

      {/* Topic Header */}
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Link
            to={`/candidate/learn/${subject.id}`}
            className="font-bold text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded p-0.5"
          >
            {subject.name}
          </Link>
          <span className="text-foreground-muted" aria-hidden="true">•</span>
          <span className="text-foreground-secondary inline-flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Est. {topic.estimatedMinutes} minutes</span>
          </span>
          <span className="text-foreground-muted" aria-hidden="true">•</span>
          <span className="text-foreground-secondary">
            {topic.completedLessons} of {topic.totalLessons} lessons completed
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          {topic.name}
        </h1>

        <p className="text-sm text-foreground-secondary leading-relaxed">
          {topic.overview}
        </p>

        {/* Audio Narration Bar */}
        <AudioLearningPlayer textToRead={narrativeText} sectionTitle={topic.name} />
      </header>

      {/* Learning Objectives */}
      {topic.learningObjectives.length > 0 && (
        <section
          aria-labelledby="learning-objectives-heading"
          className="p-5 sm:p-6 rounded-2xl border border-primary/20 bg-primary/5 flex flex-col gap-3"
        >
          <div className="flex items-center gap-2">
            <ListChecks className="w-4 h-4 text-primary" aria-hidden="true" />
            <h2 id="learning-objectives-heading" className="text-xs font-bold uppercase tracking-wider text-primary">
              Learning Objectives
            </h2>
          </div>
          <p className="text-xs text-foreground-secondary">
            After completing this topic, you should be able to:
          </p>
          <ul className="flex flex-col gap-2 list-none text-xs text-foreground">
            {topic.learningObjectives.map((obj, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span className="leading-relaxed">{obj}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Main Educational Sections */}
      <div className="flex flex-col gap-8">
        {topic.sections.length > 0 ? (
          topic.sections.map((section) => (
            <section
              key={section.id}
              aria-labelledby={`section-heading-${section.id}`}
              className="p-6 rounded-2xl border border-border bg-surface flex flex-col gap-4"
            >
              <h2
                id={`section-heading-${section.id}`}
                className="text-base sm:text-lg font-bold text-foreground border-b border-border pb-2.5"
              >
                {section.title}
              </h2>

              {/* Paragraphs */}
              {section.paragraphs.map((p, pIdx) => (
                <p key={pIdx} className="text-xs sm:text-sm text-foreground leading-relaxed">
                  {p}
                </p>
              ))}

              {/* Formulas */}
              {section.formulas && section.formulas.length > 0 && (
                <div className="flex flex-col gap-2 pt-2">
                  {section.formulas.map((formula) => (
                    <FormulaBlock key={formula.id} formula={formula} />
                  ))}
                </div>
              )}

              {/* Worked Examples */}
              {section.examples && section.examples.length > 0 && (
                <div className="flex flex-col gap-2 pt-2">
                  {section.examples.map((example, exIdx) => (
                    <ExampleBlock key={example.id} example={example} index={exIdx + 1} />
                  ))}
                </div>
              )}

              {/* Key points */}
              {section.keyPoints && section.keyPoints.length > 0 && (
                <div className="p-4 rounded-xl bg-surface-elevated border border-border flex flex-col gap-2 mt-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Key Reference Points:
                  </h3>
                  <ul className="flex flex-col gap-1.5 list-disc pl-5 text-xs text-foreground leading-relaxed">
                    {section.keyPoints.map((point, ptIdx) => (
                      <li key={ptIdx}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          ))
        ) : (
          <div className="p-8 rounded-xl border border-dashed border-border text-center flex flex-col items-center gap-3">
            <BookOpen className="w-8 h-8 text-foreground-muted" aria-hidden="true" />
            <p className="text-xs text-foreground-secondary">
              This topic doesn't have detailed lesson sections yet. Practice questions are available below.
            </p>
          </div>
        )}
      </div>

      {/* Quick Recap */}
      {topic.quickRecap.length > 0 && (
        <section
          aria-labelledby="quick-recap-heading"
          className="p-5 sm:p-6 rounded-2xl border border-border bg-surface-elevated/40 flex flex-col gap-3"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" aria-hidden="true" />
            <h2 id="quick-recap-heading" className="text-xs font-bold uppercase tracking-wider text-foreground">
              Quick Concept Recap
            </h2>
          </div>
          <ul className="flex flex-col gap-2 list-disc pl-5 text-xs text-foreground leading-relaxed">
            {topic.quickRecap.map((recap, rIdx) => (
              <li key={rIdx}>{recap}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Navigation Footer & Practice CTA */}
      <TopicNavigationFooter
        subjectId={subject.id}
        currentTopic={topic}
        previousTopic={previousTopic}
        nextTopic={nextTopic}
      />
    </article>
  );
};
