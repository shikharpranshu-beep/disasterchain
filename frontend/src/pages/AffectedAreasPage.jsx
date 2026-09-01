import React, { useState, useEffect } from 'react';
import { fetchAffectedAreas } from '../services/api';
import DisasterMap from '../components/DisasterMap';

const AffectedAreasPage = () => {
  const [areas, setAreas] = useState([]);

  useEffect(() => {
    const loadAreas = async () => {
      const data = await fetchAffectedAreas();
      setAreas(data);
    };
    loadAreas();
  }, []);

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>🗺️ Affected Areas & Live Disaster Map</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Geographic hazard monitoring, OpenStreetMap impact radii, emergency shelters & live casualty signals
        </p>
      </div>

      {/* Interactive Map */}
      <div style={{ marginBottom: '2rem' }}>
        <DisasterMap
          height="540px"
          variant="large"
          initialFilter="ALL"
          showToolbar={true}
          showLegend={true}
        />
      </div>

      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
          📋 Monitored Sector Profiles & Hazard Reports
        </h2>
        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          {areas.length} Active Impact Zones
        </span>
      </div>

      <div className="grid-cols-3">
        {areas.map((area) => {
          const isCritical = area.severity === 'Critical';
          const isHigh = area.severity === 'High';

          return (
            <div
              key={area._id}
              className="glass-card"
              style={{
                borderColor: isCritical ? 'rgba(239, 68, 68, 0.4)' : isHigh ? 'rgba(249, 115, 22, 0.4)' : 'var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{area.name}</h3>
                <span className={`badge badge-${area.severity?.toLowerCase()}`}>
                  {area.severity}
                </span>
              </div>

              <div style={{ fontSize: '0.85rem', color: '#818cf8', fontWeight: 600, marginBottom: '0.6rem' }}>
                {area.disasterType}
              </div>

              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem', lineHeight: 1.5 }}>
                {area.description}
              </p>

              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.8)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                }}
              >
                <div>👥 <strong>Affected:</strong> {area.affectedPeople.toLocaleString()}</div>
                <div style={{ color: '#f87171', fontWeight: 700 }}>🚨 <strong>SOS:</strong> {area.activeSOS} Active</div>
              </div>

              <div style={{ marginTop: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span>Status: <strong style={{ color: '#34d399' }}>{area.status}</strong></span>
                <span>Lat: {area.latitude || 28.61}, Long: {area.longitude || 77.20}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AffectedAreasPage;
