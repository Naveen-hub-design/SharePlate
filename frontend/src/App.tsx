import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Layouts
import { PublicLayout } from './layouts/PublicLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { DashboardLayout } from './layouts/DashboardLayout';

// Route-level code-split public pages
const LandingPage = React.lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })));
const HowItWorksPage = React.lazy(() => import('./pages/HowItWorksPage').then(m => ({ default: m.HowItWorksPage })));
const DiscoverPage = React.lazy(() => import('./pages/DiscoverPage').then(m => ({ default: m.DiscoverPage })));
const DonationDetailPage = React.lazy(() => import('./pages/DonationDetailPage').then(m => ({ default: m.DonationDetailPage })));
const SafetyGuidancePage = React.lazy(() => import('./pages/SafetyGuidancePage').then(m => ({ default: m.SafetyGuidancePage })));
const ImpactAnalyticsPage = React.lazy(() => import('./pages/ImpactAnalyticsPage').then(m => ({ default: m.ImpactAnalyticsPage })));
const PrivacyPolicyPage = React.lazy(() => import('./pages/LegalPlaceholders').then(m => ({ default: m.PrivacyPolicyPage })));
const TermsOfServicePage = React.lazy(() => import('./pages/LegalPlaceholders').then(m => ({ default: m.TermsOfServicePage })));

// Route-level code-split auth pages
const LoginPage = React.lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = React.lazy(() => import('./pages/RegisterPage').then(m => ({ default: m.RegisterPage })));

// Route-level code-split authenticated application workspace pages
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
          <React.Suspense fallback={<RouteLoadingFallback />}>
            <Routes>
              {/* 1. Public Marketing Website Layout */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<LandingPage />} />
                <Route path="/how-it-works" element={<HowItWorksPage />} />
                <Route path="/discover" element={<DiscoverPage />} />
                <Route path="/donations/:id" element={<DonationDetailPage />} />
                <Route path="/safety" element={<SafetyGuidancePage />} />
                <Route path="/impact" element={<ImpactAnalyticsPage />} />
                <Route path="/privacy" element={<PrivacyPolicyPage />} />
                <Route path="/terms" element={<TermsOfServicePage />} />
              </Route>

              {/* 2. Isolated Authentication Layout */}
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
              </Route>

              {/* 3. Donor Operational Workspace Layout */}
              <Route
                element={
                  <ProtectedRoute allowedRoles={['DONOR', 'ADMIN']}>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/donor/dashboard" element={<DonorDashboard />} />
                <Route path="/donations/new" element={<CreateDonationPage />} />
              </Route>

              {/* 4. Recipient Organization Workspace Layout */}
              <Route
                element={
                  <ProtectedRoute allowedRoles={['RECEIVER', 'ADMIN']}>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/receiver/dashboard" element={<ReceiverDashboard />} />
              </Route>

              {/* 5. Admin Governance Portal Layout */}
              <Route
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
              </Route>

              {/* Fallback Catch-all Route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </React.Suspense>

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
