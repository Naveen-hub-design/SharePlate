import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowLeft, ArrowRight, Home } from 'lucide-react';

export const UnauthorizedPage: React.FC = () => {
  const { user } = useAuth();

  const getRoleDestination = () => {
    if (!user) return { path: '/login', label: 'Sign In to Your Account' };
    if (user.role === 'DONOR') return { path: '/donor/overview', label: 'Go to Donor Command Center' };
    if (user.role === 'RECEIVER') return { path: '/receiver/overview', label: 'Go to Recipient Hub' };
    if (user.role === 'ADMIN') return { path: '/admin/overview', label: 'Go to Admin Governance' };
    return { path: '/', label: 'Return to Public Site' };
  };

  const destination = getRoleDestination();

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-stone-200/90 shadow-xl text-center">
        <div className="w-16 h-16 bg-red-50 text-red-700 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-red-200">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <span className="text-[11px] font-extrabold uppercase tracking-widest text-red-600 bg-red-100/70 px-3 py-1 rounded-full">
          HTTP 403 • Role Access Restricted
        </span>

        <h1 className="text-2xl font-extrabold text-stone-900 mt-4 font-heading">
          Module Access Denied
        </h1>

        <p className="text-stone-600 text-sm mt-2 leading-relaxed">
          {user ? (
            <>
              Your account is registered as a <strong className="text-stone-900">{user.role}</strong>. For strict data protection and role separation, this private module is only accessible to authorized roles.
            </>
          ) : (
            'You must be signed in with the appropriate organization role to access this private operational module.'
          )}
        </p>

        <div className="mt-8 space-y-3">
          <Link
            to={destination.path}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#1B4332] text-white font-bold text-sm shadow hover:bg-[#2D6A4F] transition-all"
          >
            <span>{destination.label}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            to="/"
            className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-stone-600 hover:text-stone-900 text-xs font-semibold hover:bg-stone-50 transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Return to Public Homepage</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
