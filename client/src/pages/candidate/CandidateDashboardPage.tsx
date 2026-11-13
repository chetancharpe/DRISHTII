import React, { useState, useEffect, useCallback } from 'react';
import { CandidateDashboardData } from '../../types/candidateDashboard';
import { candidateService } from '../../services/candidateService';
import {
  DashboardHeader,
  NextActionBanner,
  QuickActionsGrid,
  DashboardSkeleton,
  DashboardErrorState,
  VisualDashboardCharts,
  DashboardKPIStrip,
  CompactUpcomingAndRecent,
} from '../../components/candidate';

import { useAccessibility } from '../../contexts/AccessibilityContext';
import { AccessibilityQuickBar } from '../../components/accessibility/AccessibilityQuickBar';
import { useNavigate } from 'react-router-dom';

export const CandidateDashboardPage: React.FC = () => {
  const { preferences } = useAccessibility();
  const isHindi = preferences?.language === 'hi' || (typeof document !== 'undefined' && document.documentElement.lang === 'hi');
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
      if (typeof sessionStorage !== 'undefined') {
        try {
          sessionStorage.setItem('drishti_candidate_dashboard_data', JSON.stringify(data));
          window.dispatchEvent(new CustomEvent('drishti_dashboard_loaded', { detail: data }));
        } catch {
          // ignore session storage quota issues
        }
      }
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
        <div className="flex flex-col gap-6">
          {/* Offline/Demo Warning Banner if using fallback data */}
          {dashboardData.isOfflineFallback && (
            <aside
              role="status"
              aria-live="polite"
              className="p-4 rounded-xl bg-amber-500/10 border-2 border-amber-500/40 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
            >
              <div className="flex items-start sm:items-center gap-3">
                <span className="text-xl" aria-hidden="true">⚠️</span>
                <div>
                  <p className="font-semibold text-sm">
                    {isHindi ? 'ऑफ़लाइन पूर्वावलोकन / स्थानीय टेलीमेट्री मोड' : 'Offline Preview / Local Telemetry Mode'}
                  </p>
                  <p className="text-xs opacity-90 mt-0.5">
                    {dashboardData.fallbackMessage || 'Live examination server is currently offline or unreachable. Displaying local offline telemetry. Your mock and practice sessions remain active and saved locally.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={fetchDashboard}
                className="self-start sm:self-center px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-xs font-bold transition-colors whitespace-nowrap focus:ring-2 focus:ring-amber-500"
              >
                Retry Server Connection
              </button>
            </aside>
          )}

          {preferences.simplifiedInterface ? (
            /* Simplified High-Focus Interface Mode */
            <div id="candidate-main-content" className="flex flex-col gap-6 focus:outline-none" tabIndex={-1}>
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between">
                <span className="text-xs font-semibold text-primary">
                  {isHindi ? '✨ सरल हाई-फोकस मोड सक्रिय' : '✨ Simplified High-Focus Mode Active'}
                </span>
                <button
                  type="button"
                  onClick={() => navigate('/candidate/settings')}
                  className="text-xs text-primary hover:underline font-semibold"
                >
                  Change in Settings
                </button>
              </div>

              {/* Dynamic Continue Learning */}
              <div className="p-6 rounded-2xl bg-surface border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">
                    {dashboardData.continueLearning ? (isHindi ? 'वर्तमान अध्ययन विषय' : 'Current Study Topic') : (isHindi ? 'अनुशंसित विषय' : 'Recommended Topic')}
                  </span>
                  <h3 className="text-xl font-bold text-foreground mt-1">
                    {dashboardData.continueLearning
                      ? `Continue: ${dashboardData.continueLearning.topic}`
                      : 'Start Learning: Quantitative Aptitude & Reasoning'}
                  </h3>
                  <p className="text-xs text-foreground-muted mt-1">
                    {dashboardData.continueLearning
                      ? `${Math.round((dashboardData.continueLearning.completedLessons / (dashboardData.continueLearning.totalLessons || 1)) * 100)}% completed · Next: ${dashboardData.continueLearning.nextLessonTitle}`
                      : 'Structured audio-first curriculum with screen-reader friendly lessons'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/candidate/learn')}
                  className="px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-primary-contrast font-bold text-sm focus:ring-2 focus:ring-primary min-h-[44px]"
                >
                  {dashboardData.continueLearning ? (isHindi ? 'पढ़ाई जारी रखें' : 'Continue Learning') : (isHindi ? 'पढ़ाई शुरू करें' : 'Start Learning')}
                </button>
              </div>

              {/* Practice */}
              <div className="p-6 rounded-2xl bg-surface border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-status-success">{isHindi ? 'अनुकूली अभ्यास' : 'Adaptive Practice'}</span>
                  <h3 className="text-xl font-bold text-foreground mt-1">{isHindi ? 'लक्षित प्रश्न अभ्यास' : 'Targeted Question Practice'}</h3>
                  <p className="text-xs text-foreground-muted mt-1">Practice questions tailored with full audio explanations</p>
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
                  <span className="text-xs font-bold uppercase tracking-wider text-status-warning">{isHindi ? 'परीक्षा सिमुलेशन' : 'Exam Simulation'}</span>
                  <h3 className="text-xl font-bold text-foreground mt-1">{isHindi ? 'समयबद्ध मॉक टेस्ट' : 'Timed Mock Tests'}</h3>
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
                  <span className="text-xs font-bold uppercase tracking-wider text-status-error">{isHindi ? 'आधिकारिक परीक्षा' : 'Official Examination'}</span>
                  <h3 className="text-xl font-bold text-foreground mt-1">{isHindi ? 'आधिकारिक निर्धारित परीक्षाएं' : 'Official Scheduled Exams'}</h3>
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
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">{isHindi ? 'प्रगति और विश्लेषण' : 'Progress Analytics'}</span>
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
            <div id="candidate-main-content" className="flex flex-col gap-6 focus:outline-none" tabIndex={-1}>
              {/* 1. Preparation KPI & Goals Strip */}
              <DashboardKPIStrip
                stats={dashboardData.overviewStats}
                goal={dashboardData.dailyGoal}
              />

              {/* 2. Recommended Next Action */}
              <NextActionBanner action={dashboardData.nextAction} />

              {/* 3. Visual Charts Section: Score Growth Bar Chart + Subject Mastery Visualizer */}
              <VisualDashboardCharts
                trend={dashboardData.performanceTrend}
                subjects={dashboardData.subjectProgress}
              />

              {/* 4. Core Portals Grid (Practice, Mock Tests, Scheduled Exams, Results) */}
              <QuickActionsGrid actions={dashboardData.quickActions} />

              {/* 5. Compact Upcoming Exam & Recent Scorecards */}
              <CompactUpcomingAndRecent
                exams={dashboardData.upcomingExams}
                records={dashboardData.recentPerformance}
              />
            </div>
          )}
        </div>
      )}

      {/* Floating Compact Quick Accessibility Bar (Section 8) */}
      <AccessibilityQuickBar />
    </div>
  );
};
