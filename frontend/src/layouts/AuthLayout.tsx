import React from 'react';
import { Outlet, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  UtensilsCrossed, 
  ShieldCheck, 
  ArrowLeft, 
  HeartHandshake, 
  CheckCircle2, 
  Sparkles 
} from 'lucide-react';

export const AuthLayout: React.FC = () => {
  const { user, isLoading } = useAuth();

  // If already logged in, redirect straight to their dashboard!
  if (!isLoading && user) {
    if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'DONOR') return <Navigate to="/donor/dashboard" replace />;
    return <Navigate to="/receiver/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col justify-between">
      {/* Top Simple Header */}
      <header className="h-20 px-6 sm:px-12 flex items-center justify-between border-b border-stone-200/80 bg-white/70 backdrop-blur-md">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] flex items-center justify-center text-white shadow-md">
            <UtensilsCrossed className="w-5 h-5 text-[#52B788]" />
          </div>
          <span className="text-xl font-extrabold text-[#1B4332] font-heading">
            SharePlate
          </span>
        </Link>

        <Link
          to="/"
          className="text-xs font-bold text-stone-600 hover:text-[#1B4332] flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Homepage</span>
        </Link>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Decorative/Branding Column (Desktop only) */}
          <div className="hidden lg:flex lg:col-span-5 flex-col justify-between space-y-8 p-8 bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] text-white rounded-3xl shadow-xl">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-[11px] font-bold text-emerald-300 mb-6">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>FSSAI Certified Rescue Protocol</span>
              </div>
              <h2 className="text-3xl font-extrabold font-heading leading-tight">
                Good food deserves another destination.
              </h2>
              <p className="text-xs text-stone-200 mt-3 leading-relaxed">
                Connect your commercial kitchen or charitable organization to eliminate surplus food waste safely and transparently.
              </p>
            </div>

            <div className="space-y-4 text-xs text-stone-200">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#52B788] shrink-0 mt-0.5" />
                <span>Strict 4-hour ambient cooked meal limits enforced.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#52B788] shrink-0 mt-0.5" />
                <span>6-digit cryptographically random handover verification OTPs.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#52B788] shrink-0 mt-0.5" />
                <span>Zero guesswork with AI photo category recognition.</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 text-xs">
              <p className="italic">
                "SharePlate has allowed us to bridge hundreds of corporate banquet portions every week directly to local shelter kitchens before the safety window closes."
              </p>
              <p className="mt-2 font-bold text-emerald-300 text-[11px]">
                — Bangalore Hospitality Alliance
              </p>
            </div>
          </div>

          {/* Right Column: Form Outlet */}
          <div className="lg:col-span-7 w-full">
            <Outlet />
          </div>
        </div>
      </div>

      {/* Simple Auth Footer */}
      <footer className="py-4 text-center text-xs text-stone-400 border-t border-stone-200/60">
        © {new Date().getFullYear()} SharePlate Surplus Food Rescue • In compliance with FSSAI Regulations (2019)
      </footer>
    </div>
  );
};
