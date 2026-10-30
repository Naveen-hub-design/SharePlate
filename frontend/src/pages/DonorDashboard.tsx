import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { donorService } from '../services/donorService';
import type { Donation, DonationRequest } from '../types';
import { useAuth } from '../context/AuthContext';
import { PickupVerificationModal } from '../components/PickupVerificationModal';
import { 
  PlusCircle, 
  Utensils, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  KeyRound, 
  Building2, 
  MapPin, 
  ShieldAlert, 
  ChevronRight, 
  TrendingUp, 
  RefreshCw,
  PackageOpen,
  Inbox,
  BarChart3,
  UserCheck,
  Calendar,
  FileCheck2,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface DonorDashboardProps {
  view?: 'overview' | 'donations' | 'requests' | 'pickups' | 'analytics' | 'profile';
}

export const DonorDashboard: React.FC<DonorDashboardProps> = ({ view }) => {
  const { user, isVerified } = useAuth();
  const location = useLocation();

  // Determine active view from prop or URL pathname
  const activeView = view || (() => {
    if (location.pathname.includes('/donor/donations')) return 'donations';
    if (location.pathname.includes('/donor/requests')) return 'requests';
    if (location.pathname.includes('/donor/pickups')) return 'pickups';
    if (location.pathname.includes('/donor/analytics')) return 'analytics';
    if (location.pathname.includes('/donor/profile')) return 'profile';
    return 'overview';
  })();

  const [donations, setDonations] = useState<Donation[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<DonationRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected request for pickup verification modal
  const [selectedRequestForPickup, setSelectedRequestForPickup] = useState<DonationRequest | null>(null);
  const [pickupModalOpen, setPickupModalOpen] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [donationsRes, requestsRes] = await Promise.allSettled([
        donorService.getMyDonations(),
        donorService.getIncomingRequests(),
      ]);

      if (donationsRes.status === 'fulfilled') {
        setDonations(donationsRes.value.donations || []);
      }
      if (requestsRes.status === 'fulfilled') {
        setIncomingRequests(requestsRes.value.requests || []);
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load dashboard listings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleApprove = async (requestId: string) => {
    try {
      await donorService.approveRequest(requestId);
      toast.success('Request approved! Quantity reserved and pickup code generated for recipient.');
      fetchDashboardData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to approve request.');
    }
  };

  const handleReject = async (requestId: string) => {
    const reason = prompt('Reason for rejection (optional):') || 'Donor unable to fulfill';
    try {
      await donorService.rejectRequest(requestId, reason);
      toast.success('Request declined.');
      fetchDashboardData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to decline request.');
    }
  };

  const handleWithdraw = async (donationId: string) => {
    if (!confirm('Are you sure you want to withdraw this donation listing?')) return;
    try {
      await donorService.withdrawDonation(donationId, 'Withdrawn by donor');
      toast.success('Donation listing withdrawn.');
      fetchDashboardData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to withdraw donation.');
    }
  };

  const handlePublish = async (donationId: string) => {
    try {
      await donorService.publishDonation(donationId);
      toast.success('Listing published! Verified NGOs have been notified.');
      fetchDashboardData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to publish donation.');
    }
  };

  const activeDonations = donations.filter((d) => ['PUBLISHED', 'RESERVED'].includes(d.status));
  const draftDonations = donations.filter((d) => d.status === 'DRAFT');
  const pastDonations = donations.filter((d) => ['COMPLETED', 'WITHDRAWN', 'EXPIRED'].includes(d.status));

  const pendingRequests = incomingRequests.filter((r) => r.status === 'PENDING');
  const approvedPickups = incomingRequests.filter((r) => r.status === 'APPROVED');

  return (
    <div className="max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              Donor Command Center
            </span>
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                isVerified ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}
            >
              {isVerified ? 'FSSAI Verified' : 'Verification Under Review'}
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-stone-900 mt-2 font-heading">
            {user?.organization?.name || 'Food Donor Portal'}
          </h1>
          <p className="text-stone-600 text-xs sm:text-sm mt-0.5">
            Manage surplus food listings, approve recipient claims, and verify physical handovers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            className="p-3 text-stone-600 hover:text-stone-900 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 transition-colors"
            title="Refresh dashboard"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            to="/donor/donations/new"
            className="px-5 py-3 text-sm font-bold text-white bg-gradient-to-r from-[#D97706] to-[#B45309] hover:from-[#B45309] hover:to-[#92400E] rounded-xl shadow-md transition-all flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            + New Surplus Listing
          </Link>
        </div>
      </div>

      {/* Verification Warning if unverified */}
      {!isVerified && (
        <div className="mb-8 p-4 bg-amber-50 rounded-2xl border border-amber-300 text-amber-900 text-xs flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Account Verification In Progress</p>
            <p className="mt-0.5 text-stone-600">
              You can draft surplus listings and test the AI photo assistant. Once an administrator validates your FSSAI registration credentials, your listings will automatically become visible to recipient charities.
            </p>
          </div>
        </div>
      )}

      {/* Metric Cards (always visible on overview or analytics) */}
      {(activeView === 'overview' || activeView === 'analytics') && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <div className="p-5 bg-white rounded-2xl border border-stone-200 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Active Listings
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold text-stone-900 mt-1 font-heading">
              {activeDonations.length}
            </p>
            <p className="text-[11px] text-emerald-700 font-semibold mt-1">Ready for pickup</p>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-stone-200 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Pending Claims
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-1 font-heading">
              {pendingRequests.length}
            </p>
            <p className="text-[11px] text-stone-500 font-semibold mt-1">Requires approval</p>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-stone-200 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Approved Pickups
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold text-[#1B4332] mt-1 font-heading">
              {approvedPickups.length}
            </p>
            <p className="text-[11px] text-stone-500 font-semibold mt-1">Awaiting physical OTP</p>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-stone-200 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Completed Rescues
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold text-stone-900 mt-1 font-heading">
              {donations.filter((d) => d.status === 'COMPLETED').length}
            </p>
            <p className="text-[11px] text-stone-500 font-semibold mt-1">Safely handed over</p>
          </div>
        </div>
      )}

      {/* VIEW: Handover Pickups */}
      {(activeView === 'overview' || activeView === 'pickups') && approvedPickups.length > 0 && (
        <div className="mb-10 bg-emerald-50/50 p-6 rounded-3xl border-2 border-emerald-200">
          <h3 className="font-bold text-lg text-emerald-950 font-heading mb-1 flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-emerald-800" />
            Scheduled Pickups Awaiting Physical Handover ({approvedPickups.length})
          </h3>
          <p className="text-xs text-stone-600 mb-4">
            When the recipient NGO collector arrives, ask for their 6-digit OTP code to verify and log the food handover.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {approvedPickups.map((req) => (
              <div key={req.id} className="p-4 bg-white rounded-2xl border border-emerald-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <h4 className="font-bold text-stone-900 text-sm">{req.donation?.title}</h4>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      APPROVED
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 mt-1">
                    Recipient: <strong>{req.receiver_organization?.name}</strong> ({req.receiver_user?.full_name})
                  </p>
                  <p className="text-xs text-stone-600">
                    Quantity: <strong>{req.requested_quantity} {req.donation?.unit}</strong>
                  </p>
                  {req.pickup_estimated_time && (
                    <p className="text-[11px] text-amber-800 font-medium mt-1">
                      ETA: {new Date(req.pickup_estimated_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-end">
                  <button
                    onClick={() => {
                      setSelectedRequestForPickup(req);
                      setPickupModalOpen(true);
                    }}
                    className="px-4 py-2 text-xs font-bold text-white bg-[#1B4332] hover:bg-[#2D6A4F] rounded-xl shadow flex items-center gap-1.5"
                  >
                    <KeyRound className="w-4 h-4" />
                    Verify Handover with Code
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW: Incoming Claims */}
      {(activeView === 'overview' || activeView === 'requests') && pendingRequests.length > 0 && (
        <div className="mb-10 bg-amber-50/50 p-6 rounded-3xl border border-amber-200">
          <h3 className="font-bold text-lg text-amber-950 font-heading mb-1 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-700" />
            Pending Surplus Claims ({pendingRequests.length})
          </h3>
          <p className="text-xs text-stone-600 mb-4">
            Review and approve food claims submitted by verified recipient organizations.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingRequests.map((req) => (
              <div key={req.id} className="p-4 bg-white rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-stone-900 text-sm">{req.donation?.title}</h4>
                  <p className="text-xs text-stone-600 mt-1">
                    Requested by: <strong>{req.receiver_organization?.name}</strong>
                  </p>
                  <p className="text-xs text-stone-600">
                    Claim Quantity: <strong>{req.requested_quantity} {req.donation?.unit}</strong>
                  </p>
                  {req.requester_notes && (
                    <p className="text-xs text-stone-500 italic mt-1 bg-stone-50 p-2 rounded-lg">
                      "{req.requester_notes}"
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleReject(req.id)}
                    className="px-3.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl"
                  >
                    Decline
                  </button>
                  <button
                    onClick={() => handleApprove(req.id)}
                    className="px-4 py-1.5 text-xs font-bold text-white bg-[#1B4332] hover:bg-[#2D6A4F] rounded-xl shadow"
                  >
                    Approve Claim
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW: Active Listings */}
      {(activeView === 'overview' || activeView === 'donations') && (
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-xl text-stone-900 font-heading">
              Current Surplus Food Listings
            </h3>
            <span className="text-xs text-stone-500 font-semibold">
              {activeDonations.length} active
            </span>
          </div>

          {activeDonations.length === 0 ? (
            <div className="p-10 bg-white rounded-3xl border border-stone-200 text-center">
              <Utensils className="w-10 h-10 text-stone-300 mx-auto mb-2" />
              <h4 className="font-bold text-stone-800 text-sm">No active listings</h4>
              <p className="text-xs text-stone-500 mt-0.5">
                Have surplus from today's menu or service? Publish a new rescue listing.
              </p>
              <Link
                to="/donor/donations/new"
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-[#1B4332] text-white font-bold text-xs rounded-xl shadow"
              >
                <PlusCircle className="w-4 h-4" /> Create Listing
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {activeDonations.map((d) => (
                <div key={d.id} className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {d.status}
                      </span>
                      <span className="text-xs text-stone-400">
                        {new Date(d.collection_deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <h4 className="font-bold text-stone-900 text-base mt-2 line-clamp-1">{d.title}</h4>
                    <p className="text-xs text-stone-600 mt-1 line-clamp-2">{d.description}</p>

                    <div className="mt-3 p-2 bg-stone-50 rounded-xl text-xs flex justify-between">
                      <span className="text-stone-500">Remaining</span>
                      <span className="font-bold text-emerald-800">
                        {d.remaining_quantity} / {d.quantity} {d.unit}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                    <Link
                      to={`/donations/${d.id}`}
                      className="font-bold text-[#1B4332] hover:underline"
                    >
                      View Public Card
                    </Link>
                    <button
                      onClick={() => handleWithdraw(d.id)}
                      className="text-stone-400 hover:text-red-600 font-semibold transition-colors"
                    >
                      Withdraw
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW: Draft Listings */}
      {(activeView === 'overview' || activeView === 'donations') && draftDonations.length > 0 && (
        <div className="mb-10">
          <h3 className="font-bold text-lg text-stone-900 font-heading mb-3">
            Drafts ({draftDonations.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {draftDonations.map((d) => (
              <div key={d.id} className="p-4 bg-stone-50 rounded-2xl border border-stone-200 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-200 text-stone-700">
                    DRAFT
                  </span>
                  <h4 className="font-bold text-stone-900 text-sm mt-1">{d.title}</h4>
                  <p className="text-xs text-stone-500">{d.quantity} {d.unit} • {d.category}</p>
                </div>
                <div className="mt-3 pt-2 border-t border-stone-200 flex justify-end">
                  <button
                    onClick={() => handlePublish(d.id)}
                    className="px-3 py-1 bg-[#1B4332] text-white text-xs font-bold rounded-lg shadow"
                  >
                    Publish
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW: Profile & FSSAI Details */}
      {activeView === 'profile' && (
        <div className="bg-white rounded-3xl p-8 border border-stone-200 shadow-sm max-w-3xl">
          <h3 className="text-xl font-bold text-stone-900 font-heading mb-4 flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-emerald-700" />
            Donor Organization & Compliance Profile
          </h3>
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-stone-50 rounded-2xl">
                <span className="text-xs text-stone-400 font-semibold block">Organization Name</span>
                <span className="font-bold text-stone-900">{user?.organization?.name || 'Not provided'}</span>
              </div>
              <div className="p-4 bg-stone-50 rounded-2xl">
                <span className="text-xs text-stone-400 font-semibold block">FSSAI License / Reg</span>
                <span className="font-bold text-stone-900">{user?.organization?.fssai_license_number || (user?.organization as any)?.fssai_license || 'Pending validation'}</span>
              </div>
              <div className="p-4 bg-stone-50 rounded-2xl">
                <span className="text-xs text-stone-400 font-semibold block">Verification Status</span>
                <span className="font-bold text-emerald-800">{user?.organization?.verification_status || 'PENDING'}</span>
              </div>
              <div className="p-4 bg-stone-50 rounded-2xl">
                <span className="text-xs text-stone-400 font-semibold block">Location</span>
                <span className="font-bold text-stone-900">
                  {user?.organization?.city || 'City'}, {user?.organization?.state || 'State'}
                </span>
              </div>
            </div>
            <p className="text-xs text-stone-500 pt-2">
              To update your FSSAI license or primary address, contact platform compliance governance.
            </p>
          </div>
        </div>
      )}

      {/* Handover Verification Modal */}
      {selectedRequestForPickup && (
        <PickupVerificationModal
          request={selectedRequestForPickup}
          isOpen={pickupModalOpen}
          onClose={() => {
            setPickupModalOpen(false);
            setSelectedRequestForPickup(null);
          }}
          onSuccess={fetchDashboardData}
        />
      )}
    </div>
  );
};
