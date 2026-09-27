import React, { useEffect, useState } from 'react';
import { learningApi, ProgressSummary } from '../../../services/api/learningApi';
import { useAccessibility } from '../../../contexts/AccessibilityContext';
import { ProgressOverview } from '../../../components/progress/ProgressOverview';
import { TopicProgress } from '../../../components/progress/TopicProgress';
import { AccessibilityIssueReporter } from '../../../components/accessibility/AccessibilityIssueReporter';
import { AccessibilityProfileModal } from '../../../components/accessibility/AccessibilityProfileModal';

export const ProgressPage: React.FC = () => {
  const { preferences, speak } = useAccessibility();
  const [progress, setProgress] = useState<ProgressSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      const data = await learningApi.getProgress();
      if (isMounted) {
        setProgress(data);
        setIsLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleReadSummary = () => {
    if (progress?.weekly_summary) {
      speak(progress.weekly_summary.summary_text);
    }
  };

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 max-w-7xl mx-auto space-y-8 focus:outline-none"
    >
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
            Candidate Analytics
          </span>
          <h1 className="text-2xl md:text-3xl font-bold text-white mt-1">
            Learning Progress & Practice Intelligence
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Track your topic mastery, study consistency, and transparent recommendations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleReadSummary}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-400 flex items-center gap-1.5"
          >
            🔊 Listen to Weekly Summary
          </button>
          <button
            type="button"
            onClick={() => setIsReportModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            ♿ Report Accessibility Barrier
          </button>
        </div>
      </div>

      {isLoading || !progress ? (
        <div
          role="status"
          aria-live="polite"
          className="p-12 text-center text-slate-400 text-sm font-medium"
        >
          Loading your personalized practice intelligence...
        </div>
      ) : (
        <div className="space-y-8">
          {/* Progress Overview with Narrative */}
          <ProgressOverview progress={progress} />

          {/* Topic Progress Breakdown */}
          <TopicProgress topics={progress.topic_progress} />

          {/* Section 49: Current Accessibility Setup Card */}
          <section
            aria-labelledby="a11y-setup-heading"
            className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="space-y-2">
              <h3 id="a11y-setup-heading" className="text-base font-bold text-white flex items-center gap-2">
                ⚙️ Active Accessibility Configuration
              </h3>
              <p className="text-xs text-slate-400">
                Your assistive setup is active across examinations and study modules. (No sensitive medical labels are stored).
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="px-2.5 py-1 rounded-md bg-slate-800 text-xs font-medium text-slate-300">
                  Text Scale: <strong className="text-white capitalize">{preferences.fontSize}</strong>
                </span>
                <span className="px-2.5 py-1 rounded-md bg-slate-800 text-xs font-medium text-slate-300">
                  Contrast: <strong className="text-white capitalize">{preferences.contrast.replace('_', ' ')}</strong>
                </span>
                <span className="px-2.5 py-1 rounded-md bg-slate-800 text-xs font-medium text-slate-300">
                  Screen Reader Mode:{' '}
                  <strong className="text-white">
                    {preferences.screenReaderOptimized ? 'Enabled' : 'Standard'}
                  </strong>
                </span>
                <span className="px-2.5 py-1 rounded-md bg-slate-800 text-xs font-medium text-slate-300">
                  Audio Speech:{' '}
                  <strong className="text-white">
                    {preferences.audioEnabled ? 'Active' : 'Muted'}
                  </strong>
                </span>
                <span className="px-2.5 py-1 rounded-md bg-slate-800 text-xs font-medium text-slate-300">
                  Timer Announcements:{' '}
                  <strong className="text-white capitalize">{preferences.timerAnnouncements}</strong>
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsSettingsModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-400 hover:text-indigo-300 text-xs font-semibold border border-slate-700 shrink-0 self-start md:self-auto focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              Adjust Preferences
            </button>
          </section>
        </div>
      )}

      {/* Modals */}
      <AccessibilityIssueReporter
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />

      <AccessibilityProfileModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </main>
  );
};
