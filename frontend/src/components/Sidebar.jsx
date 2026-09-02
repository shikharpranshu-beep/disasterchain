import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Icon from './Icons';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, isAdmin } = useAuth();
  const role = user?.role || 'citizen';
  const isResponder = role === 'responder';
  const isNgo = role === 'ngo';
  const isVolunteer = role === 'volunteer';

  const navGroups = [
    {
      title: 'Command Overview',
      items: [
        { label: 'Emergency Dashboard', path: '/dashboard', icon: 'activity' },
      ],
    },
    {
      title: 'Emergency Response',
      items: [
        { label: 'SOS Distress Signals', path: '/sos', icon: 'sos', badge: 'LIVE' },
        { label: 'Available Shelters', path: '/shelters', icon: 'shelter' },
        { label: 'Affected Areas Map', path: '/affected-areas', icon: 'map' },
        { label: 'Emergency Alerts', path: '/alerts', icon: 'bell' },
      ],
    },
    {
      title: 'Preparedness & Reporting',
      items: [
        { label: 'Disaster Safety Guides', path: '/guides', icon: 'guide' },
        { label: 'Report Campus Hazard', path: '/incidents', icon: 'warning' },
        { label: 'Emergency Directory', path: '/resources', icon: 'hospital' },
      ],
    },
    {
      title: 'Cryptographic Transparency',
      items: [
        { label: 'Donations Registry', path: '/donations', icon: 'donations' },
        { label: 'Resource Tracking', path: '/resource-tracking', icon: 'logistics' },
        { label: 'Transparency Ledger', path: '/transparency', icon: 'ledger' },
      ],
    },
    {
      title: 'Personal & Offline',
      items: [
        { label: 'My Security Profile', path: '/profile', icon: 'profile' },
        { label: 'My Submitted Reports', path: '/my-reports', icon: 'report' },
        { label: 'Low-Connectivity Mode', path: '/offline', icon: 'offline' },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      <div
        className={`sidebar-overlay ${isOpen ? 'active' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className={`app-sidebar ${isOpen ? 'open' : ''}`}>
        {/* Admin Quick Jump Banner */}
        {isAdmin && (
          <div style={{ marginBottom: '1rem', padding: '0 0.25rem' }}>
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
                fontSize: '0.84rem',
                borderColor: 'rgba(99, 102, 241, 0.4)',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(67, 56, 202, 0.3))',
              }}
            >
              <Icon name="shield" size={17} color="#a5b4fc" />
              <span>Admin Control Center</span>
            </NavLink>
          </div>
        )}

        {/* Responder / NGO Role Badge */}
        {!isAdmin && (isResponder || isNgo || isVolunteer) && (
          <div
            style={{
              marginBottom: '1rem',
              padding: '0.5rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              fontSize: '0.78rem',
              color: '#c7d2fe',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
            }}
          >
            <Icon name="shield-check" size={14} color="#818cf8" />
            <span>Role: <strong style={{ textTransform: 'capitalize', color: '#ffffff' }}>{role}</strong></span>
          </div>
        )}

        {/* Navigation Sections */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {navGroups.map((group, gIdx) => (
            <div key={gIdx}>
              <div className="nav-section-label">{group.title}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                {group.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `nav-link-item ${isActive ? 'active' : ''}`
                    }
                  >
                    <Icon name={item.icon} size={18} />
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {item.badge && (
                      <span
                        className="badge badge-critical"
                        style={{ fontSize: '0.62rem', padding: '0.15rem 0.45rem' }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Cryptographic Ledger Status Footer */}
        <div
          style={{
            marginTop: 'auto',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--border-subtle)',
            fontSize: '0.74rem',
            color: 'var(--text-muted)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#a5b4fc', fontWeight: 700 }}>
            <Icon name="blockchain" size={15} color="var(--accent-indigo)" />
            <span>Prototype Testnet Active</span>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-dim)' }}>
            SHA-256 Ledger &bull; Node Sync OK
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
