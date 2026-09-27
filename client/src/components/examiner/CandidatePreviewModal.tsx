import React, { useState } from 'react';
import { QuestionBankItem } from '../../types/examiner';
import { Button } from '../common/Button';
import { Eye, Keyboard, Volume2, Type, SunMoon, X } from 'lucide-react';

interface CandidatePreviewModalProps {
  question: QuestionBankItem;
  isOpen: boolean;
  onClose: () => void;
}

type PreviewMode = 'normal' | 'keyboard' | 'screen_reader' | 'large_text' | 'high_contrast';

export const CandidatePreviewModal: React.FC<CandidatePreviewModalProps> = ({
  question,
  isOpen,
  onClose,
}) => {
  const [mode, setMode] = useState<PreviewMode>('normal');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-modal-title"
    >
      <div className="bg-surface border border-border rounded-2xl max-w-3xl w-full p-6 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-primary">
              Accessibility Experience Simulator
            </span>
            <h2 id="preview-modal-title" className="text-xl font-bold text-foreground">
              Candidate Preview: {question.code}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Preview"
            className="p-2 rounded-lg text-foreground-muted hover:text-foreground hover:bg-surface-elevated transition-colors"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div
          className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-border"
          role="tablist"
          aria-label="Candidate Experience Modes"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'normal'}
            onClick={() => setMode('normal')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all shrink-0 ${
              mode === 'normal'
                ? 'bg-primary text-primary-contrast'
                : 'bg-surface-elevated text-foreground hover:text-primary'
            }`}
          >
            <Eye className="w-4 h-4" aria-hidden="true" />
            Normal View
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={mode === 'keyboard'}
            onClick={() => setMode('keyboard')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all shrink-0 ${
              mode === 'keyboard'
                ? 'bg-primary text-primary-contrast ring-2 ring-primary/40'
                : 'bg-surface-elevated text-foreground hover:text-primary'
            }`}
          >
            <Keyboard className="w-4 h-4" aria-hidden="true" />
            Keyboard-Only View
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={mode === 'screen_reader'}
            onClick={() => setMode('screen_reader')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all shrink-0 ${
              mode === 'screen_reader'
                ? 'bg-primary text-primary-contrast'
                : 'bg-surface-elevated text-foreground hover:text-primary'
            }`}
          >
            <Volume2 className="w-4 h-4" aria-hidden="true" />
            Screen Reader Acoustic Structure
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={mode === 'large_text'}
            onClick={() => setMode('large_text')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all shrink-0 ${
              mode === 'large_text'
                ? 'bg-primary text-primary-contrast'
                : 'bg-surface-elevated text-foreground hover:text-primary'
            }`}
          >
            <Type className="w-4 h-4" aria-hidden="true" />
            Large Text (150%)
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={mode === 'high_contrast'}
            onClick={() => setMode('high_contrast')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all shrink-0 ${
              mode === 'high_contrast'
                ? 'bg-primary text-primary-contrast'
                : 'bg-surface-elevated text-foreground hover:text-primary'
            }`}
          >
            <SunMoon className="w-4 h-4" aria-hidden="true" />
            High Contrast View
          </button>
        </div>

        {/* Mode Information Callout */}
        <div className="p-3 rounded-lg bg-surface-elevated border border-border text-xs text-foreground-muted flex items-center justify-between">
          <span>
            {mode === 'normal' && 'Standard accessible candidate view with clean typography and layout.'}
            {mode === 'keyboard' && 'Candidate navigates exclusively using Tab, Shift+Tab, Arrow Keys, and Spacebar. Key indicators shown.'}
            {mode === 'screen_reader' && 'Inspects the linear speech tree, aria-labels, formula ClearSpeak, and table header semantics heard by blind candidates.'}
            {mode === 'large_text' && 'Low-vision magnification mode testing that items scale without clipping or horizontal overflow.'}
            {mode === 'high_contrast' && 'High-contrast mode ensuring strict luminosity contrast borders for visually impaired candidates.'}
          </span>
          <span className="font-mono text-[10px] uppercase font-bold text-primary shrink-0 ml-3">
            v{question.version} snapshot
          </span>
        </div>

        {/* Preview Container Render */}
        <div
          className={`p-6 rounded-xl border transition-all ${
            mode === 'high_contrast'
              ? 'bg-black text-white border-white ring-2 ring-yellow-400'
              : 'bg-surface border-border'
          } ${mode === 'large_text' ? 'text-lg space-y-5' : 'text-base space-y-4'}`}
        >
          {/* Question Text */}
          <div className="flex items-start gap-3">
            <span className="font-mono font-bold text-primary shrink-0">Q.</span>
            <div className="flex-1">
              <p className="font-semibold text-foreground leading-relaxed">{question.text}</p>

              {/* Optional Math Formula */}
              {question.formulaLatex && (
                <div className="my-3 p-3 rounded-lg bg-surface-elevated border border-border font-mono text-sm flex flex-col gap-1.5">
                  <span className="text-[11px] font-bold text-foreground-muted">Formula Representation:</span>
                  <code className="text-primary font-bold">{question.formulaLatex}</code>
                  {question.accessibility?.formulaSpeech && (
                    <div className="mt-1 p-2 rounded bg-primary/10 border border-primary/20 text-xs text-foreground flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                      <span><strong>ClearSpeak Audio:</strong> "{question.accessibility.formulaSpeech}"</span>
                    </div>
                  )}
                </div>
              )}

              {/* Optional Table */}
              {question.accessibility?.tableCaption && (
                <div className="my-3 overflow-x-auto">
                  <table className="w-full text-xs border border-border text-left">
                    <caption className="font-bold text-foreground py-1 text-left">
                      {question.accessibility.tableCaption}
                    </caption>
                    {question.accessibility.tableHeaders && (
                      <thead className="bg-surface-elevated border-b border-border">
                        <tr>
                          {question.accessibility.tableHeaders.map((h, i) => (
                            <th key={i} className="p-2 border-r border-border font-bold">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                    )}
                    <tbody>
                      <tr>
                        <td className="p-2 border-r border-border">Research & Dev</td>
                        <td className="p-2 border-r border-border">20</td>
                        <td className="p-2 border-r border-border">35</td>
                        <td className="p-2">48</td>
                      </tr>
                      <tr className="bg-surface-elevated/40">
                        <td className="p-2 border-r border-border">Engineering Ops</td>
                        <td className="p-2 border-r border-border">50</td>
                        <td className="p-2 border-r border-border">60</td>
                        <td className="p-2">68</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* Optional Image with Alt text & Long Description */}
              {question.imageUrl && (
                <div className="my-3 p-3 rounded-lg bg-surface-elevated border border-border flex flex-col gap-2">
                  <div className="w-full h-32 bg-border/40 rounded flex items-center justify-center text-foreground-muted text-xs font-mono">
                    [Image Visual: {question.imageUrl}]
                  </div>
                  <div className="text-xs space-y-1">
                    <p className="text-foreground"><strong>Alt Text:</strong> {question.accessibility.altText || 'Missing'}</p>
                    {question.accessibility.longDescription && (
                      <p className="text-foreground-muted"><strong>Long Description:</strong> {question.accessibility.longDescription}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Options / Answer Input */}
          {question.options && question.options.length > 0 ? (
            <div className="space-y-2 mt-4" role="radiogroup" aria-label="Question choices">
              {question.options.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  role="radio"
                  aria-checked={selectedOption === opt.id}
                  onClick={() => setSelectedOption(opt.id)}
                  className={`w-full text-left p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                    selectedOption === opt.id
                      ? 'bg-primary/10 border-primary text-foreground font-bold ring-2 ring-primary/40'
                      : 'bg-surface-elevated border-border text-foreground hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-surface border border-border flex items-center justify-center font-mono text-xs font-bold text-primary shrink-0">
                      {opt.label}
                    </span>
                    <span className={mode === 'large_text' ? 'text-lg' : 'text-sm'}>{opt.text}</span>
                  </div>
                  {mode === 'keyboard' && (
                    <span className="text-[10px] font-mono bg-border px-1.5 py-0.5 rounded text-foreground-muted">
                      Key [{opt.label}]
                    </span>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-4 p-4 rounded-xl border border-border bg-surface-elevated space-y-2">
              <label htmlFor="preview-candidate-input" className="block text-xs font-bold text-foreground">
                Candidate Answer Entry ({question.type === 'numerical' ? 'Numeric' : 'Text'}):
              </label>
              <input
                id="preview-candidate-input"
                type="text"
                placeholder={question.type === 'numerical' ? 'Enter numerical answer...' : 'Type short answer explanation...'}
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}

          {/* Screen Reader DOM Speech Inspector */}
          {mode === 'screen_reader' && (
            <div className="mt-5 p-4 rounded-xl bg-surface-elevated border border-primary/40 flex flex-col gap-2">
              <span className="text-xs font-mono font-bold text-primary flex items-center gap-1.5 uppercase">
                <Volume2 className="w-4 h-4" aria-hidden="true" />
                Synthesized Screen Reader Speech Stream (NVDA / JAWS / TalkBack):
              </span>
              <p className="text-xs font-mono text-foreground leading-relaxed bg-surface p-3 rounded-lg border border-border">
                "Question {question.code}. Heading Level 3. {question.text}.{' '}
                {question.accessibility?.formulaSpeech ? `Formula: ${question.accessibility.formulaSpeech}. ` : ''}
                {question.accessibility?.altText ? `Graphic: ${question.accessibility.altText}. ` : ''}
                {question.options?.map((o) => `Option ${o.label}: ${o.ariaLabel || o.text}.`).join(' ')}
                {' '}To select an option, press Spacebar or enter corresponding key."
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-xs text-foreground-muted">
            Accessibility validation: <strong>Ready for examination inclusion</strong>
          </span>
          <Button variant="secondary" onClick={onClose}>
            Close Preview
          </Button>
        </div>
      </div>
    </div>
  );
};
