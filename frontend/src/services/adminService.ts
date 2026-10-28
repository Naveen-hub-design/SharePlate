import { apiClient } from '../api/client';
import type { Organization, SafetyReport, AuditLog } from '../types';

export const adminService = {
  getOverview: async (): Promise<{ overview: any }> => {
    const res = await apiClient.get('/admin/overview');
    return res.data;
  },

  getPendingVerifications: async (status: string = 'PENDING'): Promise<{ organizations: Organization[] }> => {
    const res = await apiClient.get('/admin/verifications', { params: { status } });
    return res.data;
  },

  reviewVerification: async (orgId: string | number, payload: { action: 'APPROVE' | 'REJECT'; notes?: string }): Promise<any> => {
    const res = await apiClient.post(`/admin/verifications/${orgId}`, payload);
    return res.data;
  },

  getUsers: async (role?: string): Promise<{ users: any[] }> => {
    const res = await apiClient.get('/admin/users', { params: { role } });
    return res.data;
  },

  toggleUserStatus: async (userId: string | number, is_active: boolean): Promise<any> => {
    const res = await apiClient.put(`/admin/users/${userId}/status`, { is_active });
    return res.data;
  },

  getSafetyReports: async (status?: string): Promise<{ reports: SafetyReport[] }> => {
    const res = await apiClient.get('/safety/reports', { params: { status } });
    return res.data;
  },

  updateSafetyReport: async (reportId: string | number, payload: { status: string; action_taken: string }): Promise<any> => {
    const res = await apiClient.put(`/safety/reports/${reportId}`, payload);
    return res.data;
  },

  getAuditLogs: async (params?: { entity_type?: string; limit?: number }): Promise<{ logs: AuditLog[] }> => {
    const res = await apiClient.get('/admin/audit-logs', { params });
    return res.data;
  },
};
