import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/i18n';
import Icon from './Icons';
import OfflineSyncBadge from './OfflineSyncBadge';
import NetworkStatusIndicator from './NetworkStatusIndicator';
import LanguageSelector from './LanguageSelector';

/**
 * DISASTERCHAIN RESILIENT MISSION CONTROL HUD TOP BAR
 * 
 * Target A: Desktop Web (>= 1200px and 900-1199px)
 * Linear Control Hierarchy:
 * 1. [DisasterChain Logo + Name]
 * 2. [Operational Status]
 * 3. [Weather Intelligence]
 * 4. [Online]
 * 5. [Broadcast SOS]
 * 6. [Live]
 * 7. [Language]
 * 8. [Offline Mode]
 * 9. [Role]
 * 10. [User Name]
 * 11. [Info]
 *
 * Target B: Android Capacitor Native App (< 900px)
 * Left: [☰] [shield/logo] DISASTERCHAIN
 * Center/Right: [🌐 EN ▼]
 * Right: [🚨 SOS]
 */
const Navbar = ({ onOpenSos, onToggleSidebar, isMobileMenuOpen }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [timeStr, setTimeStr] = useState('');

  // Live Mission Control Telemetry Clock (UTC)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getUTCHours()).padStart(2, '0');
      const mins = String(now.getUTCMinutes()).padStart(2, '0');
      const secs = String(now.getUTCSeconds()).padStart(2, '0');
      setTimeStr(`${hours}:${mins}:${secs} UTC`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="app-navbar" id="disasterchain-app-header">
      {/* ====================================================================
          1. BRAND SECTION (Left): IMMUTABLE & COMPLETELY UNCLIPPED
          flex-shrink: 0, stable min-width, visible across all viewports
          ==================================================================== */}
      <div className="hud-brand-container">
        {/* Mobile/Tablet Hamburger Navigation Drawer Toggle */}
        {onToggleSidebar && (
          <button
            type="button"
            className={`mobile-hamburger-btn ${isMobileMenuOpen ? 'active' : ''}`}
            onClick={onToggleSidebar}
            aria-label={isMobileMenuOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={isMobileMenuOpen}
            id="mobile-hamburger-toggle"
          >
            {isMobileMenuOpen ? (
              <span style={{ fontSize: '1.25rem', lineHeight: 1, fontWeight: 700 }}>✕</span>
            ) : (
              <Icon name="menu" size={22} color="var(--primary)" />
            )}
          </button>
        )}

        {/* DisasterChain Logo + Full Branding */}
        <Link to="/" className="hud-logo" id="disasterchain-brand-logo" title="DisasterChain">
          <div className="brand-mark hud-logo-icon">
            <Icon name="shield-check" size={20} color="var(--primary)" />
          </div>
          <div className="brand-text-wrap">
            <span className="brand-name">DISASTERCHAIN</span>
            {isAuthenticated && (
              <span className="hud-logo-tag brand-tag">{t('common.appTag', 'NET v2.6')}</span>
            )}
          </div>
        </Link>
      </div>

      {/* ====================================================================
          PUBLIC WEB TOP BAR (!isAuthenticated):
          DESKTOP: [ 🛡️ DISASTERCHAIN ]           [ 🌐 EN ▼ ] [ Login ] [ 🚨 SOS ]
          MOBILE:  [ ☰ ] [ 🛡️ DISASTERCHAIN ]             [ Login ] [ 🚨 SOS ]
          Clean, simple, professional emergency-service header without operational clutter.
          ==================================================================== */}
      {!isAuthenticated ? (
        <>
          {/* Public Desktop Right Actions (>= 900px) */}
          <div className="navbar-public-desktop-actions">
            {/* Compact 20-Language Selector */}
            <div className="navbar-public-lang-wrap" title="Select Language">
              <LanguageSelector compact={true} />
            </div>

            {/* Prominent Login Button */}
            <Link
              to="/login"
              id="navbar-login-btn"
              className="btn btn-ghost btn-sm navbar-public-login-btn"
              title={t('nav.login', 'Sign In')}
            >
              {t('nav.login', 'Login')}
            </Link>

            {/* Highly Visible Emergency SOS Button */}
            <button
              type="button"
              onClick={onOpenSos}
              className="btn btn-emergency btn-sm navbar-public-sos-btn"
              id="navbar-sos-btn"
              aria-label="Broadcast Emergency SOS"
              title="Broadcast Emergency SOS"
            >
              <Icon name="alert-circle" size={17} color="#ffffff" />
              <span className="navbar-public-sos-label">{t('nav.broadcastSos', 'SOS')}</span>
            </button>
          </div>

          {/* Public Mobile Right Actions (< 900px) */}
          <div className="navbar-public-mobile-actions">
            <Link
              to="/login"
              id="navbar-mobile-login-btn"
              className="btn btn-ghost btn-sm navbar-public-mobile-login"
              title={t('nav.login', 'Login')}
            >
              {t('nav.login', 'Login')}
            </Link>

            <button
              type="button"
              onClick={onOpenSos}
              className="btn btn-emergency btn-sm navbar-public-mobile-sos"
              id="navbar-mobile-sos-btn"
              aria-label="Broadcast Emergency SOS"
              title="Broadcast Emergency SOS"
            >
              <Icon name="alert-circle" size={16} color="#ffffff" />
              <span className="mobile-sos-text">SOS</span>
            </button>
          </div>
        </>
      ) : (
        <>
          {/* ====================================================================
              AUTHENTICATED MISSION CONTROL TOP BAR (isAuthenticated)
              Preserved in full for logged-in users and responders.
              ==================================================================== */}
          {/* Mobile & Android Header Controls (< 900px) */}
          <div className="hud-mobile-actions">
            <LanguageSelector compact={true} className="mobile-header-lang" />

            <button
              type="button"
              onClick={onOpenSos}
              className="btn btn-emergency btn-sm navbar-sos-action mobile-sos-btn"
              id="navbar-mobile-sos-btn"
              aria-label="Broadcast Emergency SOS"
              title="Broadcast Emergency SOS"
            >
              <Icon name="alert-circle" size={16} color="#ffffff" />
              <span>{t('nav.broadcastSos', 'SOS')}</span>
            </button>
          </div>

          {/* Desktop Mission Control Controls Track (>= 900px) */}
          <div className="hud-desktop-controls-track">
            {/* Operational Status */}
            <div
              className="telemetry-chip telemetry-operational"
              title={`Operational status. Current telemetry clock: ${timeStr}`}
            >
              <span className="live-beacon-pulse" />
              <span className="op-label-full" style={{ color: 'var(--primary)', fontWeight: 700 }}>
                {t('common.operational', 'OPERATIONAL')}
              </span>
              <span className="op-label-compact" style={{ color: 'var(--primary)', fontWeight: 700 }}>
                OP
              </span>
              <span className="op-divider" style={{ opacity: 0.4 }}>|</span>
              <span className="op-clock">{timeStr || t('common.syncing', 'SYNCING...')}</span>
            </div>

            {/* Weather Intelligence */}
            <Link
              to="/weather"
              className="telemetry-chip hover-highlight telemetry-weather"
              title={t('weather.weatherIntelligence', 'Weather Intelligence')}
            >
              <span style={{ fontSize: '0.92rem' }}>🌤️</span>
              <span className="weather-label-full" style={{ color: 'var(--cyan, #38bdf8)', fontWeight: 700, fontSize: '0.78rem' }}>
                {t('nav.weatherIntelligence', 'WEATHER INTELLIGENCE')}
              </span>
              <span className="weather-label-compact" style={{ color: 'var(--cyan, #38bdf8)', fontWeight: 700, fontSize: '0.74rem' }}>
                WEATHER
              </span>
            </Link>

            {/* Online Sync Queue */}
            <div className="telemetry-online-wrap" title="Tactical network queue & sync status">
              <OfflineSyncBadge />
            </div>

            {/* Broadcast SOS */}
            <button
              type="button"
              onClick={onOpenSos}
              className="btn btn-emergency btn-sm navbar-sos-action desktop-sos-btn"
              id="navbar-sos-btn"
              aria-label="Broadcast Emergency SOS"
              title="Broadcast Urgent Distress Beacon"
            >
              <Icon name="alert-circle" size={16} color="#ffffff" />
              <span className="sos-label-full">{t('nav.broadcastSos', 'BROADCAST SOS')}</span>
              <span className="sos-label-compact">{t('nav.broadcastSos', 'SOS')}</span>
            </button>

            {/* Live Indicator */}
            <div className="telemetry-live-wrap" title="Network connectivity state">
              <NetworkStatusIndicator />
            </div>

            {/* Language Switcher */}
            <div className="telemetry-lang-wrap" title="Multilingual i18n switcher (20 languages)">
              <LanguageSelector />
            </div>

            {/* Offline Mode */}
            <Link
              to="/offline"
              className="btn btn-secondary btn-sm navbar-offline-btn"
              id="navbar-offline-btn"
              title={t('offline.offlineModeTitle', 'Offline & Survivability Mode')}
            >
              <Icon name="wifi-off" size={14} color="var(--primary)" />
              <span className="offline-label-full" style={{ fontSize: '0.78rem' }}>{t('nav.offlineMode', 'Offline')}</span>
              <span className="offline-label-compact" style={{ fontSize: '0.74rem' }}>OFF</span>
            </Link>

            {/* Role + User Profile Cluster */}
            <div className="navbar-user-cluster">
              <Link
                to="/profile"
                className="btn btn-ghost btn-sm navbar-profile-link"
                title="User Profile & Identity"
              >
                <span className="badge badge-info navbar-role-badge" style={{ textTransform: 'capitalize', fontSize: '0.68rem' }}>
                  {user?.role || 'Citizen'}
                </span>
                <span className="navbar-username" style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.80rem' }}>
                  {user?.name?.split(' ')[0] || 'User'}
                </span>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="btn btn-ghost btn-sm navbar-logout-btn"
                title={t('nav.logout', 'Sign Out')}
                aria-label="Sign Out"
              >
                <Icon name="logout" size={15} />
              </button>
            </div>

            {/* System Info */}
            <Link
              to="/guides"
              className="btn btn-ghost btn-sm navbar-info-btn"
              id="navbar-info-btn"
              title={t('guides.title', 'Emergency Preparedness & System Information')}
              aria-label="System & Preparedness Information"
            >
              <Icon name="info" size={16} color="var(--text-secondary)" />
              <span className="navbar-info-label">Info</span>
            </Link>
          </div>
        </>
      )}
    </header>
  );
};

export default Navbar;
