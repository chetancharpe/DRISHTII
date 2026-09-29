import React from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  FolderPlus,
  Layers,
  Settings2,
  Calendar,
  Users2,
  FileCheck2,
  BarChart3,
  ArrowRight,
} from 'lucide-react';
import { Button } from '../common/Button';

export const ExaminerSection: React.FC = () => {
  const tools = [
    {
      icon: <FolderPlus className="w-4 h-4 text-primary" />,
      title: 'Create Examinations',
      desc: 'Author exams with native mathematical formulas and accessible question types.',
    },
    {
      icon: <Layers className="w-4 h-4 text-primary" />,
      title: 'Question Bank Organization',
      desc: 'Categorize questions by difficulty, subject, and cognitive taxonomy.',
    },
    {
      icon: <Settings2 className="w-4 h-4 text-primary" />,
      title: 'Accessibility Defaults',
      desc: 'Set custom time compensations, text zoom minimums, and acoustic aids per exam.',
    },
    {
      icon: <Calendar className="w-4 h-4 text-primary" />,
      title: 'Exam Scheduling',
      desc: 'Coordinate proctored competitive windows and timed mock release slots.',
    },
    {
      icon: <Users2 className="w-4 h-4 text-primary" />,
      title: 'Candidate Management',
      desc: 'Track candidate registrations and accommodations securely.',
    },
    {
      icon: <FileCheck2 className="w-4 h-4 text-primary" />,
      title: 'Automated Evaluation',
      desc: 'Generate transparent score breakdowns and question performance distributions.',
    },
    {
      icon: <BarChart3 className="w-4 h-4 text-primary" />,
      title: 'Psychometric Analytics',
      desc: 'Evaluate question discrimination index and candidate response pacing.',
    },
    {
      icon: <Building2 className="w-4 h-4 text-primary" />,
      title: 'Institutional Portals',
      desc: 'Multi-examiner management for schools, universities, and public exam boards.',
    },
  ];

  return (
    <section
      id="examiners"
      aria-labelledby="examiner-heading"
      className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-border bg-surface/30 rounded-2xl my-8"
    >
      <div className="max-w-3xl mx-auto text-center mb-12">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-border bg-surface-elevated text-xs font-semibold text-foreground-muted mb-4">
          <Building2 className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
          <span>For Schools, Universities & Exam Authorities</span>
        </div>
        <h2 id="examiner-heading" className="text-h1 font-bold text-foreground mb-4">
          Make Your Exams Accessible From the Start
        </h2>
        <p className="text-body text-foreground-secondary leading-relaxed">
          Creating accessible examination papers should not require retrofitting or tedious manual conversion. DRISHTI provides educational institutions with built-in authoring tools that output screen-reader ready tests automatically.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {tools.map((tool) => (
          <div
            key={tool.title}
            className="p-4 rounded-lg border border-border bg-surface flex flex-col justify-start gap-2"
          >
            <div
              className="w-8 h-8 rounded-md bg-surface-elevated border border-border flex items-center justify-center mb-1"
              aria-hidden="true"
            >
              {tool.icon}
            </div>
            <h3 className="text-sm font-bold text-foreground">
              {tool.title}
            </h3>
            <p className="text-xs text-foreground-muted leading-relaxed">
              {tool.desc}
            </p>
          </div>
        ))}
      </div>

      <div className="flex justify-center">
        <Link to="/examiner/dashboard">
          <Button
            variant="secondary"
            size="md"
            iconRight={<ArrowRight className="w-4 h-4" />}
          >
            Explore Examiner Tools
          </Button>
        </Link>
      </div>
    </section>
  );
};
