import {
  Exam,
  ExamSession,
  ExamEligibility,
  ExamSubmission,
  ExamSyncState,
} from '../types/exam';
import { DEMO_EXAMS } from '../fixtures/examFixtures';

/**
 * GoWow Live Examination Service
 * 
 * ARCHITECTURAL NOTICE:
 * This service implements the frontend architecture and simulated API boundaries
 * corresponding to the future FastAPI backend routes:
 * 
 * GET   /api/exams
 * GET   /api/exams/:examId
 * GET   /api/exams/:examId/eligibility
 * POST  /api/exams/:examId/sessions
 * GET   /api/exam-sessions/:sessionId
 * PATCH /api/exam-sessions/:sessionId/answers/:questionId
 * POST  /api/exam-sessions/:sessionId/sync
 * POST  /api/exam-sessions/:sessionId/submit
 * GET   /api/exam-sessions/:sessionId/status
 * 
 * The browser clock and local storage are NEVER authoritative for official
 * examination scoring, time verification, candidate identity, or submission integrity.
 */

const STORAGE_SESSION_PREFIX = 'gowow_exam_session_';
const STORAGE_SUBMISSION_PREFIX = 'gowow_exam_submission_';

class ExamService {
  private networkSimulationOnline = true;

  /**
   * Toggle simulated connection for network failure/recovery tests
   */
  public setNetworkOnline(isOnline: boolean) {
    this.networkSimulationOnline = isOnline;
  }

  public isNetworkOnline(): boolean {
    return this.networkSimulationOnline;
  }

  /**
   * Retrieve all examinations assigned or available
   */
  public async getExams(): Promise<Exam[]> {
    await this.simulateLatency(150);
    // Sync with any existing local submission states
    return DEMO_EXAMS.map((exam) => {
      const sub = this.getStoredSubmission(exam.id);
      if (sub) {
        return { ...exam, status: 'submitted' };
      }
      const activeSession = this.getStoredSession(exam.id);
      if (activeSession && activeSession.status === 'ACTIVE') {
        return { ...exam, status: 'in_progress' };
      }
      return exam;
    });
  }

  /**
   * Retrieve a single examination by ID
   */
  public async getExam(examId: string): Promise<Exam | null> {
    await this.simulateLatency(120);
    const exam = DEMO_EXAMS.find((e) => e.id === examId);
    if (!exam) return null;

    const sub = this.getStoredSubmission(exam.id);
    if (sub) {
      return { ...exam, status: 'submitted' };
    }
    const activeSession = this.getStoredSession(exam.id);
    if (activeSession && activeSession.status === 'ACTIVE') {
      return { ...exam, status: 'in_progress' };
    }
    return exam;
  }

  /**
   * Check candidate eligibility for the examination
   */
  public async getExamEligibility(examId: string): Promise<ExamEligibility> {
    await this.simulateLatency(180);
    const exam = DEMO_EXAMS.find((e) => e.id === examId);
    if (!exam) {
      return {
        examId,
        isEligible: false,
        reason: 'Examination record not found.',
        candidateName: 'Candidate',
        rollNumber: 'UNKNOWN',
        category: 'Standard',
        verificationStatus: 'ineligible',
      };
    }
    return exam.eligibility;
  }

  /**
   * Request backend to initiate a new live examination session.
   * Calculates authoritative serverStartTime and serverEndTime.
   */
  public async createExamSession(examId: string): Promise<ExamSession> {
    await this.simulateLatency(300);
    const exam = DEMO_EXAMS.find((e) => e.id === examId);
    if (!exam) {
      throw new Error(`Examination ${examId} not found.`);
    }

    // Check if previous session exists and is still valid
    const existing = this.getStoredSession(examId);
    if (existing && existing.status === 'ACTIVE' && Date.now() < existing.serverEndTime) {
      return existing;
    }

    const now = Date.now();
    const serverDurationMs = exam.config.durationMinutes * 60 * 1000;
    const serverEndTime = now + serverDurationMs;

    const newSession: ExamSession = {
      sessionId: `sess-${examId}-${now}`,
      examId,
      candidateId: exam.eligibility.rollNumber,
      status: 'ACTIVE',
      serverStartTime: now,
      serverEndTime,
      currentSectionId: exam.config.sections[0]?.id || '',
      currentQuestionId: exam.config.sections[0]?.questions[0]?.id || '',
      answers: {},
      unsyncedQuestionIds: [],
      lastSyncTimestamp: now,
    };

    this.saveStoredSession(newSession);
    return newSession;
  }

  /**
   * Retrieve active session state
   */
  public async getExamSession(examId: string): Promise<ExamSession | null> {
    await this.simulateLatency(120);
    const session = this.getStoredSession(examId);
    if (!session) return null;

    // Check if serverEndTime expired
    if (session.status === 'ACTIVE' && Date.now() >= session.serverEndTime) {
      session.status = 'EXPIRED';
      this.saveStoredSession(session);
    }

    return session;
  }

  /**
   * Save an answer to the server session (with sync state tracking)
   */
  public async saveAnswer(
    examId: string,
    questionId: string,
    selectedOptions: string[],
    isMarkedForReview: boolean
  ): Promise<{ session: ExamSession; syncState: ExamSyncState }> {
    const session = this.getStoredSession(examId);
    if (!session) {
      throw new Error(`Session for exam ${examId} not found.`);
    }

    if (session.status !== 'ACTIVE') {
      throw new Error(`Cannot modify answers in ${session.status} session.`);
    }

    const now = Date.now();
    const isOnline = this.networkSimulationOnline;

    session.answers[questionId] = {
      questionId,
      selectedOptions,
      isMarkedForReview,
      savedAt: now,
      syncState: isOnline ? 'synced' : 'pending',
    };

    if (isOnline) {
      session.unsyncedQuestionIds = session.unsyncedQuestionIds.filter((id) => id !== questionId);
      session.lastSyncTimestamp = now;
    } else if (!session.unsyncedQuestionIds.includes(questionId)) {
      session.unsyncedQuestionIds.push(questionId);
    }

    this.saveStoredSession(session);

    // Simulate server dispatch latency
    await this.simulateLatency(isOnline ? 160 : 80);

    return {
      session,
      syncState: isOnline ? 'SYNCED' : 'OFFLINE',
    };
  }

