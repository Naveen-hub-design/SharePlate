import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types';
import { UnauthorizedPage } from '../pages/UnauthorizedPage';
import { Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requireVerified?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requireVerified = false,
}) => {
  const { user, isLoading, isVerified } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
        <div className="w-12 h-12 border-4 border-[#1B4332]/20 border-t-[#1B4332] rounded-full animate-spin" />
        <p className="mt-4 text-sm font-semibold text-stone-600">Verifying authorized session...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // Strict role isolation: block cross-role access
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <UnauthorizedPage />;
  }

  if (requireVerified && !isVerified && user.role !== 'ADMIN') {
    return (
      <div className="max-w-2xl mx-auto my-16 p-8 bg-[#FDFBF7] rounded-3xl border-2 border-amber-300 shadow-xl text-center">
        <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-stone-900 mb-2">FSSAI Verification Pending</h2>
        <p className="text-stone-600 text-sm mb-4 leading-relaxed">
          In accordance with food safety standards, organization details and FSSAI credentials must be verified by an administrator before you can publish donations or claim surplus food.
        </p>
        <div className="bg-amber-50 p-4 rounded-xl text-xs text-amber-900 mb-6 text-left border border-amber-200">
          <p className="font-bold mb-1">Current Status: {user.organization?.verification_status || 'PENDING_REGISTRATION'}</p>
          <p>Organization: {user.organization?.name || 'Not yet registered'}</p>
          <p className="mt-1 text-stone-500">Admins typically review submissions within 2-4 business hours.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to={user.role === 'DONOR' ? '/donor/overview' : '/receiver/overview'}
            className="w-full sm:w-auto px-6 py-2.5 bg-[#1B4332] text-white font-bold text-sm rounded-xl hover:bg-[#2D6A4F] transition-colors flex items-center justify-center gap-2"
          >
            Go to Operational Overview <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
