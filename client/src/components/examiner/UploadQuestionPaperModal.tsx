import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layers,
  Send,
} from 'lucide-react';
import { examinerService, ExamPaperUploadPayload } from '../../services/examinerService';

export interface UploadQuestionPaperModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const DEFAULT_SAMPLE_PAPER: ExamPaperUploadPayload = {
  title: 'CDS 2026 General Knowledge & Defense Mock Paper 1',
  code: 'CDS-GK-2026-M1',
  description: 'Full-length 60-minute mock examination covering Defense Studies, Constitution, and Modern Indian History.',
  examType: 'mock_test',
  durationMinutes: 60,
  publishImmediately: true,
  sections: [
    {
      name: 'Section A: Defense & Strategic Affairs',
      description: 'Questions on Armed Forces structure, strategic commands, and equipment.',
      order: 1,
      durationMinutes: 30,
      questions: [
        {
          text: 'Where is the headquarters of the Southern Naval Command of the Indian Navy located?',
          options: ['Mumbai', 'Kochi', 'Visakhapatnam', 'Goa'],
          correctAnswer: 'Kochi',
          explanation: 'The Southern Naval Command is located in Kochi (Cochin), Kerala.',
          marks: 2.0,
          negativeMarks: 0.5,
          subject: 'Defense Studies',
          topic: 'Indian Armed Forces',
          difficulty: 'medium',
          accessibilityNotes: 'Text-only question. No diagrams needed.',
        },
        {
          text: 'What is the motto of the Indian National Defence Academy (NDA)?',
          options: ['Seva Paramo Dharma', 'Valour and Wisdom', 'Service Before Self', 'Touch the Sky with Glory'],
          correctAnswer: 'Seva Paramo Dharma',
          explanation: 'The motto of the National Defence Academy is "Seva Paramo Dharma" (Service Before Self).',
          marks: 2.0,
          negativeMarks: 0.5,
          subject: 'Defense Studies',
          topic: 'Military Academies',
          difficulty: 'easy',
          accessibilityNotes: 'Accessible text readout.',
        },
        {
          text: 'Which is the highest gallantry award in India during peacetime?',
          options: ['Param Vir Chakra', 'Ashoka Chakra', 'Kirti Chakra', 'Maha Vir Chakra'],
          correctAnswer: 'Ashoka Chakra',
          explanation: 'Ashoka Chakra is the highest peacetime military decoration awarded for conspicuous gallantry.',
          marks: 2.0,
          negativeMarks: 0.5,
          subject: 'Defense Studies',
          topic: 'Awards and Honours',
          difficulty: 'medium',
          accessibilityNotes: 'Clear textual description.',
        },
      ],
    },
    {
      name: 'Section B: Indian Polity & Constitution',
      description: 'Fundamental rights, preamble, and governance framework.',
      order: 2,
      durationMinutes: 30,
      questions: [
        {
          text: 'Which Article of the Constitution of India provides for the Right to Constitutional Remedies?',
          options: ['Article 19', 'Article 21', 'Article 32', 'Article 44'],
          correctAnswer: 'Article 32',
          explanation: 'Article 32 was termed the "heart and soul" of the Constitution by Dr. B.R. Ambedkar.',
          marks: 2.0,
          negativeMarks: 0.5,
          subject: 'Indian Polity',
          topic: 'Fundamental Rights',
          difficulty: 'easy',
          accessibilityNotes: 'Screen reader verified.',
        },
        {
          text: 'How many members can the President of India nominate to the Rajya Sabha?',
          options: ['10', '12', '14', '2'],
          correctAnswer: '12',
          explanation: 'Under Article 80, the President can nominate 12 members who have special knowledge or practical experience in literature, science, art, and social service.',
          marks: 2.0,
          negativeMarks: 0.5,
          subject: 'Indian Polity',
          topic: 'Union Parliament',
          difficulty: 'medium',
          accessibilityNotes: 'Numeric text formatted.',
        },
      ],
    },
  ],
};

