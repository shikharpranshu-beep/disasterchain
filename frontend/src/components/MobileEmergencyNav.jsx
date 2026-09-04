import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from '../i18n/i18n';
import Icon from './Icons';

/**
 * MobileEmergencyNav (Phase 13)
 * Persistent 1-tap thumb-friendly bottom emergency action bar for mobile devices (<= 768px).
 * Ensures instant access to the 5 life-safety essentials:
 * - SOS (distress trigger)
 * - ALERTS (evacuation & hazard warnings)
 * - NEARBY SHELTER (safe haven search)
 * - MAP (geospatial crisis grid)
 * - REPORT (field hazard submission)
 */
const MobileEmergencyNav = ({ onOpenSos, onOpenIncident }) => {
  const { t } = useTranslation();
  const location = useLocation();

  // Hide on authentication and landing pages
  const isAuthOrLanding =
    location.pathname === '/' ||
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname === '/forgot-password' ||
    location.pathname === '/reset-password' ||
    location.pathname === '/verify-email';

  if (isAuthOrLanding) return null;

  return (
    <>
      <nav
        className="mobile-emergency-nav"
        aria-label="Mobile Emergency Navigation"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '64px',
          background: 'rgba(28, 17, 13, 0.96)',
          backdropFilter: 'blur(16px)',
          borderTop: '1px solid var(--border-medium)',
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          alignItems: 'center',
          zIndex: 9990,
          padding: '0 0.25rem',
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.7)',
        }}
      >
        {/* 1. MAP / DASHBOARD */}
        <NavLink
          to="/dashboard"
          style={({ isActive }) => ({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none',
            color: isActive ? 'var(--primary)' : 'var(--text-muted)',
            fontSize: '0.68rem',
            fontWeight: 700,
            gap: '3px',
            padding: '4px 0',
          })}
        >
          <Icon name="map-pin" size={18} />
          <span>{t('nav.map', 'MAP')}</span>
        </NavLink>

        {/* 2. ALERTS */}
        <NavLink
          to="/alerts"
          style={({ isActive }) => ({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none',
            color: isActive ? 'var(--amber)' : 'var(--text-muted)',
            fontSize: '0.68rem',
            fontWeight: 700,
            gap: '3px',
            padding: '4px 0',
          })}
        >
          <Icon name="bell" size={18} />
          <span>{t('nav.alerts', 'ALERTS')}</span>
        </NavLink>

        {/* 3. CENTER HIGHLIGHTED: SOS */}
        <button
          type="button"
          onClick={onOpenSos}
          style={{
            background: 'linear-gradient(135deg, #E53935, #B91C1C)',
            border: '2px solid rgba(255, 255, 255, 0.45)',
            borderRadius: '50%',
            width: '52px',
            height: '52px',
            marginTop: '-18px',
            marginInline: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontWeight: 900,
            fontSize: '0.7rem',
            boxShadow: '0 4px 18px rgba(229, 57, 53, 0.6)',
            cursor: 'pointer',
            touchAction: 'manipulation',
          }}
          title="Broadcast Emergency SOS"
          aria-label="Broadcast Emergency SOS"
        >
          <span style={{ fontSize: '1.05rem', lineHeight: 1 }}>🚨</span>
          <span style={{ fontSize: '0.62rem', letterSpacing: '0.04em' }}>{t('nav.emergencySos', 'SOS')}</span>
        </button>

        {/* 4. SHELTER */}
        <NavLink
          to="/shelters"
          style={({ isActive }) => ({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none',
            color: isActive ? 'var(--safe)' : 'var(--text-muted)',
            fontSize: '0.68rem',
            fontWeight: 700,
            gap: '3px',
            padding: '4px 0',
          })}
        >
          <Icon name="home" size={18} />
          <span>{t('nav.shelters', 'SHELTER')}</span>
        </NavLink>

        {/* 5. REPORT HAZARD */}
        <button
          type="button"
          onClick={onOpenIncident}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            fontSize: '0.68rem',
            fontWeight: 700,
            gap: '3px',
            padding: '4px 0',
            cursor: 'pointer',
            touchAction: 'manipulation',
          }}
          title="Report Hazard Incident"
          aria-label="Report Hazard Incident"
        >
          <Icon name="warning" size={18} color="var(--amber)" />
          <span>{t('incidents.reportIncident', 'REPORT')}</span>
        </button>
      </nav>

      {/* Media Query: show only on screens <= 768px */}
      <style>{`
        @media (min-width: 769px) {
          .mobile-emergency-nav {
            display: none !important;
          }
        }
        @media (max-width: 768px) {
          .main-content {
            padding-bottom: 70px !important;
          }
        }
      `}</style>
    </>
  );
};

export default MobileEmergencyNav;
