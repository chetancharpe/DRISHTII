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
          name: parsed.name || 'Candidate',
          email: parsed.email || 'candidate@drishti.org',
        };
      }
    }
  } catch {
    // ignore json parse error
  }
  return {
    name: 'Candidate',
    email: 'candidate@drishti.org',
  };
}

export function getFallbackCandidateDashboard(user?: { name?: string; email?: string }): CandidateDashboardData {
  const current = user || getCurrentCandidate();
  const name = current.name?.trim() || 'Candidate';
  const email = current.email || 'candidate@drishti.org';

  // Check if candidate has any locally stored completed mock tests or practice records
  const completedMocks: any[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('gowow_mock_result_') && !key.endsWith('_reviews')) {
        const item = localStorage.getItem(key);
        if (item) {
          try {
            completedMocks.push(JSON.parse(item));
          } catch {}
        }
      }
    }
  } catch {}

  const hasActivity = completedMocks.length > 0;
  const mockCount = completedMocks.length;
  let totalScore = 0;
  let totalQuestions = 0;

  completedMocks.forEach((m) => {
    totalScore += m.scorePercent || m.percentage || 0;
    totalQuestions += m.totalQuestions || 0;
  });

  const avgScore = mockCount > 0 ? Math.round(totalScore / mockCount) : 0;

  return {
    isOfflineFallback: true,
    fallbackMessage: 'Offline / Demo Preview: Live server could not be reached. Local storage and offline mode are active.',
    profile: {
      id: 'usr-candidate-active',
      name,
      email,
      targetExam: 'Combined Defence Services (CDS) 2026',
      role: 'candidate',
    },
    nextAction: hasActivity
      ? {
          id: 'next-action-01',
          title: 'Continue your preparation',
          subject: 'Reasoning',
          topic: 'Coding & Decoding',
          completedQuestions: 5,
          totalQuestions: 10,
          estimatedMinutesRemaining: 10,
          ctaLabel: 'Continue Practice',
          ctaRoute: '/candidate/practice?topic=coding-decoding',
        }
      : {
          id: 'next-action-new',
          title: 'Start your preparation',
          subject: 'General Ability',
          topic: 'First Diagnostic Practice Set',
          completedQuestions: 0,
          totalQuestions: 10,
          estimatedMinutesRemaining: 15,
          ctaLabel: 'Start Practice',
          ctaRoute: '/candidate/practice',
        },
    dailyGoal: {
      questionsCompleted: hasActivity ? Math.min(totalQuestions, 20) : 0,
      questionsTarget: 20,
      timeMinutesPracticed: hasActivity ? 25 : 0,
      targetMinutes: 45,
      topicsCompleted: hasActivity ? 1 : 0,
      topicsTarget: 3,
      streakDays: hasActivity ? 1 : 0,
      streakSupportiveMessage: hasActivity
        ? 'Great start! Keep building your preparation routine.'
        : "You haven't practiced today. Attempt your first practice question to start a streak.",
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
      overallProgressPercent: hasActivity ? Math.min(100, Math.round((totalQuestions / 100) * 100)) : 0,
      questionsPracticedCount: totalQuestions,
      mockTestsCompletedCount: mockCount,
      averageScorePercent: avgScore,
    },
    subjectProgress: [
      {
        id: 'subj-math',
        subject: 'Mathematics',
        progressPercent: hasActivity ? 25 : 0,
        masteredTopics: 0,
        totalTopics: 3,
        practiceRoute: '/candidate/practice?subject=mathematics',
      },
      {
        id: 'subj-english',
        subject: 'English',
        progressPercent: hasActivity ? 30 : 0,
        masteredTopics: 0,
        totalTopics: 3,
        practiceRoute: '/candidate/practice?subject=english',
      },
      {
        id: 'subj-gk',
        subject: 'General Knowledge',
        progressPercent: hasActivity ? 15 : 0,
        masteredTopics: 0,
        totalTopics: 3,
        practiceRoute: '/candidate/practice?subject=general-knowledge',
      },
      {
        id: 'subj-reasoning',
        subject: 'Reasoning',
        progressPercent: hasActivity ? 20 : 0,
        masteredTopics: 0,
        totalTopics: 3,
        practiceRoute: '/candidate/practice?subject=reasoning',
      },
    ],
    continueLearning: hasActivity
      ? {
          id: 'learn-01',
          subject: 'Mathematics',
          topic: 'Number Systems & Algebra',
          completedLessons: 1,
          totalLessons: 5,
          nextLessonTitle: 'Prime Numbers & Divisibility',
          continueRoute: '/candidate/learn',
        }
      : null,
    recommendations: [
      {
        id: 'rec-01',
        subject: 'Mathematics',
        topic: 'Percentages & Arithmetic',
        questionCount: 10,
        difficulty: 'Easy',
        estimatedMinutes: 12,
        practiceRoute: '/candidate/practice?topic=percentages',
      },
      {
        id: 'rec-02',
        subject: 'Reasoning',
        topic: 'Analogy & Classification',
        questionCount: 8,
        difficulty: 'Easy',
        estimatedMinutes: 10,
        practiceRoute: '/candidate/practice?topic=analogy',
      },
      {
        id: 'rec-03',
        subject: 'English',
        topic: 'Vocabulary & Synonyms',
        questionCount: 10,
        difficulty: 'Medium',
        estimatedMinutes: 12,
        practiceRoute: '/candidate/practice?topic=vocabulary',
      },
    ],
    mockTests: [
      {
        id: 'cds-full-mock-01',
        title: 'CDS General Ability Comprehensive Mock Test 1',
        questionCount: 40,
        durationMinutes: 60,
        difficulty: 'Medium',
        accessibilitySupport: 'Screen reader ready, full keyboard navigation, audio cues enabled',
        testRoute: '/candidate/mock-tests/cds-full-mock-01',
        isNew: true,
      },
    ],
    upcomingExams: [
      {
        id: 'exam-01',
        title: 'National Digital Mock Examination 2026',
        dateFormatted: '15 Oct 2026, 10:00 AM',
        durationMinutes: 60,
        status: 'Scheduled',
        detailsRoute: '/candidate/exams',
        registrationNumber: 'DRISHTI-2026-8821',
      },
    ],
    recentPerformance: completedMocks.slice(0, 3).map((m, idx) => ({
      id: `perf-${idx}`,
      testTitle: m.mockTestTitle || 'Mock Assessment',
      scorePercent: m.scorePercent || m.percentage || 0,
      dateFormatted: m.completedAt ? new Date(m.completedAt).toLocaleDateString() : 'Recent',
      isPassed: (m.scorePercent || m.percentage || 0) >= 50,
      viewRoute: '/candidate/results',
    })),
    performanceTrend: {
      testLabels: completedMocks.slice(-5).map((_, idx) => `Test ${idx + 1}`),
      scores: completedMocks.slice(-5).map((m) => m.scorePercent || m.percentage || 0),
      textAlternative: hasActivity
        ? `Completed ${mockCount} assessment(s) with an average score of ${avgScore}%.`
        : 'No tests completed yet. Completed tests will appear here.',
      trendDescription: hasActivity
        ? `Evaluations completed: ${mockCount}. Average score: ${avgScore}%.`
        : 'Attempt your first mock test or practice set to generate score trends.',
    },
    weakAreas: hasActivity
      ? [
          {
            id: 'weak-01',
            topic: 'Percentages & Arithmetic',
            subject: 'Mathematics',
            accuracyPercent: 45,
            practiceRoute: '/candidate/practice?topic=percentages',
          },
        ]
      : [],
    recentActivity: hasActivity
      ? completedMocks.slice(0, 3).map((m, idx) => ({
          id: `act-${idx}`,
          title: `Completed ${m.mockTestTitle || 'Mock Test'} (${m.scorePercent || 0}%)`,
          timestamp: m.completedAt ? new Date(m.completedAt).toLocaleDateString() : 'Recently',
          type: 'mock' as const,
        }))
      : [],
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
