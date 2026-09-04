import React from 'react';
import { useTranslation } from '../i18n/i18n';
import Icon from './Icons';

/**
 * Reusable Map Location & Emergency Intelligence Inspection Panel
 * Displays detailed geographic metadata + live DisasterChain telemetry for any selected entity on the 2D Command Map.
 */
const MapLocationPanel = ({
  entity,
  type, // 'city' | 'country' | 'shelter' | 'incident' | 'sos' | 'riskZone' | 'area'
  telemetry,
  onClose,
  onOpenShelter,
  onOpenIncident,
  onOpenSos,
  onNavigate,
}) => {
  const { t } = useTranslation();
  if (!entity) return null;

  const riskColor =
    telemetry?.riskLevel === 'CRITICAL'
      ? '#E53935'
      : telemetry?.riskLevel === 'HIGH'
      ? '#FF6B2C'
      : telemetry?.riskLevel === 'MEDIUM'
      ? '#F59E0B'
      : '#84CC16';

  return (
    <div
      className="spatial-panel"
      style={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        width: '340px',
        maxWidth: 'calc(100vw - 32px)',
        maxHeight: 'calc(100vh - 120px)',
        overflowY: 'auto',
        background: 'rgba(18, 11, 8, 0.95)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid var(--border-medium)',
        borderRadius: 'var(--radius-md)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.8), 0 0 20px rgba(255, 107, 44, 0.15)',
        zIndex: 1000,
        padding: '1.25rem',
        animation: 'modalSlideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--orange-primary)',
                background: 'rgba(255, 107, 44, 0.12)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid rgba(255, 107, 44, 0.3)',
              }}
            >
              {type === 'country' ? '🌐 Sovereign Territory' : type === 'city' ? '🏙️ Geographic Urban Hub' : type === 'shelter' ? '🏛️ Safe Shelter Facility' : type === 'sos' ? '🚨 Distress SOS Signal' : '⚠️ Tactical Field Entity'}
            </span>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.25rem', color: '#ffffff', marginTop: '4px' }}>
            {entity.name || entity.title || 'Location Intelligence'}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            {entity.country || entity.region || entity.subtitle || entity.address || 'Operational Command Grid'}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px',
            fontSize: '1rem',
            lineHeight: 1,
          }}
          title="Close Panel"
        >
          ✕
        </button>
      </div>

      {/* Geospatial Coordinates HUD */}
      {(entity.lat != null || entity.latitude != null) && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            background: 'rgba(0, 0, 0, 0.4)',
            padding: '0.65rem 0.85rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            marginBottom: '1rem',
          }}
        >
          <div>
            <div className="micro-label" style={{ color: 'var(--text-muted)' }}>LATITUDE</div>
            <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.84rem', color: '#ffffff' }}>
              {(entity.lat ?? entity.latitude)?.toFixed(4)}° N
            </div>
          </div>
          <div>
            <div className="micro-label" style={{ color: 'var(--text-muted)' }}>LONGITUDE</div>
            <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.84rem', color: '#ffffff' }}>
              {(entity.lon ?? entity.longitude)?.toFixed(4)}° E
            </div>
          </div>
        </div>
      )}

      {/* Live DisasterChain Status Banner */}
      <div
        style={{
          padding: '0.75rem',
          background: `rgba(${riskColor === '#E53935' ? '229, 57, 53' : riskColor === '#FF6B2C' ? '255, 107, 44' : '132, 204, 22'}, 0.1)`,
          border: `1px solid ${riskColor}40`,
          borderLeft: `4px solid ${riskColor}`,
          borderRadius: 'var(--radius-sm)',
          marginBottom: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="micro-label" style={{ color: 'var(--text-secondary)' }}>
            {t('dashboard.systemStatus', 'DISASTERCHAIN STATUS')}
          </div>
          <div style={{ fontWeight: 800, fontSize: '0.75rem', color: riskColor }}>
            {telemetry?.riskLevel ? `${telemetry.riskLevel} RISK` : 'OPERATIONAL'}
          </div>
        </div>
        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#ffffff', marginTop: '3px' }}>
          {telemetry?.hasActiveCrisis ? t('emergency.activeCrisis', 'Active Emergency Sector') : t('emergency.normalMonitoring', 'Normal Baseline Monitoring')}
        </div>
      </div>

      {/* Telemetry Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '1.25rem' }}>
        <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.6rem 0.75rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)' }}>
          <div className="micro-label" style={{ color: 'var(--crimson)' }}>{t('map.activeSosLayer', 'ACTIVE SOS')}</div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>
            {telemetry?.sosCount ?? 0}
          </div>
        </div>
        <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.6rem 0.75rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)' }}>
          <div className="micro-label" style={{ color: 'var(--orange-primary)' }}>{t('map.incidentsLayer', 'INCIDENTS')}</div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>
            {telemetry?.incidentCount ?? 0}
          </div>
        </div>
        <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.6rem 0.75rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)' }}>
          <div className="micro-label" style={{ color: 'var(--safe)' }}>{t('map.sheltersLayer', 'SAFE SHELTERS')}</div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>
            {telemetry?.shelterCount ?? 0}
          </div>
        </div>
        <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.6rem 0.75rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)' }}>
          <div className="micro-label" style={{ color: 'var(--amber)' }}>{t('alerts.title', 'ALERTS')}</div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>
            {telemetry?.alertCount ?? 0}
          </div>
        </div>
      </div>

      {/* Contextual Action Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {type === 'city' && (
          <button
            type="button"
            onClick={() => {
              if (onNavigate) onNavigate('/shelters');
            }}
            className="btn btn-primary btn-sm"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <Icon name="shelter" size={14} />
            <span>{t('shelters.viewNearby', 'VIEW NEARBY SHELTERS')} ({telemetry?.shelterCount ?? 0})</span>
          </button>
        )}

        {telemetry?.hasActiveCrisis && (
          <button
            type="button"
            onClick={() => {
              if (onNavigate) onNavigate('/incident-reports');
            }}
            className="btn btn-secondary btn-sm"
            style={{ width: '100%', justifyContent: 'center', borderColor: 'var(--crimson)', color: 'var(--crimson)' }}
          >
            <Icon name="incident" size={14} color="var(--crimson)" />
            <span>{t('incidents.viewField', 'VIEW FIELD INCIDENTS')} ({telemetry?.incidentCount ?? 0})</span>
          </button>
        )}

        {type === 'shelter' && (
          <>
            {entity.directionsUrl && (
              <a
                href={entity.directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary btn-sm"
                style={{ width: '100%', justifyContent: 'center', textDecoration: 'none' }}
              >
                <Icon name="mapPin" size={14} />
                <span>{t('shelters.getDirections', 'GET DIRECTIONS ↗')}</span>
              </a>
            )}
            {onOpenShelter && (
              <button
                type="button"
                onClick={() => onOpenShelter(entity)}
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <span>{t('shelters.viewFacilityDossier', 'VIEW FACILITY DOSSIER')}</span>
              </button>
            )}
          </>
        )}

        {type === 'sos' && onOpenSos && (
          <button
            type="button"
            onClick={() => onOpenSos(entity)}
            className="btn btn-danger btn-sm"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <Icon name="warning" size={14} />
            <span>{t('sos.openCommandAudit', 'OPEN SOS COMMAND AUDIT')}</span>
          </button>
        )}

        {type === 'incident' && onOpenIncident && (
          <button
            type="button"
            onClick={() => onOpenIncident(entity)}
            className="btn btn-secondary btn-sm"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <Icon name="incident" size={14} />
            <span>{t('incidents.viewReport', 'VIEW INCIDENT REPORT')}</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default MapLocationPanel;
