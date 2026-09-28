/**
 * Analytics Service
 * Provides candidate and examiner telemetry, accessible statistical equivalents,
 * and report exports (CSV, PDF, Excel).
 */

import { Analytics } from '../types/analytics';
import { ExamAnalyticsSummary } from '../types/examiner';
import { MOCK_ANALYTICS } from '../utils/mockData';

const DEFAULT_ANALYTICS_SUMMARY: ExamAnalyticsSummary = {
  examId: 'exam-01',
  title: 'All India Accessible Aptitude Assessment 2026',
  totalEnrolled: 1055,
  participationRate: 91.2,
  completionRate: 88.5,
  averageScore: 68.4,
  highestScore: 98.0,
  medianScore: 71.0,
  averageAccuracy: 74.2,
  averageTimeUsageMinutes: 48.6,
  unansweredRate: 4.8,
  sectionPerformances: [
    {
      sectionTitle: 'Quantitative Aptitude',
      averageScore: 24.8,
      accuracyPercentage: 62.0,
      completionPercentage: 86.4,
    },
    {
      sectionTitle: 'Logical Reasoning & Data',
      averageScore: 21.2,
      accuracyPercentage: 70.6,
      completionPercentage: 92.0,
    },
    {
      sectionTitle: 'Verbal Ability & General Awareness',
      averageScore: 22.4,
      accuracyPercentage: 74.6,
      completionPercentage: 96.2,
    },
  ],
  questionAnalytics: [
    {
      questionId: 'qb-101',
      code: 'QA-MATH-01',
      textSnippet: 'What is the sum of the first 20 positive odd integers?',
      subject: 'Quantitative Aptitude',
      attemptsCount: 940,
      correctPercentage: 68.2,
      incorrectPercentage: 24.1,
      unansweredPercentage: 7.7,
      averageTimeSeconds: 64,
      difficultyIndicator: 'appropriate',
      accessibilityNote: 'Screen reader speech formula verified with 100% clarity.',
    },
  ],
  accessibilityMetrics: {
    screenReaderCompatibleItemsPct: 100,
    missingAltTextWarningsResolved: 12,
    audioAssistanceUsageCount: 420,
    highContrastModeUsageCount: 180,
    textScalingUsageCount: 290,
  },
};

export const analyticsService = {
  async getCandidateAnalytics(_candidateId: string): Promise<Analytics> {
    return MOCK_ANALYTICS;
  },

  async getExamAnalyticsSummary(examId: string): Promise<ExamAnalyticsSummary> {
    return {
      ...DEFAULT_ANALYTICS_SUMMARY,
      examId,
    };
  },

  async exportReport(
    examId: string,
    format: 'csv' | 'pdf' | 'excel'
  ): Promise<{ success: boolean; filename: string; downloadUrl: string }> {
    const filename = `gowow_exam_report_${examId}_${Date.now()}.${format === 'excel' ? 'xlsx' : format}`;
    return {
      success: true,
      filename,
      downloadUrl: `#simulated-export-${filename}`,
    };
  },
};
