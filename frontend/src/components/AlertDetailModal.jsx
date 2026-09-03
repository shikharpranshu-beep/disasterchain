import React from 'react';
import Icon from './Icons';

const AlertDetailModal = ({ isOpen = true, onClose, alert, item }) => {
  const targetAlert = alert || item;
  if ((isOpen !== undefined && !isOpen) || !targetAlert) return null;

  const isCritical = targetAlert.severity === 'Critical';
  const isDanger = targetAlert.severity === 'Danger';
  const isExpired = !targetAlert.active || (targetAlert.expiresAt && new Date(targetAlert.expiresAt) < new Date());

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '580px', padding: '1.75rem' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: isCritical
                  ? 'rgba(255, 51, 75, 0.15)'
                  : isDanger
                  ? 'rgba(249, 115, 22, 0.15)'
                  : 'rgba(245, 158, 11, 0.15)',
                border: `1px solid ${isCritical ? '#ff334b' : isDanger ? '#f97316' : '#f59e0b'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="bell" size={22} color={isCritical ? '#ff334b' : isDanger ? '#f97316' : '#fbbf24'} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                <span className={`badge badge-${targetAlert.severity?.toLowerCase()}`} style={{ fontSize: '0.7rem' }}>
                  {targetAlert.severity} ADVISORY
                </span>
                {isExpired ? (
                  <span className="badge badge-neutral" style={{ fontSize: '0.68rem' }}>EXPIRED / ARCHIVED</span>
                ) : (
                  <span className="badge badge-success" style={{ fontSize: '0.68rem' }}>LIVE BROADCAST</span>
                )}
              </div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.3 }}>
                {targetAlert.title}
              </h2>
            </div>
          </div>

          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '0.4rem', color: 'var(--text-muted)' }}>
            <Icon name="close" size={20} />
          </button>
        </div>

        {/* Message */}
        <div
          style={{
            background: 'rgba(11, 18, 34, 0.9)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            marginBottom: '1.25rem',
            lineHeight: 1.6,
            fontSize: '0.92rem',
            color: 'var(--text-primary)',
          }}
        >
          {targetAlert.message}
        </div>

        {/* Metadata Details Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '0.75rem',
            marginBottom: '1.25rem',
            fontSize: '0.82rem',
          }}
        >
          <div style={{ background: 'rgba(15, 24, 44, 0.7)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Affected Location:</div>
            <strong style={{ color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Icon name="map-pin" size={13} color="#818cf8" />
              <span>{targetAlert.location}</span>
            </strong>
          </div>

          <div style={{ background: 'rgba(15, 24, 44, 0.7)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Hazard Classification:</div>
            <strong style={{ color: '#fbbf24' }}>{targetAlert.type || 'Civil Defense / Weather'}</strong>
          </div>

          <div style={{ background: 'rgba(15, 24, 44, 0.7)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Issued Timestamp:</div>
            <strong style={{ color: '#ffffff' }}>
              {new Date(targetAlert.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
            </strong>
          </div>

          <div style={{ background: 'rgba(15, 24, 44, 0.7)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Expiration Status:</div>
            <strong style={{ color: isExpired ? '#94a3b8' : '#34d399' }}>
              {targetAlert.expiresAt ? new Date(targetAlert.expiresAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Until Resolved'}
            </strong>
          </div>
        </div>

        {/* Action Button */}
        <button onClick={onClose} className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }}>
          Acknowledge Advisory
        </button>
      </div>
    </div>
  );
};

export default AlertDetailModal;
