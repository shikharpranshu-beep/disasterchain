import React from 'react';
import { useTranslation } from '../i18n/i18n';
import Icon from './Icons';

const AreaDetailModal = ({ isOpen = true, onClose, area, item }) => {
  const { t } = useTranslation();
  const targetArea = area || item;
  if ((isOpen !== undefined && !isOpen) || !targetArea) return null;

  const isCritical = targetArea.severity === 'Critical';
  const isHigh = targetArea.severity === 'High';
  const lat = Number(targetArea.latitude ?? targetArea.coordinates?.latitude) || 28.6139;
  const lng = Number(targetArea.longitude ?? targetArea.coordinates?.longitude) || 77.2090;

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '620px', padding: '1.75rem' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span className={`badge badge-${targetArea.severity?.toLowerCase()}`}>
                {targetArea.severity} {t('affectedAreas.impactZone', 'IMPACT ZONE')}
              </span>
              <span className="badge badge-neutral">{t('common.status', 'STATUS')}: {targetArea.status || 'Active'}</span>
            </div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.25 }}>
              {targetArea.name}
            </h2>
            <div style={{ fontSize: '0.85rem', color: '#818cf8', fontWeight: 700, marginTop: '0.2rem' }}>
              {t('affectedAreas.primaryThreat', 'Primary Threat:')} {targetArea.disasterType}
            </div>
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
          {targetArea.description}
        </div>

        {/* Casualty & Hazard Metrics */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.75rem',
            marginBottom: '1.25rem',
          }}
        >
          <div style={{ background: 'rgba(15, 24, 44, 0.85)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('affectedAreas.affectedPopulation', 'Affected People')}</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff', marginTop: '0.2rem' }}>
              {(targetArea.affectedPeople || 0).toLocaleString()}
            </div>
          </div>

          <div style={{ background: 'rgba(255, 51, 75, 0.1)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255, 51, 75, 0.3)', textAlign: 'center' }}>
            <div style={{ fontSize: '0.74rem', color: '#ff6b7e', textTransform: 'uppercase' }}>{t('map.activeSosLayer', 'Active SOS Signals')}</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ff4d63', marginTop: '0.2rem' }}>
              {targetArea.activeSOS || 0}
            </div>
          </div>

          <div style={{ background: 'rgba(15, 24, 44, 0.85)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('affectedAreas.impactRadius', 'Radius Impact')}</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#38bdf8', marginTop: '0.2rem' }}>
              {isCritical ? '~1.8 km' : isHigh ? '~1.4 km' : '~1.0 km'}
            </div>
          </div>
        </div>

        {/* Coordinates and Navigation */}
        <div
          style={{
            background: 'rgba(15, 24, 44, 0.85)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '0.9rem 1.15rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.25rem',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Icon name="map-pin" size={16} color="#818cf8" />
            <span style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
              {t('affectedAreas.geoCenter', 'Geo-Center:')} {lat.toFixed(4)}, {lng.toFixed(4)}
            </span>
          </div>

          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.78rem' }}
          >
            <Icon name="compass" size={14} color="#38bdf8" />
            <span>{t('shelters.getDirections', 'Open in Satellite Maps')}</span>
          </a>
        </div>

        {/* Civil Protection Protocol */}
        <div
          style={{
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem 1rem',
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
            marginBottom: '1.25rem',
            lineHeight: 1.5,
          }}
        >
          <strong style={{ color: '#fbbf24' }}>⚠️ {t('affectedAreas.evacuationProtocols', 'Evacuation & Sector Precautions:')}</strong>
          <ul style={{ paddingLeft: '1.15rem', marginTop: '0.35rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <li>{t('affectedAreas.precaution1', 'Avoid floodwaters and downed electrical lines in this sector.')}</li>
            <li>{t('affectedAreas.precaution2', 'Proceed immediately to designated safe shelters if ordered by emergency services.')}</li>
            <li>{t('affectedAreas.precaution3', 'Use battery-powered radios if mobile cellular coverage drops.')}</li>
          </ul>
        </div>

        <button onClick={onClose} className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }}>
          {t('common.close', 'Dismiss Sector Profile')}
        </button>
      </div>
    </div>
  );
};

export default AreaDetailModal;
