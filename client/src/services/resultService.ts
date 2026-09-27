/**
 * Result & Evaluation Service Layer
 * Objective automated scoring, subjective manual evaluation queues with rubric,
 * publication controls, and audit trails for score corrections.
 */

import { ExamCandidateResult, SubjectiveEvaluationItem } from '../types/examiner';
import { INITIAL_EXAM_RESULTS, INITIAL_SUBJECTIVE_EVALUATION_QUEUE } from '../data/resultData';
import { storage } from '../utils/storage';

const RESULTS_STORAGE_KEY = 'gowow_exam_results';
const EVAL_QUEUE_STORAGE_KEY = 'gowow_subjective_eval_queue';

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
    const results = this.getResults();
    const queue = this.getEvalQueue();
    const pendingEvaluations = queue.filter((q) => q.status === 'pending');

    if (pendingEvaluations.length > 0) {
      throw new Error(
        `Cannot publish official results: ${pendingEvaluations.length} subjective submissions remain unevaluated.`
      );
    }

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
