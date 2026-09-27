import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MockTestHistoryItem } from '../../../types/mockTest';
import { mockTestService } from '../../../services/mockTestService';
import { MockTestHistoryTable } from '../../../components/mockTest/MockTestHistoryTable';
import { History, ArrowLeft, ShieldAlert, Loader2 } from 'lucide-react';
import { Card } from '../../../components/common/Card';

export const MockTestHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState<MockTestHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadHistory() {
      try {
        setIsLoading(true);
        const data = await mockTestService.getMockHistory();
        setHistory(data);
      } catch (err) {
        setError('Failed to load mock tests history.');
      } finally {
        setIsLoading(false);
      }
    }
    loadHistory();
  }, []);

  const handleRetake = async (testId: string) => {
    try {
      await mockTestService.retakeMockTest(testId);
      navigate(`/candidate/mock-tests/${testId}/session`);
    } catch (e) {
      console.error('Retake error', e);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 gap-3" role="status">
        <Loader2 className="w-8 h-8 animate-spin text-primary" aria-hidden="true" />
        <p className="text-xs font-semibold text-foreground-secondary">
          Retrieving mock examination history...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 rounded-xl border border-border bg-surface text-center flex flex-col items-center gap-4 max-w-md mx-auto">
        <p className="text-sm font-bold text-foreground">{error}</p>
        <Link
          to="/candidate/mock-tests"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-contrast text-xs font-bold min-h-[40px]"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Back to Mock Tests</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/candidate/mock-tests"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline p-1 min-h-[36px] rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Back to Mock Tests Directory</span>
        </Link>

        <Link
          to="/candidate/mock-tests"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary-hover active:bg-primary-hover text-primary-contrast text-xs font-bold min-h-[36px] transition-colors"
        >
          <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Take New Mock Test</span>
        </Link>
      </div>

      {/* Header */}
      <header className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
          <History className="w-4 h-4" aria-hidden="true" />
          <span>Candidate Examination Log</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          Mock Test Attempt History
        </h1>
        <p className="text-sm text-foreground-secondary leading-relaxed">
          Review your completed mock examinations, track historical score improvements, and re-examine test explanations.
        </p>
      </header>

      {/* Table Content or Empty State (Requirement #58) */}
      {history.length > 0 ? (
        <Card
          title="Completed Examination Simulations"
          subtitle={`Showing ${history.length} completed attempt records`}
        >
          <MockTestHistoryTable history={history} onRetake={handleRetake} />
        </Card>
      ) : (
        <div className="p-10 rounded-2xl border border-dashed border-border bg-surface text-center flex flex-col items-center gap-4">
          <div className="p-3.5 rounded-full bg-primary/10 text-primary">
            <History className="w-8 h-8" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">
              No Mock Test Attempts Yet
            </h2>
            <p className="text-xs text-foreground-secondary mt-1 max-w-sm">
              Complete your first full-length mock examination to establish your baseline timing and sectional performance benchmarks.
            </p>
          </div>
          <Link
            to="/candidate/mock-tests"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-primary-contrast text-xs font-bold min-h-[44px] transition-colors"
          >
            <ShieldAlert className="w-4 h-4" aria-hidden="true" />
            <span>Browse Mock Examinations</span>
          </Link>
        </div>
      )}
    </div>
  );
};
