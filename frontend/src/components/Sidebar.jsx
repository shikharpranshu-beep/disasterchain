import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { isAuthenticated, isAdmin } = useAuth();

  const navItems = [
    { label: 'Emergency Dashboard', path: '/dashboard', icon: '📊', group: 'Overview' },
    { label: 'SOS Requests', path: '/sos', icon: '🚨', group: 'Response' },
    { label: 'Available Shelters', path: '/shelters', icon: '🏠', group: 'Response' },
    { label: 'Affected Areas Map', path: '/affected-areas', icon: '🗺️', group: 'Response' },
    { label: 'Emergency Alerts', path: '/alerts', icon: '🔔', group: 'Response' },
    { label: 'Disaster Guides', path: '/guides', icon: '📖', group: 'Preparedness' },
    { label: 'Report Incident / Hazard', path: '/incidents', icon: '⚠️', group: 'Preparedness' },
    { label: 'Emergency Resources', path: '/resources', icon: '🏥', group: 'Preparedness' },
    { label: 'My Security Profile', path: '/profile', icon: '👤', group: 'Personal' },
    { label: 'My Submitted Reports', path: '/my-reports', icon: '📝', group: 'Personal' },
    { label: 'Donations Registry', path: '/donations', icon: '📦', group: 'Transparency' },
    { label: 'Resource Tracking', path: '/resource-tracking', icon: '🚚', group: 'Transparency' },
    { label: 'Transparency Ledger', path: '/transparency', icon: '⛓️', group: 'Transparency' },
    { label: 'Low-Connectivity Mode', path: '/offline', icon: '📡', group: 'Emergency' },
  ];

  return (
    <aside
      style={{
        width: '260px',
        background: 'rgba(15, 23, 42, 0.95)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        padding: '1.25rem 0.75rem',
        overflowY: 'auto',
        flexShrink: 0,
      }}
    >
      {/* Admin Quick Jump Banner */}
      {isAdmin && (
        <div style={{ marginBottom: '1rem', padding: '0 0.5rem' }}>
          <NavLink
            to="/admin"
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: isActive
                ? 'linear-gradient(135deg, #6366f1, #4338ca)'
                : 'rgba(99, 102, 241, 0.15)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.88rem',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)',
            })}
          >
            <span>🛡️</span>
            <span>Admin Control Panel</span>
          </NavLink>
        </div>
      )}

      {/* Navigation Groups */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.86rem',
              fontWeight: isActive ? 600 : 500,
              color: isActive ? '#ffffff' : 'var(--text-secondary)',
              background: isActive ? 'rgba(99, 102, 241, 0.18)' : 'transparent',
              borderLeft: isActive ? '3px solid var(--accent-indigo)' : '3px solid transparent',
              transition: 'all 0.15s ease',
            })}
          >
            <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer Info */}
      <div
        style={{
          marginTop: 'auto',
          padding: '1rem 0.75rem 0.25rem',
          borderTop: '1px solid var(--border-subtle)',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
          <span style={{ color: 'var(--accent-indigo)' }}>⛓️</span>
          <span>Prototype Ledger Active</span>
        </div>
        <div>SHA-256 Verified Testnet</div>
      </div>
    </aside>
  );
};

export default Sidebar;
