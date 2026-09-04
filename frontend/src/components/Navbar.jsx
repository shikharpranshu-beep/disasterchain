import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/i18n';
import Icon from './Icons';
import OfflineSyncBadge from './OfflineSyncBadge';
import NetworkStatusIndicator from './NetworkStatusIndicator';
import LanguageSelector from './LanguageSelector';

const Navbar = ({ onOpenSos, onToggleSidebar, isMobileMenuOpen }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [timeStr, setTimeStr] = useState('');

  // Live Mission Control Telemetry Clock (UTC + Local)
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
    <header className="app-navbar">
      {/* Left Area: Hamburger Toggle (Mobile/Tablet) + Brand HUD Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        {onToggleSidebar && (
          <button
            type="button"
            className="mobile-hamburger-btn"
            onClick={onToggleSidebar}
            aria-label={isMobileMenuOpen ? 'Close Navigation Drawer' : 'Open Navigation Drawer'}
            style={{
              display: 'none',
              width: '44px',
              height: '44px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
            }}
          >
            {isMobileMenuOpen ? (
              <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>✕</span>
            ) : (
              <Icon name="menu" size={22} color="var(--primary)" />
            )}
          </button>
        )}

        <Link to="/" className="hud-logo">
          <div className="hud-logo-icon">
            <Icon name="shield-check" size={20} color="var(--primary)" />
          </div>
          <div>
            <div className="hud-logo-title">
              <span>DISASTERCHAIN</span>
              <span className="hud-logo-tag">{t('common.appTag', 'NET v2.6')}</span>
            </div>
          </div>
        </Link>
      </div>

      {/* Center Telemetry Readout (Desktop only) */}
      <div className="hud-telemetry" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div className="telemetry-chip">
          <span className="live-beacon-pulse" />
          <span style={{ color: 'var(--primary)' }}>{t('common.operational', 'OPERATIONAL')}</span>
          <span style={{ opacity: 0.5 }}>|</span>
          <span>{timeStr || t('common.syncing', 'SYNCING...')}</span>
        </div>
        <Link
          to="/weather"
          className="telemetry-chip hover-highlight"
          style={{
            textDecoration: 'none',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            cursor: 'pointer',
            borderColor: 'var(--border-subtle)',
          }}
          title={t('weather.weatherIntelligence', 'Weather Intelligence')}
        >
          <span style={{ fontSize: '0.95rem' }}>🌤️</span>
          <span style={{ color: 'var(--cyan)', fontWeight: 700, fontSize: '0.78rem' }}>
            {t('nav.weatherIntelligence', 'WEATHER INTELLIGENCE')}
          </span>
        </Link>
        <OfflineSyncBadge />
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {/* Global Tactical Network Status Indicator */}
        <NetworkStatusIndicator />

        {/* Multilingual 20-Language Selector */}
        <LanguageSelector />

        {/* Urgent Emergency Beacon Button (Desktop & Tablet) */}
        <button
          type="button"
          onClick={onOpenSos}
          className="btn btn-emergency btn-sm navbar-sos-action"
          id="navbar-sos-btn"
          style={{ letterSpacing: '0.04em' }}
        >
          <Icon name="alert-circle" size={16} color="#ffffff" />
          <span>{t('nav.broadcastSos', 'SOS')}</span>
        </button>

        {/* Low-Connectivity Mode Switcher (Desktop only) */}
        <Link
          to="/offline"
          className="btn btn-secondary btn-sm navbar-offline-btn"
          title={t('offline.offlineModeTitle', 'Offline & Survivability Mode')}
        >
          <Icon name="wifi-off" size={15} color="var(--primary)" />
          <span style={{ fontSize: '0.78rem' }}>{t('nav.offlineMode', 'Offline')}</span>
        </Link>

        {/* User Status / Authentication */}
        {isAuthenticated ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Link
              to="/profile"
              className="btn btn-ghost btn-sm"
              style={{ padding: '0.35rem 0.55rem' }}
              title="User Profile"
            >
              <span className="badge badge-info" style={{ textTransform: 'capitalize', fontSize: '0.68rem' }}>
                {user?.role || 'Citizen'}
              </span>
              <span className="navbar-username" style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.82rem' }}>
                {user?.name?.split(' ')[0] || 'User'}
              </span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="btn btn-ghost btn-sm"
              title={t('nav.logout', 'Sign Out')}
              style={{ color: 'var(--text-muted)', padding: '0.4rem' }}
            >
              <Icon name="logout" size={16} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Link to="/login" className="btn btn-ghost btn-sm" style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}>
              {t('nav.login', 'Sign In')}
            </Link>
            <Link to="/register" className="btn btn-primary btn-sm" style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}>
              {t('nav.register', 'Register')}
            </Link>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 960px) {
          .mobile-hamburger-btn {
            display: flex !important;
          }
          .navbar-offline-btn {
            display: none !important;
          }
        }
        @media (max-width: 480px) {
          .navbar-username {
            display: none !important;
          }
          .navbar-sos-action span {
            display: none;
          }
          .navbar-sos-action {
            padding: 0.4rem !important;
            min-width: 40px;
            justify-content: center;
          }
        }
      `}</style>
    </header>
  );
};

export default Navbar;
