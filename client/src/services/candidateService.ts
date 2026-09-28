/**
 * Candidate Service Layer for GoWow
 * Connects directly to FastAPI backend via apiClient.
 */

import { CandidateDashboardData } from '../types/candidateDashboard';
import { apiClient } from './api';

export interface CandidateServiceOptions {
  simulateDelayMs?: number;
  simulateError?: boolean;
}

class CandidateService {
  /**
   * Fetches full candidate dashboard payload from backend API
   */
  async getDashboardData(_options?: CandidateServiceOptions): Promise<CandidateDashboardData> {
    return apiClient.get<CandidateDashboardData>('/candidate/dashboard');
  }

  /**
   * Fetches empty state variant for testing empty states
   */
  async getEmptyDashboardData(): Promise<CandidateDashboardData> {
    const base = await this.getDashboardData();
    return {
      ...base,
      continueLearning: null,
      upcomingExams: [],
      recentPerformance: [],
      recommendations: [],
      weakAreas: [],
      recentActivity: [],
    };
  }
}

export const candidateService = new CandidateService();
