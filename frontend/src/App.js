import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Components
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import SosModal from './components/SosModal';
import IncidentModal from './components/IncidentModal';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
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
import AdminDashboard from './pages/AdminDashboard';

const AppLayout = () => {
  const location = useLocation();
  const [isSosOpen, setIsSosOpen] = useState(false);
  const [isIncidentOpen, setIsIncidentOpen] = useState(false);
  const [sosRefreshCount, setSosRefreshCount] = useState(0);

  // Show sidebar on all dashboard/tool pages except clean landing/login/register pages
  const isPublicStandalone = location.pathname === '/' || location.pathname === '/login' || location.pathname === '/register';

  return (
    <div className="app-container">
      {/* Sidebar navigation */}
      {!isPublicStandalone && <Sidebar />}

      {/* Main Content Area */}
      <div className="main-content">
        <Navbar onOpenSos={() => setIsSosOpen(true)} />

        <main className={isPublicStandalone ? '' : 'page-body'}>
          <Routes>
            <Route path="/" element={<LandingPage onOpenSos={() => setIsSosOpen(true)} />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/dashboard"
              element={
                <EmergencyDashboard
                  refreshKey={sosRefreshCount}
                  onOpenSos={() => setIsSosOpen(true)}
                  onOpenIncident={() => setIsIncidentOpen(true)}
                />
              }
            />
            <Route
              path="/sos"
              element={
                <SosPage
                  refreshKey={sosRefreshCount}
                  onOpenSos={() => setIsSosOpen(true)}
                />
              }
            />
            <Route path="/shelters" element={<SheltersPage />} />
            <Route path="/affected-areas" element={<AffectedAreasPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/guides" element={<DisasterGuidesPage />} />
            <Route path="/incidents" element={<IncidentReportsPage onOpenIncident={() => setIsIncidentOpen(true)} />} />
            <Route path="/my-reports" element={<MyReportsPage />} />
            <Route path="/resources" element={<EmergencyResourcesPage />} />
            <Route path="/donations" element={<DonationsPage />} />
            <Route path="/resource-tracking" element={<ResourceTrackingPage />} />
            <Route path="/transparency" element={<TransparencyLedgerPage />} />
            <Route path="/offline" element={<OfflineEmergencyPage />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </main>
      </div>

      {/* Global Modals */}
      <SosModal
        isOpen={isSosOpen}
        onClose={() => setIsSosOpen(false)}
        onSosSubmitted={() => setSosRefreshCount((c) => c + 1)}
      />

      <IncidentModal
        isOpen={isIncidentOpen}
        onClose={() => setIsIncidentOpen(false)}
      />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppLayout />
      </Router>
    </AuthProvider>
  );
}

export default App;
