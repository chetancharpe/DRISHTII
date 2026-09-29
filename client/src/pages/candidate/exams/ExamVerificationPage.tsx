import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Exam } from '../../../types/exam';
import { examService } from '../../../services/examService';
import { useAccessibility } from '../../../contexts/AccessibilityContext';
import {
  ArrowLeft,
  ArrowRight,
  SlidersHorizontal,
  ShieldCheck,
  Loader2,
  Type,
  Sun,
  Contrast,
  Volume2,
} from 'lucide-react';

export const ExamVerificationPage: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { preferences, openCalibration, speak, announce } = useAccessibility();
  const [audioTestPassed, setAudioTestPassed] = useState(false);

  const handleTestAudio = () => {
    const testMessage = 'DRISHTI audio speech synthesized successfully. Your accessibility setup is operational and ready.';
    speak(testMessage);
    announce(testMessage, 'assertive');
    setAudioTestPassed(true);
  };

  const [exam, setExam] = useState<Exam | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadExam() {
      if (!examId) return;
      try {
        setIsLoading(true);
        const data = await examService.getExam(examId);
        setExam(data);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    loadExam();
  }, [examId]);

  const handleStartExam = async () => {
    if (!exam) return;
    try {
      setIsStarting(true);
      await examService.createExamSession(exam.id);
      navigate(`/candidate/exams/${exam.id}/session`);
    } catch (e) {
      console.error('Failed to create examination session', e);
      setIsStarting(false);
    }
  };

  if (isLoading || !exam) {
    return (
      <div className="flex flex-col items-center justify-center p-16 gap-3" role="status">
        <Loader2 className="w-8 h-8 animate-spin text-primary" aria-hidden="true" />
        <p className="text-xs font-semibold text-foreground-secondary">
          Preparing examination environment...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto pb-12">
      {/* Back button */}
      <div>
        <Link
          to={`/candidate/exams/${exam.id}/instructions`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline p-1 min-h-[36px] rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Back to Examination Rules</span>
        </Link>
      </div>

      {/* Header */}
      <header className="flex flex-col gap-2 border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded border border-primary/20">
            Step 2 of 2: Candidate Readiness & Accessibility Check
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mt-1">
          Candidate Readiness & Accessibility Check
        </h1>
        <p className="text-sm text-foreground-secondary leading-relaxed">
          Verify text sizing, color contrast, speech audio synthesis, and peripheral readiness before launching your timed examination session.
        </p>
      </header>

      {/* Interactive Speech & Audio Output Check */}
      <section aria-labelledby="audio-test-heading" className="p-4 rounded-xl bg-surface border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 id="audio-test-heading" className="text-sm font-bold text-foreground flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-primary" aria-hidden="true" />
            <span>Audio Narration & Peripheral Sound Test</span>
          </h2>
          <p className="text-xs text-foreground-secondary mt-1">
            Test audio speech volume and voice clarity before starting. This is an accessibility check; no camera or microphone recordings are made.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {audioTestPassed && (
            <span className="text-xs font-semibold text-status-success flex items-center gap-1" role="status">
              ✓ Audio Confirmed
            </span>
          )}
          <button
            type="button"
            onClick={handleTestAudio}
            className="px-4 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 font-bold text-xs min-h-[40px] focus:outline-none focus:ring-2 focus:ring-primary transition-colors whitespace-nowrap"
          >
            {audioTestPassed ? 'Re-test Audio Narration' : 'Test Audio Narration 🔊'}
          </button>
        </div>
      </section>

      {/* Current Settings Overview Cards (Section 10) */}
      <section aria-labelledby="settings-status-heading" className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 id="settings-status-heading" className="text-sm font-bold uppercase tracking-wider text-foreground">
            Active Candidate Preferences
          </h2>
          <button
            type="button"
            onClick={openCalibration}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface hover:bg-surface-elevated border border-border text-primary font-bold text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[40px] transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
            <span>Open Accessibility Settings</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {/* Font Size */}
          <div className="p-4 rounded-xl border border-border bg-surface flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-foreground-secondary">
              <Type className="w-4 h-4 text-primary" aria-hidden="true" />
              <span className="font-semibold">Text Scaling</span>
            </div>
            <strong className="text-foreground capitalize text-sm">
              {preferences.fontSize.replace('-', ' ')}
            </strong>
          </div>

          {/* Theme */}
          <div className="p-4 rounded-xl border border-border bg-surface flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-foreground-secondary">
              <Sun className="w-4 h-4 text-primary" aria-hidden="true" />
              <span className="font-semibold">Theme Mode</span>
            </div>
            <strong className="text-foreground capitalize text-sm">
              {preferences.theme} Theme
            </strong>
          </div>

          {/* Contrast */}
          <div className="p-4 rounded-xl border border-border bg-surface flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-foreground-secondary">
              <Contrast className="w-4 h-4 text-primary" aria-hidden="true" />
              <span className="font-semibold">Contrast Mode</span>
            </div>
            <strong className="text-foreground text-sm">
              {preferences.highContrast ? 'High Contrast (AAA)' : 'Standard Contrast'}
            </strong>
          </div>

          {/* Audio Assistance */}
          <div className="p-4 rounded-xl border border-border bg-surface flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-foreground-secondary">
              <Volume2 className="w-4 h-4 text-primary" aria-hidden="true" />
              <span className="font-semibold">Audio Assistance</span>
            </div>
            <strong className="text-foreground text-sm">
              {preferences.audioEnabled ? 'Audio Narration Active' : 'Self-Paced Text'}
            </strong>
          </div>
        </div>
      </section>

      {/* Exam Start Confirmation Details (Section 11) */}
      <section
        aria-labelledby="start-confirmation-heading"
        className="p-6 rounded-2xl border border-primary/30 bg-primary/5 flex flex-col gap-5 mt-2"
      >
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 flex-shrink-0 mt-0.5">
            <ShieldCheck className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <h2 id="start-confirmation-heading" className="text-base sm:text-lg font-extrabold text-foreground">
              You are about to start your examination.
            </h2>
            <p className="text-xs text-foreground-secondary mt-1 leading-relaxed">
              Once launched, the official server countdown timer will commence. An authoritative examination session will be assigned to your candidate roll number.
            </p>
          </div>
        </div>

        {/* Verification checklist */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-surface border border-border text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-foreground-secondary block">Assessment</span>
            <strong className="text-foreground font-semibold">{exam.examCode}</strong>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-foreground-secondary block">Duration</span>
            <strong className="text-foreground font-semibold">{exam.durationMinutes} Minutes</strong>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-foreground-secondary block">Total Questions</span>
            <strong className="text-foreground font-semibold">{exam.totalQuestions} Items</strong>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-foreground-secondary block">Sections</span>
            <strong className="text-foreground font-semibold">{exam.config.sections.length} Sections</strong>
          </div>
        </div>

        {/* Important final reminders */}
        <ul className="flex flex-col gap-2 text-xs text-foreground leading-relaxed pl-5 list-disc">
          <li>Ensure your assistive peripherals (screen reader, headphones, keyboard) are connected and operational.</li>
          <li>Do not navigate away from the examination browser window during active evaluation.</li>
          <li>Your responses will be continuously synced with the demonstration authority server.</li>
        </ul>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-primary/20">
          <Link
            to={`/candidate/exams/${exam.id}/instructions`}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-surface hover:bg-surface-elevated border border-border text-foreground font-bold text-xs min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Review Instructions</span>
          </Link>

          <button
            type="button"
            onClick={handleStartExam}
            disabled={isStarting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-primary hover:bg-primary-hover active:bg-primary-hover text-primary-contrast font-bold text-xs min-h-[48px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-xs transition-colors disabled:opacity-50"
          >
            <span>{isStarting ? 'Initiating Session...' : 'Start Examination'}</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </section>
    </div>
  );
};
