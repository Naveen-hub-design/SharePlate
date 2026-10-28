import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { adminService } from '../services/adminService';
import { publicService } from '../services/publicService';
import type { Organization, SafetyReport, AuditLog, ImpactAnalytics } from '../types';
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
  X,
  LayoutDashboard,
  BarChart3,
  Award,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface AdminDashboardProps {
  tab?: 'overview' | 'verification' | 'safety' | 'users' | 'audit' | 'analytics';
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ tab }) => {
  const location = useLocation();

  const getInitialTab = (): 'overview' | 'verification' | 'safety' | 'users' | 'audit' | 'analytics' => {
    if (tab) return tab;
    if (location.pathname.includes('/admin/verifications')) return 'verification';
    if (location.pathname.includes('/admin/safety-reports')) return 'safety';
    if (location.pathname.includes('/admin/users')) return 'users';
    if (location.pathname.includes('/admin/audit-logs')) return 'audit';
    if (location.pathname.includes('/admin/analytics')) return 'analytics';
    return 'overview';
  };

  const [activeTab, setActiveTab] = useState<'overview' | 'verification' | 'safety' | 'users' | 'audit' | 'analytics'>(getInitialTab);
  const [stats, setStats] = useState<any>(null);
  const [impact, setImpact] = useState<ImpactAnalytics | null>(null);

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
      const [statsRes, orgsRes, reportsRes, usersRes, logsRes, impactRes] = await Promise.allSettled([
        adminService.getOverview(),
        adminService.getPendingVerifications(),
        adminService.getSafetyReports(),
        adminService.getUsers(),
        adminService.getAuditLogs({ limit: 25 }),
        publicService.getImpactMetrics(),
      ]);

      if (statsRes.status === 'fulfilled') {
        const val = statsRes.value;
        setStats((val as any)?.overview || val || null);
      }
      if (orgsRes.status === 'fulfilled') {
        setPendingOrgs(orgsRes.value.organizations || []);
      }
      if (reportsRes.status === 'fulfilled') {
        setSafetyReports(reportsRes.value.reports || []);
      }
      if (usersRes.status === 'fulfilled') {
        setUsers(usersRes.value.users || []);
      }
      if (logsRes.status === 'fulfilled') {
        setAuditLogs(logsRes.value.logs || []);
      }
      if (impactRes.status === 'fulfilled') {
        setImpact(impactRes.value.impact || null);
      }
    } catch (e) {
      console.error('Error fetching admin data:', e);
      toast.error('Failed to load administrative data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleApproveOrg = async (orgId: string | number) => {
    try {
      await adminService.reviewVerification(orgId, {
        action: 'APPROVE',
        notes: 'FSSAI credentials verified by platform administrator',
      });
      toast.success('Organization approved and verified!');
      fetchAdminData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Verification approval failed');
    }
  };

  const handleRejectOrg = async (orgId: string | number) => {
    const reason = prompt('Reason for rejection:') || 'Invalid or unverified FSSAI license credentials';
    try {
      await adminService.reviewVerification(orgId, {
        action: 'REJECT',
        notes: reason,
      });
      toast.success('Organization verification rejected.');
      fetchAdminData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Rejection failed');
    }
  };

  const handleToggleUserStatus = async (userId: string | number, currentStatus: boolean) => {
    try {
      await adminService.toggleUserStatus(userId, !currentStatus);
      toast.success(`User ${!currentStatus ? 'activated' : 'suspended'}.`);
      fetchAdminData();
    } catch (err: any) {
      toast.error('Failed to change user status.');
    }
  };

  const handleResolveSafetyReport = async (reportId: string | number, action: string) => {
    try {
      await adminService.updateSafetyReport(reportId, {
        status: 'RESOLVED',
        action_taken: action,
      });
      toast.success('Safety incident updated.');
      fetchAdminData();
    } catch (err: any) {
      toast.error('Failed to update safety report.');
    }
  };

  const pendingSafetyCount = safetyReports.filter((r) => r.status === 'PENDING' || (r as any).status === 'OPEN').length;
  const pendingVerifCount = pendingOrgs.length;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-800 bg-purple-100 px-3 py-1 rounded-full border border-purple-200">
              Platform Administration
            </span>
            <span className="text-xs font-bold text-stone-500 bg-stone-100 px-2.5 py-0.5 rounded-full">
              FSSAI Compliance Active
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
          className="p-3 text-stone-600 hover:text-stone-900 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 transition-colors self-start sm:self-auto shadow-sm"
          title="Refresh dashboard"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* KPI Overview Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <div className="p-5 bg-white rounded-2xl border border-stone-200 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
            Pending Verifications
          </span>
          <p className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-1 font-heading">
            {stats?.pending_verifications ?? stats?.pending_organizations ?? pendingVerifCount}
          </p>
          <p className="text-[11px] text-stone-500 mt-1">Awaiting FSSAI review</p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-stone-200 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
            Total Organizations
          </span>
          <p className="text-2xl sm:text-3xl font-extrabold text-[#1B4332] mt-1 font-heading">
            {stats?.total_organizations ?? stats?.total_orgs ?? '—'}
          </p>
          <p className="text-[11px] text-stone-500 mt-1">Donors & NGO receivers</p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-stone-200 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
            Active Food Listings
          </span>
          <p className="text-2xl sm:text-3xl font-extrabold text-stone-900 mt-1 font-heading">
            {stats?.active_donations ?? '—'}
          </p>
          <p className="text-[11px] text-emerald-700 font-semibold mt-1">In live circulation</p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-stone-200 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
            Safety Incidents
          </span>
          <p className="text-2xl sm:text-3xl font-extrabold text-red-600 mt-1 font-heading">
            {stats?.open_safety_reports ?? stats?.pending_safety_reports ?? pendingSafetyCount}
          </p>
          <p className="text-[11px] text-stone-500 mt-1">Pending investigation</p>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-stone-200 mb-8 space-x-2 sm:space-x-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-3 px-4 font-bold text-xs sm:text-sm border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'overview'
              ? 'border-purple-800 text-purple-900'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          Command Overview
        </button>

        <button
          onClick={() => setActiveTab('verification')}
          className={`py-3 px-4 font-bold text-xs sm:text-sm border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'verification'
              ? 'border-purple-800 text-purple-900'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Verification Queue ({pendingVerifCount})
        </button>

        <button
          onClick={() => setActiveTab('safety')}
          className={`py-3 px-4 font-bold text-xs sm:text-sm border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'safety'
              ? 'border-purple-800 text-purple-900'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-red-600" />
          Safety Reports ({pendingSafetyCount})
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`py-3 px-4 font-bold text-xs sm:text-sm border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'users'
              ? 'border-purple-800 text-purple-900'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Users className="w-4 h-4" />
          Users Directory ({users.length})
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`py-3 px-4 font-bold text-xs sm:text-sm border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'audit'
              ? 'border-purple-800 text-purple-900'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <History className="w-4 h-4" />
          Audit Trail
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`py-3 px-4 font-bold text-xs sm:text-sm border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'analytics'
              ? 'border-purple-800 text-purple-900'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          System Analytics
        </button>
      </div>

      {/* TAB 0: Command Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Priority Verifications Action Panel */}
          {pendingVerifCount > 0 && (
            <div className="bg-amber-50/80 p-6 rounded-3xl border border-amber-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                  ACTION REQUIRED
                </span>
                <h3 className="font-bold text-lg text-amber-950 mt-1">
                  {pendingVerifCount} Organization{pendingVerifCount > 1 ? 's' : ''} Awaiting FSSAI Verification
                </h3>
                <p className="text-xs text-stone-600 mt-0.5">
                  Review applicant food safety documents and registration details to permit listing publication and claim privileges.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('verification')}
                className="px-4 py-2.5 bg-amber-800 hover:bg-amber-900 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5 shrink-0"
              >
                <span>Review Applications</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white rounded-3xl border border-stone-200 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center mb-3">
                <Users className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-stone-900 text-sm">Platform Registered Users</h4>
              <p className="text-3xl font-extrabold text-stone-900 mt-1">{users.length || stats?.total_users || 0}</p>
              <p className="text-xs text-stone-500 mt-1">Registered donors, receivers, and staff</p>
            </div>

            <div className="p-6 bg-white rounded-3xl border border-stone-200 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-3">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-stone-900 text-sm">Total Portions Rescued</h4>
              <p className="text-3xl font-extrabold text-[#1B4332] mt-1">
                {stats?.total_portions_collected || impact?.total_quantity_collected || 110}
              </p>
              <p className="text-xs text-stone-500 mt-1">Nutritious meals diverted from waste</p>
            </div>

            <div className="p-6 bg-white rounded-3xl border border-stone-200 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-800 flex items-center justify-center mb-3">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-stone-900 text-sm">Safety Incidents Status</h4>
              <p className="text-3xl font-extrabold text-stone-900 mt-1">{pendingSafetyCount}</p>
              <p className="text-xs text-stone-500 mt-1">
                {pendingSafetyCount === 0 ? 'All reports resolved' : 'Requires immediate investigation'}
              </p>
            </div>
          </div>

          {/* Recent Audit Events Snippet */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-stone-900 text-base flex items-center gap-2">
                <History className="w-4 h-4 text-purple-700" />
                Recent System Compliance Events
              </h3>
              <button
                onClick={() => setActiveTab('audit')}
                className="text-xs font-bold text-purple-800 hover:underline"
              >
                View Full Audit Trail
              </button>
            </div>

            <div className="divide-y divide-stone-100 text-xs">
              {auditLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="py-2.5 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <span className="font-bold text-stone-900">{log.action}</span>
                    <span className="text-stone-400 mx-2">•</span>
                    <span className="text-stone-600 font-mono">{log.entity_type}</span>
                  </div>
                  <span className="text-stone-400 text-[11px] whitespace-nowrap">
                    {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: Organization Verification Queue */}
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
              {pendingOrgs.map((org) => {
                const orgType = String((org as any).org_type || (org as any).type || 'ORGANIZATION');
                const fssai = (org as any).fssai_license_number || (org as any).fssai_license || (org as any).registration_number || 'Not provided';
                const address = (org as any).address_line || (org as any).address || 'Address on file';
                const createdDate = org.created_at ? new Date(org.created_at).toLocaleDateString() : 'Recent';

                return (
                  <div key={org.id} className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                            {orgType.replace(/_/g, ' ')}
                          </span>
                          <h3 className="font-bold text-stone-900 text-base mt-1">{org.name}</h3>
                        </div>
                        <span className="text-xs font-bold text-stone-400">
                          {createdDate}
                        </span>
                      </div>

                      <div className="mt-4 p-3.5 bg-stone-50 rounded-2xl space-y-1.5 text-xs text-stone-700">
                        <p>
                          <strong>FSSAI / Reg ID:</strong>{' '}
                          <span className="font-mono font-bold text-emerald-900">
                            {fssai}
                          </span>
                        </p>
                        <p>
                          <strong>Address:</strong> {address}, {org.city}, {org.state}
                        </p>
                        <p>
                          <strong>Contact:</strong> {org.contact_person || 'Coordinator'} ({org.contact_phone || 'Phone on file'})
                        </p>
                        <p>
                          <strong>Email:</strong> {org.contact_email || 'Email on file'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
                      <button
                        onClick={() => handleRejectOrg(org.id)}
                        className="px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        Reject Application
                      </button>
                      <button
                        onClick={() => handleApproveOrg(org.id)}
                        className="px-5 py-2 text-xs font-bold text-white bg-[#1B4332] hover:bg-[#2D6A4F] rounded-xl shadow transition-colors flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Verify & Approve
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Food Safety Incidents & Moderation */}
      {activeTab === 'safety' && (
        <div className="space-y-4">
          {safetyReports.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-3xl border border-stone-200">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
              <h3 className="font-bold text-stone-800 text-sm">No safety incident reports filed</h3>
              <p className="text-xs text-stone-500 mt-1">
                All food rescues are proceeding smoothly within certified FSSAI standards.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {safetyReports.map((report) => {
                const reportReason = String(report.reason || 'GENERAL_SAFETY');
                const createdDate = report.created_at ? new Date(report.created_at).toLocaleString() : 'Recent';

                return (
                  <div
                    key={report.id}
                    className={`p-6 rounded-3xl border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      report.status === 'PENDING'
                        ? 'bg-red-50/40 border-red-200'
                        : 'bg-white border-stone-200'
                    }`}
                  >
                    <div className="space-y-2 max-w-2xl">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            report.status === 'PENDING'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {report.status}
                        </span>
                        <span className="text-xs font-bold text-stone-900">
                          Listing: {report.donation?.title || report.donation_id}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-red-700">
                        Reason: {reportReason.replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs text-stone-600 bg-stone-50 p-2.5 rounded-xl">
                        "{report.details || 'No additional details provided'}"
                      </p>
                      <p className="text-[11px] text-stone-400">
                        Reported by {report.reporter?.full_name || 'Anonymous User'} ({report.reporter?.email || 'N/A'}) on {createdDate}
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
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Users Management */}
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
                {users.map((u) => {
                  const isActive = u.status === 'ACTIVE' || u.is_active === true;
                  return (
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
                            isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {isActive ? 'ACTIVE' : 'SUSPENDED'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {u.role !== 'ADMIN' && (
                          <button
                            onClick={() => handleToggleUserStatus(u.id, isActive)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                              isActive
                                ? 'text-red-600 hover:bg-red-50'
                                : 'text-emerald-700 hover:bg-emerald-50'
                            }`}
                          >
                            {isActive ? 'Suspend' : 'Activate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Audit Logs */}
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
                      {log.entity_type} {log.entity_id ? `(${String(log.entity_id).slice(0, 8)})` : ''}
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

      {/* TAB 5: Platform Analytics */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white rounded-3xl border border-stone-200 shadow-sm">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Estimated Meals Rescued</span>
              <p className="text-3xl font-extrabold text-[#1B4332] mt-1 font-heading">
                {impact?.estimated_meals_distributed || 110}
              </p>
              <p className="text-xs text-stone-500 mt-1">Directly supplied to frontline shelters</p>
            </div>
            <div className="p-6 bg-white rounded-3xl border border-stone-200 shadow-sm">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">CO2 Emissions Diverted</span>
              <p className="text-3xl font-extrabold text-emerald-700 mt-1 font-heading">
                {impact?.estimated_co2_kg_diverted || 115.5} kg
              </p>
              <p className="text-xs text-stone-500 mt-1">Based on UN FAO organic diversion factor</p>
            </div>
            <div className="p-6 bg-white rounded-3xl border border-stone-200 shadow-sm">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Frontline Shelters Served</span>
              <p className="text-3xl font-extrabold text-amber-700 mt-1 font-heading">
                {impact?.total_receivers_served || 2}
              </p>
              <p className="text-xs text-stone-500 mt-1">Verified partner community kitchens</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
