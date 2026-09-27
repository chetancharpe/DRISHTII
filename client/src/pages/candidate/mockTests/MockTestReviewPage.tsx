import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MockTestQuestionReview } from '../../../types/mockTest';
import { mockTestService } from '../../../services/mockTestService';
import { MockTestReviewList } from '../../../components/mockTest/MockTestReviewList';
import { ArrowLeft, Loader2 } from 'lucide-react';

export const MockTestReviewPage: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const [reviews, setReviews] = useState<MockTestQuestionReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadReviews() {
      if (!testId) return;
      try {
        setIsLoading(true);
        const data = await mockTestService.getMockReviews(testId);
        setReviews(data);
      } catch (err) {
        setError('Failed to load question reviews.');
      } finally {
        setIsLoading(false);
      }
    }
    loadReviews();
  }, [testId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 gap-3" role="status">
        <Loader2 className="w-8 h-8 animate-spin text-primary" aria-hidden="true" />
        <p className="text-xs font-semibold text-foreground-secondary">
          Retrieving answer explanations and question reviews...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 rounded-xl border border-border bg-surface text-center flex flex-col items-center gap-4 max-w-md mx-auto">
        <p className="text-sm font-bold text-foreground">{error}</p>
        <Link
          to={`/candidate/mock-tests/${testId || ''}/result`}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-contrast text-xs font-bold min-h-[40px]"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Back to Result</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to={`/candidate/mock-tests/${testId}/result`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline p-1 min-h-[36px] rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Back to Performance Summary</span>
        </Link>

        <Link
          to="/candidate/mock-tests"
          className="text-xs text-foreground-secondary hover:text-foreground hover:underline p-1 min-h-[36px] inline-flex items-center"
        >
          <span>Mock Tests Directory</span>
        </Link>
      </div>

      {/* Review List */}
      <MockTestReviewList reviews={reviews} />
    </div>
  );
};
