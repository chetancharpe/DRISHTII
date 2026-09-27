import React, { useEffect, useState } from 'react';
import { candidateManagementService } from '../../services/candidateManagementService';
import { ExamCandidateRecord } from '../../types/examiner';
import { Card } from '../../components/common/Card';
import { Shield, Search } from 'lucide-react';

export const CandidatesPage: React.FC = () => {
  const [candidates, setCandidates] = useState<ExamCandidateRecord[]>([]);
  const [search, setSearch] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      const recs = await candidateManagementService.getCandidateRecords();
      setCandidates(recs);
    };
    load();
  }, []);


  const filtered = candidates.filter((c) => {
    const q = search.toLowerCase();
    return c.candidateName.toLowerCase().includes(q) || c.candidateId.toLowerCase().includes(q);
  });

  return (
    <div className="flex flex-col gap-6" role="main" aria-label="Global Candidate Administration">
      <div>
        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-primary">
          Platform User Roster
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Global Candidate Management</h1>
        <p className="text-sm text-foreground-muted mt-1">
          Review candidates enrolled across all institutional tenants and assistive accommodation profiles.
        </p>
      </div>

      <div className="p-4 rounded-xl border border-border bg-surface">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search candidate by name or ID..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-surface-elevated border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <Card title="Candidate Registry" subtitle={`${candidates.length} active records loaded`}>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left text-xs" aria-label="Platform candidate accounts">
            <thead className="bg-surface-elevated border-b border-border font-mono uppercase text-foreground-muted font-bold">
              <tr>
                <th scope="col" className="p-3">Candidate & ID</th>
                <th scope="col" className="p-3">Cohort</th>
                <th scope="col" className="p-3">Eligibility</th>
                <th scope="col" className="p-3">Assistive Accommodation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-surface-elevated/40">
                  <td className="p-3">
                    <span className="font-bold text-foreground block text-sm">{c.candidateName}</span>
                    <span className="font-mono text-primary">{c.candidateId}</span>
                  </td>
                  <td className="p-3 text-foreground-muted font-medium">{c.groupName}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-status-success/15 text-status-success">
                      {c.eligibilityStatus}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold bg-surface-elevated px-2 py-0.5 rounded border border-border text-foreground">
                      <Shield className="w-3 h-3 text-primary" aria-hidden="true" />
                      {c.accessibilityStatus.replace('_', ' ')}
                      {c.extraTimeGrantedMinutes > 0 && ` (+${c.extraTimeGrantedMinutes}m buffer)`}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
