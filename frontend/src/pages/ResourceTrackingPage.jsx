import React, { useState, useEffect } from 'react';
import { fetchDistributions } from '../services/api';
import ResourceJourneyModal from '../components/ResourceJourneyModal';

const ResourceTrackingPage = () => {
  const [distributions, setDistributions] = useState([]);
  const [selectedJourney, setSelectedJourney] = useState(null);

  useEffect(() => {
    const loadDistributions = async () => {
      const data = await fetchDistributions();
      setDistributions(data);
    };
    loadDistributions();
  }, []);

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>🚚 Resource Distribution & Logistics Tracking</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Monitor the active flow of emergency relief items from warehouses to disaster-affected shelters
        </p>
      </div>

      <div className="grid-cols-2">
        {distributions.map((dist) => (
          <div key={dist._id} className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <div>
                <span className="badge badge-blockchain" style={{ fontSize: '0.7rem', marginBottom: '0.35rem' }}>
                  {dist.distributionId}
                </span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{dist.resourceName}</h3>
              </div>
              <span className="badge badge-info">{dist.status}</span>
            </div>

            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#38bdf8', marginBottom: '0.75rem' }}>
              {dist.quantity} {dist.unit}
            </div>

            <div
              style={{
                background: 'rgba(15, 23, 42, 0.8)',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem',
                fontSize: '0.82rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem',
                color: 'var(--text-secondary)',
                marginBottom: '1rem',
              }}
            >
              <div><strong>Origin:</strong> {dist.source}</div>
              <div><strong>Destination:</strong> 📍 {dist.destination}</div>
              <div><strong>Taskforce:</strong> {dist.responsibleOrganization}</div>
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.85rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Blockchain TXN: <strong style={{ fontFamily: 'var(--font-mono)' }}>{dist.blockchainTransactionId || 'TXN-881204'}</strong>
              </span>
              <button
                onClick={() => setSelectedJourney(dist)}
                className="btn btn-primary"
                style={{ fontSize: '0.8rem', padding: '0.45rem 0.9rem' }}
              >
                🗺️ View Full Journey
              </button>
            </div>
          </div>
        ))}
      </div>

      <ResourceJourneyModal
        isOpen={!!selectedJourney}
        onClose={() => setSelectedJourney(null)}
        resourceData={selectedJourney}
      />
    </div>
  );
};

export default ResourceTrackingPage;
