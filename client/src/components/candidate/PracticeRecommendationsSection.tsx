import React from 'react';
import { Link } from 'react-router-dom';
import { PracticeRecommendationItem } from '../../types/candidateDashboard';
import { Sparkles, Clock, ArrowRight } from 'lucide-react';

export interface PracticeRecommendationsSectionProps {
  recommendations: PracticeRecommendationItem[];
  className?: string;
}

export const PracticeRecommendationsSection: React.FC<PracticeRecommendationsSectionProps> = ({
  recommendations,
  className = '',
}) => {
  const getDifficultyBadge = (difficulty: PracticeRecommendationItem['difficulty']) => {
    switch (difficulty) {
      case 'Easy':
        return 'text-status-success bg-status-success/10 border-status-success/30';
      case 'Medium':
        return 'text-status-warning bg-status-warning/10 border-status-warning/30';
      case 'Hard':
        return 'text-status-error bg-status-error/10 border-status-error/30';
      default:
        return 'text-foreground-muted bg-surface-elevated border-border';
    }
  };

  return (
    <section
      aria-labelledby="practice-recommendations-heading"
      className={`rounded-xl border border-border bg-surface p-5 sm:p-6 shadow-sm flex flex-col gap-4 text-foreground ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
          <h2 id="practice-recommendations-heading" className="text-base sm:text-lg font-bold text-foreground">
            Recommended Practice
          </h2>
        </div>
        <span className="text-xs text-foreground-muted">
          Recommended for your preparation
        </span>
      </div>

      {recommendations.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className="p-4 rounded-xl border border-border bg-surface-elevated/40 hover:bg-surface-elevated/70 transition-colors flex flex-col justify-between gap-3 shadow-xs"
            >
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-primary font-mono uppercase">
                    {rec.subject}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getDifficultyBadge(
                      rec.difficulty
                    )}`}
                  >
                    Difficulty: {rec.difficulty}
                  </span>
                </div>

                <h3 className="text-sm font-extrabold text-foreground">
                  {rec.topic}
                </h3>

                <div className="flex items-center gap-3 text-xs text-foreground-muted mt-1">
                  <span>{rec.questionCount} Questions</span>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-foreground-muted" aria-hidden="true" />
                    <span>~{rec.estimatedMinutes} mins</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-border flex justify-end">
                <Link
                  to={rec.practiceRoute}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary hover:bg-primary-hover text-primary-contrast text-xs font-bold transition-colors min-h-[40px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label={`Start practice for ${rec.subject} - ${rec.topic}. ${rec.questionCount} questions, estimated ${rec.estimatedMinutes} minutes.`}
                >
                  <span>Practice Now</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-6 rounded-lg border border-dashed border-border bg-surface-elevated/30 flex flex-col items-center text-center gap-2">
          <p className="text-xs text-foreground-muted">
            Complete a few practice sessions to receive recommendations.
          </p>
          <Link
            to="/candidate/practice"
            className="text-xs font-bold text-primary hover:underline mt-1"
          >
            Start Practicing Questions →
          </Link>
        </div>
      )}
    </section>
  );
};
