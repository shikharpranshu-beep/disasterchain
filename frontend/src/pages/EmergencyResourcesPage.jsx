import React, { useState, useEffect } from 'react';
import { fetchResources } from '../services/api';

const EmergencyResourcesPage = () => {
  const [resources, setResources] = useState([]);
  const [filterType, setFilterType] = useState('ALL');

  useEffect(() => {
    const loadResources = async () => {
      const data = await fetchResources();
      setResources(data);
    };
    loadResources();
  }, []);

  const filteredResources = resources.filter(
    (r) => filterType === 'ALL' || r.type === filterType
  );

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>🏥 Emergency Resources & Contacts Directory</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Verified directory of hospitals, trauma clinics, fire brigades, police desks, and relief distribution hubs
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
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Resource Type:</span>
        <select
          className="form-select"
          style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="ALL">All Emergency Resources</option>
          <option value="Hospital">Hospital / Trauma Center</option>
          <option value="Medical Center">Campus Medical Clinic</option>
          <option value="Fire Station">Fire Station</option>
          <option value="Police Station">Police Station</option>
          <option value="Disaster Management Office">Disaster Authority Office (DDMA)</option>
          <option value="Relief Center">Red Cross Relief Hub</option>
          <option value="Food Distribution Center">Food & Water Center</option>
        </select>
      </div>

      <div className="grid-cols-2">
        {filteredResources.map((res) => (
          <div key={res._id} className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <div>
                <span className="badge badge-info" style={{ fontSize: '0.7rem', marginBottom: '0.35rem' }}>
                  {res.type}
                </span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{res.name}</h3>
              </div>
              <span className="badge badge-success">{res.status || 'Operational'}</span>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.85rem', lineHeight: 1.5 }}>
              {res.description}
            </p>

            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
              📍 <strong>Address:</strong> {res.address}
            </div>

            <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                📞 {res.phone}
              </span>
              <a href={`tel:${res.phone}`} className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}>
                Call Facility
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmergencyResourcesPage;
