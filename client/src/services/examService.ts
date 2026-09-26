import { Exam } from '../types/exam';
import { Question } from '../types/question';
import { MOCK_EXAMS, MOCK_QUESTIONS } from '../utils/mockData';

/**
 * Examination Service
 * Prepares endpoints for FastAPI test-delivery services:
 * - GET  /api/v1/exams
 * - GET  /api/v1/exams/{id}
 * - GET  /api/v1/exams/{id}/questions
 * - POST /api/v1/exams/{id}/start
 * - POST /api/v1/exams/{id}/submit
 */
export const examService = {
  async getExams(): Promise<Exam[]> {
    // Future FastAPI connection:
    // return apiClient<Exam[]>('/exams');
    return MOCK_EXAMS;
  },

  async getExamById(id: string): Promise<Exam | undefined> {
    // Future FastAPI connection:
    // return apiClient<Exam>(`/exams/${id}`);
    return MOCK_EXAMS.find((e) => e.id === id);
  },

  async getExamQuestions(_examId: string): Promise<Question[]> {
    // Future FastAPI connection:
    // return apiClient<Question[]>(`/exams/${examId}/questions`);
    return MOCK_QUESTIONS;
  },

  async startExamAttempt(_examId: string): Promise<{ attemptId: string; serverStartTime: string }> {
    // Future FastAPI connection:
    // return apiClient(`/exams/${examId}/start`, { method: 'POST' });
    return {
      attemptId: `att-${Date.now()}`,
      serverStartTime: new Date().toISOString(),
    };
  },

  async submitExamAttempt(_attemptId: string, _answers: Record<string, string>): Promise<{ status: string }> {
    // Future FastAPI connection:
    // return apiClient(`/attempts/${attemptId}/submit`, { method: 'POST', body: JSON.stringify(answers) });
    return { status: 'submitted' };
  },
};
