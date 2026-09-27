import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ExaminerExam, QuestionBankItem } from '../../../types/examiner';
import { examinerService } from '../../../services/examinerService';
import { questionBankService } from '../../../services/questionBankService';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { CandidatePreviewModal } from '../../../components/examiner/CandidatePreviewModal';
import {
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  CheckCircle2,
  ArrowLeft,
  Database,
} from 'lucide-react';


export const ExamQuestionsPage: React.FC = () => {
  const { examId = 'exam-01' } = useParams<{ examId: string }>();
  const [exam, setExam] = useState<ExaminerExam | null>(null);
  const [availableQuestions, setAvailableQuestions] = useState<QuestionBankItem[]>([]);
  const [activeSectionId, setActiveSectionId] = useState<string>('');
  const [previewQuestion, setPreviewQuestion] = useState<QuestionBankItem | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  useEffect(() => {
    const load = async () => {
      const [examData, qbData] = await Promise.all([
        examinerService.getExamById(examId),
        questionBankService.getQuestions(),
      ]);
      if (examData) {
        setExam(examData);
        setActiveSectionId(examData.sections?.[0]?.id || '');
      }
      setAvailableQuestions(qbData);
    };
    load();
  }, [examId]);

  if (!exam) {
    return <div className="p-8 text-center text-foreground-muted">Loading question builder...</div>;
  }

  const activeSection = exam.sections.find((s) => s.id === activeSectionId) || exam.sections[0];
  const assignedQuestionItems = (activeSection?.questionIds || [])
    .map((qid) => availableQuestions.find((q) => q.id === qid))
    .filter(Boolean) as QuestionBankItem[];

  const handleRemoveQuestion = (questionId: string) => {
    if (!activeSection) return;
    const updatedSections = exam.sections.map((s) =>
      s.id === activeSection.id
        ? { ...s, questionIds: s.questionIds.filter((id) => id !== questionId) }
        : s
    );
    setExam({ ...exam, sections: updatedSections });
  };

  const handleMoveUp = (index: number) => {
    if (index === 0 || !activeSection) return;
    const reordered = [...activeSection.questionIds];
    const temp = reordered[index - 1];
    reordered[index - 1] = reordered[index];
    reordered[index] = temp;

    const updatedSections = exam.sections.map((s) =>
      s.id === activeSection.id ? { ...s, questionIds: reordered } : s
    );
    setExam({ ...exam, sections: updatedSections });
  };

  const handleMoveDown = (index: number) => {
    if (!activeSection || index === activeSection.questionIds.length - 1) return;
    const reordered = [...activeSection.questionIds];
    const temp = reordered[index + 1];
    reordered[index + 1] = reordered[index];
    reordered[index] = temp;

    const updatedSections = exam.sections.map((s) =>
      s.id === activeSection.id ? { ...s, questionIds: reordered } : s
    );
    setExam({ ...exam, sections: updatedSections });
  };

  const handleAddQuestionToSection = (qId: string) => {
    if (!activeSection) return;
    if (activeSection.questionIds.includes(qId)) return;

    const updatedSections = exam.sections.map((s) =>
      s.id === activeSection.id ? { ...s, questionIds: [...s.questionIds, qId] } : s
    );
    setExam({ ...exam, sections: updatedSections });
    setShowAddModal(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const totalQ = exam.sections.reduce((acc, curr) => acc + curr.questionIds.length, 0);
      await examinerService.updateExam(examId, {
        sections: exam.sections,
        totalQuestions: totalQ,
        totalMarks: totalQ * exam.markingScheme.correctMarks,
      });
      alert('Examination questions updated.');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6" role="main" aria-label="Exam Question Builder">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link to="/examiner/exams" className="text-xs text-primary font-bold hover:underline flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
              Back to Exams
            </Link>
            <span className="text-xs text-foreground-muted">/</span>
            <span className="font-mono text-xs text-foreground-muted">{exam.code}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Question Builder: {exam.title}
          </h1>
          <p className="text-sm text-foreground-muted mt-1">
            Assign verified questions to sections, adjust presentation order, and review candidate accessibility preview.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => setShowAddModal(true)} className="flex items-center gap-2">
            <Database className="w-4 h-4" aria-hidden="true" />
            Add From Bank
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={isSaving} className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
            {isSaving ? 'Saving...' : 'Save Question Set'}
          </Button>
        </div>
      </div>

      {/* Section Switcher Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-border">
        {exam.sections.map((sec) => (
          <button
            key={sec.id}
            type="button"
            onClick={() => setActiveSectionId(sec.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 ${
              activeSection?.id === sec.id
                ? 'bg-primary text-primary-contrast shadow-sm'
                : 'bg-surface border border-border text-foreground hover:bg-surface-elevated'
            }`}
          >
            <span>{sec.title}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                activeSection?.id === sec.id ? 'bg-black/20 text-white' : 'bg-surface-elevated text-primary'
              }`}
            >
              {sec.questionIds?.length || 0}
            </span>
          </button>
        ))}
      </div>

      {/* Questions in Section Table */}
      <Card
        title={`Questions in ${activeSection?.title || 'Selected Section'}`}
        subtitle={`Ordering mode: ${exam.rules.randomizeQuestionOrder ? 'Randomized at runtime' : 'Fixed examiner manual sequence'}`}
      >
        <div className="space-y-3">
          {assignedQuestionItems.length === 0 ? (
            <div className="p-8 text-center text-foreground-muted">
              <p className="font-bold text-foreground">No questions assigned to this section yet.</p>
              <p className="text-xs mt-1">Click "Add From Bank" to select questions.</p>
            </div>
          ) : (
            assignedQuestionItems.map((q, idx) => (
              <div
                key={q.id}
                className="p-4 rounded-xl border border-border bg-surface-elevated/40 flex items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <span className="font-mono text-xs font-bold text-primary bg-surface px-2 py-1 rounded border border-border shrink-0">
                    #{idx + 1}
                  </span>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-primary">{q.code}</span>
                      <span className="text-xs text-foreground-muted">• {q.subject}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-status-success/15 text-status-success">
                        v{q.version} snapshot
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-foreground truncate mt-1">{q.text}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPreviewQuestion(q)}
                    title="Preview as Candidate"
                    aria-label={`Preview question ${q.code}`}
                  >
                    <Eye className="w-4 h-4 text-foreground-muted hover:text-foreground" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={idx === 0}
                    onClick={() => handleMoveUp(idx)}
                    title="Move Up"
                    aria-label={`Move question ${q.code} up`}
                  >
                    <ArrowUp className="w-4 h-4" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={idx === assignedQuestionItems.length - 1}
                    onClick={() => handleMoveDown(idx)}
                    title="Move Down"
                    aria-label={`Move question ${q.code} down`}
                  >
                    <ArrowDown className="w-4 h-4" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveQuestion(q.id)}
                    className="text-status-error hover:bg-status-error/10"
                    title="Remove from Section"
                    aria-label={`Remove question ${q.code} from section`}
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Add From Bank Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl max-w-2xl w-full p-6 shadow-2xl flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-foreground">Add Questions from Question Bank</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {availableQuestions
                .filter((q) => !(activeSection?.questionIds || []).includes(q.id))
                .map((q) => (
                  <div
                    key={q.id}
                    className="p-3 rounded-lg border border-border bg-surface-elevated flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-primary block">{q.code}</span>
                      <p className="font-semibold text-foreground line-clamp-1">{q.text}</p>
                      <span className="text-foreground-muted">{q.subject} • {q.difficulty}</span>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleAddQuestionToSection(q.id)}
                    >
                      Assign
                    </Button>
                  </div>
                ))}
            </div>
            <div className="pt-2 border-t border-border flex justify-end">
              <Button variant="secondary" onClick={() => setShowAddModal(false)}>
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Candidate Simulator */}
      {previewQuestion && (
        <CandidatePreviewModal
          question={previewQuestion}
          isOpen={!!previewQuestion}
          onClose={() => setPreviewQuestion(null)}
        />
      )}
    </div>
  );
};
