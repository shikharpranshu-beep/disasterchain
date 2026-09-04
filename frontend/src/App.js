import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './i18n/i18n';
import { PWAProvider } from './context/PWAContext';

// Components
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import SosModal from './components/SosModal';
import IncidentModal from './components/IncidentModal';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import MobileEmergencyNav from './components/MobileEmergencyNav';
import AIAssistant from './components/AIAssistant';
import ErrorBoundary from './components/ErrorBoundary';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import PWAUpdateToast from './components/PWAUpdateToast';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ProfilePage from './pages/ProfilePage';
import EmergencyDashboard from './pages/EmergencyDashboard';
import SosPage from './pages/SosPage';
import SheltersPage from './pages/SheltersPage';
import AffectedAreasPage from './pages/AffectedAreasPage';
import AlertsPage from './pages/AlertsPage';
import DisasterGuidesPage from './pages/DisasterGuidesPage';
import IncidentReportsPage from './pages/IncidentReportsPage';
import MyReportsPage from './pages/MyReportsPage';
import EmergencyResourcesPage from './pages/EmergencyResourcesPage';
import DonationsPage from './pages/DonationsPage';
import ResourceTrackingPage from './pages/ResourceTrackingPage';
import TransparencyLedgerPage from './pages/TransparencyLedgerPage';
import OfflineEmergencyPage from './pages/OfflineEmergencyPage';
import WeatherPage from './pages/WeatherPage';
import AdminDashboard from './pages/AdminDashboard';

const AppLayout = () => {
  const location = useLocation();
  const [isSosOpen, setIsSosOpen] = useState(false);
  const [isIncidentOpen, setIsIncidentOpen] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Automatically close mobile menu on route navigation
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Show clean layout without desktop sidebar on standalone authentication/landing pages
  const isPublicStandalone =
    location.pathname === '/' ||
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname === '/forgot-password' ||
    location.pathname === '/reset-password' ||
    location.pathname === '/verify-email';

  return (
    <div className="app-container">
      {/* Sidebar navigation: Desktop rail hidden on public standalone; Mobile drawer always available */}
      <Sidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        onOpenSos={() => setIsSosOpen(true)}
        hideDesktopRail={isPublicStandalone}
      />

      {/* Main Content Area */}
      <div className="main-content">
        <Navbar
          onOpenSos={() => setIsSosOpen(true)}
          onToggleSidebar={() => setIsMobileMenuOpen((prev) => !prev)}
          isMobileMenuOpen={isMobileMenuOpen}
        />

        <main className={isPublicStandalone ? '' : 'page-body'}>
          <Routes>
            <Route path="/" element={<LandingPage onOpenSos={() => setIsSosOpen(true)} />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <EmergencyDashboard
                  refreshKey={refreshCount}
                  onOpenSos={() => setIsSosOpen(true)}
                  onOpenIncident={() => setIsIncidentOpen(true)}
                />
              }
            />
            <Route
              path="/sos"
              element={
                <SosPage
                  refreshKey={refreshCount}
                  onOpenSos={() => setIsSosOpen(true)}
                />
              }
            />
            <Route path="/shelters" element={<SheltersPage />} />
            <Route path="/affected-areas" element={<AffectedAreasPage />} />
            <Route path="/map" element={<AffectedAreasPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/guides" element={<DisasterGuidesPage />} />
            <Route path="/preparedness" element={<DisasterGuidesPage />} />
            <Route path="/incidents" element={<IncidentReportsPage onOpenIncident={() => setIsIncidentOpen(true)} />} />
            <Route path="/my-reports" element={<MyReportsPage />} />
            <Route path="/resources" element={<EmergencyResourcesPage />} />
            <Route path="/donations" element={<DonationsPage />} />
            <Route path="/resource-tracking" element={<ResourceTrackingPage />} />
            <Route path="/transparency" element={<TransparencyLedgerPage />} />
            <Route path="/offline" element={<OfflineEmergencyPage />} />
            <Route path="/weather" element={<WeatherPage />} />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
          </Routes>
        </main>

        {/* Shared Global Application Footer */}
        <Footer />
      </div>

      {/* Persistent Mobile Emergency Bottom Navigation (Phase 13) */}
      <MobileEmergencyNav
        onOpenSos={() => setIsSosOpen(true)}
        onOpenIncident={() => setIsIncidentOpen(true)}
      />

      {/* DISASTERCHAIN AI Emergency Assistant */}
      {!isPublicStandalone && (
        <AIAssistant onOpenSos={() => setIsSosOpen(true)} />
      )}

      {/* Global Modals */}
      <SosModal
        isOpen={isSosOpen}
        onClose={() => setIsSosOpen(false)}
        onSosSubmitted={() => setRefreshCount((c) => c + 1)}
      />

      <IncidentModal
        isOpen={isIncidentOpen}
        onClose={() => setIsIncidentOpen(false)}
        onIncidentSubmitted={() => setRefreshCount((c) => c + 1)}
      />

      {/* PWA Mobile Installation Prompt & Service Worker Update Alert */}
      <PWAInstallPrompt />
      <PWAUpdateToast />
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <PWAProvider>
        <LanguageProvider>
          <AuthProvider>
            <Router>
              <AppLayout />
            </Router>
          </AuthProvider>
        </LanguageProvider>
      </PWAProvider>
    </ErrorBoundary>
  );
}

export default App;
