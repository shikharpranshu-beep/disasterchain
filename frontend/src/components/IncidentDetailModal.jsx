import React, { useState } from 'react';
import { updateIncidentStatus } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Icon from './Icons';

const IncidentDetailModal = ({ isOpen = true, onClose, incident, item, onStatusUpdated }) => {
  const targetIncident = incident || item;
  const { user } = useAuth();
  const isAdminOrResponder = user?.role === 'admin' || user?.role === 'responder';

  const [updating, setUpdating] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(targetIncident?.status || 'Pending');
  const [updateMsg, setUpdateMsg] = useState('');

  if ((isOpen !== undefined && !isOpen) || !targetIncident) return null;

  const lat = Number(targetIncident.latitude ?? targetIncident.coordinates?.latitude) || 28.6139;
  const lng = Number(targetIncident.longitude ?? targetIncident.coordinates?.longitude) || 77.2090;
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    setUpdateMsg('');
    try {
      await updateIncidentStatus(targetIncident._id, newStatus);
      setCurrentStatus(newStatus);
      setUpdateMsg(`Status successfully updated to ${newStatus}`);
      if (onStatusUpdated) {
        onStatusUpdated(targetIncident._id, newStatus);
      }
    } catch (err) {
      console.error('Error updating incident status:', err);
      setUpdateMsg('Failed to update status on server.');
    } finally {
      setUpdating(false);
    }
  };

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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.35rem' }}>
              <span className="badge badge-warning" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem' }}>
                {targetIncident.incidentId || 'INC-LOGGED'}
              </span>
              <span className={`badge badge-${targetIncident.severity?.toLowerCase()}`}>
                {targetIncident.severity} SEVERITY
              </span>
              <span className="badge badge-neutral">
                STATUS: {currentStatus}
              </span>
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.3 }}>
              {targetIncident.title}
            </h2>
          </div>

          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '0.4rem', color: 'var(--text-muted)' }}>
            <Icon name="close" size={20} />
          </button>
        </div>

        {/* Category & Description */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.84rem', color: '#818cf8', fontWeight: 700, marginBottom: '0.4rem' }}>
            Category: {targetIncident.type}
          </div>
          <div
            style={{
              background: 'rgba(11, 18, 34, 0.9)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '1.15rem',
              lineHeight: 1.6,
              fontSize: '0.9rem',
              color: 'var(--text-primary)',
            }}
          >
            {targetIncident.description}
          </div>
        </div>

        {/* Location & Navigation */}
        <div
          style={{
            background: 'rgba(15, 24, 44, 0.85)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem 1.15rem',
            marginBottom: '1.25rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Icon name="map-pin" size={16} color="#818cf8" />
            <span style={{ fontSize: '0.86rem', color: '#ffffff' }}>
              <strong>Location: </strong> {targetIncident.location}
            </span>
          </div>

          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.78rem' }}
          >
            <Icon name="compass" size={13} color="#38bdf8" />
            <span>Maps View</span>
          </a>
        </div>

        {/* Reporter Metadata */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '0.75rem',
            marginBottom: '1.25rem',
            fontSize: '0.8rem',
          }}
        >
          <div style={{ background: 'rgba(15, 24, 44, 0.7)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <span style={{ color: 'var(--text-muted)' }}>Reported By: </span>
            <strong style={{ color: '#ffffff' }}>{targetIncident.reporterName || 'Anonymous Student'}</strong>
          </div>
          <div style={{ background: 'rgba(15, 24, 44, 0.7)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <span style={{ color: 'var(--text-muted)' }}>Submitted: </span>
            <strong style={{ color: '#ffffff' }}>
              {new Date(targetIncident.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
            </strong>
          </div>
        </div>

        {/* Responder / Admin Status Management */}
        {isAdminOrResponder && (
          <div
            style={{
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              marginBottom: '1.25rem',
            }}
          >
            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#a5b4fc', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
              🛡️ Responder / Admin Status Management
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {['Pending', 'Under Review', 'Resolved', 'Rejected'].map((statusOption) => (
                <button
                  key={statusOption}
                  disabled={updating || currentStatus === statusOption}
                  onClick={() => handleStatusChange(statusOption)}
                  className={`btn ${currentStatus === statusOption ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                  style={{ fontSize: '0.76rem' }}
                >
                  {statusOption}
                </button>
              ))}
            </div>

            {updateMsg && (
              <div style={{ fontSize: '0.78rem', color: '#34d399', marginTop: '0.5rem' }}>
                ✓ {updateMsg}
              </div>
            )}
          </div>
        )}

        <button onClick={onClose} className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }}>
          Close Ticket
        </button>
      </div>
    </div>
  );
};

export default IncidentDetailModal;
