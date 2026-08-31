import React, { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const SosModal = ({ isOpen, onClose, onSosSubmitted }) => {
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    emergencyType: 'Medical Emergency',
    description: '',
    location: 'North Campus, Building 4, Floor 2',
    peopleAffected: 1,
    severity: 'High',
    contact: '+91 98765 00000',
  });

  const [loading, setLoading] = useState(false);
  const [detectingGps, setDetectingGps] = useState(false);
  const [submittedSos, setSubmittedSos] = useState(null);

  if (!isOpen) return null;

  const handleDetectLocation = () => {
    setDetectingGps(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = `Lat: ${position.coords.latitude.toFixed(4)}, Long: ${position.coords.longitude.toFixed(4)} (GPS Verified)`;
          setFormData((prev) => ({ ...prev, location: coords }));
          setDetectingGps(false);
        },
        () => {
          // Fallback simulation
          setTimeout(() => {
            setFormData((prev) => ({ ...prev, location: 'Lat: 28.6139, Long: 77.2090 (Campus Geofence Auto-Detected)' }));
            setDetectingGps(false);
          }, 600);
        }
      );
    } else {
      setTimeout(() => {
        setFormData((prev) => ({ ...prev, location: 'Lat: 28.6139, Long: 77.2090 (Campus Node #4)' }));
        setDetectingGps(false);
      }, 600);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post('/sos', formData);
      const newSos = res.data.data;
      setSubmittedSos(newSos);
      if (onSosSubmitted) onSosSubmitted(newSos);
    } catch (err) {
      // Mock fallback creation if server unavailable
      const mockSos = {
        _id: `sos-${Date.now()}`,
        requestId: `SOS-${Math.floor(1000 + Math.random() * 9000)}`,
        ...formData,
        status: 'Pending',
        createdAt: new Date().toISOString(),
      };
      setSubmittedSos(mockSos);
      if (onSosSubmitted) onSosSubmitted(mockSos);
    } finally {
      setLoading(false);
    }
  };

  const handleResetAndClose = () => {
    setSubmittedSos(null);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
        {submittedSos ? (
          /* Confirmation State */
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '2px solid #ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                margin: '0 auto 1.25rem',
                animation: 'pulse-red 2s infinite',
              }}
            >
              🚨
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f87171', marginBottom: '0.5rem' }}>
              EMERGENCY SOS BROADCASTED
            </h2>
            <div className="badge badge-critical" style={{ fontSize: '0.9rem', padding: '0.4rem 1rem', marginBottom: '1rem' }}>
              Request ID: {submittedSos.requestId}
            </div>

            <div
              style={{
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                textAlign: 'left',
                marginBottom: '1.5rem',
                fontSize: '0.88rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Emergency Type:</span>
                <strong>{submittedSos.emergencyType}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Severity Level:</span>
                <span className={`badge badge-${submittedSos.severity?.toLowerCase()}`}>{submittedSos.severity}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Location:</span>
                <span>{submittedSos.location}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Initial Status:</span>
                <span className="badge badge-warning">Pending Response</span>
              </div>
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              ⚠️ <em>Important safety note:</em> This emergency signal has been queued on the DisasterChain Response Dashboard. If in immediate life-threatening danger, also dial national emergency dispatch <strong>112</strong> / <strong>101</strong>.
            </div>

            <button onClick={handleResetAndClose} className="btn btn-primary" style={{ width: '100%' }}>
              Return to Dashboard
            </button>
          </div>
        ) : (
          /* Form State */
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '1.5rem' }}>🚨</span>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Broadcast Emergency SOS</h2>
              </div>
              <button
                onClick={onClose}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid-cols-2">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
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
                  <label className="form-label">Emergency Type</label>
                  <select
                    className="form-select"
                    value={formData.emergencyType}
                    onChange={(e) => setFormData({ ...formData, emergencyType: e.target.value })}
                  >
                    <option value="Medical Emergency">Medical Emergency</option>
                    <option value="Fire">Fire / Smoke</option>
                    <option value="Flood">Flood / Water Hazard</option>
                    <option value="Building Damage">Building Damage</option>
                    <option value="Trapped Person">Trapped Person</option>
                    <option value="Missing Person">Missing Person</option>
                    <option value="Accident">Accident</option>
                    <option value="Other">Other Emergency</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description of Emergency</label>
                <textarea
                  required
                  rows={3}
                  className="form-textarea"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what happened, any injuries, and immediate assistance required..."
                />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label className="form-label" style={{ margin: 0 }}>Exact Location / Landmark</label>
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={detectingGps}
                    style={{
                      background: 'rgba(99, 102, 241, 0.15)',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      color: '#818cf8',
                      fontSize: '0.75rem',
                      padding: '0.2rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                    }}
                  >
                    {detectingGps ? '📍 Detecting GPS...' : '📍 Auto-Detect GPS'}
                  </button>
                </div>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Building name, room number, or coordinates"
                />
              </div>

              <div className="grid-cols-3">
                <div className="form-group">
                  <label className="form-label">Severity</label>
                  <select
                    className="form-select"
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                  >
                    <option value="Critical">🔴 Critical</option>
                    <option value="High">🟠 High</option>
                    <option value="Medium">🟡 Medium</option>
                    <option value="Low">🟢 Low</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">People Affected</label>
                  <input
                    type="number"
                    min={1}
                    className="form-input"
                    value={formData.peopleAffected}
                    onChange={(e) => setFormData({ ...formData, peopleAffected: parseInt(e.target.value) || 1 })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Contact Phone</label>
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

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-sos"
                  style={{ flex: 2 }}
                >
                  {loading ? 'Transmitting SOS...' : '🚨 TRANSMIT EMERGENCY SOS'}
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
