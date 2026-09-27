import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MockTestResult } from '../../../types/mockTest';
import { mockTestService } from '../../../services/mockTestService';
import { MockTestResultCard } from '../../../components/mockTest/MockTestResultCard';
import { ArrowLeft, Loader2 } from 'lucide-react';

export const MockTestResultPage: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();

  const [result, setResult] = useState<MockTestResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadResult() {
      if (!testId) return;
      try {
        setIsLoading(true);
        // Find recent session result or demo fallback
        const data = await mockTestService.getMockResult(`mock-sess-${testId}`);
        if (!data) {
          setError('Mock examination result could not be located.');
        } else {
          setResult(data);
        }
      } catch (err) {
        setError('Error compiling mock performance results.');
      } finally {
        setIsLoading(false);
      }
    }
    loadResult();
  }, [testId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 gap-3" role="status">
        <Loader2 className="w-8 h-8 animate-spin text-primary" aria-hidden="true" />
        <p className="text-xs font-semibold text-foreground-secondary">
          Analyzing examination metrics and score distributions...
        </p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="p-8 rounded-xl border border-border bg-surface text-center flex flex-col items-center gap-4 max-w-md mx-auto">
        <p className="text-sm font-bold text-foreground">{error || 'Result not found.'}</p>
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

  const handleRetake = async () => {
    try {
      await mockTestService.retakeMockTest(result.testId);
      navigate(`/candidate/mock-tests/${result.testId}/session`);
    } catch (e) {
      console.error('Failed to retake test', e);
      navigate('/candidate/mock-tests');
    }
  };

  const handleReview = () => {
    navigate(`/candidate/mock-tests/${result.testId}/review`);
  };

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

        <span className="text-xs text-foreground-secondary">
          Completed • {result.timeUsedFormatted}
        </span>
      </div>

      {/* Result Presentation Card */}
      <MockTestResultCard
        result={result}
        onRetake={handleRetake}
        onReview={handleReview}
      />
    </div>
  );
};
