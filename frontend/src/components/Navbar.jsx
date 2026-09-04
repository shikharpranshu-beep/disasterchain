import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/i18n';
import Icon from './Icons';
import OfflineSyncBadge from './OfflineSyncBadge';
import LanguageSelector from './LanguageSelector';

const Navbar = ({ onOpenSos }) => {
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
      {/* Brand HUD Logo */}
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

      {/* Center Telemetry Readout */}
      <div className="hud-telemetry" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div className="telemetry-chip">
          <span className="live-beacon-pulse" />
          <span style={{ color: 'var(--primary)' }}>{t('common.operational', 'OPERATIONAL')}</span>
          <span style={{ opacity: 0.5 }}>|</span>
          <span>{timeStr || t('common.syncing', 'SYNCING...')}</span>
        </div>
        <OfflineSyncBadge />
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Multilingual 20-Language Selector */}
        <LanguageSelector />

        {/* Urgent Emergency Beacon Button */}
        <button
          type="button"
          onClick={onOpenSos}
          className="btn btn-emergency btn-sm"
          id="navbar-sos-btn"
          style={{ letterSpacing: '0.04em' }}
        >
          <Icon name="alert-circle" size={16} color="#ffffff" />
          <span>{t('nav.broadcastSos', 'BROADCAST SOS')}</span>
        </button>

        {/* Low-Connectivity Mode Switcher */}
        <Link
          to="/offline"
          className="btn btn-secondary btn-sm"
          title={t('offline.offlineModeTitle', 'Offline & Survivability Mode')}
        >
          <Icon name="wifi-off" size={15} color="var(--primary)" />
          <span style={{ fontSize: '0.78rem' }}>{t('nav.offlineMode', 'Offline Mode')}</span>
        </Link>

        {/* User Status / Authentication */}
        {isAuthenticated ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Link
              to="/profile"
              className="btn btn-ghost btn-sm"
              style={{ padding: '0.35rem 0.65rem' }}
            >
              <span className="badge badge-info" style={{ textTransform: 'capitalize' }}>
                {user?.role || 'Citizen'}
              </span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.82rem' }}>
                {user?.name?.split(' ')[0] || 'User'}
              </span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="btn btn-ghost btn-sm"
              title={t('nav.logout', 'Sign Out')}
              style={{ color: 'var(--text-muted)' }}
            >
              <Icon name="logout" size={16} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Link to="/login" className="btn btn-ghost btn-sm">
              {t('nav.login', 'Sign In')}
            </Link>
            <Link to="/register" className="btn btn-primary btn-sm">
              {t('nav.register', 'Register')}
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
