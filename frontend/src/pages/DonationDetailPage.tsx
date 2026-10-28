import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { donationApi, requestApi, aiApi } from '../api/client';
import type { Donation } from '../types';
import { useAuth } from '../context/AuthContext';
import { SafetyReportModal } from '../components/SafetyReportModal';
import { RescueRouteModal } from '../components/RescueRouteModal';
import { 
  Clock, 
  MapPin, 
  Thermometer, 
  AlertTriangle, 
  CheckCircle2, 
  Building2, 
  Phone, 
  Mail, 
  Sparkles, 
  ShieldCheck, 
  ArrowLeft,
  Share2,
  Calendar,
  Layers,
  Utensils,
  Navigation,
  Route
} from 'lucide-react';
import toast from 'react-hot-toast';

export const DonationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isReceiver, isVerified } = useAuth();

  const [donation, setDonation] = useState<Donation | null>(null);
  const [loading, setLoading] = useState(true);
  const [matchData, setMatchData] = useState<any>(null);
  const [safetyModalOpen, setSafetyModalOpen] = useState(false);
  const [routeModalOpen, setRouteModalOpen] = useState(false);

  // Claim modal state
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [claimQuantity, setClaimQuantity] = useState<number>(1);
  const [pickupEstimatedTime, setPickupEstimatedTime] = useState('');
  const [requesterNotes, setRequesterNotes] = useState('');
  const [safetyConfirmed, setSafetyConfirmed] = useState(false);
  const [submittingClaim, setSubmittingClaim] = useState(false);

  const fetchDonation = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await donationApi.getById(id);
      const data: Donation = res.data.donation;
      setDonation(data);
      setClaimQuantity(data.remaining_quantity);

      // Fetch AI matching insights if user is a receiver
      if (user?.role === 'RECEIVER' && user.organization?.id) {
        try {
          const matchRes = await aiApi.matchDonation(id, user.organization.id);
          setMatchData(matchRes.data);
        } catch (e) {
          // ignore optional match failure
        }
      }
    } catch (e: any) {
      toast.error('Donation not found or no longer available.');
      navigate('/discover');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonation();
  }, [id, user]);

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !donation) return;

    if (claimQuantity <= 0 || claimQuantity > donation.remaining_quantity) {
      toast.error(`Please request between 1 and ${donation.remaining_quantity} portions.`);
      return;
    }
    if (!safetyConfirmed) {
      toast.error('You must accept the food safety handling checklist before claiming.');
      return;
    }

    setSubmittingClaim(true);
    try {
      await requestApi.create(id, {
        requested_quantity: claimQuantity,
        pickup_estimated_time: pickupEstimatedTime || undefined,
        requester_notes: requesterNotes.trim() || undefined,
      });

      toast.success('Surplus food request submitted! Donor has been notified.');
      setClaimModalOpen(false);
      fetchDonation();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to submit food claim.');
    } finally {
      setSubmittingClaim(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#1B4332]/20 border-t-[#1B4332] rounded-full animate-spin" />
        <p className="mt-3 text-xs font-semibold text-stone-500">Loading donation details...</p>
      </div>
    );
  }

  if (!donation) return null;

  const deadline = new Date(donation.collection_deadline);
  const now = new Date();
  const diffHours = (deadline.getTime() - now.getTime()) / (1000 * 3600);
  const isExpired = diffHours <= 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-[#1B4332] mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to listings
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Image and Details */}
        <div className="lg:col-span-8 space-y-8">
          {/* Main Visual Banner */}
          <div className="relative h-80 sm:h-96 rounded-3xl overflow-hidden bg-stone-100 border border-stone-200 shadow-md">
            {donation.image_url ? (
              <img
                src={donation.image_url}
                alt={donation.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#FAF7F2] to-[#EAE3D2] text-[#1B4332]">
                <Utensils className="w-16 h-16 opacity-30 mb-2" />
                <span className="text-sm font-bold tracking-widest uppercase text-stone-500">
                  {donation.category.replace(/_/g, ' ')}
                </span>
              </div>
            )}

            <div className="absolute top-4 left-4 flex gap-2">
              <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-[#1B4332] text-white shadow-md">
                {donation.category.replace(/_/g, ' ')}
              </span>
              <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-white text-stone-800 shadow-md">
                {donation.storage_condition}
              </span>
            </div>

            <div className="absolute top-4 right-4">
              <span
                className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-md flex items-center gap-1.5 ${
                  isExpired ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                {isExpired ? 'Listing Expired' : `Deadline: ${new Date(donation.collection_deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
              </span>
            </div>
          </div>

          {/* Title and Description */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/80 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-heading">
                  {donation.title}
                </h1>
                <p className="text-xs text-stone-500 mt-1 flex items-center gap-2">
                  <span>Listed on {new Date(donation.created_at).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>Status: <strong className="text-emerald-800 font-bold">{donation.status}</strong></span>
                </p>
              </div>

              <button
                onClick={() => setSafetyModalOpen(true)}
                className="self-start sm:self-auto text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                Report Safety Issue
              </button>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Description</h3>
              <p className="text-stone-700 text-sm leading-relaxed whitespace-pre-line">
                {donation.description}
              </p>
            </div>

            {/* Special handling */}
            {donation.special_handling_instructions && (
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900">
                <span className="font-bold block mb-1">Special Handling Instructions:</span>
                <p>{donation.special_handling_instructions}</p>
              </div>
            )}
          </div>

          {/* Food Safety & Allergen Specifications */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/80 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-stone-900 font-heading flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
              Food Safety & Preparation Specifications
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200">
                <span className="text-[11px] font-bold uppercase text-stone-400 block mb-1">
                  Storage Condition
                </span>
                <p className="font-bold text-stone-800 text-sm">{donation.storage_condition}</p>
                {donation.storage_temperature_celsius !== undefined && donation.storage_temperature_celsius !== null && (
                  <p className="text-xs text-stone-500 mt-0.5">
                    Target Temp: {donation.storage_temperature_celsius}°C
                  </p>
                )}
              </div>

              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200">
                <span className="text-[11px] font-bold uppercase text-stone-400 block mb-1">
                  Preparation Time
                </span>
                <p className="font-bold text-stone-800 text-sm">
                  {donation.cooked_or_prepared_at
                    ? new Date(donation.cooked_or_prepared_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'N/A (Standard Packaging)'}
                </p>
                <p className="text-xs text-stone-500 mt-0.5">
                  {donation.category === 'COOKED_MEALS' ? 'Max 4h ambient limit enforced' : 'Fresh stock'}
                </p>
              </div>

              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200">
                <span className="text-[11px] font-bold uppercase text-stone-400 block mb-1">
                  Perishability
                </span>
                <p className="font-bold text-stone-800 text-sm">
                  {donation.is_perishable ? 'High Perishability' : 'Shelf-Stable'}
                </p>
                <p className="text-xs text-stone-500 mt-0.5">Immediate consumption advised</p>
              </div>
            </div>

            {/* Allergens Checklist */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500 block mb-2">
                Declared Allergens
              </span>
              {donation.allergens && donation.allergens.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {donation.allergens.map((alg) => (
                    <span
                      key={alg}
                      className="px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-full text-xs font-bold"
                    >
                      ⚠️ Contains: {alg}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-emerald-800 bg-emerald-50 px-3 py-2 rounded-xl inline-block border border-emerald-200">
                  ✓ Donor has declared no common major allergens in this batch.
                </p>
              )}
            </div>
          </div>

          {/* AI Match Recommendation (if available) */}
          {matchData && (
            <div className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl border border-amber-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-600" />
                <h4 className="font-bold text-stone-900 text-sm">
                  AI Match Recommendation Score: {Math.round(matchData.match_score)}%
                </h4>
              </div>
              <p className="text-xs text-stone-700 leading-relaxed">
                {matchData.recommendation || matchData.explanation}
              </p>
              {matchData.reasons && (
                <ul className="text-xs text-stone-600 space-y-1 pl-4 list-disc">
                  {matchData.reasons.map((r: string, idx: number) => (
                    <li key={idx}>{r}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Claim Card & Logistics */}
        <div className="lg:col-span-4 space-y-6">
          {/* Action Box */}
          <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-lg sticky top-28 space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Surplus Inventory
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-[#1B4332] font-heading">
                  {donation.remaining_quantity}
                </span>
                <span className="text-stone-500 font-semibold text-sm">
                  / {donation.quantity} {donation.unit} available
                </span>
              </div>
            </div>

            {/* Collection Deadline Reminder */}
            <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-600 shrink-0" />
              <div className="text-xs">
                <p className="font-bold text-stone-800">Collection Deadline</p>
                <p className="text-stone-500">
                  {new Date(donation.collection_deadline).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Claim CTA */}
            {isExpired ? (
              <div className="p-4 bg-stone-100 rounded-2xl text-center text-xs font-bold text-stone-500">
                This listing collection window has closed.
              </div>
            ) : donation.remaining_quantity <= 0 ? (
              <div className="p-4 bg-amber-50 text-amber-800 rounded-2xl text-center text-xs font-bold border border-amber-200">
                Fully Reserved by Community Charities
              </div>
            ) : !user ? (
              <div className="space-y-3">
                <Link
                  to={`/login?redirect=/donations/${donation.id}`}
                  className="w-full text-center block py-3 px-4 font-bold text-white bg-[#1B4332] hover:bg-[#2D6A4F] rounded-2xl shadow transition-colors text-sm"
                >
                  Sign In to Claim Food
                </Link>
                <p className="text-[11px] text-stone-400 text-center">
                  Only verified NGOs and community kitchens can claim surplus food.
                </p>
              </div>
            ) : isReceiver ? (
              isVerified ? (
                <button
                  onClick={() => setClaimModalOpen(true)}
                  className="w-full py-3.5 px-6 font-bold text-white bg-[#1B4332] hover:bg-[#2D6A4F] rounded-2xl shadow-lg shadow-emerald-950/20 transition-all hover:scale-[1.02] text-sm"
                >
                  Request / Reserve Surplus
                </button>
              ) : (
                <div className="p-4 bg-amber-50 rounded-2xl text-xs text-amber-900 border border-amber-200">
                  <p className="font-bold">Organization Verification Pending</p>
                  <p className="text-[11px] text-stone-600 mt-1">
                    Your FSSAI/NGO verification must be approved by an administrator before claiming food.
                  </p>
                </div>
              )
            ) : (
              <div className="p-4 bg-stone-50 rounded-2xl text-xs text-stone-600 text-center">
                Logged in as a food donor ({user.role}). Switch to an NGO receiver account to claim surplus.
              </div>
            )}

            {/* Donor & Collection Logistics */}
            <div className="pt-4 border-t border-stone-100 space-y-3 text-xs">
              <h4 className="font-bold text-stone-900 uppercase tracking-wider text-[11px]">
                Pickup Location & Donor
              </h4>
              <div className="flex items-start gap-2.5 text-stone-700">
                <Building2 className="w-4 h-4 text-[#1B4332] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">{donation.donor_organization?.name}</p>
                  <p className="text-stone-500 text-[11px]">{donation.collection_address}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-stone-700">
                <Phone className="w-4 h-4 text-[#1B4332] shrink-0" />
                <span>{donation.donor_contact_phone}</span>
              </div>

              <div className="flex items-center gap-2.5 text-stone-700">
                <Mail className="w-4 h-4 text-[#1B4332] shrink-0" />
                <span>{donation.donor_contact_email}</span>
              </div>

              {/* Interactive Route Navigation Trigger */}
              <button
                type="button"
                onClick={() => setRouteModalOpen(true)}
                className="w-full mt-2 py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-[#1B4332] rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border border-emerald-200 transition-colors shadow-sm"
              >
                <Navigation className="w-3.5 h-3.5 text-emerald-700" />
                Plan Rescue Route & Turn-by-Turn GPS
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Safety Report Modal */}
      <SafetyReportModal
        donationId={donation.id}
        donationTitle={donation.title}
        isOpen={safetyModalOpen}
        onClose={() => setSafetyModalOpen(false)}
      />

      {/* Rescue Route & Navigation Modal */}
      <RescueRouteModal
        isOpen={routeModalOpen}
        onClose={() => setRouteModalOpen(false)}
        donation={donation}
      />

      {/* Claim Modal */}
      {claimModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full border border-stone-200 shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 bg-[#1B4332] text-white">
              <h3 className="font-bold text-lg font-heading">Claim Surplus Food</h3>
              <p className="text-xs text-emerald-200 mt-0.5">
                Atomic quantity reservation with 6-digit OTP verification
              </p>
            </div>

            <form onSubmit={handleClaimSubmit} className="p-6 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Quantity Required ({donation.unit}) *
                </label>
                <input
                  type="number"
                  min={1}
                  max={donation.remaining_quantity}
                  value={claimQuantity}
                  onChange={(e) => setClaimQuantity(parseInt(e.target.value) || 0)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 focus:border-[#1B4332] outline-none text-base font-bold"
                  required
                />
                <span className="text-[11px] text-stone-500">
                  Maximum available: {donation.remaining_quantity} {donation.unit}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Estimated Pickup Time
                </label>
                <input
                  type="datetime-local"
                  value={pickupEstimatedTime}
                  onChange={(e) => setPickupEstimatedTime(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 focus:border-[#1B4332] outline-none text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Logistics Notes for Donor
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bringing insulated van, ETA 45 mins"
                  value={requesterNotes}
                  onChange={(e) => setRequesterNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 focus:border-[#1B4332] outline-none text-xs"
                />
              </div>

              {/* Safety acceptance */}
              <label className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={safetyConfirmed}
                  onChange={(e) => setSafetyConfirmed(e.target.checked)}
                  className="mt-0.5 text-emerald-700 accent-[#1B4332]"
                />
                <span className="text-xs text-emerald-950 leading-relaxed">
                  I certify our NGO will transport this food in clean, temperature-safe containers and distribute it promptly in compliance with FSSAI hygiene rules.
                </span>
              </label>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setClaimModalOpen(false)}
                  disabled={submittingClaim}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingClaim}
                  className="px-6 py-2.5 text-xs font-bold text-white bg-[#1B4332] hover:bg-[#2D6A4F] rounded-xl shadow disabled:opacity-50"
                >
                  {submittingClaim ? 'Submitting...' : 'Confirm Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
