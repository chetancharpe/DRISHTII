import {
  PracticeDifficulty,
  PracticeHistoryItem,
  PracticeQuestion,
  PracticeResult,
  PracticeSession,
  PracticeSessionFilter,
  PracticeWeakTopic,
} from '../types/practice';
import { apiClient } from './api';
import { FALLBACK_PRACTICE_QUESTIONS } from '../fixtures/curriculumFixtures';

/**
 * Service abstraction for practice sessions, questions, feedback, and history.
 * Connected directly to FastAPI endpoints with seamless offline & demo fallback:
 * - GET /practice/questions?subjectId=...&topicId=...&difficulty=...
 * - POST /practice/verify-answer
 * - GET /practice/history
 */

const STORAGE_PRACTICE_SESSION_PREFIX = 'drishti_practice_session_';
const STORAGE_PRACTICE_RESULT_PREFIX = 'drishti_practice_result_';
const STORAGE_PRACTICE_HISTORY_KEY = 'drishti_practice_history';

// In-memory cache synced with localStorage
const activeSessions: Map<string, PracticeSession & {
  explanations?: Record<string, string>;
  correctOptions?: Record<string, string[]>;
}> = new Map();
const completedResults: Map<string, PracticeResult> = new Map();

function getStoredPracticeSession(sessionId: string) {
  try {
    const raw = localStorage.getItem(`${STORAGE_PRACTICE_SESSION_PREFIX}${sessionId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setStoredPracticeSession(session: PracticeSession) {
  try {
    localStorage.setItem(`${STORAGE_PRACTICE_SESSION_PREFIX}${session.id}`, JSON.stringify(session));
  } catch {
    // Ignore storage quota
  }
}

function getStoredPracticeResult(sessionId: string): PracticeResult | null {
  try {
    const raw = localStorage.getItem(`${STORAGE_PRACTICE_RESULT_PREFIX}${sessionId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setStoredPracticeResult(result: PracticeResult) {
  try {
    localStorage.setItem(`${STORAGE_PRACTICE_RESULT_PREFIX}${result.sessionId}`, JSON.stringify(result));
  } catch {
    // Ignore
  }
}

export const practiceService = {
  /**
   * Filters questions by subject, topic, and difficulty with robust fallback.
   */
  async getQuestions(filter: Partial<PracticeSessionFilter>): Promise<PracticeQuestion[]> {
    try {
      const params = new URLSearchParams();
      if (filter.subjectId && filter.subjectId !== 'all') params.append('subjectId', filter.subjectId);
      if (filter.topicId && filter.topicId !== 'all') params.append('topicId', filter.topicId);
      if (filter.difficulty && filter.difficulty !== 'all') params.append('difficulty', filter.difficulty);
      if (filter.questionCount) params.append('limit', String(filter.questionCount));

      const query = params.toString() ? `?${params.toString()}` : '';
      const remoteQuestions = await apiClient.get<PracticeQuestion[]>(`/practice/questions${query}`);
      if (Array.isArray(remoteQuestions) && remoteQuestions.length > 0) {
        return remoteQuestions;
      }
    } catch (e) {
      console.warn('Backend /practice/questions unavailable, using curated question pool:', e);
    }

    // Curated fallback pool
    let filtered = FALLBACK_PRACTICE_QUESTIONS;
    if (filter.subjectId && filter.subjectId !== 'all') {
      filtered = filtered.filter((q) => q.subjectId === filter.subjectId);
    }
    if (filter.topicId && filter.topicId !== 'all') {
      filtered = filtered.filter((q) => q.topicId === filter.topicId);
    }
    if (filter.difficulty && filter.difficulty !== 'all') {
      filtered = filtered.filter((q) => q.difficulty === filter.difficulty);
    }
    if (filtered.length === 0) {
      filtered = FALLBACK_PRACTICE_QUESTIONS;
    }

    const limit = filter.questionCount || 5;
    return filtered.slice(0, limit);
  },

  /**
   * Initializes a new practice session.
   */
  async startPracticeSession(filter: PracticeSessionFilter, forcedSessionId?: string): Promise<PracticeSession> {
    const sessionQuestions = await this.getQuestions(filter);

    const sessionId = forcedSessionId || `practice-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const subjectName = sessionQuestions[0]?.subjectName || 'Practice';
    const topicName = sessionQuestions[0]?.topicName || 'General Topic';

    const newSession: PracticeSession & {
      explanations?: Record<string, string>;
      correctOptions?: Record<string, string[]>;
    } = {
      id: sessionId,
      subjectId: filter.subjectId,
      subjectName,
      topicId: filter.topicId,
      topicName,
      difficulty: filter.difficulty,
      totalQuestions: sessionQuestions.length,
      questions: sessionQuestions,
      answers: {},
      currentQuestionIndex: 0,
      status: 'in_progress',
      startedAt: new Date().toISOString(),
      timeElapsedSeconds: 0,
      timeLimitSeconds: filter.questionCount ? filter.questionCount * 90 : 600,
      explanations: {},
      correctOptions: {},
    };

    // Pre-populate explanation and options if available on question fixtures
    sessionQuestions.forEach((q) => {
      if ((q as any).explanation && newSession.explanations) {
        newSession.explanations[q.id] = (q as any).explanation;
      }
      if ((q as any).correctOptionIds && newSession.correctOptions) {
        newSession.correctOptions[q.id] = (q as any).correctOptionIds;
      }
    });

    activeSessions.set(sessionId, newSession);
    setStoredPracticeSession(newSession);

    return { ...newSession };
  },

  /**
   * Retrieves an active or completed practice session by ID.
   */
  async getPracticeSession(sessionId: string): Promise<PracticeSession | null> {
    let session = activeSessions.get(sessionId);
    if (!session) {
      session = getStoredPracticeSession(sessionId);
      if (session) {
        activeSessions.set(sessionId, session);
      }
    }

    if (!session) {
      // Re-initialize default session with matching sessionId so route does not mismatch
      const defaultFilter: PracticeSessionFilter = {
        examId: 'cds',
        subjectId: 'mathematics',
        topicId: 'percentages',
        difficulty: 'medium',
        questionCount: 5,
      };
      return practiceService.startPracticeSession(defaultFilter, sessionId);
    }
    return { ...session };
  },

  /**
   * Submits an answer for a specific question within a practice session.
   * Uses authoritative server verification if online, and local algorithmic verification fallback.
   */
  async submitAnswer(
    sessionId: string,
    questionId: string,
    selectedOptionIds: string[],
    timeSpentSeconds: number = 0
  ): Promise<{ session: PracticeSession; isCorrect: boolean; explanation: string }> {
    let session = await this.getPracticeSession(sessionId);
    if (!session) throw new Error('Practice session not found.');

    let isCorrect = false;
    let correctOptionIds: string[] = [];
    let explanation = '';

    try {
      // Attempt authoritative server-side answer verification
      const verification = await apiClient.post<{
        question_id: string;
        is_correct: boolean;
        correct_option_ids: string[];
        explanation: string;
      }>('/practice/verify-answer', {
        question_id: questionId,
        selected_option_ids: selectedOptionIds,
        time_spent_seconds: timeSpentSeconds,
      });

      isCorrect = verification.is_correct;
      correctOptionIds = verification.correct_option_ids || [];
      explanation = verification.explanation || '';
    } catch (e) {
      console.warn('Backend /practice/verify-answer unavailable, using local pedagogical verification:', e);

      // Algorithmic local evaluation
      const currentQ =
        session.questions.find((q) => q.id === questionId) ||
        FALLBACK_PRACTICE_QUESTIONS.find((q) => q.id === questionId);

      const knownCorrect: string[] =
        session.correctOptions?.[questionId] ||
        (currentQ as any)?.correctOptionIds ||
        ['B'];

      explanation =
        session.explanations?.[questionId] ||
        (currentQ as any)?.explanation ||
        'Concept review: ensure base formulas and conversion multipliers are followed.';

      correctOptionIds = knownCorrect;
      isCorrect =
        selectedOptionIds.length === knownCorrect.length &&
        selectedOptionIds.every((id) => knownCorrect.includes(id));
    }

    session.answers[questionId] = {
      selectedOptionIds,
      isSubmitted: true,
      isCorrect,
      isSkipped: false,
      timeSpentSeconds,
    };

    if (!session.explanations) session.explanations = {};
    if (!session.correctOptions) session.correctOptions = {};

    session.explanations[questionId] = explanation;
    session.correctOptions[questionId] = correctOptionIds;

    activeSessions.set(sessionId, session);
    setStoredPracticeSession(session);

    return {
      session: { ...session },
      isCorrect,
      explanation,
    };
  },

  /**
   * Marks a question as skipped.
   */
  async skipQuestion(sessionId: string, questionId: string): Promise<PracticeSession> {
    const session = await this.getPracticeSession(sessionId);
    if (!session) throw new Error('Practice session not found.');

    session.answers[questionId] = {
      selectedOptionIds: [],
      isSubmitted: false,
      isCorrect: false,
      isSkipped: true,
      timeSpentSeconds: 0,
    };

    activeSessions.set(sessionId, session);
    setStoredPracticeSession(session);
    return { ...session };
  },

  /**
   * Concludes a practice session and generates comprehensive results.
   */
  async finishPracticeSession(sessionId: string, timeElapsedSeconds: number): Promise<PracticeResult> {
    const session = await this.getPracticeSession(sessionId);
    if (!session) throw new Error('Practice session not found.');

    session.status = 'completed';
    session.completedAt = new Date().toISOString();
    session.timeElapsedSeconds = timeElapsedSeconds;

    let correctCount = 0;
    let incorrectCount = 0;
    let skippedCount = 0;

    const reviews = session.questions.map((q, idx) => {
      const ans = session.answers[q.id];
      const isSubmitted = ans?.isSubmitted || false;
      const isSkipped = ans?.isSkipped || !isSubmitted;
      const isCorrect = ans?.isCorrect || false;

      if (isSkipped) {
        skippedCount++;
      } else if (isCorrect) {
        correctCount++;
      } else {
        incorrectCount++;
      }

      const qExplanation =
        session.explanations?.[q.id] ||
        (q as any).explanation ||
        'Pedagogical explanation available upon question attempt.';
      const qCorrectOptions =
        session.correctOptions?.[q.id] ||
        (q as any).correctOptionIds ||
        [];

      return {
        questionId: q.id,
        questionIndex: idx + 1,
        questionText: q.questionText,
        type: q.type,
        difficulty: q.difficulty,
        userSelectedOptionIds: ans?.selectedOptionIds || [],
        correctOptionIds: qCorrectOptions,
        isCorrect,
        isSkipped,
        explanation: qExplanation,
        options: q.options,
      };
    });

    const totalQuestions = session.questions.length;
    const accuracyPercent = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    const mins = Math.floor(timeElapsedSeconds / 60);
    const secs = timeElapsedSeconds % 60;
    const timeUsedFormatted = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

    const weakTopics: PracticeWeakTopic[] = [];
    if (accuracyPercent < 75) {
      weakTopics.push({
        topicId: session.topicId,
        topicName: session.topicName,
        subjectId: session.subjectId,
        subjectName: session.subjectName,
        accuracyPercent,
        totalAttempted: totalQuestions - skippedCount,
        recommendation: `Review the foundational formulas and attempt an Easy-level set in ${session.topicName}.`,
      });
    }

    const summaryTitle =
      accuracyPercent >= 80 ? 'Excellent Practice Session' : accuracyPercent >= 60 ? 'Good Progress' : 'Practice Completed';
    const summaryMessage = `You answered ${correctCount} of ${totalQuestions} questions correctly with ${accuracyPercent}% accuracy.`;
    const recommendedNextStep =
      accuracyPercent >= 80
        ? `Great conceptual grasp! You are ready to explore the next subtopic or attempt a full mock test.`
        : `Review the detailed explanations below and reinforce your understanding with an additional practice set.`;

    const result: PracticeResult = {
      sessionId,
      subjectId: session.subjectId,
      subjectName: session.subjectName,
      topicId: session.topicId,
      topicName: session.topicName,
      difficulty: session.difficulty,
      totalQuestions,
      correctCount,
      incorrectCount,
      skippedCount,
      accuracyPercent,
      timeUsedSeconds: timeElapsedSeconds,
      timeUsedFormatted,
      summaryTitle,
      summaryMessage,
      recommendedNextStep,
      weakTopics,
      reviews,
    };

    activeSessions.set(sessionId, session);
    setStoredPracticeSession(session);
    completedResults.set(sessionId, result);
    setStoredPracticeResult(result);

    // Save history item locally
    try {
      const historyDifficulty: PracticeDifficulty =
        session.difficulty === 'all' ? 'medium' : session.difficulty;
      const historyItem: PracticeHistoryItem = {
        id: `hist-${sessionId}`,
        sessionId,
        date: session.completedAt || new Date().toISOString(),
        formattedDate: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        subjectId: session.subjectId,
        subjectName: session.subjectName,
        topicId: session.topicId,
        topicName: session.topicName,
        difficulty: historyDifficulty,
        questionsCount: totalQuestions,
        scoreFormatted: `${correctCount} / ${totalQuestions}`,
        accuracyPercent,
        timeUsedFormatted,
      };
      const existingHistory = JSON.parse(localStorage.getItem(STORAGE_PRACTICE_HISTORY_KEY) || '[]');
      existingHistory.unshift(historyItem);
      localStorage.setItem(STORAGE_PRACTICE_HISTORY_KEY, JSON.stringify(existingHistory.slice(0, 50)));
    } catch {
      // Ignore
    }

    return result;
  },

  /**
   * Retrieves results for a completed practice session.
   */
  async getPracticeResult(sessionId: string): Promise<PracticeResult | null> {
    const cached = completedResults.get(sessionId) || getStoredPracticeResult(sessionId);
    if (cached) return { ...cached };
    return null;
  },

  /**
   * Fetches the candidate's prior practice history.
   */
  async getPracticeHistory(): Promise<PracticeHistoryItem[]> {
    try {
      const remote = await apiClient.get<PracticeHistoryItem[]>('/practice/history');
      if (Array.isArray(remote) && remote.length > 0) {
        return remote;
      }
    } catch {
      // Fallback
    }

    try {
      const local = localStorage.getItem(STORAGE_PRACTICE_HISTORY_KEY);
      if (local) {
        return JSON.parse(local);
      }
    } catch {
      // Ignore
    }

    return [];
  },
};
