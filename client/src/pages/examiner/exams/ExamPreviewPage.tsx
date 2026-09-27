import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ExaminerExam } from '../../../types/examiner';
import { examinerService } from '../../../services/examinerService';
import { Button } from '../../../components/common/Button';

import {
  Eye,
  Keyboard,
  Volume2,
  Type,
  SunMoon,
  Clock,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  CheckCircle2,
} from 'lucide-react';

type PreviewMode = 'default' | 'keyboard' | 'screen_reader' | 'large_text' | 'high_contrast' | 'dark';

export const ExamPreviewPage: React.FC = () => {
  const { examId = 'exam-01' } = useParams<{ examId: string }>();
  const [exam, setExam] = useState<ExaminerExam | null>(null);
  const [mode, setMode] = useState<PreviewMode>('default');
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isMarked, setIsMarked] = useState<boolean>(false);

  useEffect(() => {
    const load = async () => {
      const data = await examinerService.getExamById(examId);
      if (data) setExam(data);
    };
    load();
  }, [examId]);

  if (!exam) {
    return <div className="p-8 text-center text-foreground-muted">Loading candidate preview...</div>;
  }

  const sampleQuestions = [
    {
      number: 1,
      section: 'Quantitative Aptitude',
      prompt: 'What is the sum of the first 20 positive odd integers?',
      formula: '\\sum_{k=1}^{20} (2k - 1) = 20^2 = 400',
      formulaSpeech: 'Sum from k equals 1 to 20 of open parenthesis 2k minus 1 close parenthesis equals 400.',
      options: [
        { label: 'A', text: '380' },
        { label: 'B', text: '400' },
        { label: 'C', text: '420' },
        { label: 'D', text: '440' },
      ],
    },
    {
      number: 2,
      section: 'Logical Reasoning',
      prompt: 'Examine the quarterly distribution table below and determine which department experienced the greatest percentage increase from Q1 to Q2.',
      options: [
        { label: 'A', text: 'Research & Development' },
        { label: 'B', text: 'Engineering Operations' },
        { label: 'C', text: 'Quality Assurance' },
        { label: 'D', text: 'Customer Support' },
      ],
    },
  ];

  const currentQ = sampleQuestions[currentQIndex] || sampleQuestions[0];

  return (
    <div className="flex flex-col gap-6" role="main" aria-label="Candidate Exam Preview">
      {/* Header with Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-4 rounded-xl border border-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link to="/examiner/exams" className="text-xs text-primary font-bold hover:underline flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
              Exit Preview
            </Link>
            <span className="text-xs text-foreground-muted">/</span>
            <span className="text-xs font-mono font-bold text-foreground-muted">Candidate Experience Sandbox</span>
          </div>
          <h1 className="text-xl font-bold text-foreground">
            Preview: {exam.title}
          </h1>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Candidate preview modes">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'default'}
            onClick={() => setMode('default')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              mode === 'default' ? 'bg-primary text-primary-contrast' : 'bg-surface-elevated text-foreground'
            }`}
          >
            <Eye className="w-3.5 h-3.5" aria-hidden="true" />
            Default
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={mode === 'keyboard'}
            onClick={() => setMode('keyboard')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              mode === 'keyboard' ? 'bg-primary text-primary-contrast' : 'bg-surface-elevated text-foreground'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" aria-hidden="true" />
            Keyboard Only
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={mode === 'screen_reader'}
            onClick={() => setMode('screen_reader')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              mode === 'screen_reader' ? 'bg-primary text-primary-contrast' : 'bg-surface-elevated text-foreground'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
            Screen Reader
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={mode === 'large_text'}
            onClick={() => setMode('large_text')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              mode === 'large_text' ? 'bg-primary text-primary-contrast' : 'bg-surface-elevated text-foreground'
            }`}
          >
            <Type className="w-3.5 h-3.5" aria-hidden="true" />
            Large Text
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={mode === 'high_contrast'}
            onClick={() => setMode('high_contrast')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              mode === 'high_contrast' ? 'bg-primary text-primary-contrast' : 'bg-surface-elevated text-foreground'
            }`}
          >
            <SunMoon className="w-3.5 h-3.5" aria-hidden="true" />
            High Contrast
          </button>
        </div>
      </div>

      {/* Simulated Live Candidate Environment */}
      <div
        className={`rounded-2xl border p-6 transition-all ${
          mode === 'high_contrast'
            ? 'bg-black text-white border-white ring-2 ring-yellow-400'
            : 'bg-surface border-border shadow-md'
        } ${mode === 'large_text' ? 'text-lg space-y-6' : 'text-base space-y-5'}`}
      >
        {/* Candidate Top Header Bar */}
        <div className="flex items-center justify-between border-b border-border pb-4 flex-wrap gap-3">
          <div>
            <span className="text-xs font-mono font-bold text-primary block">
              Section: {currentQ.section}
            </span>
            <span className="text-xs text-foreground-muted">
              Question {currentQIndex + 1} of {sampleQuestions.length}
            </span>
          </div>

          {/* Candidate Accessible Timer */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-elevated border border-border">
            <Clock className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
            <div className="flex flex-col text-right">
              <span className="font-mono text-sm font-bold text-foreground">58:42 Remaining</span>
              <span className="text-[10px] text-foreground-muted font-mono">{exam.schedule.timezone}</span>
            </div>
          </div>
        </div>

        {/* Question Area */}
        <div className="space-y-4">
          <p className="font-bold text-foreground leading-relaxed">{currentQ.prompt}</p>

          {currentQ.formula && (
            <div className="p-3.5 rounded-xl bg-surface-elevated border border-border font-mono text-sm">
              <code className="text-primary font-bold block">{currentQ.formula}</code>
              {mode === 'screen_reader' && currentQ.formulaSpeech && (
                <div className="mt-2 text-xs text-foreground flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                  <span><strong>ClearSpeak Speech:</strong> "{currentQ.formulaSpeech}"</span>
                </div>
              )}
            </div>
          )}

          {/* Options */}
          <div className="space-y-2.5" role="radiogroup" aria-label="Question answer options">
            {currentQ.options.map((opt) => (
              <button
                key={opt.label}
                type="button"
                role="radio"
                aria-checked={selectedOption === opt.label}
                onClick={() => setSelectedOption(opt.label)}
                className={`w-full text-left p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                  selectedOption === opt.label
                    ? 'bg-primary/10 border-primary text-foreground font-bold ring-2 ring-primary/40'
                    : 'bg-surface-elevated border-border text-foreground hover:border-primary/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-surface border border-border flex items-center justify-center font-mono text-xs font-bold text-primary shrink-0">
                    {opt.label}
                  </span>
                  <span>{opt.text}</span>
                </div>
                {mode === 'keyboard' && (
                  <span className="text-[10px] font-mono bg-border px-2 py-0.5 rounded text-foreground-muted">
                    Key [{opt.label}]
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Candidate Navigation Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={currentQIndex === 0}
              onClick={() => setCurrentQIndex((prev) => Math.max(0, prev - 1))}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
              Previous Question
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={currentQIndex === sampleQuestions.length - 1}
              onClick={() => setCurrentQIndex((prev) => Math.min(sampleQuestions.length - 1, prev + 1))}
              className="flex items-center gap-1"
            >
              Next Question
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMarked(!isMarked)}
              className={`flex items-center gap-1.5 ${isMarked ? 'text-primary font-bold' : ''}`}
            >
              <Bookmark className="w-4 h-4" aria-hidden="true" />
              {isMarked ? 'Marked for Review' : 'Mark for Review'}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => alert('Simulated candidate submission receipt check.')}
              className="flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              Submit Exam
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
