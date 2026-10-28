import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { donationApi, analyticsApi } from '../api/client';
import type { Donation, ImpactAnalytics } from '../types';
import { DonationCard } from '../components/DonationCard';
import { 
  UtensilsCrossed, 
  ArrowRight, 
  ShieldCheck, 
  HeartHandshake, 
  Leaf, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  Flame, 
  Building2, 
  Users,
  Award,
  ChevronRight
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [featuredDonations, setFeaturedDonations] = useState<Donation[]>([]);
  const [impact, setImpact] = useState<ImpactAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [donationsRes, impactRes] = await Promise.allSettled([
          donationApi.getDiscover({ limit: 3 }),
          analyticsApi.getImpact(),
        ]);

        if (donationsRes.status === 'fulfilled') {
          setFeaturedDonations(donationsRes.value.data.donations || []);
        }
        if (impactRes.status === 'fulfilled') {
          setImpact(impactRes.value.data.impact || null);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-24 lg:pt-20 lg:pb-32 bg-gradient-to-b from-[#F4EFE6] via-[#FAF7F2] to-[#FAF7F2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Headline & Action */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Trust Pill */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/80 text-emerald-900 border border-emerald-300/50 text-xs font-bold tracking-wide">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>Certified Food Rescue Compliant with FSSAI Regulations</span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-6xl font-extrabold text-[#1B4332] font-heading tracking-tight leading-[1.12]">
                Good food deserves <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1B4332] via-[#2D6A4F] to-[#D97706]">
                  another destination.
                </span>
              </h1>

              {/* Subheading */}
              <p className="text-lg sm:text-xl text-stone-600 max-w-2xl leading-relaxed">
                Connecting commercial kitchens, restaurants, and caterers with verified frontline charities to safely rescue surplus food within strict quality and temperature standards.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link
                  to="/discover"
                  className="w-full sm:w-auto px-7 py-3.5 text-base font-bold text-white bg-[#1B4332] hover:bg-[#2D6A4F] rounded-2xl shadow-lg shadow-emerald-950/25 transition-all hover:scale-[1.02] flex items-center justify-center gap-2 group"
                >
                  Discover Available Food
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  to="/register?role=DONOR"
                  className="w-full sm:w-auto px-7 py-3.5 text-base font-bold text-stone-800 bg-white hover:bg-stone-50 border-2 border-stone-200 rounded-2xl shadow-sm transition-all hover:border-[#1B4332] flex items-center justify-center gap-2"
                >
                  <UtensilsCrossed className="w-4 h-4 text-amber-600" />
                  Donate Surplus
                </Link>
              </div>

              {/* Guarantees */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs font-semibold text-stone-500">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Verified FSSAI Food Donors</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Max 4h Ambient Safety Window</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Secure 6-Digit OTP Handover</span>
                </div>
              </div>
            </div>

            {/* Right Column: Visual Card Showcase */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md bg-white p-6 rounded-3xl border border-stone-200 shadow-2xl shadow-emerald-950/10">
                <div className="flex items-center justify-between pb-4 border-b border-stone-100">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                      Live Surplus Feed
                    </span>
                  </div>
                  <span className="text-xs text-stone-400 font-medium">Bangalore Central</span>
                </div>

                <div className="mt-4 space-y-4">
                  <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EAE3D2]">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
                          Cooked Meals
                        </span>
                        <h4 className="font-bold text-stone-900 text-sm mt-1">
                          Fresh Biryani & Dal Makhani
                        </h4>
                        <p className="text-xs text-stone-500 mt-0.5">Taj West End Kitchen • 45 Portions</p>
                      </div>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">
                        1h 45m left
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EAE3D2]">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          Bakery & Bread
                        </span>
                        <h4 className="font-bold text-stone-900 text-sm mt-1">
                          Artisan Sourdough & Croissants
                        </h4>
                        <p className="text-xs text-stone-500 mt-0.5">Lavonne Cafe • 30 Units</p>
                      </div>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">
                        3h 10m left
                      </span>
                    </div>
                  </div>
                </div>

                {/* AI Assistant Badge Callout */}
                <div className="mt-5 p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-amber-200" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-stone-900">AI Assistant Integrated</p>
                    <p className="text-[11px] text-stone-600">
                      Auto-extracts food categories & suggests handling steps from photo.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Stats Banner */}
      <section className="py-12 bg-[#1B4332] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="p-4">
              <p className="text-3xl sm:text-4xl font-extrabold text-[#52B788] font-heading">
                {impact ? Math.round(impact.total_quantity_collected).toLocaleString() : '12,450+'}
              </p>
              <p className="text-xs sm:text-sm font-semibold text-stone-300 mt-1 uppercase tracking-wider">
                Portions Rescued
              </p>
            </div>
            <div className="p-4">
              <p className="text-3xl sm:text-4xl font-extrabold text-amber-400 font-heading">
                {impact ? (Math.round(impact.estimated_co2_kg_diverted) / 1000).toFixed(1) + 't' : '15.8t'}
              </p>
              <p className="text-xs sm:text-sm font-semibold text-stone-300 mt-1 uppercase tracking-wider">
                CO2 Diverted
              </p>
            </div>
            <div className="p-4">
              <p className="text-3xl sm:text-4xl font-extrabold text-[#52B788] font-heading">
                {impact ? impact.completed_donations_count : '380+'}
              </p>
              <p className="text-xs sm:text-sm font-semibold text-stone-300 mt-1 uppercase tracking-wider">
                Successful Handoveers
              </p>
            </div>
            <div className="p-4">
              <p className="text-3xl sm:text-4xl font-extrabold text-amber-400 font-heading">
                100%
              </p>
              <p className="text-xs sm:text-sm font-semibold text-stone-300 mt-1 uppercase tracking-wider">
                FSSAI Verified NGOs
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
              Seamless Workflow
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900 mt-3 font-heading">
              How SharePlate Works
            </h2>
            <p className="text-stone-600 text-base mt-2">
              A reliable, auditable four-step protocol designed to prevent food waste while upholding rigorous public health standards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {/* Step 1 */}
            <div className="p-6 bg-[#FAF7F2] rounded-3xl border border-stone-200 relative group hover:border-[#1B4332] transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-[#1B4332] text-white flex items-center justify-center font-bold text-lg mb-4">
                1
              </div>
              <h3 className="font-bold text-stone-900 text-lg mb-2">Publish Surplus</h3>
              <p className="text-stone-600 text-xs leading-relaxed">
                Donors snap a photo, input portions, allergens, and preparation time. AI assists with tagging, while safety rules enforce the 4-hour ambient window.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 bg-[#FAF7F2] rounded-3xl border border-stone-200 relative group hover:border-[#1B4332] transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-[#1B4332] text-white flex items-center justify-center font-bold text-lg mb-4">
                2
              </div>
              <h3 className="font-bold text-stone-900 text-lg mb-2">Smart Match & Claim</h3>
              <p className="text-stone-600 text-xs leading-relaxed">
                Eligible verified NGOs receive immediate notifications based on distance and capacity. Receivers request exact portions required.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 bg-[#FAF7F2] rounded-3xl border border-stone-200 relative group hover:border-[#1B4332] transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-[#1B4332] text-white flex items-center justify-center font-bold text-lg mb-4">
                3
              </div>
              <h3 className="font-bold text-stone-900 text-lg mb-2">6-Digit Handover OTP</h3>
              <p className="text-stone-600 text-xs leading-relaxed">
                Upon approval, an atomic reservation locks the quantity to prevent double claims and generates a cryptographically random pickup OTP.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-6 bg-[#FAF7F2] rounded-3xl border border-stone-200 relative group hover:border-[#1B4332] transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-[#1B4332] text-white flex items-center justify-center font-bold text-lg mb-4">
                4
              </div>
              <h3 className="font-bold text-stone-900 text-lg mb-2">Verified Handover</h3>
              <p className="text-stone-600 text-xs leading-relaxed">
                During physical collection, the donor enters the receiver’s code, logs temperature, and signs off on hygiene before completion.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Live Surplus Section */}
      <section className="py-20 bg-[#FAF7F2] border-t border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-800">
                Fresh Listings
              </span>
              <h2 className="text-3xl font-extrabold text-stone-900 mt-1 font-heading">
                Surplus Ready For Collection
              </h2>
            </div>
            <Link
              to="/discover"
              className="mt-4 sm:mt-0 inline-flex items-center gap-1.5 text-sm font-bold text-[#1B4332] hover:text-[#2D6A4F]"
            >
              View all available food <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {featuredDonations.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-stone-200">
              <UtensilsCrossed className="w-12 h-12 text-stone-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-stone-700">All surplus currently collected</h3>
              <p className="text-stone-500 text-xs mt-1">Check back shortly or register for alerts.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredDonations.map((d) => (
                <DonationCard key={d.id} donation={d} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Food Safety & FSSAI Standards Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                <Award className="w-4 h-4 text-emerald-600" />
                <span>Food Safety First</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900 font-heading leading-tight">
                Designed Around Indian FSSAI Surplus Food Regulations
              </h2>
              <p className="text-stone-600 text-sm leading-relaxed">
                Under the Food Safety and Standards (Recovery & Distribution of Surplus Food) Regulations, 2019, commercial surplus must adhere to rigorous hygiene, time-temperature controls, and allergen labeling.
              </p>

              <div className="space-y-3 pt-2">
                <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 flex items-start gap-3">
                  <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-stone-900 text-xs">Strict 4-Hour Ambient Window</h4>
                    <p className="text-stone-600 text-xs mt-0.5">
                      Cooked food maintained at room temperature must be consumed or refrigerated within 4 hours of preparation.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-stone-900 text-xs">Mandatory Allergen Disclosures</h4>
                    <p className="text-stone-600 text-xs mt-0.5">
                      Donors must declare allergens (dairy, peanuts, tree nuts, gluten, soy) before a listing can be published.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 flex items-start gap-3">
                  <Building2 className="w-5 h-5 text-[#1B4332] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-stone-900 text-xs">Verified Organization Credentials</h4>
                    <p className="text-stone-600 text-xs mt-0.5">
                      Both food businesses and recipient charities undergo administrative FSSAI license & trust validation.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <Link
                  to="/safety"
                  className="inline-flex items-center gap-2 text-sm font-bold text-[#1B4332] hover:text-[#2D6A4F]"
                >
                  Read Full Food Safety Guidance <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-6 bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] p-8 sm:p-10 rounded-3xl text-white shadow-xl">
              <h3 className="text-2xl font-bold font-heading mb-4">
                Join the Surplus Food Rescue Movement
              </h3>
              <p className="text-stone-200 text-sm leading-relaxed mb-6">
                Whether you are a commercial kitchen with leftover banquets or a verified NGO serving vulnerable communities, SharePlate provides the technology to make food rescue fast, safe, and transparent.
              </p>

              <div className="space-y-4">
                <Link
                  to="/register?role=DONOR"
                  className="block w-full text-center py-3.5 px-6 font-bold text-stone-900 bg-white hover:bg-stone-100 rounded-2xl shadow transition-colors"
                >
                  Register as Food Donor
                </Link>
                <Link
                  to="/register?role=RECEIVER"
                  className="block w-full text-center py-3.5 px-6 font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl transition-colors"
                >
                  Register as Recipient NGO / Kitchen
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
