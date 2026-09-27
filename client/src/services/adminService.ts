/**
 * Admin Service Layer
 * Platform governance, organization tenant management, user RBAC assignments,
 * security audit logging, and global platform configuration.
 */

import {
  AdminUserRecord,
  Organization,
  AuditLogItem,
  UserRoleType,
  Permission,
} from '../types/examiner';
import { INITIAL_AUDIT_LOGS } from '../data/auditData';
import { storage } from '../utils/storage';

const ADMIN_USERS_STORAGE_KEY = 'gowow_admin_users';
const ADMIN_ORGS_STORAGE_KEY = 'gowow_admin_orgs';
const ADMIN_AUDIT_STORAGE_KEY = 'gowow_admin_audit_logs';

const INITIAL_ORGANIZATIONS: Organization[] = [
  {
    id: 'org-01',
    name: 'National Assessment Council (NAC)',
    code: 'NAC-GOV-IN',
    domain: 'nac.gov.in',
    status: 'active',
    candidateCount: 14200,
    examinerCount: 48,
    createdAt: '2026-01-15',
  },
  {
    id: 'org-02',
    name: 'Digital Accessibility Institute (DAI)',
    code: 'DAI-EDU',
    domain: 'accessibility.edu',
    status: 'active',
    candidateCount: 4200,
    examinerCount: 16,
    createdAt: '2026-03-20',
  },
  {
    id: 'org-03',
    name: 'Apex Civil Testing Services',
    code: 'ACTS-TEST',
    domain: 'apexcivil.org',
    status: 'active',
    candidateCount: 8900,
    examinerCount: 32,
    createdAt: '2026-05-10',
  },
];

const INITIAL_USERS: AdminUserRecord[] = [
  {
    id: 'usr-001',
    name: 'Dr. Aris Thorne',
    email: 'aris.thorne@nac.gov.in',
    role: 'examiner',
    organizationId: 'org-01',
    organizationName: 'National Assessment Council (NAC)',
    status: 'active',
    assignedPermissions: [
      'exam.view',
      'exam.create',
      'exam.edit',
      'exam.publish',
      'exam.monitor',
      'exam.evaluate',
      'exam.result.publish',
      'question.create',
      'question.edit',
      'question.publish',
      'analytics.view',
    ],
    lastLoginAt: '2026-09-27 09:12 IST',
    createdAt: '2026-02-01',
  },
  {
    id: 'usr-002',
    name: 'Elena Rostova',
    email: 'elena.r@accessibility.edu',
    role: 'examiner',
    organizationId: 'org-02',
    organizationName: 'Digital Accessibility Institute (DAI)',
    status: 'active',
    assignedPermissions: [
      'exam.view',
      'exam.create',
      'exam.edit',
      'exam.monitor',
      'exam.evaluate',
      'question.create',
      'question.edit',
      'question.publish',
      'analytics.view',
    ],
    lastLoginAt: '2026-09-26 16:45 IST',
    createdAt: '2026-03-25',
  },
  {
    id: 'usr-003',
    name: 'Chetan Charpe (Administrator)',
    email: 'admin@gowow.demo',
    role: 'admin',
    organizationId: 'org-01',
    organizationName: 'GoWow Central Administration',
    status: 'active',
    assignedPermissions: [
      'admin.manageUsers',
      'admin.manageRoles',
      'admin.manageOrgs',
      'admin.audit',
      'exam.view',
      'exam.monitor',
      'analytics.view',
    ],
    lastLoginAt: '2026-09-27 09:40 IST',
    createdAt: '2026-01-01',
  },
  {
    id: 'usr-004',
    name: 'Aarav Sharma',
    email: 'candidate@gowow.demo',
    role: 'candidate',
    organizationId: 'org-01',
    organizationName: 'National Assessment Council (NAC)',
    status: 'active',
    assignedPermissions: ['exam.view'],
    lastLoginAt: '2026-09-27 09:15 IST',
    createdAt: '2026-08-01',
  },
];

class AdminService {
  private getUsersList(): AdminUserRecord[] {
    return storage.get<AdminUserRecord[]>(ADMIN_USERS_STORAGE_KEY, INITIAL_USERS);
  }

  private saveUsersList(users: AdminUserRecord[]): void {
    storage.set(ADMIN_USERS_STORAGE_KEY, users);
  }

