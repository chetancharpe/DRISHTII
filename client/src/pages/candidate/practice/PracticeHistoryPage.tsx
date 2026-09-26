import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PracticeHistoryItem } from '../../../types/practice';
import { practiceService } from '../../../services/practiceService';
import { PracticeHistoryTable } from '../../../components/practice/PracticeHistoryTable';
import { History, ArrowLeft, Target, Loader2 } from 'lucide-react';
import { Card } from '../../../components/common/Card';

export const PracticeHistoryPage: React.FC = () => {
  const [history, setHistory] = useState<PracticeHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadHistory() {
      try {
        setIsLoading(true);
        const data = await practiceService.getPracticeHistory();
        setHistory(data);
      } catch (err) {
        setError('Failed to load practice history.');
      } finally {
        setIsLoading(false);
      }
    }
    loadHistory();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 gap-3" role="status">
        <Loader2 className="w-8 h-8 animate-spin text-primary" aria-hidden="true" />
        <p className="text-xs font-semibold text-foreground-secondary">
          Retrieving practice session records...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 rounded-xl border border-amber-500/30 bg-amber-500/10 text-center flex flex-col items-center gap-4 max-w-md mx-auto">
        <p className="text-sm font-bold text-foreground">{error}</p>
        <Link
          to="/candidate/practice"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-contrast text-xs font-bold min-h-[40px]"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Back to Practice</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/candidate/practice"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline p-1 min-h-[36px] rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Back to Practice Hub</span>
        </Link>

        <Link
          to="/candidate/practice"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary-hover active:bg-primary-hover text-primary-contrast text-xs font-bold min-h-[36px] transition-colors"
        >
          <Target className="w-3.5 h-3.5" aria-hidden="true" />
          <span>New Practice Session</span>
        </Link>
      </div>

      {/* Header */}
      <header className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
          <History className="w-4 h-4" aria-hidden="true" />
          <span>Session Log</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          Practice History
        </h1>
        <p className="text-sm text-foreground-secondary leading-relaxed">
          Inspect your historical practice sessions, review accuracy trends, and revisit explanations.
        </p>
      </header>

      {/* History Content or Empty State */}
      {history.length > 0 ? (
        <Card
          title="Past Practice Sessions"
          subtitle={`Found ${history.length} completed practice records`}
        >
          <PracticeHistoryTable history={history} />
        </Card>
      ) : (
        <div className="p-10 rounded-2xl border border-dashed border-border bg-surface text-center flex flex-col items-center gap-4">
          <div className="p-3.5 rounded-full bg-primary/10 text-primary">
            <History className="w-8 h-8" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">
              No Practice Sessions Recorded Yet
            </h2>
            <p className="text-xs text-foreground-secondary mt-1 max-w-sm">
              Complete your first practice session to build your personal learning history and accuracy tracking.
            </p>
          </div>
          <Link
            to="/candidate/practice"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-primary-contrast text-xs font-bold min-h-[44px] transition-colors"
          >
            <Target className="w-4 h-4" aria-hidden="true" />
            <span>Start Practicing Now</span>
          </Link>
        </div>
      )}
    </div>
  );
};
