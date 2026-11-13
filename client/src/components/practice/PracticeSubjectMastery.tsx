import React from 'react';
import { BookOpen, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAccessibility } from '../../hooks/useAccessibility';

export interface PracticeSubjectMasteryProps {
  onStartSubjectPractice: (subjectId: string) => void;
  className?: string;
}

export const PracticeSubjectMastery: React.FC<PracticeSubjectMasteryProps> = ({
  onStartSubjectPractice,
  className = '',
}) => {
  const { preferences } = useAccessibility();
  const isHindi =
    preferences?.language === 'hi' ||
    (typeof document !== 'undefined' && document.documentElement.lang === 'hi');

  const subjects = [
    {
      id: 'mathematics',
      nameEn: 'Mathematics & Quantitative Aptitude',
      nameHi: 'गणित एवं संख्यात्मक अभिरुचि',
      progress: 82,
      masteredTopics: 2,
      totalTopics: 3,
      color: 'from-emerald-500 to-teal-600',
      badgeBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    },
    {
      id: 'reasoning',
      nameEn: 'Logical & Analytical Reasoning',
      nameHi: 'तार्किक एवं विश्लेषणात्मक तर्कशक्ति',
      progress: 85,
      masteredTopics: 2,
      totalTopics: 3,
      color: 'from-violet-500 to-purple-600',
      badgeBg: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
    },
    {
      id: 'english',
      nameEn: 'English Language & Comprehension',
      nameHi: 'अंग्रेजी भाषा एवं बोधगम्यता',
      progress: 78,
      masteredTopics: 2,
      totalTopics: 3,
      color: 'from-blue-500 to-indigo-600',
      badgeBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    },
    {
      id: 'general-knowledge',
      nameEn: 'General Knowledge & Current Affairs',
      nameHi: 'सामान्य ज्ञान एवं समसामयिकी',
      progress: 65,
      masteredTopics: 1,
      totalTopics: 3,
      color: 'from-amber-500 to-orange-600',
      badgeBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    },
  ];

  return (
    <section aria-labelledby="subject-mastery-heading" className={`p-5 sm:p-6 rounded-2xl border-2 border-border bg-surface flex flex-col gap-5 shadow-sm ${className}`}>
      <div className="flex items-center justify-between border-b border-border/80 pb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
          <h2 id="subject-mastery-heading" className="text-base sm:text-lg font-black text-foreground tracking-tight">
            {isHindi ? 'विषयवार अभ्यास निपुणता' : 'Subject Practice Mastery'}
          </h2>
        </div>
        <span className="text-xs text-foreground-muted">
          {isHindi ? 'सटीकता और हल किए गए विषयों के आधार पर' : 'Based on ongoing question accuracy'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {subjects.map((s) => {
          const name = isHindi ? s.nameHi : s.nameEn;

          return (
            <div
              key={s.id}
              className="p-4 rounded-xl border border-border bg-surface-elevated/50 flex flex-col justify-between gap-3 hover:border-primary/40 transition-all"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-sm text-foreground">
                  {name}
                </span>
                <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border ${s.badgeBg}`}>
                  {s.progress}% {isHindi ? 'सटीकता' : 'Accuracy'}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs text-foreground-muted">
                  <span className="flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
                    <span>
                      {s.masteredTopics} / {s.totalTopics} {isHindi ? 'विषय मास्टर' : 'topics mastered'}
                    </span>
                  </span>
                  <span className="font-mono font-bold text-foreground">{s.progress}%</span>
                </div>

                <div
                  role="progressbar"
                  aria-valuenow={s.progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${name}: ${s.progress}% practice mastery`}
                  className="w-full bg-border rounded-full h-2.5 overflow-hidden"
                >
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${s.color} transition-all duration-700 ease-out`}
                    style={{ width: `${s.progress}%` }}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => onStartSubjectPractice(s.id)}
                className="self-end inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded py-1 px-1.5 min-h-[32px]"
                aria-label={`${name}: ${isHindi ? 'इस विषय का अभ्यास करें' : 'Practice this subject'}`}
              >
                <span>{isHindi ? 'इस विषय का अभ्यास करें' : 'Practice Subject'}</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
};
