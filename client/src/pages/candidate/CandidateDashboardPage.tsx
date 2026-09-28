import React, { useState, useEffect, useCallback } from 'react';
import { CandidateDashboardData } from '../../types/candidateDashboard';
import { candidateService } from '../../services/candidateService';
import {
  DashboardHeader,
  NextActionBanner,
  DailyGoalCard,
  QuickActionsGrid,
  PreparationStatsOverview,
  SubjectProgressSection,
  ContinueLearningCard,
  PracticeRecommendationsSection,
  MockTestsSection,
  UpcomingExamsSection,
  RecentPerformanceSection,
  PerformanceTrendCard,
  WeakAreasSection,
  RecentActivityTimeline,
  AccessibilityStatusCard,
  DashboardSkeleton,
  DashboardErrorState,
} from '../../components/candidate';

import { useAccessibility } from '../../contexts/AccessibilityContext';
import { AccessibilityQuickBar } from '../../components/accessibility/AccessibilityQuickBar';
import { PersonalizedPractice } from '../../components/recommendations/PersonalizedPractice';
import { useNavigate } from 'react-router-dom';

export const CandidateDashboardPage: React.FC = () => {
  const { preferences } = useAccessibility();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<CandidateDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await candidateService.getDashboardData({ simulateDelayMs: 200 });
      setDashboardData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while loading dashboard telemetry.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return (
    <div className="w-full flex flex-col gap-8 pb-12">
      {/* Skip links specifically for dashboard layout */}
      <a href="#next-action-section" className="skip-link">
        Skip directly to next practice activity
      </a>

      {/* 1. Header & Candidate Greeting */}
      <DashboardHeader />

      {/* Loading Skeleton */}
      {isLoading && <DashboardSkeleton />}

      {/* Error Fallback */}
      {!isLoading && error && (
        <DashboardErrorState message={error} onRetry={fetchDashboard} />
      )}

      {/* Main Actionable Dashboard Body */}
      {!isLoading && dashboardData && (
        preferences.simplifiedInterface ? (
          /* Simplified High-Focus Interface Mode */
          <div id="candidate-main-content" className="flex flex-col gap-6 focus:outline-none" tabIndex={-1}>
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between">
              <span className="text-xs font-semibold text-primary">
                ✨ Simplified High-Focus Mode Active
              </span>
              <button
                type="button"
                onClick={() => navigate('/candidate/settings')}
                className="text-xs text-primary hover:underline font-semibold"
              >
                Change in Settings
              </button>
            </div>

            {/* Continue Learning */}
            <div className="p-6 rounded-2xl bg-surface border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-primary">Current Study Topic</span>
                <h3 className="text-xl font-bold text-foreground mt-1">Continue: Probability — Compound Events</h3>
                <p className="text-xs text-foreground-muted mt-1">Lesson 4 · 65% Completed</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/candidate/learn')}
                className="px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-primary-contrast font-bold text-sm focus:ring-2 focus:ring-primary min-h-[44px]"
              >
                Continue Learning
              </button>
            </div>

            {/* Practice */}
            <div className="p-6 rounded-2xl bg-surface border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-status-success">Adaptive Practice</span>
                <h3 className="text-xl font-bold text-foreground mt-1">Targeted Question Practice</h3>
                <p className="text-xs text-foreground-muted mt-1">10 questions tailored to unmastered topics</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/candidate/practice')}
                className="px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-primary-contrast font-bold text-sm focus:ring-2 focus:ring-primary min-h-[44px]"
              >
                Start Practice
              </button>
            </div>

            {/* Mock Test */}
            <div className="p-6 rounded-2xl bg-surface border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-status-warning">Exam Simulation</span>
                <h3 className="text-xl font-bold text-foreground mt-1">Timed Mock Tests</h3>
                <p className="text-xs text-foreground-muted mt-1">Practice pacing under simulated conditions</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/candidate/mock-tests')}
                className="px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-primary-contrast font-bold text-sm focus:ring-2 focus:ring-primary min-h-[44px]"
              >
                Open Mock Tests
              </button>
            </div>

            {/* Examination */}
            <div className="p-6 rounded-2xl bg-surface border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-status-error">Official Examination</span>
                <h3 className="text-xl font-bold text-foreground mt-1">Official Scheduled Exams</h3>
                <p className="text-xs text-foreground-muted mt-1">Check scheduled live examinations and eligibility</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/candidate/exams')}
                className="px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-primary-contrast font-bold text-sm focus:ring-2 focus:ring-primary min-h-[44px]"
              >
                View Examinations
              </button>
            </div>

            {/* Progress */}
            <div className="p-6 rounded-2xl bg-surface border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-primary">Progress Analytics</span>
                <h3 className="text-xl font-bold text-foreground mt-1">Progress & Analytics</h3>
                <p className="text-xs text-foreground-muted mt-1">Review accuracy trends and weekly narrative report</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/candidate/progress')}
                className="px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-primary-contrast font-bold text-sm focus:ring-2 focus:ring-primary min-h-[44px]"
              >
                View Progress
              </button>
            </div>
          </div>
        ) : (
          /* Standard Multi-Column Accessible Dashboard */
          <div id="candidate-main-content" className="flex flex-col gap-8 focus:outline-none" tabIndex={-1}>
            {/* Recommended Next Step */}
            <NextActionBanner action={dashboardData.nextAction} />

            {/* Personalized Practice Set Banner */}
            <PersonalizedPractice topics={['Probability', 'Percentages', 'Syllogisms']} />

            {/* Today's Goal & Routine Streak */}
            <DailyGoalCard goal={dashboardData.dailyGoal} />

            {/* Accessible Quick Actions */}
            <QuickActionsGrid actions={dashboardData.quickActions} />

            {/* Preparation Overview & Telemetry */}
            <PreparationStatsOverview stats={dashboardData.overviewStats} />

            {/* 6. Multi-Column Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Primary Study & Testing Track (Left Column) */}
              <div className="lg:col-span-7 flex flex-col gap-8">
                <SubjectProgressSection subjects={dashboardData.subjectProgress} />
                <ContinueLearningCard learning={dashboardData.continueLearning} />
                <PracticeRecommendationsSection recommendations={dashboardData.recommendations} />
                <MockTestsSection tests={dashboardData.mockTests} />
                <UpcomingExamsSection exams={dashboardData.upcomingExams} />
              </div>

              {/* Performance & Calibration Track (Right Column) */}
              <div className="lg:col-span-5 flex flex-col gap-8">
                <RecentPerformanceSection records={dashboardData.recentPerformance} />
                <PerformanceTrendCard trend={dashboardData.performanceTrend} />
                <WeakAreasSection topics={dashboardData.weakAreas} />
                <RecentActivityTimeline activities={dashboardData.recentActivity} />
                <AccessibilityStatusCard />
              </div>
            </div>
          </div>
        )
      )}

      {/* Floating Compact Quick Accessibility Bar (Section 8) */}
      <AccessibilityQuickBar />
    </div>
  );
};