  private getOrgsList(): Organization[] {
    return storage.get<Organization[]>(ADMIN_ORGS_STORAGE_KEY, INITIAL_ORGANIZATIONS);
  }

  private saveOrgsList(orgs: Organization[]): void {
    storage.set(ADMIN_ORGS_STORAGE_KEY, orgs);
  }

  private getAuditList(): AuditLogItem[] {
    return storage.get<AuditLogItem[]>(ADMIN_AUDIT_STORAGE_KEY, INITIAL_AUDIT_LOGS);
  }

  private saveAuditList(logs: AuditLogItem[]): void {
    storage.set(ADMIN_AUDIT_STORAGE_KEY, logs);
  }

  async getAdminMetrics(): Promise<{
    totalUsers: number;
    candidates: number;
    examiners: number;
    organizations: number;
    activeExams: number;
    scheduledExams: number;
    completedExams: number;
    systemAlerts: number;
  }> {
    const users = this.getUsersList();
    const orgs = this.getOrgsList();
    return {
      totalUsers: users.length + 27300,
      candidates: 26800,
      examiners: 96,
      organizations: orgs.length,
      activeExams: 3,
      scheduledExams: 7,
      completedExams: 24,
      systemAlerts: 1,
    };
  }

  async getUsers(role?: UserRoleType | 'all', search?: string): Promise<AdminUserRecord[]> {
    let list = this.getUsersList();
    if (role && role !== 'all') {
      list = list.filter((u) => u.role === role);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.organizationName.toLowerCase().includes(q)
      );
    }
    return list;
  }

  async updateUserStatus(
    userId: string,
    status: 'active' | 'deactivated'
  ): Promise<AdminUserRecord> {
    const list = this.getUsersList();
    const idx = list.findIndex((u) => u.id === userId);
    if (idx === -1) throw new Error(`User ${userId} not found.`);

    list[idx] = { ...list[idx], status };
    this.saveUsersList(list);

    await this.logAudit({
      operatorId: 'admin-01',
      operatorName: 'Administrator',
      operatorRole: 'admin',
      action: 'USER_DEACTIVATED',
      entityId: userId,
      entityType: 'user',
      details: `Account status updated to ${status} for ${list[idx].name} (${list[idx].email})`,
    });

    return list[idx];
  }

  async updateUserRole(
    userId: string,
    newRole: UserRoleType,
    permissions: Permission[]
  ): Promise<AdminUserRecord> {
    const list = this.getUsersList();
    const idx = list.findIndex((u) => u.id === userId);
    if (idx === -1) throw new Error(`User ${userId} not found.`);

    list[idx] = {
      ...list[idx],
      role: newRole,
      assignedPermissions: permissions,
    };
    this.saveUsersList(list);

    await this.logAudit({
      operatorId: 'admin-01',
      operatorName: 'Administrator',
      operatorRole: 'admin',
      action: 'ROLE_UPDATED',
      entityId: userId,
      entityType: 'user',
      details: `Role updated to ${newRole} with ${permissions.length} explicit permissions.`,
    });

    return list[idx];
  }

  async getOrganizations(): Promise<Organization[]> {
    return this.getOrgsList();
  }

  async createOrganization(data: Partial<Organization>): Promise<Organization> {
    const list = this.getOrgsList();
    const newOrg: Organization = {
      id: `org-${Date.now()}`,
      name: data.name || 'New Organization Tenant',
      code: data.code || `ORG-${Math.floor(100 + Math.random() * 900)}`,
      domain: data.domain || 'org.edu',
      status: 'active',
      candidateCount: 0,
      examinerCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    list.unshift(newOrg);
    this.saveOrgsList(list);
    return newOrg;
  }

  async getAuditLogs(filterAction?: string): Promise<AuditLogItem[]> {
    const list = this.getAuditList();
    if (!filterAction || filterAction === 'all') return list;
    return list.filter((l) => l.action === filterAction);
  }

  async logAudit(entry: Omit<AuditLogItem, 'id' | 'timestamp' | 'ipAddressMasked'>): Promise<void> {
    const logs = this.getAuditList();
    const newEntry: AuditLogItem = {
      id: `audit-${Date.now()}`,
      timestamp: `${new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString('en-US', { hour12: false })} IST`,
      ipAddressMasked: '192.168.1.***',
      ...entry,
    };
    logs.unshift(newEntry);
    this.saveAuditList(logs);
  }
}

export const adminService = new AdminService();
