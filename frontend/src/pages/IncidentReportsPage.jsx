import React, { useState, useEffect } from 'react';
import { fetchIncidents } from '../services/api';

const IncidentReportsPage = ({ onOpenIncident }) => {
  const [incidents, setIncidents] = useState([]);
  const [filterType, setFilterType] = useState('ALL');

  useEffect(() => {
    const loadIncidents = async () => {
      const data = await fetchIncidents();
      setIncidents(data);
    };
    loadIncidents();
  }, []);

  const filteredIncidents = incidents.filter(
    (inc) => filterType === 'ALL' || inc.type === filterType
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>⚠️ Campus Hazard & Incident Reports</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Crowdsourced community hazard reporting, blocked exit pins & structural damage reports
          </p>
        </div>

        <button onClick={onOpenIncident} className="btn btn-primary">
          ➕ Report New Hazard
        </button>
      </div>

      {/* Filter Bar */}
      <div
        className="glass-card"
        style={{
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Filter Category:</span>
        <select
          className="form-select"
          style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="ALL">All Categories</option>
          <option value="Blocked emergency exit">Blocked Emergency Exit</option>
          <option value="Fire hazard">Fire Hazard</option>
          <option value="Flooding">Flooding</option>
          <option value="Damaged building">Damaged Building</option>
          <option value="Damaged electrical equipment">Damaged Electrical Equipment</option>
          <option value="Fallen tree">Fallen Tree</option>
          <option value="Unsafe construction area">Unsafe Construction Area</option>
        </select>
      </div>

      {/* Incidents Grid */}
      <div className="grid-cols-2">
        {filteredIncidents.map((inc) => (
          <div key={inc._id} className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <div>
                <span className="badge badge-warning" style={{ fontSize: '0.7rem', marginBottom: '0.35rem' }}>
                  {inc.incidentId || 'INC-2041'}
                </span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{inc.title}</h3>
              </div>
              <span className={`badge badge-${inc.severity?.toLowerCase()}`}>
                {inc.severity}
              </span>
            </div>

            <div style={{ fontSize: '0.82rem', color: '#818cf8', fontWeight: 600, marginBottom: '0.5rem' }}>
              Category: {inc.type}
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.85rem', lineHeight: 1.5 }}>
              {inc.description}
            </p>

            <div
              style={{
                background: 'rgba(15, 23, 42, 0.8)',
                borderRadius: 'var(--radius-md)',
                padding: '0.65rem 0.85rem',
                fontSize: '0.78rem',
                color: 'var(--text-secondary)',
                marginBottom: '0.75rem',
              }}
            >
              <div>📍 <strong>Location:</strong> {inc.location}</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <span>Reported by: <strong>{inc.reporterName || 'Anonymous Student'}</strong></span>
              <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.1)', color: 'var(--text-primary)' }}>
                Status: {inc.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IncidentReportsPage;
