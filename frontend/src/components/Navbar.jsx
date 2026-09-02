import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Icon from './Icons';

const Navbar = ({ onOpenSos }) => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
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
          <Icon name="shield-check" size={20} color="var(--cyan)" />
        </div>
        <div>
          <div className="hud-logo-title">
            <span>DISASTERCHAIN</span>
            <span className="hud-logo-tag">NET v2.6</span>
          </div>
        </div>
      </Link>

      {/* Center Telemetry Readout */}
      <div className="hud-telemetry">
        <div className="telemetry-chip">
          <span className="live-beacon-pulse" />
          <span style={{ color: 'var(--cyan)' }}>OPERATIONAL</span>
          <span style={{ opacity: 0.5 }}>|</span>
          <span>{timeStr || 'SYNCING...'}</span>
        </div>
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        {/* Urgent Emergency Beacon Button */}
        <button
          type="button"
          onClick={onOpenSos}
          className="btn btn-emergency btn-sm"
          id="navbar-sos-btn"
          style={{ letterSpacing: '0.04em' }}
        >
          <Icon name="alert-circle" size={16} color="#ffffff" />
          <span>BROADCAST SOS</span>
        </button>

        {/* Low-Connectivity Mode Switcher */}
        <Link
          to="/offline"
          className="btn btn-secondary btn-sm"
          title="Offline & Survivability Mode"
        >
          <Icon name="wifi-off" size={15} color="var(--cyan)" />
          <span style={{ fontSize: '0.78rem' }}>Offline Mode</span>
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
              title="Sign Out"
              style={{ color: 'var(--text-muted)' }}
            >
              <Icon name="logout" size={16} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Link to="/login" className="btn btn-ghost btn-sm">
              Sign In
            </Link>
            <Link to="/register" className="btn btn-primary btn-sm">
              Register
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
