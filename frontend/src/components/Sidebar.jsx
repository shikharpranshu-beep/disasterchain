import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/i18n';
import { usePWA } from '../context/PWAContext';
import Icon from './Icons';

const Sidebar = ({ isOpen, onClose, onOpenSos }) => {
  const { user, isAdmin } = useAuth();
  const { t } = useTranslation();
  const { isInstallable, isInstalled, promptInstall } = usePWA();
  const role = user?.role || 'citizen';
  const isPrivileged = role === 'responder' || role === 'ngo' || role === 'volunteer';

  const navItems = [
    { label: t('nav.commandHud', 'Command HUD'), path: '/dashboard', icon: 'activity', section: 'OPERATION' },
    { label: t('nav.emergencySos', 'Emergency SOS'), path: '/sos', icon: 'sos', badge: t('common.live', 'LIVE'), section: 'OPERATION' },
    { label: t('nav.reliefShelters', 'Relief Shelters'), path: '/shelters', icon: 'shelter', section: 'OPERATION' },
    { label: t('nav.affectedAreas', 'Affected Areas'), path: '/affected-areas', icon: 'map', section: 'OPERATION' },
    { label: t('nav.crisisAlerts', 'Crisis Alerts'), path: '/alerts', icon: 'bell', section: 'OPERATION' },
    { label: t('nav.weatherIntelligence', 'Weather Intelligence'), path: '/weather', icon: 'cloud', badge: t('common.live', 'LIVE'), section: 'OPERATION' },
    { label: t('nav.hazardReports', 'Hazard Reports'), path: '/incidents', icon: 'warning', section: 'REPORTING' },
    { label: t('nav.mySubmissions', 'My Submissions'), path: '/my-reports', icon: 'report', section: 'REPORTING' },
    { label: t('nav.emergencyFacilities', 'Emergency Facilities'), path: '/resources', icon: 'hospital', section: 'SUPPLY' },
    { label: t('nav.aidDonations', 'Aid Donations'), path: '/donations', icon: 'donations', section: 'SUPPLY' },
    { label: t('nav.distributionTransit', 'Distribution Transit'), path: '/resource-tracking', icon: 'logistics', section: 'SUPPLY' },
    { label: t('nav.transparencyLedger', 'Transparency Ledger'), path: '/transparency', icon: 'ledger', section: 'AUDIT' },
    { label: t('nav.safetyProtocols', 'Safety Protocols'), path: '/guides', icon: 'guide', section: 'SURVIVAL' },
    { label: t('nav.offlineMode', 'Offline Mode'), path: '/offline', icon: 'offline', section: 'SURVIVAL' },
  ];

  return (
    <>
      {/* Desktop Spatial Command Rail */}
      <aside className="command-rail">
        {/* Admin Quick Terminal Access */}
        {isAdmin && (
          <div style={{ marginBottom: '1.25rem' }}>
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`
              }
              style={{
                width: '100%',
                justifyContent: 'flex-start',
                padding: '0.65rem 0.85rem',
                fontSize: '0.8rem',
                border: '1px solid var(--border-highlight)',
                boxShadow: 'var(--glow-cyan)',
              }}
            >
              <Icon name="shield" size={16} color="var(--cyan)" />
              <span>{t('nav.adminCommand', 'ADMIN COMMAND')}</span>
            </NavLink>
          </div>
        )}

        {/* Operational Role Badge */}
        {!isAdmin && isPrivileged && (
          <div
            style={{
              marginBottom: '1rem',
              padding: '0.45rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(0, 240, 255, 0.08)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span className="live-beacon-pulse" />
            <span className="micro-label" style={{ color: 'var(--cyan)' }}>
              ROLE: {role.toUpperCase()}
            </span>
          </div>
        )}

        {/* Grouped Navigation Links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div className="rail-section-title">{t('nav.navigationMenu', 'MISSION DIRECTORY')}</div>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `rail-nav-item ${isActive ? 'active' : ''}`
              }
            >
              <span className="nav-icon-wrap">
                <Icon name={item.icon} size={17} />
              </span>
              <span>{item.label}</span>
              {item.badge && (
                <span className="rail-nav-badge badge badge-critical">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </div>

        {/* Tactical Personnel Account Link */}
        <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid var(--border-subtle)' }}>
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `rail-nav-item ${isActive ? 'active' : ''}`
            }
          >
            <span className="nav-icon-wrap">
              <Icon name="profile" size={17} />
            </span>
            <span>{t('nav.profile', 'Personnel Dossier')}</span>
          </NavLink>
        </div>
      </aside>

      {/* Mobile Slide-Out Drawer Navigation (Triggered via Navbar hamburger) */}
      <div
        className={`mobile-drawer-backdrop ${isOpen ? 'open' : ''}`}
        onClick={onClose}
        aria-hidden={!isOpen}
      />

      <aside
        className={`mobile-nav-drawer ${isOpen ? 'open' : ''}`}
        aria-label="Mobile Mission Directory"
      >
        {/* Drawer Header */}
        <div className="mobile-drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: 'var(--radius-sm)',
                background: 'linear-gradient(135deg, rgba(255, 107, 44, 0.25), rgba(245, 158, 11, 0.15))',
                border: '1px solid var(--border-highlight)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="shield-check" size={18} color="var(--primary)" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#ffffff' }}>
                DISASTERCHAIN
              </div>
              <div className="micro-label" style={{ color: 'var(--primary)' }}>
                {t('nav.navigationMenu', 'MISSION DIRECTORY')}
              </div>
            </div>
          </div>

          <button
            type="button"
            className="mobile-drawer-close-btn"
            onClick={onClose}
            aria-label="Close Navigation Drawer"
          >
            ✕
          </button>
        </div>

        {/* Emergency SOS Shortcut */}
        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenSos();
          }}
          className="btn btn-emergency"
          style={{
            width: '100%',
            marginBottom: '1rem',
            padding: '0.65rem',
            justifyContent: 'center',
            fontSize: '0.85rem',
            fontWeight: 800,
          }}
        >
          <Icon name="alert-circle" size={18} color="#ffffff" />
          <span>{t('nav.broadcastSos', 'BROADCAST SOS')}</span>
        </button>

        {/* Admin Terminal Link */}
        {isAdmin && (
          <div style={{ marginBottom: '1rem' }}>
            <NavLink
              to="/admin"
              onClick={onClose}
              className={({ isActive }) =>
                `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`
              }
              style={{
                width: '100%',
                justifyContent: 'flex-start',
                padding: '0.65rem 0.85rem',
                fontSize: '0.82rem',
                border: '1px solid var(--border-highlight)',
              }}
            >
              <Icon name="shield" size={16} color="var(--cyan)" />
              <span>{t('nav.adminCommand', 'ADMIN COMMAND')}</span>
            </NavLink>
          </div>
        )}

        {/* Operational Role Indicator */}
        {!isAdmin && isPrivileged && (
          <div
            style={{
              marginBottom: '0.85rem',
              padding: '0.45rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(0, 240, 255, 0.08)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span className="live-beacon-pulse" />
            <span className="micro-label" style={{ color: 'var(--cyan)' }}>
              ROLE: {role.toUpperCase()}
            </span>
          </div>
        )}

        {/* Full Navigation Item List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `rail-nav-item ${isActive ? 'active' : ''}`
              }
              style={{ minHeight: '44px' }}
            >
              <span className="nav-icon-wrap">
                <Icon name={item.icon} size={18} />
              </span>
              <span style={{ fontSize: '0.9rem' }}>{item.label}</span>
              {item.badge && (
                <span className="rail-nav-badge badge badge-critical">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </div>

        {/* PWA Mobile Installation Trigger */}
        {isInstallable && !isInstalled && (
          <div style={{ marginTop: '0.75rem', marginBottom: '0.5rem' }}>
            <button
              type="button"
              onClick={() => {
                onClose();
                promptInstall();
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '11px 14px',
                borderRadius: 'var(--radius-sm, 8px)',
                background: 'linear-gradient(135deg, rgba(255, 107, 44, 0.18), rgba(245, 158, 11, 0.12))',
                border: '1px solid var(--border-highlight, #FF6B2C)',
                color: '#FFF',
                fontWeight: '700',
                fontSize: '0.88rem',
                cursor: 'pointer',
                minHeight: '44px',
              }}
            >
              <span className="nav-icon-wrap" style={{ color: 'var(--primary, #FF6B2C)' }}>
                <Icon name="download" size={18} />
              </span>
              <span>{t('pwa.installApp', 'Install DisasterChain App')}</span>
            </button>
          </div>
        )}

        {/* Footer Link: Personnel Profile */}
        <div style={{ marginTop: 'auto', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
          <NavLink
            to="/profile"
            onClick={onClose}
            className={({ isActive }) =>
              `rail-nav-item ${isActive ? 'active' : ''}`
            }
            style={{ minHeight: '44px' }}
          >
            <span className="nav-icon-wrap">
              <Icon name="profile" size={18} />
            </span>
            <span style={{ fontSize: '0.9rem' }}>{t('nav.profile', 'Personnel Dossier')}</span>
          </NavLink>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
