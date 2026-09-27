import {
  MockTest,
  MockTestAnswer,
  MockTestHistoryItem,
  MockTestQuestionReview,
  MockTestResult,
  MockTestSession,
  SectionPerformance,
} from '../types/mockTest';
import { MOCK_TESTS, MOCK_TEST_HISTORY } from '../data/mockTestData';

/**
 * Service abstraction for Mock Test Engine.
 * Represents client-side simulation layer in current prototype.
 * Architectural endpoints for future FastAPI REST service:
 * - GET /api/mock-tests
 * - GET /api/mock-tests/:id
 * - POST /api/mock-tests/:id/sessions
 * - GET /api/mock-tests/sessions/:sessionId
 * - POST /api/mock-tests/sessions/:sessionId/answers
 * - POST /api/mock-tests/sessions/:sessionId/review
 * - POST /api/mock-tests/sessions/:sessionId/submit
 * - GET /api/mock-tests/sessions/:sessionId/result
 * - GET /api/mock-tests/history
 */

const STORAGE_SESSION_PREFIX = 'gowow_mock_session_';
const STORAGE_RESULT_PREFIX = 'gowow_mock_result_';
const STORAGE_HISTORY_KEY = 'gowow_mock_history';

// In-memory runtime cache
const activeSessions: Map<string, MockTestSession> = new Map();
const completedResults: Map<string, MockTestResult> = new Map();

