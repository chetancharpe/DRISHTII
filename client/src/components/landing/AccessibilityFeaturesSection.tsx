import React from 'react';
import {
  Volume2,
  Keyboard,
  Type,
  Sparkles,
  Headphones,
  Activity,
  Languages,
  Clock,
} from 'lucide-react';
import { Card } from '../common/Card';

export const AccessibilityFeaturesSection: React.FC = () => {
  const features = [
    {
      icon: <Volume2 className="w-6 h-6 text-primary" aria-hidden="true" />,
      title: 'Screen Reader Friendly',
      desc: 'Semantic page structures, meaningful labels, accessible controls, and assistive-technology-friendly interactions tested with NVDA, JAWS, and VoiceOver.',
    },
    {
      icon: <Keyboard className="w-6 h-6 text-primary" aria-hidden="true" />,
      title: 'Keyboard First',
      desc: 'Navigate and operate important functionality without requiring a mouse. Skip directly to exam questions, jump between sections, and trigger shortcuts with Alt+A.',
    },
    {
      icon: <Type className="w-6 h-6 text-primary" aria-hidden="true" />,
      title: 'Flexible Text',
      desc: 'Adjust text size across four scalable zoom levels (87.5% to 140%) without breaking exam columns, mathematical notation, or option buttons.',
    },
    {
      icon: <Sparkles className="w-6 h-6 text-primary" aria-hidden="true" />,
      title: 'High Contrast Mode',
      desc: 'Engineered for low vision and photophobia: pure OLED black canvas (#000000), vivid yellow accents, and sharp 2px boundaries for instant target recognition.',
    },
    {
      icon: <Headphones className="w-6 h-6 text-primary" aria-hidden="true" />,
      title: 'Audio Assistance',
      desc: 'Optional speech support for questions, instructions, and important status information. Strictly candidate-controlled with zero unexpected autoplay.',
    },
    {
      icon: <Activity className="w-6 h-6 text-primary" aria-hidden="true" />,
      title: 'Reduced Motion',
      desc: 'Respects system prefers-reduced-motion and provides an in-app toggle to remove non-essential transitions, parallax, and UI movement for vestibular comfort.',
    },
    {
      icon: <Languages className="w-6 h-6 text-primary" aria-hidden="true" />,
      title: 'Multilingual Ready',
      desc: 'Native Devanagari typography and pronunciation dictionaries for English and Hindi, engineered to support Marathi, Bengali, Tamil, and Telugu.',
    },
    {
      icon: <Clock className="w-6 h-6 text-primary" aria-hidden="true" />,
      title: 'Accessible Timer',
      desc: 'Presents remaining time with textual countdowns and acoustic milestone earcons rather than depending solely on flashing red color shifts.',
    },
  ];

  return (
    <section
      id="accessibility"
      aria-labelledby="accessibility-features-heading"
      className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
    >
      <div className="text-center max-w-3xl mx-auto mb-16">
        <span className="text-xs font-bold uppercase tracking-wider text-primary mb-2 block">
          Foundational Accessibility
        </span>
        <h2
          id="accessibility-features-heading"
          className="text-h1 font-bold text-foreground mb-4"
        >
          Accessibility Built Into Every Step
        </h2>
        <p className="text-body text-foreground-secondary leading-relaxed">
          Accessibility is not a plugin or an afterthought. Every feature in GoWow is engineered to provide equivalent, independent access to examination materials and assessments.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature) => (
          <Card
            key={feature.title}
            variant="default"
            className="flex flex-col justify-start hover:border-border-strong transition-all duration-fast"
          >
            <div
              className="w-12 h-12 rounded-lg bg-surface-elevated border border-border flex items-center justify-center mb-4 shrink-0"
              aria-hidden="true"
            >
              {feature.icon}
            </div>
            <h3 className="text-base font-bold text-foreground mb-2">
              {feature.title}
            </h3>
            <p className="text-xs text-foreground-muted leading-relaxed">
              {feature.desc}
            </p>
          </Card>
        ))}
      </div>
    </section>
  );
};
