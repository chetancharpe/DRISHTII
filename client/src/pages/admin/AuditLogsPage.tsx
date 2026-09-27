import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { AuditLogItem } from '../../types/examiner';
import { Card } from '../../components/common/Card';
import { Filter, Search } from 'lucide-react';


export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  useEffect(() => {
    const fetchLogs = async () => {
      const data = await adminService.getAuditLogs(actionFilter);
      setLogs(data);
    };
    fetchLogs();
  }, [actionFilter]);

  const filteredLogs = logs.filter((l) => {
    const q = search.toLowerCase();
    return (
      l.details.toLowerCase().includes(q) ||
      l.operatorName.toLowerCase().includes(q) ||
      l.entityId.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col gap-6" role="main" aria-label="System Audit and Governance Log">
      {/* Header */}
      <div>
        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-primary">
          Compliance & Traceability
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Platform Security Audit Trail
        </h1>
        <p className="text-sm text-foreground-muted mt-1">
          Immutable event log for examination lifecycle changes, question modifications, and result evaluations.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl border border-border bg-surface flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search audit events by operator, entity, or details..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-surface-elevated border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-foreground-muted shrink-0" aria-hidden="true" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-surface-elevated border border-border rounded-lg text-foreground font-semibold"
            aria-label="Filter audit action"
          >
            <option value="all">All Actions</option>
            <option value="EXAM_PUBLISHED">EXAM_PUBLISHED</option>
            <option value="QUESTION_VERSIONED">QUESTION_VERSIONED</option>
            <option value="RESULT_EVALUATED">RESULT_EVALUATED</option>
            <option value="RESULT_CORRECTED">RESULT_CORRECTED</option>
            <option value="ROLE_UPDATED">ROLE_UPDATED</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <Card title="Event Records" subtitle="Section 44 & 74 Institutional Audit Standard">
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left text-xs" aria-label="System audit log records">
            <thead className="bg-surface-elevated border-b border-border font-mono uppercase text-foreground-muted font-bold">
              <tr>
                <th scope="col" className="p-3">Timestamp (IST)</th>
                <th scope="col" className="p-3">Action</th>
                <th scope="col" className="p-3">Operator</th>
                <th scope="col" className="p-3">Target Entity</th>
                <th scope="col" className="p-3">Event Details</th>
                <th scope="col" className="p-3 text-right">Masked IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-mono">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-surface-elevated/40">
                  <td className="p-3 text-foreground-muted whitespace-nowrap">{log.timestamp}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/15 text-primary border border-primary/20">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="font-bold text-foreground block font-sans">{log.operatorName}</span>
                    <span className="text-[10px] text-foreground-muted uppercase">{log.operatorRole}</span>
                  </td>
                  <td className="p-3 text-primary font-bold">{log.entityId}</td>
                  <td className="p-3 font-sans text-foreground max-w-md">{log.details}</td>
                  <td className="p-3 text-right text-foreground-muted">{log.ipAddressMasked}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
