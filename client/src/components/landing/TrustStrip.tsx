import React from 'react';
import { Headphones, Keyboard, Eye, Sparkles, Languages } from 'lucide-react';

export const TrustStrip: React.FC = () => {
  const trustItems = [
    {
      icon: <Eye className="w-5 h-5 text-primary" aria-hidden="true" />,
      title: 'Screen Reader Friendly',
      desc: 'Semantic landmarks, linear reading order, and descriptive feedback',
    },
    {
      icon: <Keyboard className="w-5 h-5 text-primary" aria-hidden="true" />,
      title: 'Keyboard First',
      desc: 'Complete workflow navigation with zero mouse dependency',
    },
    {
      icon: <Headphones className="w-5 h-5 text-primary" aria-hidden="true" />,
      title: 'Accessible Audio',
      desc: 'Candidate-controlled earcons and optional speech support',
    },
    {
      icon: <Sparkles className="w-5 h-5 text-primary" aria-hidden="true" />,
      title: 'High Contrast Mode',
      desc: 'OLED pure black and vivid yellow AAA contrast palettes',
    },
    {
      icon: <Languages className="w-5 h-5 text-primary" aria-hidden="true" />,
      title: 'Multilingual Ready',
      desc: 'Initial support for English & Hindi, prepared for regional scripts',
    },
  ];

  return (
    <section
      aria-label="Core Accessibility Strengths"
      className="border-y border-border bg-surface/50 py-8 px-4 sm:px-6"
    >
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        <div className="text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-foreground-muted">
            Built Around Independent Examination
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {trustItems.map((item) => (
            <div
              key={item.title}
              className="flex flex-col items-center text-center p-3 rounded-lg border border-transparent hover:border-border transition-colors"
            >
              <div
                className="w-10 h-10 rounded-full bg-surface-elevated border border-border flex items-center justify-center mb-3"
                aria-hidden="true"
              >
                {item.icon}
              </div>
              <h3 className="text-sm font-bold text-foreground mb-1">
                {item.title}
              </h3>
              <p className="text-xs text-foreground-muted leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
