import React from 'react';
import { ShieldCheck, Check } from 'lucide-react';

export const AccessibilityCommitmentSection: React.FC = () => {
  const principles = [
    { title: 'Semantic HTML First', desc: 'Native landmarks, headings, tables, and buttons rather than generic div elements.' },
    { title: 'Keyboard Accessibility', desc: 'Every button, link, and input is reachable and operable with standard key navigation.' },
    { title: 'Screen-Reader Compatibility', desc: 'Engineered for linear reading flow and standard assistive technology compatibility.' },
    { title: 'Always-Visible Focus Rings', desc: '3px solid focus indicators that are never suppressed with outline: none.' },
    { title: 'Accessible Form Architecture', desc: 'Explicit label associations, inline helper notes, and polite dynamic error alerts.' },
    { title: 'Calculated Visual Contrast', desc: 'Exceeds standard 4.5:1 ratios with a dedicated OLED pure black High Contrast mode.' },
    { title: 'Scalable Root Typography', desc: 'Scales from 87.5% to 140% without clipping options or collapsing table columns.' },
    { title: 'Reduced Motion Support', desc: 'Honors vestibular safety preferences by removing distracting parallax and animations.' },
    { title: 'Accessible Dynamic Feedback', desc: 'Live regions announce exam timer milestones and submission status without visual dependence.' },
  ];

  return (
    <section
      aria-labelledby="a11y-commitment-heading"
      className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-border"
    >
      <div className="p-8 sm:p-12 rounded-2xl border border-border bg-surface-elevated/40">
        <div className="max-w-3xl mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-surface text-xs font-semibold text-primary mb-3">
            <ShieldCheck className="w-4 h-4 text-primary" aria-hidden="true" />
            <span>Product Engineering Philosophy</span>
          </div>
          <h2 id="a11y-commitment-heading" className="text-h1 font-bold text-foreground mb-4">
            Accessibility Is a Product Requirement
          </h2>
          <p className="text-body text-foreground-secondary leading-relaxed">
            We reject the notion that accessibility is an optional overlay or a secondary toggle. True accessibility requires intentional engineering at the foundational layer of code.
          </p>
          <div className="mt-3 p-3 rounded-md border border-primary/30 bg-surface text-xs font-mono text-foreground font-semibold">
            "Designed with WCAG 2.1 AA principles in mind."
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {principles.map((p) => (
            <div
              key={p.title}
              className="p-4 rounded-lg border border-border bg-surface flex items-start gap-3"
            >
              <div
                className="w-6 h-6 rounded-full bg-status-success-bg border border-status-success flex items-center justify-center shrink-0 mt-0.5"
                aria-hidden="true"
              >
                <Check className="w-3.5 h-3.5 text-status-success stroke-[3]" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-foreground mb-0.5">
                  {p.title}
                </span>
                <p className="text-xs text-foreground-muted leading-relaxed">
                  {p.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