export const UploadQuestionPaperModal: React.FC<UploadQuestionPaperModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [title, setTitle] = useState(DEFAULT_SAMPLE_PAPER.title);
  const [code, setCode] = useState(DEFAULT_SAMPLE_PAPER.code);
  const [description, setDescription] = useState(DEFAULT_SAMPLE_PAPER.description || '');
  const [examType, setExamType] = useState<string>('mock_test');
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [publishImmediately, setPublishImmediately] = useState<boolean>(true);

  const [sections, setSections] = useState(DEFAULT_SAMPLE_PAPER.sections);
  const [jsonText, setJsonText] = useState<string>('');
  const [mode, setMode] = useState<'editor' | 'json'>('editor');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{
    examId: string;
    status: string;
    totalQuestions: number;
  } | null>(null);

  const handleLoadSample = () => {
    setTitle(DEFAULT_SAMPLE_PAPER.title);
    setCode(`CDS-GK-${Date.now().toString().slice(-4)}`);
    setDescription(DEFAULT_SAMPLE_PAPER.description || '');
    setDurationMinutes(DEFAULT_SAMPLE_PAPER.durationMinutes || 60);
    setPublishImmediately(true);
    setSections(DEFAULT_SAMPLE_PAPER.sections);
    setErrorMessage(null);
    setSuccessInfo(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.title) setTitle(parsed.title);
        if (parsed.code) setCode(parsed.code);
        if (parsed.description) setDescription(parsed.description);
        if (parsed.durationMinutes) setDurationMinutes(Number(parsed.durationMinutes));
        if (Array.isArray(parsed.sections)) {
          setSections(parsed.sections);
        }
        setErrorMessage(null);
      } catch (err: any) {
        setErrorMessage('Failed to parse uploaded JSON file. Please ensure it is valid JSON.');
      }
    };
    reader.readAsText(file);
  };

  const handleApplyJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      if (parsed.title) setTitle(parsed.title);
      if (parsed.code) setCode(parsed.code);
      if (parsed.description) setDescription(parsed.description);
      if (parsed.durationMinutes) setDurationMinutes(Number(parsed.durationMinutes));
      if (Array.isArray(parsed.sections)) {
        setSections(parsed.sections);
      }
      setMode('editor');
      setErrorMessage(null);
    } catch {
      setErrorMessage('Invalid JSON format. Please verify syntax.');
    }
  };

  const totalQuestions = sections.reduce((acc, s) => acc + s.questions.length, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessInfo(null);

    if (!title.trim() || !code.trim()) {
      setErrorMessage('Assessment title and code are required.');
      return;
    }

    if (totalQuestions === 0) {
      setErrorMessage('Please add at least 1 question to upload.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await examinerService.uploadExamPaper({
        title,
        code,
        description,
        examType,
        durationMinutes,
        publishImmediately,
        sections,
      });

      setSuccessInfo({
        examId: result.exam_id,
        status: result.status,
        totalQuestions: result.total_questions || totalQuestions,
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.detail || err?.message || 'Failed to upload exam paper.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Upload Question Paper & Mock Assessment"
      description="Author or bulk upload comprehensive question papers. Publish immediately to candidates or save as private draft."
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 text-foreground">
        {/* Success Notice Banner */}
        {successInfo && (
          <div
            role="status"
            className="p-4 rounded-xl border border-status-success/30 bg-status-success/10 flex flex-col gap-2"
          >
            <div className="flex items-center gap-2 text-status-success font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>Assessment Paper Successfully Uploaded!</span>
            </div>
            <p className="text-xs text-foreground leading-relaxed">
              Paper <strong>{title}</strong> ({code}) with {successInfo.totalQuestions} questions is now{' '}
              <span className="font-bold uppercase tracking-wider text-primary">
                {successInfo.status === 'LIVE' ? 'Published Live on Candidate Portal' : 'Saved as Private Draft'}
              </span>
              .
            </p>
            {successInfo.status === 'LIVE' ? (
              <span className="text-[11px] text-foreground-muted">
                Candidates can now access this mock test directly under their Mock Tests & Practice catalog.
              </span>
            ) : (
              <span className="text-[11px] text-foreground-muted">
                This test is in Draft mode and will NOT appear on Candidate portals until you publish it.
              </span>
            )}
          </div>
        )}

        {/* Global Error Banner */}
        {errorMessage && (
          <div
            role="alert"
            className="p-3.5 rounded-lg border border-status-error/40 bg-status-error-bg text-xs font-semibold text-status-error flex items-start gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Action Bar: Load Template / Toggle JSON */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg bg-surface-elevated border border-border">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleLoadSample}
              className="flex items-center gap-1.5 text-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>Load CDS Sample Mock Paper</span>
            </Button>

            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface hover:bg-surface-elevated text-xs font-semibold text-foreground cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5 text-primary" />
              <span>Upload JSON / CSV</span>
              <input
                type="file"
                accept=".json,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (mode === 'editor') {
                  setJsonText(
                    JSON.stringify(
                      {
                        title,
                        code,
                        description,
                        durationMinutes,
                        sections,
                      },
                      null,
                      2
                    )
                  );
                  setMode('json');
                } else {
                  handleApplyJson();
                }
              }}
              className="text-xs font-semibold text-primary hover:underline cursor-pointer"
            >
              {mode === 'editor' ? 'Switch to JSON Raw View' : 'Apply & Back to Visual View'}
            </button>
          </div>
        </div>

        {mode === 'json' ? (
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-foreground">Question Paper JSON Specification</label>
            <textarea
              rows={12}
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              className="w-full font-mono text-xs p-3 rounded-lg bg-surface border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button type="button" variant="primary" size="sm" onClick={handleApplyJson}>
              Apply JSON Structure
            </Button>
          </div>
        ) : (
          <>
            {/* Paper Metadata Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="exam-title"
                label="Assessment Title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. CDS 2026 General Knowledge Mock Paper"
              />

              <Input
                id="exam-code"
                label="Unique Assessment Code"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. CDS-GK-2026-M1"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="exam-type-select" className="text-xs font-bold text-foreground">
                  Assessment Category
                </label>
                <select
                  id="exam-type-select"
                  value={examType}
                  onChange={(e) => setExamType(e.target.value)}
                  className="px-3 py-2 text-sm bg-surface-elevated border border-border rounded-lg text-foreground font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="mock_test">Full-Length Mock Test</option>
                  <option value="competitive">Official Competitive Entrance</option>
                  <option value="practice">Practice Drill Paper</option>
                </select>
              </div>

              <Input
                id="exam-duration"
                type="number"
                label="Duration (Minutes)"
                required
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                min={5}
                max={300}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="exam-description" className="text-xs font-bold text-foreground">
                Instructions &amp; Overview
              </label>
              <textarea
                id="exam-description"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Candidate instructions, topics covered, and guidelines..."
                className="w-full text-xs p-2.5 rounded-lg bg-surface border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Crucial Publishing Scope Control */}
            <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground flex items-center gap-2">
                  <Send className="w-4 h-4 text-primary" />
                  <span>Candidate Portal Publishing Control</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/20 text-primary font-bold">
                  {publishImmediately ? 'LIVE CANDIDATE ACCESS' : 'PRIVATE DRAFT'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <label
                  className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${
                    publishImmediately
                      ? 'border-status-success bg-status-success/10 text-foreground font-semibold shadow-xs'
                      : 'border-border bg-surface text-foreground-muted hover:border-border-strong'
                  }`}
                >
                  <input
                    type="radio"
                    name="publish-target"
                    checked={publishImmediately}
                    onChange={() => setPublishImmediately(true)}
                    className="mt-0.5"
                  />
                  <div>
                    <span className="font-bold text-foreground block">
                      Publish to Candidate Portal immediately
                    </span>
                    <span className="text-[11px] text-foreground-muted block mt-0.5">
                      Status: LIVE. Immediately visible in Candidate Mock Tests and Exams catalog.
                    </span>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${
                    !publishImmediately
                      ? 'border-amber-500 bg-amber-500/10 text-foreground font-semibold shadow-xs'
                      : 'border-border bg-surface text-foreground-muted hover:border-border-strong'
                  }`}
                >
                  <input
                    type="radio"
                    name="publish-target"
                    checked={!publishImmediately}
                    onChange={() => setPublishImmediately(false)}
                    className="mt-0.5"
                  />
                  <div>
                    <span className="font-bold text-foreground block">
                      Save as Private Draft
                    </span>
                    <span className="text-[11px] text-foreground-muted block mt-0.5">
                      Status: DRAFT. Only visible in Examiner Studio; candidates cannot see or start it.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Questions & Sections Preview */}
            <div className="flex flex-col gap-3 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-foreground flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-primary" />
                  <span>
                    Paper Structure: {sections.length} Sections, {totalQuestions} Questions
                  </span>
                </span>
                <span className="text-foreground-muted font-mono">
                  {sections.reduce(
                    (acc, s) => acc + s.questions.reduce((m, q) => m + (q.marks || 1), 0),
                    0
                  )}{' '}
                  Total Marks
                </span>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
                {sections.map((section, sIdx) => (
                  <div
                    key={sIdx}
                    className="p-3 rounded-lg bg-surface border border-border flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-primary">
                      <span>{section.name}</span>
                      <span className="text-foreground-muted text-[11px]">
                        {section.questions.length} questions ({section.durationMinutes || 30} mins)
                      </span>
                    </div>

                    <div className="space-y-2 mt-1">
                      {section.questions.map((q, qIdx) => (
                        <div
                          key={qIdx}
                          className="p-2 rounded bg-surface-elevated/70 text-xs border border-border/70 flex flex-col gap-1"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-semibold text-foreground">
                              {sIdx + 1}.{qIdx + 1} {q.text}
                            </span>
                            <span className="shrink-0 text-[10px] font-mono font-bold text-primary px-1.5 py-0.5 bg-primary/10 rounded">
                              +{q.marks || 2} / -{q.negativeMarks || 0.5}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-1 text-[11px] text-foreground-muted mt-1">
                            {q.options.map((opt, oIdx) => (
                              <span
                                key={oIdx}
                                className={`px-2 py-0.5 rounded border text-[11px] truncate ${
                                  opt === q.correctAnswer
                                    ? 'border-status-success bg-status-success/10 text-status-success font-bold'
                                    : 'border-border/60 bg-surface'
                                }`}
                              >
                                {opt === q.correctAnswer ? '✓ ' : ''}{opt}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Form Submission Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border mt-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            loadingText="Uploading Assessment..."
            iconRight={<Upload className="w-4 h-4" />}
          >
            {publishImmediately ? 'Upload & Publish to Candidates' : 'Save as Private Draft'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
