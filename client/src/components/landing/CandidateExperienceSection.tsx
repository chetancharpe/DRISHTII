import React from 'react';
import {
  LayoutDashboard,
  FileCheck,
  FileSpreadsheet,
  MonitorCheck,
  CheckCircle2,
  LineChart,
  Target,
} from 'lucide-react';
import { Card } from '../common/Card';

export const CandidateExperienceSection: React.FC = () => {
  const showcaseModules = [
    {
      icon: <LayoutDashboard className="w-5 h-5 text-primary" aria-hidden="true" />,
      title: 'Personalized Dashboard',
      desc: 'Quick access to active assignments, scheduled competitive tests, and recent scores with streamlined screen-reader summary landmarks.',
    },
    {
      icon: <FileCheck className="w-5 h-5 text-primary" aria-hidden="true" />,
      title: 'Practice Questions',
      desc: 'Subject and topic-wise practice banks with adjustable font sizing, step-by-step solutions, and immediate acoustic confirmation.',
    },
    {
      icon: <FileSpreadsheet className="w-5 h-5 text-primary" aria-hidden="true" />,
      title: 'Timed Mock Tests',
      desc: 'Simulate high-stakes competitive examinations with realistic question palettes, section hopping, and accessible countdown warnings.',
    },
    {
      icon: <MonitorCheck className="w-5 h-5 text-primary" aria-hidden="true" />,
      title: 'Accessible Exam Interface',
      desc: 'Strictly keyboard-controlled test interface with Alt+A accessibility access, clear radio buttons, and focus lock during question reading.',
    },
    {
      icon: <CheckCircle2 className="w-5 h-5 text-primary" aria-hidden="true" />,
      title: 'Transparent Results',
      desc: 'Comprehensive scorecards showing total marks, time elapsed per section, and answer review with screen-reader accessible tables.',
    },
    {
      icon: <LineChart className="w-5 h-5 text-primary" aria-hidden="true" />,
      title: 'Progress Tracking',
      desc: 'Track accuracy curves and test frequency over time through accessible textual summaries and high-contrast telemetry indicators.',
    },
    {
      icon: <Target className="w-5 h-5 text-primary" aria-hidden="true" />,
      title: 'Weak-Topic Identification',
      desc: 'Specific recommendations pointing candidates directly toward chapters and subtopics that need revision before exam day.',
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
          GoWow provides a unified ecosystem where visually impaired candidates independently navigate preparation, practice tests, live examinations, and detailed post-exam analytics.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {showcaseModules.map((item) => (
          <Card
            key={item.title}
            variant="default"
            className="p-6 flex flex-col justify-start hover:border-border-strong transition-all duration-fast"
          >
            <div
              className="w-10 h-10 rounded-md bg-surface-elevated border border-border flex items-center justify-center mb-4 shrink-0"
              aria-hidden="true"
            >
              {item.icon}
            </div>
            <h3 className="text-base font-bold text-foreground mb-2">
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
