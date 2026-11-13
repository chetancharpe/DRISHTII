import React from 'react';
import { DashboardStats, DailyGoal } from '../../types/candidateDashboard';
import { CheckCircle2, Award, Flame, Target, Sparkles, TrendingUp } from 'lucide-react';
import { useAccessibility } from '../../hooks/useAccessibility';

export interface DashboardKPIStripProps {
  stats: DashboardStats;
  goal: DailyGoal;
  className?: string;
}

export const DashboardKPIStrip: React.FC<DashboardKPIStripProps> = ({
  stats,
  goal,
  className = '',
}) => {
  const { preferences } = useAccessibility();
  const isHindi =
    preferences?.language === 'hi' ||
    (typeof document !== 'undefined' && document.documentElement.lang === 'hi');

  // Radial Progress Ring calculations
  const progressPct = stats.overallProgressPercent || 78;
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPct / 100) * circumference;

  const timePct = Math.min(100, Math.round((goal.timeMinutesPracticed / goal.targetMinutes) * 100));

  return (
    <section
      aria-label={isHindi ? 'तैयारी के मुख्य आंकड़े' : 'Key Preparation Metrics'}
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}
    >
      {/* 1. OVERALL READINESS WITH RADIAL CIRCLE */}
      <div className="p-4 sm:p-5 rounded-2xl border border-border bg-surface/85 backdrop-blur-xl hover:border-primary/60 hover:shadow-glow-primary hover:-translate-y-0.5 transition-all duration-200 shadow-glass flex items-center justify-between gap-4 relative glass-specular">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bold uppercase tracking-wider text-foreground-muted flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
            <span>{isHindi ? 'समग्र तैयारी' : 'Overall Readiness'}</span>
          </span>
          <div className="text-2xl sm:text-3xl font-black text-foreground font-mono">
            {progressPct}%
          </div>
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            {isHindi ? 'परीक्षा के लिए तैयार' : 'On Track for Exam'}
          </span>
        </div>

        {/* Circular SVG Progress Ring */}
        <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
          <svg className="w-16 h-16 -rotate-90 transform" aria-hidden="true">
            <circle
              cx="32"
              cy="32"
              r={radius}
              stroke="currentColor"
              strokeWidth="5"
              fill="transparent"
              className="text-border"
            />
            <circle
              cx="32"
              cy="32"
              r={radius}
              stroke="currentColor"
              strokeWidth="5"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="text-primary transition-all duration-1000 ease-out"
            />
          </svg>
          <span className="absolute font-mono font-bold text-xs text-foreground">
            {progressPct}%
          </span>
        </div>
      </div>

      {/* 2. QUESTIONS PRACTICED */}
      <div className="p-4 sm:p-5 rounded-2xl border border-border bg-surface/85 backdrop-blur-xl hover:border-emerald-500/60 hover:shadow-glow-cyan hover:-translate-y-0.5 transition-all duration-200 shadow-glass flex flex-col justify-between gap-3 relative glass-specular">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-foreground-muted flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-status-success" aria-hidden="true" />
            <span>{isHindi ? 'हल किए प्रश्न' : 'Questions Practiced'}</span>
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <TrendingUp className="w-3 h-3" aria-hidden="true" />
            +32
          </span>
        </div>

        <div>
          <div className="text-2xl sm:text-3xl font-black text-foreground font-mono">
            {stats.questionsPracticedCount}
          </div>
          <p className="text-xs text-foreground-muted mt-0.5">
            {isHindi ? 'सभी 4 विषयों में कुल हल' : 'Attempted across all domains'}
          </p>
        </div>
      </div>

      {/* 3. MOCK EXAM ACCURACY */}
      <div className="p-4 sm:p-5 rounded-2xl border border-border bg-surface/85 backdrop-blur-xl hover:border-amber-500/60 hover:shadow-glow-primary hover:-translate-y-0.5 transition-all duration-200 shadow-glass flex flex-col justify-between gap-3 relative glass-specular">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-foreground-muted flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-status-warning" aria-hidden="true" />
            <span>{isHindi ? 'मॉक टेस्ट सटीकता' : 'Mock Accuracy'}</span>
          </span>
          <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
            {stats.mockTestsCompletedCount ?? 4} Mocks
          </span>
        </div>

        <div>
          <div className="text-2xl sm:text-3xl font-black text-foreground font-mono">
            {stats.averageScorePercent ?? 82}%
          </div>
          <p className="text-xs text-foreground-muted mt-0.5">
            {isHindi ? 'औसत सटीकता दर' : 'Average accuracy rate'}
          </p>
        </div>
      </div>

      {/* 4. STUDY ROUTINE STREAK & GOAL */}
      <div className="p-4 sm:p-5 rounded-2xl border border-border bg-surface/85 backdrop-blur-xl hover:border-primary/60 hover:shadow-glow-primary hover:-translate-y-0.5 transition-all duration-200 shadow-glass flex flex-col justify-between gap-3 relative glass-specular">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-foreground-muted flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
            <span>{isHindi ? 'दैनिक लक्ष्य एवं स्ट्रीक' : 'Daily Goal & Streak'}</span>
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Flame className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
            {goal.streakDays} Days
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground">
              {goal.timeMinutesPracticed}m / {goal.targetMinutes}m
            </span>
            <span className="font-mono text-foreground-muted">{timePct}%</span>
          </div>

          <div
            role="progressbar"
            aria-valuenow={timePct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Daily study goal progress: ${timePct}%`}
            className="w-full bg-surface-elevated rounded-full h-2 overflow-hidden border border-border"
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 via-indigo-500 to-primary transition-all duration-500"
              style={{ width: `${timePct}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

