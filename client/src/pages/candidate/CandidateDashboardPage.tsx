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

export const CandidateDashboardPage: React.FC = () => {
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
        Skip directly to next practice activity [Press Enter]
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
        <div id="candidate-main-content" className="flex flex-col gap-8 focus:outline-none" tabIndex={-1}>
          {/* 2. Priority 1: What Should I Do Next? (Section 3 & 7) */}
          <NextActionBanner action={dashboardData.nextAction} />

          {/* 3. Priority 2: Today's Goal & Routine Streak (Section 21 & 22) */}
          <DailyGoalCard goal={dashboardData.dailyGoal} />

          {/* 4. Priority 3: Accessible Quick Actions (Section 8) */}
          <QuickActionsGrid actions={dashboardData.quickActions} />

          {/* 5. Priority 4: Preparation Overview & Telemetry (Section 9 & 10) */}
          <PreparationStatsOverview stats={dashboardData.overviewStats} />

          {/* 6. Multi-Column Content Area */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Primary Study & Testing Track (Left Column: 7 cols on lg) */}
            <div className="lg:col-span-7 flex flex-col gap-8">
              {/* Subject Progress */}
              <SubjectProgressSection subjects={dashboardData.subjectProgress} />

              {/* Continue Where You Left Off */}
              <ContinueLearningCard learning={dashboardData.continueLearning} />

              {/* Recommended Practice */}
              <PracticeRecommendationsSection recommendations={dashboardData.recommendations} />

              {/* Mock Tests */}
              <MockTestsSection tests={dashboardData.mockTests} />

              {/* Upcoming Exams */}
              <UpcomingExamsSection exams={dashboardData.upcomingExams} />
            </div>

            {/* Performance, Retention & Calibration Track (Right Column: 5 cols on lg) */}
            <div className="lg:col-span-5 flex flex-col gap-8">
              {/* Recent Performance Evaluation */}
              <RecentPerformanceSection records={dashboardData.recentPerformance} />

              {/* Performance Trend with Text Alternative */}
              <PerformanceTrendCard trend={dashboardData.performanceTrend} />

              {/* Topics to Strengthen (Supportive Weak Areas) */}
              <WeakAreasSection topics={dashboardData.weakAreas} />

              {/* Recent Activity Timeline */}
              <RecentActivityTimeline activities={dashboardData.recentActivity} />

              {/* Active Accessibility Settings Snapshot */}
              <AccessibilityStatusCard />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
