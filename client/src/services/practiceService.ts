import {
  PracticeHistoryItem,
  PracticeQuestion,
  PracticeResult,
  PracticeSession,
  PracticeSessionFilter,
  PracticeWeakTopic,
} from '../types/practice';
import { apiClient } from './api';

/**
 * Service abstraction for practice sessions, questions, feedback, and history.
 * Connected directly to FastAPI endpoints:
 * - GET /practice/questions?subjectId=...&topicId=...&difficulty=...
 * - POST /practice/verify-answer
 * - GET /practice/history
 *
 * Client NEVER receives correct answers or explanations prior to submitting an answer!
 */

// In-memory sessions store for active candidate practice sessions
const activeSessions: Map<string, PracticeSession & {
  explanations?: Record<string, string>;
  correctOptions?: Record<string, string[]>;
}> = new Map();
const completedResults: Map<string, PracticeResult> = new Map();

export const practiceService = {
  /**
   * Filters questions by subject, topic, and difficulty from real backend.
   */
  async getQuestions(filter: Partial<PracticeSessionFilter>): Promise<PracticeQuestion[]> {
    const params = new URLSearchParams();
    if (filter.subjectId && filter.subjectId !== 'all') params.append('subjectId', filter.subjectId);
    if (filter.topicId && filter.topicId !== 'all') params.append('topicId', filter.topicId);
    if (filter.difficulty && filter.difficulty !== 'all') params.append('difficulty', filter.difficulty);
    if (filter.questionCount) params.append('limit', String(filter.questionCount));

    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<PracticeQuestion[]>(`/practice/questions${query}`);
  },

  /**
   * Initializes a new practice session with sanitized questions from backend.
   */
  async startPracticeSession(filter: PracticeSessionFilter): Promise<PracticeSession> {
    const sessionQuestions = await this.getQuestions(filter);

    const sessionId = `practice-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
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

    activeSessions.set(sessionId, newSession);
    return { ...newSession };
  },

  /**
   * Retrieves an active or completed practice session by ID.
   */
  async getPracticeSession(sessionId: string): Promise<PracticeSession | null> {
    const session = activeSessions.get(sessionId);
    if (!session) {
      const defaultFilter: PracticeSessionFilter = {
        examId: 'cds',
        subjectId: 'mathematics',
        topicId: 'percentages',
        difficulty: 'medium',
        questionCount: 5,
      };
      return practiceService.startPracticeSession(defaultFilter);
    }
    return { ...session };
  },

  /**
   * Submits an answer for a specific question within a practice session.
   * Authenticated server-side verification: backend evaluates answer, updates topic progress,
   * and returns the explanation and correct answer key.
   */
  async submitAnswer(
    sessionId: string,
    questionId: string,
    selectedOptionIds: string[],
    timeSpentSeconds: number = 0
  ): Promise<{ session: PracticeSession; isCorrect: boolean; explanation: string }> {
    const session = activeSessions.get(sessionId);
    if (!session) throw new Error('Practice session not found.');

    // Authoritative server-side answer verification
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

    session.answers[questionId] = {
      selectedOptionIds,
      isSubmitted: true,
      isCorrect: verification.is_correct,
      isSkipped: false,
      timeSpentSeconds,
    };

    if (!session.explanations) session.explanations = {};
    if (!session.correctOptions) session.correctOptions = {};

    session.explanations[questionId] = verification.explanation;
    session.correctOptions[questionId] = verification.correct_option_ids;

    activeSessions.set(sessionId, session);

    return {
      session: { ...session },
      isCorrect: verification.is_correct,
      explanation: verification.explanation,
    };
  },

  /**
   * Marks a question as skipped.
   */
  async skipQuestion(sessionId: string, questionId: string): Promise<PracticeSession> {
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
        correctOptionIds: session.correctOptions?.[q.id] || [],
        isCorrect,
        isSkipped,
        explanation: session.explanations?.[q.id] || 'Pedagogical explanation available upon question attempt.',
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

    const summaryTitle = accuracyPercent >= 80 ? 'Excellent Practice Session' : accuracyPercent >= 60 ? 'Good Progress' : 'Practice Completed';
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

    completedResults.set(sessionId, result);
    return result;
  },

  /**
   * Retrieves results for a completed practice session.
   */
  async getPracticeResult(sessionId: string): Promise<PracticeResult | null> {
    const cached = completedResults.get(sessionId);
    if (cached) return { ...cached };

    // Fallback result if accessed directly
    return null;
  },

  /**
   * Fetches the candidate's prior practice history from real backend.
   */
  async getPracticeHistory(): Promise<PracticeHistoryItem[]> {
    return apiClient.get<PracticeHistoryItem[]>('/practice/history');
  },
};
