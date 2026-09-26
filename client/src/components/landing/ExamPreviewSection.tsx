import React, { useState } from 'react';
import {
  Clock,
  Sliders,
  Star,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { Button } from '../common/Button';

export const ExamPreviewSection: React.FC = () => {
  const [selectedOption, setSelectedOption] = useState<string>('opt-1');
  const [isMarkedForReview, setIsMarkedForReview] = useState<boolean>(false);

  const options = [
    {
      id: 'opt-1',
      label: 'A. Consistent practice contributes to examination confidence.',
      keyHint: '1',
    },
    {
      id: 'opt-2',
      label: 'B. All candidates who attempt mock tests practice consistently.',
      keyHint: '2',
    },
    {
      id: 'opt-3',
      label: 'C. No confident candidates attempt competitive examinations.',
      keyHint: '3',
    },
    {
      id: 'opt-4',
      label: 'D. Mock tests are only available to non-competitive candidates.',
      keyHint: '4',
    },
  ];

  return (
    <section
      aria-labelledby="exam-preview-heading"
      className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-border"
    >
      <div className="text-center max-w-3xl mx-auto mb-12">
        <span className="text-xs font-bold uppercase tracking-wider text-primary mb-2 block">
          Interactive Architecture Preview
        </span>
        <h2 id="exam-preview-heading" className="text-h1 font-bold text-foreground mb-4">
          The Accessible Examination Interface
        </h2>
        <p className="text-body text-foreground-secondary leading-relaxed">
          Designed from first principles for screen readers and keyboard navigation. Notice how visible focus rings, acoustic timer cues, and hotkeys empower candidates to navigate rapidly.
        </p>
      </div>

      {/* Realistic Exam Mock Container */}
      <div className="rounded-xl border border-border-strong bg-surface shadow-lg overflow-hidden max-w-4xl mx-auto">
        {/* Exam Header Bar */}
        <div className="bg-surface-elevated border-b border-border p-4 sm:px-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-primary text-primary-contrast flex items-center justify-center font-bold text-sm">
              EX
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                National Public Service Aptitude — Mock Examination
              </h3>
              <p className="text-xs text-foreground-muted">
                Section B: Logical & Critical Reasoning • 75 Questions Total
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Accessible Timer Preview */}
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border bg-surface text-foreground font-mono text-xs font-bold"
              aria-label="Time remaining: 1 hour 24 minutes 15 seconds"
            >
              <Clock className="w-4 h-4 text-primary" aria-hidden="true" />
              <span>01:24:15</span>
              <span className="text-[10px] text-status-success font-sans font-semibold border-l border-border pl-2 ml-1">
                Normal Pace
              </span>
            </div>

            <button
              type="button"
              className="px-2.5 py-1.5 rounded border border-border bg-surface hover:bg-surface-elevated text-xs font-semibold text-foreground flex items-center gap-1.5"
              aria-label="Exam Accessibility Options"
            >
              <Sliders className="w-3.5 h-3.5 text-primary" />
              <span className="hidden sm:inline">Settings</span>
              <span className="keyboard-indicator text-[10px]">Alt+A</span>
            </button>
          </div>
        </div>

        {/* Question Area */}
        <div className="p-6 sm:p-8 flex flex-col gap-6">
          {/* Question Meta */}
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-primary font-mono">
                Question 18 of 75
              </span>
              <span className="text-xs text-foreground-muted font-mono">
                • +2.0 / -0.5 marks
              </span>
            </div>

            {isMarkedForReview && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-status-warning bg-status-warning-bg px-2.5 py-0.5 rounded border border-status-warning">
                <Star className="w-3 h-3 fill-current" />
                Marked For Review
              </span>
            )}
          </div>

          {/* Question Prompt */}
          <div>
            <p className="text-body-lg font-semibold text-foreground leading-relaxed">
              Statements: All candidates who practice consistently develop examination confidence. Some confident candidates achieve qualification in competitive examinations. Which conclusion necessarily follows from the premises?
            </p>
          </div>

          {/* Options Radios */}
          <div
            className="flex flex-col gap-3"
            role="radiogroup"
            aria-label="Question 18 Options"
          >
            {options.map((opt) => {
              const isSelected = selectedOption === opt.id;
              return (
                <label
                  key={opt.id}
                  htmlFor={opt.id}
                  className={`
                    flex items-center justify-between p-3.5 rounded-lg border cursor-pointer select-none transition-colors duration-fast
                    ${isSelected ? 'bg-surface-elevated border-primary' : 'bg-surface border-border hover:bg-surface-elevated'}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <input
                      id={opt.id}
                      type="radio"
                      name="mock-question-options"
                      value={opt.id}
                      checked={isSelected}
                      onChange={() => setSelectedOption(opt.id)}
                      className="peer sr-only"
                    />
                    <div className="w-5 h-5 rounded-full border border-border-strong bg-surface transition-colors peer-checked:border-primary peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-focus flex items-center justify-center">
                      {isSelected && (
                        <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                      )}
                    </div>
                    <span className="text-sm text-foreground font-medium">
                      {opt.label}
                    </span>
                  </div>

                  <span className="keyboard-indicator text-[10px]">
                    Key: {opt.keyHint}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Exam Navigation Footer Bar */}
        <div className="bg-surface-elevated border-t border-border p-4 sm:px-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              <span>Previous</span>
              <span className="keyboard-indicator text-[10px] ml-1">Alt+P</span>
            </Button>

            <Button
              variant={isMarkedForReview ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setIsMarkedForReview(!isMarkedForReview)}
              icon={<Star className="w-4 h-4 text-status-warning" />}
            >
              <span>{isMarkedForReview ? 'Unmark Review' : 'Mark for Review'}</span>
              <span className="keyboard-indicator text-[10px] ml-1">Alt+R</span>
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedOption('')}
            >
              Clear Choice
            </Button>

            <Button
              variant="primary"
              size="sm"
              iconRight={<ArrowRight className="w-4 h-4" />}
            >
              <span>Save & Next</span>
              <span className="keyboard-indicator text-[10px] ml-1">Alt+N</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-4 text-center">
        <p className="text-xs text-foreground-muted">
          * Conceptual interactive preview. Keyboard shortcuts, screen reader linearizations, and acoustic cues will be fully functional during live mock tests.
        </p>
      </div>
    </section>
  );
};