export const mockTestService = {
  /**
   * Fetches all available mock tests.
   */
  async getMockTests(): Promise<MockTest[]> {
    await new Promise((r) => setTimeout(r, 80));
    return [...MOCK_TESTS];
  },

  /**
   * Fetches a specific mock test by ID.
   */
  async getMockTest(id: string): Promise<MockTest | null> {
    await new Promise((r) => setTimeout(r, 60));
    const test = MOCK_TESTS.find((t) => t.id === id);
    return test ? { ...test } : null;
  },

  /**
   * Starts a new mock test session.
   */
  async startMockTest(testId: string): Promise<MockTestSession> {
    await new Promise((r) => setTimeout(r, 100));
    const test = MOCK_TESTS.find((t) => t.id === testId) || MOCK_TESTS[0];

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
      durationSeconds,
      secondsRemaining: durationSeconds,
      currentSectionId: firstSection?.id || '',
      currentQuestionId: firstQuestion?.id || '',
      answers: initialAnswers,
      status: 'in_progress',
      startedAt: new Date().toISOString(),
    };

    activeSessions.set(sessionId, session);
    try {
      localStorage.setItem(`${STORAGE_SESSION_PREFIX}${sessionId}`, JSON.stringify(session));
      localStorage.setItem('gowow_active_mock_session_id', sessionId);
    } catch (e) {
      // Storage quota or fallback
    }

    return { ...session };
  },

  /**
   * Retrieves an active or recent mock test session.
   */
  async getMockSession(sessionId: string): Promise<MockTestSession | null> {
    await new Promise((r) => setTimeout(r, 60));
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
    } catch (e) {
      // ignore
    }

    // Auto-create demo session for direct URL access
    return this.startMockTest('cds-full-mock-01');
  },

  /**
   * Saves or updates a candidate's answer for a question in a mock test.
   */
  async saveMockAnswer(
    sessionId: string,
    questionId: string,
    selectedOptionIds: string[],
    timeSpentSeconds: number = 0
  ): Promise<MockTestSession> {
    await new Promise((r) => setTimeout(r, 40));
    const session = activeSessions.get(sessionId) || (await this.getMockSession(sessionId));
    if (!session) throw new Error('Mock session not found.');

    const currentAnswer = session.answers[questionId] || {
      questionId,
      sectionId: session.currentSectionId,
      selectedOptionIds: [],
      status: 'unanswered',
      markedForReview: false,
      timeSpentSeconds: 0,
    };

    const hasSelection = selectedOptionIds.length > 0;
    const isMarked = currentAnswer.markedForReview;

    let newStatus: MockTestAnswer['status'] = 'unanswered';
    if (hasSelection && isMarked) {
      newStatus = 'answered_marked_for_review';
    } else if (hasSelection) {
      newStatus = 'answered';
    } else if (isMarked) {
      newStatus = 'marked_for_review';
    }

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
   * Toggles the Mark for Review flag on a question.
   */
  async toggleMarkForReview(sessionId: string, questionId: string): Promise<MockTestSession> {
    await new Promise((r) => setTimeout(r, 40));
    const session = activeSessions.get(sessionId) || (await this.getMockSession(sessionId));
    if (!session) throw new Error('Mock session not found.');

    const currentAnswer = session.answers[questionId] || {
      questionId,
      sectionId: session.currentSectionId,
      selectedOptionIds: [],
      status: 'unanswered',
      markedForReview: false,
      timeSpentSeconds: 0,
    };

    const nextMarked = !currentAnswer.markedForReview;
    const hasSelection = currentAnswer.selectedOptionIds.length > 0;

    let newStatus: MockTestAnswer['status'] = 'unanswered';
    if (hasSelection && nextMarked) {
      newStatus = 'answered_marked_for_review';
    } else if (hasSelection) {
      newStatus = 'answered';
    } else if (nextMarked) {
      newStatus = 'marked_for_review';
    }

    session.answers[questionId] = {
      ...currentAnswer,
      markedForReview: nextMarked,
      status: newStatus,
    };

    activeSessions.set(sessionId, session);
    try {
      localStorage.setItem(`${STORAGE_SESSION_PREFIX}${sessionId}`, JSON.stringify(session));
    } catch (e) {}

    return { ...session };
  },

  /**
   * Updates current navigation positions (section and question).
   */
  async updateNavigationPosition(
    sessionId: string,
    sectionId: string,
    questionId: string,
    secondsRemaining: number
  ): Promise<void> {
    const session = activeSessions.get(sessionId);
    if (!session) return;
    session.currentSectionId = sectionId;
    session.currentQuestionId = questionId;
    session.secondsRemaining = secondsRemaining;
    activeSessions.set(sessionId, session);
    try {
      localStorage.setItem(`${STORAGE_SESSION_PREFIX}${sessionId}`, JSON.stringify(session));
    } catch (e) {}
  },

  /**
   * Concludes the mock test, computes scores based on marking scheme, and produces detailed results.
   */
  async finishMockTest(sessionId: string, secondsRemaining: number): Promise<MockTestResult> {
    await new Promise((r) => setTimeout(r, 120));
    const session = activeSessions.get(sessionId) || (await this.getMockSession(sessionId));
    if (!session) throw new Error('Mock test session not found.');

    const test = MOCK_TESTS.find((t) => t.id === session.testId) || MOCK_TESTS[0];
    const timeUsedSeconds = Math.max(0, session.durationSeconds - secondsRemaining);

    session.status = 'submitted';
    session.completedAt = new Date().toISOString();
    session.secondsRemaining = secondsRemaining;

    // Build question reviews and tally scores
    const reviews: MockTestQuestionReview[] = [];
    const sectionStatsMap: Record<
      string,
      {
        total: number;
        answered: number;
        correct: number;
        incorrect: number;
        unanswered: number;
        score: number;
      }
    > = {};

    test.sections.forEach((sec) => {
      sectionStatsMap[sec.id] = {
        total: sec.questions.length,
        answered: 0,
        correct: 0,
        incorrect: 0,
        unanswered: 0,
        score: 0,
      };
    });

    let totalCorrect = 0;
    let totalIncorrect = 0;
    let totalUnanswered = 0;
    let totalMarkedReview = 0;

    test.sections.forEach((sec) => {
      sec.questions.forEach((q) => {
        const userAns = session.answers[q.id];
        const selectedIds = userAns?.selectedOptionIds || [];
        const isMarked = userAns?.markedForReview || false;
        if (isMarked) totalMarkedReview++;

        let reviewStatus: 'correct' | 'incorrect' | 'unanswered' = 'unanswered';

        if (selectedIds.length === 0) {
          totalUnanswered++;
          sectionStatsMap[sec.id].unanswered++;
        } else {
          sectionStatsMap[sec.id].answered++;
          const isCorrect =
            selectedIds.length === q.correctOptionIds.length &&
            selectedIds.every((id) => q.correctOptionIds.includes(id));

          if (isCorrect) {
            reviewStatus = 'correct';
            totalCorrect++;
            sectionStatsMap[sec.id].correct++;
            sectionStatsMap[sec.id].score += test.markingScheme.correctMarks;
          } else {
            reviewStatus = 'incorrect';
            totalIncorrect++;
            sectionStatsMap[sec.id].incorrect++;
            sectionStatsMap[sec.id].score -= test.markingScheme.incorrectPenalty;
          }
        }

        reviews.push({
          questionId: q.id,
          questionNumber: q.questionNumber,
          sectionId: sec.id,
          sectionName: sec.name,
          questionText: q.text,
          type: q.type,
          options: q.options,
          userOptionIds: selectedIds,
          correctOptionIds: q.correctOptionIds,
          status: reviewStatus,
          markedForReview: isMarked,
          explanation: q.explanation || 'Detailed explanation will be released by examination mentors.',
          formula: q.formula,
          table: q.table,
        });
      });
    });

    // Compute grand totals
    const rawTotalScore =
      totalCorrect * test.markingScheme.correctMarks -
      totalIncorrect * test.markingScheme.incorrectPenalty;
    const finalTotalScore = Math.max(0, Math.round(rawTotalScore * 100) / 100);
    const maxScore = test.totalQuestions * test.markingScheme.correctMarks;
    const percentage = maxScore > 0 ? Math.round((finalTotalScore / maxScore) * 1000) / 10 : 0;

    const mins = Math.floor(timeUsedSeconds / 60);
    const secs = timeUsedSeconds % 60;
    const timeUsedFormatted = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

    // Section performance array
    const sectionPerformances: SectionPerformance[] = test.sections.map((sec) => {
      const stats = sectionStatsMap[sec.id];
      const secMax = stats.total * test.markingScheme.correctMarks;
      const secAcc = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
      return {
        sectionId: sec.id,
        sectionName: sec.name,
        totalQuestions: stats.total,
        answeredCount: stats.answered,
        correctCount: stats.correct,
        incorrectCount: stats.incorrect,
        unansweredCount: stats.unanswered,
        score: Math.max(0, Math.round(stats.score * 100) / 100),
        maxScore: secMax,
        accuracyPercent: secAcc,
        timeSpentSeconds: Math.floor(timeUsedSeconds / test.sections.length),
      };
    });

    // Factual interpretations from data (strictly without fake claims)
    const factualInterpretations: string[] = [];
    const highestSec = [...sectionPerformances].sort((a, b) => b.accuracyPercent - a.accuracyPercent)[0];
    const lowestSec = [...sectionPerformances].sort((a, b) => a.accuracyPercent - b.accuracyPercent)[0];

    if (highestSec && lowestSec && highestSec.sectionId !== lowestSec.sectionId) {
      factualInterpretations.push(`Accuracy was highest in ${highestSec.sectionName} at ${highestSec.accuracyPercent}%.`);
      factualInterpretations.push(
        `${lowestSec.sectionName} recorded the lowest accuracy at ${lowestSec.accuracyPercent}% with ${lowestSec.incorrectCount} incorrect attempts.`
      );
    } else {
      factualInterpretations.push(`Completed all sections with an overall accuracy of ${percentage}%.`);
    }

    if (totalMarkedReview > 0) {
      factualInterpretations.push(
        `You flagged ${totalMarkedReview} questions for review during your test session.`
      );
    }

    // Recommended next steps (rule-based demo recommendations)
    const recommendedNextSteps: string[] = [
      `Review incorrect attempts in ${lowestSec?.sectionName || 'weak sections'} using the detailed question explanations below.`,
      `Attempt a 10-question targeted practice drill in ${lowestSec?.sectionName || 'Elementary Mathematics'}.`,
      `Retake this mock examination after 48 hours to measure retention under timed constraints.`,
    ];

    const result: MockTestResult = {
      sessionId,
      testId: test.id,
      testTitle: test.title,
      examName: test.examName,
      totalScore: finalTotalScore,
      maxScore,
      percentage,
      totalQuestions: test.totalQuestions,
      correctCount: totalCorrect,
      incorrectCount: totalIncorrect,
      unansweredCount: totalUnanswered,
      markedForReviewCount: totalMarkedReview,
      timeUsedSeconds,
      timeUsedFormatted,
      sectionPerformances,
      factualInterpretations,
      recommendedNextSteps,
    };

    completedResults.set(sessionId, result);
    try {
      localStorage.setItem(`${STORAGE_RESULT_PREFIX}${sessionId}`, JSON.stringify(result));
      localStorage.setItem(`${STORAGE_RESULT_PREFIX}${test.id}_reviews`, JSON.stringify(reviews));
      localStorage.removeItem('gowow_active_mock_session_id');
    } catch (e) {}

    return result;
  },

  /**
   * Retrieves results for a completed mock test session.
   */
  async getMockResult(sessionId: string): Promise<MockTestResult | null> {
    await new Promise((r) => setTimeout(r, 60));
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

    // Fallback demo result
    const fallbackTest = MOCK_TESTS[0];
    return {
      sessionId,
      testId: fallbackTest.id,
      testTitle: fallbackTest.title,
      examName: fallbackTest.examName,
      totalScore: 10.34,
      maxScore: 15.0,
      percentage: 68.9,
      totalQuestions: 15,
      correctCount: 11,
      incorrectCount: 2,
      unansweredCount: 2,
      markedForReviewCount: 3,
      timeUsedSeconds: 1680,
      timeUsedFormatted: '28m 00s',
      sectionPerformances: [
        {
          sectionId: 'sec-english',
          sectionName: 'English Language',
          totalQuestions: 5,
          answeredCount: 5,
          correctCount: 4,
          incorrectCount: 1,
          unansweredCount: 0,
          score: 3.67,
          maxScore: 5.0,
          accuracyPercent: 80.0,
          timeSpentSeconds: 480,
        },
        {
          sectionId: 'sec-gk',
          sectionName: 'General Knowledge',
          totalQuestions: 5,
          answeredCount: 4,
          correctCount: 4,
          incorrectCount: 0,
          unansweredCount: 1,
          score: 4.0,
          maxScore: 5.0,
          accuracyPercent: 80.0,
          timeSpentSeconds: 520,
        },
        {
          sectionId: 'sec-math',
          sectionName: 'Elementary Mathematics',
          totalQuestions: 5,
          answeredCount: 4,
          correctCount: 3,
          incorrectCount: 1,
          unansweredCount: 1,
          score: 2.67,
          maxScore: 5.0,
          accuracyPercent: 60.0,
          timeSpentSeconds: 680,
        },
      ],
      factualInterpretations: [
        'Accuracy was highest in General Knowledge and English Language at 80%.',
        'Elementary Mathematics had the lowest accuracy at 60% with 1 incorrect attempt.',
        'You flagged 3 questions for review during the examination simulation.',
      ],
      recommendedNextSteps: [
        'Review Elementary Mathematics formulas for simple interest and algebraic identities.',
        'Attempt a 5-question speed drill on Elementary Mathematics.',
        'Retake this CDS practice mock to target 80%+ overall percentage.',
      ],
    };
  },

  /**
   * Retrieves question-by-question reviews for a completed test.
   */
  async getMockReviews(testId: string): Promise<MockTestQuestionReview[]> {
    await new Promise((r) => setTimeout(r, 60));
    try {
      const stored = localStorage.getItem(`${STORAGE_RESULT_PREFIX}${testId}_reviews`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {}

    // Generate reviews from test definition
    const test = MOCK_TESTS.find((t) => t.id === testId) || MOCK_TESTS[0];
    const generated: MockTestQuestionReview[] = [];

    test.sections.forEach((sec) => {
      sec.questions.forEach((q, idx) => {
        const isCorrect = idx !== 1 && idx !== 4;
        const isUnanswered = idx === 4;
        const userOpt = isUnanswered ? [] : isCorrect ? q.correctOptionIds : ['A'];

        generated.push({
          questionId: q.id,
          questionNumber: q.questionNumber,
          sectionId: sec.id,
          sectionName: sec.name,
          questionText: q.text,
          type: q.type,
          options: q.options,
          userOptionIds: userOpt,
          correctOptionIds: q.correctOptionIds,
          status: isUnanswered ? 'unanswered' : isCorrect ? 'correct' : 'incorrect',
          markedForReview: idx === 2,
          explanation: q.explanation || 'Detailed mathematical/grammatical rationale.',
          formula: q.formula,
          table: q.table,
        });
      });
    });

    return generated;
  },

  /**
   * Fetches mock test history log.
   */
  async getMockHistory(): Promise<MockTestHistoryItem[]> {
    await new Promise((r) => setTimeout(r, 80));
    try {
      const stored = localStorage.getItem(STORAGE_HISTORY_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {}
    return [...MOCK_TEST_HISTORY];
  },

  /**
   * Resets and starts a brand new attempt for an existing mock test without overwriting past history.
   */
  async retakeMockTest(testId: string): Promise<MockTestSession> {
    return this.startMockTest(testId);
  },

  /**
   * Checks if there is an in-progress session to resume.
   */
  async getActiveSession(): Promise<MockTestSession | null> {
    try {
      const activeId = localStorage.getItem('gowow_active_mock_session_id');
      if (activeId) {
        return this.getMockSession(activeId);
      }
    } catch (e) {}
    return null;
  },

  /**
   * Discards an in-progress session.
   */
  async discardMockSession(sessionId: string): Promise<void> {
    activeSessions.delete(sessionId);
    try {
      localStorage.removeItem(`${STORAGE_SESSION_PREFIX}${sessionId}`);
      localStorage.removeItem('gowow_active_mock_session_id');
    } catch (e) {}
  },
};
