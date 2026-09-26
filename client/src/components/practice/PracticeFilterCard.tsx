import React, { useState, useId } from 'react';
import { Card } from '../common/Card';
import { Target, Clock, History, Play } from 'lucide-react';
import { PracticeDifficultyFilter, PracticeSessionFilter } from '../../types/practice';
import { MOCK_LEARNING_SUBJECTS, MOCK_LEARNING_TOPICS } from '../../data/learningData';
import { Link } from 'react-router-dom';

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

  // Topics for selected subject
  const availableTopics = MOCK_LEARNING_TOPICS[selectedSubject] || [];

  const handleSubjectChange = (newSub: string) => {
    setSelectedSubject(newSub);
    const subTopics = MOCK_LEARNING_TOPICS[newSub] || [];
    if (subTopics.length > 0) {
      setSelectedTopic(subTopics[0].id);
    } else {
      setSelectedTopic('all');
    }
  };

  const currentSubjectObj = MOCK_LEARNING_SUBJECTS.find((s) => s.id === selectedSubject);
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
              {MOCK_LEARNING_SUBJECTS.map((s) => (
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

          {/* Question Count Filter */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor={countSelectId} className="text-xs font-bold text-foreground">
              Question Count
            </label>
            <select
              id={countSelectId}
              value={selectedCount}
              onChange={(e) => setSelectedCount(Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border text-foreground text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[44px]"
            >
              <option value={5}>5 Questions (Quick Check)</option>
              <option value={10}>10 Questions (Standard Practice)</option>
              <option value={20}>20 Questions (Deep Drill)</option>
            </select>
          </div>
        </div>

        {/* Practice Session Summary Preview */}
        <section
          aria-labelledby="practice-summary-heading"
          className="p-4 sm:p-5 rounded-xl border border-primary/30 bg-primary/5 flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-primary/10 text-primary" aria-hidden="true">
                <Target className="w-4 h-4" />
              </span>
              <h3 id="practice-summary-heading" className="text-xs font-bold uppercase tracking-wider text-primary">
                Practice Session Summary
              </h3>
            </div>

            <p className="text-sm font-bold text-foreground">
              {currentSubjectObj?.name} — {currentTopicObj?.name || 'All Topics'}
            </p>

            <div className="flex flex-wrap items-center gap-3 text-xs text-foreground-secondary pt-1">
              <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                <span>Questions:</span>
                <span className="px-1.5 py-0.5 rounded bg-surface border border-border">
                  {selectedCount}
                </span>
              </span>

              <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                <span>Difficulty:</span>
                <span className="px-1.5 py-0.5 rounded bg-surface border border-border capitalize">
                  {selectedDifficulty}
                </span>
              </span>

              <span className="inline-flex items-center gap-1 text-foreground-secondary">
                <Clock className="w-3.5 h-3.5 text-foreground-muted" aria-hidden="true" />
                <span>Est. {estimatedMins} minutes</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary hover:bg-primary-hover active:bg-primary-hover disabled:opacity-50 text-primary-contrast font-bold text-xs min-h-[44px] shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
            >
              <Play className="w-4 h-4 fill-current" aria-hidden="true" />
              <span>{isLoading ? 'Starting Practice...' : 'Start Practice'}</span>
            </button>
          </div>
        </section>

        {/* Secondary link to history */}
        <div className="flex justify-end pt-1">
          <Link
            to="/candidate/practice/history"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground-secondary hover:text-foreground hover:underline p-1 min-h-[36px] rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <History className="w-3.5 h-3.5 text-foreground-muted" aria-hidden="true" />
            <span>View Previous Practice Sessions History</span>
          </Link>
        </div>
      </form>
    </Card>
  );
};
