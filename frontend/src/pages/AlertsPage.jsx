import React, { useState, useEffect } from 'react';
import { fetchAlerts } from '../services/api';

const AlertsPage = () => {
  const [alerts, setAlerts] = useState([]);
  const [filterSeverity, setFilterSeverity] = useState('ALL');

  useEffect(() => {
    const loadAlerts = async () => {
      const data = await fetchAlerts({ activeOnly: 'false' });
      setAlerts(data);
    };
    loadAlerts();
  }, []);

  const filteredAlerts = alerts.filter(
    (a) => filterSeverity === 'ALL' || a.severity === filterSeverity
  );

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>🔔 Emergency Broadcasts & Alerts</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Official emergency warnings, weather hazards & campus safety advisories
        </p>
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
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Filter Severity:</span>
        <select
          className="form-select"
          style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
        >
          <option value="ALL">All Alerts</option>
          <option value="Critical">🔴 Critical Alerts</option>
          <option value="Danger">🟠 Danger Advisories</option>
          <option value="Warning">🟡 Weather Warnings</option>
          <option value="Information">🔵 Information Notices</option>
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredAlerts.map((alert) => {
          const isCritical = alert.severity === 'Critical';
          const isDanger = alert.severity === 'Danger';

          return (
            <div
              key={alert._id}
              className="glass-card"
              style={{
                borderColor: isCritical ? 'rgba(239, 68, 68, 0.4)' : isDanger ? 'rgba(249, 115, 22, 0.4)' : 'var(--border-subtle)',
                background: isCritical ? 'rgba(35, 15, 20, 0.75)' : 'var(--bg-card)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ fontSize: '1.3rem' }}>{isCritical ? '🚨' : isDanger ? '⚠️' : '🔔'}</span>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>{alert.title}</h3>
                </div>
                <span className={`badge badge-${alert.severity?.toLowerCase()}`}>
                  {alert.severity}
                </span>
              </div>

              <p style={{ color: 'var(--text-primary)', fontSize: '0.9rem', marginBottom: '0.85rem', lineHeight: 1.5 }}>
                {alert.message}
              </p>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.78rem',
                  color: 'var(--text-muted)',
                  borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                  paddingTop: '0.65rem',
                }}
              >
                <span>📍 Affected Region: <strong>{alert.location}</strong></span>
                <span>Broadcasted: {new Date(alert.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AlertsPage;
