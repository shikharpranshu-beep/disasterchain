import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/i18n';
import Icon from './Icons';

const Sidebar = ({ isOpen, onClose, onOpenSos }) => {
  const { user, isAdmin } = useAuth();
  const { t } = useTranslation();
  const role = user?.role || 'citizen';
  const isPrivileged = role === 'responder' || role === 'ngo' || role === 'volunteer';

  const navItems = [
    { label: t('nav.commandHud', 'Command HUD'), path: '/dashboard', icon: 'activity', section: 'OPERATION' },
    { label: t('nav.emergencySos', 'Emergency SOS'), path: '/sos', icon: 'sos', badge: t('common.live', 'LIVE'), section: 'OPERATION' },
    { label: t('nav.reliefShelters', 'Relief Shelters'), path: '/shelters', icon: 'shelter', section: 'OPERATION' },
    { label: t('nav.affectedAreas', 'Affected Areas'), path: '/affected-areas', icon: 'map', section: 'OPERATION' },
    { label: t('nav.crisisAlerts', 'Crisis Alerts'), path: '/alerts', icon: 'bell', section: 'OPERATION' },
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

      {/* Mobile Floating Bottom Navigation Bar */}
      <nav className="mobile-nav-bar" aria-label="Mobile Navigation">
        <NavLink
          to="/dashboard"
          className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
        >
          <Icon name="activity" size={19} />
          <span>HUD</span>
        </NavLink>

        <NavLink
          to="/alerts"
          className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
        >
          <Icon name="bell" size={19} />
          <span>{t('common.warning', 'Alerts')}</span>
        </NavLink>

        {/* Floating Center SOS Beacon Button */}
        <button
          type="button"
          onClick={onOpenSos}
          className="mobile-nav-beacon"
          aria-label="Emergency SOS Beacon"
          title={t('nav.broadcastSos', 'Emergency SOS Dispatch')}
        >
          <Icon name="alert-circle" size={24} color="#ffffff" />
        </button>

        <NavLink
          to="/shelters"
          className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
        >
          <Icon name="shelter" size={19} />
          <span>{t('shelters.shelterTitle', 'Shelter')}</span>
        </NavLink>

        <NavLink
          to="/offline"
          className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
        >
          <Icon name="offline" size={19} />
          <span>{t('nav.offlineMode', 'Offline')}</span>
        </NavLink>
      </nav>
    </>
  );
};

export default Sidebar;
