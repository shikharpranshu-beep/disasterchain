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
        <Link to="/" className="hud-logo" id="disasterchain-brand-logo" title="DisasterChain Mission Control">
          <div className="brand-mark hud-logo-icon">
            <Icon name="shield-check" size={20} color="var(--primary)" />
          </div>
          <div className="brand-text-wrap">
            <span className="brand-name">DISASTERCHAIN</span>
            <span className="hud-logo-tag brand-tag">{t('common.appTag', 'NET v2.6')}</span>
          </div>
        </Link>
      </div>

      {/* ====================================================================
          MOBILE & ANDROID HEADER CONTROLS (< 900px)
          Streamlined: [🌐 EN ▼] + [🚨 SOS]
          Fits strictly within 360px without horizontal scroll
          ==================================================================== */}
      <div className="hud-mobile-actions">
        {/* Compact Mobile 20-Language Selector */}
        <LanguageSelector compact={true} className="mobile-header-lang" />

        {/* Primary Emergency SOS Button (Always accessible) */}
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

      {/* ====================================================================
          DESKTOP MISSION CONTROL CONTROLS TRACK (>= 900px)
          Required Linear Order:
          2. [Operational Status]
          3. [Weather Intelligence]
          4. [Online]
          5. [Broadcast SOS]
          6. [Live]
          7. [Language]
          8. [Offline Mode]
          9. [Role]
          10. [User Name]
          11. [Info]
          ==================================================================== */}
      <div className="hud-desktop-controls-track">
        {/* 2. [Operational Status] */}
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

        {/* 3. [Weather Intelligence] */}
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

        {/* 4. [Online] */}
        <div className="telemetry-online-wrap" title="Tactical network queue & sync status">
          <OfflineSyncBadge />
        </div>

        {/* 5. [Broadcast SOS] */}
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

        {/* 6. [Live] */}
        <div className="telemetry-live-wrap" title="Network connectivity state">
          <NetworkStatusIndicator />
        </div>

        {/* 7. [Language] */}
        <div className="telemetry-lang-wrap" title="Multilingual i18n switcher (20 languages)">
          <LanguageSelector />
        </div>

        {/* 8. [Offline Mode] */}
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

        {/* 9. [Role] + 10. [User Name] / Authentication Cluster */}
        {isAuthenticated ? (
          <div className="navbar-user-cluster">
            <Link
              to="/profile"
              className="btn btn-ghost btn-sm navbar-profile-link"
              title="User Profile & Identity"
            >
              {/* 9. [Role] */}
              <span className="badge badge-info navbar-role-badge" style={{ textTransform: 'capitalize', fontSize: '0.68rem' }}>
                {user?.role || 'Citizen'}
              </span>
              {/* 10. [User Name] */}
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
        ) : (
          <div className="navbar-auth-cluster">
            {/* 9. [Role: Visitor] + 10. [User Name / Sign In & Register] */}
            <Link
              to="/login"
              id="navbar-login-btn"
              className="btn btn-ghost btn-sm navbar-login-btn"
            >
              {t('nav.login', 'Sign In')}
            </Link>
            <Link
              to="/register"
              id="navbar-register-btn"
              className="btn btn-primary btn-sm navbar-register-btn"
            >
              {t('nav.register', 'Register')}
            </Link>
          </div>
        )}

        {/* 11. [Info] */}
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
    </header>
  );
};

export default Navbar;
