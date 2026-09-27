import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { QuestionBankItem } from '../../../types/examiner';
import { questionBankService } from '../../../services/questionBankService';
import { Button } from '../../../components/common/Button';
import { CandidatePreviewModal } from '../../../components/examiner/CandidatePreviewModal';
import {
  PlusCircle,
  Search,
  Filter,
  Eye,
  Edit3,
  CheckCircle2,
  History,

  Image as ImageIcon,
  Sigma,
  Table as TableIcon,
} from 'lucide-react';

export const QuestionBankPage: React.FC = () => {
  const [questions, setQuestions] = useState<QuestionBankItem[]>([]);
  const [search, setSearch] = useState<string>('');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Preview modal state
  const [previewQuestion, setPreviewQuestion] = useState<QuestionBankItem | null>(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const data = await questionBankService.getQuestions();
        setQuestions(data);
      } catch (err) {
        console.error('Failed to load question bank', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch =
      q.text.toLowerCase().includes(search.toLowerCase()) ||
      q.code.toLowerCase().includes(search.toLowerCase()) ||
      q.topic.toLowerCase().includes(search.toLowerCase());
    const matchesSubject = subjectFilter === 'all' || q.subject === subjectFilter;
    const matchesDiff = difficultyFilter === 'all' || q.difficulty === difficultyFilter;
    const matchesType = typeFilter === 'all' || q.type === typeFilter;
    return matchesSearch && matchesSubject && matchesDiff && matchesType;
  });

  return (
    <div className="flex flex-col gap-6" role="main" aria-label="Question Bank Repository">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-primary">
            Item Repository
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Question Bank & Items</h1>
          <p className="text-sm text-foreground-muted mt-1">
            Author, version, and pre-validate accessible examination items with audio speech transcripts and alt-text.
          </p>
        </div>

        <Link to="/examiner/question-bank/create">
          <Button variant="primary" className="flex items-center gap-2">
            <PlusCircle className="w-4 h-4" aria-hidden="true" />
            Create Question
          </Button>
        </Link>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-xl border border-border bg-surface flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by question text, code, or topic..."
            aria-label="Search question bank"
            className="w-full pl-9 pr-4 py-2 text-sm bg-surface-elevated border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-foreground-muted shrink-0" aria-hidden="true" />
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-surface-elevated border border-border rounded-lg text-foreground font-semibold"
            aria-label="Filter by subject"
          >
            <option value="all">All Subjects</option>
            <option value="Quantitative Aptitude">Quantitative Aptitude</option>
            <option value="Logical Reasoning & Data">Logical Reasoning</option>
            <option value="Verbal Ability">Verbal Ability</option>
            <option value="General Awareness">General Awareness</option>
            <option value="Computer Science & Accessibility">Computer Science</option>
          </select>

          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-surface-elevated border border-border rounded-lg text-foreground font-semibold"
            aria-label="Filter by difficulty"
          >
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-surface-elevated border border-border rounded-lg text-foreground font-semibold"
            aria-label="Filter by question type"
          >
            <option value="all">All Types</option>
            <option value="single_choice">Single Choice</option>
            <option value="multiple_choice">Multiple Choice</option>
            <option value="true_false">True / False</option>
            <option value="numerical">Numerical</option>
            <option value="short_answer">Short Answer</option>
          </select>
        </div>
      </div>

      {/* Questions Table */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" aria-label="Question Bank list">
            <thead className="bg-surface-elevated border-b border-border text-xs uppercase text-foreground-muted font-bold font-mono">
              <tr>
                <th scope="col" className="p-4">Code & Prompt</th>
                <th scope="col" className="p-4">Subject & Topic</th>
                <th scope="col" className="p-4">Type</th>
                <th scope="col" className="p-4 text-center">Difficulty</th>
                <th scope="col" className="p-4 text-center">Version</th>
                <th scope="col" className="p-4 text-center">Accessibility</th>
                <th scope="col" className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-foreground-muted">
                    Loading question bank...
                  </td>
                </tr>
              ) : filteredQuestions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-foreground-muted">
                    <p className="font-bold text-foreground">No questions have been created yet.</p>
                    <p className="text-xs mt-1">Use the "Create Question" button to author accessible test items.</p>
                  </td>
                </tr>
              ) : (
                filteredQuestions.map((q) => (
                  <tr key={q.id} className="hover:bg-surface-elevated/50 transition-colors">
                    <td className="p-4 max-w-md">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-primary">{q.code}</span>
                          {q.formulaLatex && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-surface-elevated text-[10px] text-foreground-muted font-mono" title="Contains Math Formula">
                              <Sigma className="w-3 h-3 text-primary" aria-hidden="true" />
                              Math
                            </span>
                          )}
                          {q.accessibility?.tableCaption && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-surface-elevated text-[10px] text-foreground-muted font-mono" title="Contains Table">
                              <TableIcon className="w-3 h-3 text-secondary" aria-hidden="true" />
                              Table
                            </span>
                          )}
                          {q.imageUrl && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-surface-elevated text-[10px] text-foreground-muted font-mono" title="Contains Image with Alt Text">
                              <ImageIcon className="w-3 h-3 text-status-warning" aria-hidden="true" />
                              Image
                            </span>
                          )}
                        </div>
                        <p className="font-semibold text-foreground line-clamp-2 text-sm">{q.text}</p>
                      </div>
                    </td>
                    <td className="p-4 text-xs">
                      <span className="font-bold text-foreground block">{q.subject}</span>
                      <span className="text-foreground-muted">{q.topic}</span>
                    </td>
                    <td className="p-4 text-xs font-mono capitalize">
                      {q.type.replace('_', ' ')}
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold capitalize ${
                          q.difficulty === 'easy'
                            ? 'bg-status-success/15 text-status-success'
                            : q.difficulty === 'medium'
                            ? 'bg-status-warning/15 text-status-warning'
                            : 'bg-status-error/15 text-status-error'
                        }`}
                      >
                        {q.difficulty}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-foreground-muted bg-surface-elevated px-2 py-0.5 rounded border border-border">
                        <History className="w-3 h-3" aria-hidden="true" />
                        v{q.version}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-status-success/15 text-status-success border border-status-success/30">
                        <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                        100% Gated
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPreviewQuestion(q)}
                          aria-label={`Preview as candidate: ${q.code}`}
                          title="Preview as Candidate"
                        >
                          <Eye className="w-4 h-4 text-foreground-muted hover:text-foreground" aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => alert(`Opening version increment editor for ${q.code}`)}
                          aria-label={`Edit ${q.code}`}
                          title="Edit Question"
                        >
                          <Edit3 className="w-4 h-4 text-foreground-muted hover:text-foreground" aria-hidden="true" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Candidate Preview Simulator Modal */}
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
