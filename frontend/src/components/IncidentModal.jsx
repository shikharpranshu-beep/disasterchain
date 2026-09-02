import React, { useState, useEffect } from 'react';
import { createIncident } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Icon from './Icons';

const IncidentModal = ({ isOpen, onClose, onIncidentSubmitted }) => {
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    title: '',
    type: 'Blocked emergency exit',
    description: '',
    severity: 'Medium',
    location: '',
    latitude: 28.6139,
    longitude: 77.2090,
    imageUrl: '',
    reporterName: user?.name || 'Anonymous Student',
  });

  const [loading, setLoading] = useState(false);
  const [detectingGps, setDetectingGps] = useState(false);
  const [gpsStatus, setGpsStatus] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [submittedIncident, setSubmittedIncident] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setFormData((prev) => ({
        ...prev,
        reporterName: user?.name || prev.reporterName || 'Anonymous Student',
      }));
      setErrorMessage('');
      setSubmittedIncident(null);
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleDetectLocation = () => {
    setDetectingGps(true);
    setGpsStatus('');

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = parseFloat(position.coords.latitude.toFixed(6));
          const lng = parseFloat(position.coords.longitude.toFixed(6));
          const locStr = `Lat: ${lat}, Long: ${lng} (GPS Auto-Detected)`;

          setFormData((prev) => ({
            ...prev,
            location: locStr,
            latitude: lat,
            longitude: lng,
          }));
          setDetectingGps(false);
          setGpsStatus('detected');
        },
        () => {
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

    if (!formData.title.trim()) return setErrorMessage('Please provide an incident headline.');
    if (!formData.description.trim() || formData.description.trim().length < 5) {
      return setErrorMessage('Please provide a detailed description (at least 5 characters).');
    }
    if (!formData.location.trim()) return setErrorMessage('Please specify the location or detect GPS.');

    setLoading(true);

    try {
      const payload = {
        title: formData.title.trim(),
        type: formData.type,
        description: formData.description.trim(),
        location: formData.location.trim(),
        latitude: Number(formData.latitude) || 28.6139,
        longitude: Number(formData.longitude) || 77.2090,
        severity: formData.severity,
        imageUrl: formData.imageUrl.trim(),
        reporterName: user?.name || formData.reporterName.trim() || 'Anonymous Student',
      };

      const res = await createIncident(payload);
      const newInc = res.data || res;
      setSubmittedIncident(newInc);

      if (onIncidentSubmitted) {
        onIncidentSubmitted(newInc);
      }
    } catch (err) {
      console.error('Error reporting hazard incident:', err);
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to submit incident report to server.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetAndClose = () => {
    setSubmittedIncident(null);
    setErrorMessage('');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleResetAndClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', padding: '1.75rem' }}>
        {submittedIncident ? (
          /* Incident Confirmation Screen */
          <div style={{ textAlign: 'center', padding: '0.75rem 0' }}>
            <div
              style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '2px solid #10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
                color: '#10b981',
              }}
            >
              <Icon name="check-circle" size={36} color="#10b981" />
            </div>

            <span className="badge badge-warning" style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem', fontFamily: 'var(--font-mono)', marginBottom: '0.5rem' }}>
              INCIDENT TICKET: {submittedIncident.incidentId || 'INC-LOGGED'}
            </span>

            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.35rem' }}>
              Hazard Incident Successfully Logged
            </h2>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1.25rem', lineHeight: 1.5 }}>
              Your report has been queued on the crisis response triage board. Safety responders and facility teams have been notified.
            </p>

            <div
              style={{
                background: 'rgba(11, 18, 34, 0.9)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1.15rem',
                textAlign: 'left',
                marginBottom: '1.25rem',
                fontSize: '0.86rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.55rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Headline:</span>
                <strong style={{ color: '#ffffff' }}>{submittedIncident.title}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Hazard Category:</span>
                <span style={{ color: '#818cf8', fontWeight: 700 }}>{submittedIncident.type}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Severity Level:</span>
                <span className={`badge badge-${submittedIncident.severity?.toLowerCase()}`}>{submittedIncident.severity}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Location:</span>
                <span style={{ color: 'var(--text-primary)' }}>{submittedIncident.location}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Initial Status:</span>
                <span className="badge badge-warning">{submittedIncident.status || 'Pending Review'}</span>
              </div>
            </div>

            <button onClick={handleResetAndClose} className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }}>
              Done & Return
            </button>
          </div>
        ) : (
          /* Form Screen */
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: 'rgba(245, 158, 11, 0.15)',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name="warning" size={22} color="#f59e0b" />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Report Campus Hazard / Incident</h2>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Notify safety dispatch teams and log hazard ticket</div>
                </div>
              </div>

              <button
                onClick={handleResetAndClose}
                className="btn btn-ghost"
                style={{ padding: '0.4rem', color: 'var(--text-muted)' }}
              >
                <Icon name="close" size={20} />
              </button>
            </div>

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
              <div className="form-group">
                <label className="form-label">Incident Headline *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Blocked fire exit behind Chemistry Lab Wing B"
                />
              </div>

              <div className="grid-cols-2">
                <div className="form-group">
                  <label className="form-label">Hazard Category *</label>
                  <select
                    className="form-select"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="Blocked emergency exit">Blocked Emergency Exit</option>
                    <option value="Fire hazard">Fire Hazard</option>
                    <option value="Flooding">Flooding / Water Inundation</option>
                    <option value="Damaged building">Structural Damage / Cracks</option>
                    <option value="Damaged electrical equipment">Damaged Electrical Wiring</option>
                    <option value="Fallen tree">Fallen Tree / Roadblock</option>
                    <option value="Unsafe construction area">Unsafe Construction Zone</option>
                    <option value="Earthquake Damage">Earthquake Damage</option>
                    <option value="Gas Leak">Gas Leak / Chemical Fumes</option>
                    <option value="Other">Other Hazard</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Severity Level *</label>
                  <select
                    className="form-select"
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                  >
                    <option value="Low">🟢 Low (Maintenance inspection)</option>
                    <option value="Medium">🟡 Medium (Potential hazard)</option>
                    <option value="High">🟠 High (Immediate danger)</option>
                    <option value="Critical">🔴 Critical (Life safety threat)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Detailed Description *</label>
                <textarea
                  required
                  rows={3}
                  className="form-textarea"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the hazard conditions, any danger to people nearby, and specifics..."
                />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label className="form-label" style={{ margin: 0 }}>Exact Location / Sector *</label>
                  <button
                    type="button"
                    onClick={handleDetectLocation}
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
                  placeholder="e.g. Science Block Wing B, 2nd Floor Emergency Stairwell"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Photo Evidence URL (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://example.com/hazard-photo.jpg"
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="button" onClick={handleResetAndClose} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 2 }}>
                  <Icon name="warning" size={17} />
                  <span>{loading ? 'Submitting Hazard Report...' : 'Submit Incident Report'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default IncidentModal;
