import React from 'react';
import { Link } from 'react-router-dom';
import { UtensilsCrossed, ArrowLeft, Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-stone-200/90 shadow-xl text-center">
        <div className="w-16 h-16 bg-amber-50 text-amber-800 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-amber-200">
          <UtensilsCrossed className="w-8 h-8" />
        </div>

        <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-700 bg-amber-100/70 px-3 py-1 rounded-full">
          HTTP 404 • Page Not Found
        </span>

        <h1 className="text-2xl font-extrabold text-stone-900 mt-4 font-heading">
          Nothing to rescue here
        </h1>

        <p className="text-stone-600 text-sm mt-2 leading-relaxed">
          The requested page or listing route doesn't exist or has been relocated in the platform reorganization.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <Link
            to="/"
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#1B4332] text-white font-bold text-sm shadow hover:bg-[#2D6A4F] transition-all"
          >
            <Home className="w-4 h-4" />
            <span>Return to SharePlate Home</span>
          </Link>
          <Link
            to="/discover"
            className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-stone-600 hover:text-stone-900 text-xs font-semibold hover:bg-stone-50 transition-colors"
          >
            <span>Discover Available Food</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
