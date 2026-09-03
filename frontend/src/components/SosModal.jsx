import React, { useState, useEffect } from 'react';
import { createSosRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Icon from './Icons';
import offlineSyncService from '../services/offlineSyncService';

/**
 * SOS Operational Lifecycle States:
 * IDLE -> READY -> LOCATING -> CONFIRMATION -> DISPATCHED -> RESOLVED
 */
const SosModal = ({ isOpen, onClose, onSosSubmitted }) => {
  const { user } = useAuth();

  const [sosState, setSosState] = useState('READY'); // 'IDLE' | 'READY' | 'LOCATING' | 'CONFIRMATION' | 'DISPATCHED' | 'RESOLVED'
  const [formData, setFormData] = useState({
    name: user?.name || '',
    emergencyType: 'Medical Emergency',
    description: '',
    location: '',
    latitude: 28.6139,
    longitude: 77.2090,
    peopleAffected: 1,
    severity: 'High',
    contact: '',
  });

  const [errorMessage, setErrorMessage] = useState('');
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [submittedRecord, setSubmittedRecord] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setSosState('READY');
      setFormData((prev) => ({
        ...prev,
        name: prev.name || user?.name || '',
        contact: prev.contact || '',
      }));
      setErrorMessage('');
      setSubmittedRecord(null);

      // Trigger automatic GPS location acquisition
      triggerGpsAcquisition();
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const triggerGpsAcquisition = () => {
    setSosState('LOCATING');
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = parseFloat(pos.coords.latitude.toFixed(6));
          const lng = parseFloat(pos.coords.longitude.toFixed(6));
          const acc = Math.round(pos.coords.accuracy || 15);
          setGpsAccuracy(acc);
          setFormData((prev) => ({
            ...prev,
            latitude: lat,
            longitude: lng,
            location: `GPS Lat: ${lat}, Long: ${lng} (±${acc}m accuracy)`,
          }));
          setSosState('READY');
        },
        () => {
          setSosState('READY');
        },
        { enableHighAccuracy: true, timeout: 7000 }
      );
    } else {
      setSosState('READY');
    }
  };

  const proceedToConfirmation = (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!formData.name.trim()) return setErrorMessage('Please provide your name or caller identifier.');
    if (!formData.description.trim() || formData.description.trim().length < 5) {
      return setErrorMessage('Please provide specific details of distress (min 5 characters).');
    }
    if (!formData.location.trim()) return setErrorMessage('Please verify your GPS coordinates or enter a location.');
    if (!formData.contact.trim()) return setErrorMessage('Please provide a telephone or radio contact number.');

    setSosState('CONFIRMATION');
  };

  const dispatchSosSignal = async () => {
    setSosState('LOCATING');
    setErrorMessage('');

    const payload = {
      name: formData.name.trim(),
      emergencyType: formData.emergencyType,
      description: formData.description.trim(),
      location: formData.location.trim(),
      latitude: Number(formData.latitude) || 28.6139,
      longitude: Number(formData.longitude) || 77.2090,
      peopleAffected: Number(formData.peopleAffected) || 1,
      severity: formData.severity,
      contact: formData.contact.trim(),
    };

    // 1. Offline Mode Check
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      const queued = offlineSyncService.enqueueEmergency('sos', payload);
      setSubmittedRecord({
        ...payload,
        requestId: queued.queueId,
        isOfflineQueued: true,
      });
      setSosState('DISPATCHED');
      if (onSosSubmitted) onSosSubmitted(queued);
      return;
    }

    // 2. Online Mode Dispatch
    try {
      const result = await createSosRequest(payload);
      if (result) {
        setSubmittedRecord({
          ...result,
          isOfflineQueued: false,
        });
        setSosState('DISPATCHED');
        if (onSosSubmitted) onSosSubmitted(result);
      } else {
        throw new Error('Server returned empty response for SOS dispatch.');
      }
    } catch (err) {
      // Network failure during transmission -> save to offline queue safely
      const queued = offlineSyncService.enqueueEmergency('sos', payload);
      setSubmittedRecord({
        ...payload,
        requestId: queued.queueId,
        isOfflineQueued: true,
      });
      setSosState('DISPATCHED');
      if (onSosSubmitted) onSosSubmitted(queued);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
        background: 'rgba(5, 8, 14, 0.88)',
        backdropFilter: 'blur(16px)',
      }}
    >
      <div
        className="spatial-panel spatial-panel-critical"
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: 'var(--glow-crimson)',
          border: '1px solid var(--border-red)',
          position: 'relative',
        }}
      >
        {/* Beacon Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: 'var(--crimson)',
                boxShadow: 'var(--glow-crimson)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'pulse-ring 2s infinite',
              }}
            >
              <Icon name="alert-circle" size={20} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.15rem', color: '#ffffff' }}>
                EMERGENCY SOS BEACON
              </div>
              <div className="micro-label" style={{ color: '#ff6b81' }}>
                STATE: {sosState}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm"
            style={{ color: 'var(--text-muted)', fontSize: '1.2rem', padding: '4px 8px' }}
          >
            ✕
          </button>
        </div>

        {errorMessage && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 46, 77, 0.15)',
              border: '1px solid var(--border-red)',
              color: '#ff8597',
              fontSize: '0.82rem',
              marginBottom: '1rem',
            }}
          >
            ⚠️ {errorMessage}
          </div>
        )}

        {/* STATE: DISPATCHED */}
        {sosState === 'DISPATCHED' && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            {submittedRecord?.isOfflineQueued ? (
              <>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    margin: '0 auto 1.25rem',
                    borderRadius: '50%',
                    background: 'rgba(245, 158, 11, 0.15)',
                    border: '2px solid #f59e0b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#f59e0b',
                    boxShadow: '0 0 24px rgba(245, 158, 11, 0.3)',
                  }}
                >
                  <Icon name="clock" size={34} />
                </div>

                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f59e0b', marginBottom: '0.4rem' }}>
                  EMERGENCY REQUEST SAVED LOCALLY
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                  Emergency request saved locally. It will be transmitted automatically when connectivity returns.
                </p>

                <div
                  style={{
                    background: 'rgba(7, 11, 19, 0.85)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '1rem',
                    textAlign: 'left',
                    marginBottom: '1.5rem',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.78rem',
                  }}
                >
                  <div style={{ color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                    LOCAL QUEUE ID: <span style={{ color: '#f59e0b' }}>{submittedRecord?.requestId}</span>
                  </div>
                  <div style={{ color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                    STATUS: <span style={{ color: '#f59e0b', fontWeight: 700 }}>QUEUED LOCALLY (PENDING SYNC)</span>
                  </div>
                  <div style={{ color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                    SEVERITY: <span style={{ color: 'var(--crimson)' }}>{formData.severity}</span>
                  </div>
                  <div style={{ color: 'var(--text-muted)' }}>
                    COORDINATES: <span style={{ color: '#ffffff' }}>{formData.latitude}, {formData.longitude}</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    margin: '0 auto 1.25rem',
                    borderRadius: '50%',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '2px solid var(--mint)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--mint)',
                    boxShadow: '0 0 24px rgba(16, 185, 129, 0.3)',
                  }}
                >
                  <Icon name="shield-check" size={34} />
                </div>

                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.4rem' }}>
                  DISTRESS BEACON BROADCASTED
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', marginBottom: '1.25rem' }}>
                  Emergency request transmitted successfully. Responders and nearest relief shelters have received your distress telemetry.
                </p>

                <div
                  style={{
                    background: 'rgba(7, 11, 19, 0.85)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '1rem',
                    textAlign: 'left',
                    marginBottom: '1.5rem',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.78rem',
                  }}
                >
                  <div style={{ color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                    SIGNAL ID: <span style={{ color: 'var(--cyan)' }}>{submittedRecord?.requestId || submittedRecord?._id}</span>
                  </div>
                  <div style={{ color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                    STATUS: <span style={{ color: 'var(--mint)', fontWeight: 700 }}>TRANSMITTED TO LIVE DATABASE</span>
                  </div>
                  <div style={{ color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                    SEVERITY: <span style={{ color: 'var(--crimson)' }}>{formData.severity}</span>
                  </div>
                  <div style={{ color: 'var(--text-muted)' }}>
                    COORDINATES: <span style={{ color: '#ffffff' }}>{formData.latitude}, {formData.longitude}</span>
                  </div>
                </div>
              </>
            )}

            <button onClick={onClose} className="btn btn-primary" style={{ width: '100%' }}>
              ACKNOWLEDGE & RETURN TO COMMAND
            </button>
          </div>
        )}

        {/* STATE: LOCATING */}
        {sosState === 'LOCATING' && (
          <div style={{ textAlign: 'center', padding: '2.5rem 0' }}>
            <div className="live-beacon-pulse critical" style={{ width: 32, height: 32, margin: '0 auto 1.5rem' }} />
            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#ffffff', marginBottom: '0.5rem' }}>
              ACQUIRING HIGH-ACCURACY GPS TELEMETRY...
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Contacting browser geolocation sensors and satellite triangulation.
            </div>
          </div>
        )}

        {/* STATE: CONFIRMATION */}
        {sosState === 'CONFIRMATION' && (
          <div>
            <div className="micro-label" style={{ color: 'var(--amber)', marginBottom: '0.5rem' }}>
              STEP 2 OF 2: CONFIRM BROADCAST TELEMETRY
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Review the emergency parameters below. Once confirmed, this signal is immediately routed to active rescue responders.
            </p>

            <div
              style={{
                background: 'rgba(7, 11, 19, 0.9)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                marginBottom: '1.5rem',
                fontSize: '0.85rem',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div>
                  <div className="micro-label">Caller Name</div>
                  <div style={{ fontWeight: 600, color: '#ffffff' }}>{formData.name}</div>
                </div>
                <div>
                  <div className="micro-label">Emergency Category</div>
                  <div style={{ fontWeight: 600, color: '#ffffff' }}>{formData.emergencyType}</div>
                </div>
                <div>
                  <div className="micro-label">Severity</div>
                  <span className="badge badge-critical">{formData.severity}</span>
                </div>
                <div>
                  <div className="micro-label">People Affected</div>
                  <div style={{ fontWeight: 600, color: '#ffffff' }}>{formData.peopleAffected} Person(s)</div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.65rem' }}>
                <div className="micro-label">Coordinates / Location</div>
                <div style={{ color: 'var(--cyan)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                  {formData.location}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setSosState('READY')}
                className="btn btn-secondary"
              >
                ← Back to Edit
              </button>
              <button
                type="button"
                onClick={dispatchSosSignal}
                className="btn btn-emergency"
              >
                🚨 TRANSMIT NOW
              </button>
            </div>
          </div>
        )}

        {/* STATE: READY (Default Form) */}
        {sosState === 'READY' && (
          <form onSubmit={proceedToConfirmation}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <div className="form-group">
                <label className="form-label">Full Name / Caller</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Shikhar Sharma"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Emergency Category</label>
                <select
                  className="form-select"
                  value={formData.emergencyType}
                  onChange={(e) => setFormData({ ...formData, emergencyType: e.target.value })}
                >
                  <option value="Medical Emergency">Medical Emergency</option>
                  <option value="Severe Trauma / Bleeding">Severe Trauma / Bleeding</option>
                  <option value="Fire Hazard / Trapped">Fire Hazard / Trapped</option>
                  <option value="Structural Collapse">Structural Collapse</option>
                  <option value="Water Inundation / Flood">Water Inundation / Flood</option>
                  <option value="Hazardous Gas / Chemical">Hazardous Gas / Chemical</option>
                  <option value="Other Crisis">Other Crisis</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <div className="form-group">
                <label className="form-label">Severity Level</label>
                <select
                  className="form-select"
                  value={formData.severity}
                  onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                >
                  <option value="Critical">🔴 Critical (Life Threat)</option>
                  <option value="High">🟠 High (Urgent Response)</option>
                  <option value="Medium">🟡 Medium (Moderate Hazard)</option>
                  <option value="Low">🟢 Low (Advisory)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">People at Risk</label>
                <input
                  type="number"
                  min="1"
                  max="999"
                  className="form-input"
                  value={formData.peopleAffected}
                  onChange={(e) => setFormData({ ...formData, peopleAffected: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                <label className="form-label" style={{ margin: 0 }}>Verified Location / Coordinates</label>
                <button
                  type="button"
                  onClick={triggerGpsAcquisition}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--cyan)',
                    fontSize: '0.72rem',
                    fontFamily: 'var(--font-mono)',
                    cursor: 'pointer',
                  }}
                >
                  🛰️ Re-acquire GPS
                </button>
              </div>
              <input
                type="text"
                required
                className="form-input"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Coordinates or Building / Room Number"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description of Distress</label>
              <textarea
                required
                rows={3}
                className="form-textarea"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe injuries, trapped individuals, fire conditions, or exact requirements..."
              />
            </div>

            <div className="form-group">
              <label className="form-label">Contact Telephone / Radio</label>
              <input
                type="text"
                required
                className="form-input"
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                placeholder="e.g. +91 98765 43210 or VHF Channel 14"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button type="button" onClick={onClose} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn btn-emergency">
                Review & Broadcast Beacon →
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default SosModal;
