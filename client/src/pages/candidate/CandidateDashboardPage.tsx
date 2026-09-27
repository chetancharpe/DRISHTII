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
        preferences.simplifiedInterface ? (
          /* Section 10: SIMPLIFIED INTERFACE MODE */
          <div id="candidate-main-content" className="flex flex-col gap-6 focus:outline-none" tabIndex={-1}>
            <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-800/40 flex items-center justify-between">
              <span className="text-xs font-semibold text-indigo-300">
                ✨ Simplified Interface Mode Active
              </span>
              <button
                type="button"
                onClick={() => navigate('/candidate/settings')}
                className="text-xs text-indigo-400 hover:underline"
              >
                Change in Settings
              </button>
            </div>

            {/* 1. Continue Learning */}
            <div className="p-6 rounded-2xl bg-slate-900 border-2 border-indigo-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Current Task</span>
                <h3 className="text-xl font-bold text-white mt-1">Continue: Probability — Compound Events</h3>
                <p className="text-xs text-slate-400 mt-1">Lesson 4 · 65% Completed</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/learning')}
                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm focus:ring-2 focus:ring-indigo-400"
              >
                Continue Learning
              </button>
            </div>

            {/* 2. Practice */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Adaptive Practice</span>
                <h3 className="text-xl font-bold text-white mt-1">Targeted Question Practice</h3>
                <p className="text-xs text-slate-400 mt-1">10 questions tailored to unmastered topics</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/practice')}
                className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm focus:ring-2 focus:ring-emerald-400"
              >
                Start Practice
              </button>
            </div>

            {/* 3. Mock Test */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Exam Simulation</span>
                <h3 className="text-xl font-bold text-white mt-1">Timed Mock Tests</h3>
                <p className="text-xs text-slate-400 mt-1">Practice pacing under simulated conditions</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/mock-tests')}
                className="px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm focus:ring-2 focus:ring-amber-400"
              >
                Open Mock Tests
              </button>
            </div>

            {/* 4. Examination */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-rose-400">Live Examination</span>
                <h3 className="text-xl font-bold text-white mt-1">Official Scheduled Exams</h3>
                <p className="text-xs text-slate-400 mt-1">Check scheduled live examinations and eligibility</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/candidate/exams')}
                className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm focus:ring-2 focus:ring-rose-400"
              >
                View Examinations
              </button>
            </div>

            {/* 5. Progress */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-purple-400">Telemetry</span>
                <h3 className="text-xl font-bold text-white mt-1">Progress & Analytics</h3>
                <p className="text-xs text-slate-400 mt-1">Review accuracy trends and weekly narrative report</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/progress')}
                className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm focus:ring-2 focus:ring-purple-400"
              >
                View Progress
              </button>
            </div>
          </div>
        ) : (
          /* Standard Multi-Column Accessible Dashboard */
          <div id="candidate-main-content" className="flex flex-col gap-8 focus:outline-none" tabIndex={-1}>
            {/* 2. Priority 1: What Should I Do Next? */}
            <NextActionBanner action={dashboardData.nextAction} />

            {/* Personalized Practice Set Banner */}
            <PersonalizedPractice topics={['Probability', 'Percentages', 'Syllogisms']} />

            {/* 3. Priority 2: Today's Goal & Routine Streak */}
            <DailyGoalCard goal={dashboardData.dailyGoal} />

            {/* 4. Priority 3: Accessible Quick Actions */}
            <QuickActionsGrid actions={dashboardData.quickActions} />

            {/* 5. Priority 4: Preparation Overview & Telemetry */}
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
