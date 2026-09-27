import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { AdminUserRecord } from '../../types/examiner';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Plus } from 'lucide-react';


export const ExaminersPage: React.FC = () => {
  const [examiners, setExaminers] = useState<AdminUserRecord[]>([]);

  useEffect(() => {
    const load = async () => {
      const data = await adminService.getUsers('examiner');
      setExaminers(data);
    };
    load();
  }, []);

  return (
    <div className="flex flex-col gap-6" role="main" aria-label="Examiner Faculty Management">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-primary">
            Faculty Directory
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Examiner Management</h1>
          <p className="text-sm text-foreground-muted mt-1">
            Approve accredited authoring faculty, assign institutional tenants, and review permissions.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => alert('Examiner accreditation provisioning dialog.')}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          Accredit New Examiner
        </Button>
      </div>

      <div className="space-y-4">
        {examiners.map((ex) => (
          <Card
            key={ex.id}
            title={ex.name}
            subtitle={`${ex.email} • Organization: ${ex.organizationName}`}
          >
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground">Status:</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-status-success/15 text-status-success">
                    {ex.status}
                  </span>
                </div>
                <span className="text-foreground-muted font-mono">Last login: {ex.lastLoginAt}</span>
              </div>

              <div>
                <span className="font-bold text-foreground block mb-1">Assigned Permissions:</span>
                <div className="flex flex-wrap gap-1.5">
                  {ex.assignedPermissions.map((p) => (
                    <span
                      key={p}
                      className="font-mono text-[10px] px-2 py-0.5 rounded bg-surface-elevated text-primary font-bold border border-border"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
