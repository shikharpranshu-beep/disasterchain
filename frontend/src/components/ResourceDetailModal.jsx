import React from 'react';
import Icon from './Icons';

const ResourceDetailModal = ({ isOpen, onClose, resource }) => {
  if (!isOpen || !resource) return null;

  const lat = resource.latitude || 28.6139;
  const lng = resource.longitude || 77.2090;
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '600px', padding: '1.75rem' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.35rem' }}>
              <span className="badge badge-info" style={{ fontSize: '0.74rem' }}>
                {resource.type}
              </span>
              <span
                className="badge"
                style={{
                  background:
                    resource.status === 'Operational' || resource.status === 'Available'
                      ? 'rgba(16, 185, 129, 0.2)'
                      : resource.status === 'Limited'
                      ? 'rgba(245, 158, 11, 0.2)'
                      : 'rgba(255, 51, 75, 0.2)',
                  color:
                    resource.status === 'Operational' || resource.status === 'Available'
                      ? '#34d399'
                      : resource.status === 'Limited'
                      ? '#fbbf24'
                      : '#ff6b7e',
                  border: '1px solid currentColor',
                  fontSize: '0.74rem',
                }}
              >
                {resource.status || 'Operational'}
              </span>
            </div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.25 }}>
              {resource.name}
            </h2>
          </div>

          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '0.4rem', color: 'var(--text-muted)' }}>
            <Icon name="close" size={20} />
          </button>
        </div>

        {/* Description Box */}
        <div
          style={{
            background: 'rgba(11, 18, 34, 0.9)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '1.15rem',
            lineHeight: 1.6,
            fontSize: '0.9rem',
            color: 'var(--text-primary)',
            marginBottom: '1.25rem',
          }}
        >
          {resource.description}
        </div>

        {/* Location & Navigation */}
        <div
          style={{
            background: 'rgba(15, 24, 44, 0.85)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem 1.15rem',
            marginBottom: '1.25rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <div>
            <div style={{ fontSize: '0.86rem', color: '#ffffff', fontWeight: 600 }}>
              {resource.address}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '0.15rem' }}>
              GPS: {lat.toFixed(4)}, {lng.toFixed(4)}
            </div>
          </div>

          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.78rem' }}
          >
            <Icon name="compass" size={13} color="#38bdf8" />
            <span>Navigate</span>
          </a>
        </div>

        {/* Contact Hotline & Action */}
        <div
          style={{
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '1.15rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              DIRECT EMERGENCY LINE
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#38bdf8' }}>
              {resource.phone}
            </div>
          </div>

          <a
            href={`tel:${resource.phone}`}
            className="btn btn-primary"
            style={{ padding: '0.6rem 1.25rem' }}
          >
            <Icon name="phone" size={15} />
            <span>Call Facility Now</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default ResourceDetailModal;
