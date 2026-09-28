import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sliders,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Volume2,
  Building2,
  UserCheck,
  Sparkles,
  FileText,
} from 'lucide-react';
import { Button } from '../common/Button';

export interface HeroSectionProps {
  onOpenAccessibility: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onOpenAccessibility }) => {
  const [previewRole, setPreviewRole] = useState<'candidate' | 'examiner'>('candidate');
  const [selectedOption, setSelectedOption] = useState<string>('A');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const handlePlayAudio = () => {
    setIsPlayingAudio(true);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const text =
        previewRole === 'candidate'
          ? 'Question 4: Which design principle ensures that a candidate can navigate interactive assessment controls using sequential Tab keys without losing focus context? Option A: Non-disabling visible focus outlines. Option B: Mouse-hover only popups. Option C: Image-only questions without alt text.'
          : 'Examiner studio accessibility linter: All 12 items verified against WCAG 2.1 AA requirements. Spoken formulas attached.';
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setIsPlayingAudio(false), 2000);
    }
  };

  return (
    <section
      aria-labelledby="hero-title"
      className="relative overflow-hidden pt-8 pb-16 md:py-20 lg:py-24"
    >
      {/* Decorative ambient background glows */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Hero Content Column */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            {/* Tagline Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-surface-elevated text-xs font-semibold text-primary mb-6 shadow-xs">
              <ShieldCheck className="w-4 h-4 text-primary" aria-hidden="true" />
              <span>Accessibility-First Examination Platform • WCAG 2.1 AA</span>
            </div>

            {/* Main Headline */}
            <h1
              id="hero-title"
              className="text-display tracking-tight text-foreground font-extrabold mb-5"
            >
              Exams Without Barriers.{' '}
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-400 to-indigo-400">
                Engineered for Independence.
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-body-lg text-foreground-secondary max-w-2xl mb-8 leading-relaxed">
              Learn, practice, and take official competitive examinations with total autonomy. Built from first principles for blind, low-vision, and keyboard-reliant candidates, with complete authoring and proctoring tools for institutions.
            </p>

            {/* Call to Actions */}
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto mb-8">
              <Link to="/auth/signup?role=candidate" className="w-full sm:w-auto">
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  iconRight={<ArrowRight className="w-5 h-5" />}
                  className="shadow-md font-bold"
                >
                  Start Practicing Free
                </Button>
              </Link>

              <Link to="/auth/login?role=examiner" className="w-full sm:w-auto">
                <Button
                  variant="secondary"
                  size="lg"
                  fullWidth
                  icon={<Building2 className="w-4 h-4 text-primary" />}
                >
                  Examiner Studio
                </Button>
              </Link>

              <Button
                variant="outline"
                size="lg"
                onClick={onOpenAccessibility}
                icon={<Sliders className="w-4 h-4 text-primary" />}
                className="w-full sm:w-auto"
                aria-label="Open Accessibility Calibration Center (Shortcut: Alt+A)"
              >
                <span>Accessibility</span>
                <span className="keyboard-indicator ml-2 text-[10px]">Alt+A</span>
              </Button>
            </div>

            {/* Key Guarantees */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full pt-6 border-t border-border text-xs text-foreground-muted">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-status-success shrink-0" aria-hidden="true" />
                <span>100% Keyboard Operable</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-status-success shrink-0" aria-hidden="true" />
                <span>Screen-Reader Linearized</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-status-success shrink-0" aria-hidden="true" />
                <span>Calm Acoustic Countdown</span>
              </div>
            </div>
          </div>

          {/* Interactive Live Preview Card */}
          <div className="lg:col-span-5 w-full flex justify-center">
            <div className="w-full max-w-md bg-surface border-2 border-border-strong rounded-2xl p-6 shadow-xl relative overflow-hidden">
              {/* Role Switcher in Preview Card */}
              <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
                <span className="text-[11px] font-mono uppercase tracking-wider text-foreground-muted font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  Live Preview
                </span>
                <div className="flex items-center p-1 rounded-lg bg-surface-elevated border border-border text-xs" role="tablist" aria-label="Interactive Preview Role">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={previewRole === 'candidate'}
                    onClick={() => setPreviewRole('candidate')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                      previewRole === 'candidate'
                        ? 'bg-primary text-primary-contrast shadow-xs'
                        : 'text-foreground-muted hover:text-foreground'
                    }`}
                  >
                    Candidate View
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={previewRole === 'examiner'}
                    onClick={() => setPreviewRole('examiner')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                      previewRole === 'examiner'
                        ? 'bg-primary text-primary-contrast shadow-xs'
                        : 'text-foreground-muted hover:text-foreground'
                    }`}
                  >
                    Examiner Studio
                  </button>
                </div>
              </div>

              {previewRole === 'candidate' ? (
                /* Candidate Examination Simulation */
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-border/80 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-status-success animate-pulse" aria-hidden="true" />
                      <span className="font-mono font-bold text-foreground">
                        Civil Services Mock Drill
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-elevated border border-border text-[11px] font-mono text-primary font-bold">
                      <Clock className="w-3 h-3" />
                      <span>44:32 Left</span>
                    </div>
                  </div>

                  <div className="py-4">
                    <div className="flex items-center justify-between mb-2 text-xs">
                      <span className="font-bold uppercase tracking-wider text-primary">
                        Question 04 of 50
                      </span>
                      <span className="font-semibold px-2 py-0.5 rounded bg-surface-elevated border border-border text-[11px] text-foreground-secondary">
                        Aptitude
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-foreground leading-snug mb-4">
                      Which design principle ensures that a candidate can navigate interactive assessment controls using sequential Tab keys without losing focus context?
                    </p>

                    {/* Interactive Clickable Option Buttons */}
                    <div className="flex flex-col gap-2" role="radiogroup" aria-label="Answer options">
                      {[
                        { id: 'A', label: 'Non-disabling visible focus outlines' },
                        { id: 'B', label: 'Mouse-hover only trigger menus' },
                        { id: 'C', label: 'Image-only questions without alt text' },
                      ].map((opt) => {
                        const isSelected = selectedOption === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            onClick={() => setSelectedOption(opt.id)}
                            className={`p-2.5 rounded-lg border text-left text-xs transition-all flex items-center justify-between min-h-[42px] cursor-pointer ${
                              isSelected
                                ? 'border-primary bg-primary/10 text-foreground font-bold ring-2 ring-primary/40'
                                : 'border-border bg-surface hover:bg-surface-elevated text-foreground-secondary'
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <span className="font-mono text-primary font-bold">[{opt.id}]</span>
                              <span>{opt.label}</span>
                            </span>
                            {isSelected && (
                              <span className="text-[10px] font-mono font-bold text-status-success bg-status-success-bg px-1.5 py-0.5 rounded border border-status-success">
                                Active
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Interactive Audio & Next Action Bar */}
                  <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={handlePlayAudio}
                      aria-label="Play question text aloud using speech synthesis"
                      className="inline-flex items-center gap-1.5 text-primary hover:underline font-semibold cursor-pointer py-1 px-1.5 rounded focus:ring-2 focus:ring-primary"
                    >
                      <Volume2 className={`w-3.5 h-3.5 ${isPlayingAudio ? 'animate-bounce text-status-success' : ''}`} />
                      <span>{isPlayingAudio ? 'Speaking...' : 'Listen Audio'}</span>
                    </button>
                    <div className="flex items-center gap-2">
                      <span className="keyboard-indicator text-[10px]">Alt+S</span>
                      <span className="px-3 py-1.5 rounded-md bg-primary text-primary-contrast font-bold text-xs select-none">
                        Save &amp; Next
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Examiner Studio Quality Gate View */
                <div className="flex flex-col gap-3 py-1">
                  <div className="flex items-center justify-between pb-3 border-b border-border text-xs">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      <span className="font-bold text-foreground">
                        Accessible Paper Authoring
                      </span>
                    </div>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-status-success-bg border border-status-success text-status-success font-bold">
                      Pre-Publish Linter
                    </span>
                  </div>

                  <div className="space-y-2.5 my-2">
                    <div className="p-2.5 rounded-lg border border-border bg-surface-elevated flex items-center justify-between text-xs">
                      <span className="text-foreground">WCAG 2.1 AA Validation</span>
                      <span className="text-status-success font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> 100% Passed
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg border border-border bg-surface-elevated flex items-center justify-between text-xs">
                      <span className="text-foreground">Spoken Math Script</span>
                      <span className="text-status-success font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Synchronized
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg border border-border bg-surface-elevated flex items-center justify-between text-xs">
                      <span className="text-foreground">Diagram Alternative Text</span>
                      <span className="text-status-success font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> 12 of 12 Ready
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg border border-border bg-surface-elevated flex items-center justify-between text-xs">
                      <span className="text-foreground">Time Accommodation (1.5x)</span>
                      <span className="text-primary font-bold flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5" /> Configured
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
                    <span className="text-[11px] text-foreground-muted">
                      Ready for safe distribution
                    </span>
                    <Link
                      to="/examiner/exams/create"
                      className="px-3 py-1.5 rounded-md bg-primary text-primary-contrast font-bold text-xs"
                    >
                      Publish Exam
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
