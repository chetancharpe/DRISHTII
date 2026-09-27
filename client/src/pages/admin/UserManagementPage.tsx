import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { AdminUserRecord, UserRoleType } from '../../types/examiner';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  UserCheck,
  UserX,
} from 'lucide-react';


export const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [search, setSearch] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<UserRoleType | 'all'>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await adminService.getUsers(roleFilter, search);
        setUsers(data);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, [roleFilter, search]);

  const handleToggleStatus = async (user: AdminUserRecord) => {
    const newStatus = user.status === 'active' ? 'deactivated' : 'active';
    if (window.confirm(`Are you sure you want to mark account ${user.name} as ${newStatus}?`)) {
      await adminService.updateUserStatus(user.id, newStatus);
      const updated = await adminService.getUsers(roleFilter, search);
      setUsers(updated);
    }
  };

  return (
    <div className="flex flex-col gap-6" role="main" aria-label="User and Role Governance">
      {/* Header */}
      <div>
        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-primary">
          Identity & Access Management
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">User Directory & Roles</h1>
        <p className="text-sm text-foreground-muted mt-1">
          Review accounts across organizations, provision permissions, and activate or deactivate system access.
        </p>
      </div>

      {/* Controls */}
      <div className="p-4 rounded-xl border border-border bg-surface flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name, email, or tenant..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-surface-elevated border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-foreground-muted shrink-0" aria-hidden="true" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="px-3 py-2 text-sm bg-surface-elevated border border-border rounded-lg text-foreground font-semibold"
            aria-label="Filter by role"
          >
            <option value="all">All Roles</option>
            <option value="candidate">Candidates</option>
            <option value="examiner">Examiners</option>
            <option value="admin">Administrators</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <Card title="Account Directory" subtitle="Secure credentials view: Passwords never stored or displayed on client">
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left text-xs" aria-label="User accounts directory">
            <thead className="bg-surface-elevated border-b border-border font-mono uppercase text-foreground-muted font-bold">
              <tr>
                <th scope="col" className="p-3">User & Email</th>
                <th scope="col" className="p-3">Role</th>
                <th scope="col" className="p-3">Organization</th>
                <th scope="col" className="p-3 text-center">Account Status</th>
                <th scope="col" className="p-3">Assigned Permissions</th>
                <th scope="col" className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-foreground-muted">
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-foreground-muted">
                    No users found matching search criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-surface-elevated/40">
                    <td className="p-3">
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground text-sm">{u.name}</span>
                        <span className="text-foreground-muted font-mono">{u.email}</span>
                      </div>
                    </td>
                    <td className="p-3 capitalize font-bold text-foreground">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          u.role === 'admin'
                            ? 'bg-status-error/15 text-status-error'
                            : u.role === 'examiner'
                            ? 'bg-primary/15 text-primary'
                            : 'bg-surface-elevated text-foreground'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3 text-foreground-muted font-medium">{u.organizationName}</td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          u.status === 'active'
                            ? 'bg-status-success/15 text-status-success'
                            : 'bg-status-error/15 text-status-error'
                        }`}
                      >
                        {u.status === 'active' ? (
                          <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
                        )}
                        {u.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {u.assignedPermissions.map((p) => (
                          <span
                            key={p}
                            className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-surface-elevated text-foreground-muted border border-border"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <Button
                        variant={u.status === 'active' ? 'ghost' : 'secondary'}
                        size="sm"
                        onClick={() => handleToggleStatus(u)}
                        className={u.status === 'active' ? 'text-status-error hover:bg-status-error/10' : ''}
                      >
                        {u.status === 'active' ? (
                          <span className="flex items-center gap-1">
                            <UserX className="w-3.5 h-3.5" aria-hidden="true" />
                            Deactivate
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <UserCheck className="w-3.5 h-3.5" aria-hidden="true" />
                            Activate
                          </span>
                        )}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
