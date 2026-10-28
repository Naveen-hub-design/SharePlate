import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { requestApi, donationApi } from '../api/client';
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
  Search
} from 'lucide-react';
import toast from 'react-hot-toast';

export const ReceiverDashboard: React.FC = () => {
  const { user, isVerified } = useAuth();
  const [requests, setRequests] = useState<DonationRequest[]>([]);
  const [recommendedDonations, setRecommendedDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchReceiverData = async () => {
    setLoading(true);
    try {
      const [requestsRes, discoverRes] = await Promise.allSettled([
        requestApi.getMyRequests(),
        donationApi.getDiscover({ limit: 4 }),
      ]);

      if (requestsRes.status === 'fulfilled') {
        setRequests(requestsRes.value.data.requests || []);
      }
      if (discoverRes.status === 'fulfilled') {
        setRecommendedDonations(discoverRes.value.data.donations || []);
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
      await requestApi.cancel(requestId, 'Cancelled by recipient NGO');
      toast.success('Request cancelled.');
      fetchReceiverData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to cancel request.');
    }
  };

  const approvedPickups = requests.filter((r) => r.status === 'APPROVED');
  const pendingRequests = requests.filter((r) => r.status === 'PENDING');
  const completedCollections = requests.filter((r) => r.status === 'COMPLETED');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full">
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
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            to="/discover"
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

      {/* Metric Cards */}
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
            {completedCollections.reduce((acc, c) => acc + c.requested_quantity, 0)}
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

      {/* Section 1: APPROVED PICKUPS WITH SECURE 6-DIGIT OTP */}
      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-bold text-stone-900 font-heading mb-4 flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-emerald-800" />
            Approved Collections & Secure Handover OTPs
          </h2>

          {approvedPickups.length === 0 ? (
            <div className="p-8 bg-white rounded-3xl border border-stone-200 text-center">
              <KeyRound className="w-8 h-8 text-stone-300 mx-auto mb-2" />
              <h4 className="font-bold text-stone-700 text-sm">No pickups scheduled right now</h4>
              <p className="text-xs text-stone-500 mt-0.5">
                Browse available surplus listings and submit a claim to receive a collection code.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {approvedPickups.map((req) => (
                <div
                  key={req.id}
                  className="bg-white rounded-3xl border-2 border-emerald-300/80 shadow-md p-6 flex flex-col justify-between relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] font-extrabold px-3 py-1 rounded-bl-xl tracking-wider">
                    READY FOR PICKUP
                  </div>

                  <div>
                    <h3 className="font-extrabold text-stone-900 text-base">{req.donation?.title}</h3>
                    <p className="text-xs text-stone-600 mt-1 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-stone-400" />
                      <span>{req.donation?.donor_organization?.name}</span>
                    </p>
                    <p className="text-xs text-stone-500 flex items-center gap-1.5 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-stone-400" />
                      <span>{req.donation?.collection_address}</span>
                    </p>

                    <div className="mt-4 p-3 bg-stone-50 rounded-2xl flex items-center justify-between text-xs">
                      <div>
                        <span className="text-stone-500 block">Reserved Portions</span>
                        <span className="font-bold text-stone-900 text-sm">
                          {req.requested_quantity} {req.donation?.unit}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-stone-500 block">Collection Deadline</span>
                        <span className="font-bold text-amber-700 text-xs">
                          {new Date(req.donation?.collection_deadline || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    {/* PROMINENT 6-DIGIT OTP BADGE */}
                    <div className="mt-5 p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 text-center">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-800 block mb-1">
                        Present Code at Physical Handover
                      </span>
                      <div className="flex items-center justify-center gap-3">
                        <span className="font-mono text-3xl font-extrabold tracking-[0.25em] text-stone-900">
                          {req.pickup_code || '123456'}
                        </span>
                        <button
                          onClick={() => handleCopyCode(req.pickup_code || '123456')}
                          className="p-2 rounded-xl bg-white border border-amber-300 text-amber-800 hover:bg-amber-100 transition-colors"
                          title="Copy Code"
                        >
                          {copiedCode === (req.pickup_code || '123456') ? (
                            <Check className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      <p className="text-[11px] text-stone-500 mt-2">
                        The donor will type this code into their device to complete verification.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                    <span className="text-stone-400">
                      Approved: {new Date(req.approved_at || req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <Link
                      to={`/donations/${req.donation_id}`}
                      className="font-bold text-[#1B4332] hover:underline"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Pending Claims */}
        {pendingRequests.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-stone-900 font-heading mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" />
              Pending Claims Awaiting Donor Confirmation ({pendingRequests.length})
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingRequests.map((req) => (
                <div key={req.id} className="p-5 bg-white rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between">
                      <h4 className="font-bold text-stone-900 text-sm">{req.donation?.title}</h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        PENDING
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 mt-1">
                      Donor: {req.donation?.donor_organization?.name}
                    </p>
                    <p className="text-xs text-stone-600">
                      Requested: {req.requested_quantity} {req.donation?.unit}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                    <span className="text-stone-400">
                      Requested {new Date(req.created_at).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => handleCancelRequest(req.id)}
                      className="text-stone-400 hover:text-red-600 font-semibold transition-colors"
                    >
                      Cancel Request
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 3: Recommended Matched Surplus */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-stone-900 font-heading flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-600" />
              Matched Surplus Food Near You
            </h2>
            <Link to="/discover" className="text-xs font-bold text-[#1B4332] hover:underline">
              View All & Filter
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendedDonations.map((d) => (
              <DonationCard key={d.id} donation={d} showMatchScore />
            ))}
          </div>
        </div>

        {/* Section 4: Collection History */}
        {completedCollections.length > 0 && (
          <div className="pt-4">
            <h2 className="text-xl font-bold text-stone-900 font-heading mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-700" />
              Past Rescues & Completed Handovers ({completedCollections.length})
            </h2>

            <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-sm">
              <div className="divide-y divide-stone-100 text-xs">
                {completedCollections.map((req) => (
                  <div key={req.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-stone-900 text-sm">{req.donation?.title}</h4>
                      <p className="text-stone-500">
                        From: {req.donation?.donor_organization?.name} • Quantity:{' '}
                        <strong>{req.requested_quantity} {req.donation?.unit}</strong>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        COMPLETED
                      </span>
                      <p className="text-stone-400 text-[11px] mt-0.5">
                        {new Date(req.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
