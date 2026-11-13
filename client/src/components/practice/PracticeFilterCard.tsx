import React, { useState, useEffect, useId } from 'react';
import { Target, Clock, History, Play, Sliders } from 'lucide-react';
import { PracticeDifficultyFilter, PracticeSessionFilter } from '../../types/practice';
import { LearningSubject } from '../../types/learning';
import { learningService } from '../../services/learningService';
import { Link } from 'react-router-dom';
import { useAccessibility } from '../../hooks/useAccessibility';
import { FALLBACK_SUBJECTS } from '../../fixtures/curriculumFixtures';

export interface PracticeFilterCardProps {
  initialSubjectId?: string;
  initialTopicId?: string;
  onStartPractice: (filter: PracticeSessionFilter) => void;
  isLoading?: boolean;
  className?: string;
}

export const PracticeFilterCard: React.FC<PracticeFilterCardProps> = ({
  initialSubjectId = 'mathematics',
  initialTopicId = 'percentages',
  onStartPractice,
  isLoading = false,
  className = '',
}) => {
  const { preferences } = useAccessibility();
  const isHindi =
    preferences?.language === 'hi' ||
    (typeof document !== 'undefined' && document.documentElement.lang === 'hi');

  const [subjects, setSubjects] = useState<LearningSubject[]>(FALLBACK_SUBJECTS);
  const [selectedExam, setSelectedExam] = useState('cds');
  const [selectedSubject, setSelectedSubject] = useState(initialSubjectId);
  const [selectedTopic, setSelectedTopic] = useState(initialTopicId);
  const [selectedDifficulty, setSelectedDifficulty] = useState<PracticeDifficultyFilter>('medium');
  const [selectedCount, setSelectedCount] = useState<number>(10);

  const examSelectId = useId();
  const subjectSelectId = useId();
  const topicSelectId = useId();
  const difficultySelectId = useId();
  const countSelectId = useId();

  // Keep in sync if parent changes initial values
  useEffect(() => {
    if (initialSubjectId) setSelectedSubject(initialSubjectId);
    if (initialTopicId) setSelectedTopic(initialTopicId);
  }, [initialSubjectId, initialTopicId]);

  useEffect(() => {
    let isMounted = true;
    learningService
      .getSubjects()
      .then((res) => {
        if (isMounted && res && res.length > 0) {
          setSubjects(res);
          if (!res.some((s) => s.id === selectedSubject)) {
            setSelectedSubject(res[0].id);
            if (res[0].topics && res[0].topics.length > 0) {
              setSelectedTopic(res[0].topics[0].id);
            }
          }
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const currentSubjectObj = subjects.find((s) => s.id === selectedSubject);
  const availableTopics = currentSubjectObj?.topics || [];

  const handleSubjectChange = (newSub: string) => {
    setSelectedSubject(newSub);
    const subObj = subjects.find((s) => s.id === newSub);
    const subTopics = subObj?.topics || [];
    if (subTopics.length > 0) {
      setSelectedTopic(subTopics[0].id);
    } else {
      setSelectedTopic('all');
    }
  };

  const currentTopicObj = availableTopics.find((t) => t.id === selectedTopic);
  const estimatedMins = Math.ceil(selectedCount * 1.5);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStartPractice({
      examId: selectedExam,
      subjectId: selectedSubject,
      topicId: selectedTopic,
      difficulty: selectedDifficulty,
      questionCount: selectedCount,
    });
  };

  return (
    <section
      aria-labelledby="custom-practice-heading"
      className={`p-5 sm:p-7 rounded-2xl border-2 border-border bg-surface flex flex-col gap-6 shadow-sm ${className}`}
    >
      <div className="flex flex-col gap-1 border-b border-border/80 pb-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
          <h2 id="custom-practice-heading" className="text-base sm:text-lg font-black text-foreground tracking-tight">
            {isHindi ? 'कस्टमाइज़्ड अभ्यास सत्र बनाएं' : 'Customize Your Practice Session'}
          </h2>
        </div>
        <p className="text-xs text-foreground-secondary leading-relaxed">
          {isHindi
            ? 'अपनी पसंद की परीक्षा, विषय, टॉपिक, कठिनाई और प्रश्नों की संख्या चुनकर अभ्यास शुरू करें।'
            : 'Select your preferred examination, subject, topic, difficulty, and question count.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Exam Filter */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor={examSelectId} className="text-xs font-bold text-foreground">
              {isHindi ? '1. परीक्षा (Examination)' : '1. Target Examination'}
            </label>
            <select
              id={examSelectId}
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-surface-elevated border-2 border-border text-foreground text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[44px]"
            >
              <option value="cds">CDS (Combined Defence Services 2026)</option>
            </select>
          </div>

          {/* Subject Filter */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor={subjectSelectId} className="text-xs font-bold text-foreground">
              {isHindi ? '2. विषय (Subject)' : '2. Subject Area'}
            </label>
            <select
              id={subjectSelectId}
              value={selectedSubject}
              onChange={(e) => handleSubjectChange(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-surface-elevated border-2 border-border text-foreground text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[44px]"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Topic Filter */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor={topicSelectId} className="text-xs font-bold text-foreground">
              {isHindi ? '3. टॉपिक (Topic)' : '3. Learning Topic'}
            </label>
            <select
              id={topicSelectId}
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-surface-elevated border-2 border-border text-foreground text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[44px]"
            >
              {availableTopics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty Filter */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor={difficultySelectId} className="text-xs font-bold text-foreground">
              {isHindi ? '4. कठिनाई स्तर (Difficulty)' : '4. Difficulty Band'}
            </label>
            <select
              id={difficultySelectId}
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value as PracticeDifficultyFilter)}
              className="w-full px-3 py-2.5 rounded-xl bg-surface-elevated border-2 border-border text-foreground text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[44px]"
            >
              <option value="all">{isHindi ? 'सभी स्तर (मिश्रित)' : 'All Difficulties (Mixed)'}</option>
              <option value="easy">{isHindi ? 'सरल — प्रत्यक्ष व बुनियादी' : 'Easy — Conceptual & Direct'}</option>
              <option value="medium">{isHindi ? 'मध्यम — मानक परीक्षा स्तर' : 'Medium — Standard Exam Level'}</option>
              <option value="hard">{isHindi ? 'कठिन — विश्लेषणात्मक अनुप्रयोग' : 'Hard — Advanced Application'}</option>
            </select>
          </div>

          {/* Question Count */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor={countSelectId} className="text-xs font-bold text-foreground">
              {isHindi ? '5. प्रश्नों की संख्या (Questions)' : '5. Questions Count'}
            </label>
            <select
              id={countSelectId}
              value={selectedCount}
              onChange={(e) => setSelectedCount(Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-xl bg-surface-elevated border-2 border-border text-foreground text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[44px]"
            >
              <option value={5}>5 {isHindi ? 'प्रश्न (~8 मिनट)' : 'Questions (~8 mins)'}</option>
              <option value={10}>10 {isHindi ? 'प्रश्न (~15 मिनट)' : 'Questions (~15 mins)'}</option>
              <option value={15}>15 {isHindi ? 'प्रश्न (~22 मिनट)' : 'Questions (~22 mins)'}</option>
              <option value={20}>20 {isHindi ? 'प्रश्न (~30 मिनट)' : 'Questions (~30 mins)'}</option>
            </select>
          </div>
        </div>

        {/* Selected Topic Context Panel */}
        {currentTopicObj && (
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-start gap-2.5">
              <Target className="w-4 h-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="font-bold text-foreground">
                  {currentSubjectObj?.name}: {currentTopicObj.name}
                </p>
                <p className="text-foreground-muted mt-0.5 line-clamp-1">{currentTopicObj.shortDescription}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0 text-foreground-muted">
              <span className="flex items-center gap-1 font-mono font-semibold text-primary">
                <Clock className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                ~{estimatedMins} {isHindi ? 'मिनट' : 'mins'}
              </span>
              <Link
                to={`/candidate/learn?topic=${currentTopicObj.id}`}
                className="text-primary hover:underline font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded px-1.5 py-0.5 min-h-[36px] flex items-center"
              >
                {isHindi ? 'पाठ पढ़ें' : 'Review Lesson'}
              </Link>
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-border">
          <div className="flex items-center gap-2 text-xs text-foreground-muted">
            <History className="w-4 h-4 text-foreground-muted shrink-0" aria-hidden="true" />
            <span>
              {isHindi
                ? 'हर उत्तर पर तत्काल आवाज स्पष्टीकरण और सही/गलत का विश्लेषण मिलता है।'
                : 'Every answer receives immediate spoken feedback and step-by-step reasoning.'}
            </span>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-primary hover:bg-primary-hover text-primary-contrast font-black text-sm shadow-md transition-colors focus:outline-none focus-visible:ring-3 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 min-h-[46px]"
          >
            <Play className="w-4 h-4 fill-current shrink-0" aria-hidden="true" />
            <span>
              {isLoading
                ? isHindi
                  ? 'सत्र शुरू हो रहा है...'
                  : 'Starting Practice...'
                : isHindi
                ? 'अभ्यास सत्र शुरू करें'
                : 'Start Practice Session'}
            </span>
          </button>
        </div>
      </form>
    </section>
  );
};
