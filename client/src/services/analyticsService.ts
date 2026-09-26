import { Analytics } from '../types/analytics';
import { MOCK_ANALYTICS } from '../utils/mockData';

/**
 * Analytics Service
 * Prepares endpoints for FastAPI telemetry & weak topic analysis:
 * - GET /api/v1/analytics/candidate/{id}
 * - GET /api/v1/analytics/exam/{id}
 */
export const analyticsService = {
  async getCandidateAnalytics(_candidateId: string): Promise<Analytics> {
    // Future FastAPI connection:
    // return apiClient<Analytics>(`/analytics/candidate/${candidateId}`);
    return MOCK_ANALYTICS;
  },

  async getExamAnalytics(_examId: string): Promise<{ averageScore: number; completionRate: number }> {
    // Future FastAPI connection:
    // return apiClient(`/analytics/exam/${examId}`);
    return {
      averageScore: 74.2,
      completionRate: 91.5,
    };
  },
};
