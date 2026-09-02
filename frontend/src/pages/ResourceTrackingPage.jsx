import React, { useState, useEffect, useMemo } from 'react';
import { fetchDistributions } from '../services/api';
import ResourceJourneyModal from '../components/ResourceJourneyModal';
import Icon from '../components/Icons';

const PIPELINE_STAGES = ['SOURCE', 'VERIFICATION', 'TRANSIT', 'DELIVERY', 'DISTRIBUTION'];

const getStageIndex = (status) => {
  switch ((status || '').toLowerCase()) {
    case 'sourced':
    case 'intake':
    case 'allocated':
      return 0;
    case 'verified':
    case 'inspected':
      return 1;
    case 'in transit':
    case 'dispatched':
      return 2;
    case 'delivered':
    case 'arrived':
      return 3;
    case 'distributed':
    case 'completed':
      return 4;
    default:
      return 2;
  }
};

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
      if (filterStatus !== 'ALL' && dist.status?.toLowerCase() !== filterStatus.toLowerCase()) return false;

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

  // Derived Telemetry
  const totalUnits = useMemo(() => distributions.reduce((acc, d) => acc + (Number(d.quantity) || 0), 0), [distributions]);
  const inTransitCount = useMemo(() => distributions.filter((d) => d.status === 'In Transit').length, [distributions]);
  const deliveredCount = useMemo(() => distributions.filter((d) => d.status === 'Delivered' || d.status === 'Distributed').length, [distributions]);

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
            <span className="badge badge-info">LOGISTICS TELEMETRY</span>
            <span className="micro-label" style={{ color: 'var(--cyan)' }}>
              5-STAGE VISUAL SUPPLY CHAIN
            </span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.25rem' }}>
            Resource Distribution & Supply Flow
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            End-to-end tracking of relief aid shipments from intake warehouses to frontline distribution nodes.
          </p>
        </div>

        <button
          onClick={loadDistributions}
          className="btn btn-secondary btn-sm"
        >
          <Icon name="refresh-cw" size={14} />
          <span>Sync Logistics</span>
        </button>
      </div>

      {/* Visual Pipeline Banner */}
      <div className="spatial-panel" style={{ padding: '1.25rem 1.5rem', background: 'rgba(11, 17, 30, 0.88)' }}>
        <div className="micro-label" style={{ color: 'var(--cyan)', marginBottom: '0.75rem' }}>
          SUPPLY CHAIN PROGRESSION PIPELINE
        </div>
        <div className="supply-pipeline" style={{ margin: 0 }}>
          {PIPELINE_STAGES.map((stage, idx) => (
            <div key={stage} className="pipeline-step active">
              <div className="micro-label" style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                PHASE 0{idx + 1}
              </div>
              <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--cyan)', marginTop: '0.2rem' }}>
                {stage}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Telemetry KPI Metrics */}
      <div className="grid-cols-4">
        <div className="telemetry-widget">
          <span className="micro-label">TOTAL SHIPMENTS</span>
          <div className="telemetry-num cyan">{distributions.length}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Active logistic manifests</div>
        </div>

        <div className="telemetry-widget">
          <span className="micro-label">UNITS IN TRANSIT</span>
          <div className="telemetry-num amber">{totalUnits.toLocaleString()}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Emergency supplies moving</div>
        </div>

        <div className="telemetry-widget">
          <span className="micro-label">ACTIVE CONVOYS</span>
          <div className="telemetry-num crimson">{inTransitCount}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Vehicles currently en route</div>
        </div>

        <div className="telemetry-widget">
          <span className="micro-label">DELIVERED CARGO</span>
          <div className="telemetry-num mint">{deliveredCount}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Delivered to relief shelters</div>
        </div>
      </div>

      {/* Filters and Search Bar */}
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
          placeholder="Search item, destination, convoy ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <select
          className="form-select"
          style={{ width: 'auto', padding: '0.45rem 0.85rem', fontSize: '0.82rem' }}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="ALL">All Logistics States</option>
          <option value="In Transit">In Transit</option>
          <option value="Allocated">Allocated</option>
          <option value="Delivered">Delivered</option>
          <option value="Distributed">Distributed</option>
        </select>
      </div>

      {/* Loading / Error / Empty States */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '3.5rem 0', color: 'var(--text-muted)' }}>
          <div className="live-beacon-pulse" style={{ width: 22, height: 22, margin: '0 auto 1rem' }} />
          <span>Synchronizing supply chain records from MongoDB Atlas...</span>
        </div>
      )}

      {error && !loading && (
        <div style={{ padding: '1rem', background: 'rgba(255, 46, 77, 0.1)', border: '1px solid var(--border-red)', borderRadius: 'var(--radius-sm)', color: '#ff8597', textAlign: 'center' }}>
          {error}
        </div>
      )}

      {!loading && !error && filteredDistributions.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📦</div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#ffffff' }}>No Shipments Found</div>
          <div style={{ fontSize: '0.82rem' }}>No relief supply consignments match the active query.</div>
        </div>
      )}

      {/* Shipments Supply Chain Progression List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {filteredDistributions.map((dist) => {
          const activeIdx = getStageIndex(dist.status);

          return (
            <div
              key={dist._id}
              className="spatial-panel spatial-panel-hoverable"
              style={{
                padding: '1.5rem',
                background: 'rgba(11, 17, 30, 0.88)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.2rem' }}>
                    <span className="badge badge-info">{dist.status || 'In Transit'}</span>
                    <span className="micro-label" style={{ color: 'var(--text-muted)' }}>
                      ID: {dist.distributionId || dist._id}
                    </span>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#ffffff' }}>
                    {dist.resourceName}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.4rem', color: 'var(--cyan)' }}>
                    {dist.quantity} {dist.unit || 'units'}
                  </div>
                  <div className="micro-label" style={{ color: 'var(--text-muted)' }}>
                    {dist.responsibleOrganization || 'Relief Logistics Wing'}
                  </div>
                </div>
              </div>

              {/* Step Progress Bar */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 1fr)',
                  gap: '0.5rem',
                  marginBottom: '1.25rem',
                }}
              >
                {PIPELINE_STAGES.map((st, sIdx) => {
                  const isDone = sIdx < activeIdx;
                  const isCur = sIdx === activeIdx;

                  return (
                    <div
                      key={st}
                      style={{
                        height: '6px',
                        borderRadius: '3px',
                        background: isCur ? 'var(--cyan)' : isDone ? 'var(--mint)' : 'rgba(255, 255, 255, 0.08)',
                        boxShadow: isCur ? 'var(--glow-cyan)' : 'none',
                        transition: 'all 0.3s ease',
                      }}
                    />
                  );
                })}
              </div>

              {/* Waypoints & Details */}
              <div
                style={{
                  background: 'rgba(7, 11, 19, 0.75)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  fontSize: '0.82rem',
                }}
              >
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>ORIGIN: </span>
                  <strong style={{ color: '#ffffff' }}>{dist.source || 'Central Depot'}</strong>
                  <span style={{ margin: '0 0.5rem', color: 'var(--cyan)' }}>➔</span>
                  <span style={{ color: 'var(--text-muted)' }}>DESTINATION: </span>
                  <strong style={{ color: 'var(--cyan)' }}>{dist.destination || 'Disaster Shelter'}</strong>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedJourney(dist)}
                  className="btn btn-secondary btn-sm"
                >
                  Full Journey Timeline →
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Resource Journey Timeline Modal */}
      {selectedJourney && (
        <ResourceJourneyModal
          item={selectedJourney}
          onClose={() => setSelectedJourney(null)}
        />
      )}
    </div>
  );
};

export default ResourceTrackingPage;
