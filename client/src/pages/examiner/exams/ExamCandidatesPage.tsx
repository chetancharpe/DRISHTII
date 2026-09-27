import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ExaminerExam, CandidateGroup, ExamCandidateRecord } from '../../../types/examiner';
import { examinerService } from '../../../services/examinerService';
import { candidateManagementService } from '../../../services/candidateManagementService';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import {
  Plus,
  UploadCloud,
  ArrowLeft,
  FileSpreadsheet,
  Shield,
  Search,
} from 'lucide-react';


export const ExamCandidatesPage: React.FC = () => {
  const { examId = 'exam-01' } = useParams<{ examId: string }>();
  const [exam, setExam] = useState<ExaminerExam | null>(null);
  const [candidateGroups, setCandidateGroups] = useState<CandidateGroup[]>([]);
  const [records, setRecords] = useState<ExamCandidateRecord[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [showCsvModal, setShowCsvModal] = useState<boolean>(false);
  const [csvContent, setCsvContent] = useState<string>(
    'Rohan Deshmukh, rohan.d@example.edu, GW-2026-10520\nFatima Zahra, fatima.z@example.edu, GW-2026-10521'
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

  const handleImportCsv = async () => {
    const targetGroup = candidateGroups[0]?.id || 'grp-01';
    await candidateManagementService.bulkImportSimulated(targetGroup, csvContent);
    const updated = await candidateManagementService.getCandidateRecords();
    setRecords(updated);
    setShowCsvModal(false);
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
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold bg-surface-elevated px-2 py-0.5 rounded border border-border text-foreground">
                        <Shield className="w-3 h-3 text-primary" aria-hidden="true" />
                        {rec.accessibilityStatus.replace('_', ' ')}
                        {rec.extraTimeGrantedMinutes > 0 && ` (+${rec.extraTimeGrantedMinutes}m)`}
                      </span>
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
          <div className="bg-surface border border-border rounded-2xl max-w-lg w-full p-6 shadow-2xl flex flex-col gap-4">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-primary" aria-hidden="true" />
              Simulated Bulk CSV Candidate Upload
            </h2>
            <p className="text-xs text-foreground-muted">
              Paste comma-separated rows: <code>Candidate Name, Email, Roll Number</code>
            </p>
            <textarea
              rows={5}
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              className="w-full p-3 font-mono text-xs border border-border rounded-lg bg-surface-elevated text-foreground"
            />
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <Button variant="secondary" onClick={() => setShowCsvModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleImportCsv}>
                Import Candidates
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
