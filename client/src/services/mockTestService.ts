import {
  MockTest,
  MockTestAnswer,
  MockTestHistoryItem,
  MockTestQuestionReview,
  MockTestResult,
  MockTestSession,
} from '../types/mockTest';
import { apiClient } from './api';

/**
 * Service abstraction for Mock Test Engine.
 * Connected directly to FastAPI endpoints:
 * - GET /mock-tests
 * - GET /mock-tests/:id
 * - POST /mock-tests/submit
 * - GET /mock-tests/history
 *
 * Scoring and answer validation are 100% server-authoritative!
 */

const STORAGE_SESSION_PREFIX = 'gowow_mock_session_';
const STORAGE_RESULT_PREFIX = 'gowow_mock_result_';

// In-memory runtime cache
const activeSessions: Map<string, MockTestSession> = new Map();
const completedResults: Map<string, MockTestResult> = new Map();

export const mockTestService = {
  /**
   * Fetches all available mock tests from backend.
   */
  async getMockTests(): Promise<MockTest[]> {
    return apiClient.get<MockTest[]>('/mock-tests');
  },

  /**
   * Fetches a specific mock test by ID with sanitized questions.
   */
  async getMockTest(id: string): Promise<MockTest | null> {
    try {
      return await apiClient.get<MockTest>(`/mock-tests/${id}`);
    } catch {
      return null;
    }
  },

  /**
   * Starts a new mock test session.
   */
  async startMockTest(testId: string): Promise<MockTestSession> {
    const test = (await this.getMockTest(testId)) || (await this.getMockTests())[0];

    const firstSection = test.sections[0];
    const firstQuestion = firstSection?.questions[0];

    const sessionId = `mock-sess-${test.id}-${Date.now()}`;
    const durationSeconds = test.durationMinutes * 60;

    const initialAnswers: Record<string, MockTestAnswer> = {};
    test.sections.forEach((sec) => {
      sec.questions.forEach((q) => {
        initialAnswers[q.id] = {
          questionId: q.id,
          sectionId: sec.id,
          selectedOptionIds: [],
          status: 'unanswered',
          markedForReview: false,
          timeSpentSeconds: 0,
        };
      });
    });

    const session: MockTestSession = {
      sessionId,
      testId: test.id,
      testTitle: test.title,
      examName: test.examName,
      totalQuestions: test.totalQuestions,
      status: 'in_progress',
      startedAt: new Date().toISOString(),
      durationSeconds,
      secondsRemaining: durationSeconds,
      currentSectionId: firstSection?.id || '',
      currentQuestionId: firstQuestion?.id || '',
      answers: initialAnswers,
    };

    activeSessions.set(sessionId, session);
    try {
      localStorage.setItem(`${STORAGE_SESSION_PREFIX}${sessionId}`, JSON.stringify(session));
      localStorage.setItem('gowow_active_mock_session_id', sessionId);
    } catch (e) {}

    return session;
  },

  /**
   * Retrieves currently active session from localStorage if present.
   */
  async getActiveSession(): Promise<MockTestSession | null> {
    const activeId = localStorage.getItem('gowow_active_mock_session_id');
    if (!activeId) return null;
    return this.getMockSession(activeId);
  },

  /**
   * Retrieves an active or stored mock test session.
   */
  async getMockSession(sessionId: string): Promise<MockTestSession | null> {
    if (activeSessions.has(sessionId)) {
      return { ...activeSessions.get(sessionId)! };
    }

    try {
      const stored = localStorage.getItem(`${STORAGE_SESSION_PREFIX}${sessionId}`);
      if (stored) {
        const parsed = JSON.parse(stored) as MockTestSession;
        activeSessions.set(sessionId, parsed);
        return { ...parsed };
      }
    } catch (e) {}

    return null;
  },

  /**
   * Updates an answer within a mock test session.
   */
  async saveAnswer(
    sessionId: string,
    questionId: string,
    selectedOptionIds: string[],
    timeSpentSeconds: number = 0
  ): Promise<MockTestSession> {
    const session = await this.getMockSession(sessionId);
    if (!session) throw new Error('Session not found.');

    const currentAnswer = session.answers[questionId] || {
      questionId,
      sectionId: session.currentSectionId,
      selectedOptionIds: [],
      status: 'unanswered',
      markedForReview: false,
      timeSpentSeconds: 0,
    };

    const hasSelection = selectedOptionIds.length > 0;
    const newStatus = currentAnswer.markedForReview
      ? hasSelection
        ? 'answered_marked_for_review'
        : 'marked_for_review'
      : hasSelection
      ? 'answered'
      : 'unanswered';

    session.answers[questionId] = {
      ...currentAnswer,
      selectedOptionIds,
      status: newStatus,
      timeSpentSeconds: currentAnswer.timeSpentSeconds + timeSpentSeconds,
    };

    activeSessions.set(sessionId, session);
    try {
      localStorage.setItem(`${STORAGE_SESSION_PREFIX}${sessionId}`, JSON.stringify(session));
    } catch (e) {}

    return { ...session };
  },

  /**
   * Alias for saveAnswer expected by MockTestSessionPage
   */
  async saveMockAnswer(
    sessionId: string,
    questionId: string,
    selectedOptionIds: string[],
    timeSpentSeconds: number = 0
  ): Promise<MockTestSession> {
    return this.saveAnswer(sessionId, questionId, selectedOptionIds, timeSpentSeconds);
  },

  /**
   * Toggles the mark for review status.
   */
  async toggleMarkForReview(sessionId: string, questionId: string): Promise<MockTestSession> {
    const session = await this.getMockSession(sessionId);
    if (!session) throw new Error('Session not found.');

    const currentAnswer = session.answers[questionId];
    if (!currentAnswer) return session;

    const newMarked = !currentAnswer.markedForReview;
    const hasSelection = currentAnswer.selectedOptionIds.length > 0;
    const newStatus = newMarked
      ? hasSelection
        ? 'answered_marked_for_review'
        : 'marked_for_review'
      : hasSelection
      ? 'answered'
      : 'unanswered';

    session.answers[questionId] = {
      ...currentAnswer,
      markedForReview: newMarked,
      status: newStatus,
    };

    activeSessions.set(sessionId, session);
    try {
      localStorage.setItem(`${STORAGE_SESSION_PREFIX}${sessionId}`, JSON.stringify(session));
    } catch (e) {}

    return { ...session };
  },

  /**
   * Clears candidate's response for a question.
   */
  async clearAnswer(sessionId: string, questionId: string): Promise<MockTestSession> {
    const session = await this.getMockSession(sessionId);
    if (!session) throw new Error('Session not found.');

    const currentAnswer = session.answers[questionId];
    if (!currentAnswer) return session;

    session.answers[questionId] = {
      ...currentAnswer,
      selectedOptionIds: [],
      status: currentAnswer.markedForReview ? 'marked_for_review' : 'unanswered',
    };

    activeSessions.set(sessionId, session);
    try {
      localStorage.setItem(`${STORAGE_SESSION_PREFIX}${sessionId}`, JSON.stringify(session));
    } catch (e) {}

    return { ...session };
  },

  /**
   * Updates current navigation position and remaining timer in active session.
   */
  async updateNavigationPosition(
    sessionId: string,
    sectionId: string,
    questionId: string,
    secondsRemaining?: number
  ): Promise<MockTestSession | null> {
    const session = await this.getMockSession(sessionId);
    if (!session) return null;

    session.currentSectionId = sectionId;
    session.currentQuestionId = questionId;
    if (secondsRemaining !== undefined) {
      session.secondsRemaining = secondsRemaining;
    }

    activeSessions.set(sessionId, session);
    try {
      localStorage.setItem(`${STORAGE_SESSION_PREFIX}${sessionId}`, JSON.stringify(session));
    } catch (e) {}

    return { ...session };
  },

  /**
   * Submits the mock test to the backend server for authoritative scoring.
   */
  async submitMockTest(session: MockTestSession, secondsRemaining: number): Promise<MockTestResult> {
    const timeUsedSeconds = Math.max(0, session.durationSeconds - secondsRemaining);
    const mins = Math.floor(timeUsedSeconds / 60);
    const secs = timeUsedSeconds % 60;
    const timeUsedFormatted = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

    // Server-authoritative scoring call
    const serverResult = await apiClient.post<any>('/mock-tests/submit', {
      test_id: session.testId,
      answers: session.answers,
      duration_seconds: session.durationSeconds,
      seconds_remaining: secondsRemaining,
    });

    const reviews: MockTestQuestionReview[] = (serverResult.reviews || []).map((r: any) => ({
      questionId: r.questionId,
      questionNumber: r.questionNumber,
      sectionId: r.sectionId,
      sectionName: r.sectionId.replace('sec-', '').toUpperCase(),
      questionText: r.text,
      type: 'single_choice',
      options: [],
      userOptionIds: r.selectedOptionIds,
      correctOptionIds: r.correctOptionIds,
      status: r.isCorrect ? 'correct' : r.isSkipped ? 'unanswered' : 'incorrect',
      markedForReview: r.markedForReview,
      explanation: r.explanation,
    }));

    const result: MockTestResult = {
      sessionId: session.sessionId,
      testId: session.testId,
      testTitle: serverResult.testTitle,
      examName: session.examName,
      totalScore: serverResult.totalScore,
      maxScore: serverResult.maximumScore,
      percentage: serverResult.percentage,
      totalQuestions: serverResult.totalQuestions,
      correctCount: serverResult.correctCount,
      incorrectCount: serverResult.incorrectCount,
      unansweredCount: serverResult.unansweredCount,
      markedForReviewCount: serverResult.markedForReviewCount,
      timeUsedSeconds,
      timeUsedFormatted,
      sectionPerformances: (serverResult.sections || []).map((s: any) => ({
        sectionId: s.sectionId,
        sectionName: s.sectionName,
        totalQuestions: s.totalQuestions,
        answeredCount: s.attemptedCount,
        correctCount: s.correctCount,
        incorrectCount: s.incorrectCount,
        unansweredCount: s.unansweredCount,
        score: s.score,
        maxScore: s.totalQuestions,
        accuracyPercent: s.accuracyPercent,
        timeSpentSeconds: Math.floor(timeUsedSeconds / (serverResult.sections.length || 1)),
      })),
      factualInterpretations: [
        `You scored ${serverResult.totalScore} marks out of ${serverResult.maximumScore} (${serverResult.percentage}%).`,
        `Answered ${serverResult.correctCount} correctly, ${serverResult.incorrectCount} incorrectly, and skipped ${serverResult.unansweredCount}.`,
      ],
      recommendedNextSteps: [
        'Review the detailed question explanations to reinforce your conceptual retention.',
        'Focus on topics where errors occurred and schedule a targeted practice set.',
      ],
    };

    completedResults.set(session.sessionId, result);
    try {
      localStorage.setItem(`${STORAGE_RESULT_PREFIX}${session.sessionId}`, JSON.stringify(result));
      localStorage.setItem(`${STORAGE_RESULT_PREFIX}${session.testId}_reviews`, JSON.stringify(reviews));
      localStorage.removeItem('gowow_active_mock_session_id');
    } catch (e) {}

    return result;
  },

  /**
   * Finalizes and submits mock test by sessionId.
   */
  async finishMockTest(sessionId: string, secondsRemaining: number): Promise<MockTestResult> {
    const session = await this.getMockSession(sessionId);
    if (!session) throw new Error('Session not found.');
    return this.submitMockTest(session, secondsRemaining);
  },

  /**
   * Discards an active mock test session.
   */
  async discardMockSession(sessionId: string): Promise<void> {
    activeSessions.delete(sessionId);
    try {
      localStorage.removeItem(`${STORAGE_SESSION_PREFIX}${sessionId}`);
      const activeId = localStorage.getItem('gowow_active_mock_session_id');
      if (activeId === sessionId) {
        localStorage.removeItem('gowow_active_mock_session_id');
      }
    } catch (e) {}
  },

  /**
   * Retrieves results for a completed mock test session.
   */
  async getMockResult(sessionId: string): Promise<MockTestResult | null> {
    if (completedResults.has(sessionId)) {
      return { ...completedResults.get(sessionId)! };
    }

    try {
      const stored = localStorage.getItem(`${STORAGE_RESULT_PREFIX}${sessionId}`);
      if (stored) {
        const parsed = JSON.parse(stored) as MockTestResult;
        completedResults.set(sessionId, parsed);
        return { ...parsed };
      }
    } catch (e) {}

    return null;
  },

  /**
   * Retrieves question reviews for a completed mock test session.
   */
  async getQuestionReviews(testId: string): Promise<MockTestQuestionReview[]> {
    try {
      const stored = localStorage.getItem(`${STORAGE_RESULT_PREFIX}${testId}_reviews`);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [];
  },

  /**
   * Fetches the candidate's prior mock test history from backend.
   */
  async getMockTestHistory(): Promise<MockTestHistoryItem[]> {
    return apiClient.get<MockTestHistoryItem[]>('/mock-tests/history');
  },

  /**
   * Alias for getMockTestHistory
   */
  async getMockHistory(): Promise<MockTestHistoryItem[]> {
    return this.getMockTestHistory();
  },

  /**
   * Retakes a mock test by starting a new session.
   */
  async retakeMockTest(testId: string): Promise<MockTestSession> {
    return this.startMockTest(testId);
  },

  /**
   * Alias for getQuestionReviews
   */
  async getMockReviews(testId: string): Promise<MockTestQuestionReview[]> {
    return this.getQuestionReviews(testId);
  },
};
