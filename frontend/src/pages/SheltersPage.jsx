import React, { useState, useEffect } from 'react';
import { fetchShelters } from '../services/api';

const SheltersPage = () => {
  const [shelters, setShelters] = useState([]);
  const [filterFacility, setFilterFacility] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  useEffect(() => {
    const loadShelters = async () => {
      const data = await fetchShelters();
      setShelters(data);
    };
    loadShelters();
  }, []);

  const filteredShelters = shelters.filter((s) => {
    const matchesFacility = filterFacility === 'ALL' || s.facilities?.includes(filterFacility);
    const matchesStatus = filterStatus === 'ALL' || s.status === filterStatus;
    return matchesFacility && matchesStatus;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>🏠 Available Emergency Shelters</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Safe havens, emergency beds, medical care & relief amenities
          </p>
        </div>
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
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Status:</span>
          <select
            className="form-select"
            style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="ALL">All Shelters</option>
            <option value="Open">🟢 Open / Available</option>
            <option value="Full">🔴 Full Capacity</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Facility:</span>
          <select
            className="form-select"
            style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
            value={filterFacility}
            onChange={(e) => setFilterFacility(e.target.value)}
          >
            <option value="ALL">All Facilities</option>
            <option value="Medical Support">Medical Support</option>
            <option value="Food">Food Mess</option>
            <option value="Drinking Water">Drinking Water</option>
            <option value="Sleeping Area">Sleeping Beds</option>
            <option value="Electricity">Electricity / Generators</option>
          </select>
        </div>
      </div>

      {/* Shelters Grid */}
      <div className="grid-cols-2">
        {filteredShelters.map((shelter) => {
          const percent = Math.min(100, Math.round(((shelter.occupancy || 0) / (shelter.capacity || 1)) * 100));
          const isFull = percent >= 100;
          const available = Math.max(0, shelter.capacity - shelter.occupancy);

          return (
            <div key={shelter._id} className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.2rem' }}>{shelter.name}</h3>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>📍 {shelter.address}</div>
                </div>
                <span className={`badge ${isFull ? 'badge-critical' : 'badge-success'}`}>
                  {isFull ? '🔴 FULL' : '🟢 OPEN'}
                </span>
              </div>

              {/* Occupancy Progress Bar */}
              <div style={{ margin: '0.75rem 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                  <span>Occupancy Capacity</span>
                  <strong>{shelter.occupancy} / {shelter.capacity} ({percent}%)</strong>
                </div>
                <div style={{ width: '100%', height: '10px', background: '#334155', borderRadius: '5px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${percent}%`,
                      height: '100%',
                      background: isFull
                        ? '#ef4444'
                        : percent > 75
                        ? '#f59e0b'
                        : 'linear-gradient(90deg, #10b981, #06b6d4)',
                    }}
                  />
                </div>
                <div style={{ fontSize: '0.78rem', color: isFull ? '#f87171' : '#34d399', marginTop: '0.35rem', fontWeight: 600 }}>
                  {isFull ? 'No beds currently available' : `${available} Available Beds Ready`}
                </div>
              </div>

              {/* Facilities Tags */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', margin: '0.75rem 0' }}>
                {shelter.facilities?.map((f, i) => (
                  <span
                    key={i}
                    style={{
                      background: 'rgba(99, 102, 241, 0.12)',
                      border: '1px solid rgba(99, 102, 241, 0.25)',
                      color: '#a5b4fc',
                      fontSize: '0.72rem',
                      padding: '0.2rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    ✓ {f}
                  </span>
                ))}
              </div>

              {/* Contact Button */}
              <div style={{ marginTop: 'auto', paddingTop: '0.85rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  📞 {shelter.phone}
                </span>
                <a
                  href={`tel:${shelter.phone}`}
                  className="btn btn-outline"
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
                >
                  Call Shelter
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SheltersPage;
