import React from 'react';
import {
  LayoutDashboard,
  FileCheck,
  FileSpreadsheet,
  MonitorCheck,
  CheckCircle2,
  LineChart,
  Target,
  Volume2,
} from 'lucide-react';
import { Card } from '../common/Card';

export const CandidateExperienceSection: React.FC = () => {
  const showcaseModules = [
    {
      icon: <LayoutDashboard className="w-5 h-5 text-primary" aria-hidden="true" />,
      title: 'Adaptive Dashboard',
      desc: 'Instant overview of daily targets, routine streaks, active assignments, and your next study session.',
    },
    {
      icon: <FileCheck className="w-5 h-5 text-primary" aria-hidden="true" />,
      title: 'Topic-Wise Practice',
      desc: 'Comprehensive practice question banks with adjustable font scaling, spoken formulas, and instant acoustic feedback.',
    },
    {
      icon: <FileSpreadsheet className="w-5 h-5 text-primary" aria-hidden="true" />,
      title: 'Timed Mock Simulations',
      desc: 'Simulate high-stakes exam conditions with realistic question palettes, calm countdown alerts, and section hopping.',
    },
    {
      icon: <MonitorCheck className="w-5 h-5 text-primary" aria-hidden="true" />,
      title: 'Barrier-Free Exam Hall',
      desc: 'Strictly keyboard-operable interface with Alt+A calibration, persistent focus outlines, and auto-saving synchronization.',
    },
    {
      icon: <CheckCircle2 className="w-5 h-5 text-primary" aria-hidden="true" />,
      title: 'Transparent Scorecards',
      desc: 'Detailed diagnostic results with section-wise marks, pacing telemetry, and screen-reader accessible tabular summaries.',
    },
    {
      icon: <LineChart className="w-5 h-5 text-primary" aria-hidden="true" />,
      title: 'Progress Telemetry',
      desc: 'Track accuracy trends over time through high-contrast indicators and accessible textual milestone narratives.',
    },
    {
      icon: <Target className="w-5 h-5 text-primary" aria-hidden="true" />,
      title: 'Weak-Topic Diagnostics',
      desc: 'Intelligent revision recommendations highlighting specific chapters and topics that need reinforcement.',
    },
    {
      icon: <Volume2 className="w-5 h-5 text-primary" aria-hidden="true" />,
      title: 'Audio-First Formulas',
      desc: 'Candidate-controlled speech synthesis that speaks complex mathematical equations and tables with unambiguous clarity.',
    },
  ];

  return (
    <section
      id="features"
      aria-labelledby="candidate-experience-heading"
      className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-border"
    >
      <div className="text-center max-w-3xl mx-auto mb-16">
        <span className="text-xs font-bold uppercase tracking-wider text-primary mb-2 block">
          Candidate Capabilities
        </span>
        <h2 id="candidate-experience-heading" className="text-h1 font-bold text-foreground mb-4">
          Everything You Need to Prepare With Confidence
        </h2>
        <p className="text-body text-foreground-secondary leading-relaxed">
          GoWow provides a unified learning and testing environment where visually impaired and low-vision candidates independently prepare, practice, sit for exams, and review diagnostic scorecards.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {showcaseModules.map((item) => (
          <Card
            key={item.title}
            variant="default"
            className="p-5 flex flex-col justify-start hover:border-border-strong hover:shadow-sm transition-all duration-fast"
          >
            <div
              className="w-10 h-10 rounded-lg bg-surface-elevated border border-border flex items-center justify-center mb-3 shrink-0"
              aria-hidden="true"
            >
              {item.icon}
            </div>
            <h3 className="text-sm font-bold text-foreground mb-1.5">
              {item.title}
            </h3>
            <p className="text-xs text-foreground-muted leading-relaxed">
              {item.desc}
            </p>
          </Card>
        ))}
      </div>
    </section>
  );
};
