import React, { useState, useEffect, useMemo } from 'react';
import { fetchAlerts } from '../services/api';
import AlertDetailModal from '../components/AlertDetailModal';
import Icon from '../components/Icons';

const AlertsPage = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'EXPIRED'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAlert, setSelectedAlert] = useState(null);

  const loadAlerts = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchAlerts({ activeOnly: 'false' });
      setAlerts(data || []);
    } catch (err) {
      console.error('Error fetching alerts:', err);
      setError('Unable to load emergency broadcasts from backend server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const isAlertExpired = (a) => {
    if (!a.active) return true;
    if (a.expiresAt && new Date(a.expiresAt) < new Date()) return true;
    return false;
  };

  // Filter computation
  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      if (filterSeverity !== 'ALL' && a.severity?.toLowerCase() !== filterSeverity.toLowerCase()) {
        return false;
      }

      const expired = isAlertExpired(a);
      if (filterStatus === 'ACTIVE' && expired) return false;
      if (filterStatus === 'EXPIRED' && !expired) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = a.title?.toLowerCase().includes(q);
        const matchesMessage = a.message?.toLowerCase().includes(q);
        const matchesLocation = a.location?.toLowerCase().includes(q);
        const matchesType = a.type?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesMessage && !matchesLocation && !matchesType) {
          return false;
        }
      }

      return true;
    });
  }, [alerts, filterSeverity, filterStatus, searchQuery]);

  // Telemetry counts
  const activeCount = alerts.filter((a) => !isAlertExpired(a)).length;
  const criticalCount = alerts.filter((a) => (a.severity === 'Critical' || a.severity === 'Danger' || a.severity === 'Emergency') && !isAlertExpired(a)).length;
  const warningCount = alerts.filter((a) => a.severity === 'Warning' && !isAlertExpired(a)).length;
  const advisoryCount = alerts.filter((a) => a.severity === 'Info' || a.severity === 'Advisory' || a.severity === 'General').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Mission Control Header */}
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
            <span className="badge badge-critical">EMERGENCY BROADCAST STREAM</span>
            <span className="micro-label" style={{ color: 'var(--amber)' }}>
              PRIORITY THREAT INTEL
            </span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.25rem' }}>
            Civil Defense Emergency Alerts
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            High-priority operational warnings, severe weather directives & disaster containment advisories.
          </p>
        </div>

        <button
          onClick={loadAlerts}
          className="btn btn-secondary btn-sm"
        >
          <Icon name="refresh-cw" size={14} />
          <span>Sync Feed</span>
        </button>
      </div>

      {/* Telemetry KPI Metrics */}
      <div className="grid-cols-4">
        <div className="telemetry-widget">
          <span className="micro-label">ACTIVE BROADCASTS</span>
          <div className="telemetry-num crimson">{activeCount}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Broadcasting live to all sectors</div>
        </div>

        <div className="telemetry-widget">
          <span className="micro-label">CRITICAL THREATS</span>
          <div className="telemetry-num amber">{criticalCount}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Immediate evacuation / protective action</div>
        </div>

        <div className="telemetry-widget">
          <span className="micro-label">WARNING ADVISORIES</span>
          <div className="telemetry-num cyan">{warningCount}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Hazard caution advised</div>
        </div>

        <div className="telemetry-widget">
          <span className="micro-label">MONITORED BULLETINS</span>
          <div className="telemetry-num mint">{advisoryCount}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>General civil defense notices</div>
        </div>
      </div>

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
          placeholder="Search alerts by title, location, text..."
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
            <option value="ALL">All Broadcasts</option>
            <option value="ACTIVE">Live / Active Only</option>
            <option value="EXPIRED">Historical / Expired</option>
          </select>

          <select
            className="form-select"
            style={{ width: 'auto', padding: '0.45rem 0.85rem', fontSize: '0.82rem' }}
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
          >
            <option value="ALL">All Threat Tiers</option>
            <option value="Critical">Critical Threat</option>
            <option value="Danger">Danger</option>
            <option value="Warning">Warning</option>
            <option value="Info">Informational</option>
          </select>
        </div>
      </div>

      {/* Loading / Error / Empty States */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '3.5rem 0', color: 'var(--text-muted)' }}>
          <div className="live-beacon-pulse" style={{ width: 22, height: 22, margin: '0 auto 1rem' }} />
          <span>Synchronizing active broadcasts from MongoDB Atlas...</span>
        </div>
      )}

      {error && !loading && (
        <div style={{ padding: '1rem', background: 'rgba(255, 46, 77, 0.1)', border: '1px solid var(--border-red)', borderRadius: 'var(--radius-sm)', color: '#ff8597', textAlign: 'center' }}>
          {error}
        </div>
      )}

      {!loading && !error && filteredAlerts.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📡</div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#ffffff' }}>No Emergency Broadcasts Found</div>
          <div style={{ fontSize: '0.82rem' }}>No active emergency alerts match the specified filter criteria.</div>
        </div>
      )}

      {/* High-Priority Emergency Broadcast Feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredAlerts.map((alt) => {
          const isCritical = alt.severity === 'Critical' || alt.severity === 'Danger' || alt.severity === 'Emergency';
          const expired = isAlertExpired(alt);

          return (
            <div
              key={alt._id}
              className={`spatial-panel ${isCritical && !expired ? 'spatial-panel-critical' : 'spatial-panel-hoverable'}`}
              style={{
                padding: '1.5rem',
                borderLeft: `4px solid ${isCritical ? 'var(--crimson)' : 'var(--amber)'}`,
                opacity: expired ? 0.65 : 1,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.65rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <span className={`badge ${isCritical ? 'badge-critical' : 'badge-warning'}`}>
                    {alt.severity?.toUpperCase() || 'ADVISORY'}
                  </span>
                  <span className="micro-label" style={{ color: 'var(--cyan)' }}>
                    TYPE: {alt.type || 'CIVIL PROTECTION'}
                  </span>
                  {expired && (
                    <span className="badge" style={{ background: 'rgba(100, 116, 139, 0.2)', color: 'var(--text-muted)' }}>
                      EXPIRED
                    </span>
                  )}
                </div>

                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  📡 BROADCASTED: {new Date(alt.createdAt).toLocaleString()}
                </div>
              </div>

              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.5rem' }}>
                {alt.title}
              </h2>

              <p style={{ color: 'var(--text-primary)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1rem' }}>
                {alt.message}
              </p>

              {/* Location & Instructions Bar */}
              <div
                style={{
                  background: 'rgba(7, 11, 19, 0.75)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <span>📍 Impact Location:</span>
                  <strong style={{ color: '#ffffff' }}>{alt.location}</strong>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedAlert(alt)}
                  className="btn btn-primary btn-sm"
                >
                  View Full Directives →
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <AlertDetailModal
          isOpen={Boolean(selectedAlert)}
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
        />
      )}
    </div>
  );
};

export default AlertsPage;
