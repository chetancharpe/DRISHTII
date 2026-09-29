import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '../common/Button';

export const PracticePreviewSection: React.FC = () => {
  const subjects = [
    { name: 'Mathematics & Quantitative Aptitude', score: 78, status: 'Strong', color: 'bg-status-success' },
    { name: 'English Language & Comprehension', score: 71, status: 'Proficient', color: 'bg-status-info' },
    { name: 'Logical & Analytical Reasoning', score: 62, status: 'Developing', color: 'bg-status-warning' },
    { name: 'General Knowledge & Current Affairs', score: 44, status: 'Needs Review', color: 'bg-status-error' },
  ];

  const recommendations = [
    {
      topic: 'Current Affairs: National Digital Initiatives',
      subject: 'General Knowledge',
      reason: 'Accuracy in this topic was 35% across last 2 mock tests',
    },
    {
      topic: 'Physical Geography & River Basins',
      subject: 'General Knowledge',
      reason: '3 unanswered questions in previous full-length simulation',
    },
    {
      topic: 'Algebra: Quadratic Equations & Roots',
      subject: 'Mathematics',
      reason: 'Average response time was 3.4 mins (benchmark: 1.8 mins)',
    },
  ];

  return (
    <section
      aria-labelledby="practice-preview-heading"
      className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-border"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Column: Descriptive Guidance */}
        <div className="lg:col-span-6 flex flex-col items-start">
          <span className="text-xs font-bold uppercase tracking-wider text-primary mb-2 block">
            Targeted Improvement
          </span>
          <h2 id="practice-preview-heading" className="text-h1 font-bold text-foreground mb-4">
            Practice That Understands Your Progress
          </h2>
          <p className="text-body text-foreground-secondary leading-relaxed mb-6">
            Instead of solving random questions, DRISHTI tracks your accuracy across subjects and flags specific weak topics. You always know what to study next to maximize your examination score.
          </p>

          <div className="p-4 rounded-lg border border-primary/20 bg-primary/5 text-xs text-foreground-secondary mb-6">
            <span className="font-bold text-foreground block mb-1">
              Diagnostic Mastery Tracking
            </span>
            <span>
              Targeted revision focuses your preparation where you need it most, helping you build accuracy and confidence across every subject topic.
            </span>
          </div>

          <Link to="/candidate/practice">
            <Button
              variant="outline"
              iconRight={<ArrowRight className="w-4 h-4" />}
            >
              Explore Practice System
            </Button>
          </Link>
        </div>

        {/* Right Column: Conceptual Telemetry Card */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          {/* Subject Mastery Overview */}
          <div className="p-6 rounded-xl border border-border bg-surface shadow-sm">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <h3 className="text-sm font-bold text-foreground">
                Subject Accuracy Overview (Demo)
              </h3>
              <span className="text-xs font-mono text-foreground-muted">
                Last 4 Sessions
              </span>
            </div>

            <div className="flex flex-col gap-4">
              {subjects.map((s) => (
                <div key={s.name} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">{s.name}</span>
                    <span className="font-mono font-bold text-foreground">
                      {s.score}% <span className="text-foreground-muted font-normal">({s.status})</span>
                    </span>
                  </div>
                  {/* Semantic Accessible Progress Bar */}
                  <div
                    role="progressbar"
                    aria-valuenow={s.score}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${s.name} accuracy ${s.score}%`}
                    className="w-full h-2 rounded-full bg-surface-elevated overflow-hidden border border-border"
                  >
                    <div
                      className={`h-full ${s.color} transition-all duration-normal`}
                      style={{ width: `${s.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Practice Modules */}
          <div className="p-6 rounded-xl border border-border bg-surface shadow-sm">
            <div className="flex items-center gap-2 border-b border-border pb-3 mb-4">
              <Sparkles className="w-4 h-4 text-primary" aria-hidden="true" />
              <h3 className="text-sm font-bold text-foreground">
                Recommended Practice Modules
              </h3>
            </div>

            <div className="flex flex-col gap-3">
              {recommendations.map((rec) => (
                <div
                  key={rec.topic}
                  className="p-3 rounded-lg border border-border bg-surface-elevated flex items-start justify-between gap-3 text-left"
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-foreground">
                      {rec.topic}
                    </span>
                    <span className="text-[11px] text-foreground-muted mt-0.5">
                      {rec.reason}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-surface border border-border text-primary shrink-0">
                    {rec.subject}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
