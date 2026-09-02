import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Icon from './Icons';

const Navbar = ({ onOpenSos, onToggleSidebar, isMobileMenuOpen }) => {
  const { user, isAuthenticated, isAdmin, logout, demoLogin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="app-navbar">
      {/* Brand & Mobile Hamburger Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="btn btn-ghost btn-sm"
          style={{
            display: 'none',
            padding: '0.4rem',
            color: 'var(--text-secondary)',
          }}
          aria-label="Toggle navigation drawer"
          id="mobile-sidebar-toggle"
        >
          <Icon name={isMobileMenuOpen ? 'x' : 'menu'} size={22} />
        </button>

        <style>{`
          @media (max-width: 960px) {
            #mobile-sidebar-toggle {
              display: inline-flex !important;
            }
          }
        `}</style>

        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #ff334b, #6366f1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(255, 51, 75, 0.45)',
              color: '#ffffff',
            }}
          >
            <Icon name="shield-check" size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ffffff' }}>
              <span>DisasterChain</span>
              <span className="pulse-indicator" title="Live Emergency Grid Active"></span>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1, letterSpacing: '0.02em' }}>
              Crisis Command & Transparency
            </div>
          </div>
        </Link>
      </div>

      {/* Action Controls & Authentication Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'nowrap' }}>
        {/* Urgent Emergency SOS Trigger Button */}
        <button
          onClick={onOpenSos}
          className="btn btn-sos"
          style={{ fontSize: '0.84rem', padding: '0.55rem 1.15rem' }}
          id="navbar-sos-btn"
        >
          <Icon name="alert-circle" size={17} color="#ffffff" />
          <span>SUBMIT SOS</span>
        </button>

        {/* Low-Connectivity Mode Switcher */}
        <Link
          to="/offline"
          className="btn btn-outline"
          style={{ fontSize: '0.8rem', padding: '0.5rem 0.85rem' }}
          title="Low-Connectivity & Offline Emergency Hotlines"
        >
          <Icon name="wifi-off" size={16} color="var(--accent-cyan)" />
          <span className="hide-on-mobile">Low-Connectivity</span>
        </Link>

        <style>{`
          @media (max-width: 640px) {
            .hide-on-mobile {
              display: none;
            }
          }
        `}</style>

        {isAuthenticated ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Link
              to="/profile"
              style={{
                background: 'rgba(22, 35, 64, 0.75)',
                border: '1px solid var(--border-subtle)',
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.55rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="View Account & Security Profile"
            >
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: isAdmin ? 'linear-gradient(135deg, #6366f1, #a855f7)' : 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.78rem',
                  color: '#ffffff',
                }}
              >
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div style={{ textAlign: 'left' }} className="hide-on-mobile">
                <div style={{ fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#ffffff' }}>
                  <span>{user?.name || 'Citizen'}</span>
                  {user?.isVerified && <Icon name="check-circle" size={13} color="#10b981" />}
                </div>
                <div style={{ fontSize: '0.68rem', color: isAdmin ? '#a5b4fc' : '#67e8f9', textTransform: 'capitalize' }}>
                  {isAdmin ? '🛡️ Administrator' : '👤 Citizen'}
                </div>
              </div>
            </Link>

            <button
              onClick={handleLogout}
              className="btn btn-outline"
              style={{ padding: '0.45rem 0.75rem', fontSize: '0.78rem' }}
              title="Sign Out"
            >
              <Icon name="log-out" size={15} />
              <span className="hide-on-mobile">Logout</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => demoLogin('student')}
              className="btn btn-secondary hide-on-mobile"
              style={{ fontSize: '0.8rem', padding: '0.45rem 0.75rem' }}
              title="Instant 1-click evaluation demo student login"
            >
              Student Demo
            </button>
            <button
              type="button"
              onClick={() => demoLogin('admin')}
              className="btn btn-secondary hide-on-mobile"
              style={{ fontSize: '0.8rem', padding: '0.45rem 0.75rem', borderColor: 'rgba(99, 102, 241, 0.4)' }}
              title="Instant 1-click evaluation demo admin login"
            >
              Admin Demo
            </button>
            <Link to="/login" className="btn btn-primary" style={{ fontSize: '0.82rem', padding: '0.48rem 0.95rem' }}>
              <Icon name="user" size={15} />
              <span>Sign In</span>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
