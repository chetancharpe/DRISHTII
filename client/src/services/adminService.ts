/**
 * Admin Service Layer
 * Platform governance, organization tenant management, user RBAC assignments,
 * security audit logging, and global platform configuration.
 * Connected directly to backend /admin/* endpoints.
 */

import {
  AdminUserRecord,
  Organization,
  AuditLogItem,
  UserRoleType,
  Permission,
} from '../types/examiner';
import { apiClient } from './api';

class AdminService {
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
    return apiClient.get('/admin/metrics');
  }

  async getUsers(role?: UserRoleType | 'all', search?: string): Promise<AdminUserRecord[]> {
    const params = new URLSearchParams();
    if (role && role !== 'all') params.append('role', role);
    if (search) params.append('search', search);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<AdminUserRecord[]>(`/admin/users${queryString}`);
  }

  async updateUserStatus(
    userId: string,
    status: 'active' | 'deactivated'
  ): Promise<AdminUserRecord> {
    return apiClient.patch<AdminUserRecord>(`/admin/users/${userId}/status`, { status });
  }

  async updateUserRole(
    userId: string,
    newRole: UserRoleType,
    permissions: Permission[]
  ): Promise<AdminUserRecord> {
    return apiClient.patch<AdminUserRecord>(`/admin/users/${userId}/role`, {
      role: newRole,
      permissions,
    });
  }

  async getOrganizations(): Promise<Organization[]> {
    return apiClient.get<Organization[]>('/admin/organizations');
  }

  async createOrganization(data: Partial<Organization>): Promise<Organization> {
    return apiClient.post<Organization>('/admin/organizations', data);
  }

  async getAuditLogs(filterAction?: string): Promise<AuditLogItem[]> {
    const query = filterAction && filterAction !== 'all' ? `?filter_action=${encodeURIComponent(filterAction)}` : '';
    return apiClient.get<AuditLogItem[]>(`/admin/audit-logs${query}`);
  }

  async logAudit(_entry: Omit<AuditLogItem, 'id' | 'timestamp' | 'ipAddressMasked'>): Promise<void> {
    // Audit logs are authoritatively recorded server-side
  }
}

export const adminService = new AdminService();
