import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';

// Isolated Role Layouts
import { PublicLayout } from './layouts/PublicLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { DonorLayout } from './layouts/DonorLayout';
import { ReceiverLayout } from './layouts/ReceiverLayout';
import { AdminLayout } from './layouts/AdminLayout';

// Public Marketing Pages
const LandingPage = React.lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })));
const HowItWorksPage = React.lazy(() => import('./pages/HowItWorksPage').then(m => ({ default: m.HowItWorksPage })));
const DiscoverPage = React.lazy(() => import('./pages/DiscoverPage').then(m => ({ default: m.DiscoverPage })));
const DonationDetailPage = React.lazy(() => import('./pages/DonationDetailPage').then(m => ({ default: m.DonationDetailPage })));
const SafetyGuidancePage = React.lazy(() => import('./pages/SafetyGuidancePage').then(m => ({ default: m.SafetyGuidancePage })));
const ImpactAnalyticsPage = React.lazy(() => import('./pages/ImpactAnalyticsPage').then(m => ({ default: m.ImpactAnalyticsPage })));
const LiveMapPage = React.lazy(() => import('./pages/LiveMapPage').then(m => ({ default: m.LiveMapPage })));
const PrivacyPolicyPage = React.lazy(() => import('./pages/LegalPlaceholders').then(m => ({ default: m.PrivacyPolicyPage })));
const TermsOfServicePage = React.lazy(() => import('./pages/LegalPlaceholders').then(m => ({ default: m.TermsOfServicePage })));
import { UnauthorizedPage } from './pages/UnauthorizedPage';
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })));

// Isolated Authentication Pages
const LoginPage = React.lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = React.lazy(() => import('./pages/RegisterPage').then(m => ({ default: m.RegisterPage })));

// Authenticated Application Modules
const DonorDashboard = React.lazy(() => import('./pages/DonorDashboard').then(m => ({ default: m.DonorDashboard })));
const CreateDonationPage = React.lazy(() => import('./pages/CreateDonationPage').then(m => ({ default: m.CreateDonationPage })));
const ReceiverDashboard = React.lazy(() => import('./pages/ReceiverDashboard').then(m => ({ default: m.ReceiverDashboard })));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard').then(m => ({ default: m.AdminDashboard })));

import { Toaster } from 'react-hot-toast';

const RouteLoadingFallback: React.FC = () => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center" role="status" aria-label="Loading page">
    <div className="w-10 h-10 border-3 border-emerald-200 border-t-emerald-700 rounded-full animate-spin mb-3" />
    <p className="text-stone-500 text-sm font-medium tracking-wide">Loading SharePlate...</p>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-[#FAF7F2] text-stone-900 selection:bg-emerald-200 selection:text-emerald-900 font-sans">
          <ErrorBoundary>
            <React.Suspense fallback={<RouteLoadingFallback />}>
            <Routes>
              {/* 1. Public Marketing Website Layout */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<LandingPage />} />
                <Route path="/how-it-works" element={<HowItWorksPage />} />
                <Route path="/discover" element={<DiscoverPage />} />
                <Route path="/live-map" element={<LiveMapPage />} />
                <Route path="/donations/:id" element={<DonationDetailPage />} />
                <Route path="/safety" element={<SafetyGuidancePage />} />
                <Route path="/impact" element={<ImpactAnalyticsPage />} />
                <Route path="/privacy" element={<PrivacyPolicyPage />} />
                <Route path="/terms" element={<TermsOfServicePage />} />
                <Route path="/unauthorized" element={<UnauthorizedPage />} />
              </Route>

              {/* 2. Isolated Authentication Layout */}
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
              </Route>

              {/* 3. Donor Operational Workspace Layout */}
              <Route
                element={
                  <ProtectedRoute allowedRoles={['DONOR']}>
                    <DonorLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/donor" element={<Navigate to="/donor/overview" replace />} />
                <Route path="/donor/overview" element={<DonorDashboard view="overview" />} />
                <Route path="/donor/dashboard" element={<Navigate to="/donor/overview" replace />} />
                <Route path="/donor/donations" element={<DonorDashboard view="donations" />} />
                <Route path="/donor/donations/new" element={<CreateDonationPage />} />
                <Route path="/donor/requests" element={<DonorDashboard view="requests" />} />
                <Route path="/donor/pickups" element={<DonorDashboard view="pickups" />} />
                <Route path="/donor/analytics" element={<DonorDashboard view="analytics" />} />
                <Route path="/donor/profile" element={<DonorDashboard view="profile" />} />
              </Route>
              {/* Backward compatibility for direct /donations/new link */}
              <Route path="/donations/new" element={<Navigate to="/donor/donations/new" replace />} />

              {/* 4. Recipient Organization Workspace Layout */}
              <Route
                element={
                  <ProtectedRoute allowedRoles={['RECEIVER']}>
                    <ReceiverLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/receiver" element={<Navigate to="/receiver/overview" replace />} />
                <Route path="/receiver/overview" element={<ReceiverDashboard view="overview" />} />
                <Route path="/receiver/dashboard" element={<Navigate to="/receiver/overview" replace />} />
                <Route path="/receiver/discover" element={<DiscoverPage />} />
                <Route path="/receiver/requests" element={<ReceiverDashboard view="requests" />} />
                <Route path="/receiver/pickups" element={<ReceiverDashboard view="pickups" />} />
                <Route path="/receiver/analytics" element={<ReceiverDashboard view="analytics" />} />
                <Route path="/receiver/profile" element={<ReceiverDashboard view="profile" />} />
              </Route>

              {/* 5. Admin Governance Portal Layout */}
              <Route
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/admin" element={<Navigate to="/admin/overview" replace />} />
                <Route path="/admin/overview" element={<AdminDashboard tab="overview" />} />
                <Route path="/admin/dashboard" element={<Navigate to="/admin/overview" replace />} />
                <Route path="/admin/verifications" element={<AdminDashboard tab="verification" />} />
                <Route path="/admin/users" element={<AdminDashboard tab="users" />} />
                <Route path="/admin/safety-reports" element={<AdminDashboard tab="safety" />} />
                <Route path="/admin/audit-logs" element={<AdminDashboard tab="audit" />} />
                <Route path="/admin/analytics" element={<AdminDashboard tab="analytics" />} />
              </Route>

              {/* Fallback Catch-all Route with Public Layout */}
              <Route element={<PublicLayout />}>
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </React.Suspense>
        </ErrorBoundary>

          {/* Platform Toast Notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1C1917',
                color: '#FAF7F2',
                borderRadius: '16px',
                fontSize: '13px',
                fontWeight: '600',
              },
            }}
          />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
