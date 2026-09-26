import React from 'react';
import { BookOpen, Target, CheckCircle2, Award, LineChart, TrendingUp } from 'lucide-react';

export const IndependenceSection: React.FC = () => {
  const lifecycle = [
    { title: 'Learn', desc: 'Accessible study modules & concepts', icon: <BookOpen className="w-5 h-5" /> },
    { title: 'Practice', desc: 'Untimed drills with instant explanations', icon: <Target className="w-5 h-5" /> },
    { title: 'Prepare', desc: 'Realistic full-length simulations', icon: <CheckCircle2 className="w-5 h-5" /> },
    { title: 'Exam', desc: 'Secure, autonomous assessment attempt', icon: <Award className="w-5 h-5" /> },
    { title: 'Result', desc: 'Transparent breakdown of answers & timing', icon: <LineChart className="w-5 h-5" /> },
    { title: 'Improve', desc: 'Targeted revision on identified weak areas', icon: <TrendingUp className="w-5 h-5" /> },
  ];

  return (
    <section
      aria-labelledby="independence-heading"
      className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-border"
    >
      <div className="max-w-3xl mx-auto text-center mb-16">
        <span className="text-xs font-bold uppercase tracking-wider text-primary mb-2 block">
          End-to-End Autonomy
        </span>
        <h2 id="independence-heading" className="text-h1 font-bold text-foreground mb-4">
          Designed for Independent Examination
        </h2>
        <p className="text-body text-foreground-secondary leading-relaxed">
          GoWow brings accessibility into the complete examination journey — from preparation and practice to the final result.
        </p>
      </div>

      {/* Linear Lifecycle Flow */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {lifecycle.map((item, idx) => (
          <div
            key={item.title}
            className="p-4 rounded-lg border border-border bg-surface flex flex-col items-center text-center justify-between hover:border-primary/50 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-surface-elevated border border-border flex items-center justify-center text-primary mb-3">
              {item.icon}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-foreground mb-1">
                {item.title}
              </span>
              <p className="text-[11px] text-foreground-muted leading-tight">
                {item.desc}
              </p>
            </div>
            {idx < lifecycle.length - 1 && (
              <div className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 text-foreground-muted pointer-events-none">
                {/* Visual indicator handled by grid layout */}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};
