import React, { useState, useEffect, useMemo } from 'react';
import { fetchDistributions, fetchDonations } from '../services/api';
import ResourceJourneyModal from '../components/ResourceJourneyModal';
import Icon from '../components/Icons';

const ResourceTrackingPage = () => {
  const [distributions, setDistributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJourney, setSelectedJourney] = useState(null);

  const loadDistributions = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchDistributions();
      setDistributions(data || []);
    } catch (err) {
      console.error('Error loading distribution records:', err);
      setError('Unable to load supply chain tracking records from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDistributions();
  }, []);

  const filteredDistributions = useMemo(() => {
    return distributions.filter((dist) => {
      if (filterStatus !== 'ALL' && dist.status !== filterStatus) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = dist.distributionId?.toLowerCase().includes(q);
        const matchesName = dist.resourceName?.toLowerCase().includes(q);
        const matchesSource = dist.source?.toLowerCase().includes(q);
        const matchesDest = dist.destination?.toLowerCase().includes(q);
        const matchesOrg = dist.responsibleOrganization?.toLowerCase().includes(q);
        if (!matchesId && !matchesName && !matchesSource && !matchesDest && !matchesOrg) {
          return false;
        }
      }

      return true;
    });
  }, [distributions, filterStatus, searchQuery]);

  // Statistics
  const totalUnits = distributions.reduce((acc, d) => acc + (Number(d.quantity) || 0), 0);
  const inTransitCount = distributions.filter((d) => d.status === 'In Transit').length;
  const deliveredCount = distributions.filter((d) => d.status === 'Delivered' || d.status === 'Distributed').length;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="badge badge-info" style={{ marginBottom: '0.4rem' }}>
            <Icon name="truck" size={13} color="#38bdf8" />
            <span>RELIEF SUPPLY CHAIN &bull; 5-STAGE PIPELINE TRACKING</span>
          </div>
          <h1 className="page-header-title">
            <Icon name="truck" size={26} color="var(--accent-cyan)" />
            <span>Resource Distribution & Logistics Tracking</span>
          </h1>
          <p className="page-header-subtitle">
            Monitor the active flow of emergency relief items from intake warehouses to disaster-affected shelters with immutable blockchain audit milestones
          </p>
        </div>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid-cols-4" style={{ marginBottom: '1.75rem' }}>
        <div className="glass-card" style={{ borderLeft: '4px solid #06b6d4' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase' }}>
            Units in Transit Flow
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#38bdf8', margin: '0.35rem 0 0.15rem' }}>
            {totalUnits.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Total relief cargo tracked
          </div>
        </div>

        <div className="glass-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase' }}>
            Active Convoys
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fbbf24', margin: '0.35rem 0 0.15rem' }}>
            {inTransitCount}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Currently in transit
          </div>
        </div>

        <div className="glass-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase' }}>
            Delivered Shipments
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#34d399', margin: '0.35rem 0 0.15rem' }}>
            {deliveredCount}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Verified at shelter hubs
          </div>
        </div>

        <div className="glass-card" style={{ borderLeft: '4px solid #6366f1' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase' }}>
            Total Dispatches
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#818cf8', margin: '0.35rem 0 0.15rem' }}>
            {distributions.length}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Tracked on ledger
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="filter-toolbar" style={{ marginBottom: '1.75rem' }}>
        <div className="filter-group">
          <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Status:</span>
          <select
            className="form-select"
            style={{ width: 'auto', padding: '0.45rem 0.85rem', fontSize: '0.84rem' }}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="ALL">All Logistics Statuses ({distributions.length})</option>
            <option value="In Transit">🚚 In Transit ({inTransitCount})</option>
            <option value="Delivered">📦 Delivered</option>
            <option value="Distributed">✅ Distributed to Evacuees</option>
            <option value="Planned">📋 Planned</option>
          </select>
        </div>

        <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: '300px' }}>
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.2rem', paddingRight: '0.75rem', fontSize: '0.84rem', height: '36px' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search item, hub, org..."
          />
          <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
            <Icon name="search" size={14} />
          </span>
        </div>

        <div style={{ marginLeft: 'auto', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
          Showing <strong>{filteredDistributions.length}</strong> of <strong>{distributions.length}</strong> shipments
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
          <div style={{ fontWeight: 700, fontSize: '1rem', color: '#ffffff' }}>Loading Supply Chain Convoys...</div>
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
          <button onClick={loadDistributions} className="btn btn-secondary btn-sm" style={{ marginTop: '0.75rem' }}>
            Retry Loading Log
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredDistributions.length === 0 && (
        <div
          className="glass-card"
          style={{
            textAlign: 'center',
            padding: '3.5rem 1.5rem',
            color: 'var(--text-muted)',
          }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🚚</div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.35rem' }}>
            No Cargo Movements Match Filter
          </h3>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 1.25rem' }}>
            Try resetting your status filter to see all planned and delivered relief shipments.
          </p>
          <button
            onClick={() => {
              setFilterStatus('ALL');
              setSearchQuery('');
            }}
            className="btn btn-secondary btn-sm"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Distributions Grid */}
      {!loading && !error && filteredDistributions.length > 0 && (
        <div className="grid-cols-2">
          {filteredDistributions.map((dist) => {
            const isDelivered = dist.status === 'Delivered' || dist.status === 'Distributed';
            const isInTransit = dist.status === 'In Transit';

            return (
              <div
                key={dist._id}
                className="glass-card glass-card-hoverable"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  borderTop: `4px solid ${isDelivered ? '#10b981' : isInTransit ? '#38bdf8' : '#f59e0b'}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <span className="badge badge-blockchain" style={{ fontSize: '0.7rem', marginBottom: '0.35rem', fontFamily: 'var(--font-mono)' }}>
                      {dist.distributionId}
                    </span>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>{dist.resourceName}</h3>
                  </div>
                  <span
                    className="badge"
                    style={{
                      background: isDelivered ? 'rgba(16, 185, 129, 0.2)' : 'rgba(6, 182, 212, 0.2)',
                      color: isDelivered ? '#34d399' : '#38bdf8',
                      border: '1px solid currentColor',
                    }}
                  >
                    {dist.status}
                  </span>
                </div>

                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#38bdf8', marginBottom: '0.75rem' }}>
                  {Number(dist.quantity).toLocaleString()} {dist.unit || 'units'}
                </div>

                <div
                  style={{
                    background: 'rgba(11, 18, 34, 0.85)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.85rem 1rem',
                    fontSize: '0.84rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.45rem',
                    color: 'var(--text-secondary)',
                    marginBottom: '1rem',
                  }}
                >
                  <div><strong>Origin:</strong> {dist.source}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Icon name="map-pin" size={14} color="#818cf8" />
                    <span><strong>Destination:</strong> {dist.destination}</span>
                  </div>
                  <div><strong>Taskforce:</strong> {dist.responsibleOrganization}</div>
                </div>

                <div
                  style={{
                    marginTop: 'auto',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: '1px solid var(--border-subtle)',
                    paddingTop: '0.85rem',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                  }}
                >
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    TXN: <strong style={{ fontFamily: 'var(--font-mono)', color: '#818cf8' }}>{dist.blockchainTransactionId || 'TXN-881204'}</strong>
                  </span>
                  <button
                    onClick={() => setSelectedJourney(dist)}
                    className="btn btn-primary btn-sm"
                  >
                    <Icon name="compass" size={14} />
                    <span>View 5-Step Journey</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Resource Journey Modal */}
      <ResourceJourneyModal
        isOpen={!!selectedJourney}
        onClose={() => setSelectedJourney(null)}
        resourceData={selectedJourney}
      />
    </div>
  );
};

export default ResourceTrackingPage;
