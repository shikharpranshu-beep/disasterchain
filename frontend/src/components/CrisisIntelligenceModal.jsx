import React from 'react';
import Icon from './Icons';

const CrisisIntelligenceModal = ({ isOpen, onClose, item, onFocusGlobe }) => {
  if (!isOpen || !item) return null;

  const isCritical = item.priorityLevel === 'CRITICAL';
  const isHigh = item.priorityLevel === 'HIGH';
  const isMedium = item.priorityLevel === 'MEDIUM';

  const accentColor = isCritical
    ? '#E53935'
    : isHigh
    ? '#F97316'
    : isMedium
    ? '#F59E0B'
    : '#FFD166';

  const accentBg = isCritical
    ? 'rgba(229, 57, 53, 0.12)'
    : isHigh
    ? 'rgba(249, 115, 22, 0.12)'
    : isMedium
    ? 'rgba(245, 158, 11, 0.12)'
    : 'rgba(255, 209, 102, 0.12)';

  const handleGlobeFocus = () => {
    if (onFocusGlobe) {
      onFocusGlobe(item);
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '680px',
          padding: '1.75rem',
          maxHeight: '90vh',
          overflowY: 'auto',
          border: `1px solid ${accentColor}40`,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: accentBg,
                border: `1.5px solid ${accentColor}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isCritical ? `0 0 16px ${accentColor}50` : 'none',
              }}
            >
              <Icon
                name={isCritical ? 'alert-circle' : 'activity'}
                size={24}
                color={accentColor}
              />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    letterSpacing: '0.05em',
                    background: accentColor,
                    color: '#000000',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {isCritical && <span className="live-beacon-pulse critical" style={{ width: 6, height: 6 }} />}
                  {item.priorityLevel} PRIORITY
                </span>
                <span
                  className="badge badge-neutral"
                  style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}
                >
                  {item.entityType === 'sos' ? 'SOS Distressed' : 'Incident Hazard'}
                </span>
                <span
                  className="badge badge-info"
                  style={{ fontSize: '0.68rem' }}
                >
                  {item.status || 'Active'}
                </span>
              </div>
              <h2
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: '#ffffff',
                  margin: 0,
                  lineHeight: 1.3,
                }}
              >
                {item.title || `${item.emergencyType} Emergency`}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn btn-ghost"
            style={{ padding: '0.4rem', color: 'var(--text-muted)' }}
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        {/* Priority Score Bar */}
        <div
          style={{
            padding: '1rem',
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1.25rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginBottom: '0.4rem',
            }}
          >
            <span className="micro-label" style={{ color: accentColor }}>
              TRIAGE PRIORITY SCORE
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span
                style={{
                  fontSize: '1.6rem',
                  fontWeight: 900,
                  color: accentColor,
                  fontFamily: 'var(--font-display)',
                }}
              >
                {item.priorityScore}
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/ 100</span>
            </div>
          </div>

          <div
            style={{
              width: '100%',
              height: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '999px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${Math.min(100, item.priorityScore)}%`,
                height: '100%',
                backgroundColor: accentColor,
                borderRadius: '999px',
                transition: 'width 0.4s ease',
              }}
            />
          </div>
        </div>

        {/* Location & Key Operational Metrics */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '0.75rem',
            marginBottom: '1.25rem',
          }}
        >
          <div
            style={{
              padding: '0.75rem',
              background: 'rgba(10, 16, 30, 0.85)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-xs)',
            }}
          >
            <div className="micro-label" style={{ marginBottom: '0.2rem' }}>
              📍 LOCATION
            </div>
            <div style={{ fontSize: '0.86rem', color: '#ffffff', fontWeight: 600 }}>
              {item.location || 'Reported on Campus Grid'}
            </div>
            {item.coordinates && (
              <div
                style={{
                  fontSize: '0.7rem',
                  color: 'var(--cyan)',
                  fontFamily: 'var(--font-mono)',
                  marginTop: '0.15rem',
                }}
              >
                {item.coordinates.latitude?.toFixed(4)}, {item.coordinates.longitude?.toFixed(4)}
              </div>
            )}
          </div>

          <div
            style={{
              padding: '0.75rem',
              background: 'rgba(10, 16, 30, 0.85)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-xs)',
            }}
          >
            <div className="micro-label" style={{ marginBottom: '0.2rem' }}>
              👥 PEOPLE AFFECTED
            </div>
            <div style={{ fontSize: '0.86rem', color: '#ffffff', fontWeight: 700 }}>
              {item.peopleAffected || 1} individuals
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
              Severity Level: {item.severity}
            </div>
          </div>
        </div>

        {/* WHY: Explainability Reasons */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div
            className="micro-label"
            style={{
              color: 'var(--text-secondary)',
              marginBottom: '0.5rem',
              letterSpacing: '0.08em',
              fontWeight: 700,
            }}
          >
            🔍 WHY: SCORING FACTORS & ANALYSIS
          </div>
          <div
            style={{
              background: 'rgba(8, 14, 26, 0.9)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.75rem 1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.45rem',
            }}
          >
            {item.reasons && item.reasons.length > 0 ? (
              item.reasons.map((reason, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.5rem',
                    fontSize: '0.82rem',
                    color: '#e2e8f0',
                  }}
                >
                  <span style={{ color: accentColor, fontWeight: 700 }}>•</span>
                  <span>{reason}</span>
                </div>
              ))
            ) : (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Baseline emergency risk criteria evaluated.
              </div>
            )}
          </div>
        </div>

        {/* RECOMMENDED ACTIONS */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div
            className="micro-label"
            style={{
              color: 'var(--cyan)',
              marginBottom: '0.5rem',
              letterSpacing: '0.08em',
              fontWeight: 700,
            }}
          >
            ⚡ RECOMMENDED ACTIONS & PROTOCOLS
          </div>
          <div
            style={{
              background: 'rgba(8, 14, 26, 0.9)',
              border: '1px solid rgba(0, 240, 255, 0.25)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.75rem 1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            {item.recommendedActions && item.recommendedActions.length > 0 ? (
              item.recommendedActions.map((action, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.6rem',
                    fontSize: '0.84rem',
                    color: '#f8fafc',
                    lineHeight: 1.4,
                  }}
                >
                  <span style={{ color: 'var(--cyan)', fontWeight: 800 }}>→</span>
                  <span>{action}</span>
                </div>
              ))
            ) : (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Maintain nominal perimeter monitoring and report status changes.
              </div>
            )}
          </div>
        </div>

        {/* RECOMMENDED SAFE HAVEN */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div
            className="micro-label"
            style={{
              color: 'var(--mint)',
              marginBottom: '0.5rem',
              letterSpacing: '0.08em',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>🏛️ RECOMMENDED SAFE HAVEN</span>
            {item.recommendedShelter && (
              <span
                style={{
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: 'var(--mint)',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                }}
              >
                {item.recommendedShelter.matchScore}% MATCH
              </span>
            )}
          </div>

          {item.recommendedShelter ? (
            <div
              style={{
                background: 'rgba(6, 78, 59, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.9rem 1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.6rem',
              }}
            >
              {/* Header: Name and Distance */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#ffffff' }}>
                    {item.recommendedShelter.name}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                    📍 {item.recommendedShelter.address || 'Civil Defense Facility'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span
                    className="badge badge-success"
                    style={{ fontSize: '0.7rem', fontWeight: 800 }}
                  >
                    {item.recommendedShelter.distanceKm} km away
                  </span>
                </div>
              </div>

              {/* Bed Capacity and Occupancy Progress Bar */}
              <div style={{ background: 'rgba(5, 10, 20, 0.65)', padding: '0.5rem 0.65rem', borderRadius: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#cbd5e1' }}>
                  <span>
                    Available Beds: <strong style={{ color: 'var(--mint)' }}>{item.recommendedShelter.availableCapacity}</strong>
                  </span>
                  <span>
                    Occupancy: {item.recommendedShelter.occupied} / {item.recommendedShelter.capacity} ({item.recommendedShelter.occupancyPercent}%)
                  </span>
                </div>
                <div style={{ width: '100%', height: '5px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', marginTop: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${item.recommendedShelter.occupancyPercent}%`,
                      height: '100%',
                      background: item.recommendedShelter.occupancyPercent > 85 ? 'var(--amber)' : 'var(--mint)',
                    }}
                  />
                </div>
              </div>

              {/* Supporting Amenities */}
              {item.recommendedShelter.amenities && item.recommendedShelter.amenities.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {item.recommendedShelter.amenities.map((amenity, aIdx) => (
                    <span
                      key={aIdx}
                      style={{
                        fontSize: '0.66rem',
                        fontWeight: 600,
                        padding: '2px 7px',
                        borderRadius: '3px',
                        background: 'rgba(16, 185, 129, 0.12)',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                        color: '#6ee7b7',
                      }}
                    >
                      ✓ {amenity}
                    </span>
                  ))}
                </div>
              )}

              {/* Reasons */}
              {item.recommendedShelter.reasons && item.recommendedShelter.reasons.length > 0 && (
                <div style={{ fontSize: '0.74rem', color: '#cbd5e1', lineHeight: 1.35 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.67rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
                    RECOMMENDATION REASONS:
                  </div>
                  {item.recommendedShelter.reasons.map((r, rIdx) => (
                    <div key={rIdx} style={{ display: 'flex', gap: '4px' }}>
                      <span style={{ color: 'var(--mint)' }}>•</span>
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Shelter Interactive Buttons */}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.2rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    if (onFocusGlobe && item.recommendedShelter.coordinates) {
                      onFocusGlobe({
                        coordinates: item.recommendedShelter.coordinates,
                        id: item.recommendedShelter.shelterId,
                        title: item.recommendedShelter.name,
                      });
                      onClose();
                    }
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1, padding: '4px 8px', fontSize: '0.72rem', borderColor: 'var(--mint)', color: 'var(--mint)', justifyContent: 'center' }}
                >
                  <Icon name="map-pin" size={13} color="var(--mint)" />
                  <span>VIEW SHELTER</span>
                </button>

                {item.recommendedShelter.directionsUrl && (
                  <a
                    href={item.recommendedShelter.directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1, padding: '4px 8px', fontSize: '0.72rem', background: 'var(--mint)', color: '#04100c', justifyContent: 'center' }}
                  >
                    <Icon name="navigation" size={13} color="#04100c" />
                    <span>GET DIRECTIONS ↗</span>
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '1rem',
                textAlign: 'center',
                color: 'var(--text-muted)',
              }}
            >
              <div style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>🛡️</div>
              <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#ffffff' }}>
                NO SUITABLE SHELTER FOUND
              </div>
              <div style={{ fontSize: '0.72rem', marginTop: '0.15rem' }}>
                All monitored shelters are currently at full capacity or undergoing emergency triage.
              </div>
            </div>
          )}
        </div>

        {/* Role-Based Privileged Operational Information */}
        {item.accessTier === 'OPERATIONAL_FULL' && (
          <div
            style={{
              marginBottom: '1.25rem',
              padding: '0.9rem',
              background: 'rgba(244, 63, 94, 0.08)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.5rem',
              }}
            >
              <span className="micro-label" style={{ color: 'var(--crimson)' }}>
                OPERATIONAL RESPONDER INTELLIGENCE (PRIVILEGED)
              </span>
              <span className="badge badge-critical" style={{ fontSize: '0.65rem' }}>
                Full Clearance
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', fontSize: '0.8rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Caller / Reporter: </span>
                <strong style={{ color: '#ffffff' }}>{item.reporterName || 'Anonymous'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Direct Contact: </span>
                <strong style={{ color: 'var(--cyan)' }}>{item.contact || 'Radio / On-Site'}</strong>
              </div>
            </div>

            {item.spatialContext && (
              <div style={{ marginTop: '0.6rem', paddingTop: '0.6rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', fontSize: '0.78rem' }}>
                <div className="micro-label" style={{ marginBottom: '0.3rem', color: 'var(--text-secondary)' }}>
                  Nearest Resource Diagnostics
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', color: 'var(--text-muted)' }}>
                  {item.spatialContext.nearestShelter && (
                    <div>
                      Shelter: <strong style={{ color: '#ffffff' }}>{item.spatialContext.nearestShelter.name}</strong> ({item.spatialContext.nearestShelter.distanceKm} km, {item.spatialContext.nearestShelter.status})
                    </div>
                  )}
                  {item.spatialContext.nearestMedical && (
                    <div>
                      Medical: <strong style={{ color: '#ffffff' }}>{item.spatialContext.nearestMedical.name}</strong> ({item.spatialContext.nearestMedical.distanceKm} km)
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {item.accessTier === 'OPERATIONAL_VOLUNTEER' && (
          <div
            style={{
              marginBottom: '1.25rem',
              padding: '0.8rem',
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <div className="micro-label" style={{ color: 'var(--amber)', marginBottom: '0.3rem' }}>
              FIELD VOLUNTEER & RELIEF TIER
            </div>
            <div style={{ fontSize: '0.8rem', color: '#ffffff' }}>
              Contact: <code>{item.contact || 'Confidential'}</code> • Identity: {item.reporterName || 'Registered User'}
            </div>
          </div>
        )}

        {item.accessTier === 'PUBLIC_SAFETY' && (
          <div
            style={{
              marginBottom: '1.25rem',
              padding: '0.7rem 0.9rem',
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <Icon name="shield" size={16} color="var(--cyan)" />
            <span>Public Safety Advisory View: Private victim contacts withheld per privacy protocols.</span>
          </div>
        )}

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
          <button
            type="button"
            onClick={handleGlobeFocus}
            className="btn btn-secondary btn-sm"
            style={{ borderColor: 'var(--cyan)', color: 'var(--cyan)' }}
          >
            <Icon name="map-pin" size={14} color="var(--cyan)" />
            <span>View on 3D Globe</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="btn btn-primary btn-sm"
          >
            <span>Close Details</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CrisisIntelligenceModal;
