/**
 * Mock Candidate Dashboard Data for GoWow Prototype
 * Notice: This is prototype demo data structured for future backend/FastAPI compatibility.
 */

import { CandidateDashboardData } from '../types/candidateDashboard';

export const MOCK_CANDIDATE_DASHBOARD_DATA: CandidateDashboardData = {
  profile: {
    id: 'cand-001',
    name: 'Ananya Sharma',
    email: 'candidate@gowow.demo',
    targetExam: 'Combined Defence Services (CDS) 2026',
    role: 'candidate',
  },

  nextAction: {
    id: 'next-action-01',
    title: 'Continue your preparation',
    subject: 'Reasoning',
    topic: 'Coding & Decoding',
    completedQuestions: 6,
    totalQuestions: 10,
    estimatedMinutesRemaining: 8,
    ctaLabel: 'Continue Practice',
    ctaRoute: '/candidate/practice',
  },

  dailyGoal: {
    questionsCompleted: 12,
    questionsTarget: 20,
    timeMinutesPracticed: 35,
    targetMinutes: 45,
    topicsCompleted: 2,
    topicsTarget: 3,
    streakDays: 4,
    streakSupportiveMessage: 'Keep building your preparation routine.',
  },

  quickActions: [
    {
      id: 'qa-practice',
      title: 'Practice Questions',
      description: 'Practice by subject and topic.',
      route: '/candidate/practice',
      iconName: 'practice',
      badge: 'Interactive',
    },
    {
      id: 'qa-mock',
      title: 'Mock Test',
      description: 'Attempt a full-length practice examination.',
      route: '/candidate/mock-tests',
      iconName: 'mock',
      badge: 'Timed',
    },
    {
      id: 'qa-exams',
      title: 'Upcoming Exams',
      description: 'View scheduled examinations.',
      route: '/candidate/exams',
      iconName: 'exams',
      badge: '1 Scheduled',
    },
    {
      id: 'qa-results',
      title: 'Results',
      description: 'Review your previous performance.',
      route: '/candidate/results',
      iconName: 'results',
    },
  ],

  overviewStats: {
    overallProgressPercent: 64,
    questionsPracticedCount: 248,
    mockTestsCompletedCount: 7,
    averageScorePercent: 72,
  },

  subjectProgress: [
    {
      id: 'subj-eng',
      subject: 'English',
      progressPercent: 78,
      masteredTopics: 14,
      totalTopics: 18,
      practiceRoute: '/candidate/practice?subject=english',
    },
    {
      id: 'subj-reasoning',
      subject: 'Reasoning',
      progressPercent: 71,
      masteredTopics: 12,
      totalTopics: 17,
      practiceRoute: '/candidate/practice?subject=reasoning',
    },
    {
      id: 'subj-math',
      subject: 'Mathematics',
      progressPercent: 66,
      masteredTopics: 11,
      totalTopics: 17,
      practiceRoute: '/candidate/practice?subject=mathematics',
    },
    {
      id: 'subj-gk',
      subject: 'General Knowledge',
      progressPercent: 49,
      masteredTopics: 7,
      totalTopics: 15,
      practiceRoute: '/candidate/practice?subject=gk',
    },
  ],

  continueLearning: {
    id: 'learn-eng-rc',
    subject: 'English',
    topic: 'Reading Comprehension',
    completedLessons: 8,
    totalLessons: 12,
    nextLessonTitle: 'Inference and Logical Deductions in Passage Analysis',
    continueRoute: '/candidate/learn?topic=reading-comprehension',
  },

  recommendations: [
    {
      id: 'rec-01',
      subject: 'General Knowledge',
      topic: 'Current Affairs',
      questionCount: 10,
      difficulty: 'Medium',
      estimatedMinutes: 15,
      practiceRoute: '/candidate/practice?topic=current-affairs',
    },
    {
      id: 'rec-02',
      subject: 'Mathematics',
      topic: 'Percentages',
      questionCount: 15,
      difficulty: 'Easy',
      estimatedMinutes: 20,
      practiceRoute: '/candidate/practice?topic=percentages',
    },
  ],

  mockTests: [
    {
      id: 'mock-cds-gk',
      title: 'CDS General Knowledge Mock Test',
      questionCount: 50,
      durationMinutes: 60,
      difficulty: 'Medium',
      accessibilitySupport: 'Designed for keyboard navigation & screen-reader compatibility',
      testRoute: '/candidate/mock-tests?test=cds-gk',
      isNew: true,
    },
    {
      id: 'mock-eng-prac',
      title: 'English Practice Mock',
      questionCount: 30,
      durationMinutes: 30,
      difficulty: 'Easy',
      accessibilitySupport: 'Full keyboard accessibility & scalable text',
      testRoute: '/candidate/mock-tests?test=english-practice',
    },
  ],

  upcomingExams: [
    {
      id: 'exam-cds-01',
      title: 'CDS Practice Examination',
      dateFormatted: 'Saturday, 10 October',
      durationMinutes: 120,
      status: 'Scheduled',
      detailsRoute: '/candidate/exams?id=exam-cds-01',
      registrationNumber: 'CDS-2026-GW-8942',
    },
  ],

  recentPerformance: [
    {
      id: 'perf-01',
      testTitle: 'English Mock 1',
      scorePercent: 78,
      dateFormatted: '20 Sep',
      isPassed: true,
      viewRoute: '/candidate/results?id=perf-01',
    },
    {
      id: 'perf-02',
      testTitle: 'Reasoning Mock 2',
      scorePercent: 71,
      dateFormatted: '18 Sep',
      isPassed: true,
      viewRoute: '/candidate/results?id=perf-02',
    },
    {
      id: 'perf-03',
      testTitle: 'GK Mock 1',
      scorePercent: 63,
      dateFormatted: '15 Sep',
      isPassed: true,
      viewRoute: '/candidate/results?id=perf-03',
    },
  ],

  performanceTrend: {
    testLabels: ['Mock 1', 'Mock 2', 'Mock 3', 'Mock 4', 'Mock 5'],
    scores: [58, 64, 67, 71, 76],
    textAlternative: 'Your last five mock test scores increased steadily from 58% to 76%.',
    trendDescription: 'Consistent positive progression across recent attempts.',
  },

  weakAreas: [
    {
      id: 'weak-01',
      topic: 'Current Affairs',
      subject: 'General Knowledge',
      accuracyPercent: 44,
      practiceRoute: '/candidate/practice?topic=current-affairs',
    },
    {
      id: 'weak-02',
      topic: 'Algebra',
      subject: 'Mathematics',
      accuracyPercent: 51,
      practiceRoute: '/candidate/practice?topic=algebra',
    },
    {
      id: 'weak-03',
      topic: 'Reading Comprehension',
      subject: 'English',
      accuracyPercent: 57,
      practiceRoute: '/candidate/practice?topic=reading-comprehension',
    },
  ],

  recentActivity: [
    {
      id: 'act-01',
      title: 'Completed English Practice',
      timestamp: 'Today, 2:30 PM',
      type: 'practice',
    },
    {
      id: 'act-02',
      title: 'Finished Reasoning Mock Test',
      timestamp: 'Yesterday',
      type: 'mock',
    },
    {
      id: 'act-03',
      title: 'Practiced 20 GK questions',
      timestamp: '3 days ago',
      type: 'practice',
    },
    {
      id: 'act-04',
      title: 'Reviewed Mathematics results',
      timestamp: '4 days ago',
      type: 'review',
    },
  ],
};
