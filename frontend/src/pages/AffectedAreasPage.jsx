import React, { useState, useEffect, useMemo } from 'react';
import { fetchAffectedAreas } from '../services/api';
import DisasterMap from '../components/DisasterMap';
import AreaDetailModal from '../components/AreaDetailModal';
import Icon from '../components/Icons';

const AffectedAreasPage = () => {
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState(null);

  const loadAreas = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchAffectedAreas();
      setAreas(data || []);
    } catch (err) {
      console.error('Error fetching affected areas:', err);
      setError('Unable to load disaster zone data from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAreas();
  }, []);

  const filteredAreas = useMemo(() => {
    return areas.filter((a) => {
      if (filterSeverity !== 'ALL' && a.severity !== filterSeverity) return false;
      if (filterStatus !== 'ALL' && a.status !== filterStatus) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = a.name?.toLowerCase().includes(q);
        const matchesType = a.disasterType?.toLowerCase().includes(q);
        const matchesDesc = a.description?.toLowerCase().includes(q);
        if (!matchesName && !matchesType && !matchesDesc) return false;
      }

      return true;
    });
  }, [areas, filterSeverity, filterStatus, searchQuery]);

  // Dynamic statistics
  const totalCasualties = areas.reduce((acc, a) => acc + (Number(a.affectedPeople) || 0), 0);
  const totalActiveSos = areas.reduce((acc, a) => acc + (Number(a.activeSOS) || 0), 0);
  const criticalZones = areas.filter((a) => a.severity === 'Critical').length;
  const activeSectorsCount = areas.filter((a) => a.status === 'Active').length;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="badge badge-warning" style={{ marginBottom: '0.4rem' }}>
            <Icon name="map" size={13} color="#f59e0b" />
            <span>GEO-SPATIAL IMPACT ASSESSMENT &bull; DISASTER ZONES</span>
          </div>
          <h1 className="page-header-title">
            <Icon name="map" size={26} color="#f59e0b" />
            <span>Affected Areas & Live Hazard Map</span>
          </h1>
          <p className="page-header-subtitle">
            Geographic hazard monitoring, OpenStreetMap impact radii, emergency shelters & live casualty signals
          </p>
        </div>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid-cols-4" style={{ marginBottom: '1.75rem' }}>
        <div className="glass-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase' }}>
            Monitored Hazard Zones
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fbbf24', margin: '0.35rem 0 0.15rem' }}>
            {areas.length}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {activeSectorsCount} Active impact sectors
          </div>
        </div>

        <div className="glass-card" style={{ borderLeft: '4px solid #ff334b' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase' }}>
            Critical Risk Zones
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ff4d63', margin: '0.35rem 0 0.15rem' }}>
            {criticalZones}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Evacuation orders in place
          </div>
        </div>

        <div className="glass-card" style={{ borderLeft: '4px solid #6366f1' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase' }}>
            Total Affected People
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#818cf8', margin: '0.35rem 0 0.15rem' }}>
            {totalCasualties.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Estimated casualty population
          </div>
        </div>

        <div className="glass-card" style={{ borderLeft: '4px solid #ff4d63' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase' }}>
            Active SOS Signals
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ff6b7e', margin: '0.35rem 0 0.15rem' }}>
            {totalActiveSos}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Across all monitored sectors
          </div>
        </div>
      </div>

      {/* Interactive Map */}
      <div style={{ marginBottom: '2rem' }}>
        <DisasterMap
          height="520px"
          variant="large"
          initialFilter="AREAS"
          showToolbar={true}
          showLegend={true}
        />
      </div>

      {/* Filter & Search Toolbar */}
      <div className="filter-toolbar" style={{ marginBottom: '1.5rem' }}>
        <div className="filter-group">
          <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Severity:</span>
          <select
            className="form-select"
            style={{ width: 'auto', padding: '0.45rem 0.85rem', fontSize: '0.84rem' }}
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
          >
            <option value="ALL">All Severities</option>
            <option value="Critical">🔴 Critical Impact</option>
            <option value="High">🟠 High Risk</option>
            <option value="Moderate">🟡 Moderate Threat</option>
            <option value="Low">🟢 Low Impact</option>
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
            <option value="ALL">All Statuses ({areas.length})</option>
            <option value="Active">Active ({activeSectorsCount})</option>
            <option value="Controlled">Controlled</option>
            <option value="Recovering">Recovering</option>
          </select>
        </div>

        <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: '300px' }}>
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.2rem', paddingRight: '0.75rem', fontSize: '0.84rem', height: '36px' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search zones, hazard type..."
          />
          <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
            <Icon name="search" size={14} />
          </span>
        </div>

        <div style={{ marginLeft: 'auto', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
          Showing <strong>{filteredAreas.length}</strong> of <strong>{areas.length}</strong> impact zones
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
              border: '3px solid rgba(245, 158, 11, 0.2)',
              borderTopColor: '#f59e0b',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem',
            }}
          />
          <div style={{ fontWeight: 700, fontSize: '1rem', color: '#ffffff' }}>Loading Sector Profiles from MongoDB...</div>
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
          <button onClick={loadAreas} className="btn btn-secondary btn-sm" style={{ marginTop: '0.75rem' }}>
            Retry Loading Zones
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredAreas.length === 0 && (
        <div
          className="glass-card"
          style={{
            textAlign: 'center',
            padding: '3.5rem 1.5rem',
            color: 'var(--text-muted)',
          }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🗺️</div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.35rem' }}>
            No Impact Zones Match Filter Criteria
          </h3>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 1.25rem' }}>
            Try resetting your severity or status filter to see other registered hazard areas.
          </p>
          <button
            onClick={() => {
              setFilterSeverity('ALL');
              setFilterStatus('ALL');
              setSearchQuery('');
            }}
            className="btn btn-secondary btn-sm"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Grid of Affected Areas */}
      {!loading && !error && filteredAreas.length > 0 && (
        <div className="grid-cols-3">
          {filteredAreas.map((area) => {
            const isCritical = area.severity === 'Critical';
            const isHigh = area.severity === 'High';

            return (
              <div
                key={area._id}
                className={`glass-card glass-card-hoverable ${isCritical ? 'glass-card-critical' : ''}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  borderTop: `4px solid ${isCritical ? '#ff334b' : isHigh ? '#f97316' : '#f59e0b'}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <h3
                    onClick={() => setSelectedArea(area)}
                    style={{
                      fontSize: '1.18rem',
                      fontWeight: 800,
                      color: '#ffffff',
                      cursor: 'pointer',
                      lineHeight: 1.3,
                    }}
                    title="Click to view complete sector assessment"
                  >
                    {area.name}
                  </h3>
                  <span className={`badge badge-${area.severity?.toLowerCase()}`}>
                    {area.severity}
                  </span>
                </div>

                <div style={{ fontSize: '0.84rem', color: '#818cf8', fontWeight: 700, marginBottom: '0.6rem' }}>
                  {area.disasterType}
                </div>

                <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', marginBottom: '1rem', lineHeight: 1.5 }}>
                  {area.description}
                </p>

                <div
                  style={{
                    background: 'rgba(11, 18, 34, 0.85)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.85rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.82rem',
                    color: 'var(--text-secondary)',
                    marginBottom: '1rem',
                  }}
                >
                  <div>👥 <strong>Affected:</strong> {(area.affectedPeople || 0).toLocaleString()}</div>
                  <div style={{ color: '#ff6b7e', fontWeight: 700 }}>🚨 <strong>SOS:</strong> {area.activeSOS || 0} Active</div>
                </div>

                <div
                  style={{
                    marginTop: 'auto',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid var(--border-subtle)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                  }}
                >
                  <span>Status: <strong style={{ color: '#34d399' }}>{area.status || 'Active'}</strong></span>
                  <button
                    onClick={() => setSelectedArea(area)}
                    className="btn btn-outline btn-sm"
                    style={{ fontSize: '0.74rem', padding: '0.25rem 0.65rem' }}
                  >
                    <Icon name="info" size={13} />
                    <span>Sector Brief</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      <AreaDetailModal
        isOpen={!!selectedArea}
        onClose={() => setSelectedArea(null)}
        area={selectedArea}
      />
    </div>
  );
};

export default AffectedAreasPage;
