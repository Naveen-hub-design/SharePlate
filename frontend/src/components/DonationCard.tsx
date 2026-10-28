import React from 'react';
import { Link } from 'react-router-dom';
import type { Donation } from '../types';
import { 
  Clock, 
  MapPin, 
  Utensils, 
  Thermometer, 
  AlertCircle, 
  CheckCircle,
  Building2,
  Sparkles
} from 'lucide-react';

interface DonationCardProps {
  donation: Donation;
  showMatchScore?: boolean;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  COOKED_MEALS: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Cooked Meals' },
  BAKERY_AND_BREAD: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Bakery & Bread' },
  FRESH_PRODUCE: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Fresh Produce' },
  PACKAGED_GOODS: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Packaged Goods' },
  DAIRY_PRODUCTS: { bg: 'bg-indigo-100', text: 'text-indigo-800', label: 'Dairy' },
  BEVERAGES: { bg: 'bg-cyan-100', text: 'text-cyan-800', label: 'Beverages' },
  RAW_MEAT_OR_SEAFOOD: { bg: 'bg-rose-100', text: 'text-rose-800', label: 'Raw Meat/Seafood' },
  FROZEN_ITEMS: { bg: 'bg-sky-100', text: 'text-sky-800', label: 'Frozen Items' },
  OTHER: { bg: 'bg-stone-100', text: 'text-stone-800', label: 'Other' },
};

export const DonationCard: React.FC<DonationCardProps> = ({ donation, showMatchScore = false }) => {
  const cat = CATEGORY_COLORS[donation.category] || CATEGORY_COLORS.OTHER;
  
  // Expiry calculation
  const deadline = new Date(donation.collection_deadline);
  const now = new Date();
  const diffMinutes = Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60));
  const isExpired = diffMinutes <= 0;
  const isUrgent = diffMinutes > 0 && diffMinutes <= 120; // less than 2 hours

  const formatRemainingTime = () => {
    if (isExpired) return 'Expired';
    const hours = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;
    if (hours === 0) return `${mins}m left`;
    return `${hours}h ${mins}m left`;
  };

  const remainingPercent = Math.max(
    0,
    Math.min(100, (donation.remaining_quantity / donation.quantity) * 100)
  );

  return (
    <div className="group bg-white rounded-2xl border border-stone-200/80 hover:border-emerald-300 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col overflow-hidden">
      {/* Photo Header */}
      <div className="relative h-48 bg-stone-100 overflow-hidden">
        {donation.image_url ? (
          <img
            src={donation.image_url.startsWith('http') ? donation.image_url : donation.image_url}
            alt={donation.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              // fallback if broken image
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#FAF7F2] to-[#EAE3D2] text-[#1B4332]">
            <Utensils className="w-12 h-12 opacity-40 mb-1" />
            <span className="text-xs font-bold tracking-wider uppercase text-stone-500">
              {cat.label}
            </span>
          </div>
        )}

        {/* Category Pill */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold shadow-sm ${cat.bg} ${cat.text}`}>
            {cat.label}
          </span>
          {donation.storage_condition === 'REFRIGERATED' && (
            <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 flex items-center gap-1 shadow-sm">
              <Thermometer className="w-3 h-3" /> Chill
            </span>
          )}
        </div>

        {/* Expiry Badge */}
        <div className="absolute top-3 right-3">
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm ${
              isExpired
                ? 'bg-stone-800 text-stone-200'
                : isUrgent
                ? 'bg-red-500 text-white animate-pulse'
                : 'bg-emerald-700 text-white'
            }`}
          >
            <Clock className="w-3 h-3" />
            {formatRemainingTime()}
          </span>
        </div>

        {/* AI Match Score Tag (if applicable) */}
        {showMatchScore && donation.match_score !== undefined && (
          <div className="absolute bottom-3 left-3 bg-stone-900/85 backdrop-blur-md text-amber-300 px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 shadow-md">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{Math.round(donation.match_score)}% Match</span>
          </div>
        )}
      </div>

      {/* Body Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Organization Name */}
          <div className="flex items-center gap-1.5 text-xs text-stone-500 font-semibold mb-1">
            <Building2 className="w-3.5 h-3.5 text-stone-400" />
            <span className="truncate">
              {donation.donor_organization?.name || 'Verified Food Donor'}
            </span>
            {donation.distance_km !== undefined && (
              <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-bold ml-auto shrink-0">
                {donation.distance_km} km away
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-bold text-stone-900 text-base leading-snug group-hover:text-[#1B4332] transition-colors line-clamp-1">
            {donation.title}
          </h3>

          {/* Description */}
          <p className="text-xs text-stone-600 mt-1 line-clamp-2 leading-relaxed">
            {donation.description}
          </p>

          {/* Allergens Notice if any */}
          {donation.allergens && donation.allergens.length > 0 && (
            <div className="mt-2.5 flex items-center gap-1 text-[11px] text-amber-800 bg-amber-50/80 px-2 py-1 rounded-lg border border-amber-200/50">
              <AlertCircle className="w-3 h-3 shrink-0 text-amber-600" />
              <span className="truncate">Allergens: {donation.allergens.join(', ')}</span>
            </div>
          )}
        </div>

        {/* Portions Bar & Action */}
        <div className="mt-4 pt-4 border-t border-stone-100">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-stone-700">Available Surplus</span>
            <span className="font-bold text-[#1B4332]">
              {donation.remaining_quantity} / {donation.quantity} {donation.unit}
            </span>
          </div>

          {/* Progress track */}
          <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden mb-4">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                remainingPercent > 50
                  ? 'bg-emerald-600'
                  : remainingPercent > 20
                  ? 'bg-amber-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${remainingPercent}%` }}
            />
          </div>

          {/* Link to detail */}
          <Link
            to={`/donations/${donation.id}`}
            className="w-full text-center block py-2.5 px-4 text-xs font-bold text-white bg-[#1B4332] hover:bg-[#2D6A4F] rounded-xl shadow-sm transition-all group-hover:shadow-md"
          >
            View Details & Claim
          </Link>
        </div>
      </div>
    </div>
  );
};
