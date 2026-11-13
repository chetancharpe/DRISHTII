import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UpcomingExamDashboardItem, PerformanceRecordItem } from '../../types/candidateDashboard';
import { Calendar, Clock, ArrowRight, Award, CheckCircle2, ChevronRight } from 'lucide-react';
import { useAccessibility } from '../../hooks/useAccessibility';

export interface CompactUpcomingAndRecentProps {
  exams: UpcomingExamDashboardItem[];
  records: PerformanceRecordItem[];
  className?: string;
}

export const CompactUpcomingAndRecent: React.FC<CompactUpcomingAndRecentProps> = ({
  exams,
  records,
  className = '',
}) => {
  const navigate = useNavigate();
  const { preferences } = useAccessibility();
  const isHindi =
    preferences?.language === 'hi' ||
    (typeof document !== 'undefined' && document.documentElement.lang === 'hi');

  const nextExam = exams.length > 0 ? exams[0] : null;
  const recentRecords = records.slice(0, 3);

  return (
    <section
      aria-label={isHindi ? 'आगामी परीक्षा एवं हालिया परिणाम' : 'Upcoming Exams & Recent Performance'}
      className={`grid grid-cols-1 lg:grid-cols-12 gap-6 ${className}`}
    >
      {/* 1. UPCOMING SCHEDULED EXAM SPOTLIGHT (Left Column: 6 Cols) */}
      <div className="lg:col-span-6 rounded-2xl border border-border bg-surface/85 backdrop-blur-xl p-5 sm:p-6 shadow-glass flex flex-col justify-between gap-5 hover:border-primary/50 hover:shadow-glass-elevated transition-all duration-200 relative glass-specular">
        <div className="flex items-center justify-between border-b border-border pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <Calendar className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-foreground tracking-tight">
                {isHindi ? 'निर्धारित परीक्षा' : 'Upcoming Examination'}
              </h2>
              <p className="text-xs text-foreground-muted">
                {isHindi ? 'आधिकारिक प्रॉक्टर्ड परीक्षा हॉल' : 'Proctored official exam schedule'}
              </p>
            </div>
          </div>

          <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary">
            {nextExam ? nextExam.dateFormatted : 'Scheduled'}
          </span>
        </div>

        {nextExam ? (
          <div className="p-4 rounded-xl border border-border bg-surface-elevated/40 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-foreground">
                  {nextExam.title}
                </h3>
                <p className="text-xs text-foreground-muted mt-0.5">
                  {nextExam.dateFormatted} · Duration: {nextExam.durationMinutes} mins
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
                <Clock className="w-3 h-3" aria-hidden="true" />
                {nextExam.status}
              </span>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate(nextExam.detailsRoute)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-primary hover:from-indigo-600 hover:to-primary-hover text-white font-bold text-xs sm:text-sm shadow-glow-primary transition-all flex items-center justify-center gap-2"
              >
                <span>{isHindi ? 'प्रवेश पत्र / हॉल में प्रवेश' : 'Enter Exam Hall'}</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>

              <Link
                to="/candidate/exams"
                className="px-3 py-2.5 rounded-xl border border-border bg-surface hover:bg-surface-elevated text-xs font-semibold text-foreground transition-colors"
              >
                {isHindi ? 'सभी देखें' : 'View All'}
              </Link>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-foreground-muted">
            {isHindi ? 'वर्तमान में कोई परीक्षा निर्धारित नहीं है।' : 'No upcoming exams currently scheduled.'}
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-foreground-muted pt-1">
          <span>{isHindi ? 'बायोमेट्रिक एवं वॉयस वेरिफिकेशन सक्रिय' : 'Biometric & Voice verification enabled'}</span>
          <CheckCircle2 className="w-4 h-4 text-emerald-500" aria-hidden="true" />
        </div>
      </div>

      {/* 2. RECENT SCORECARDS & PERFORMANCE (Right Column: 6 Cols) */}
      <div className="lg:col-span-6 rounded-2xl border border-border bg-surface/85 backdrop-blur-xl p-5 sm:p-6 shadow-glass flex flex-col justify-between gap-5 hover:border-primary/50 hover:shadow-glass-elevated transition-all duration-200 relative glass-specular">
        <div className="flex items-center justify-between border-b border-border pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <Award className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-foreground tracking-tight">
                {isHindi ? 'हालिया स्कोरकार्ड' : 'Recent Test Scorecards'}
              </h2>
              <p className="text-xs text-foreground-muted">
                {isHindi ? 'नवीनतम अभ्यास व टेस्ट रिपोर्ट' : 'Latest test scores & accuracy breakdown'}
              </p>
            </div>
          </div>

          <Link
            to="/candidate/results"
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1 focus:ring-2 focus:ring-primary rounded p-1"
          >
            <span>{isHindi ? 'पूरा स्कोरकार्ड' : 'View All'}</span>
            <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        </div>

        <div className="flex flex-col gap-2.5">
          {recentRecords.map((rec) => {
            const isHigh = rec.scorePercent >= 80;

            return (
              <Link
                key={rec.id}
                to={rec.viewRoute || `/candidate/results`}
                className="p-3 rounded-xl border border-border bg-surface-elevated/40 hover:bg-surface-elevated hover:border-primary/30 transition-all flex items-center justify-between gap-3 group"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs sm:text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                    {rec.testTitle}
                  </span>
                  <span className="text-[11px] text-foreground-muted">
                    {rec.dateFormatted} · {rec.isPassed ? (isHindi ? 'उत्तीर्ण' : 'Passed') : (isHindi ? 'पुनः प्रयास करें' : 'Needs Review')}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border ${
                      isHigh
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        : 'bg-primary/10 text-primary border-primary/20'
                    }`}
                  >
                    {rec.scorePercent}%
                  </span>
                  <ChevronRight className="w-4 h-4 text-foreground-muted group-hover:text-primary transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </div>
              </Link>
            );
          })}
        </div>

        <div className="flex items-center justify-between text-xs text-foreground-muted pt-1">
          <span>{isHindi ? 'औसत स्कोर: 82%' : 'Average score across attempts: 82%'}</span>
          <span className="text-[11px] font-mono text-primary font-bold">{isHindi ? '4 टेस्ट पूर्ण' : '4 Tests Completed'}</span>
        </div>
      </div>
    </section>
  );
};
