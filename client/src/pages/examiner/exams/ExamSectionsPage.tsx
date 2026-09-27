import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ExaminerExam, ExamSectionConfig } from '../../../types/examiner';
import { examinerService } from '../../../services/examinerService';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  Clock,
  ArrowLeft,
} from 'lucide-react';


export const ExamSectionsPage: React.FC = () => {
  const { examId = 'exam-01' } = useParams<{ examId: string }>();
  const [exam, setExam] = useState<ExaminerExam | null>(null);
  const [sections, setSections] = useState<ExamSectionConfig[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  useEffect(() => {
    const loadExam = async () => {
      const data = await examinerService.getExamById(examId);
      if (data) {
        setExam(data);
        setSections(data.sections || []);
      }
    };
    loadExam();
  }, [examId]);

  const handleAddSection = () => {
    const newSec: ExamSectionConfig = {
      id: `sec-${Date.now()}`,
      title: 'New Section',
      code: `SEC-${sections.length + 1}`,
      description: 'Section description and instructions',
      questionCount: 10,
      durationMinutes: 20,
      navigationPolicy: 'free',
      questionIds: [],
    };
    setSections([...sections, newSec]);
  };

  const handleRemove = (id: string) => {
    setSections(sections.filter((s) => s.id !== id));
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const reordered = [...sections];
    const temp = reordered[index - 1];
    reordered[index - 1] = reordered[index];
    reordered[index] = temp;
    setSections(reordered);
  };

  const moveDown = (index: number) => {
    if (index === sections.length - 1) return;
    const reordered = [...sections];
    const temp = reordered[index + 1];
    reordered[index + 1] = reordered[index];
    reordered[index] = temp;
    setSections(reordered);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await examinerService.updateExam(examId, { sections });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  if (!exam) {
    return <div className="p-8 text-center text-foreground-muted">Loading examination structure...</div>;
  }

  return (
    <div className="flex flex-col gap-6" role="main" aria-label="Exam Section Configuration">
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
            Section Structure: {exam.title}
          </h1>
          <p className="text-sm text-foreground-muted mt-1">
            Define section divisions, navigation constraints, time allocations, and ordering.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={handleAddSection} className="flex items-center gap-2">
            <Plus className="w-4 h-4" aria-hidden="true" />
            Add Section
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
            {isSaving ? 'Saving...' : 'Save Structure'}
          </Button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-status-success/10 border border-status-success/30 text-xs text-status-success font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
          Section configuration successfully updated and saved.
        </div>
      )}

      {/* Sections List */}
      <div className="space-y-4">
        {sections.map((sec, idx) => (
          <Card
            key={sec.id}
            title={`Section ${idx + 1}: ${sec.title}`}
            subtitle={sec.description || 'Configurable assessment module'}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-foreground block">Section Title</label>
                  <input
                    type="text"
                    value={sec.title}
                    onChange={(e) => {
                      const updated = [...sections];
                      updated[idx].title = e.target.value;
                      setSections(updated);
                    }}
                    className="w-full px-3 py-1.5 rounded-lg border border-border bg-surface text-foreground text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground block">Allocated Time (mins)</label>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-foreground-muted absolute left-2.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
                    <input
                      type="number"
                      value={sec.durationMinutes}
                      onChange={(e) => {
                        const updated = [...sections];
                        updated[idx].durationMinutes = Number(e.target.value);
                        setSections(updated);
                      }}
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-border bg-surface text-foreground text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground block">Navigation Policy</label>
                  <select
                    value={sec.navigationPolicy}
                    onChange={(e) => {
                      const updated = [...sections];
                      updated[idx].navigationPolicy = e.target.value as any;
                      setSections(updated);
                    }}
                    className="w-full px-3 py-1.5 rounded-lg border border-border bg-surface text-foreground text-sm"
                  >
                    <option value="free">Free (Jump anywhere)</option>
                    <option value="section_locked">Section Locked</option>
                    <option value="forward_only">Forward Only (No back)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-foreground-muted">
                  <span>Questions in Section: <strong>{sec.questionIds?.length || 0}</strong></span>
                  <Link
                    to={`/examiner/exams/${exam.id}/questions`}
                    className="text-primary font-bold hover:underline"
                  >
                    Manage Assigned Questions →
                  </Link>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={idx === 0}
                    onClick={() => moveUp(idx)}
                    aria-label={`Move section ${sec.title} up`}
                  >
                    <ArrowUp className="w-4 h-4" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={idx === sections.length - 1}
                    onClick={() => moveDown(idx)}
                    aria-label={`Move section ${sec.title} down`}
                  >
                    <ArrowDown className="w-4 h-4" aria-hidden="true" />
                  </Button>
                  {sections.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(sec.id)}
                      className="text-status-error hover:bg-status-error/10"
                      aria-label={`Delete section ${sec.title}`}
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
