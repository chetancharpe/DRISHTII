import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Exam } from '../../../types/exam';
import { examService } from '../../../services/examService';
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Volume2,
} from 'lucide-react';
import { useAccessibility } from '../../../contexts/AccessibilityContext';

export const ExamInstructionsPage: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const { speak, preferences } = useAccessibility();

  const [exam, setExam] = useState<Exam | null>(null);
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

  const handleReadSummary = () => {
    if (!exam) return;
    speak(
      `Before You Begin. Examination instructions for ${exam.title}. Conducted by ${exam.organization}. Total questions: ${exam.totalQuestions}. Duration: ${exam.durationMinutes} minutes. Correct answers receive 2 marks. Incorrect answers receive negative mark penalty of 0.66 marks. All interactive elements support standard keyboard and screen-reader interaction. Review your accessibility preferences before launching the examination.`
    );
  };

  if (isLoading || !exam) {
    return (
      <div className="flex flex-col items-center justify-center p-16 gap-3" role="status">
        <Loader2 className="w-8 h-8 animate-spin text-primary" aria-hidden="true" />
        <p className="text-xs font-semibold text-foreground-secondary">
          Loading examination guidelines...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto pb-12">
      {/* Back button */}
      <div>
        <Link
          to={`/candidate/exams/${exam.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline p-1 min-h-[36px] rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Back to Examination Overview</span>
        </Link>
      </div>

      {/* Main Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            {exam.title}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mt-1">
            Before You Begin
          </h1>
          <p className="text-xs text-foreground-secondary mt-1">
            Please read these examination rules thoroughly. Your examination session will begin after the accessibility verification step.
          </p>
        </div>

        {preferences.audioEnabled && (
          <button
            type="button"
            onClick={handleReadSummary}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-elevated border border-border text-foreground text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[38px] transition-colors self-start sm:self-auto"
            aria-label="Listen to examination instructions audio summary"
          >
            <Volume2 className="w-4 h-4 text-primary" aria-hidden="true" />
            <span>Listen to Summary</span>
          </button>
        )}
      </header>

      {/* Structured Guidelines (Section 7, 8) */}
      <div className="flex flex-col gap-8">
        {/* Section 1: Exam Structure */}
        <section aria-labelledby="h2-exam-structure" className="flex flex-col gap-3">
          <h2 id="h2-exam-structure" className="text-lg font-bold text-foreground">
            1. Exam Structure
          </h2>
          <ul className="flex flex-col gap-2 list-disc pl-5 text-xs text-foreground leading-relaxed">
            <li>
              The assessment consists of <strong className="text-foreground">{exam.totalQuestions} questions</strong> divided across{' '}
              <strong className="text-foreground">{exam.config.sections.length} distinct sections</strong>.
            </li>
            {exam.config.sections.map((sec) => (
              <li key={sec.id}>
                <strong>{sec.title} ({sec.code}):</strong> {sec.totalQuestions} questions. {sec.description}
              </li>
            ))}
            <li>Each question presents multiple options. Select the most appropriate answer choice.</li>
          </ul>
        </section>

        {/* Section 2: Question Navigation */}
        <section aria-labelledby="h2-navigation" className="flex flex-col gap-3">
          <h2 id="h2-navigation" className="text-lg font-bold text-foreground">
            2. Question Navigation
          </h2>
          <ul className="flex flex-col gap-2 list-disc pl-5 text-xs text-foreground leading-relaxed">
            <li>Use the <strong>"Save & Next"</strong> button to confirm your answer and advance to the subsequent question.</li>
            <li>Use <strong>"Previous"</strong> to return to earlier questions at any time during the active window.</li>
            <li>
              Open the <strong>Question Navigator</strong> at any time to review all questions and jump directly to any item.
            </li>
            <li>Questions marked for review can be easily identified in the navigator palette.</li>
          </ul>
        </section>

        {/* Section 3: Marking Scheme */}
        <section aria-labelledby="h2-marking" className="flex flex-col gap-3">
          <h2 id="h2-marking" className="text-lg font-bold text-foreground">
            3. Marking Scheme
          </h2>
          <div className="p-4 rounded-xl border border-border bg-surface flex flex-col gap-2 text-xs">
            <p className="font-semibold text-foreground">
              {exam.config.markingScheme.description}
            </p>
            <ul className="list-disc pl-5 flex flex-col gap-1 text-foreground-secondary">
              <li>Correct response: +{exam.config.markingScheme.correctMarks} marks</li>
              <li>Incorrect response: -{exam.config.markingScheme.incorrectPenalty} penalty deduction</li>
              <li>Unattempted questions: 0 marks (no penalty applied)</li>
            </ul>
          </div>
        </section>

        {/* Section 4: Time Management */}
        <section aria-labelledby="h2-time" className="flex flex-col gap-3">
          <h2 id="h2-time" className="text-lg font-bold text-foreground">
            4. Time Management
          </h2>
          <ul className="flex flex-col gap-2 list-disc pl-5 text-xs text-foreground leading-relaxed">
            <li>The total allocated duration is <strong className="text-foreground">{exam.durationMinutes} minutes</strong>.</li>
            <li>The official countdown timer is calibrated against authoritative server timestamps.</li>
            <li>The timer maintains an accessible textual readout (<code className="text-xs">aria-label</code>) and alerts at 30m, 10m, 5m, and 1m milestones.</li>
            <li>When the countdown timer reaches zero, your examination will be submitted automatically.</li>
          </ul>
        </section>

        {/* Section 5: Accessibility Features */}
        <section aria-labelledby="h2-accessibility" className="flex flex-col gap-3">
          <h2 id="h2-accessibility" className="text-lg font-bold text-foreground">
            5. Accessibility Features
          </h2>
          <ul className="flex flex-col gap-2 list-disc pl-5 text-xs text-foreground leading-relaxed">
            <li><strong>Keyboard Operation:</strong> Navigate using <kbd className="px-1.5 py-0.5 rounded border bg-surface-elevated">Tab</kbd>, <kbd className="px-1.5 py-0.5 rounded border bg-surface-elevated">Shift+Tab</kbd>, arrow keys, and <kbd className="px-1.5 py-0.5 rounded border bg-surface-elevated">Space</kbd>.</li>
            <li><strong>Screen Readers:</strong> Programmatic landmarks, fieldsets, legends, and automatic focus management on question change.</li>
            <li><strong>Visual Customization:</strong> Light, dark, and high-contrast modes, plus text scaling up to 200%.</li>
            <li><strong>Audio Narration:</strong> Self-paced buttons to speak question stems, math formulas, and options.</li>
          </ul>
        </section>

        {/* Section 6: Submission Rules */}
        <section aria-labelledby="h2-submission" className="flex flex-col gap-3">
          <h2 id="h2-submission" className="text-lg font-bold text-foreground">
            6. Submission Rules
          </h2>
          <ul className="flex flex-col gap-2 list-disc pl-5 text-xs text-foreground leading-relaxed">
            <li>Click <strong>"Submit Exam"</strong> when you are ready to conclude your assessment.</li>
            <li>A verification dialog will display your answered, unanswered, and flagged question tallies.</li>
            <li>Once final submission is confirmed, answers are locked and cannot be edited.</li>
            <li>Official evaluation results will be released according to authority schedules.</li>
          </ul>
        </section>

        {/* Section 7: Technical Requirements */}
        <section aria-labelledby="h2-technical" className="flex flex-col gap-3">
          <h2 id="h2-technical" className="text-lg font-bold text-foreground">
            7. Technical Requirements
          </h2>
          <ul className="flex flex-col gap-2 list-disc pl-5 text-xs text-foreground leading-relaxed">
            <li>A modern, accessible web browser (Chrome, Edge, Firefox, or Safari).</li>
            <li>Screen-reader software (NVDA, JAWS, VoiceOver, or TalkBack) if using assistive technology.</li>
            <li>A reliable internet connection for continuous server answer synchronization.</li>
          </ul>
        </section>

        {/* Section 8: Emergency & Support Information */}
        <section aria-labelledby="h2-support" className="flex flex-col gap-3">
          <h2 id="h2-support" className="text-lg font-bold text-foreground">
            8. Emergency / Support Information
          </h2>
          <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 text-xs text-foreground leading-relaxed flex flex-col gap-2">
            <p>
              If your device freezes or your internet connection drops, do not panic. Your answers are cached locally and will automatically synchronize when reconnected. Click the <strong>Help</strong> icon during the exam to view platform guidelines and authority support contact data.
            </p>
            <p className="text-foreground-secondary text-[11px]">
              Authority Desk: {exam.organization} • Support Reference: GOWOW-EXAM-DESK
            </p>
          </div>
        </section>
      </div>

      {/* Navigation CTA: Proceed to Accessibility Check (Section 10) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl border border-primary/30 bg-primary/5 mt-4">
        <div>
          <h3 className="text-sm font-bold text-foreground">
            Instructions Reviewed
          </h3>
          <p className="text-xs text-foreground-secondary">
            Next, verify your visual, speech, and keyboard settings prior to starting.
          </p>
        </div>

        <Link
          to={`/candidate/exams/${exam.id}/verify`}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover active:bg-primary-hover text-primary-contrast font-bold text-xs min-h-[48px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-xs transition-colors flex-shrink-0"
        >
          <span>Proceed to Accessibility Check</span>
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
};
