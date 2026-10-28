import React from 'react';
import { 
  ShieldCheck, 
  Clock, 
  Thermometer, 
  AlertTriangle, 
  CheckCircle2, 
  Award, 
  FileText, 
  Utensils, 
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const SafetyGuidancePage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-800 mx-auto mb-4">
          <ShieldCheck className="w-7 h-7 text-emerald-700" />
        </div>
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full">
          FSSAI Regulatory Compliance
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 mt-3 font-heading">
          Food Safety Standards & Regulatory Guidance
        </h1>
        <p className="text-stone-600 text-sm mt-2 leading-relaxed">
          Operational safety framework governing commercial surplus food recovery under the Food Safety and Standards Authority of India (FSSAI) Regulations, 2019.
        </p>
      </div>

      <div className="space-y-12">
        {/* Core Principles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white rounded-3xl border border-stone-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-800">
              <Clock className="w-5 h-5 text-amber-700" />
            </div>
            <h3 className="font-bold text-stone-900 text-base">The 4-Hour Ambient Rule</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Cooked food held between 5°C and 60°C (the microbial danger zone) must be collected, distributed, and consumed within four hours from the cooking timestamp.
            </p>
          </div>

          <div className="p-6 bg-white rounded-3xl border border-stone-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-100 flex items-center justify-center text-sky-800">
              <Thermometer className="w-5 h-5 text-sky-700" />
            </div>
            <h3 className="font-bold text-stone-900 text-base">Temperature Control</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Perishable surplus must be held at or below 5°C (refrigerated) or maintained continuously at or above 60°C (hot holding). Temperature is recorded at physical handover.
            </p>
          </div>

          <div className="p-6 bg-white rounded-3xl border border-stone-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-800">
              <AlertTriangle className="w-5 h-5 text-rose-700" />
            </div>
            <h3 className="font-bold text-stone-900 text-base">Mandatory Allergen Labeling</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Donors are legally required to disclose the presence of common major allergens (dairy, peanuts, tree nuts, gluten, eggs, soy, shellfish) on every listing.
            </p>
          </div>
        </div>

        {/* Detailed Guidelines Section */}
        <div className="bg-white p-8 rounded-3xl border border-stone-200/80 shadow-sm space-y-8">
          <div>
            <h2 className="text-xl font-bold text-stone-900 font-heading mb-3 flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-800" />
              1. Eligible vs Ineligible Food Surplus
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200">
                <h4 className="font-bold text-emerald-950 mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" /> Permissible Surplus Food
                </h4>
                <ul className="space-y-1.5 text-emerald-900">
                  <li>• Surplus cooked banquets and cafeteria meals within the 4-hour window</li>
                  <li>• Fresh baked bread, pastries, and unfilled bakery items</li>
                  <li>• Fresh uncut or properly sanitized fruits and vegetables</li>
                  <li>• Sealed, unexpired packaged goods with intact original manufacturer seals</li>
                  <li>• Pasteurized dairy held continuously below 5°C</li>
                </ul>
              </div>

              <div className="p-4 bg-red-50/60 rounded-2xl border border-red-200">
                <h4 className="font-bold text-red-950 mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-700" /> Prohibited from Platform
                </h4>
                <ul className="space-y-1.5 text-red-900">
                  <li>• Plate scraps or partially consumed buffet customer servings</li>
                  <li>• Food showing off-odors, discoloration, or signs of mold / spoilage</li>
                  <li>• Unpasteurized raw milk or raw seafood held at room temperature</li>
                  <li>• Food past manufacturer 'Use-By' date</li>
                  <li>• Swollen, rusted, or leaking canned items</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-stone-900 font-heading mb-3 flex items-center gap-2">
              <Thermometer className="w-5 h-5 text-sky-800" />
              2. Packaging & Transportation Protocol
            </h2>
            <div className="space-y-2 text-xs text-stone-600 leading-relaxed">
              <p>
                • <strong>Food-Grade Packaging:</strong> Surplus food must be packed in clean, food-grade, food-contact approved containers (stainless steel vessels, food-grade plastic catering inserts, or sealed recyclable containers).
              </p>
              <p>
                • <strong>Insulated Transport:</strong> Recipient NGOs must transport cooked meals in insulated thermal bags or temperature-monitored vehicles to maintain hot food (&gt;60°C) or cold food (&lt;5°C) during transit.
              </p>
              <p>
                • <strong>Hygienic Handover:</strong> Handover personnel must follow personal hygiene protocols, wear clean aprons and hairnets where applicable, and maintain hands sanitized.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-stone-900 font-heading mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-stone-800" />
              3. Good Samaritan & Liability Protection
            </h2>
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-xs text-stone-700 space-y-2 leading-relaxed">
              <p>
                Under Section 5.3 of the FSSAI Surplus Food Regulations (2019), bona fide food business operators and recipient organizations who donate or distribute surplus food in good faith and in compliance with hygiene requirements are protected from civil and criminal liability, provided the food is handled safely.
              </p>
              <p className="text-[11px] text-stone-500">
                Notice: AI photo suggestions and matching algorithms assist with operational efficiency and must never replace qualified human sensory and temperature inspection.
              </p>
            </div>
          </div>
        </div>

        {/* External Resources */}
        <div className="p-6 bg-[#FAF7F2] rounded-3xl border border-[#EAE3D2] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div>
            <p className="font-bold text-stone-900">Official Regulatory Reference Documents</p>
            <p className="text-stone-500 mt-0.5">
              Read the complete statutory provisions directly from the Food Safety Authority of India.
            </p>
          </div>
          <a
            href="https://www.fssai.gov.in"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 bg-[#1B4332] text-white rounded-xl font-bold hover:bg-[#2D6A4F] transition-colors inline-flex items-center gap-1.5 shrink-0"
          >
            FSSAI Official Portal <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
