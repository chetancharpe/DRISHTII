/**
 * Result & Evaluation Service Layer
 * Objective automated scoring, subjective manual evaluation queues with rubric,
 * publication controls, and audit trails for score corrections.
 */

import { ExamCandidateResult, SubjectiveEvaluationItem } from '../types/examiner';
import { INITIAL_EXAM_RESULTS, INITIAL_SUBJECTIVE_EVALUATION_QUEUE } from '../fixtures/examinerFixtures';
import { storage } from '../utils/storage';
import { apiClient } from './api';

const RESULTS_STORAGE_KEY = 'gowow_exam_results';
const EVAL_QUEUE_STORAGE_KEY = 'gowow_subjective_eval_queue';

export interface BackendResultExaminerResponse {
  id: string;
  exam_id: string;
  candidate_id: string;
  candidate_name: string;
  candidate_email: string;
  session_id: string;
  score: number;
  maximum_score: number;
  percentage: number;
  correct_count: number;
  incorrect_count: number;
  unanswered_count: number;
  status: string;
  published_at?: string;
  created_at: string;
}

export interface BackendResultCandidateResponse {
  exam_id: string;
  exam_title: string;
  status: string;
  score?: number;
  maximum_score?: number;
  percentage?: number;
  correct_count?: number;
  incorrect_count?: number;
  unanswered_count?: number;
  published_at?: string;
  message?: string;
  breakdown?: Array<{
    question_id: string;
    question_text: string;
    candidate_answer: any;
    correct_answer: any;
    marks_awarded: number;
    max_marks: number;
    is_correct: boolean;
    explanation?: string;
  }>;
}

export interface BackendEvaluationResponse {
  id: string;
  submission_id: string;
  question_id: string;
  examiner_id?: string;
  marks_awarded: number;
  comments?: string;
  status: string;
  evaluated_at: string;
}

function mapBackendResultToCandidateResult(
  bRes: BackendResultExaminerResponse,
  fallback?: Partial<ExamCandidateResult>
): ExamCandidateResult {
  return {
    id: bRes.id,
    examId: bRes.exam_id,
    candidateId: bRes.candidate_id,
    candidateName: bRes.candidate_name,
    candidateCode: fallback?.candidateCode || `CAN-${bRes.candidate_id.slice(0, 6).toUpperCase()}`,
    score: bRes.score,
    totalMarks: bRes.maximum_score,
    percentage: bRes.percentage,
    correctAnswersCount: bRes.correct_count,
    incorrectAnswersCount: bRes.incorrect_count,
    unansweredCount: bRes.unanswered_count,
    timeSpentMinutes: fallback?.timeSpentMinutes || 45,
    submissionStatus: fallback?.submissionStatus || 'submitted_on_time',
    evaluationStatus: (bRes.status?.toLowerCase() === 'published' ? 'published' : (fallback?.evaluationStatus || 'automated_complete')) as any,
    publishedAt: bRes.published_at || fallback?.publishedAt,
    isCorrected: fallback?.isCorrected || false,
    correctionHistory: fallback?.correctionHistory || [],
  };
}

class ResultService {
  private getResults(): ExamCandidateResult[] {
    return storage.get<ExamCandidateResult[]>(RESULTS_STORAGE_KEY, INITIAL_EXAM_RESULTS);
  }

  private saveResults(results: ExamCandidateResult[]): void {
    storage.set(RESULTS_STORAGE_KEY, results);
  }

  private getEvalQueue(): SubjectiveEvaluationItem[] {
    return storage.get<SubjectiveEvaluationItem[]>(EVAL_QUEUE_STORAGE_KEY, INITIAL_SUBJECTIVE_EVALUATION_QUEUE);
  }

  private saveEvalQueue(queue: SubjectiveEvaluationItem[]): void {
    storage.set(EVAL_QUEUE_STORAGE_KEY, queue);
  }

