import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { receiverService } from '../services/receiverService';
import { publicService } from '../services/publicService';
import type { DonationRequest, Donation } from '../types';
import { useAuth } from '../context/AuthContext';
import { DonationCard } from '../components/DonationCard';
import { 
  HeartHandshake, 
  KeyRound, 
  Clock, 
  CheckCircle2, 
  MapPin, 
  Sparkles, 
  AlertCircle, 
  Building2, 
  Copy, 
  Check, 
  RefreshCw,
  Search,
  FileCheck2,
  BarChart3,
  PackageCheck,
  ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ReceiverDashboardProps {
  view?: 'overview' | 'discover' | 'requests' | 'pickups' | 'analytics' | 'profile';
}

export const ReceiverDashboard: React.FC<ReceiverDashboardProps> = ({ view }) => {
  const { user, isVerified } = useAuth();
  const location = useLocation();

  const activeView = view || (() => {
    if (location.pathname.includes('/receiver/requests')) return 'requests';
    if (location.pathname.includes('/receiver/pickups')) return 'pickups';
    if (location.pathname.includes('/receiver/analytics')) return 'analytics';
    if (location.pathname.includes('/receiver/profile')) return 'profile';
    return 'overview';
  })();

  const [requests, setRequests] = useState<DonationRequest[]>([]);
  const [recommendedDonations, setRecommendedDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchReceiverData = async () => {
    setLoading(true);
    try {
      const [requestsRes, discoverRes] = await Promise.allSettled([
        receiverService.getMyClaims(),
        publicService.getDiscoverDonations({ limit: 4 } as any),
      ]);

      if (requestsRes.status === 'fulfilled') {
        setRequests(requestsRes.value.requests || []);
      }
      if (discoverRes.status === 'fulfilled') {
        setRecommendedDonations(discoverRes.value.donations || []);
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load receiver data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceiverData();
  }, []);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success('Pickup code copied to clipboard!');
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleCancelRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to cancel this surplus food request?')) return;
    try {
      await receiverService.cancelClaim(requestId, 'Cancelled by recipient NGO');
      toast.success('Request cancelled.');
      fetchReceiverData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to cancel request.');
    }
  };

  const approvedPickups = requests.filter((r) => r.status === 'APPROVED');
  const pendingRequests = requests.filter((r) => r.status === 'PENDING');
  const completedCollections = requests.filter((r) => r.status === 'COMPLETED' || r.status === 'PICKED_UP');

  return (
    <div className="max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Recipient NGO Portal
            </span>
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                isVerified ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}
            >
              {isVerified ? 'Verified Organization' : 'Pending Verification'}
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-stone-900 mt-2 font-heading">
            {user?.organization?.name || 'Recipient Command Center'}
          </h1>
          <p className="text-stone-600 text-xs sm:text-sm mt-0.5">
            Track claims, present handover OTPs, and discover matched surplus food nearby.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchReceiverData}
            className="p-3 text-stone-600 hover:text-stone-900 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 transition-colors"
            title="Refresh dashboard"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            to="/receiver/discover"
            className="px-5 py-3 text-sm font-bold text-white bg-[#1B4332] hover:bg-[#2D6A4F] rounded-xl shadow-md transition-all flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            Discover Surplus Food
          </Link>
        </div>
      </div>

      {/* Verification Warning if unverified */}
      {!isVerified && (
        <div className="mb-8 p-4 bg-amber-50 rounded-2xl border border-amber-300 text-amber-900 text-xs flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Organization Verification Pending</p>
            <p className="mt-0.5 text-stone-600">
              An administrator is reviewing your registration documents. Once approved, you can immediately claim and reserve surplus food batches.
            </p>
          </div>
        </div>
      )}

      {/* Metric Cards (visible in overview & analytics) */}
      {(activeView === 'overview' || activeView === 'analytics') && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <div className="p-5 bg-white rounded-2xl border border-stone-200 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Approved Pickups
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold text-[#1B4332] mt-1 font-heading">
              {approvedPickups.length}
            </p>
            <p className="text-[11px] text-emerald-700 font-semibold mt-1">Ready with 6-digit OTP</p>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-stone-200 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Pending Claims
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-1 font-heading">
              {pendingRequests.length}
            </p>
            <p className="text-[11px] text-stone-500 font-semibold mt-1">Awaiting donor response</p>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-stone-200 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Meals Collected
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold text-stone-900 mt-1 font-heading">
              {completedCollections.reduce((acc, c) => acc + (c.requested_quantity || (c as any).requested_portions || 0), 0)}
            </p>
            <p className="text-[11px] text-stone-500 font-semibold mt-1">Portions distributed</p>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-stone-200 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Total Rescues
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold text-stone-900 mt-1 font-heading">
              {completedCollections.length}
            </p>
            <p className="text-[11px] text-stone-500 font-semibold mt-1">Successful handovers</p>
          </div>
        </div>
      )}

      {/* VIEW: Approved Pickups with 6-digit OTP */}
      {(activeView === 'overview' || activeView === 'pickups') && (
        <div className="mb-10">
          <h2 className="text-xl font-bold text-stone-900 font-heading mb-4 flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-emerald-700" />
            Approved Food Pickups (Present Code at Handover)
          </h2>

          {approvedPickups.length === 0 ? (
            <div className="p-8 bg-white rounded-3xl border border-stone-200 text-center">
              <KeyRound className="w-10 h-10 text-stone-300 mx-auto mb-2" />
              <h4 className="font-bold text-stone-800 text-sm">No scheduled collections pending</h4>
              <p className="text-xs text-stone-500 mt-0.5">
                When a food donor accepts your claim, your secure 6-digit handover OTP code will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {approvedPickups.map((r) => (
                <div key={r.id} className="p-5 bg-white rounded-3xl border-2 border-emerald-500/30 shadow-md">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        READY FOR HANDOVER
                      </span>
                      <h3 className="font-bold text-lg text-stone-900 mt-1">{r.donation?.title}</h3>
                      <p className="text-xs text-stone-500">
                        Donor: <strong>{r.donation?.donor_organization?.name}</strong>
                      </p>
                    </div>
                  </div>

                  {/* 6-Digit OTP Highlight Box */}
                  <div className="my-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-900">
                        Collection Verification Code (OTP)
                      </p>
                      <p className="text-3xl font-extrabold tracking-widest text-[#1B4332] font-mono mt-0.5">
                        {r.pickup_code || '------'}
                      </p>
                    </div>
                    {r.pickup_code && (
                      <button
                        onClick={() => handleCopyCode(r.pickup_code!)}
                        className="p-2.5 bg-white rounded-xl text-emerald-800 hover:bg-emerald-100 transition-colors shadow-sm flex items-center gap-1.5 text-xs font-bold"
                        title="Copy OTP to clipboard"
                      >
                        {copiedCode === r.pickup_code ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-600" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <div className="text-xs text-stone-600 space-y-1">
                    <p className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span>{r.donation?.collection_address || 'Address provided upon confirmation'}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span>
                        Collect before:{' '}
                        <strong>
                          {new Date(r.donation?.collection_deadline || '').toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </strong>
                      </span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW: Pending Claims */}
      {(activeView === 'overview' || activeView === 'requests') && pendingRequests.length > 0 && (
        <div className="mb-10">
          <h2 className="text-xl font-bold text-stone-900 font-heading mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600" />
            Pending Surplus Food Claims
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingRequests.map((r) => (
              <div key={r.id} className="p-4 bg-white rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      PENDING DONOR REVIEW
                    </span>
                    <span className="text-xs text-stone-400">
                      Requested {new Date(r.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="font-bold text-stone-900 text-sm mt-1">{r.donation?.title}</h4>
                  <p className="text-xs text-stone-600 mt-1">
                    Claim Quantity: <strong>{r.requested_quantity} {r.donation?.unit}</strong>
                  </p>
                  <p className="text-xs text-stone-500">
                    Donor: {r.donation?.donor_organization?.name}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-end">
                  <button
                    onClick={() => handleCancelRequest(r.id)}
                    className="text-xs text-red-600 hover:text-red-700 font-semibold px-3 py-1.5 rounded-lg hover:bg-red-50"
                  >
                    Cancel Claim
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW: Recommended Surplus (in overview) */}
      {activeView === 'overview' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-stone-900 font-heading flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-600" />
              Recommended Fresh Surplus Available Now
            </h2>
            <Link to="/receiver/discover" className="text-xs font-bold text-[#1B4332] hover:underline flex items-center gap-1">
              Browse all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {recommendedDonations.map((d) => (
              <DonationCard key={d.id} donation={d} />
            ))}
          </div>
        </div>
      )}

      {/* VIEW: NGO Profile */}
      {activeView === 'profile' && (
        <div className="bg-white rounded-3xl p-8 border border-stone-200 shadow-sm max-w-3xl">
          <h3 className="text-xl font-bold text-stone-900 font-heading mb-4 flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-emerald-700" />
            Recipient NGO Organization Profile
          </h3>
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-stone-50 rounded-2xl">
                <span className="text-xs text-stone-400 font-semibold block">Organization Name</span>
                <span className="font-bold text-stone-900">{user?.organization?.name || 'Not provided'}</span>
              </div>
              <div className="p-4 bg-stone-50 rounded-2xl">
                <span className="text-xs text-stone-400 font-semibold block">NGO Registration #</span>
                <span className="font-bold text-stone-900">{user?.organization?.registration_number || 'Pending'}</span>
              </div>
              <div className="p-4 bg-stone-50 rounded-2xl">
                <span className="text-xs text-stone-400 font-semibold block">Verification Status</span>
                <span className="font-bold text-emerald-800">{user?.organization?.verification_status || 'PENDING'}</span>
              </div>
              <div className="p-4 bg-stone-50 rounded-2xl">
                <span className="text-xs text-stone-400 font-semibold block">Operating City</span>
                <span className="font-bold text-stone-900">
                  {user?.organization?.city || 'City'}, {user?.organization?.state || 'State'}
                </span>
              </div>
            </div>
            <p className="text-xs text-stone-500 pt-2">
              To update your operating zone, food transport vehicle capacity, or NGO registration credentials, please contact support.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
