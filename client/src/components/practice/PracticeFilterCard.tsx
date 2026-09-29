import React, { useState, useEffect, useId } from 'react';
import { Card } from '../common/Card';
import { Target, Clock, History, Play } from 'lucide-react';
import { PracticeDifficultyFilter, PracticeSessionFilter } from '../../types/practice';
import { LearningSubject } from '../../types/learning';
import { learningService } from '../../services/learningService';
import { Link } from 'react-router-dom';

import { FALLBACK_SUBJECTS } from '../../fixtures/curriculumFixtures';

interface PracticeFilterCardProps {
  initialSubjectId?: string;
  initialTopicId?: string;
  onStartPractice: (filter: PracticeSessionFilter) => void;
  isLoading?: boolean;
}

export const PracticeFilterCard: React.FC<PracticeFilterCardProps> = ({
  initialSubjectId = 'mathematics',
  initialTopicId = 'percentages',
  onStartPractice,
  isLoading = false,
}) => {
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

  useEffect(() => {
    let isMounted = true;
    learningService.getSubjects().then((res) => {
      if (isMounted && res && res.length > 0) {
        setSubjects(res);
        if (!res.some((s) => s.id === selectedSubject)) {
          setSelectedSubject(res[0].id);
          if (res[0].topics && res[0].topics.length > 0) {
            setSelectedTopic(res[0].topics[0].id);
          }
        }
      }
    }).catch(() => {});
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
    <Card
      title="Customize Your Practice Session"
      subtitle="Select your preferred examination, subject, topic, and difficulty"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-6 pt-2">
        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Exam Filter */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor={examSelectId} className="text-xs font-bold text-foreground">
              Examination
            </label>
            <select
              id={examSelectId}
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border text-foreground text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[44px]"
            >
              <option value="cds">CDS (Combined Defence Services)</option>
            </select>
          </div>

          {/* Subject Filter */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor={subjectSelectId} className="text-xs font-bold text-foreground">
              Subject
            </label>
            <select
              id={subjectSelectId}
              value={selectedSubject}
              onChange={(e) => handleSubjectChange(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border text-foreground text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[44px]"
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
              Topic
            </label>
            <select
              id={topicSelectId}
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border text-foreground text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[44px]"
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
              Difficulty
            </label>
            <select
              id={difficultySelectId}
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value as PracticeDifficultyFilter)}
              className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border text-foreground text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[44px]"
            >
              <option value="all">All Difficulties (Mixed)</option>
              <option value="easy">Easy — Conceptual & Direct</option>
              <option value="medium">Medium — Standard Exam Level</option>
              <option value="hard">Hard — Advanced Application</option>
            </select>
          </div>

          {/* Question Count */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor={countSelectId} className="text-xs font-bold text-foreground">
              Questions
            </label>
            <select
              id={countSelectId}
              value={selectedCount}
              onChange={(e) => setSelectedCount(Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border text-foreground text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[44px]"
            >
              <option value={5}>5 Questions (~8 mins)</option>
              <option value={10}>10 Questions (~15 mins)</option>
              <option value={15}>15 Questions (~22 mins)</option>
              <option value={20}>20 Questions (~30 mins)</option>
            </select>
          </div>
        </div>

        {/* Selected Topic Context Panel */}
        {currentTopicObj && (
          <div className="p-3.5 rounded-lg bg-surface-hover/60 border border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
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
              <span className="flex items-center gap-1 font-medium">
                <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                ~{estimatedMins} mins
              </span>
              <Link
                to={`/candidate/learn?topic=${currentTopicObj.id}`}
                className="text-primary hover:underline font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded px-1 min-h-[44px] flex items-center"
              >
                Review Lesson
              </Link>
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1 border-t border-border">
          <div className="flex items-center gap-2 text-xs text-foreground-muted">
            <History className="w-4 h-4 text-foreground-muted" aria-hidden="true" />
            <span>Answer checking is verified by the backend server upon each submission.</span>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-primary-contrast font-bold text-sm shadow-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 min-h-[44px]"
          >
            <Play className="w-4 h-4 fill-current" aria-hidden="true" />
            {isLoading ? 'Starting Practice...' : 'Start Practice Session'}
          </button>
        </div>
      </form>
    </Card>
  );
};
