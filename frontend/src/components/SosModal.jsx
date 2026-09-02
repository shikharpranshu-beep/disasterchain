import React, { useState, useEffect } from 'react';
import { createSosRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Icon from './Icons';

const SosModal = ({ isOpen, onClose, onSosSubmitted }) => {
  const { user } = useAuth();

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

  const [loading, setLoading] = useState(false);
  const [detectingGps, setDetectingGps] = useState(false);
  const [gpsStatus, setGpsStatus] = useState(''); // 'detected' | 'denied' | 'error' | ''
  const [errorMessage, setErrorMessage] = useState('');
  const [submittedSos, setSubmittedSos] = useState(null);

  // Auto-fill user name and contact when user logs in or modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || user?.name || '',
        contact: prev.contact || (user?.email ? '+91 98765 00000' : ''),
      }));
      setErrorMessage('');
      setSubmittedSos(null);

      // Auto-detect GPS location if location field is blank
      if (!formData.location && 'geolocation' in navigator) {
        handleDetectLocation(true);
      }
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleDetectLocation = (isAuto = false) => {
    setDetectingGps(true);
    setGpsStatus('');

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = parseFloat(position.coords.latitude.toFixed(6));
          const lng = parseFloat(position.coords.longitude.toFixed(6));
          const coordsStr = `Lat: ${lat}, Long: ${lng} (GPS Verified \u00B1${Math.round(position.coords.accuracy || 10)}m)`;

          setFormData((prev) => ({
            ...prev,
            location: coordsStr,
            latitude: lat,
            longitude: lng,
          }));
          setDetectingGps(false);
          setGpsStatus('detected');
        },
        (error) => {
          setDetectingGps(false);
          setGpsStatus('denied');
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
      );
    } else {
      setDetectingGps(false);
      setGpsStatus('error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    // Field validation
    if (!formData.name.trim()) {
      return setErrorMessage('Please provide your name or identifier.');
    }
    if (!formData.description.trim() || formData.description.trim().length < 5) {
      return setErrorMessage('Please provide a descriptive explanation of the distress situation (at least 5 characters).');
    }
    if (!formData.location.trim()) {
      return setErrorMessage('Please provide the location or click Auto-Detect GPS.');
    }
    if (!formData.contact.trim()) {
      return setErrorMessage('Please provide a contact phone number or radio channel.');
    }

    setLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        emergencyType: formData.emergencyType,
        description: formData.description.trim(),
        location: formData.location.trim(),
        latitude: Number(formData.latitude) || 28.6139,
        longitude: Number(formData.longitude) || 77.2090,
        peopleAffected: Math.max(1, parseInt(formData.peopleAffected) || 1),
        severity: formData.severity,
        contact: formData.contact.trim(),
      };

      const res = await createSosRequest(payload);
      const newSos = res.data || res;
      setSubmittedSos(newSos);

      if (onSosSubmitted) {
        onSosSubmitted(newSos);
      }
    } catch (err) {
      console.error('Error submitting SOS request:', err);
      const serverMsg = err.response?.data?.message || err.message || 'Failed to dispatch SOS signal to server.';
      setErrorMessage(serverMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetAndClose = () => {
    setSubmittedSos(null);
    setErrorMessage('');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        {submittedSos ? (
          /* Professional Emergency Confirmation Receipt */
          <div style={{ textAlign: 'center', padding: '0.75rem 0' }}>
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'rgba(255, 51, 75, 0.15)',
                border: '2px solid #ff334b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
                boxShadow: '0 0 30px rgba(255, 51, 75, 0.45)',
                animation: 'pulse-sos 2s infinite',
              }}
            >
              <Icon name="sos" size={38} color="#ff334b" />
            </div>

            <span className="badge badge-critical" style={{ fontSize: '0.82rem', padding: '0.35rem 1rem', marginBottom: '0.75rem', fontFamily: 'var(--font-mono)' }}>
              DISTRESS TRACKING ID: {submittedSos.requestId || 'SOS-PENDING'}
            </span>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ff4d63', marginBottom: '0.35rem' }}>
              EMERGENCY SOS BROADCASTED
            </h2>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1.25rem', lineHeight: 1.5 }}>
              Your distress signal has been logged to the central emergency registry and dispatched to active rescue coordinators.
            </p>

            {/* Structured Receipt Box */}
            <div
              style={{
                background: 'rgba(11, 18, 34, 0.95)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
                textAlign: 'left',
                marginBottom: '1.25rem',
                fontSize: '0.86rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.65rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Emergency Category:</span>
                <strong style={{ color: '#ffffff' }}>{submittedSos.emergencyType}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Severity Priority:</span>
                <span className={`badge badge-${submittedSos.severity?.toLowerCase()}`}>{submittedSos.severity}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--text-muted)' }}>Location / Coordinates:</span>
                <span style={{ color: '#38bdf8', textAlign: 'right', maxWidth: '300px', fontWeight: 600 }}>
                  {submittedSos.location}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>People in Distress:</span>
                <strong style={{ color: '#ffffff' }}>{submittedSos.peopleAffected || 1} Person(s)</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Registered Contact:</span>
                <strong style={{ color: '#ffffff' }}>{submittedSos.contact}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.65rem', marginTop: '0.2rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Current Triage Status:</span>
                <span className="badge badge-warning" style={{ fontSize: '0.74rem' }}>
                  {submittedSos.status || 'Pending Dispatch'}
                </span>
              </div>
            </div>

            <div
              style={{
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem 1rem',
                fontSize: '0.8rem',
                color: '#fef08a',
                marginBottom: '1.25rem',
                lineHeight: 1.5,
                textAlign: 'left',
              }}
            >
              ⚠️ <strong>Life-Safety Notice:</strong> If immediate physical danger or severe bleeding occurs, dial National Emergency <strong>112</strong> or Fire <strong>101</strong> on your cellular line immediately.
            </div>

            <button onClick={handleResetAndClose} className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }}>
              Return to Command Center
            </button>
          </div>
        ) : (
          /* SOS Submission Form Screen */
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: 'rgba(255, 51, 75, 0.15)',
                    border: '1px solid rgba(255, 51, 75, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name="sos" size={22} color="#ff334b" />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Broadcast Emergency SOS</h2>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Instant dispatch to response coordinators & triage teams</div>
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

            {/* Error Message */}
            {errorMessage && (
              <div
                style={{
                  background: 'rgba(255, 51, 75, 0.15)',
                  border: '1px solid rgba(255, 51, 75, 0.4)',
                  color: '#ff6b7e',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.85rem',
                  marginBottom: '1.25rem',
                }}
              >
                ⚠️ {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="grid-cols-2">
                <div className="form-group">
                  <label className="form-label">Full Name / Identifier *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter your name"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Emergency Category *</label>
                  <select
                    className="form-select"
                    value={formData.emergencyType}
                    onChange={(e) => setFormData({ ...formData, emergencyType: e.target.value })}
                  >
                    <option value="Medical Emergency">🚑 Medical Emergency / Trauma</option>
                    <option value="Fire">🔥 Fire / Heavy Smoke</option>
                    <option value="Flood">🌊 Flood / Water Inundation</option>
                    <option value="Building Damage">🏚️ Structural Building Damage</option>
                    <option value="Trapped Person">🆘 Trapped Individual(s)</option>
                    <option value="Missing Person">👤 Missing Person</option>
                    <option value="Accident">💥 Accident / Collision</option>
                    <option value="Other">⚠️ Other Emergency</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description of Distress *</label>
                <textarea
                  required
                  rows={3}
                  className="form-textarea"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what happened, any injuries, trapped people, urgent supplies needed, or hazard conditions..."
                />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label className="form-label" style={{ margin: 0 }}>Location / Landmark *</label>
                  <button
                    type="button"
                    onClick={() => handleDetectLocation(false)}
                    disabled={detectingGps}
                    className="btn btn-secondary btn-sm"
                    style={{
                      fontSize: '0.74rem',
                      padding: '0.25rem 0.65rem',
                      borderColor: gpsStatus === 'detected' ? '#10b981' : 'rgba(99, 102, 241, 0.4)',
                      color: gpsStatus === 'detected' ? '#34d399' : '#a5b4fc',
                    }}
                  >
                    <Icon name="map-pin" size={13} color={gpsStatus === 'detected' ? '#10b981' : '#818cf8'} />
                    <span>{detectingGps ? 'Detecting GPS...' : gpsStatus === 'detected' ? 'GPS Locked \u2713' : 'Auto-Detect GPS'}</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. North Campus, Block C Floor 2 or GPS coordinates"
                />
              </div>

              <div className="grid-cols-3">
                <div className="form-group">
                  <label className="form-label">Severity Level *</label>
                  <select
                    className="form-select"
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                  >
                    <option value="Critical">🔴 Critical (Life-Threatening)</option>
                    <option value="High">🟠 High (Urgent Response)</option>
                    <option value="Medium">🟡 Medium (Assistance Needed)</option>
                    <option value="Low">🟢 Low (Non-Immediate)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">People Affected *</label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    required
                    className="form-input"
                    value={formData.peopleAffected}
                    onChange={(e) => setFormData({ ...formData, peopleAffected: parseInt(e.target.value) || 1 })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Contact Phone / Channel *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    placeholder="Phone number"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-sos"
                  style={{ flex: 2 }}
                >
                  <Icon name="sos" size={18} color="#ffffff" />
                  <span>{loading ? 'Transmitting Distress Signal...' : 'TRANSMIT EMERGENCY SOS'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default SosModal;
