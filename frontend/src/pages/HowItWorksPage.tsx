import React from 'react';
import { Link } from 'react-router-dom';
import { 
  UtensilsCrossed, 
  Sparkles, 
  KeyRound, 
  ShieldCheck, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  Building2, 
  HeartHandshake, 
  ArrowRight,
  Thermometer
} from 'lucide-react';

export const HowItWorksPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full">
          Standardized Operating Protocol
        </span>
        <h1 className="text-4xl font-extrabold text-stone-900 mt-3 font-heading">
          How SharePlate Rescues Food
        </h1>
        <p className="text-stone-600 text-base mt-2">
          From commercial kitchen surplus to verified community distribution: an auditable, safe, and transparent workflow.
        </p>
      </div>

      {/* Two Column Tracks: Donors vs Receivers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-16">
        {/* Track 1: For Commercial Food Donors */}
        <div className="bg-white p-8 rounded-3xl border border-stone-200/80 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-800">
              <Building2 className="w-5 h-5 text-orange-700" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-stone-900">For Food Donors</h3>
              <p className="text-xs text-stone-500">Restaurants, hotels, caterers, bakeries</p>
            </div>
          </div>

          <div className="space-y-6 text-sm">
            <div className="flex items-start gap-4">
              <span className="w-8 h-8 rounded-xl bg-[#1B4332] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                1
              </span>
              <div>
                <h4 className="font-bold text-stone-900">List Surplus in Seconds</h4>
                <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                  Snap a photo of remaining food trays. Our AI assistant analyzes the image to suggest category, description, and allergen flags. Enter available portions and pickup deadline.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <span className="w-8 h-8 rounded-xl bg-[#1B4332] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                2
              </span>
              <div>
                <h4 className="font-bold text-stone-900">FSSAI Safety Validation</h4>
                <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                  For cooked meals held at ambient temperatures, the platform enforces a strict maximum 4-hour collection deadline from the cooking timestamp.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <span className="w-8 h-8 rounded-xl bg-[#1B4332] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                3
              </span>
              <div>
                <h4 className="font-bold text-stone-900">Approve Incoming Claims</h4>
                <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                  Review requests from nearby verified recipient NGOs. One click approves the claim and initiates atomic quantity reservation.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <span className="w-8 h-8 rounded-xl bg-[#1B4332] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                4
              </span>
              <div>
                <h4 className="font-bold text-stone-900">Verify Physical Handover with OTP</h4>
                <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                  When the collector arrives, enter their 6-digit OTP code into your dashboard to confirm collection, record temperatures, and complete the legal chain of custody.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-stone-100">
            <Link
              to="/register?role=DONOR"
              className="inline-flex items-center gap-2 text-xs font-bold text-white bg-[#1B4332] hover:bg-[#2D6A4F] px-5 py-2.5 rounded-xl shadow transition-colors"
            >
              Register as Donor <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Track 2: For Recipient Charities */}
        <div className="bg-white p-8 rounded-3xl border border-stone-200/80 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800">
              <HeartHandshake className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-stone-900">For Recipient NGOs</h3>
              <p className="text-xs text-stone-500">Shelters, community kitchens, charitable trusts</p>
            </div>
          </div>

          <div className="space-y-6 text-sm">
            <div className="flex items-start gap-4">
              <span className="w-8 h-8 rounded-xl bg-[#1B4332] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                1
              </span>
              <div>
                <h4 className="font-bold text-stone-900">Organization Verification</h4>
                <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                  Submit your NGO registration (12A/80G or Darpan) or FSSAI registration. Platform admins verify credentials before live food claims are enabled.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <span className="w-8 h-8 rounded-xl bg-[#1B4332] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                2
              </span>
              <div>
                <h4 className="font-bold text-stone-900">Discover Nearby Surplus</h4>
                <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                  Search active listings via the interactive map or list view. View explainable AI match scores that prioritize nearest kitchens, optimal batch size, and urgent deadlines.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <span className="w-8 h-8 rounded-xl bg-[#1B4332] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                3
              </span>
              <div>
                <h4 className="font-bold text-stone-900">Request & Receive 6-Digit OTP</h4>
                <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                  Specify exact portions needed. Once approved by the donor, your dashboard generates a unique 6-digit OTP code to authorize pickup.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <span className="w-8 h-8 rounded-xl bg-[#1B4332] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                4
              </span>
              <div>
                <h4 className="font-bold text-stone-900">Hygienic Transport & Distribution</h4>
                <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                  Collect surplus in food-grade, insulated containers. Present the OTP to the donor staff and distribute meals immediately to those in need.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-stone-100">
            <Link
              to="/register?role=RECEIVER"
              className="inline-flex items-center gap-2 text-xs font-bold text-white bg-[#1B4332] hover:bg-[#2D6A4F] px-5 py-2.5 rounded-xl shadow transition-colors"
            >
              Register as Recipient NGO <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Safety Highlight */}
      <div className="p-8 bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] rounded-3xl text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-xl font-bold font-heading">
            Strict Food Safety Standards
          </h3>
          <p className="text-xs text-stone-200 mt-1 max-w-xl leading-relaxed">
            Every transaction on SharePlate complies with the Food Safety and Standards (Recovery of Surplus Food) Regulations, 2019. Read our full regulatory safety guide.
          </p>
        </div>
        <Link
          to="/safety"
          className="px-6 py-3 bg-white text-stone-900 rounded-xl text-xs font-bold hover:bg-stone-100 transition-colors shrink-0"
        >
          View Food Safety Guide
        </Link>
      </div>
    </div>
  );
};
