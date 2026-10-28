import React from 'react';
import { AlertCircle, FileText, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const PrivacyPolicyPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-[#1B4332] mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Go Back
      </button>

      <div className="bg-amber-50 p-4 rounded-2xl border border-amber-300 text-amber-900 text-xs mb-8 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">DRAFT DOCUMENT — CLEARLY MARKED FOR LEGAL REVIEW</p>
          <p className="mt-0.5 text-stone-600">
            This document represents a provisional policy draft designed for the SharePlate platform demonstration. It must undergo formal legal counsel review prior to general commercial deployment.
          </p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-stone-200/80 shadow-sm space-y-6 text-sm text-stone-700 leading-relaxed">
        <h1 className="text-3xl font-extrabold text-stone-900 font-heading">
          Privacy Policy
        </h1>
        <p className="text-xs text-stone-400">Last updated: October 2026</p>

        <section className="space-y-2">
          <h2 className="font-bold text-stone-900 text-base">1. Information We Collect</h2>
          <p>
            SharePlate collects organization credentials, verified business addresses, representative contact names, phone numbers, and optional geolocation data necessary to coordinate food surplus collections.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-stone-900 text-base">2. Purpose of Processing</h2>
          <p>
            Contact details and locations are used strictly for matching nearby food donors with recipient charities and dispatching SMS/email handover confirmations.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-stone-900 text-base">3. Audit Logging & Security</h2>
          <p>
            All critical handovers, claim requests, and food safety reports are recorded in persistent audit logs with client IP addresses to maintain food safety chain of custody.
          </p>
        </section>
      </div>
    </div>
  );
};

export const TermsOfServicePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-[#1B4332] mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Go Back
      </button>

      <div className="bg-amber-50 p-4 rounded-2xl border border-amber-300 text-amber-900 text-xs mb-8 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">DRAFT DOCUMENT — CLEARLY MARKED FOR LEGAL REVIEW</p>
          <p className="mt-0.5 text-stone-600">
            This terms of service document is a template placeholder outlining food safety liability boundaries under FSSAI regulations.
          </p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-stone-200/80 shadow-sm space-y-6 text-sm text-stone-700 leading-relaxed">
        <h1 className="text-3xl font-extrabold text-stone-900 font-heading">
          Terms of Service & Food Safety Disclaimer
        </h1>
        <p className="text-xs text-stone-400">Last updated: October 2026</p>

        <section className="space-y-2">
          <h2 className="font-bold text-stone-900 text-base">1. Regulatory Compliance</h2>
          <p>
            All participating organizations agree to comply with the Food Safety and Standards (Recovery & Distribution of Surplus Food) Regulations, 2019, including temperature control, allergen labeling, and 4-hour ambient limits.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-stone-900 text-base">2. Limitation of Platform Liability</h2>
          <p>
            SharePlate functions as a technology intermediary connecting verified food donors with verified recipient organizations. The platform does not inspect, cook, transport, or warrant the fitness of any donated item.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-stone-900 text-base">3. AI Verification Advisory</h2>
          <p>
            AI recommendations for food categories or allergen tags are assistive suggestions and require explicit human verification prior to publishing.
          </p>
        </section>
      </div>
    </div>
  );
};
