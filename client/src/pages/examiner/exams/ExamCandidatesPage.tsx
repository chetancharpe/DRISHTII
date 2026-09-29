import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ExaminerExam, CandidateGroup, ExamCandidateRecord } from '../../../types/examiner';
import { examinerService } from '../../../services/examinerService';
import {
  candidateManagementService,
  RosterCsvImportResponse,
} from '../../../services/candidateManagementService';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import {
  Plus,
  UploadCloud,
  ArrowLeft,
  FileSpreadsheet,
  Shield,
  Search,
  Download,
  CheckCircle2,
  AlertCircle,
  UserCheck,
} from 'lucide-react';

export const ExamCandidatesPage: React.FC = () => {
  const { examId = 'exam-01' } = useParams<{ examId: string }>();
  const [exam, setExam] = useState<ExaminerExam | null>(null);
  const [candidateGroups, setCandidateGroups] = useState<CandidateGroup[]>([]);
  const [records, setRecords] = useState<ExamCandidateRecord[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [showCsvModal, setShowCsvModal] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importResult, setImportResult] = useState<RosterCsvImportResponse | null>(null);
  const [targetCohort, setTargetCohort] = useState<string>('Main Cohort');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvContent, setCsvContent] = useState<string>(
    'Name,Email,CandidateID,Accommodations,TimeMultiplier\n' +
    'Aarav Sharma,aarav.sharma@example.edu,CAND-2026-101,screen_reader;audio_assistance,1.5\n' +
    'Priya Patel,priya.patel@example.edu,CAND-2026-102,high_contrast;keyboard_navigation,1.0\n' +
    'Rohan Deshmukh,rohan.d@example.edu,CAND-2026-103,standard,1.0\n' +
    'Fatima Zahra,fatima.z@example.edu,CAND-2026-104,large_text;extra_time_15,1.5'
  );

  useEffect(() => {
    const load = async () => {
      const [examData, groups, recs] = await Promise.all([
        examinerService.getExamById(examId),
        candidateManagementService.getCandidateGroups(),
        candidateManagementService.getCandidateRecords(),
      ]);
      if (examData) setExam(examData);
      setCandidateGroups(groups);
      setRecords(recs);
    };
    load();
  }, [examId]);

  if (!exam) {
    return <div className="p-8 text-center text-foreground-muted">Loading candidate roster...</div>;
  }

  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.candidateName.toLowerCase().includes(search.toLowerCase()) ||
      r.candidateId.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase());
    const matchesGroup = selectedGroup === 'all' || r.groupId === selectedGroup;
    return matchesSearch && matchesGroup;
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setCsvContent(content);
      }
    };
    reader.readAsText(file);
  };

  const handleDownloadTemplate = () => {
    candidateManagementService.downloadSampleCsvTemplate();
  };

  const handleImportCsv = async () => {
    if (!csvContent.trim()) return;
    setIsImporting(true);
    setImportResult(null);
    try {
      const result = await candidateManagementService.importCandidateRosterCsv(
        examId,
        csvContent,
        targetCohort
      );
      setImportResult(result);
      const updated = await candidateManagementService.getCandidateRecords();
      setRecords(updated);
    } catch (err: unknown) {
      console.error('Failed to import CSV:', err);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6" role="main" aria-label="Exam Candidate Roster and Cohorts">
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
            Candidate Cohorts: {exam.title}
          </h1>
          <p className="text-sm text-foreground-muted mt-1">
            Assign institutional cohorts, review PwD accommodation statuses, and simulate batch imports.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={() => setShowCsvModal(true)}
            className="flex items-center gap-2"
          >
            <UploadCloud className="w-4 h-4" aria-hidden="true" />
            Bulk CSV Import
          </Button>
          <Button
            variant="primary"
            onClick={() => alert('Individual candidate registration modal.')}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            Add Candidate
          </Button>
        </div>
      </div>

      {/* Cohorts Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {candidateGroups.map((grp) => (
          <div
            key={grp.id}
            className="p-4 rounded-xl border border-border bg-surface flex flex-col justify-between"
          >
            <div>
              <span className="text-[10px] font-mono font-bold uppercase text-primary block">
                {grp.code}
              </span>
              <h3 className="font-bold text-foreground text-sm line-clamp-1">{grp.name}</h3>
              <p className="text-xs text-foreground-muted mt-1 line-clamp-2">{grp.description}</p>
            </div>
            <div className="pt-3 border-t border-border mt-3 flex items-center justify-between text-xs">
              <span className="font-bold text-foreground">{grp.candidateCount} Candidates</span>
              <span className="text-status-success font-semibold">Active</span>
            </div>
          </div>
        ))}
      </div>

      {/* Candidates List with Filters */}
      <Card title="Assigned Candidates Roster" subtitle="Privacy-preserving view of eligible candidates">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search candidate name or ID..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface-elevated border border-border rounded-lg text-foreground"
              />
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="group-select" className="text-xs text-foreground-muted font-bold">
                Cohort:
              </label>
              <select
                id="group-select"
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="px-3 py-1.5 text-xs bg-surface-elevated border border-border rounded-lg text-foreground font-semibold"
              >
                <option value="all">All Cohorts ({records.length})</option>
                {candidateGroups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-xs" aria-label="Assigned candidate records">
              <thead className="bg-surface-elevated border-b border-border font-mono uppercase text-foreground-muted font-bold">
                <tr>
                  <th scope="col" className="p-3">Candidate & ID</th>
                  <th scope="col" className="p-3">Assigned Cohort</th>
                  <th scope="col" className="p-3">Eligibility</th>
                  <th scope="col" className="p-3">Session Status</th>
                  <th scope="col" className="p-3">Accessibility Provision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-surface-elevated/40">
                    <td className="p-3">
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground text-sm">{rec.candidateName}</span>
                        <span className="font-mono text-primary">{rec.candidateId}</span>
                      </div>
                    </td>
                    <td className="p-3 font-semibold text-foreground">{rec.groupName}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-status-success/15 text-status-success">
                        Eligible
                      </span>
                    </td>
                    <td className="p-3 capitalize font-semibold text-foreground">
                      {rec.examStatus.replace('_', ' ')}
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col gap-1 items-start">
                        <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold bg-surface-elevated px-2 py-0.5 rounded border border-border text-foreground">
                          <Shield className="w-3 h-3 text-primary" aria-hidden="true" />
                          {rec.accessibilityStatus.replace('_', ' ')}
                          {rec.extraTimeGrantedMinutes > 0 && ` (+${rec.extraTimeGrantedMinutes}m)`}
                        </span>
                        {(rec.accessibilityStatus.toLowerCase().includes('screen_reader') || rec.accessibilityStatus.toLowerCase().includes('audio')) && (
                          <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-secondary/15 text-secondary border border-secondary/30">
                            PwD 1.5x Time (Compensatory)
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* CSV Import Modal */}
      {showCsvModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl max-w-2xl w-full p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <FileSpreadsheet className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">
                    Candidate Roster CSV Bulk Import & Provisioning
                  </h2>
                  <p className="text-xs text-foreground-muted">
                    Auto-provisions candidate accounts, assigns individual accommodations, and enrolls into roster.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowCsvModal(false);
                  setImportResult(null);
                }}
                className="text-foreground-muted hover:text-foreground text-sm font-bold"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            {/* Quick Actions & Format Hints */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-surface-elevated border border-border">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-1.5 text-xs"
                >
                  <Download className="w-3.5 h-3.5" aria-hidden="true" />
                  Download CSV Template
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 text-xs"
                >
                  <UploadCloud className="w-3.5 h-3.5" aria-hidden="true" />
                  Browse .CSV File
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <label htmlFor="modal-cohort" className="text-xs font-semibold text-foreground-muted">
                  Assign To Cohort:
                </label>
                <input
                  id="modal-cohort"
                  type="text"
                  value={targetCohort}
                  onChange={(e) => setTargetCohort(e.target.value)}
                  className="px-2.5 py-1 text-xs bg-surface border border-border rounded-lg text-foreground font-semibold"
                  placeholder="e.g. Main Cohort"
                />
              </div>
            </div>

            {/* Format Instructions */}
            <div className="text-[11px] text-foreground-muted bg-surface/50 p-2.5 rounded-lg border border-border/60">
              <span className="font-bold text-foreground">Header Schema: </span>
              <code>Name, Email, CandidateID, Accommodations, TimeMultiplier (optional)</code>
              <br />
              <span className="font-medium">Supported Accommodations (semicolon-separated): </span>
              <code className="text-primary">screen_reader</code>, <code className="text-primary">high_contrast</code>, <code className="text-primary">large_text</code>, <code className="text-primary">keyboard_navigation</code>, <code className="text-primary">audio_assistance</code>, <code className="text-primary">extra_time_30</code>.
              <br />
              <span className="font-medium">Compensatory Multipliers: </span>
              <code className="text-secondary font-bold">1.0</code> (Standard), <code className="text-secondary font-bold">1.5</code> (PwD 50% Extra Time), <code className="text-secondary font-bold">2.0</code> (Double Time).
            </div>

            {/* CSV Content Input */}
            <div>
              <label htmlFor="csv-textarea" className="text-xs font-bold text-foreground block mb-1">
                CSV Payload Editor:
              </label>
              <textarea
                id="csv-textarea"
                rows={6}
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                placeholder="Name,Email,CandidateID,Accommodations..."
                className="w-full p-3 font-mono text-xs border border-border rounded-lg bg-surface-elevated text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>

            {/* Import Summary Results */}
            {importResult && (
              <div className="p-4 rounded-xl border border-border bg-surface-elevated space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-status-success font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                    <span>Import Processing Completed</span>
                  </div>
                  <span className="text-xs font-mono text-foreground-muted">
                    Total Rows: {importResult.total_rows}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 rounded-lg bg-status-success/10 border border-status-success/20 text-center">
                    <span className="block text-xs text-foreground-muted">Successfully Enrolled</span>
                    <span className="text-lg font-bold text-status-success">{importResult.success_count}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20 text-center">
                    <span className="block text-xs text-foreground-muted">Accounts Provisioned</span>
                    <span className="text-lg font-bold text-primary">{importResult.new_users_provisioned}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-status-error/10 border border-status-error/20 text-center">
                    <span className="block text-xs text-foreground-muted">Row Errors</span>
                    <span className="text-lg font-bold text-status-error">{importResult.error_count}</span>
                  </div>
                </div>

                {importResult.results.length > 0 && (
                  <div className="max-h-36 overflow-y-auto rounded-lg border border-border bg-surface divide-y divide-border text-xs">
                    {importResult.results.map((item, idx) => (
                      <div key={idx} className="p-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {item.status === 'ERROR' ? (
                            <AlertCircle className="w-4 h-4 text-status-error shrink-0" aria-hidden="true" />
                          ) : (
                            <UserCheck className="w-4 h-4 text-status-success shrink-0" aria-hidden="true" />
                          )}
                          <span className="font-semibold text-foreground">{item.name || item.email}</span>
                          <span className="font-mono text-foreground-muted text-[11px]">({item.candidate_id})</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {item.accommodations_applied.map((a, aIdx) => (
                            <span
                              key={aIdx}
                              className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono text-[10px] font-bold"
                            >
                              {a}
                            </span>
                          ))}
                          <span
                            className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase ${
                              item.status === 'ERROR'
                                ? 'bg-status-error/15 text-status-error'
                                : 'bg-status-success/15 text-status-success'
                            }`}
                          >
                            {item.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowCsvModal(false);
                  setImportResult(null);
                }}
              >
                {importResult ? 'Close' : 'Cancel'}
              </Button>
              <Button
                variant="primary"
                onClick={handleImportCsv}
                disabled={isImporting || !csvContent.trim()}
                className="flex items-center gap-2"
              >
                {isImporting ? (
                  <>
                    <span className="animate-spin mr-1">⏳</span>
                    Provisioning Accounts...
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" aria-hidden="true" />
                    Process Bulk Import
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
