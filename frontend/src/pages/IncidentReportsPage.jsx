import React, { useState, useEffect, useMemo } from 'react';
import { fetchIncidents } from '../services/api';
import IncidentDetailModal from '../components/IncidentDetailModal';
import Icon from '../components/Icons';

const IncidentReportsPage = ({ onOpenIncident }) => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIncident, setSelectedIncident] = useState(null);

  const loadIncidents = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchIncidents();
      setIncidents(data || []);
    } catch (err) {
      console.error('Error loading incidents from backend:', err);
      setError('Unable to load incident reports from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncidents();
  }, []);

  const handleStatusUpdated = (id, newStatus) => {
    setIncidents((prev) =>
      prev.map((i) => (i._id === id ? { ...i, status: newStatus } : i))
    );
  };

  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      if (filterType !== 'ALL' && inc.type !== filterType) return false;
      if (filterSeverity !== 'ALL' && inc.severity !== filterSeverity) return false;
      if (filterStatus !== 'ALL' && inc.status !== filterStatus) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = inc.incidentId?.toLowerCase().includes(q);
        const matchesTitle = inc.title?.toLowerCase().includes(q);
        const matchesType = inc.type?.toLowerCase().includes(q);
        const matchesDesc = inc.description?.toLowerCase().includes(q);
        const matchesLoc = inc.location?.toLowerCase().includes(q);
        if (!matchesId && !matchesTitle && !matchesType && !matchesDesc && !matchesLoc) {
          return false;
        }
      }

      return true;
    });
  }, [incidents, filterType, filterSeverity, filterStatus, searchQuery]);

  // Statistics
  const pendingCount = incidents.filter((i) => i.status === 'Pending').length;
  const underReviewCount = incidents.filter((i) => i.status === 'Under Review').length;
  const resolvedCount = incidents.filter((i) => i.status === 'Resolved').length;
  const criticalCount = incidents.filter((i) => i.severity === 'Critical').length;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="badge badge-warning" style={{ marginBottom: '0.4rem' }}>
            <Icon name="warning" size={13} color="#f59e0b" />
            <span>COMMUNITY SAFETY &bull; CROWDSOURCED HAZARD TRIAGE</span>
          </div>
          <h1 className="page-header-title">
            <Icon name="warning" size={26} color="#f97316" />
            <span>Campus Hazard & Incident Reports</span>
          </h1>
          <p className="page-header-subtitle">
            Crowdsourced community hazard reporting, structural damage tickets, gas leaks & facility triage
          </p>
        </div>

        <div className="page-header-actions">
          <button onClick={onOpenIncident} className="btn btn-primary" id="incident-report-new-btn">
            <Icon name="plus" size={17} />
            <span>Report New Hazard</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid-cols-4" style={{ marginBottom: '1.75rem' }}>
        <div className="glass-card" style={{ borderLeft: '4px solid #f97316' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase' }}>
            Total Reports
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fb923c', margin: '0.35rem 0 0.15rem' }}>
            {incidents.length}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Logged by students & faculty
          </div>
        </div>

        <div className="glass-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase' }}>
            Pending Triage
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fbbf24', margin: '0.35rem 0 0.15rem' }}>
            {pendingCount}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Awaiting inspection
          </div>
        </div>

        <div className="glass-card" style={{ borderLeft: '4px solid #6366f1' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase' }}>
            Under Review
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#818cf8', margin: '0.35rem 0 0.15rem' }}>
            {underReviewCount}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Maintenance in progress
          </div>
        </div>

        <div className="glass-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase' }}>
            Resolved Tickets
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#34d399', margin: '0.35rem 0 0.15rem' }}>
            {resolvedCount}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Hazards neutralized
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
            <option value="Blocked emergency exit">Blocked Emergency Exit</option>
            <option value="Fire hazard">Fire Hazard</option>
            <option value="Flooding">Flooding / Water Leak</option>
            <option value="Damaged building">Structural Damage</option>
            <option value="Damaged electrical equipment">Damaged Electrical Wiring</option>
            <option value="Fallen tree">Fallen Tree / Roadblock</option>
            <option value="Unsafe construction area">Unsafe Construction Area</option>
            <option value="Earthquake Damage">Earthquake Damage</option>
            <option value="Gas Leak">Gas Leak</option>
            <option value="Other">Other Hazard</option>
          </select>
        </div>

        <div className="filter-group">
          <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Severity:</span>
          <select
            className="form-select"
            style={{ width: 'auto', padding: '0.45rem 0.85rem', fontSize: '0.84rem' }}
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
          >
            <option value="ALL">All Severities</option>
            <option value="Critical">🔴 Critical ({criticalCount})</option>
            <option value="High">🟠 High</option>
            <option value="Medium">🟡 Medium</option>
            <option value="Low">🟢 Low</option>
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
            <option value="ALL">All Statuses</option>
            <option value="Pending">Pending ({pendingCount})</option>
            <option value="Under Review">Under Review ({underReviewCount})</option>
            <option value="Resolved">Resolved ({resolvedCount})</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: '280px' }}>
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.2rem', paddingRight: '0.75rem', fontSize: '0.84rem', height: '36px' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID, title, location..."
          />
          <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
            <Icon name="search" size={14} />
          </span>
        </div>

        <div style={{ marginLeft: 'auto', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
          Showing <strong>{filteredIncidents.length}</strong> of <strong>{incidents.length}</strong> reports
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
              border: '3px solid rgba(249, 115, 22, 0.2)',
              borderTopColor: '#f97316',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem',
            }}
          />
          <div style={{ fontWeight: 700, fontSize: '1rem', color: '#ffffff' }}>Loading Hazard Reports from MongoDB...</div>
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
          <button onClick={loadIncidents} className="btn btn-secondary btn-sm" style={{ marginTop: '0.75rem' }}>
            Retry Loading Reports
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredIncidents.length === 0 && (
        <div
          className="glass-card"
          style={{
            textAlign: 'center',
            padding: '3.5rem 1.5rem',
            color: 'var(--text-muted)',
          }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>⚡</div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.35rem' }}>
            No Hazard Reports Match Filter Criteria
          </h3>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 1.25rem' }}>
            Try resetting your category or severity filters to view all reported campus hazards.
          </p>
          <button
            onClick={() => {
              setFilterType('ALL');
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

      {/* Incidents Grid */}
      {!loading && !error && filteredIncidents.length > 0 && (
        <div className="grid-cols-2">
          {filteredIncidents.map((inc) => {
            const isCritical = inc.severity === 'Critical';

            return (
              <div
                key={inc._id}
                className={`glass-card glass-card-hoverable ${isCritical ? 'glass-card-critical' : ''}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  borderTop: `4px solid ${
                    isCritical
                      ? '#ff334b'
                      : inc.severity === 'High'
                      ? '#f97316'
                      : inc.severity === 'Medium'
                      ? '#f59e0b'
                      : '#10b981'
                  }`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div>
                    <span className="badge badge-warning" style={{ fontSize: '0.7rem', marginBottom: '0.35rem', fontFamily: 'var(--font-mono)' }}>
                      {inc.incidentId || 'INC-LOGGED'}
                    </span>
                    <h3
                      onClick={() => setSelectedIncident(inc)}
                      style={{
                        fontSize: '1.18rem',
                        fontWeight: 800,
                        color: '#ffffff',
                        cursor: 'pointer',
                        lineHeight: 1.3,
                      }}
                      title="Click to view details"
                    >
                      {inc.title}
                    </h3>
                  </div>
                  <span className={`badge badge-${inc.severity?.toLowerCase()}`}>
                    {inc.severity}
                  </span>
                </div>

                <div style={{ fontSize: '0.84rem', color: '#818cf8', fontWeight: 700, marginBottom: '0.5rem' }}>
                  Category: {inc.type}
                </div>

                <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', marginBottom: '0.85rem', lineHeight: 1.5 }}>
                  {inc.description}
                </p>

                <div
                  style={{
                    background: 'rgba(11, 18, 34, 0.85)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.75rem 0.95rem',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                    marginBottom: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <Icon name="map-pin" size={14} color="#818cf8" style={{ flexShrink: 0 }} />
                  <span><strong>Location:</strong> {inc.location}</span>
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
                  <span>Reported by: <strong style={{ color: 'var(--text-secondary)' }}>{inc.reporterName || 'Anonymous Student'}</strong></span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span
                      className="badge"
                      style={{
                        background:
                          inc.status === 'Resolved'
                            ? 'rgba(16, 185, 129, 0.2)'
                            : inc.status === 'Under Review'
                            ? 'rgba(99, 102, 241, 0.2)'
                            : 'rgba(245, 158, 11, 0.2)',
                        color:
                          inc.status === 'Resolved'
                            ? '#34d399'
                            : inc.status === 'Under Review'
                            ? '#818cf8'
                            : '#fbbf24',
                        border: '1px solid currentColor',
                        fontSize: '0.68rem',
                      }}
                    >
                      {inc.status || 'Pending'}
                    </span>
                    <button
                      onClick={() => setSelectedIncident(inc)}
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem' }}
                    >
                      <span>View</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Incident Detail Modal */}
      <IncidentDetailModal
        isOpen={!!selectedIncident}
        onClose={() => setSelectedIncident(null)}
        incident={selectedIncident}
        onStatusUpdated={handleStatusUpdated}
      />
    </div>
  );
};

export default IncidentReportsPage;
