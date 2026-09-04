import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../i18n/i18n';
import Icon from './Icons';

const EmergencyAlertBanner = ({ alerts = [] }) => {
  const { t } = useTranslation();
  // Filter only active, non-expired alerts
  const validActiveAlerts = (alerts || []).filter((a) => {
    if (!a.active) return false;
    if (a.expiresAt && new Date(a.expiresAt) < new Date()) return false;
    return true;
  });

  const activeAlert =
    validActiveAlerts.find((a) => a.severity === 'Critical') ||
    validActiveAlerts.find((a) => a.severity === 'Danger') ||
    validActiveAlerts.find((a) => a.severity === 'Warning') ||
    validActiveAlerts[0];

  if (!activeAlert) return null;

  const isCritical = activeAlert.severity === 'Critical';
  const isDanger = activeAlert.severity === 'Danger';

  return (
    <div
      style={{
        background: isCritical
          ? 'linear-gradient(90deg, rgba(255, 51, 75, 0.96) 0%, rgba(220, 38, 38, 0.94) 100%)'
          : isDanger
          ? 'linear-gradient(90deg, rgba(249, 115, 22, 0.96) 0%, rgba(234, 88, 12, 0.94) 100%)'
          : 'linear-gradient(90deg, rgba(245, 158, 11, 0.96) 0%, rgba(217, 119, 6, 0.94) 100%)',
        color: '#ffffff',
        padding: '0.85rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 'var(--radius-lg)',
        marginBottom: '1.75rem',
        boxShadow: isCritical
          ? '0 6px 24px rgba(255, 51, 75, 0.35)'
          : '0 6px 24px rgba(245, 158, 11, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        gap: '1rem',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: 1, minWidth: '280px' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'rgba(0, 0, 0, 0.28)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: isCritical ? 'pulse-sos 1.8s infinite' : 'none',
            flexShrink: 0,
          }}
        >
          <Icon name="alert-circle" size={20} color="#ffffff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                background: 'rgba(0, 0, 0, 0.35)',
                padding: '0.2rem 0.55rem',
                borderRadius: '4px',
                letterSpacing: '0.05em',
              }}
            >
              {activeAlert.severity} {t('alerts.title', 'ADVISORY')}
            </span>
            <strong style={{ fontSize: '0.98rem', fontWeight: 800 }}>{activeAlert.title}</strong>
          </div>
          <div style={{ fontSize: '0.84rem', opacity: 0.95, marginTop: '0.2rem' }}>
            {t('alerts.affectedLocation', 'Affected Sector:')} <strong>{activeAlert.location}</strong> &bull; {t('alerts.stayTuned', 'Stay tuned to broadcast instructions')}
          </div>
        </div>
      </div>

      <Link
        to="/alerts"
        className="btn btn-sm"
        style={{
          background: 'rgba(0, 0, 0, 0.4)',
          color: '#ffffff',
          border: '1px solid rgba(255, 255, 255, 0.35)',
          fontWeight: 700,
          whiteSpace: 'nowrap',
          padding: '0.5rem 1.1rem',
        }}
      >
        <span>{t('alerts.viewProtocol', 'View Safety Protocol')}</span>
        <Icon name="arrow-up-right" size={15} />
      </Link>
    </div>
  );
};

export default EmergencyAlertBanner;
