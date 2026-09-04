import React, { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/i18n';
import { usePWA } from '../context/PWAContext';
import Icon from './Icons';

const Sidebar = ({ isOpen, onClose, onOpenSos, hideDesktopRail = false }) => {
  const { user, isAdmin } = useAuth();
  const { t } = useTranslation();
  const { isInstallable, isInstalled, promptInstall } = usePWA();
  const role = user?.role || 'citizen';
  const isPrivileged = role === 'responder' || role === 'ngo' || role === 'volunteer';

  // Lock body scroll when mobile drawer is open to prevent accidental background scrolling
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow || '';
      };
    }
  }, [isOpen]);

  // Handle Escape key to close mobile drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const navSections = [
    {
      title: 'MAIN',
      items: [
        { label: 'Home', path: '/', icon: 'activity' },
        { label: 'Dashboard', path: '/dashboard', icon: 'activity' },
        { label: 'SOS', path: '/sos', icon: 'sos', badge: 'LIVE' },
        { label: 'Map', path: '/affected-areas', icon: 'map' },
        { label: 'Alerts', path: '/alerts', icon: 'bell' },
        { label: 'Weather', path: '/weather', icon: 'cloud' },
      ],
    },
    {
      title: 'RESPONSE',
      items: [
        { label: 'Shelters', path: '/shelters', icon: 'shelter' },
        { label: 'Incidents', path: '/incidents', icon: 'warning' },
        { label: 'Resources', path: '/resources', icon: 'hospital' },
      ],
    },
    {
      title: 'COMMUNITY',
      items: [
        { label: 'Donations', path: '/donations', icon: 'donations' },
        { label: 'Preparedness', path: '/guides', icon: 'guide' },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        { label: 'Offline Mode', path: '/offline', icon: 'offline' },
        {
          label: 'AI Assistant',
          path: '#ai',
          icon: 'bot',
          isAction: true,
          action: () => {
            window.dispatchEvent(new CustomEvent('disasterchain:ai-assistant-open', { detail: { query: '' } }));
          },
        },
        { label: 'Profile', path: '/profile', icon: 'profile' },
      ],
    },
  ];

  return (
    <>
      {/* Desktop Spatial Command Rail */}
      {!hideDesktopRail && (
        <aside className="command-rail">
          {/* Admin Quick Terminal Access */}
          {isAdmin && (
            <div style={{ marginBottom: '1rem' }}>
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
                }}
              >
                <Icon name="shield" size={16} color="var(--cyan)" />
                <span>{t('nav.adminCommand', 'ADMIN COMMAND')}</span>
              </NavLink>
            </div>
          )}

          {/* Grouped Navigation Links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', overflowY: 'auto' }}>
            {navSections.map((sec) => (
              <div key={sec.title} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    color: '#94a3b8',
                    letterSpacing: '0.08em',
                    padding: '0.2rem 0.75rem',
                    textTransform: 'uppercase',
                  }}
                >
                  {sec.title}
                </div>
                {sec.items.map((item) => {
                  if (item.isAction) {
                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={item.action}
                        className="rail-nav-item"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          width: '100%',
                          textAlign: 'left',
                          cursor: 'pointer',
                        }}
                      >
                        <span className="nav-icon-wrap">
                          <Icon name={item.icon} size={17} />
                        </span>
                        <span>{item.label}</span>
                      </button>
                    );
                  }
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === '/'}
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
                  );
                })}
              </div>
            ))}
          </div>
        </aside>
      )}

      {/* Mobile Slide-Out Drawer Navigation */}
      <div
        className={`mobile-drawer-backdrop ${isOpen ? 'open' : ''}`}
        onClick={onClose}
        aria-hidden={!isOpen}
      />

      <aside
        className={`mobile-nav-drawer ${isOpen ? 'open' : ''}`}
        aria-label="Mobile Navigation Menu"
      >
        {/* Drawer Header */}
        <div className="mobile-drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: 'rgba(255, 107, 44, 0.15)',
                border: '1px solid rgba(255, 107, 44, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ff6b2c',
              }}
            >
              <Icon name="shield-check" size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#ffffff' }}>
                DISASTERCHAIN
              </div>
              <div style={{ fontSize: '0.72rem', color: '#ff6b2c', fontWeight: 600 }}>
                Emergency response, simplified
              </div>
            </div>
          </div>

          <button
            type="button"
            className="mobile-drawer-close-btn"
            onClick={onClose}
            aria-label="Close Navigation Drawer"
            style={{
              minWidth: '44px',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
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
            minHeight: '48px',
            justifyContent: 'center',
            fontSize: '0.9rem',
            fontWeight: 800,
          }}
        >
          <Icon name="alert-circle" size={18} color="#ffffff" />
          <span>EMERGENCY SOS</span>
        </button>

        {/* Grouped Nav Items for Mobile Drawer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', overflowY: 'auto', flex: 1 }}>
          {navSections.map((sec) => (
            <div key={sec.title} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  color: '#94a3b8',
                  letterSpacing: '0.08em',
                  padding: '0.2rem 0.5rem',
                  textTransform: 'uppercase',
                }}
              >
                {sec.title}
              </div>
              {sec.items.map((item) => {
                if (item.isAction) {
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => {
                        onClose();
                        item.action();
                      }}
                      className="rail-nav-item"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        width: '100%',
                        textAlign: 'left',
                        cursor: 'pointer',
                        minHeight: '44px',
                      }}
                    >
                      <span className="nav-icon-wrap">
                        <Icon name={item.icon} size={18} />
                      </span>
                      <span style={{ fontSize: '0.92rem' }}>{item.label}</span>
                    </button>
                  );
                }
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/'}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `rail-nav-item ${isActive ? 'active' : ''}`
                    }
                    style={{ minHeight: '44px' }}
                  >
                    <span className="nav-icon-wrap">
                      <Icon name={item.icon} size={18} />
                    </span>
                    <span style={{ fontSize: '0.92rem' }}>{item.label}</span>
                    {item.badge && (
                      <span className="rail-nav-badge badge badge-critical">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}

          {/* PWA Mobile Installation Trigger */}
          {isInstallable && !isInstalled && (
            <div style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
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
                  borderRadius: '8px',
                  background: 'rgba(255, 107, 44, 0.15)',
                  border: '1px solid rgba(255, 107, 44, 0.5)',
                  color: '#FFF',
                  fontWeight: '700',
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  minHeight: '44px',
                }}
              >
                <span className="nav-icon-wrap" style={{ color: '#ff6b2c' }}>
                  <Icon name="download" size={18} />
                </span>
                <span>Install DisasterChain App</span>
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
