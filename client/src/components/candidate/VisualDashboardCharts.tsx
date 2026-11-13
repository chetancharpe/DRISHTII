import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PerformanceTrendData, SubjectProgressItem } from '../../types/candidateDashboard';
import { TrendingUp, BookOpen, ArrowRight, BarChart2, CheckCircle2, Award } from 'lucide-react';
import { useAccessibility } from '../../hooks/useAccessibility';

export interface VisualDashboardChartsProps {
  trend: PerformanceTrendData;
  subjects: SubjectProgressItem[];
  className?: string;
}

export const VisualDashboardCharts: React.FC<VisualDashboardChartsProps> = ({
  trend,
  subjects,
  className = '',
}) => {
  const { preferences } = useAccessibility();
  const isHindi =
    preferences?.language === 'hi' ||
    (typeof document !== 'undefined' && document.documentElement.lang === 'hi');

  const [activeBarIndex, setActiveBarIndex] = useState<number | null>(null);

  // Compute average score across recent tests
  const avgScore =
    trend.scores.length > 0
      ? Math.round(trend.scores.reduce((a, b) => a + b, 0) / trend.scores.length)
      : 75;

  const netGain =
    trend.scores.length > 1
      ? trend.scores[trend.scores.length - 1] - trend.scores[0]
      : 18;

  // Subject theme color resolver
  const getSubjectColor = (subjectName: string) => {
    const s = subjectName.toLowerCase();
    if (s.includes('math') || s.includes('गणित')) {
      return {
        gradient: 'from-emerald-500 to-teal-600',
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-500',
        border: 'border-emerald-500/20',
      };
    }
    if (s.includes('reason') || s.includes('तर्क')) {
      return {
        gradient: 'from-violet-500 to-purple-600',
        bg: 'bg-violet-500/10',
        text: 'text-violet-500',
        border: 'border-violet-500/20',
      };
    }
    if (s.includes('english') || s.includes('अंग्रेजी')) {
      return {
        gradient: 'from-blue-500 to-indigo-600',
        bg: 'bg-blue-500/10',
        text: 'text-blue-500',
        border: 'border-blue-500/20',
      };
    }
    return {
      gradient: 'from-amber-500 to-orange-600',
      bg: 'bg-amber-500/10',
      text: 'text-amber-500',
      border: 'border-amber-500/20',
    };
  };

  return (
    <section
      aria-label={isHindi ? 'दृश्य प्रदर्शन एवं विषय प्रगति चार्ट' : 'Visual Performance & Subject Analytics'}
      className={`grid grid-cols-1 lg:grid-cols-12 gap-6 ${className}`}
    >
      {/* 1. VISUAL SCORE PROGRESSION BAR CHART (Left Column: 7 Cols) */}
      <div className="lg:col-span-7 rounded-2xl border border-border bg-surface/85 backdrop-blur-xl p-5 sm:p-6 shadow-glass flex flex-col justify-between gap-5 transition-all duration-200 hover:border-primary/50 hover:shadow-glass-elevated relative glass-specular">
        {/* Header & Badges */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <BarChart2 className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-foreground tracking-tight">
                {isHindi ? 'स्कोर एवं सटीकता रुझान' : 'Performance Progression'}
              </h2>
              <p className="text-xs text-foreground-muted">
                {isHindi ? 'हाल ही के मॉक टेस्ट में सुधार' : 'Score growth across 5 simulated tests'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold font-mono"
              aria-label={`Net improvement: +${netGain}%`}
            >
              <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
              <span>+{netGain}% Net Gain</span>
            </span>
          </div>
        </div>

        {/* Concise Spoken/Screen-Reader Narrative (Section 19 compliant) */}
        <div
          role="region"
          aria-label="Score progression narrative"
          className="px-3.5 py-2.5 rounded-xl border border-primary/20 bg-primary/5 text-xs text-foreground flex items-center justify-between gap-2"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
            <span className="font-medium">
              {isHindi
                ? `औसत स्कोर: ${avgScore}% · लगातार वृद्धि दर्ज की गई है।`
                : `Average Score: ${avgScore}% · Steady upward trajectory achieved.`}
            </span>
          </div>
          <span className="hidden sm:inline font-mono font-bold text-primary text-[11px]">
            Target: 85%+
          </span>
        </div>

        {/* Visual SVG & HTML Accessible Bar Chart */}
        <div className="relative pt-6 pb-2 px-3 sm:px-5 bg-surface-elevated/40 rounded-xl border border-border">
          {/* Average Benchmark Line */}
          <div
            className="absolute left-3 right-3 sm:left-5 sm:right-5 border-b border-dashed border-primary/40 pointer-events-none z-10 flex justify-end"
            style={{ bottom: `${Math.round((avgScore / 100) * 160) + 38}px` }}
          >
            <span className="text-[10px] font-mono font-bold text-primary bg-surface/90 px-1.5 py-0.5 rounded -translate-y-2.5">
              Avg {avgScore}%
            </span>
          </div>

          {/* Bar Columns Container */}
          <div
            className="flex items-end justify-between gap-3 sm:gap-6 h-48"
            role="group"
            aria-label="Bar chart showing score progression across recent mock tests"
          >
            {trend.scores.map((score, idx) => {
              const heightPct = Math.round((score / 100) * 100);
              const label = trend.testLabels[idx] || `Test ${idx + 1}`;
              const isHovered = activeBarIndex === idx;

              return (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center gap-2 h-full justify-end cursor-pointer group focus:outline-none"
                  tabIndex={0}
                  role="figure"
                  aria-label={`${label}: Achieved Score ${score}%`}
                  onMouseEnter={() => setActiveBarIndex(idx)}
                  onMouseLeave={() => setActiveBarIndex(null)}
                  onFocus={() => setActiveBarIndex(idx)}
                  onBlur={() => setActiveBarIndex(null)}
                >
                  {/* Floating Score Badge on Top of Bar */}
                  <span
                    className={`text-xs font-mono font-bold transition-all duration-200 ${
                      isHovered
                        ? 'text-primary scale-110 -translate-y-1'
                        : 'text-foreground'
                    }`}
                  >
                    {score}%
                  </span>

                  {/* Vertical Bar with Gradient */}
                  <div className="w-full max-w-[48px] bg-surface rounded-t-xl border-t-2 border-x-2 border-primary/30 h-full flex items-end overflow-hidden p-0.5 shadow-inner">
                    <div
                      className={`w-full rounded-t-lg transition-all duration-500 ease-out bg-gradient-to-t ${
                        isHovered
                          ? 'from-primary to-primary-hover shadow-lg shadow-primary/30'
                          : 'from-primary/80 to-primary'
                      }`}
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>

                  {/* Test Label */}
                  <span
                    className={`text-[11px] font-mono transition-colors truncate max-w-full ${
                      isHovered ? 'text-primary font-bold' : 'text-foreground-muted'
                    }`}
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Screen Reader Data Table Fallback */}
        <div className="sr-only">
          <table>
            <caption>Test Scores Progression Table</caption>
            <thead>
              <tr>
                <th scope="col">Test Name</th>
                <th scope="col">Score Percentage</th>
              </tr>
            </thead>
            <tbody>
              {trend.scores.map((s, i) => (
                <tr key={i}>
                  <td>{trend.testLabels[i]}</td>
                  <td>{s}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. SUBJECT MASTERY BREAKDOWN (Right Column: 5 Cols) */}
      <div className="lg:col-span-5 rounded-2xl border border-border bg-surface/85 backdrop-blur-xl p-5 sm:p-6 shadow-glass flex flex-col justify-between gap-5 transition-all duration-200 hover:border-primary/50 hover:shadow-glass-elevated relative glass-specular">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <BookOpen className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-foreground tracking-tight">
                {isHindi ? 'विषयवार दक्षता' : 'Subject Mastery'}
              </h2>
              <p className="text-xs text-foreground-muted">
                {isHindi ? '4 मुख्य पाठ्यक्रम विषय' : '4 Core Curriculum Domains'}
              </p>
            </div>
          </div>

          <Link
            to="/candidate/learn"
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1 focus:ring-2 focus:ring-primary rounded p-1"
          >
            <span>{isHindi ? 'पूरा देखें' : 'View All'}</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        </div>

        {/* Subject Progress Items */}
        <div className="flex flex-col gap-3.5">
          {subjects.map((subj) => {
            const colors = getSubjectColor(subj.subject);

            return (
              <div
                key={subj.id}
                className="p-3.5 rounded-xl border border-border bg-surface-elevated/40 hover:bg-surface-elevated transition-colors flex flex-col gap-2 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                      {subj.subject}
                    </span>
                    <span className="text-[11px] text-foreground-muted">
                      ({subj.masteredTopics}/{subj.totalTopics})
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-mono font-bold text-foreground">
                      {subj.progressPercent}%
                    </span>
                    <Link
                      to={subj.practiceRoute}
                      aria-label={`Practice ${subj.subject}. Current mastery ${subj.progressPercent}%`}
                      className="px-2.5 py-1 rounded-lg bg-surface border border-border hover:border-primary text-primary text-[11px] font-bold transition-all focus:ring-2 focus:ring-primary"
                    >
                      {isHindi ? 'अभ्यास' : 'Practice'}
                    </Link>
                  </div>
                </div>

                {/* Progress Bar with Subject Gradient */}
                <div
                  role="progressbar"
                  aria-valuenow={subj.progressPercent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${subj.subject} mastery progress: ${subj.progressPercent}%`}
                  className="w-full bg-surface rounded-full h-2 overflow-hidden border border-border"
                >
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${colors.gradient} transition-all duration-500`}
                    style={{ width: `${subj.progressPercent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Helpful Tip Footer */}
        <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-foreground-muted">
          <span>{isHindi ? 'सलाह: कमजोर विषयों पर पहले ध्यान दें' : 'Tip: Focus on weaker areas first'}</span>
          <Award className="w-4 h-4 text-status-warning" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
};
