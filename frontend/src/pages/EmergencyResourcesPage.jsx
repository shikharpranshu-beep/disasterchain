import React, { useState, useEffect, useMemo } from 'react';
import { fetchResources } from '../services/api';
import ResourceDetailModal from '../components/ResourceDetailModal';
import Icon from '../components/Icons';

const EmergencyResourcesPage = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedResource, setSelectedResource] = useState(null);

  const loadResources = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchResources();
      setResources(data || []);
    } catch (err) {
      console.error('Error fetching emergency resources:', err);
      setError('Unable to load emergency resource directory from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResources();
  }, []);

  const filteredResources = useMemo(() => {
    return resources.filter((r) => {
      if (filterType !== 'ALL' && r.type !== filterType) return false;
      if (filterStatus !== 'ALL' && r.status !== filterStatus) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = r.name?.toLowerCase().includes(q);
        const matchesType = r.type?.toLowerCase().includes(q);
        const matchesAddress = r.address?.toLowerCase().includes(q);
        const matchesDesc = r.description?.toLowerCase().includes(q);
        const matchesPhone = r.phone?.toLowerCase().includes(q);
        if (!matchesName && !matchesType && !matchesAddress && !matchesDesc && !matchesPhone) {
          return false;
        }
      }

      return true;
    });
  }, [resources, filterType, filterStatus, searchQuery]);

  // Statistics
  const operationalCount = resources.filter((r) => r.status === 'Operational' || r.status === 'Available').length;
  const hospitalCount = resources.filter((r) => r.type === 'Hospital' || r.type === 'Medical Center').length;
  const fireCount = resources.filter((r) => r.type === 'Fire Station').length;
  const reliefHubCount = resources.filter((r) => r.type === 'Relief Center' || r.type === 'Food Distribution Center').length;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="badge badge-info" style={{ marginBottom: '0.4rem' }}>
            <Icon name="hospital" size={13} color="#38bdf8" />
            <span>CRISIS INFRASTRUCTURE &bull; EMERGENCY DIRECTORY</span>
          </div>
          <h1 className="page-header-title">
            <Icon name="hospital" size={26} color="#06b6d4" />
            <span>Emergency Contacts & Resources Directory</span>
          </h1>
          <p className="page-header-subtitle">
            Verified directory of hospitals, trauma centers, fire stations, police desks, and relief distribution hubs
          </p>
        </div>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid-cols-4" style={{ marginBottom: '1.75rem' }}>
        <div className="glass-card" style={{ borderLeft: '4px solid #06b6d4' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase' }}>
            Operational Facilities
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#38bdf8', margin: '0.35rem 0 0.15rem' }}>
            {operationalCount}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Of {resources.length} registered centers
          </div>
        </div>

        <div className="glass-card" style={{ borderLeft: '4px solid #ff334b' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase' }}>
            Hospitals & Trauma Units
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ff6b7e', margin: '0.35rem 0 0.15rem' }}>
            {hospitalCount}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Equipped for emergency surgery
          </div>
        </div>

        <div className="glass-card" style={{ borderLeft: '4px solid #f97316' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase' }}>
            Fire & Rescue Stations
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fb923c', margin: '0.35rem 0 0.15rem' }}>
            {fireCount}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Rapid response engines
          </div>
        </div>

        <div className="glass-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase' }}>
            Relief & Food Hubs
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#34d399', margin: '0.35rem 0 0.15rem' }}>
            {reliefHubCount}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Supplies & rationing posts
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="filter-toolbar" style={{ marginBottom: '1.75rem' }}>
        <div className="filter-group">
          <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Category:</span>
          <select
            className="form-select"
            style={{ width: 'auto', padding: '0.45rem 0.85rem', fontSize: '0.84rem' }}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="ALL">All Categories</option>
            <option value="Hospital">Hospitals & Trauma Centers</option>
            <option value="Medical Center">Campus Medical Clinics</option>
            <option value="Fire Station">Fire Stations</option>
            <option value="Police Station">Police Stations</option>
            <option value="Disaster Management Office">Disaster Authority Office (DDMA)</option>
            <option value="Relief Center">Red Cross Relief Hubs</option>
            <option value="Food Distribution Center">Food & Water Centers</option>
          </select>
        </div>

        <div className="filter-group">
          <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Status:</span>
          <select
            className="form-select"
            style={{ width: 'auto', padding: '0.45rem 0.85rem', fontSize: '0.84rem' }}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="ALL">All Statuses ({resources.length})</option>
            <option value="Operational">Operational ({operationalCount})</option>
            <option value="Available">Available</option>
            <option value="Limited">Limited Capacity</option>
            <option value="Full">Full</option>
          </select>
        </div>

        <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: '300px' }}>
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.2rem', paddingRight: '0.75rem', fontSize: '0.84rem', height: '36px' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by facility name, street, phone..."
          />
          <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
            <Icon name="search" size={14} />
          </span>
        </div>

        <div style={{ marginLeft: 'auto', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
          Showing <strong>{filteredResources.length}</strong> of <strong>{resources.length}</strong> facilities
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-secondary)' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: '3px solid rgba(6, 182, 212, 0.2)',
              borderTopColor: '#06b6d4',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem',
            }}
          />
          <div style={{ fontWeight: 700, fontSize: '1rem', color: '#ffffff' }}>Loading Emergency Facilities...</div>
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
          <button onClick={loadResources} className="btn btn-secondary btn-sm" style={{ marginTop: '0.75rem' }}>
            Retry Loading Directory
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredResources.length === 0 && (
        <div
          className="glass-card"
          style={{
            textAlign: 'center',
            padding: '3.5rem 1.5rem',
            color: 'var(--text-muted)',
          }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🏥</div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.35rem' }}>
            No Emergency Facilities Match Filters
          </h3>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 1.25rem' }}>
            Try resetting your category or status filters to view the full directory.
          </p>
          <button
            onClick={() => {
              setFilterType('ALL');
              setFilterStatus('ALL');
              setSearchQuery('');
            }}
            className="btn btn-secondary btn-sm"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Resources Grid */}
      {!loading && !error && filteredResources.length > 0 && (
        <div className="grid-cols-2">
          {filteredResources.map((res) => {
            const isAvailable = res.status === 'Operational' || res.status === 'Available';
            const lat = res.latitude || 28.6139;
            const lng = res.longitude || 77.2090;
            const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

            return (
              <div
                key={res._id}
                className="glass-card glass-card-hoverable"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  borderTop: `4px solid ${isAvailable ? '#10b981' : '#f59e0b'}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div>
                    <span className="badge badge-info" style={{ fontSize: '0.7rem', marginBottom: '0.35rem' }}>
                      {res.type}
                    </span>
                    <h3
                      onClick={() => setSelectedResource(res)}
                      style={{
                        fontSize: '1.2rem',
                        fontWeight: 800,
                        color: '#ffffff',
                        cursor: 'pointer',
                        lineHeight: 1.3,
                      }}
                      title="Click to view full facility details"
                    >
                      {res.name}
                    </h3>
                  </div>
                  <span
                    className="badge"
                    style={{
                      background: isAvailable ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                      color: isAvailable ? '#34d399' : '#fbbf24',
                      border: '1px solid currentColor',
                    }}
                  >
                    {res.status || 'Operational'}
                  </span>
                </div>

                <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', marginBottom: '0.85rem', lineHeight: 1.5 }}>
                  {res.description}
                </p>

                <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Icon name="map-pin" size={14} color="#818cf8" style={{ flexShrink: 0 }} />
                  <span><strong>Address:</strong> {res.address}</span>
                </div>

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
                  <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Icon name="phone" size={15} color="#38bdf8" />
                    <a href={`tel:${res.phone}`} style={{ color: '#38bdf8' }}>{res.phone}</a>
                  </span>

                  <div style={{ display: 'flex', gap: '0.45rem' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedResource(res)}
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
                    >
                      <Icon name="info" size={13} />
                      <span>Details</span>
                    </button>

                    <a
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
                      title="Open directions in maps"
                    >
                      <Icon name="compass" size={13} color="#38bdf8" />
                      <span>Navigate</span>
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Resource Detail Modal */}
      <ResourceDetailModal
        isOpen={!!selectedResource}
        onClose={() => setSelectedResource(null)}
        resource={selectedResource}
      />
    </div>
  );
};

export default EmergencyResourcesPage;
