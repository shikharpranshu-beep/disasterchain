import React, { useState, useEffect } from 'react';
import { fetchSosRequests } from '../services/api';

const SosPage = ({ onOpenSos, refreshKey }) => {
  const [sosList, setSosList] = useState([]);
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const loadSos = async () => {
    setLoading(true);
    const data = await fetchSosRequests();
    setSosList(data);
    setLoading(false);
  };

  useEffect(() => {
    loadSos();
  }, [refreshKey]);

  const filteredList = sosList.filter((item) => {
    const matchesSeverity = filterSeverity === 'ALL' || item.severity === filterSeverity;
    const matchesStatus = filterStatus === 'ALL' || item.status === filterStatus;
    return matchesSeverity && matchesStatus;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>🚨 Emergency SOS Requests</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Live distress signals, medical emergencies & rescue dispatch queue
          </p>
        </div>

        <button onClick={onOpenSos} className="btn btn-sos">
          🚨 Broadcast Emergency SOS
        </button>
      </div>

      {/* Filter Bar */}
      <div
        className="glass-card"
        style={{
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          gap: '1.5rem',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Severity:</span>
          <select
            className="form-select"
            style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
          >
            <option value="ALL">All Severities</option>
            <option value="Critical">🔴 Critical</option>
            <option value="High">🟠 High</option>
            <option value="Medium">🟡 Medium</option>
            <option value="Low">🟢 Low</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Status:</span>
          <select
            className="form-select"
            style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>

        <div style={{ marginLeft: 'auto', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Showing <strong>{filteredList.length}</strong> active emergency requests
        </div>
      </div>

      {/* SOS List Grid */}
      <div className="grid-cols-2">
        {filteredList.map((sos) => {
          const isCritical = sos.severity === 'Critical';

          return (
            <div
              key={sos._id}
              className="glass-card"
              style={{
                borderColor: isCritical ? 'rgba(239, 68, 68, 0.4)' : 'var(--border-subtle)',
                background: isCritical ? 'rgba(30, 20, 30, 0.75)' : 'var(--bg-card)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '1.05rem' }}>{sos.requestId}</span>
                    <span className={`badge badge-${sos.severity?.toLowerCase()}`}>{sos.severity}</span>
                  </div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#f87171' }}>
                    {sos.emergencyType}
                  </div>
                </div>

                <span
                  className="badge"
                  style={{
                    background: sos.status === 'Resolved' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                    color: sos.status === 'Resolved' ? '#34d399' : '#fbbf24',
                    border: '1px solid currentColor',
                  }}
                >
                  {sos.status}
                </span>
              </div>

              <p style={{ color: 'var(--text-primary)', fontSize: '0.88rem', marginBottom: '0.85rem', lineHeight: 1.5 }}>
                {sos.description}
              </p>

              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.8)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem',
                  fontSize: '0.8rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem',
                  color: 'var(--text-secondary)',
                }}
              >
                <div>📍 <strong>Location:</strong> {sos.location}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>👥 <strong>People affected:</strong> {sos.peopleAffected}</span>
                  <span>📞 <strong>Contact:</strong> {sos.contact}</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.85rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span>Reported by: {sos.name}</span>
                <span>{new Date(sos.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SosPage;
