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
          height: 'calc(62px + env(safe-area-inset-bottom, 0px))',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          background: 'rgba(28, 17, 13, 0.97)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid var(--border-medium)',
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          alignItems: 'center',
          zIndex: 9990,
          paddingLeft: '0.25rem',
          paddingRight: '0.25rem',
          boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.85)',
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
            minHeight: '48px',
            touchAction: 'manipulation',
          })}
        >
          <Icon name="map-pin" size={19} />
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
            minHeight: '48px',
            touchAction: 'manipulation',
          })}
        >
          <Icon name="bell" size={19} />
          <span>{t('nav.alerts', 'ALERTS')}</span>
        </NavLink>

        {/* 3. CENTER HIGHLIGHTED: SOS */}
        <button
          type="button"
          onClick={onOpenSos}
          style={{
            background: 'linear-gradient(135deg, #E53935, #B91C1C)',
            border: '2px solid rgba(255, 255, 255, 0.55)',
            borderRadius: '50%',
            width: '54px',
            height: '54px',
            marginTop: '-18px',
            marginInline: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontWeight: 900,
            fontSize: '0.7rem',
            boxShadow: '0 4px 20px rgba(229, 57, 53, 0.65)',
            cursor: 'pointer',
            touchAction: 'manipulation',
          }}
          title="Broadcast Emergency SOS"
          aria-label="Broadcast Emergency SOS"
        >
          <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>🚨</span>
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
            minHeight: '48px',
            touchAction: 'manipulation',
          })}
        >
          <Icon name="home" size={19} />
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
            minHeight: '48px',
            cursor: 'pointer',
            touchAction: 'manipulation',
          }}
          title="Report Hazard Incident"
          aria-label="Report Hazard Incident"
        >
          <Icon name="warning" size={19} color="var(--amber)" />
          <span>{t('incidents.reportIncident', 'REPORT')}</span>
        </button>
      </nav>

      {/* Media Query: show on all phone and portrait tablet screens (< 900px) */}
      <style>{`
        @media (min-width: 900px) {
          .mobile-emergency-nav {
            display: none !important;
          }
        }
        @media (max-width: 899px) {
          .main-content {
            padding-bottom: calc(72px + env(safe-area-inset-bottom, 0px)) !important;
          }
        }
      `}</style>
    </>
  );
};

export default MobileEmergencyNav;
