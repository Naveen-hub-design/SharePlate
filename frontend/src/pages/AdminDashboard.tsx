import React, { useState, useEffect } from 'react';
import { adminApi, orgApi, safetyApi } from '../api/client';
import type { Organization, SafetyReport, AuditLog } from '../types';
import { 
  ShieldCheck, 
  Users, 
  Building2, 
  AlertTriangle, 
  History, 
  CheckCircle2, 
  XCircle, 
  RefreshCw,
  Search,
  ExternalLink,
  ShieldAlert,
  Sliders,
  Check,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

import { useLocation } from 'react-router-dom';
import { adminService } from '../services/adminService';

interface AdminDashboardProps {
  tab?: 'overview' | 'verification' | 'safety' | 'users' | 'audit' | 'analytics';
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ tab }) => {
  const location = useLocation();

  const getInitialTab = (): 'verification' | 'safety' | 'users' | 'audit' => {
    if (tab === 'safety' || location.pathname.includes('/admin/safety-reports')) return 'safety';
    if (tab === 'users' || location.pathname.includes('/admin/users')) return 'users';
    if (tab === 'audit' || location.pathname.includes('/admin/audit-logs')) return 'audit';
    return 'verification';
  };

  const [activeTab, setActiveTab] = useState<'verification' | 'safety' | 'users' | 'audit'>(getInitialTab);
  const [stats, setStats] = useState<any>(null);

  // Verification queue state
  const [pendingOrgs, setPendingOrgs] = useState<Organization[]>([]);
  // Safety reports state
  const [safetyReports, setSafetyReports] = useState<SafetyReport[]>([]);
  // Users state
  const [users, setUsers] = useState<any[]>([]);
  // Audit logs state
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setActiveTab(getInitialTab());
  }, [tab, location.pathname]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, orgsRes, reportsRes, usersRes, logsRes] = await Promise.allSettled([
        adminService.getOverview(),
        adminService.getPendingVerifications(),
        adminService.getSafetyReports(),
        adminService.getUsers(),
        adminService.getAuditLogs({ limit: 25 }),
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value.overview || null);
      if (orgsRes.status === 'fulfilled') setPendingOrgs(orgsRes.value.organizations || []);
      if (reportsRes.status === 'fulfilled') setSafetyReports(reportsRes.value.reports || []);
      if (usersRes.status === 'fulfilled') setUsers(usersRes.value.users || []);
      if (logsRes.status === 'fulfilled') setAuditLogs(logsRes.value.logs || []);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load administrative data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleApproveOrg = async (orgId: string) => {
    try {
      await orgApi.verifyOrg(orgId, 'FSSAI credentials verified by platform administrator');
      toast.success('Organization approved and verified!');
      fetchAdminData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Verification approval failed');
    }
  };

  const handleRejectOrg = async (orgId: string) => {
    const reason = prompt('Reason for rejection:') || 'Invalid or unverified FSSAI license credentials';
    try {
      await orgApi.rejectOrg(orgId, reason);
      toast.success('Organization verification rejected.');
      fetchAdminData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Rejection failed');
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await adminApi.toggleUserStatus(userId, !currentStatus);
      toast.success(`User ${!currentStatus ? 'activated' : 'suspended'}.`);
      fetchAdminData();
    } catch (err: any) {
      toast.error('Failed to change user status.');
    }
  };

  const handleResolveSafetyReport = async (reportId: string, action: string) => {
    try {
      await safetyApi.updateReport(reportId, {
        status: 'RESOLVED',
        action_taken: action,
        admin_notes: 'Reviewed and confirmed by safety team',
      });
      toast.success('Safety incident updated.');
      fetchAdminData();
    } catch (err: any) {
      toast.error('Failed to update safety report.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-800 bg-purple-100 px-3 py-1 rounded-full">
              Platform Administration
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-stone-900 mt-2 font-heading">
            Admin Oversight Portal
          </h1>
          <p className="text-stone-600 text-xs sm:text-sm mt-0.5">
            FSSAI organization verification, safety incident moderation, and security audit logs.
          </p>
        </div>

        <button
          onClick={fetchAdminData}
          className="p-3 text-stone-600 hover:text-stone-900 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 transition-colors self-start sm:self-auto"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Overview Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="p-5 bg-white rounded-2xl border border-stone-200 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Pending Verifications
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-1 font-heading">
              {stats.pending_organizations}
            </p>
            <p className="text-[11px] text-stone-500 mt-1">Awaiting document review</p>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-stone-200 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Total Organizations
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold text-[#1B4332] mt-1 font-heading">
              {stats.total_organizations}
            </p>
            <p className="text-[11px] text-stone-500 mt-1">Donors & NGO receivers</p>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-stone-200 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Active Listings
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold text-stone-900 mt-1 font-heading">
              {stats.active_donations}
            </p>
            <p className="text-[11px] text-emerald-700 font-semibold mt-1">In live circulation</p>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-stone-200 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Safety Incidents
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold text-red-600 mt-1 font-heading">
              {stats.pending_safety_reports}
            </p>
            <p className="text-[11px] text-stone-500 mt-1">Pending investigation</p>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-stone-200 mb-8 space-x-2 sm:space-x-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab('verification')}
          className={`py-3 px-4 font-bold text-xs sm:text-sm border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'verification'
              ? 'border-[#1B4332] text-[#1B4332]'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Verification Queue ({pendingOrgs.length})
        </button>

        <button
          onClick={() => setActiveTab('safety')}
          className={`py-3 px-4 font-bold text-xs sm:text-sm border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'safety'
              ? 'border-[#1B4332] text-[#1B4332]'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-red-600" />
          Safety Reports ({safetyReports.filter((r) => r.status === 'PENDING').length})
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`py-3 px-4 font-bold text-xs sm:text-sm border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'users'
              ? 'border-[#1B4332] text-[#1B4332]'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Users className="w-4 h-4" />
          Users & Access ({users.length})
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`py-3 px-4 font-bold text-xs sm:text-sm border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'audit'
              ? 'border-[#1B4332] text-[#1B4332]'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <History className="w-4 h-4" />
          Audit Trail
        </button>
      </div>

      {/* Tab 1: Organization Verification Queue */}
      {activeTab === 'verification' && (
        <div className="space-y-4">
          {pendingOrgs.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-3xl border border-stone-200">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
              <h3 className="font-bold text-stone-800 text-sm">Verification queue is clear!</h3>
              <p className="text-xs text-stone-500 mt-1">
                All registered donors and recipient NGOs have been reviewed.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pendingOrgs.map((org) => (
                <div key={org.id} className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          {org.org_type.replace(/_/g, ' ')}
                        </span>
                        <h3 className="font-bold text-stone-900 text-base mt-1">{org.name}</h3>
                      </div>
                      <span className="text-xs font-bold text-stone-400">
                        {new Date(org.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="mt-4 p-3 bg-stone-50 rounded-2xl space-y-1.5 text-xs text-stone-700">
                      <p>
                        <strong>FSSAI / Reg ID:</strong>{' '}
                        <span className="font-mono font-bold text-emerald-900">
                          {org.fssai_license_number || org.registration_number || 'Not provided'}
                        </span>
                      </p>
                      <p>
                        <strong>Address:</strong> {org.address_line}, {org.city}, {org.state}
                      </p>
                      <p>
                        <strong>Contact:</strong> {org.contact_person} ({org.contact_phone})
                      </p>
                      <p>
                        <strong>Email:</strong> {org.contact_email}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
                    <button
                      onClick={() => handleRejectOrg(org.id)}
                      className="px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleApproveOrg(org.id)}
                      className="px-5 py-2 text-xs font-bold text-white bg-[#1B4332] hover:bg-[#2D6A4F] rounded-xl shadow transition-colors flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      Approve & Verify
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Safety Reports */}
      {activeTab === 'safety' && (
        <div className="space-y-4">
          {safetyReports.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-3xl border border-stone-200">
              <ShieldCheck className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
              <h3 className="font-bold text-stone-800 text-sm">No safety complaints recorded</h3>
              <p className="text-xs text-stone-500 mt-1">Platform food safety compliance is 100%.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {safetyReports.map((report) => (
                <div key={report.id} className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-red-100 text-red-800">
                        {report.status}
                      </span>
                      <span className="text-xs font-bold text-stone-900">
                        Listing: {report.donation?.title || report.donation_id}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-red-700">
                      Reason: {report.reason.replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs text-stone-600 bg-stone-50 p-2.5 rounded-xl">
                      "{report.details}"
                    </p>
                    <p className="text-[11px] text-stone-400">
                      Reported by {report.reporter?.full_name} ({report.reporter?.email}) on {new Date(report.created_at).toLocaleString()}
                    </p>
                  </div>

                  {report.status === 'PENDING' && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleResolveSafetyReport(report.id, 'DISMISSED_AFTER_REVIEW')}
                        className="px-3.5 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl"
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={() => handleResolveSafetyReport(report.id, 'LISTING_SUSPENDED')}
                        className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow"
                      >
                        Suspend Listing & Sanction
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Users Management */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F2] text-stone-500 uppercase font-bold border-b border-stone-200">
                <tr>
                  <th className="p-4">User</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Organization</th>
                  <th className="p-4">Verification</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-stone-50">
                    <td className="p-4">
                      <p className="font-bold text-stone-900">{u.full_name}</p>
                      <p className="text-stone-400 text-[11px]">{u.email}</p>
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-stone-700">{u.role}</span>
                    </td>
                    <td className="p-4">
                      {u.organization?.name || '—'}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.organization?.verification_status === 'VERIFIED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {u.organization?.verification_status || 'N/A'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {u.is_active ? 'ACTIVE' : 'SUSPENDED'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {u.role !== 'ADMIN' && (
                        <button
                          onClick={() => handleToggleUserStatus(u.id, u.is_active)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                            u.is_active
                              ? 'text-red-600 hover:bg-red-50'
                              : 'text-emerald-700 hover:bg-emerald-50'
                          }`}
                        >
                          {u.is_active ? 'Suspend' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Audit Logs */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F2] text-stone-500 uppercase font-bold border-b border-stone-200">
                <tr>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Entity</th>
                  <th className="p-4">Actor</th>
                  <th className="p-4">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-mono">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-stone-50">
                    <td className="p-4 text-stone-500 font-sans">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="p-4 font-bold text-stone-900">{log.action}</td>
                    <td className="p-4 text-stone-600">
                      {log.entity_type} {log.entity_id ? `(${log.entity_id.slice(0, 8)})` : ''}
                    </td>
                    <td className="p-4 text-stone-700 font-sans">
                      {log.user?.email || log.user_id || 'System'}
                    </td>
                    <td className="p-4 text-stone-400">{log.ip_address || '127.0.0.1'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
