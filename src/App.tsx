import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { StorageProvider } from './contexts/StorageContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { EmailVerificationBanner } from './components/EmailVerificationBanner';

// Lazy load page components for code splitting
const HomePage = lazy(() => import('./pages/HomePage').then(module => ({ default: module.HomePage })));
const InspectionsPage = lazy(() => import('./pages/InspectionsPage').then(module => ({ default: module.InspectionsPage })));
const NewInspectionPage = lazy(() => import('./pages/NewInspectionPage').then(module => ({ default: module.NewInspectionPage })));
const InspectionDetailPage = lazy(() => import('./pages/InspectionDetailPage').then(module => ({ default: module.InspectionDetailPage })));
const ReportsPage = lazy(() => import('./pages/ReportsPage').then(module => ({ default: module.ReportsPage })));
const ReportDetailPage = lazy(() => import('./pages/ReportDetailPage').then(module => ({ default: module.ReportDetailPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(module => ({ default: module.ProfilePage })));
const LoginPage = lazy(() => import('./pages/auth/LoginPage').then(module => ({ default: module.LoginPage })));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage').then(module => ({ default: module.RegisterPage })));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage').then(module => ({ default: module.ForgotPasswordPage })));
const EmailVerificationPage = lazy(() => import('./pages/auth/EmailVerificationPage').then(module => ({ default: module.EmailVerificationPage })));
const SocialCallbackPage = lazy(() => import('./pages/auth/SocialCallbackPage').then(module => ({ default: module.SocialCallbackPage })));

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <StorageProvider>
        <Router>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              {/* Public routes */}
              <Route path="/auth/login" element={<LoginPage />} />
              <Route path="/auth/register" element={<RegisterPage />} />
              <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/auth/verify-email" element={<EmailVerificationPage />} />
              <Route path="/auth/callback/google" element={<SocialCallbackPage />} />
              <Route path="/auth/callback/microsoft" element={<SocialCallbackPage />} />
              <Route path="/auth/callback/apple" element={<SocialCallbackPage />} />
              
              {/* Protected routes */}
              <Route path="/*" element={
                <ProtectedRoute>
                  <Layout>
                    <EmailVerificationBanner />
                    <Suspense fallback={<LoadingFallback />}>
                      <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/inspections" element={<InspectionsPage />} />
                        <Route path="/inspections/new" element={<NewInspectionPage />} />
                        <Route path="/inspections/:id" element={<InspectionDetailPage />} />
                        <Route path="/reports" element={<ReportsPage />} />
                        <Route path="/reports/:id" element={<ReportDetailPage />} />
                        <Route path="/profile" element={<ProfilePage />} />
                      </Routes>
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              } />
            </Routes>
          </Suspense>
        </Router>
      </StorageProvider>
    </AuthProvider>
  );
}

export default App;