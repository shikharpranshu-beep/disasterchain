import React from 'react';
import { useTranslation } from '../i18n/i18n';
import Icon from './Icons';

const ShelterDetailModal = ({ isOpen = true, onClose, shelter, item }) => {
  const { t } = useTranslation();
  const targetShelter = shelter || item;
  if ((isOpen !== undefined && !isOpen) || !targetShelter) return null;

  const capacity = Number(targetShelter.capacity) || 1;
  const occupancy = Number(targetShelter.occupancy) || 0;
  const percent = Math.min(100, Math.round((occupancy / capacity) * 100));
  const isFull = percent >= 100;
  const isClosed = targetShelter.status === 'Temporarily Closed';
  const availableBeds = Math.max(0, capacity - occupancy);

  const lat = Number(targetShelter.latitude ?? targetShelter.coordinates?.latitude) || 28.6139;
  const lng = Number(targetShelter.longitude ?? targetShelter.coordinates?.longitude) || 77.2090;

  const googleMapsUrl = targetShelter.directionsUrl || `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
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
                {isClosed ? t('shelters.closed', 'TEMPORARILY CLOSED') : isFull ? `🔴 ${t('shelters.full', 'CAPACITY FULL')}` : `🟢 ${t('shelters.open', 'OPEN & AVAILABLE')}`}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                ID: <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{targetShelter._id?.substring(0, 8) || 'SH-104'}</strong>
              </span>
            </div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.25 }}>
              {targetShelter.name}
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
                {targetShelter.address}
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
            background: 'rgba(15, 24, 44, 0.85)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '1.15rem',
            marginBottom: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {t('shelters.capacity', 'Live Capacity Load')}
            </span>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: isFull ? 'var(--crimson)' : 'var(--mint)' }}>
              {percent}% {t('shelters.capacityRate', 'Full')}
            </span>
          </div>

          <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden', marginBottom: '0.85rem' }}>
            <div
              style={{
                width: `${percent}%`,
                height: '100%',
                background: isFull
                  ? 'linear-gradient(90deg, #f87171, #ef4444)'
                  : 'linear-gradient(90deg, #34d399, #10b981)',
                transition: 'width 0.4s ease',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', textAlign: 'center' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.5rem', borderRadius: 'var(--radius-xs)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t('shelters.capacity', 'TOTAL BEDS')}</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>{capacity}</div>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.5rem', borderRadius: 'var(--radius-xs)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t('shelters.occupancy', 'OCCUPIED')}</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{occupancy}</div>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.5rem', borderRadius: 'var(--radius-xs)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t('shelters.availableBeds', 'VACANT / OPEN')}</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: isFull ? 'var(--crimson)' : 'var(--mint)' }}>{availableBeds}</div>
            </div>
          </div>
        </div>

        {/* Facilities & Amenities Checklist */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.6rem', fontWeight: 700, letterSpacing: '0.05em' }}>
            {t('shelters.facilities', 'Verified Emergency Amenities & Facilities')}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.5rem' }}>
            {targetShelter.facilities && targetShelter.facilities.length > 0 ? (
              targetShelter.facilities.map((facility, idx) => (
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
                {t('shelters.standardFacilities', 'Standard emergency bedding, food, and water provided.')}
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
          <strong style={{ color: '#38bdf8' }}>ℹ️ {t('guides.immediateActions', 'Check-In & Safety Instructions:')}</strong>
          <ul style={{ paddingLeft: '1.15rem', marginTop: '0.35rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <li>{t('shelters.instruction1', 'Present Student ID or Government Identification at front desk security.')}</li>
            <li>{t('shelters.instruction2', 'Medical triage station available at Entrance Hall B.')}</li>
            <li>{t('shelters.instruction3', 'Children, elderly, and injured individuals receive priority bed placement.')}</li>
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
              {t('shelters.contactPhone', 'DIRECT SHELTER HOTLINE')}
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Icon name="phone" size={16} color="#38bdf8" />
              <span>{targetShelter.phone || '+91 11 2345 6780'}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.65rem' }}>
            <a
              href={`tel:${targetShelter.phone || '+911123456780'}`}
              className="btn btn-primary"
              style={{ padding: '0.6rem 1.15rem' }}
            >
              <Icon name="phone" size={15} />
              <span>{t('shelters.contactPhone', 'Call Shelter')}</span>
            </a>

            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
              style={{ padding: '0.6rem 1.15rem' }}
            >
              <Icon name="compass" size={15} />
              <span>{t('shelters.getDirections', 'Get Directions')}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShelterDetailModal;
