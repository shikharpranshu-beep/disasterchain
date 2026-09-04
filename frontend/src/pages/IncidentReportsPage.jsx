import React, { useState, useEffect, useMemo } from 'react';
import { fetchIncidents } from '../services/api';
import IncidentDetailModal from '../components/IncidentDetailModal';
import Icon from '../components/Icons';
import { useTranslation } from '../i18n/i18n';

const IncidentReportsPage = ({ onOpenIncident }) => {
  const { t } = useTranslation();
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
      console.error('Error loading incidents:', err);
      setError('Unable to load incident reports from backend server.');
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
      if (filterType !== 'ALL' && inc.type?.toLowerCase() !== filterType.toLowerCase()) return false;
      if (filterSeverity !== 'ALL' && inc.severity?.toLowerCase() !== filterSeverity.toLowerCase()) return false;
      if (filterStatus !== 'ALL' && (inc.status || 'Pending').toLowerCase() !== filterStatus.toLowerCase()) return false;

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

  // Derived telemetry metrics
  const pendingCount = useMemo(() => incidents.filter((i) => i.status === 'Pending').length, [incidents]);
  const underReviewCount = useMemo(() => incidents.filter((i) => i.status === 'Under Review' || i.status === 'Assigned').length, [incidents]);
  const resolvedCount = useMemo(() => incidents.filter((i) => i.status === 'Resolved').length, [incidents]);
  const criticalCount = useMemo(() => incidents.filter((i) => i.severity === 'Critical').length, [incidents]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Header Bar */}
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
            <span className="badge badge-warning">{t('dashboard.missionControl')}</span>
            <span className="micro-label" style={{ color: 'var(--amber)' }}>
              {t('incidents.incidentsTitle')}
            </span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.25rem' }}>
            {t('incidents.fieldReports')}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            {t('incidents.incidentsSubtitle')}
          </p>
        </div>

        <button
          onClick={onOpenIncident}
          className="btn btn-primary"
          id="incident-report-new-btn"
        >
          <Icon name="plus" size={16} />
          <span>{t('incidents.reportIncident')}</span>
        </button>
      </div>

      {/* Telemetry KPI Metrics */}
      <div className="grid-cols-4">
        <div className="telemetry-widget">
          <span className="micro-label">{t('incidents.fieldReports')}</span>
          <div className="telemetry-num amber">{incidents.length}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('incidents.recentIncidents')}</div>
        </div>

        <div className="telemetry-widget">
          <span className="micro-label">{t('common.critical')}</span>
          <div className="telemetry-num crimson">{criticalCount}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('common.critical')}</div>
        </div>

        <div className="telemetry-widget">
          <span className="micro-label">{t('common.pending')}</span>
          <div className="telemetry-num cyan">{pendingCount + underReviewCount}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('common.pending')}</div>
        </div>

        <div className="telemetry-widget">
          <span className="micro-label">{t('common.resolved')}</span>
          <div className="telemetry-num mint">{resolvedCount}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('common.resolved')}</div>
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
          placeholder={t('incidents.searchIncidents')}
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
            <option value="ALL">{t('incidents.filterStatus')}</option>
            <option value="Pending">{t('common.pending')}</option>
            <option value="Under Review">{t('incidents.verificationStatus')}</option>
            <option value="Resolved">{t('common.resolved')}</option>
          </select>

          <select
            className="form-select"
            style={{ width: 'auto', padding: '0.45rem 0.85rem', fontSize: '0.82rem' }}
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
          >
            <option value="ALL">{t('alerts.allSeverities')}</option>
            <option value="Critical">{t('common.critical')}</option>
            <option value="High">{t('common.high')}</option>
            <option value="Medium">{t('common.medium')}</option>
            <option value="Low">{t('common.low')}</option>
          </select>
        </div>
      </div>

      {/* Loading / Error / Empty States */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '3.5rem 0', color: 'var(--text-muted)' }}>
          <div className="live-beacon-pulse" style={{ width: 22, height: 22, margin: '0 auto 1rem' }} />
          <span>{t('common.syncing')}</span>
        </div>
      )}

      {error && !loading && (
        <div style={{ padding: '1rem', background: 'rgba(255, 46, 77, 0.1)', border: '1px solid var(--border-red)', borderRadius: 'var(--radius-sm)', color: '#ff8597', textAlign: 'center' }}>
          {error}
        </div>
      )}

      {!loading && !error && filteredIncidents.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#ffffff' }}>{t('incidents.noIncidents')}</div>
        </div>
      )}

      {/* Incident Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
        {filteredIncidents.map((inc) => (
          <div
            key={inc._id}
            className="spatial-panel spatial-panel-hoverable"
            style={{
              padding: '1.35rem',
              background: 'rgba(11, 17, 30, 0.88)',
              borderLeft: `4px solid ${inc.severity === 'Critical' ? 'var(--crimson)' : 'var(--amber)'}`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span className={`badge ${inc.severity === 'Critical' ? 'badge-critical' : 'badge-warning'}`}>
                  {inc.severity}
                </span>
                <span className="micro-label" style={{ color: 'var(--cyan)' }}>
                  {inc.status || t('common.pending')}
                </span>
              </div>

              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#ffffff', marginBottom: '0.35rem' }}>
                {inc.title}
              </div>

              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.85rem', lineHeight: 1.4 }}>
                {inc.description}
              </div>

              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.65rem 0.85rem',
                  marginBottom: '1rem',
                  fontSize: '0.78rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.3rem',
                }}
              >
                <div>📍 {t('alerts.sector')}: <span style={{ color: 'var(--text-primary)' }}>{inc.location}</span></div>
                <div>🏷️ {t('incidents.incidentType')}: <span style={{ color: 'var(--cyan)' }}>{inc.type}</span></div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  ID: {inc.incidentId || inc._id} • {new Date(inc.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedIncident(inc)}
              className="btn btn-secondary btn-sm"
              style={{ width: '100%' }}
            >
              {t('common.viewDetails')} →
            </button>
          </div>
        ))}
      </div>

      {/* Incident Detail Modal */}
      {selectedIncident && (
        <IncidentDetailModal
          isOpen={Boolean(selectedIncident)}
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
          onStatusUpdated={handleStatusUpdated}
        />
      )}
    </div>
  );
};

export default IncidentReportsPage;
