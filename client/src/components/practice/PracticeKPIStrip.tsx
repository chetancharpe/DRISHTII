import React from 'react';
import { CheckCircle2, Award, Flame, Target, TrendingUp, BookOpen } from 'lucide-react';
import { useAccessibility } from '../../hooks/useAccessibility';

export interface PracticeKPIStripProps {
  questionsPracticed?: number;
  accuracyPercent?: number;
  streakDays?: number;
  timeMinutesPracticed?: number;
  targetMinutes?: number;
  className?: string;
}

export const PracticeKPIStrip: React.FC<PracticeKPIStripProps> = ({
  questionsPracticed = 184,
  accuracyPercent = 82,
  streakDays = 7,
  timeMinutesPracticed = 30,
  targetMinutes = 45,
  className = '',
}) => {
  const { preferences } = useAccessibility();
  const isHindi =
    preferences?.language === 'hi' ||
    (typeof document !== 'undefined' && document.documentElement.lang === 'hi');

  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (accuracyPercent / 100) * circumference;
  const timePct = Math.min(100, Math.round((timeMinutesPracticed / targetMinutes) * 100));

  return (
    <section
      aria-label={isHindi ? 'अभ्यास मुख्य आंकड़े' : 'Practice Key Performance Indicators'}
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}
    >
      {/* 1. QUESTIONS PRACTICED */}
      <div className="p-4 sm:p-5 rounded-2xl border-2 border-border bg-surface hover:border-emerald-500/40 transition-all shadow-sm flex flex-col justify-between gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-foreground-muted flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
            <span>{isHindi ? 'हल किए प्रश्न' : 'Questions Practiced'}</span>
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <TrendingUp className="w-3 h-3" aria-hidden="true" />
            +32 {isHindi ? 'इस सप्ताह' : 'wk'}
          </span>
        </div>

        <div>
          <div className="text-2xl sm:text-3xl font-black text-foreground font-mono">
            {questionsPracticed}
          </div>
          <p className="text-xs text-foreground-muted mt-0.5">
            {isHindi ? 'सभी 4 विषयों में कुल अभ्यास' : 'Total attempted across all subjects'}
          </p>
        </div>
      </div>

      {/* 2. ACCURACY RATE WITH RADIAL RING */}
      <div className="p-4 sm:p-5 rounded-2xl border-2 border-border bg-surface hover:border-primary/40 transition-all shadow-sm flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bold uppercase tracking-wider text-foreground-muted flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
            <span>{isHindi ? 'औसत सटीकता' : 'Average Accuracy'}</span>
          </span>
          <div className="text-2xl sm:text-3xl font-black text-foreground font-mono">
            {accuracyPercent}%
          </div>
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            {isHindi ? 'उच्च सटीकता स्तर' : 'High Accuracy Band'}
          </span>
        </div>

        {/* Circular Radial SVG */}
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
            {accuracyPercent}%
          </span>
        </div>
      </div>

      {/* 3. CURRICULUM COVERAGE */}
      <div className="p-4 sm:p-5 rounded-2xl border-2 border-border bg-surface hover:border-violet-500/40 transition-all shadow-sm flex flex-col justify-between gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-foreground-muted flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-violet-500" aria-hidden="true" />
            <span>{isHindi ? 'विषय कवरेज' : 'Subject Coverage'}</span>
          </span>
          <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
            4 / 4 Active
          </span>
        </div>

        <div>
          <div className="text-2xl sm:text-3xl font-black text-foreground font-mono">
            100%
          </div>
          <p className="text-xs text-foreground-muted mt-0.5">
            {isHindi ? 'गणित, तर्क, अंग्रेजी व सामान्य ज्ञान' : 'Math, Reasoning, English & GK'}
          </p>
        </div>
      </div>

      {/* 4. DAILY STUDY STREAK */}
      <div className="p-4 sm:p-5 rounded-2xl border-2 border-border bg-surface hover:border-amber-500/40 transition-all shadow-sm flex flex-col justify-between gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-foreground-muted flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
            <span>{isHindi ? 'दैनिक स्ट्रीक व लक्ष्य' : 'Daily Streak & Goal'}</span>
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Flame className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
            {streakDays} {isHindi ? 'दिन' : 'Days'}
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground">
              {timeMinutesPracticed}m / {targetMinutes}m
            </span>
            <span className="font-mono text-foreground-muted">{timePct}%</span>
          </div>

          <div
            role="progressbar"
            aria-valuenow={timePct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Daily practice goal progress: ${timePct}%`}
            className="w-full bg-surface-elevated rounded-full h-2 overflow-hidden border border-border"
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-primary transition-all duration-500"
              style={{ width: `${timePct}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
