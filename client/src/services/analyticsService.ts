/**
 * Analytics Service
 * Provides candidate and examiner telemetry, accessible statistical equivalents,
 * and report exports (CSV, PDF, Excel).
 */

import { Analytics } from '../types/analytics';
import { ExamAnalyticsSummary } from '../types/examiner';
import { MOCK_ANALYTICS } from '../utils/mockData';
import { INITIAL_ANALYTICS_SUMMARY } from '../data/examinerData';

export const analyticsService = {
  async getCandidateAnalytics(_candidateId: string): Promise<Analytics> {
    return MOCK_ANALYTICS;
  },

  async getExamAnalyticsSummary(examId: string): Promise<ExamAnalyticsSummary> {
    return {
      ...INITIAL_ANALYTICS_SUMMARY,
      examId,
    };
  },

  async exportReport(
    examId: string,
    format: 'csv' | 'pdf' | 'excel'
  ): Promise<{ success: boolean; filename: string; downloadUrl: string }> {
    // Simulated institutional report export bundle
    const filename = `gowow_exam_report_${examId}_${Date.now()}.${format === 'excel' ? 'xlsx' : format}`;
    return {
      success: true,
      filename,
      downloadUrl: `#simulated-export-${filename}`,
    };
  },
};
