import React from 'react';
import {
  CheckCircle2,
  XCircle,
  ShieldCheck,
} from 'lucide-react';

export const ProblemSection: React.FC = () => {
  const comparisonItems = [
    {
      barrierTitle: 'Mouse-Dependent Controls',
      barrierDesc: 'Complex drag-and-drop questions and click-only menus that trap or exclude keyboard test-takers.',
      solutionTitle: '100% Keyboard Operability',
      solutionDesc: 'Seamless navigation through sequential Tab, arrow keys, and hotkeys [1-4] with persistent visible focus.',
    },
    {
      barrierTitle: 'Flashing Visual Timers',
      barrierDesc: 'Sudden red flashing countdowns that cause visual disorientation without verbal or acoustic milestones.',
      solutionTitle: 'Calm Acoustic Milestones',
      solutionDesc: 'Gentle, candidate-controlled chime earcons at 15m, 5m, and 1m intervals alongside clear text labels.',
    },
    {
      barrierTitle: 'Broken Mathematical Formulas',
      barrierDesc: 'Equations rendered as unlabelled images or flat strings that screen readers garble or skip entirely.',
      solutionTitle: 'Spoken Mathematical Transcripts',
      solutionDesc: 'Every formula includes an explicit spoken linear transcript ensuring unambiguous voice playback.',
    },
    {
      barrierTitle: 'Faint Low-Contrast Palettes',
      barrierDesc: 'Low-contrast gray text on white backgrounds that induces severe eye strain and cognitive exhaustion.',
      solutionTitle: 'OLED High Contrast (AAA)',
      solutionDesc: '7:1 contrast mode with pitch-black surfaces, vivid yellow markers, and scalable typography up to 140%.',
    },
  ];

  return (
    <section
      id="problem"
      aria-labelledby="problem-heading"
      className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
    >
      <div className="text-center max-w-3xl mx-auto mb-16">
        <span className="text-xs font-bold uppercase tracking-wider text-primary mb-2 block">
          Why Accessibility Matters
        </span>
        <h2 id="problem-heading" className="text-h1 font-bold text-foreground mb-4">
          Exams Shouldn't Depend on Sight
        </h2>
        <p className="text-body text-foreground-secondary leading-relaxed">
          Traditional digital assessment systems were built around an assumption of mouse pointing and visual browsing. When digital barriers exist, capable candidates are held back by technology rather than being tested on their genuine knowledge.
        </p>
      </div>

      {/* Side-by-Side Architectural Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mb-12">
        {/* Left Column: Traditional Barriers */}
        <div className="p-6 sm:p-8 rounded-2xl border border-status-error/30 bg-status-error-bg/20 flex flex-col gap-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-status-error/20">
            <XCircle className="w-6 h-6 text-status-error shrink-0" aria-hidden="true" />
            <div>
              <h3 className="text-lg font-bold text-foreground">
                Traditional Testing Portals
              </h3>
              <p className="text-xs text-foreground-muted">
                Unspoken assumptions that create exclusion
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {comparisonItems.map((item) => (
              <div key={item.barrierTitle} className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-status-error shrink-0 mt-2" />
                <div>
                  <h4 className="text-sm font-bold text-foreground">
                    {item.barrierTitle}
                  </h4>
                  <p className="text-xs text-foreground-muted leading-relaxed mt-0.5">
                    {item.barrierDesc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: The DRISHTI Standard */}
        <div className="p-6 sm:p-8 rounded-2xl border-2 border-primary/40 bg-gradient-to-b from-surface-elevated to-surface flex flex-col gap-6 shadow-md">
          <div className="flex items-center gap-2.5 pb-4 border-b border-border">
            <CheckCircle2 className="w-6 h-6 text-status-success shrink-0" aria-hidden="true" />
            <div>
              <h3 className="text-lg font-bold text-foreground">
                The DRISHTI Standard
              </h3>
              <p className="text-xs text-primary font-semibold">
                Accessibility engineered into core architecture
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {comparisonItems.map((item) => (
              <div key={item.solutionTitle} className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-status-success shrink-0 mt-2" />
                <div>
                  <h4 className="text-sm font-bold text-foreground">
                    {item.solutionTitle}
                  </h4>
                  <p className="text-xs text-foreground-secondary leading-relaxed mt-0.5">
                    {item.solutionDesc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Philosophy Callout Banner */}
      <div className="rounded-xl border border-border bg-surface p-6 sm:p-8 text-center max-w-3xl mx-auto shadow-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <ShieldCheck className="w-5 h-5 text-primary" aria-hidden="true" />
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            Our Guiding Commitment
          </span>
        </div>
        <p className="text-base sm:text-lg font-bold text-foreground mb-2">
          "Every candidate deserves to sit for examinations with absolute independence."
        </p>
        <p className="text-xs sm:text-sm text-foreground-muted leading-relaxed max-w-2xl mx-auto">
          We eliminate the forced reliance on scribes and mouse interfaces, providing low-vision and visually impaired test-takers with equal agency to demonstrate their true potential.
        </p>
      </div>
    </section>
  );
};
