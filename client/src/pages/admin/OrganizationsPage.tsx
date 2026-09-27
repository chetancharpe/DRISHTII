import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { Organization } from '../../types/examiner';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Building, Plus, Globe } from 'lucide-react';



export const OrganizationsPage: React.FC = () => {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newOrgName, setNewOrgName] = useState<string>('');
  const [newOrgDomain, setNewOrgDomain] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      const data = await adminService.getOrganizations();
      setOrgs(data);
    };
    load();
  }, []);

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;

    await adminService.createOrganization({
      name: newOrgName,
      domain: newOrgDomain || 'org.gov.in',
    });
    const updated = await adminService.getOrganizations();
    setOrgs(updated);
    setNewOrgName('');
    setNewOrgDomain('');
    setShowAddModal(false);
  };

  return (
    <div className="flex flex-col gap-6" role="main" aria-label="Tenant Organization Governance">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-primary">
            Multi-Tenant Administration
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Organizations & Institutional Tenants
          </h1>
          <p className="text-sm text-foreground-muted mt-1">
            Manage university departments, testing authorities, and accredited examination boards.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          Add Organization
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {orgs.map((org) => (
          <Card key={org.id} title={org.name} subtitle={`Code: ${org.code}`}>
            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-2 text-foreground-muted">
                <Globe className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                <span className="font-mono">{org.domain}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
                <div className="p-2.5 rounded-lg bg-surface-elevated">
                  <span className="text-foreground-muted block">Enrolled Candidates</span>
                  <span className="text-base font-bold text-foreground">{org.candidateCount.toLocaleString()}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-surface-elevated">
                  <span className="text-foreground-muted block">Accredited Examiners</span>
                  <span className="text-base font-bold text-primary">{org.examinerCount}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-status-success/15 text-status-success">
                  {org.status.toUpperCase()}
                </span>
                <span className="text-[10px] text-foreground-muted">Created: {org.createdAt}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4 text-xs">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Building className="w-5 h-5 text-primary" aria-hidden="true" />
              Add Institutional Tenant Organization
            </h2>

            <form onSubmit={handleCreateOrg} className="space-y-3">
              <div className="space-y-1">
                <label className="font-bold text-foreground block">Organization Name</label>
                <input
                  type="text"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="e.g., Union Public Service Board"
                  className="w-full px-3 py-1.5 rounded-lg border border-border bg-surface text-foreground text-sm"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground block">Verified Web Domain</label>
                <input
                  type="text"
                  value={newOrgDomain}
                  onChange={(e) => setNewOrgDomain(e.target.value)}
                  placeholder="e.g., upsb.gov.in"
                  className="w-full px-3 py-1.5 rounded-lg border border-border bg-surface text-foreground text-sm font-mono"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <Button variant="secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Create Tenant
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
