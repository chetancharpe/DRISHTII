import React from 'react';
import {
  MousePointerClick,
  FileQuestion,
  VolumeX,
  ClockAlert,
  SunMedium,
  Compass,
  FileCode,
  SlidersHorizontal,
  CheckCircle,
} from 'lucide-react';

export const ProblemSection: React.FC = () => {
  const barriers = [
    {
      icon: <FileQuestion className="w-5 h-5 text-status-warning" aria-hidden="true" />,
      title: 'Inaccessible Question Layouts',
      desc: 'Complex tables, unlabeled SVG diagrams, and unformatted formulas break standard reading flow.',
    },
    {
      icon: <VolumeX className="w-5 h-5 text-status-warning" aria-hidden="true" />,
      title: 'Poor Screen-Reader Support',
      desc: 'Missing ARIA live regions and unannounced question updates leave candidates disoriented.',
    },
    {
      icon: <MousePointerClick className="w-5 h-5 text-status-warning" aria-hidden="true" />,
      title: 'Mouse-Dependent Interfaces',
      desc: 'Required drag-and-drop questions and inaccessible hover menus exclude keyboard-only candidates.',
    },
    {
      icon: <ClockAlert className="w-5 h-5 text-status-warning" aria-hidden="true" />,
      title: 'Flashing Visual Timers',
      desc: 'Countdown timers that rely only on red flashing colors without acoustic cues or descriptive aria announcements.',
    },
    {
      icon: <SunMedium className="w-5 h-5 text-status-warning" aria-hidden="true" />,
      title: 'Low Visual Contrast',
      desc: 'Faint gray text on white backgrounds causing severe cognitive fatigue for low-vision candidates.',
    },
    {
      icon: <Compass className="w-5 h-5 text-status-warning" aria-hidden="true" />,
      title: 'Unpredictable Navigation',
      desc: 'Inconsistent tab orders and missing skip links that trap focus inside unnavigable widgets.',
    },
    {
      icon: <FileCode className="w-5 h-5 text-status-warning" aria-hidden="true" />,
      title: 'Inaccessible Form Controls',
      desc: 'Custom radio buttons and checkboxes without proper label associations or keyboard listeners.',
    },
    {
      icon: <SlidersHorizontal className="w-5 h-5 text-status-warning" aria-hidden="true" />,
      title: 'Zero User Customization',
      desc: 'Rigid interfaces preventing candidates from scaling text, dampening motion, or enabling dark palettes.',
    },
  ];

  return (
    <section
      id="problem"
      aria-labelledby="problem-heading"
      className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
    >
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h2 id="problem-heading" className="text-h1 font-bold text-foreground mb-4">
          Exams Shouldn't Depend on Sight
        </h2>
        <p className="text-body text-foreground-secondary leading-relaxed">
          Traditional assessment platforms were constructed with an unspoken assumption of vision and mouse navigation. When digital barriers exist in technology, capable candidates face unnecessary friction rather than demonstrating their genuine knowledge.
        </p>
      </div>

      {/* Barriers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {barriers.map((b) => (
          <div
            key={b.title}
            className="p-5 rounded-lg border border-border bg-surface flex flex-col justify-start gap-2.5 transition-colors"
          >
            <div
              className="w-9 h-9 rounded-md bg-surface-elevated border border-border flex items-center justify-center mb-1 shrink-0"
              aria-hidden="true"
            >
              {b.icon}
            </div>
            <h3 className="text-base font-bold text-foreground leading-snug">
              {b.title}
            </h3>
            <p className="text-xs text-foreground-muted leading-relaxed">
              {b.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Transition Banner */}
      <div className="rounded-xl border border-primary/40 bg-surface-elevated p-8 text-center max-w-3xl mx-auto shadow-sm">
        <div className="flex items-center justify-center gap-2 mb-3">
          <CheckCircle className="w-5 h-5 text-primary" aria-hidden="true" />
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            The GoWow Approach
          </span>
        </div>
        <p className="text-lg font-bold text-foreground mb-2">
          "GoWow is designed to remove these barriers from the beginning."
        </p>
        <p className="text-sm text-foreground-secondary leading-relaxed">
          We treat accessibility as the core product architecture, ensuring every candidate experiences predictable keyboard navigation, reliable speech linearizations, and flexible sensory calibration.
        </p>
      </div>
    </section>
  );
};
