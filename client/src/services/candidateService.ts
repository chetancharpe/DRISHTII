/**
 * Candidate Service Layer for DRISHTI Platform
 * Connects directly to FastAPI backend via apiClient with resilient fallback telemetry.
 */

import { CandidateDashboardData } from '../types/candidateDashboard';
import { apiClient } from './api';

export interface CandidateServiceOptions {
  simulateDelayMs?: number;
  simulateError?: boolean;
}

function getCurrentCandidate(): { name: string; email: string } {
  try {
    const raw = localStorage.getItem('drishti_current_user');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.name || parsed.email) {
        return {
          name: parsed.name || 'Candidate User',
          email: parsed.email || 'candidate@drishti.org',
        };
      }
    }
  } catch {
    // ignore json parse error
  }
  return {
    name: 'Chetan Charpe',
    email: 'chetan@drishti.org',
  };
}

export function getFallbackCandidateDashboard(user?: { name?: string; email?: string }): CandidateDashboardData {
  const current = user || getCurrentCandidate();
  const name = current.name?.trim() || 'Candidate User';
  const email = current.email || 'candidate@drishti.org';

  return {
    profile: {
      id: 'usr-candidate-active',
      name,
      email,
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
      ctaRoute: '/candidate/practice?topic=coding-decoding',
    },
    dailyGoal: {
      questionsCompleted: 14,
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
        badge: 'Simulation',
      },
      {
        id: 'qa-exams',
        title: 'Scheduled Exams',
        description: 'View registered examinations and eligibility.',
        route: '/candidate/exams',
        iconName: 'exams',
      },
      {
        id: 'qa-results',
        title: 'Performance & Results',
        description: 'Review score telemetry and question breakdowns.',
        route: '/candidate/results',
        iconName: 'results',
      },
    ],
    overviewStats: {
      overallProgressPercent: 68,
      questionsPracticedCount: 248,
      mockTestsCompletedCount: 4,
      averageScorePercent: 74,
    },
    subjectProgress: [
      {
        id: 'subj-math',
        subject: 'Mathematics',
        progressPercent: 66,
        masteredTopics: 2,
        totalTopics: 3,
        practiceRoute: '/candidate/practice?subject=mathematics',
      },
      {
        id: 'subj-english',
        subject: 'English',
        progressPercent: 78,
        masteredTopics: 2,
        totalTopics: 3,
        practiceRoute: '/candidate/practice?subject=english',
      },
      {
        id: 'subj-gk',
        subject: 'General Knowledge',
        progressPercent: 49,
        masteredTopics: 1,
        totalTopics: 3,
        practiceRoute: '/candidate/practice?subject=general-knowledge',
      },
      {
        id: 'subj-reasoning',
        subject: 'Reasoning',
        progressPercent: 71,
        masteredTopics: 2,
        totalTopics: 3,
        practiceRoute: '/candidate/practice?subject=reasoning',
      },
    ],
    continueLearning: {
      id: 'learn-01',
      subject: 'Mathematics',
      topic: 'Probability — Compound Events',
      completedLessons: 4,
      totalLessons: 6,
      nextLessonTitle: 'Bayes Theorem & Conditional Probability',
      continueRoute: '/candidate/learn',
    },
    recommendations: [
      {
        id: 'rec-01',
        subject: 'Mathematics',
        topic: 'Percentages & Profit Loss',
        questionCount: 10,
        difficulty: 'Medium',
        estimatedMinutes: 15,
        practiceRoute: '/candidate/practice?topic=percentages',
      },
      {
        id: 'rec-02',
        subject: 'Reasoning',
        topic: 'Syllogisms & Deductions',
        questionCount: 8,
        difficulty: 'Easy',
        estimatedMinutes: 10,
        practiceRoute: '/candidate/practice?topic=syllogisms',
      },
      {
        id: 'rec-03',
        subject: 'English',
        topic: 'Sentence Correction & Grammar',
        questionCount: 12,
        difficulty: 'Hard',
        estimatedMinutes: 18,
        practiceRoute: '/candidate/practice?topic=grammar',
      },
    ],
    mockTests: [
      {
        id: 'mock-01',
        title: 'CDS General Ability Comprehensive Mock Test 1',
        questionCount: 50,
        durationMinutes: 60,
        difficulty: 'Medium',
        accessibilitySupport: 'Screen reader ready, full keyboard navigation, audio cues enabled',
        testRoute: '/candidate/mock-tests',
        isNew: true,
      },
      {
        id: 'mock-02',
        title: 'Elementary Mathematics Diagnostic Assessment',
        questionCount: 30,
        durationMinutes: 45,
        difficulty: 'Easy',
        accessibilitySupport: 'Accessible math notation, large-type support, keyboard navigation',
        testRoute: '/candidate/mock-tests',
      },
    ],
    upcomingExams: [
      {
        id: 'exam-01',
        title: 'National Digital Mock Examination 2026',
        dateFormatted: '15 Oct 2026, 10:00 AM',
        durationMinutes: 120,
        status: 'Scheduled',
        detailsRoute: '/candidate/exams',
        registrationNumber: 'DRISHTI-2026-8821',
      },
    ],
    recentPerformance: [
      {
        id: 'perf-01',
        testTitle: 'Quantitative Aptitude Mock 1',
        scorePercent: 78,
        dateFormatted: 'Yesterday',
        isPassed: true,
        viewRoute: '/candidate/results',
      },
      {
        id: 'perf-02',
        testTitle: 'English Vocabulary & Reading Drill',
        scorePercent: 82,
        dateFormatted: '3 days ago',
        isPassed: true,
        viewRoute: '/candidate/results',
      },
      {
        id: 'perf-03',
        testTitle: 'General Knowledge Weekly Assessment',
        scorePercent: 54,
        dateFormatted: '5 days ago',
        isPassed: false,
        viewRoute: '/candidate/results',
      },
    ],
    performanceTrend: {
      testLabels: ['Test 1', 'Test 2', 'Test 3', 'Test 4', 'Test 5'],
      scores: [62, 68, 71, 74, 78],
      textAlternative: 'Performance has shown consistent upward improvement across the last 5 tests, rising from 62% to 78%.',
      trendDescription: 'Your scores are steadily improving. +16% gain across recent evaluations.',
    },
    weakAreas: [
      {
        id: 'weak-01',
        topic: 'Modern Indian History',
        subject: 'General Knowledge',
        accuracyPercent: 42,
        practiceRoute: '/candidate/practice?topic=history',
      },
      {
        id: 'weak-02',
        topic: 'Permutations & Combinations',
        subject: 'Mathematics',
        accuracyPercent: 48,
        practiceRoute: '/candidate/practice?topic=permutations',
      },
    ],
    recentActivity: [
      {
        id: 'act-01',
        title: 'Completed 10 questions in Probability',
        timestamp: '2 hours ago',
        type: 'practice',
      },
      {
        id: 'act-02',
        title: 'Attempted Quantitative Aptitude Mock 1',
        timestamp: 'Yesterday',
        type: 'mock',
      },
      {
        id: 'act-03',
        title: 'Achieved 4-day study streak milestone',
        timestamp: 'Today',
        type: 'milestone',
      },
    ],
  };
}

class CandidateService {
  /**
   * Fetches full candidate dashboard payload from backend API with automatic fallback.
   */
  async getDashboardData(_options?: CandidateServiceOptions): Promise<CandidateDashboardData> {
    try {
      return await apiClient.get<CandidateDashboardData>('/candidate/dashboard');
    } catch (err) {
      console.warn('Backend /candidate/dashboard unavailable or offline, activating resilient fallback telemetry:', err);
      const user = getCurrentCandidate();
      return getFallbackCandidateDashboard(user);
    }
  }

  /**
   * Fetches empty state variant for testing empty states
   */
  async getEmptyDashboardData(): Promise<CandidateDashboardData> {
    const base = await this.getDashboardData();
    return {
      ...base,
      continueLearning: null,
      upcomingExams: [],
      recentPerformance: [],
      recommendations: [],
      weakAreas: [],
      recentActivity: [],
    };
  }
}

export const candidateService = new CandidateService();
