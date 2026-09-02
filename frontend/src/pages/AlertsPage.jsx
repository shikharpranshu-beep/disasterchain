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
      console.error('Error fetching alerts from backend:', err);
      setError('Unable to load emergency alerts from server.');
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
      // Severity filter
      if (filterSeverity !== 'ALL' && a.severity !== filterSeverity) {
        return false;
      }

      // Status filter
      const expired = isAlertExpired(a);
      if (filterStatus === 'ACTIVE' && expired) return false;
      if (filterStatus === 'EXPIRED' && !expired) return false;

      // Search query
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

  // Statistics
  const activeCount = alerts.filter((a) => !isAlertExpired(a)).length;
  const criticalCount = alerts.filter((a) => a.severity === 'Critical' && !isAlertExpired(a)).length;
  const dangerCount = alerts.filter((a) => a.severity === 'Danger' && !isAlertExpired(a)).length;
  const warningCount = alerts.filter((a) => a.severity === 'Warning' && !isAlertExpired(a)).length;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="badge badge-critical" style={{ marginBottom: '0.4rem' }}>
            <span className="pulse-indicator" style={{ width: '7px', height: '7px' }}></span>
            <span>CIVIL DEFENSE &bull; EMERGENCY BROADCAST SYSTEM</span>
          </div>
          <h1 className="page-header-title">
            <Icon name="bell" size={26} color="#ff334b" />
            <span>Emergency Broadcasts & Advisories</span>
          </h1>
          <p className="page-header-subtitle">
            Official emergency warnings, severe weather hazards & real-time campus civil protection broadcasts
          </p>
        </div>
      </div>

      {/* KPI Metric Summary Bar */}
      <div className="grid-cols-4" style={{ marginBottom: '1.75rem' }}>
        <div className="glass-card" style={{ borderLeft: '4px solid #ff334b' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase' }}>
            Active Broadcasts
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff', margin: '0.35rem 0 0.15rem' }}>
            {activeCount}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Live emergency advisories
          </div>
        </div>

        <div className="glass-card" style={{ borderLeft: '4px solid #ff4d63' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase' }}>
            Critical Priority
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ff4d63', margin: '0.35rem 0 0.15rem' }}>
            {criticalCount}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Immediate life-safety threats
          </div>
        </div>

        <div className="glass-card" style={{ borderLeft: '4px solid #f97316' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase' }}>
            Danger Advisories
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fb923c', margin: '0.35rem 0 0.15rem' }}>
            {dangerCount}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Severe localized conditions
          </div>
        </div>

        <div className="glass-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase' }}>
            Weather Warnings
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fbbf24', margin: '0.35rem 0 0.15rem' }}>
            {warningCount}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Preparedness & flood alerts
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="filter-toolbar" style={{ marginBottom: '1.75rem' }}>
        <div className="filter-group">
          <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Severity:</span>
          <select
            className="form-select"
            style={{ width: 'auto', padding: '0.45rem 0.85rem', fontSize: '0.84rem' }}
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
          >
            <option value="ALL">All Severities</option>
            <option value="Critical">🔴 Critical Alerts</option>
            <option value="Danger">🟠 Danger Advisories</option>
            <option value="Warning">🟡 Warnings</option>
            <option value="Information">🔵 Information Notices</option>
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
            <option value="ALL">All Statuses ({alerts.length})</option>
            <option value="ACTIVE">🟢 Active Advisories ({activeCount})</option>
            <option value="EXPIRED">⚪ Expired / Archived</option>
          </select>
        </div>

        <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: '300px' }}>
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.2rem', paddingRight: '0.75rem', fontSize: '0.84rem', height: '36px' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, location, text..."
          />
          <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
            <Icon name="search" size={14} />
          </span>
        </div>

        <div style={{ marginLeft: 'auto', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
          Showing <strong>{filteredAlerts.length}</strong> of <strong>{alerts.length}</strong> broadcasts
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
              border: '3px solid rgba(255, 51, 75, 0.2)',
              borderTopColor: '#ff334b',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem',
            }}
          />
          <div style={{ fontWeight: 700, fontSize: '1rem', color: '#ffffff' }}>Loading Civil Broadcast Feed...</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Synchronizing official emergency bulletins</div>
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
          <button onClick={loadAlerts} className="btn btn-secondary btn-sm" style={{ marginTop: '0.75rem' }}>
            Retry Loading Broadcasts
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredAlerts.length === 0 && (
        <div
          className="glass-card"
          style={{
            textAlign: 'center',
            padding: '3.5rem 1.5rem',
            color: 'var(--text-muted)',
          }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📢</div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.35rem' }}>
            No Broadcasts Match Filter Criteria
          </h3>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 1.25rem' }}>
            {searchQuery || filterSeverity !== 'ALL' || filterStatus !== 'ALL'
              ? 'Try clearing your search query or selecting "All Severities" to view past bulletins.'
              : 'There are currently no emergency alerts logged in the system.'}
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

      {/* Alerts Feed */}
      {!loading && !error && filteredAlerts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredAlerts.map((alert) => {
            const isCritical = alert.severity === 'Critical';
            const isDanger = alert.severity === 'Danger';
            const expired = isAlertExpired(alert);

            return (
              <div
                key={alert._id}
                className={`glass-card glass-card-hoverable ${isCritical && !expired ? 'glass-card-critical' : ''}`}
                style={{
                  opacity: expired ? 0.75 : 1,
                  borderLeft: `4px solid ${
                    expired
                      ? '#64748b'
                      : isCritical
                      ? '#ff334b'
                      : isDanger
                      ? '#f97316'
                      : alert.severity === 'Warning'
                      ? '#f59e0b'
                      : '#38bdf8'
                  }`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.65rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: expired
                          ? 'rgba(100, 116, 139, 0.15)'
                          : isCritical
                          ? 'rgba(255, 51, 75, 0.15)'
                          : isDanger
                          ? 'rgba(249, 115, 22, 0.15)'
                          : 'rgba(245, 158, 11, 0.15)',
                        border: `1px solid ${
                          expired
                            ? '#64748b'
                            : isCritical
                            ? 'rgba(255, 51, 75, 0.4)'
                            : isDanger
                            ? 'rgba(249, 115, 22, 0.4)'
                            : 'rgba(245, 158, 11, 0.4)'
                        }`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Icon
                        name="bell"
                        size={20}
                        color={expired ? '#94a3b8' : isCritical ? '#ff334b' : isDanger ? '#f97316' : '#fbbf24'}
                      />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <h3
                          onClick={() => setSelectedAlert(alert)}
                          style={{
                            fontSize: '1.18rem',
                            fontWeight: 800,
                            color: '#ffffff',
                            cursor: 'pointer',
                            margin: 0,
                          }}
                        >
                          {alert.title}
                        </h3>
                        {expired && (
                          <span className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>
                            EXPIRED
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        Category: <strong style={{ color: 'var(--text-secondary)' }}>{alert.type || 'General Civil Advisory'}</strong>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className={`badge badge-${alert.severity?.toLowerCase()}`}>
                      {alert.severity}
                    </span>
                    <button
                      onClick={() => setSelectedAlert(alert)}
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem' }}
                    >
                      <Icon name="info" size={13} />
                      <span>Details</span>
                    </button>
                  </div>
                </div>

                <p style={{ color: 'var(--text-primary)', fontSize: '0.92rem', margin: '0.65rem 0', lineHeight: 1.6 }}>
                  {alert.message}
                </p>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.78rem',
                    color: 'var(--text-muted)',
                    borderTop: '1px solid var(--border-subtle)',
                    paddingTop: '0.75rem',
                    marginTop: '0.5rem',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Icon name="map-pin" size={13} color="#818cf8" />
                    <span>Affected Sector: <strong style={{ color: 'var(--text-primary)' }}>{alert.location}</strong></span>
                  </span>

                  <div style={{ display: 'flex', gap: '1.25rem' }}>
                    <span>Issued: {new Date(alert.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    {alert.expiresAt && (
                      <span>Expires: {new Date(alert.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Alert Details Modal */}
      <AlertDetailModal
        isOpen={!!selectedAlert}
        onClose={() => setSelectedAlert(null)}
        alert={selectedAlert}
      />
    </div>
  );
};

export default AlertsPage;
