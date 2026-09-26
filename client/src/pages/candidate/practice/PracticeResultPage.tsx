import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { PracticeResult } from '../../../types/practice';
import { practiceService } from '../../../services/practiceService';
import { PracticeResultCard } from '../../../components/practice/PracticeResultCard';
import { PracticeQuestionReviewList } from '../../../components/practice/PracticeQuestionReviewList';
import { ArrowLeft, Loader2 } from 'lucide-react';

export const PracticeResultPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const [result, setResult] = useState<PracticeResult | null>(null);
  const [showReviews, setShowReviews] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadResult() {
      if (!sessionId) return;
      try {
        setIsLoading(true);
        const data = await practiceService.getPracticeResult(sessionId);
        if (!data) {
          setError('Practice result not found.');
        } else {
          setResult(data);
        }
      } catch (err) {
        setError('Error loading practice summary.');
      } finally {
        setIsLoading(false);
      }
    }
    loadResult();
  }, [sessionId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 gap-3" role="status">
        <Loader2 className="w-8 h-8 animate-spin text-primary" aria-hidden="true" />
        <p className="text-xs font-semibold text-foreground-secondary">
          Compiling practice performance metrics...
        </p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="p-8 rounded-xl border border-border bg-surface text-center flex flex-col items-center gap-4 max-w-md mx-auto">
        <p className="text-sm font-bold text-foreground">{error || 'Result not found.'}</p>
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

  const handlePracticeAgain = async () => {
    try {
      const newSession = await practiceService.startPracticeSession({
        examId: 'cds',
        subjectId: result.subjectId,
        topicId: result.topicId,
        difficulty: result.difficulty,
        questionCount: result.totalQuestions,
      });
      navigate(`/candidate/practice/session/${newSession.id}`);
    } catch (err) {
      navigate('/candidate/practice');
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/candidate/practice"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline p-1 min-h-[36px] rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Back to Practice Hub</span>
        </Link>

        <span className="text-xs text-foreground-secondary">
          Completed • {result.timeUsedFormatted}
        </span>
      </div>

      {/* Primary Result Summary Card */}
      <PracticeResultCard
        result={result}
        onPracticeAgain={handlePracticeAgain}
        onReviewAnswers={() => setShowReviews(!showReviews)}
      />

      {/* Detailed Question Review List */}
      {showReviews && (
        <div className="animate-in fade-in duration-200">
          <PracticeQuestionReviewList reviews={result.reviews} />
        </div>
      )}
    </div>
  );
};