  /**
   * Toggle Mark for Review flag for a question
   */
  public async markQuestionForReview(
    examId: string,
    questionId: string,
    isMarked: boolean
  ): Promise<ExamSession> {
    const session = this.getStoredSession(examId);
    if (!session) {
      throw new Error(`Session for exam ${examId} not found.`);
    }

    const currentAnswer = session.answers[questionId] || {
      questionId,
      selectedOptions: [],
      isMarkedForReview: isMarked,
      savedAt: Date.now(),
      syncState: 'synced',
    };

    currentAnswer.isMarkedForReview = isMarked;
    currentAnswer.savedAt = Date.now();
    session.answers[questionId] = currentAnswer;

    this.saveStoredSession(session);
    return session;
  }

  /**
   * Retry synchronizing any unconfirmed answers with the simulated server
   */
  public async retrySync(examId: string): Promise<{ success: boolean; session: ExamSession }> {
    await this.simulateLatency(350);
    const session = this.getStoredSession(examId);
    if (!session) {
      throw new Error(`Session for exam ${examId} not found.`);
    }

    if (!this.networkSimulationOnline) {
      return { success: false, session };
    }

    // Mark all pending answers as synced
    session.unsyncedQuestionIds.forEach((qId) => {
      if (session.answers[qId]) {
        session.answers[qId].syncState = 'synced';
      }
    });
    session.unsyncedQuestionIds = [];
    session.lastSyncTimestamp = Date.now();
    this.saveStoredSession(session);

    return { success: true, session };
  }

  /**
   * Submit examination to the server
   */
  public async submitExam(examId: string): Promise<ExamSubmission> {
    await this.simulateLatency(450);

    if (!this.networkSimulationOnline) {
      throw new Error('Network connection is currently unavailable. Please verify connectivity and retry.');
    }

    const exam = DEMO_EXAMS.find((e) => e.id === examId);
    if (!exam) {
      throw new Error(`Examination ${examId} not found.`);
    }

    const session = this.getStoredSession(examId);
    const answers = session?.answers || {};

    let answeredCount = 0;
    let markedCount = 0;

    Object.values(answers).forEach((ans) => {
      if (ans.selectedOptions.length > 0) answeredCount++;
      if (ans.isMarkedForReview) markedCount++;
    });

    const unansweredCount = exam.config.totalQuestions - answeredCount;
    const unsynchronizedCount = session?.unsyncedQuestionIds.length || 0;

    const submissionId = `DEMO-EXAM-${Math.floor(100000 + Math.random() * 900000)}`;
    const nowIso = new Date().toISOString();

    const submission: ExamSubmission = {
      submissionId,
      examId,
      candidateId: exam.eligibility.rollNumber,
      submittedAt: nowIso,
      status: 'confirmed',
      totalQuestions: exam.config.totalQuestions,
      answeredCount,
      unansweredCount,
      markedCount,
      unsynchronizedCount,
      resultAccess: exam.config.resultAccess,
      resultNotice:
        exam.config.resultAccess === 'showImmediately'
          ? 'Results are available for immediate review.'
          : 'Your examination was submitted successfully. Official results will be released after evaluation by GoWow Demo Authority.',
    };

    // Store submission and update session status to SUBMITTED
    this.saveStoredSubmission(submission);
    if (session) {
      session.status = 'SUBMITTED';
      session.submissionId = submissionId;
      session.submittedAt = nowIso;
      this.saveStoredSession(session);
    }

    return submission;
  }

  /**
   * Retrieve submission status
   */
  public async getSubmissionStatus(examId: string): Promise<ExamSubmission | null> {
    await this.simulateLatency(150);
    return this.getStoredSubmission(examId);
  }

  /**
   * Reset / Discard active session (for testing/demo purposes)
   */
  public async discardExamSession(examId: string): Promise<void> {
    try {
      localStorage.removeItem(`${STORAGE_SESSION_PREFIX}${examId}`);
      localStorage.removeItem(`${STORAGE_SUBMISSION_PREFIX}${examId}`);
    } catch (e) {
      console.warn('Could not clear local session storage', e);
    }
  }

  // --- Internal Storage Helpers (Client-side Simulation only) ---

  private getStoredSession(examId: string): ExamSession | null {
    try {
      const data = localStorage.getItem(`${STORAGE_SESSION_PREFIX}${examId}`);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  private saveStoredSession(session: ExamSession): void {
    try {
      localStorage.setItem(`${STORAGE_SESSION_PREFIX}${session.examId}`, JSON.stringify(session));
    } catch (e) {
      console.warn('Could not persist session to localStorage', e);
    }
  }

  private getStoredSubmission(examId: string): ExamSubmission | null {
    try {
      const data = localStorage.getItem(`${STORAGE_SUBMISSION_PREFIX}${examId}`);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  private saveStoredSubmission(submission: ExamSubmission): void {
    try {
      localStorage.setItem(`${STORAGE_SUBMISSION_PREFIX}${submission.examId}`, JSON.stringify(submission));
    } catch (e) {
      console.warn('Could not persist submission to localStorage', e);
    }
  }

  private simulateLatency(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const examService = new ExamService();
