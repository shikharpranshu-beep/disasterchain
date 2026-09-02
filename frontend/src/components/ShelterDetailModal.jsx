import React from 'react';
import Icon from './Icons';

const ShelterDetailModal = ({ isOpen, onClose, shelter }) => {
  if (!isOpen || !shelter) return null;

  const capacity = Number(shelter.capacity) || 1;
  const occupancy = Number(shelter.occupancy) || 0;
  const percent = Math.min(100, Math.round((occupancy / capacity) * 100));
  const isFull = percent >= 100;
  const isClosed = shelter.status === 'Temporarily Closed';
  const availableBeds = Math.max(0, capacity - occupancy);

  const lat = shelter.latitude || 28.6139;
  const lng = shelter.longitude || 77.2090;

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  const osmUrl = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=%3B${lat}%2C${lng}`;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '640px', padding: '1.75rem' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
              <span
                className={`badge ${
                  isClosed
                    ? 'badge-neutral'
                    : isFull
                    ? 'badge-critical'
                    : 'badge-success'
                }`}
                style={{ fontSize: '0.72rem' }}
              >
                {isClosed ? 'TEMPORARILY CLOSED' : isFull ? '🔴 CAPACITY FULL' : '🟢 OPEN & AVAILABLE'}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                ID: <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{shelter._id?.substring(0, 8) || 'SH-104'}</strong>
              </span>
            </div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.25 }}>
              {shelter.name}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="btn btn-ghost"
            style={{ padding: '0.4rem', color: 'var(--text-muted)' }}
            aria-label="Close dialog"
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        {/* Location & GPS Badge */}
        <div
          style={{
            background: 'rgba(15, 24, 44, 0.85)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '0.9rem 1.15rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', flex: 1, minWidth: '220px' }}>
            <Icon name="map-pin" size={17} color="#818cf8" style={{ marginTop: '2px', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '0.88rem', color: '#ffffff', fontWeight: 600 }}>
                {shelter.address}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '0.15rem' }}>
                Coordinates: {lat.toFixed(4)}, {lng.toFixed(4)}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.45rem' }}>
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem' }}
            >
              <Icon name="compass" size={14} color="#38bdf8" />
              <span>Google Maps</span>
            </a>
            <a
              href={osmUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline btn-sm"
              style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem' }}
            >
              <Icon name="map" size={14} />
              <span>OSM</span>
            </a>
          </div>
        </div>

        {/* Occupancy Progress & Bed Gauge */}
        <div
          style={{
            background: 'rgba(11, 18, 34, 0.95)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
            marginBottom: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Occupancy Capacity
            </span>
            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: isFull ? '#ff4d63' : '#34d399' }}>
              {occupancy} / {capacity} Beds ({percent}%)
            </span>
          </div>

          {/* Progress Bar */}
          <div style={{ width: '100%', height: '12px', background: '#1e293b', borderRadius: '6px', overflow: 'hidden', marginBottom: '0.65rem' }}>
            <div
              style={{
                width: `${percent}%`,
                height: '100%',
                background: isFull
                  ? '#ff334b'
                  : percent > 75
                  ? '#f59e0b'
                  : 'linear-gradient(90deg, #10b981, #06b6d4)',
                transition: 'width 0.4s ease',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>
              Current Residents: <strong style={{ color: '#ffffff' }}>{occupancy} Persons</strong>
            </span>
            <span style={{ color: isFull ? '#ff6b7e' : '#34d399', fontWeight: 700 }}>
              {isFull ? '🔴 Zero Bed Availability' : `🟢 ${availableBeds} Available Beds Ready`}
            </span>
          </div>
        </div>

        {/* Facilities & Amenities Checklist */}
        <div style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Icon name="shield-check" size={17} color="#34d399" />
            <span>Available Amenities & Relief Facilities</span>
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
            {shelter.facilities && shelter.facilities.length > 0 ? (
              shelter.facilities.map((facility, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(99, 102, 241, 0.08)',
                    border: '1px solid rgba(99, 102, 241, 0.25)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.55rem 0.75rem',
                    fontSize: '0.82rem',
                    color: '#c7d2fe',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                  }}
                >
                  <span style={{ color: '#34d399', fontWeight: 800 }}>✓</span>
                  <span>{facility}</span>
                </div>
              ))
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                Standard emergency bedding, food, and water provided.
              </div>
            )}
          </div>
        </div>

        {/* Shelter Safe Zone Guidelines */}
        <div
          style={{
            background: 'rgba(6, 182, 212, 0.08)',
            border: '1px solid rgba(6, 182, 212, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem 1rem',
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
            marginBottom: '1.25rem',
            lineHeight: 1.5,
          }}
        >
          <strong style={{ color: '#38bdf8' }}>ℹ️ Check-In & Safety Instructions:</strong>
          <ul style={{ paddingLeft: '1.15rem', marginTop: '0.35rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <li>Present Student ID or Government Identification at front desk security.</li>
            <li>Medical triage station available at Entrance Hall B.</li>
            <li>Children, elderly, and injured individuals receive priority bed placement.</li>
          </ul>
        </div>

        {/* Contact & Actions Footer */}
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
              DIRECT SHELTER HOTLINE
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Icon name="phone" size={16} color="#38bdf8" />
              <span>{shelter.phone || '+91 11 2345 6780'}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.65rem' }}>
            <a
              href={`tel:${shelter.phone || '+911123456780'}`}
              className="btn btn-primary"
              style={{ padding: '0.6rem 1.15rem' }}
            >
              <Icon name="phone" size={15} />
              <span>Call Shelter</span>
            </a>

            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
              style={{ padding: '0.6rem 1.15rem' }}
            >
              <Icon name="compass" size={15} />
              <span>Get Directions</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShelterDetailModal;
