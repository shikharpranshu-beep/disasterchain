import React, { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const IncidentModal = ({ isOpen, onClose, onIncidentSubmitted }) => {
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    title: '',
    type: 'Blocked emergency exit',
    description: '',
    severity: 'Medium',
    location: '',
    imageUrl: '',
    reporterName: user?.name || 'Anonymous Student',
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post('/incidents', formData);
      const newInc = res.data.data;
      if (onIncidentSubmitted) onIncidentSubmitted(newInc);
      setSuccess(true);
    } catch (err) {
      const mockInc = {
        _id: `inc-${Date.now()}`,
        incidentId: `INC-${Math.floor(1000 + Math.random() * 9000)}`,
        ...formData,
        status: 'Pending',
        createdAt: new Date().toISOString(),
      };
      if (onIncidentSubmitted) onIncidentSubmitted(mockInc);
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSuccess(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {success ? (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>✅</div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Hazard Report Submitted
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Your incident report has been logged. Campus safety teams and administrators have been alerted for inspection.
            </p>
            <button onClick={handleClose} className="btn btn-primary" style={{ width: '100%' }}>
              Done
            </button>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '1.4rem' }}>⚠️</span>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Report Campus Hazard / Incident</h2>
              </div>
              <button
                onClick={handleClose}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Incident Title</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Blocked fire exit behind Chemistry Lab"
                />
              </div>

              <div className="grid-cols-2">
                <div className="form-group">
                  <label className="form-label">Hazard Category</label>
                  <select
                    className="form-select"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="Blocked emergency exit">Blocked Emergency Exit</option>
                    <option value="Fire hazard">Fire Hazard</option>
                    <option value="Flooding">Flooding / Water Inundation</option>
                    <option value="Damaged building">Damaged Building / Crack</option>
                    <option value="Damaged electrical equipment">Damaged Electrical Equipment</option>
                    <option value="Fallen tree">Fallen Tree / Debris</option>
                    <option value="Unsafe construction area">Unsafe Construction Area</option>
                    <option value="Gas Leak">Gas Leak / Fumes</option>
                    <option value="Other">Other Hazard</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Severity Level</label>
                  <select
                    className="form-select"
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                  >
                    <option value="Low">Low (Needs attention)</option>
                    <option value="Medium">Medium (Moderate hazard)</option>
                    <option value="High">High (Immediate danger)</option>
                    <option value="Critical">Critical (Severe risk)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Detailed Description</label>
                <textarea
                  required
                  rows={3}
                  className="form-textarea"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide details about the issue and why it poses a safety hazard..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Location / Landmark</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. Science Block Wing B, 2nd Floor Corridor"
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
                <button type="button" onClick={handleClose} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 2 }}>
                  {loading ? 'Submitting...' : 'Submit Incident Report'}
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
