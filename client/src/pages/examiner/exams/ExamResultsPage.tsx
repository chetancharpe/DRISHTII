import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ExaminerExam, ExamCandidateResult, SubjectiveEvaluationItem } from '../../../types/examiner';
import { examinerService } from '../../../services/examinerService';
import { resultService } from '../../../services/resultService';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import {
  CheckCircle2,
  Clock,
  ArrowLeft,
  Edit2,
  ShieldAlert,
  Send,
} from 'lucide-react';


export const ExamResultsPage: React.FC = () => {
  const { examId = 'exam-01' } = useParams<{ examId: string }>();
  const [exam, setExam] = useState<ExaminerExam | null>(null);
  const [results, setResults] = useState<ExamCandidateResult[]>([]);
  const [evalQueue, setEvalQueue] = useState<SubjectiveEvaluationItem[]>([]);
  const [activeTab, setActiveTab] = useState<'roster' | 'queue'>('roster');

  // Manual evaluation grading state
  const [selectedSubj, setSelectedSubj] = useState<SubjectiveEvaluationItem | null>(null);
  const [awardedMarks, setAwardedMarks] = useState<number>(4.0);
  const [feedback, setFeedback] = useState<string>('Accurate explanation and distinction.');

  // Score correction modal
  const [correctingResult, setCorrectingResult] = useState<ExamCandidateResult | null>(null);
  const [newScoreVal, setNewScoreVal] = useState<number>(80);
  const [correctionReason, setCorrectionReason] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      const [examData, resData, qData] = await Promise.all([
        examinerService.getExamById(examId),
        resultService.getExamResults(examId),
        resultService.getSubjectiveQueue(),
      ]);
      if (examData) setExam(examData);
      setResults(resData);
      setEvalQueue(qData);
    };
    load();
  }, [examId]);

  if (!exam) {
    return <div className="p-8 text-center text-foreground-muted">Loading results and evaluation queue...</div>;
  }

  const pendingCount = evalQueue.filter((q) => q.status === 'pending').length;

  const handleSaveEvaluation = async () => {
    if (!selectedSubj) return;
    await resultService.evaluateSubjectiveItem(
      selectedSubj.id,
      awardedMarks,
      feedback,
      'Chief Examiner'
    );
    const updated = await resultService.getSubjectiveQueue();
    setEvalQueue(updated);
    setSelectedSubj(null);
  };

  const handlePublishResults = async () => {
    if (pendingCount > 0) {
      alert(`Cannot publish results: ${pendingCount} subjective submissions remain unevaluated.`);
      return;
    }
    if (window.confirm('Publish official results? Once published, candidate scores become visible on candidate dashboards.')) {
      await resultService.publishResults(examId);
      const updated = await resultService.getExamResults(examId);
      setResults(updated);
      alert('Examination results officially published.');
    }
  };

  const handleApplyCorrection = async () => {
    if (!correctingResult || !correctionReason.trim()) return;
    await resultService.correctCandidateResult(
      correctingResult.id,
      newScoreVal,
      correctionReason,
      'Examiner Lead'
    );
    const updated = await resultService.getExamResults(examId);
    setResults(updated);
    setCorrectingResult(null);
    setCorrectionReason('');
  };

  return (
    <div className="flex flex-col gap-6" role="main" aria-label="Examination Results and Evaluation Studio">
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
            Results & Evaluations: {exam.title}
          </h1>
          <p className="text-sm text-foreground-muted mt-1">
            Review objective candidate attempts, grade subjective items against rubrics, and publish official marks.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handlePublishResults}
          disabled={pendingCount > 0}
          className="flex items-center gap-2"
        >
          <Send className="w-4 h-4" aria-hidden="true" />
          Publish Results
        </Button>
      </div>

      {/* Evaluation Status Banner */}
      {pendingCount > 0 ? (
        <div className="p-4 rounded-xl bg-status-warning/15 border border-status-warning/30 flex items-center justify-between text-xs text-status-warning">
          <div className="flex items-center gap-2 font-bold">
            <Clock className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>
              Action Required: {pendingCount} subjective submission{pendingCount > 1 ? 's' : ''} awaiting manual evaluation.
            </span>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setActiveTab('queue')}>
            Open Evaluation Queue
          </Button>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-status-success/15 border border-status-success/30 flex items-center gap-2 text-xs text-status-success font-bold">
          <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>All submissions fully evaluated. Results are ready for release.</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-2" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'roster'}
          onClick={() => setActiveTab('roster')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'roster'
              ? 'bg-primary text-primary-contrast'
              : 'bg-surface border border-border text-foreground hover:bg-surface-elevated'
          }`}
        >
          Candidate Results Roster ({results.length})
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'queue'}
          onClick={() => setActiveTab('queue')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'queue'
              ? 'bg-primary text-primary-contrast'
              : 'bg-surface border border-border text-foreground hover:bg-surface-elevated'
          }`}
        >
          <span>Manual Subjective Queue</span>
          {pendingCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-status-warning text-black font-mono text-[10px]">
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: Results Roster */}
      {activeTab === 'roster' && (
        <Card title="Candidate Scores" subtitle="Automated and subjective aggregated totals">
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-xs" aria-label="Candidate scores table">
              <thead className="bg-surface-elevated border-b border-border font-mono uppercase text-foreground-muted font-bold">
                <tr>
                  <th scope="col" className="p-3">Candidate & Roll</th>
                  <th scope="col" className="p-3 text-center">Score / 100</th>
                  <th scope="col" className="p-3 text-center">Percentage</th>
                  <th scope="col" className="p-3 text-center">Correct</th>
                  <th scope="col" className="p-3 text-center">Incorrect</th>
                  <th scope="col" className="p-3 text-center">Unanswered</th>
                  <th scope="col" className="p-3">Evaluation Status</th>
                  <th scope="col" className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {results.map((res) => (
                  <tr key={res.id} className="hover:bg-surface-elevated/40">
                    <td className="p-3">
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground text-sm">{res.candidateName}</span>
                        <span className="font-mono text-primary">{res.candidateCode}</span>
                        {res.isCorrected && (
                          <span className="text-[10px] text-status-warning font-semibold">
                            Score Re-evaluated & Audited
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-center font-bold text-foreground text-sm">
                      {res.score.toFixed(1)}
                    </td>
                    <td className="p-3 text-center font-bold text-foreground">
                      {res.percentage.toFixed(1)}%
                    </td>
                    <td className="p-3 text-center text-status-success font-semibold">
                      {res.correctAnswersCount}
                    </td>
                    <td className="p-3 text-center text-status-error font-semibold">
                      {res.incorrectAnswersCount}
                    </td>
                    <td className="p-3 text-center text-foreground-muted">
                      {res.unansweredCount}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          res.evaluationStatus === 'published'
                            ? 'bg-status-success/15 text-status-success'
                            : res.evaluationStatus === 'pending_subjective'
                            ? 'bg-status-warning/15 text-status-warning'
                            : 'bg-primary/15 text-primary'
                        }`}
                      >
                        {res.evaluationStatus.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setCorrectingResult(res);
                          setNewScoreVal(res.score);
                        }}
                        title="Re-evaluate / Correct Mark"
                        className="text-foreground-muted hover:text-foreground"
                      >
                        <Edit2 className="w-3.5 h-3.5" aria-hidden="true" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 2: Manual Subjective Queue */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          <Card title="Subjective Response Evaluation Queue" subtitle="Grade responses using established scoring rubrics">
            <div className="space-y-3">
              {evalQueue.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-border bg-surface-elevated/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                >
                  <div className="space-y-1 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground text-sm">{item.candidateName}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          item.status === 'evaluated'
                            ? 'bg-status-success/15 text-status-success'
                            : 'bg-status-warning/15 text-status-warning'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <p className="font-semibold text-foreground">{item.questionText}</p>
                    <p className="text-foreground-muted line-clamp-2 italic">
                      "{item.candidateAnswerText}"
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {item.awardedMarks !== null && (
                      <span className="font-bold text-foreground font-mono">
                        Awarded: {item.awardedMarks} / {item.maxMarks}
                      </span>
                    )}
                    <Button
                      variant={item.status === 'pending' ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => {
                        setSelectedSubj(item);
                        setAwardedMarks(item.awardedMarks ?? 3.5);
                        setFeedback(item.examinerComments || '');
                      }}
                    >
                      {item.status === 'pending' ? 'Evaluate' : 'Review Marks'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Evaluation Grading Modal */}
      {selectedSubj && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl max-w-xl w-full p-6 shadow-2xl flex flex-col gap-4 text-xs">
            <h2 className="text-base font-bold text-foreground">
              Grade Subjective Answer: {selectedSubj.candidateName}
            </h2>

            <div className="p-3 rounded-lg bg-surface-elevated border border-border space-y-1">
              <span className="font-bold text-foreground block">Question:</span>
              <p className="text-foreground-muted">{selectedSubj.questionText}</p>
            </div>

            <div className="p-3 rounded-lg bg-surface-elevated border border-border space-y-1">
              <span className="font-bold text-foreground block">Candidate Answer:</span>
              <p className="text-foreground leading-relaxed font-mono">{selectedSubj.candidateAnswerText}</p>
            </div>

            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 space-y-1">
              <span className="font-bold text-primary block">Official Rubric:</span>
              <p className="text-foreground-muted">{selectedSubj.rubricExpectedAnswer}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="space-y-1">
                <label className="font-bold text-foreground block">
                  Marks Awarded (Max {selectedSubj.maxMarks})
                </label>
                <input
                  type="number"
                  step="0.5"
                  max={selectedSubj.maxMarks}
                  min={0}
                  value={awardedMarks}
                  onChange={(e) => setAwardedMarks(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg border border-border bg-surface text-foreground font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground block">Examiner Feedback</label>
                <input
                  type="text"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Rationale for awarded score..."
                  className="w-full px-3 py-1.5 rounded-lg border border-border bg-surface text-foreground"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border">
              <Button variant="secondary" onClick={() => setSelectedSubj(null)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSaveEvaluation}>
                Confirm Evaluation
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Result Correction Modal (Section 50) */}
      {correctingResult && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4 text-xs">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-status-warning" aria-hidden="true" />
              Audited Score Correction
            </h2>
            <p className="text-foreground-muted">
              Section 50: Official score corrections cannot silently overwrite history. An immutable audit record will be logged.
            </p>

            <div className="space-y-1">
              <label className="font-bold text-foreground block">
                New Total Marks (Current: {correctingResult.score})
              </label>
              <input
                type="number"
                step="0.5"
                value={newScoreVal}
                onChange={(e) => setNewScoreVal(Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-lg border border-border bg-surface text-foreground font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-foreground block">
                Official Justification & Consensus Reason <span className="text-status-error">*</span>
              </label>
              <textarea
                rows={3}
                value={correctionReason}
                onChange={(e) => setCorrectionReason(e.target.value)}
                placeholder="e.g., Question 14 key re-evaluated following institutional grievance review..."
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border">
              <Button variant="secondary" onClick={() => setCorrectingResult(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleApplyCorrection}
                disabled={!correctionReason.trim()}
              >
                Log & Apply Correction
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
