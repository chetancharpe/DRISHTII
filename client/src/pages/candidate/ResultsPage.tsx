import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatsCard } from '../../components/dashboard/StatsCard';
import { ProgressChart } from '../../components/dashboard/ProgressChart';
import { WeakTopicCard } from '../../components/dashboard/WeakTopicCard';
import { mockTestService } from '../../services/mockTestService';
import { MockTestResult, MockTestHistoryItem } from '../../types/mockTest';
import { SubjectScore, WeakTopic } from '../../types/analytics';

export const ResultsPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [latestResult, setLatestResult] = useState<MockTestResult | null>(null);
  const [historyItems, setHistoryItems] = useState<MockTestHistoryItem[]>([]);
  const [subjectScores, setSubjectScores] = useState<SubjectScore[]>([]);
  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>([]);

  useEffect(() => {
    let isMounted = true;

    const loadAssessmentData = async () => {
      setLoading(true);
      try {
        // 1. Gather results from localStorage
        const localResults: MockTestResult[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('gowow_mock_result_') && !key.endsWith('_reviews')) {
            try {
              const item = JSON.parse(localStorage.getItem(key) || '{}');
              if (item && item.sessionId && item.totalScore !== undefined) {
                localResults.push(item);
              }
            } catch {
              // ignore malformed items
            }
          }
        }

        // 2. Try fetching history from backend API
        let apiHistory: MockTestHistoryItem[] = [];
        try {
          apiHistory = await mockTestService.getMockTestHistory();
        } catch {
          apiHistory = [];
        }

        if (!isMounted) return;

        setHistoryItems(apiHistory);

        // Pick latest result from local storage
        if (localResults.length > 0) {
          // Sort descending by timestamp or session ID
          localResults.sort((a, b) => b.sessionId.localeCompare(a.sessionId));
          const latest = localResults[0];
          setLatestResult(latest);

          // Convert section performance to SubjectScore format
          if (latest.sectionPerformances && latest.sectionPerformances.length > 0) {
            const formattedSubjects: SubjectScore[] = latest.sectionPerformances.map((sec) => ({
              subject: sec.sectionName,
              accuracyPercentage: Math.round(sec.accuracyPercent),
              score: sec.score,
              total: sec.maxScore || sec.totalQuestions,
            }));
            setSubjectScores(formattedSubjects);

            // Derive weak topics (< 60% accuracy)
            const lowPerf = latest.sectionPerformances.filter((s) => s.accuracyPercent < 60);
            const derivedWeak: WeakTopic[] = lowPerf.map((s) => ({
              topic: s.sectionName,
              subject: s.sectionName,
              accuracyPercentage: Math.round(s.accuracyPercent),
              rationale: `Scored ${s.score}/${s.totalQuestions} questions. Review incorrect responses and attempt targeted practice sets.`,
              recommendedPracticeUrl: '/candidate/practice',
            }));
            setWeakTopics(derivedWeak);
          }
        } else if (apiHistory.length > 0) {
          // If we have API history but no local detailed result, synthesize high-level summary
          const firstHist = apiHistory[0];
          setLatestResult({
            sessionId: firstHist.sessionId,
            testId: firstHist.testId,
            testTitle: firstHist.testTitle,
            examName: firstHist.examName,
            totalScore: firstHist.score,
            maxScore: firstHist.maxScore,
            percentage: firstHist.percentage,
            totalQuestions: firstHist.maxScore,
            correctCount: firstHist.score,
            incorrectCount: Math.max(0, firstHist.maxScore - firstHist.score),
            unansweredCount: 0,
            markedForReviewCount: 0,
            timeUsedSeconds: 0,
            timeUsedFormatted: firstHist.timeUsedFormatted || 'N/A',
            sectionPerformances: [],
            factualInterpretations: [`Completed on ${firstHist.formattedDate || firstHist.date}`],
            recommendedNextSteps: ['Take another practice test to strengthen pacing.'],
          });
        } else {
          setLatestResult(null);
        }
      } catch (err) {
        console.error('Error loading assessment results:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadAssessmentData();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-6 max-w-5xl mx-auto p-4" aria-busy="true" aria-live="polite">
        <div className="p-8 text-center text-foreground-muted animate-pulse">
          Loading assessment telemetry and performance history...
        </div>
      </div>
    );
  }

  // Accessible Empty State when user hasn't attempted any tests yet
  if (!latestResult && historyItems.length === 0) {
    return (
      <div className="flex flex-col gap-6 max-w-4xl mx-auto py-8">
        <Card title="Assessment Results & Performance Telemetry" subtitle="Candidate diagnostic evaluation and mastery breakdown">
          <div className="flex flex-col items-center justify-center text-center py-12 px-4 gap-4" role="region" aria-label="No results available">
            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-3xl font-bold" aria-hidden="true">
              📊
            </div>
            <h3 className="text-xl font-bold text-foreground">
              No Assessment Results Yet
            </h3>
            <p className="text-sm text-foreground-muted max-w-md">
              You haven't completed any mock tests or practice assessments yet. Once you complete an assessment, your speed, accuracy, and topic analytics will appear here.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
              <Link to="/candidate/mock-tests">
                <Button variant="primary">Start a Timed Mock Test</Button>
              </Link>
              <Link to="/candidate/practice">
                <Button variant="secondary">Start Adaptive Practice</Button>
              </Link>
              <Link to="/candidate/dashboard">
                <Button variant="outline">Return to Dashboard</Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-12">
      <Card
        title="Assessment Results & Telemetry"
        subtitle={`Evaluation for ${latestResult?.testTitle || 'Recent Assessment'}`}
      >
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 my-3">
          <StatsCard
            label="Total Score"
            value={`${latestResult?.totalScore ?? 0} / ${latestResult?.maxScore ?? 100}`}
            icon="🏆"
          />
          <StatsCard
            label="Accuracy"
            value={`${latestResult?.percentage ?? 0}%`}
            icon="🎯"
          />
          <StatsCard
            label="Correct Items"
            value={latestResult?.correctCount ?? 0}
            icon="✅"
          />
          <StatsCard
            label="Incorrect Items"
            value={latestResult?.incorrectCount ?? 0}
            icon="❌"
          />
        </div>

        <div className="flex flex-wrap justify-between items-center gap-3 mt-4 pt-3 border-t border-border">
          <div className="text-xs text-foreground-muted">
            Time Taken: <span className="font-semibold text-foreground">{latestResult?.timeUsedFormatted || 'N/A'}</span>
            {latestResult?.unansweredCount ? ` · Skipped: ${latestResult.unansweredCount}` : ''}
          </div>
          <div className="flex gap-3">
            <Link to="/candidate/practice">
              <Button variant="primary">Practice Recommended Weak Topics →</Button>
            </Link>
            <Link to="/candidate/dashboard">
              <Button variant="secondary">Return to Dashboard</Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* Subject Parity and Discovered Weak Areas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ProgressChart scores={subjectScores} />
        <WeakTopicCard weakTopics={weakTopics} />
      </div>

      {/* Prior Assessments History Table if multiple attempts exist */}
      {historyItems.length > 0 && (
        <Card title="Completed Assessments History" subtitle="Chronological log of prior mock tests and examinations">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm" aria-label="Assessment history table">
              <thead>
                <tr className="border-b border-border text-xs uppercase text-foreground-muted font-semibold">
                  <th scope="col" className="py-3 px-4">Test Title</th>
                  <th scope="col" className="py-3 px-4">Date</th>
                  <th scope="col" className="py-3 px-4">Score</th>
                  <th scope="col" className="py-3 px-4">Accuracy</th>
                  <th scope="col" className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {historyItems.map((item) => (
                  <tr key={item.sessionId} className="border-b border-border hover:bg-surface-elevated/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-foreground">{item.testTitle}</td>
                    <td className="py-3 px-4 text-xs text-foreground-muted">{item.formattedDate || item.date}</td>
                    <td className="py-3 px-4 font-semibold">{item.scoreFormatted || `${item.score} / ${item.maxScore}`}</td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-primary/10 text-primary">
                        {item.percentage}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/candidate/mock-tests/${item.testId}/result`}
                        className="text-xs font-bold text-primary hover:underline"
                        aria-label={`View detailed report for ${item.testTitle}`}
                      >
                        View Report →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};
