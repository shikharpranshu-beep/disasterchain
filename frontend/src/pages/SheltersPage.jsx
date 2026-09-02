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
      console.error('Error fetching shelters from backend:', err);
      setError('Unable to load shelter directory from backend server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShelters();
  }, []);

  // Filter and search computation
  const filteredShelters = useMemo(() => {
    return shelters.filter((s) => {
      // Facility filter
      if (filterFacility !== 'ALL') {
        const hasFacility = s.facilities?.some((f) =>
          f.toLowerCase().includes(filterFacility.toLowerCase())
        );
        if (!hasFacility) return false;
      }

      // Status filter
      if (filterStatus !== 'ALL') {
        if (filterStatus === 'Available') {
          const isAvail = s.status === 'Open' && (s.capacity - s.occupancy > 0);
          if (!isAvail) return false;
        } else if (filterStatus === 'Full') {
          const isFull = s.status === 'Full' || s.occupancy >= s.capacity;
          if (!isFull) return false;
        } else if (s.status !== filterStatus) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = s.name?.toLowerCase().includes(q);
        const matchesAddress = s.address?.toLowerCase().includes(q);
        const matchesFacilities = s.facilities?.some((f) => f.toLowerCase().includes(q));
        const matchesPhone = s.phone?.toLowerCase().includes(q);

        if (!matchesName && !matchesAddress && !matchesFacilities && !matchesPhone) {
          return false;
        }
      }

      return true;
    });
  }, [shelters, filterFacility, filterStatus, searchQuery]);

  // Dynamic metrics computed from real MongoDB shelters
  const totalCapacity = shelters.reduce((acc, s) => acc + (Number(s.capacity) || 0), 0);
  const totalOccupancy = shelters.reduce((acc, s) => acc + (Number(s.occupancy) || 0), 0);
  const totalAvailableBeds = Math.max(0, totalCapacity - totalOccupancy);
  const openSheltersCount = shelters.filter((s) => s.status === 'Open' && (s.capacity - s.occupancy > 0)).length;
  const avgOccupancyRate = totalCapacity > 0 ? Math.round((totalOccupancy / totalCapacity) * 100) : 0;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="badge badge-success" style={{ marginBottom: '0.4rem' }}>
            <Icon name="home" size={13} color="#34d399" />
            <span>DISASTER RELIEF SAFE HAVENS &bull; LIVE CAPACITY</span>
          </div>
          <h1 className="page-header-title">
            <Icon name="home" size={26} color="#10b981" />
            <span>Available Emergency Shelters</span>
          </h1>
          <p className="page-header-subtitle">
            Real-time safe havens, occupancy progress meters, emergency medical amenities & live bed availability
          </p>
        </div>
      </div>

      {/* Top 4 KPI Metric Summary Cards */}
      <div className="grid-cols-4" style={{ marginBottom: '1.75rem' }}>
        <div className="glass-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase' }}>
            Available Beds Ready
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#34d399', margin: '0.35rem 0 0.15rem' }}>
            {totalAvailableBeds}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Out of {totalCapacity} total shelter beds
          </div>
        </div>

        <div className="glass-card" style={{ borderLeft: '4px solid #06b6d4' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase' }}>
            Current Residents
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#38bdf8', margin: '0.35rem 0 0.15rem' }}>
            {totalOccupancy}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {avgOccupancyRate}% average occupancy rate
          </div>
        </div>

        <div className="glass-card" style={{ borderLeft: '4px solid #6366f1' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase' }}>
            Open Safe Havens
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#818cf8', margin: '0.35rem 0 0.15rem' }}>
            {openSheltersCount}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Of {shelters.length} registered facilities
          </div>
        </div>

        <div className="glass-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase' }}>
            Total Shelters
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fbbf24', margin: '0.35rem 0 0.15rem' }}>
            {shelters.length}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Equipped with relief supplies
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="filter-toolbar" style={{ marginBottom: '1.75rem' }}>
        <div className="filter-group">
          <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Status / Availability:</span>
          <select
            className="form-select"
            style={{ width: 'auto', padding: '0.45rem 0.85rem', fontSize: '0.84rem' }}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="ALL">All Shelters ({shelters.length})</option>
            <option value="Available">🟢 Available Beds ({openSheltersCount})</option>
            <option value="Full">🔴 Full Capacity</option>
            <option value="Open">Open</option>
            <option value="Temporarily Closed">Temporarily Closed</option>
          </select>
        </div>

        <div className="filter-group">
          <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Required Facility:</span>
          <select
            className="form-select"
            style={{ width: 'auto', padding: '0.45rem 0.85rem', fontSize: '0.84rem' }}
            value={filterFacility}
            onChange={(e) => setFilterFacility(e.target.value)}
          >
            <option value="ALL">All Facilities</option>
            <option value="Medical Support">Medical Support</option>
            <option value="Food">Food / Meals</option>
            <option value="Drinking Water">Drinking Water</option>
            <option value="Sleeping Area">Sleeping Beds</option>
            <option value="Electricity">Electricity / Power</option>
            <option value="Toilets">Sanitation & Toilets</option>
            <option value="Internet">Internet Connectivity</option>
          </select>
        </div>

        <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: '320px' }}>
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.2rem', paddingRight: '0.75rem', fontSize: '0.84rem', height: '36px' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, address, amenity..."
          />
          <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
            <Icon name="search" size={14} />
          </span>
        </div>

        <div style={{ marginLeft: 'auto', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
          Showing <strong>{filteredShelters.length}</strong> of <strong>{shelters.length}</strong> shelters
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-secondary)' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: '3px solid rgba(16, 185, 129, 0.2)',
              borderTopColor: '#10b981',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem',
            }}
          />
          <div style={{ fontWeight: 700, fontSize: '1rem', color: '#ffffff' }}>Loading Shelter Facilities from MongoDB...</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Syncing capacity data & geo-coordinates</div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div
          style={{
            background: 'rgba(255, 51, 75, 0.15)',
            border: '1px solid rgba(255, 51, 75, 0.35)',
            color: '#ff6b7e',
            padding: '1.25rem',
            borderRadius: 'var(--radius-md)',
            textAlign: 'center',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>⚠️ {error}</div>
          <button onClick={loadShelters} className="btn btn-secondary btn-sm" style={{ marginTop: '0.75rem' }}>
            Retry Loading Directory
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredShelters.length === 0 && (
        <div
          className="glass-card"
          style={{
            textAlign: 'center',
            padding: '3.5rem 1.5rem',
            color: 'var(--text-muted)',
          }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🏠</div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.35rem' }}>
            No Shelters Match Selected Filters
          </h3>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 1.25rem' }}>
            {searchQuery || filterFacility !== 'ALL' || filterStatus !== 'ALL'
              ? 'Try resetting your search query or amenity filter to view other available shelters.'
              : 'There are currently no shelter records registered in the database.'}
          </p>
          <button
            onClick={() => {
              setFilterFacility('ALL');
              setFilterStatus('ALL');
              setSearchQuery('');
            }}
            className="btn btn-secondary btn-sm"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Shelters Grid */}
      {!loading && !error && filteredShelters.length > 0 && (
        <div className="grid-cols-2">
          {filteredShelters.map((shelter) => {
            const cap = Number(shelter.capacity) || 1;
            const occ = Number(shelter.occupancy) || 0;
            const percent = Math.min(100, Math.round((occ / cap) * 100));
            const isFull = percent >= 100;
            const isClosed = shelter.status === 'Temporarily Closed';
            const available = Math.max(0, cap - occ);

            const lat = shelter.latitude || 28.6139;
            const lng = shelter.longitude || 77.2090;
            const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

            return (
              <div
                key={shelter._id}
                className="glass-card glass-card-hoverable"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  borderTop: `4px solid ${isClosed ? '#64748b' : isFull ? '#ff334b' : percent > 75 ? '#f59e0b' : '#10b981'}`,
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.65rem' }}>
                  <div>
                    <h3
                      onClick={() => setSelectedShelter(shelter)}
                      style={{
                        fontSize: '1.2rem',
                        fontWeight: 800,
                        marginBottom: '0.25rem',
                        color: '#ffffff',
                        cursor: 'pointer',
                        transition: 'color 0.15s ease',
                      }}
                      title="Click to view full shelter details"
                    >
                      {shelter.name}
                    </h3>

                    <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Icon name="map-pin" size={14} color="#818cf8" style={{ flexShrink: 0 }} />
                      <span>{shelter.address}</span>
                    </div>
                  </div>

                  <span
                    className={`badge ${
                      isClosed
                        ? 'badge-neutral'
                        : isFull
                        ? 'badge-critical'
                        : 'badge-success'
                    }`}
                  >
                    {isClosed ? 'CLOSED' : isFull ? 'FULL' : 'OPEN'}
                  </span>
                </div>

                {/* Coordinates & Status Tag */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', background: 'rgba(0,0,0,0.3)', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)' }}>
                    📍 Lat: {lat.toFixed(4)}, Lng: {lng.toFixed(4)}
                  </span>
                  <span style={{ fontSize: '0.72rem', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-sm)', color: '#a5b4fc' }}>
                    Status: {shelter.status || 'Open'}
                  </span>
                </div>

                {/* Occupancy Progress Bar */}
                <div style={{ margin: '0.25rem 0 0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', marginBottom: '0.35rem' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Occupancy Capacity</span>
                    <strong style={{ color: isFull ? '#ff4d63' : '#ffffff' }}>
                      {occ} / {cap} Beds ({percent}%)
                    </strong>
                  </div>

                  <div style={{ width: '100%', height: '10px', background: '#1e293b', borderRadius: '5px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${percent}%`,
                        height: '100%',
                        background: isFull
                          ? '#ff334b'
                          : percent > 75
                          ? '#f59e0b'
                          : 'linear-gradient(90deg, #10b981, #06b6d4)',
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginTop: '0.4rem' }}>
                    <span style={{ color: isFull ? '#ff6b7e' : '#34d399', fontWeight: 700 }}>
                      {isFull ? '🔴 No Beds Available' : `🟢 ${available} Available Beds Ready`}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      Current: {occ} People
                    </span>
                  </div>
                </div>

                {/* Facilities Tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1rem' }}>
                  {shelter.facilities?.map((f, i) => (
                    <span
                      key={i}
                      style={{
                        background: 'rgba(99, 102, 241, 0.1)',
                        border: '1px solid rgba(99, 102, 241, 0.25)',
                        color: '#a5b4fc',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        padding: '0.2rem 0.55rem',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      ✓ {f}
                    </span>
                  ))}
                </div>

                {/* Actions Footer */}
                <div
                  style={{
                    marginTop: 'auto',
                    paddingTop: '0.85rem',
                    borderTop: '1px solid var(--border-subtle)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                  }}
                >
                  <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Icon name="phone" size={14} color="#38bdf8" />
                    <a href={`tel:${shelter.phone}`} style={{ color: '#38bdf8', fontWeight: 600 }}>{shelter.phone}</a>
                  </span>

                  <div style={{ display: 'flex', gap: '0.45rem' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedShelter(shelter)}
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
                    >
                      <Icon name="info" size={13} />
                      <span>Details</span>
                    </button>

                    <a
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
                      title="Open navigation directions to shelter"
                    >
                      <Icon name="compass" size={13} color="#38bdf8" />
                      <span>Directions</span>
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Shelter Detail Modal */}
      <ShelterDetailModal
        isOpen={!!selectedShelter}
        onClose={() => setSelectedShelter(null)}
        shelter={selectedShelter}
      />
    </div>
  );
};

export default SheltersPage;
