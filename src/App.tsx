import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { StorageProvider } from './contexts/StorageContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { EmailVerificationBanner } from './components/EmailVerificationBanner';
import { HomePage } from './pages/HomePage';
import { InspectionsPage } from './pages/InspectionsPage';
import { NewInspectionPage } from './pages/NewInspectionPage';
import { InspectionDetailPage } from './pages/InspectionDetailPage';
import { ReportsPage } from './pages/ReportsPage';
import { ReportDetailPage } from './pages/ReportDetailPage';
import { ProfilePage } from './pages/ProfilePage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { EmailVerificationPage } from './pages/auth/EmailVerificationPage';

function App() {
  return (
    <AuthProvider>
      <StorageProvider>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/register" element={<RegisterPage />} />
            <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/auth/verify-email" element={<EmailVerificationPage />} />
            
            {/* Protected routes */}
            <Route path="/*" element={
              <ProtectedRoute>
                <Layout>
                  <EmailVerificationBanner />
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/inspections" element={<InspectionsPage />} />
                    <Route path="/inspections/new" element={<NewInspectionPage />} />
                    <Route path="/inspections/:id" element={<InspectionDetailPage />} />
                    <Route path="/reports" element={<ReportsPage />} />
                    <Route path="/reports/:id" element={<ReportDetailPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            } />
          </Routes>
        </Router>
      </StorageProvider>
    </AuthProvider>
  );
}

export default App;