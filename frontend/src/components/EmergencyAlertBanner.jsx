import React from 'react';
import { Link } from 'react-router-dom';

const EmergencyAlertBanner = ({ alerts = [] }) => {
  const activeAlert = alerts.find((a) => a.active && a.severity === 'Critical') || alerts[0];

  if (!activeAlert) return null;

  return (
    <div
      style={{
        background: activeAlert.severity === 'Critical'
          ? 'linear-gradient(90deg, rgba(220, 38, 38, 0.95), rgba(185, 28, 28, 0.95))'
          : 'linear-gradient(90deg, rgba(245, 158, 11, 0.95), rgba(217, 119, 6, 0.95))',
        color: '#ffffff',
        padding: '0.65rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 'var(--radius-md)',
        marginBottom: '1.5rem',
        boxShadow: '0 4px 15px rgba(220, 38, 38, 0.3)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
        <span style={{ fontSize: '1.25rem', animation: 'pulse-red 1.5s infinite' }}>🚨</span>
        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <strong style={{ textTransform: 'uppercase', marginRight: '0.5rem', letterSpacing: '0.05em' }}>
            [{activeAlert.severity} ALERT]:
          </strong>
          <span>{activeAlert.title}</span> — <span style={{ opacity: 0.9 }}>{activeAlert.location}</span>
        </div>
      </div>

      <Link
        to="/alerts"
        style={{
          background: 'rgba(0, 0, 0, 0.25)',
          padding: '0.35rem 0.85rem',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.8rem',
          fontWeight: 700,
          whiteSpace: 'nowrap',
          marginLeft: '1rem',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        }}
      >
        View Action Plan →
      </Link>
    </div>
  );
};

export default EmergencyAlertBanner;
