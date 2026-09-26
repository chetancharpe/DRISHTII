import {
  PracticeHistoryItem,
  PracticeQuestion,
  PracticeResult,
  PracticeSession,
  PracticeSessionFilter,
  PracticeWeakTopic,
} from '../types/practice';
import { MOCK_PRACTICE_HISTORY, MOCK_PRACTICE_QUESTIONS } from '../data/practiceData';

/**
 * Service abstraction for practice sessions, questions, feedback, and history.
 * Mirrors future FastAPI REST endpoints:
 * - GET /api/questions?subject=...&topic=...
 * - POST /api/practice/sessions
 * - GET /api/practice/sessions/:id
 * - POST /api/practice/sessions/:id/answers
 * - POST /api/practice/sessions/:id/finish
 * - GET /api/practice/sessions/:id/result
 * - GET /api/practice/history
 */

const SIMULATED_LATENCY_MS = 100;

// In-memory sessions store for client-side prototype sessions
const activeSessions: Map<string, PracticeSession> = new Map();
const completedResults: Map<string, PracticeResult> = new Map();

export const practiceService = {
  /**
   * Filters questions by subject, topic, and difficulty.
   */
  async getQuestions(filter: Partial<PracticeSessionFilter>): Promise<PracticeQuestion[]> {
    await new Promise((r) => setTimeout(r, SIMULATED_LATENCY_MS));
    return MOCK_PRACTICE_QUESTIONS.filter((q) => {
      if (filter.subjectId && filter.subjectId !== 'all' && q.subjectId !== filter.subjectId) return false;
      if (filter.topicId && filter.topicId !== 'all' && q.topicId !== filter.topicId) return false;
      if (filter.difficulty && filter.difficulty !== 'all' && q.difficulty !== filter.difficulty) return false;
      return true;
    });
  },

  /**
   * Initializes a new practice session with the requested filter criteria.
   */
  async startPracticeSession(filter: PracticeSessionFilter): Promise<PracticeSession> {
    await new Promise((r) => setTimeout(r, SIMULATED_LATENCY_MS));

    // Get matching questions or fallback to general pool if topic has limited set
    let matching = MOCK_PRACTICE_QUESTIONS.filter((q) => {
      if (filter.subjectId && filter.subjectId !== 'all' && q.subjectId !== filter.subjectId) return false;
      if (filter.topicId && filter.topicId !== 'all' && q.topicId !== filter.topicId) return false;
      if (filter.difficulty && filter.difficulty !== 'all' && q.difficulty !== filter.difficulty) return false;
      return true;
    });

    if (matching.length === 0) {
      matching = MOCK_PRACTICE_QUESTIONS.filter((q) => {
        if (filter.subjectId && filter.subjectId !== 'all') return q.subjectId === filter.subjectId;
        return true;
      });
    }

    if (matching.length === 0) {
      matching = [...MOCK_PRACTICE_QUESTIONS];
    }

    // Limit to requested count
    const sessionQuestions = matching.slice(0, filter.questionCount || 10);
    const sessionId = `practice-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const subjectName = sessionQuestions[0]?.subjectName || 'Practice';
    const topicName = sessionQuestions[0]?.topicName || 'General Topic';

    const newSession: PracticeSession = {
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
      timeLimitSeconds: filter.questionCount ? filter.questionCount * 90 : 600, // 1.5 mins per question
    };

    activeSessions.set(sessionId, newSession);
    return { ...newSession };
  },

  /**
   * Retrieves an active or completed practice session by ID.
   */
  async getPracticeSession(sessionId: string): Promise<PracticeSession | null> {
    await new Promise((r) => setTimeout(r, SIMULATED_LATENCY_MS));
    const session = activeSessions.get(sessionId);
    if (!session) {
      // Create a default session for demo/direct URL access
      const defaultFilter: PracticeSessionFilter = {
        examId: 'cds',
        subjectId: 'mathematics',
        topicId: 'percentages',
        difficulty: 'medium',
        questionCount: 5,
      };
      const fallback = await practiceService.startPracticeSession(defaultFilter);
      return fallback;
    }
    return { ...session };
  },

  /**
   * Submits an answer for a specific question within a practice session.
   */
  async submitAnswer(
    sessionId: string,
    questionId: string,
    selectedOptionIds: string[],
    timeSpentSeconds: number = 0
  ): Promise<{ session: PracticeSession; isCorrect: boolean; explanation: string }> {
    await new Promise((r) => setTimeout(r, 60));
    const session = activeSessions.get(sessionId);
    if (!session) throw new Error('Practice session not found.');

    const question = session.questions.find((q) => q.id === questionId);
    if (!question) throw new Error('Question not found in this practice session.');

    const isCorrect =
      selectedOptionIds.length === question.correctOptionIds.length &&
      selectedOptionIds.every((id) => question.correctOptionIds.includes(id));

    session.answers[questionId] = {
      selectedOptionIds,
      isSubmitted: true,
      isCorrect,
      isSkipped: false,
      timeSpentSeconds,
    };

    activeSessions.set(sessionId, session);

    return {
      session: { ...session },
      isCorrect,
      explanation: question.explanation,
    };
  },

  /**
   * Marks a question as skipped for now.
   */
  async skipQuestion(sessionId: string, questionId: string): Promise<PracticeSession> {
    await new Promise((r) => setTimeout(r, 40));
    const session = activeSessions.get(sessionId);
    if (!session) throw new Error('Practice session not found.');

    session.answers[questionId] = {
      selectedOptionIds: [],
      isSubmitted: false,
      isCorrect: false,
      isSkipped: true,
      timeSpentSeconds: 0,
    };

    activeSessions.set(sessionId, session);
    return { ...session };
  },

  /**
   * Concludes a practice session and generates comprehensive results.
   */
  async finishPracticeSession(sessionId: string, timeElapsedSeconds: number): Promise<PracticeResult> {
    await new Promise((r) => setTimeout(r, SIMULATED_LATENCY_MS));
    const session = activeSessions.get(sessionId);
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

      return {
        questionId: q.id,
        questionIndex: idx + 1,
        questionText: q.questionText,
        type: q.type,
        difficulty: q.difficulty,
        userSelectedOptionIds: ans?.selectedOptionIds || [],
        correctOptionIds: q.correctOptionIds,
        isCorrect,
        isSkipped,
        explanation: q.explanation,
        options: q.options,
      };
    });

    const totalQuestions = session.questions.length;
    const accuracyPercent = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    const mins = Math.floor(timeElapsedSeconds / 60);
    const secs = timeElapsedSeconds % 60;
    const timeUsedFormatted = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

    // Rule-based demo weak topics
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

    const summaryTitle = accuracyPercent >= 80 ? 'Excellent Practice Session' : accuracyPercent >= 60 ? 'Good Progress' : 'Practice Completed';
    const summaryMessage = `You answered ${correctCount} of ${totalQuestions} questions correctly with ${accuracyPercent}% accuracy.`;
    const recommendedNextStep =
      accuracyPercent >= 80
        ? `Great conceptual grasp! You are ready to explore the next subtopic or attempt a full mock test.`
        : `Review the detailed explanations below and reinforce your understanding with an additional 5-question practice set.`;

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

    completedResults.set(sessionId, result);
    return result;
  },

  /**
   * Retrieves results for a completed practice session.
   */
  async getPracticeResult(sessionId: string): Promise<PracticeResult | null> {
    await new Promise((r) => setTimeout(r, SIMULATED_LATENCY_MS));
    const cached = completedResults.get(sessionId);
    if (cached) return { ...cached };

    // Fallback demo result for direct link access
    const demoQuestions = MOCK_PRACTICE_QUESTIONS.slice(0, 5);
    const fallback: PracticeResult = {
      sessionId,
      subjectId: 'mathematics',
      subjectName: 'Mathematics',
      topicId: 'percentages',
      topicName: 'Percentages',
      difficulty: 'medium',
      totalQuestions: 5,
      correctCount: 4,
      incorrectCount: 1,
      skippedCount: 0,
      accuracyPercent: 80,
      timeUsedSeconds: 245,
      timeUsedFormatted: '4m 05s',
      summaryTitle: 'Good Progress',
      summaryMessage: 'You answered 4 of 5 questions correctly.',
      recommendedNextStep: 'Review the Percentages concept notes and attempt a 10-question set.',
      weakTopics: [],
      reviews: demoQuestions.map((q, idx) => ({
        questionId: q.id,
        questionIndex: idx + 1,
        questionText: q.questionText,
        type: q.type,
        difficulty: q.difficulty,
        userSelectedOptionIds: idx === 1 ? ['A'] : q.correctOptionIds,
        correctOptionIds: q.correctOptionIds,
        isCorrect: idx !== 1,
        isSkipped: false,
        explanation: q.explanation,
        options: q.options,
      })),
    };

    return fallback;
  },

  /**
   * Fetches the candidate's prior practice history.
   */
  async getPracticeHistory(): Promise<PracticeHistoryItem[]> {
    await new Promise((r) => setTimeout(r, SIMULATED_LATENCY_MS));
    return [...MOCK_PRACTICE_HISTORY];
  },
};
