import React from 'react';
import { Link } from 'react-router-dom';
import { QuickActionItem } from '../../types/candidateDashboard';
import { BookOpen, Award, Calendar, BarChart3, ArrowRight } from 'lucide-react';
import { useAccessibility } from '../../hooks/useAccessibility';

export interface QuickActionsGridProps {
  actions: QuickActionItem[];
  className?: string;
}

export const QuickActionsGrid: React.FC<QuickActionsGridProps> = ({ actions, className = '' }) => {
  const { preferences } = useAccessibility();
  const isHindi =
    preferences?.language === 'hi' ||
    (typeof document !== 'undefined' && document.documentElement.lang === 'hi');

  const getCardStyle = (name: QuickActionItem['iconName']) => {
    switch (name) {
      case 'practice':
        return {
          icon: <BookOpen className="w-5 h-5 text-emerald-500" aria-hidden="true" />,
          iconBg: 'bg-emerald-500/10 border-emerald-500/20',
          badgeBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
          hoverBorder: 'hover:border-emerald-500/50',
        };
      case 'mock':
        return {
          icon: <Award className="w-5 h-5 text-amber-500" aria-hidden="true" />,
          iconBg: 'bg-amber-500/10 border-amber-500/20',
          badgeBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
          hoverBorder: 'hover:border-amber-500/50',
        };
      case 'exams':
        return {
          icon: <Calendar className="w-5 h-5 text-blue-500" aria-hidden="true" />,
          iconBg: 'bg-blue-500/10 border-blue-500/20',
          badgeBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
          hoverBorder: 'hover:border-blue-500/50',
        };
      case 'results':
        return {
          icon: <BarChart3 className="w-5 h-5 text-violet-500" aria-hidden="true" />,
          iconBg: 'bg-violet-500/10 border-violet-500/20',
          badgeBg: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
          hoverBorder: 'hover:border-violet-500/50',
        };
      default:
        return {
          icon: <BookOpen className="w-5 h-5 text-primary" aria-hidden="true" />,
          iconBg: 'bg-primary/10 border-primary/20',
          badgeBg: 'bg-primary/10 text-primary border-primary/20',
          hoverBorder: 'hover:border-primary/50',
        };
    }
  };

  return (
    <section aria-labelledby="quick-actions-heading" className={`flex flex-col gap-3.5 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 id="quick-actions-heading" className="text-base sm:text-lg font-black text-foreground tracking-tight">
          {isHindi ? 'मुख्य परीक्षा केंद्र एवं सेवाएं' : 'Core Learning & Examination Portals'}
        </h2>
        <span className="text-xs text-foreground-muted">
          {isHindi ? 'आवाज़ से चुनने के लिए "अभ्यास" या "मॉक टेस्ट" बोलें' : 'Speak "Practice" or "Mock Tests" to open'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" role="list">
        {actions.map((act) => {
          const style = getCardStyle(act.iconName);

          const titleText = isHindi
            ? act.title.includes('Curriculum') || act.title.includes('Learn')
              ? 'पाठ्यक्रम देखें'
              : act.title.includes('Practice')
              ? 'अभ्यास केंद्र'
              : act.title.includes('Mock')
              ? 'मॉक टेस्ट पोर्टल'
              : act.title.includes('Exam')
              ? 'आधिकारिक परीक्षाएं'
              : act.title.includes('Result') || act.title.includes('Score')
              ? 'परिणाम व स्कोरकार्ड'
              : act.title
            : act.title;

          return (
            <Link
              key={act.id}
              to={act.route}
              role="listitem"
              className={`group relative flex flex-col justify-between p-5 rounded-2xl border border-border bg-surface/80 hover:bg-surface-elevated/90 ${style.hoverBorder} transition-all duration-200 min-h-[130px] backdrop-blur-xl shadow-glass hover:shadow-glass-elevated hover:-translate-y-1 focus:outline-none focus-visible:ring-3 focus-visible:ring-primary focus-visible:ring-offset-2 glass-specular`}
              aria-label={`${titleText}: ${act.description}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div
                  className={`p-2.5 rounded-xl border ${style.iconBg} transition-transform group-hover:scale-105`}
                >
                  {style.icon}
                </div>
                {act.badge && (
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${style.badgeBg}`}
                  >
                    {act.badge}
                  </span>
                )}
              </div>

              <div className="mt-3 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                    {titleText}
                  </span>
                  <ArrowRight
                    className="w-4 h-4 text-foreground-muted group-hover:text-primary transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </div>
                <p className="text-xs text-foreground-muted leading-relaxed line-clamp-2">
                  {act.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};