  async getExamResults(examId: string): Promise<ExamCandidateResult[]> {
    try {
      const backendResults = await apiClient.get<BackendResultExaminerResponse[]>(`/examiner/exams/${examId}/results`);
      if (Array.isArray(backendResults) && backendResults.length > 0) {
        const stored = this.getResults();
        const storedMap = new Map(stored.map((r) => [r.id, r]));
        const mapped = backendResults.map((b) => mapBackendResultToCandidateResult(b, storedMap.get(b.id)));
        return mapped;
      }
    } catch (err) {
      console.warn(`Backend /examiner/exams/${examId}/results failed, using cached results:`, err);
    }
    const results = this.getResults();
    return results.filter((r) => r.examId === examId);
  }

  async getSubjectiveQueue(): Promise<SubjectiveEvaluationItem[]> {
    return this.getEvalQueue();
  }

  async evaluateSubjectiveItem(
    itemId: string,
    awardedMarks: number,
    examinerComments: string,
    evaluatedBy: string
  ): Promise<SubjectiveEvaluationItem> {
    const queue = this.getEvalQueue();
    const idx = queue.findIndex((q) => q.id === itemId);
    if (idx === -1) throw new Error(`Subjective item ${itemId} not found in evaluation queue.`);

    const item = queue[idx];

    try {
      await apiClient.post<BackendEvaluationResponse>(`/examiner/submissions/${itemId}/evaluate`, {
        question_id: item.questionId,
        marks_awarded: awardedMarks,
        comments: examinerComments,
      });
    } catch (err) {
      console.warn(`Backend evaluation submit failed for item ${itemId}, applying locally:`, err);
    }

    queue[idx] = {
      ...queue[idx],
      awardedMarks,
      examinerComments,
      status: 'evaluated',
      evaluatedBy,
      evaluatedAt: `${new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString('en-US', { hour12: false })} IST`,
    };

    this.saveEvalQueue(queue);
    return queue[idx];
  }

  async publishResults(examId: string): Promise<void> {
    const queue = this.getEvalQueue();
    const pendingEvaluations = queue.filter((q) => q.status === 'pending');

    if (pendingEvaluations.length > 0) {
      throw new Error(
        `Cannot publish official results: ${pendingEvaluations.length} subjective submissions remain unevaluated.`
      );
    }

    try {
      await apiClient.post(`/examiner/exams/${examId}/results/publish`, {
        confirm_publication: true,
      });
    } catch (err) {
      console.warn(`Backend /examiner/exams/${examId}/results/publish failed, applying local update:`, err);
    }

    const results = this.getResults();
    const updated = results.map((r) => {
      if (r.examId === examId) {
        return {
          ...r,
          evaluationStatus: 'published' as const,
          publishedAt: `${new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString('en-US', { hour12: false })} IST`,
        };
      }
      return r;
    });

    this.saveResults(updated);
  }

  async getCandidateResult(examId: string): Promise<BackendResultCandidateResponse | null> {
    try {
      const res = await apiClient.get<BackendResultCandidateResponse>(`/candidate/exams/${examId}/result`);
      if (res && res.exam_id) {
        return res;
      }
    } catch (err) {
      console.warn(`Backend /candidate/exams/${examId}/result call failed:`, err);
    }
    return null;
  }

  async correctCandidateResult(
    resultId: string,
    newScore: number,
    reason: string,
    changedBy: string
  ): Promise<ExamCandidateResult> {
    const results = this.getResults();
    const idx = results.findIndex((r) => r.id === resultId);
    if (idx === -1) throw new Error(`Result ${resultId} not found.`);

    const current = results[idx];
    const originalScore = current.score;

    const correctionEntry = {
      originalScore,
      newScore,
      reason,
      changedBy,
      timestamp: `${new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString('en-US', { hour12: false })} IST`,
    };

    const newPercentage = Math.round((newScore / current.totalMarks) * 1000) / 10;

    results[idx] = {
      ...current,
      score: newScore,
      percentage: newPercentage,
      isCorrected: true,
      correctionHistory: [...(current.correctionHistory || []), correctionEntry],
    };

    this.saveResults(results);
    return results[idx];
  }
}

export const resultService = new ResultService();
