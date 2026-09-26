import React from 'react';
import { UserCheck, BookOpen, Target, Award, TrendingUp } from 'lucide-react';

export const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Create Your Profile',
      desc: 'Set your sensory and navigational preferences: font size scale, audio feedback, high contrast, and keyboard mode.',
      icon: <UserCheck className="w-5 h-5 text-primary" aria-hidden="true" />,
    },
    {
      num: '02',
      title: 'Prepare',
      desc: 'Explore subjects, conceptual summaries, mathematical formulas, and sample questions formatted for linear reading order.',
      icon: <BookOpen className="w-5 h-5 text-primary" aria-hidden="true" />,
    },
    {
      num: '03',
      title: 'Practice',
      desc: 'Attempt topic-wise quizzes and timed mock tests with full keyboard control, accessible timer cues, and instant feedback.',
      icon: <Target className="w-5 h-5 text-primary" aria-hidden="true" />,
    },
    {
      num: '04',
      title: 'Take Your Exam',
      desc: 'Attempt official competitive assessments and institutional tests independently in a secure, barrier-free environment.',
      icon: <Award className="w-5 h-5 text-primary" aria-hidden="true" />,
    },
    {
      num: '05',
      title: 'Improve',
      desc: 'Analyze score telemetry, review flagged questions, identify specific weak topics, and practice targeted revision modules.',
      icon: <TrendingUp className="w-5 h-5 text-primary" aria-hidden="true" />,
    },
  ];

  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-heading"
      className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-border"
    >
      <div className="text-center max-w-3xl mx-auto mb-16">
        <span className="text-xs font-bold uppercase tracking-wider text-primary mb-2 block">
          Step-by-Step Pathway
        </span>
        <h2 id="how-it-works-heading" className="text-h1 font-bold text-foreground mb-4">
          How It Works
        </h2>
        <p className="text-body text-foreground-secondary leading-relaxed">
          From initial registration through exam submission and analytics, every phase is engineered for autonomous candidate operation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {steps.map((step) => (
          <div
            key={step.num}
            className="p-6 rounded-lg border border-border bg-surface flex flex-col justify-between hover:border-primary/50 transition-colors relative"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl font-extrabold font-mono text-primary">
                  {step.num}
                </span>
                <div
                  className="w-9 h-9 rounded-md bg-surface-elevated border border-border flex items-center justify-center shrink-0"
                  aria-hidden="true"
                >
                  {step.icon}
                </div>
              </div>

              <h3 className="text-base font-bold text-foreground mb-2">
                {step.title}
              </h3>
              <p className="text-xs text-foreground-muted leading-relaxed">
                {step.desc}
              </p>
            </div>

            <div className="mt-6 pt-3 border-t border-border/60 text-[11px] font-mono text-foreground-muted">
              Step {step.num} of 05
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
