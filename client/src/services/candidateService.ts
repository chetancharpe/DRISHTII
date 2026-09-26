/**
 * Candidate Service Layer for GoWow
 * Architecture: Separates API / data retrieval from React components.
 * Can be dropped in with FastAPI REST endpoints without changing React component interfaces.
 */

import { CandidateDashboardData } from '../types/candidateDashboard';
import { MOCK_CANDIDATE_DASHBOARD_DATA } from '../data/candidateDashboardData';

export interface CandidateServiceOptions {
  simulateDelayMs?: number;
  simulateError?: boolean;
}

class CandidateService {
  /**
   * Fetches full candidate dashboard payload
   */
  async getDashboardData(options: CandidateServiceOptions = {}): Promise<CandidateDashboardData> {
    const { simulateDelayMs = 250, simulateError = false } = options;

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (simulateError) {
          reject(new Error('Failed to load candidate dashboard telemetry.'));
        } else {
          // Return deep clone of mock data to prevent accidental mutations
          resolve(JSON.parse(JSON.stringify(MOCK_CANDIDATE_DASHBOARD_DATA)));
        }
      }, simulateDelayMs);
    });
  }

  /**
   * Fetches empty state variant for testing empty states
   */
  async getEmptyDashboardData(): Promise<CandidateDashboardData> {
    const base = await this.getDashboardData({ simulateDelayMs: 150 });
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
