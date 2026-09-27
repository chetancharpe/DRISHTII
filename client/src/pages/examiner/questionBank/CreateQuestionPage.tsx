import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { questionBankService } from '../../../services/questionBankService';
import { QuestionAccessibilityChecklist } from '../../../components/examiner/QuestionAccessibilityChecklist';
import { CandidatePreviewModal } from '../../../components/examiner/CandidatePreviewModal';
import { BankQuestionType, BankQuestionDifficulty, BankQuestionOption, QuestionBankItem } from '../../../types/examiner';
import {
  Plus,
  Trash2,
  Eye,
  CheckCircle2,
  Image as ImageIcon,
  Sigma,
  Table as TableIcon,
} from 'lucide-react';


export const CreateQuestionPage: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);

  // Form fields
  const [text, setText] = useState<string>('');
  const [type, setType] = useState<BankQuestionType>('single_choice');
  const [subject, setSubject] = useState<string>('Quantitative Aptitude');
  const [topic, setTopic] = useState<string>('Algebra');
  const [difficulty, setDifficulty] = useState<BankQuestionDifficulty>('medium');
  const [marks, setMarks] = useState<number>(2);
  const [negativeMarks, setNegativeMarks] = useState<number>(0.5);
  const [language, setLanguage] = useState<string>('English');
  const [tagsInput] = useState<string>('Algebra, Core, Competitive');
  const [explanation, setExplanation] = useState<string>('');
  const [correctAnswerText, setCorrectAnswerText] = useState<string>('');

  // Optional accessible media attachments
  const [hasImage, setHasImage] = useState<boolean>(false);
  const [imageUrl] = useState<string>('/assets/sample-diagram.svg');

  const [altText, setAltText] = useState<string>('');
  const [longDescription, setLongDescription] = useState<string>('');

  const [hasFormula, setHasFormula] = useState<boolean>(false);
  const [formulaLatex, setFormulaLatex] = useState<string>('x^2 - 4 = 0');
  const [formulaSpeech, setFormulaSpeech] = useState<string>('x squared minus 4 equals 0');

  const [hasTable, setHasTable] = useState<boolean>(false);
  const [tableCaption, setTableCaption] = useState<string>('Sample Tabular Data');
  const [tableHeadersInput, setTableHeadersInput] = useState<string>('Parameter, Value, Unit');

  const [options, setOptions] = useState<BankQuestionOption[]>([
    { id: 'opt-1', label: 'A', text: '', isCorrect: true },
    { id: 'opt-2', label: 'B', text: '', isCorrect: false },
    { id: 'opt-3', label: 'C', text: '', isCorrect: false },
    { id: 'opt-4', label: 'D', text: '', isCorrect: false },
  ]);

  // Real-time accessibility calculation
  const validation = questionBankService.validateAccessibility({
    text,
    type,
    language,
    options,
    imageUrl: hasImage ? imageUrl : undefined,
    formulaLatex: hasFormula ? formulaLatex : undefined,
    accessibility: {
      hasReadableText: true,
      hasAltTextIfImage: true,
      noImageOnlyInformation: true,
      tableHasHeaders: true,
      formulaHasAccessibleSpeech: true,
      optionsHaveMeaningfulLabels: true,
      languageSpecified: true,
      noColorOnlyInstructions: true,
      altText: hasImage ? altText : undefined,
      longDescription: hasImage ? longDescription : undefined,
      formulaSpeech: hasFormula ? formulaSpeech : undefined,
      tableCaption: hasTable ? tableCaption : undefined,
      tableHeaders: hasTable ? tableHeadersInput.split(',').map((h) => h.trim()) : undefined,
    },
  });

  const handleAddOption = () => {
    const nextLabel = String.fromCharCode(65 + options.length);
    setOptions([
      ...options,
      { id: `opt-${Date.now()}`, label: nextLabel, text: '', isCorrect: false },
    ]);
  };

  const handleRemoveOption = (id: string) => {
    if (options.length <= 2) return;
    setOptions(options.filter((o) => o.id !== id));
  };

  const handleOptionChange = (id: string, newText: string) => {
    setOptions(options.map((o) => (o.id === id ? { ...o, text: newText } : o)));
  };

  const handleCorrectChoice = (id: string) => {
    if (type === 'single_choice' || type === 'true_false') {
      setOptions(options.map((o) => ({ ...o, isCorrect: o.id === id })));
    } else {
      setOptions(options.map((o) => (o.id === id ? { ...o, isCorrect: !o.isCorrect } : o)));
    }
  };

  const currentPreviewMock: QuestionBankItem = {
    id: 'qb-temp',
    code: 'QA-PREVIEW-01',
    text: text || 'Enter question prompt...',
    type,
    subject,
    topic,
    difficulty,
    marks,
    negativeMarks,
    language,
    tags: tagsInput.split(',').map((t) => t.trim()),
    options,
    correctAnswerText,
    explanation,
    version: 1,
    versionHistory: [],
    status: 'draft',
    createdBy: 'You',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    imageUrl: hasImage ? imageUrl : undefined,
    formulaLatex: hasFormula ? formulaLatex : undefined,
    accessibility: {
      hasReadableText: validation.hasReadableText,
      hasAltTextIfImage: validation.hasAltTextIfImage,
      noImageOnlyInformation: validation.noImageOnlyInformation,
      tableHasHeaders: validation.tableHasHeaders,
      formulaHasAccessibleSpeech: validation.formulaHasAccessibleSpeech,
      optionsHaveMeaningfulLabels: validation.optionsHaveMeaningfulLabels,
      languageSpecified: validation.languageSpecified,
      noColorOnlyInstructions: validation.noColorOnlyInstructions,
      altText: hasImage ? altText : undefined,
      longDescription: hasImage ? longDescription : undefined,
      formulaSpeech: hasFormula ? formulaSpeech : undefined,
      tableCaption: hasTable ? tableCaption : undefined,
      tableHeaders: hasTable ? tableHeadersInput.split(',').map((h) => h.trim()) : undefined,
    },
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validation.isFullyAccessible) {
      alert(`Cannot save: ${validation.blockingErrors.join('\n')}`);
      return;
    }

    setIsSubmitting(true);
    try {
      await questionBankService.createQuestion({
        text,
        type,
        subject,
        topic,
        difficulty,
        marks,
        negativeMarks,
        language,
        tags: tagsInput.split(',').map((t) => t.trim()),
        options: type === 'numerical' || type === 'short_answer' ? [] : options,
        correctAnswerText: type === 'numerical' || type === 'short_answer' ? correctAnswerText : undefined,
        explanation,
        imageUrl: hasImage ? imageUrl : undefined,
        formulaLatex: hasFormula ? formulaLatex : undefined,
        accessibility: {
          hasReadableText: validation.hasReadableText,
          hasAltTextIfImage: validation.hasAltTextIfImage,
          noImageOnlyInformation: validation.noImageOnlyInformation,
          tableHasHeaders: validation.tableHasHeaders,
          formulaHasAccessibleSpeech: validation.formulaHasAccessibleSpeech,
          optionsHaveMeaningfulLabels: validation.optionsHaveMeaningfulLabels,
          languageSpecified: validation.languageSpecified,
          noColorOnlyInstructions: validation.noColorOnlyInstructions,
          altText: hasImage ? altText : undefined,
          longDescription: hasImage ? longDescription : undefined,
          formulaSpeech: hasFormula ? formulaSpeech : undefined,
          tableCaption: hasTable ? tableCaption : undefined,
          tableHeaders: hasTable ? tableHeadersInput.split(',').map((h) => h.trim()) : undefined,
        },
      });

      navigate('/examiner/question-bank');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Question creation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6" role="main" aria-label="Author Accessible Question Form">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-primary">
            Item Authoring Studio
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Create Accessible Question
          </h1>
          <p className="text-sm text-foreground-muted mt-1">
            Build WCAG AAA compliant assessment items with mandatory alt-text and ClearSpeak formulas.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setIsPreviewOpen(true)}
            className="flex items-center gap-2"
          >
            <Eye className="w-4 h-4" aria-hidden="true" />
            Preview as Candidate
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSubmit}
            disabled={!validation.isFullyAccessible || isSubmitting}
            className="flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
            {isSubmitting ? 'Saving...' : 'Save & Publish to Bank'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Body */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Question Fundamentals" subtitle="Subject, prompt, and response format">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label htmlFor="q-type" className="text-xs font-bold text-foreground block">
                    Question Type
                  </label>
                  <select
                    id="q-type"
                    value={type}
                    onChange={(e) => setType(e.target.value as BankQuestionType)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground text-sm font-semibold"
                  >
                    <option value="single_choice">Single Choice (Radio)</option>
                    <option value="multiple_choice">Multiple Choice (Checkbox)</option>
                    <option value="true_false">True / False</option>
                    <option value="numerical">Numerical Input</option>
                    <option value="short_answer">Short Answer (Subjective)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label htmlFor="q-subject" className="text-xs font-bold text-foreground block">
                    Subject
                  </label>
                  <input
                    id="q-subject"
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="q-topic" className="text-xs font-bold text-foreground block">
                    Topic
                  </label>
                  <input
                    id="q-topic"
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="q-prompt" className="text-xs font-bold text-foreground block">
                  Question Prompt Text <span className="text-status-error">*</span>
                </label>
                <textarea
                  id="q-prompt"
                  rows={4}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Enter the complete question prompt..."
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Marks & Difficulty */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label htmlFor="q-diff" className="text-[11px] font-bold text-foreground block">
                    Difficulty
                  </label>
                  <select
                    id="q-diff"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as BankQuestionDifficulty)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-surface text-foreground text-xs"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="q-marks" className="text-[11px] font-bold text-foreground block">
                    Marks (+ Award)
                  </label>
                  <input
                    id="q-marks"
                    type="number"
                    step="0.5"
                    value={marks}
                    onChange={(e) => setMarks(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-surface text-foreground text-xs"
                  />
                </div>

                <div>
                  <label htmlFor="q-neg" className="text-[11px] font-bold text-foreground block">
                    Negative Penalty
                  </label>
                  <input
                    id="q-neg"
                    type="number"
                    step="0.25"
                    value={negativeMarks}
                    onChange={(e) => setNegativeMarks(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-surface text-foreground text-xs"
                  />
                </div>

                <div>
                  <label htmlFor="q-lang" className="text-[11px] font-bold text-foreground block">
                    Language
                  </label>
                  <input
                    id="q-lang"
                    type="text"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-surface text-foreground text-xs"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Options / Answer Configuration */}
          {(type === 'single_choice' || type === 'multiple_choice' || type === 'true_false') && (
            <Card
              title="Answer Choices & Keys"
              subtitle={`Specify options and designate ${type === 'single_choice' ? 'the correct radio choice' : 'correct choices'}`}
            >
              <div className="space-y-3">
                {options.map((opt) => (
                  <div
                    key={opt.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                      opt.isCorrect ? 'bg-status-success/10 border-status-success/40' : 'bg-surface border-border'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleCorrectChoice(opt.id)}
                      className={`w-7 h-7 rounded-lg border flex items-center justify-center font-mono text-xs font-bold transition-all ${
                        opt.isCorrect
                          ? 'bg-status-success text-white border-status-success'
                          : 'bg-surface-elevated text-foreground-muted border-border hover:border-primary'
                      }`}
                      aria-label={`Mark Option ${opt.label} as ${opt.isCorrect ? 'incorrect' : 'correct'}`}
                      title={opt.isCorrect ? 'Correct Answer' : 'Click to set correct'}
                    >
                      {opt.label}
                    </button>

                    <input
                      type="text"
                      value={opt.text}
                      onChange={(e) => handleOptionChange(opt.id, e.target.value)}
                      placeholder={`Enter text for Option ${opt.label}...`}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-border bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />

                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(opt.id)}
                        className="p-1.5 text-foreground-muted hover:text-status-error"
                        aria-label={`Remove option ${opt.label}`}
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                ))}

                {type !== 'true_false' && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleAddOption}
                    className="flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" aria-hidden="true" />
                    Add Option Choice
                  </Button>
                )}
              </div>
            </Card>
          )}

          {/* Numerical / Short Answer Input */}
          {(type === 'numerical' || type === 'short_answer') && (
            <Card
              title={type === 'numerical' ? 'Correct Numerical Value' : 'Subjective Scoring Rubric'}
              subtitle={type === 'numerical' ? 'Precise number expected for auto-evaluation' : 'Expected answer reference used by examiners during manual grading'}
            >
              <div className="space-y-2">
                <label htmlFor="q-correct-text" className="text-xs font-bold text-foreground block">
                  {type === 'numerical' ? 'Expected Number' : 'Reference Rubric & Expected Core Concepts'}
                </label>
                <textarea
                  id="q-correct-text"
                  rows={3}
                  value={correctAnswerText}
                  onChange={(e) => setCorrectAnswerText(e.target.value)}
                  placeholder={type === 'numerical' ? 'e.g., 220' : 'State key concepts required for full marks...'}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground text-sm font-mono text-xs"
                />
              </div>
            </Card>
          )}

          {/* Accessible Media Attachments (Image, Math, Table) */}
          <Card title="Accessible Multimodal Attachments" subtitle="Toggle if this question contains visual graphics, formulas, or tables">
            <div className="space-y-4">
              {/* Image Toggle */}
              <div className="p-3.5 rounded-xl border border-border bg-surface space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <ImageIcon className="w-4 h-4 text-status-warning" aria-hidden="true" />
                    <span className="text-sm font-bold text-foreground">Attach Graphical Image</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={hasImage}
                    onChange={(e) => setHasImage(e.target.checked)}
                    className="rounded text-primary focus:ring-primary"
                  />
                </label>

                {hasImage && (
                  <div className="pt-3 border-t border-border space-y-3 text-xs">
                    <div className="space-y-1">
                      <label className="font-bold text-foreground block">
                        Alternative Text (Mandatory) <span className="text-status-error">*</span>
                      </label>
                      <input
                        type="text"
                        value={altText}
                        onChange={(e) => setAltText(e.target.value)}
                        placeholder="e.g., Bar graph showing monthly sales: Jan 20, Feb 35..."
                        className="w-full px-3 py-1.5 rounded-lg border border-border bg-surface text-foreground text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-foreground block">
                        Extended Long Description (Recommended for Complex Diagrams)
                      </label>
                      <textarea
                        rows={2}
                        value={longDescription}
                        onChange={(e) => setLongDescription(e.target.value)}
                        placeholder="Detailed non-visual layout breakdown..."
                        className="w-full px-3 py-1.5 rounded-lg border border-border bg-surface text-foreground text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Math Formula Toggle */}
              <div className="p-3.5 rounded-xl border border-border bg-surface space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <Sigma className="w-4 h-4 text-primary" aria-hidden="true" />
                    <span className="text-sm font-bold text-foreground">Mathematical Formula</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={hasFormula}
                    onChange={(e) => setHasFormula(e.target.checked)}
                    className="rounded text-primary focus:ring-primary"
                  />
                </label>

                {hasFormula && (
                  <div className="pt-3 border-t border-border space-y-3 text-xs">
                    <div className="space-y-1">
                      <label className="font-bold text-foreground block">Formula LaTeX / Text</label>
                      <input
                        type="text"
                        value={formulaLatex}
                        onChange={(e) => setFormulaLatex(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-border bg-surface text-foreground text-sm font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-foreground block">
                        Accessible ClearSpeak Audio Transcription <span className="text-status-error">*</span>
                      </label>
                      <input
                        type="text"
                        value={formulaSpeech}
                        onChange={(e) => setFormulaSpeech(e.target.value)}
                        placeholder="e.g., x squared minus 4 equals 0"
                        className="w-full px-3 py-1.5 rounded-lg border border-border bg-surface text-foreground text-sm font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Table Toggle */}
              <div className="p-3.5 rounded-xl border border-border bg-surface space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <TableIcon className="w-4 h-4 text-secondary" aria-hidden="true" />
                    <span className="text-sm font-bold text-foreground">Tabular Dataset</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={hasTable}
                    onChange={(e) => setHasTable(e.target.checked)}
                    className="rounded text-primary focus:ring-primary"
                  />
                </label>

                {hasTable && (
                  <div className="pt-3 border-t border-border space-y-3 text-xs">
                    <div className="space-y-1">
                      <label className="font-bold text-foreground block">Table Caption (Title)</label>
                      <input
                        type="text"
                        value={tableCaption}
                        onChange={(e) => setTableCaption(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-border bg-surface text-foreground text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-foreground block">
                        Column Headers (Comma separated) <span className="text-status-error">*</span>
                      </label>
                      <input
                        type="text"
                        value={tableHeadersInput}
                        onChange={(e) => setTableHeadersInput(e.target.value)}
                        placeholder="Department, Q1 Units, Q2 Units"
                        className="w-full px-3 py-1.5 rounded-lg border border-border bg-surface text-foreground text-sm font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Explanation */}
          <Card title="Explanation & Solution Rationale" subtitle="Presented to candidates after results publication">
            <div className="space-y-1">
              <label htmlFor="q-explanation" className="text-xs font-bold text-foreground block">
                Detailed Solution Walkthrough
              </label>
              <textarea
                id="q-explanation"
                rows={3}
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Explain the step-by-step logic..."
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground text-sm"
              />
            </div>
          </Card>
        </div>

        {/* Right Sidebar: Real-Time Accessibility Validation Checklist */}
        <div className="flex flex-col gap-6">
          <QuestionAccessibilityChecklist validation={validation} />

          <Card title="Question Versioning" subtitle="Integrity in competitive testing">
            <div className="p-3 rounded-lg bg-surface-elevated border border-border text-xs text-foreground-muted space-y-2">
              <p>
                Once an item is published into a live examination, its version becomes permanently immutable.
              </p>
              <span className="font-mono text-primary font-bold block">
                Initial Save: Version 1 (v1.0)
              </span>
            </div>
          </Card>
        </div>
      </div>

      {/* Candidate Simulator Modal */}
      <CandidatePreviewModal
        question={currentPreviewMock}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
      />
    </div>
  );
};
