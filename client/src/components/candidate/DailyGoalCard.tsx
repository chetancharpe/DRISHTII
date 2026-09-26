import React from 'react';
import { Link } from 'react-router-dom';
import { DailyGoal } from '../../types/candidateDashboard';
import { Target, Flame, ArrowRight } from 'lucide-react';

export interface DailyGoalCardProps {
  goal: DailyGoal;
  className?: string;
}

export const DailyGoalCard: React.FC<DailyGoalCardProps> = ({ goal, className = '' }) => {
  const questionsPct = Math.min(100, Math.round((goal.questionsCompleted / goal.questionsTarget) * 100));
  const timePct = Math.min(100, Math.round((goal.timeMinutesPracticed / goal.targetMinutes) * 100));
  const topicsPct = Math.min(100, Math.round((goal.topicsCompleted / goal.topicsTarget) * 100));

  return (
    <section
      aria-labelledby="daily-goal-heading"
      className={`rounded-xl border border-border bg-surface p-5 sm:p-6 shadow-sm flex flex-col gap-4 text-foreground ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
          <h2 id="daily-goal-heading" className="text-base sm:text-lg font-bold text-foreground">
            Today's Goal
          </h2>
        </div>

        {/* Supportive Routine Streak Indicator (Section 22) */}
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-status-warning/10 border border-status-warning/30 text-xs font-semibold text-foreground"
          aria-label={`Preparation streak: ${goal.streakDays} days. ${goal.streakSupportiveMessage}`}
        >
          <Flame className="w-4 h-4 text-status-warning shrink-0" aria-hidden="true" />
          <span>Preparation streak: {goal.streakDays} days</span>
        </div>
      </div>

      <p className="text-xs text-foreground-secondary leading-relaxed">
        {goal.streakSupportiveMessage} Steady, daily sessions reinforce memory retention without cognitive exhaustion.
      </p>

      {/* 3 Goal Items */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Questions Goal */}
        <div className="p-3.5 rounded-lg border border-border bg-surface-elevated/50 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground-secondary">Questions</span>
            <span className="font-bold text-foreground font-mono">
              {goal.questionsCompleted} / {goal.questionsTarget}
            </span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={questionsPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Questions practiced today: ${goal.questionsCompleted} of ${goal.questionsTarget}`}
            className="w-full bg-surface rounded-full h-2 overflow-hidden border border-border"
          >
            <div
              className="bg-primary h-full rounded-full transition-all duration-300"
              style={{ width: `${questionsPct}%` }}
            />
          </div>
          <span className="text-[11px] text-foreground-muted">
            {questionsPct}% of daily question target
          </span>
        </div>

        {/* Time Goal */}
        <div className="p-3.5 rounded-lg border border-border bg-surface-elevated/50 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground-secondary">Study Time</span>
            <span className="font-bold text-foreground font-mono">
              {goal.timeMinutesPracticed}m / {goal.targetMinutes}m
            </span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={timePct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Study time today: ${goal.timeMinutesPracticed} of ${goal.targetMinutes} minutes`}
            className="w-full bg-surface rounded-full h-2 overflow-hidden border border-border"
          >
            <div
              className="bg-primary h-full rounded-full transition-all duration-300"
              style={{ width: `${timePct}%` }}
            />
          </div>
          <span className="text-[11px] text-foreground-muted">
            {timePct}% of planned study time
          </span>
        </div>

        {/* Topics Goal */}
        <div className="p-3.5 rounded-lg border border-border bg-surface-elevated/50 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground-secondary">Topics Touched</span>
            <span className="font-bold text-foreground font-mono">
              {goal.topicsCompleted} / {goal.topicsTarget}
            </span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={topicsPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Topics practiced today: ${goal.topicsCompleted} of ${goal.topicsTarget}`}
            className="w-full bg-surface rounded-full h-2 overflow-hidden border border-border"
          >
            <div
              className="bg-primary h-full rounded-full transition-all duration-300"
              style={{ width: `${topicsPct}%` }}
            />
          </div>
          <span className="text-[11px] text-foreground-muted">
            {topicsPct}% of targeted syllabus topics
          </span>
        </div>
      </div>

      {/* CTA Footer */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-xs text-foreground-muted">
          Complete 1 more topic to achieve all three daily targets.
        </span>
        <Link
          to="/candidate/practice"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-surface-elevated hover:bg-surface border border-border-strong text-foreground text-xs font-bold transition-colors min-h-[40px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <span>Continue Goal</span>
          <ArrowRight className="w-3.5 h-3.5 text-primary shrink-0" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
};
