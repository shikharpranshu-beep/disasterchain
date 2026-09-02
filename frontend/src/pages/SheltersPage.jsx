import React, { useState, useEffect, useMemo } from 'react';
import { fetchShelters } from '../services/api';
import ShelterDetailModal from '../components/ShelterDetailModal';
import Icon from '../components/Icons';

const SheltersPage = () => {
  const [shelters, setShelters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterFacility, setFilterFacility] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShelter, setSelectedShelter] = useState(null);

  const loadShelters = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchShelters();
      setShelters(data || []);
    } catch (err) {
      console.error('Error fetching shelters:', err);
      setError('Unable to load shelter directory from backend server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShelters();
  }, []);

  // Filter and search
  const filteredShelters = useMemo(() => {
    return shelters.filter((s) => {
      if (filterFacility !== 'ALL') {
        const hasFacility = s.facilities?.some((f) =>
          f.toLowerCase().includes(filterFacility.toLowerCase())
        );
        if (!hasFacility) return false;
      }

      if (filterStatus !== 'ALL') {
        if (filterStatus === 'Available') {
          if (s.status !== 'Open' || s.capacity - s.occupancy <= 0) return false;
        } else if (filterStatus === 'Full') {
          if (s.status !== 'Full' && s.occupancy < s.capacity) return false;
        } else if (s.status !== filterStatus) {
          return false;
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = s.name?.toLowerCase().includes(q);
        const matchesAddress = s.address?.toLowerCase().includes(q);
        const matchesFacilities = s.facilities?.some((f) => f.toLowerCase().includes(q));
        if (!matchesName && !matchesAddress && !matchesFacilities) return false;
      }

      return true;
    });
  }, [shelters, filterFacility, filterStatus, searchQuery]);

  // Derived real metrics
  const totalCapacity = useMemo(() => shelters.reduce((acc, s) => acc + (Number(s.capacity) || 0), 0), [shelters]);
  const totalOccupancy = useMemo(() => shelters.reduce((acc, s) => acc + (Number(s.occupancy) || 0), 0), [shelters]);
  const totalAvailableBeds = Math.max(0, totalCapacity - totalOccupancy);
  const openSheltersCount = useMemo(() => shelters.filter((s) => s.status === 'Open' && s.capacity - s.occupancy > 0).length, [shelters]);
  const avgOccupancyRate = totalCapacity > 0 ? Math.round((totalOccupancy / totalCapacity) * 100) : 0;

  // Highest bed capacity recommendation
  const recommendedShelter = useMemo(() => {
    const openList = shelters.filter((s) => s.status === 'Open' && s.capacity - s.occupancy > 0);
    if (openList.length === 0) return null;
    return [...openList].sort((a, b) => (b.capacity - b.occupancy) - (a.capacity - a.occupancy))[0];
  }, [shelters]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Header */}
      <div
        className="spatial-panel"
        style={{
          padding: '1.5rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          background: 'rgba(9, 14, 25, 0.94)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
            <span className="badge badge-info">CIVIL DEFENSE SAFE HAVENS</span>
            <span className="micro-label" style={{ color: 'var(--cyan)' }}>
              LIVE OCCUPANCY TELEMETRY
            </span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.25rem' }}>
            Emergency Relief Shelters
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Verified safe havens, real-time bed capacity rings, and emergency support facilities.
          </p>
        </div>

        <button
          onClick={loadShelters}
          className="btn btn-secondary btn-sm"
          title="Refresh live shelter metrics"
        >
          <Icon name="refresh-cw" size={14} />
          <span>Sync Capacity</span>
        </button>
      </div>

      {/* Telemetry KPI Metrics */}
      <div className="grid-cols-4">
        <div className="telemetry-widget">
          <span className="micro-label">AVAILABLE BEDS</span>
          <div className="telemetry-num cyan">{totalAvailableBeds.toLocaleString()}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ready for immediate intake</div>
        </div>

        <div className="telemetry-widget">
          <span className="micro-label">SYSTEM CAPACITY</span>
          <div className="telemetry-num mint">{totalCapacity.toLocaleString()}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total shelter capacity</div>
        </div>

        <div className="telemetry-widget">
          <span className="micro-label">ACTIVE SAFE HAVENS</span>
          <div className="telemetry-num amber">{openSheltersCount} / {shelters.length}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Facilities with open intake</div>
        </div>

        <div className="telemetry-widget">
          <span className="micro-label">AVG OCCUPANCY</span>
          <div className="telemetry-num crimson">{avgOccupancyRate}%</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Regional bed utilization</div>
        </div>
      </div>

      {/* Recommended Shelter Spotlight Card */}
      {recommendedShelter && (
        <div
          className="spatial-panel"
          style={{
            border: '1px solid var(--border-highlight)',
            background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.08) 0%, rgba(11, 17, 30, 0.94) 100%)',
            boxShadow: 'var(--glow-cyan)',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span className="badge badge-info" style={{ fontSize: '0.68rem' }}>
                ⭐ RECOMMENDED SAFE HAVEN
              </span>
              <span className="micro-label" style={{ color: 'var(--mint)' }}>
                HIGHEST AVAILABLE CAPACITY
              </span>
            </div>
            <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#ffffff' }}>
              {recommendedShelter.name}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              📍 {recommendedShelter.address} • Contact: {recommendedShelter.phone}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.5rem', color: 'var(--cyan)' }}>
                {recommendedShelter.capacity - recommendedShelter.occupancy} BEDS
              </div>
              <div className="micro-label" style={{ color: 'var(--text-muted)' }}>
                Available of {recommendedShelter.capacity}
              </div>
            </div>

            <button
              onClick={() => setSelectedShelter(recommendedShelter)}
              className="btn btn-primary btn-sm"
            >
              Inspect Facility →
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div
        className="spatial-panel"
        style={{
          padding: '1rem 1.5rem',
          background: 'rgba(9, 14, 25, 0.92)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <input
          type="text"
          className="form-input"
          style={{ maxWidth: '280px', padding: '0.45rem 0.85rem', fontSize: '0.82rem' }}
          placeholder="Search shelters by name, address, amenity..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <select
            className="form-select"
            style={{ width: 'auto', padding: '0.45rem 0.85rem', fontSize: '0.82rem' }}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="Available">Open & Available</option>
            <option value="Full">Full Capacity</option>
            <option value="Standby">Standby</option>
          </select>

          <select
            className="form-select"
            style={{ width: 'auto', padding: '0.45rem 0.85rem', fontSize: '0.82rem' }}
            value={filterFacility}
            onChange={(e) => setFilterFacility(e.target.value)}
          >
            <option value="ALL">All Amenities</option>
            <option value="Medical">Medical Support</option>
            <option value="Food">Food / Rations</option>
            <option value="Water">Drinking Water</option>
            <option value="Power">Power Backup</option>
          </select>
        </div>
      </div>

      {/* Loading / Error / Empty States */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '3.5rem 0', color: 'var(--text-muted)' }}>
          <div className="live-beacon-pulse" style={{ width: 22, height: 22, margin: '0 auto 1rem' }} />
          <span>Synchronizing safe havens registry from MongoDB Atlas...</span>
        </div>
      )}

      {error && !loading && (
        <div style={{ padding: '1rem', background: 'rgba(255, 46, 77, 0.1)', border: '1px solid var(--border-red)', borderRadius: 'var(--radius-sm)', color: '#ff8597', textAlign: 'center' }}>
          {error}
        </div>
      )}

      {!loading && !error && filteredShelters.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏠</div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#ffffff' }}>No Shelters Found</div>
          <div style={{ fontSize: '0.82rem' }}>No relief safe havens match your search criteria.</div>
        </div>
      )}

      {/* Spatial Shelter Facility Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
        {filteredShelters.map((sh) => {
          const occ = Number(sh.occupancy) || 0;
          const cap = Number(sh.capacity) || 1;
          const avail = Math.max(0, cap - occ);
          const percent = Math.min(100, Math.round((occ / cap) * 100));

          // SVG Ring calculation
          const radius = 26;
          const circumference = 2 * Math.PI * radius;
          const strokeDashoffset = circumference - (percent / 100) * circumference;

          return (
            <div
              key={sh._id}
              className="spatial-panel spatial-panel-hoverable"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '1.35rem',
                background: 'rgba(11, 17, 30, 0.88)',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <span className={`badge ${sh.status === 'Open' ? 'badge-success' : 'badge-critical'}`}>
                    {sh.status === 'Open' ? '🟢 OPEN & ACTIVE' : '🔴 FULL CAPACITY'}
                  </span>

                  {/* SVG Radial Occupancy Gauge */}
                  <div className="occupancy-ring-wrap" style={{ width: 62, height: 62 }}>
                    <svg width="62" height="62" style={{ transform: 'rotate(-90deg)' }}>
                      <circle
                        cx="31"
                        cy="31"
                        r={radius}
                        stroke="rgba(255, 255, 255, 0.08)"
                        strokeWidth="5"
                        fill="transparent"
                      />
                      <circle
                        cx="31"
                        cy="31"
                        r={radius}
                        stroke={percent > 85 ? 'var(--crimson)' : percent > 50 ? 'var(--amber)' : 'var(--cyan)'}
                        strokeWidth="5"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        fill="transparent"
                        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                      />
                    </svg>
                    <div className="occupancy-ring-text">
                      {percent}%
                    </div>
                  </div>
                </div>

                <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#ffffff', marginBottom: '0.35rem' }}>
                  {sh.name}
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.85rem' }}>
                  📍 {sh.address}
                </div>

                {/* Capacity Counter */}
                <div
                  style={{
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.65rem 0.85rem',
                    marginBottom: '0.85rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div className="micro-label">AVAILABLE BEDS</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.15rem', color: avail > 0 ? 'var(--cyan)' : 'var(--crimson)' }}>
                      {avail} BEDS
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="micro-label">OCCUPANCY</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                      {occ} / {cap}
                    </div>
                  </div>
                </div>

                {/* Amenities */}
                {sh.facilities && sh.facilities.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1rem' }}>
                    {sh.facilities.map((fac, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: '0.7rem',
                          fontFamily: 'var(--font-mono)',
                          padding: '2px 7px',
                          background: 'rgba(0, 240, 255, 0.06)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-xs)',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        ✓ {fac}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.85rem' }}>
                <a
                  href={`https://maps.google.com/?q=${sh.latitude},${sh.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem' }}
                >
                  🗺️ Directions
                </a>
                <button
                  type="button"
                  onClick={() => setSelectedShelter(sh)}
                  className="btn btn-primary btn-sm"
                  style={{ fontSize: '0.75rem' }}
                >
                  View Details
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Shelter Detail Modal Drawer */}
      {selectedShelter && (
        <ShelterDetailModal
          shelter={selectedShelter}
          onClose={() => setSelectedShelter(null)}
        />
      )}
    </div>
  );
};

export default SheltersPage;
