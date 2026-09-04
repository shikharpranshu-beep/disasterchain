import React, { useState, useEffect, useMemo } from 'react';
import { fetchResources } from '../services/api';
import ResourceDetailModal from '../components/ResourceDetailModal';
import Icon from '../components/Icons';
import { useTranslation } from '../i18n/i18n';

const EmergencyResourcesPage = () => {
  const { t } = useTranslation();
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
      setError('Unable to load emergency resource directory from backend server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResources();
  }, []);

  const filteredResources = useMemo(() => {
    return resources.filter((r) => {
      if (filterType !== 'ALL' && r.type?.toLowerCase() !== filterType.toLowerCase()) return false;
      if (filterStatus !== 'ALL' && r.status?.toLowerCase() !== filterStatus.toLowerCase()) return false;

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

  // Telemetry KPIs
  const operationalCount = useMemo(() => resources.filter((r) => r.status === 'Operational' || r.status === 'Available').length, [resources]);
  const hospitalCount = useMemo(() => resources.filter((r) => r.type === 'Hospital' || r.type === 'Medical Center').length, [resources]);
  const fireCount = useMemo(() => resources.filter((r) => r.type === 'Fire Station').length, [resources]);
  const reliefHubCount = useMemo(() => resources.filter((r) => r.type === 'Relief Center' || r.type === 'Food Distribution Center').length, [resources]);

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
            <span className="badge badge-info">{t('resources.resourcesTitle')}</span>
            <span className="micro-label" style={{ color: 'var(--cyan)' }}>
              {t('common.verified')}
            </span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.25rem' }}>
            {t('resources.resourcesTitle')}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            {t('resources.resourcesSubtitle')}
          </p>
        </div>

        <button
          onClick={loadResources}
          className="btn btn-secondary btn-sm"
        >
          <Icon name="refresh-cw" size={14} />
          <span>{t('common.refresh')}</span>
        </button>
      </div>

      {/* Telemetry KPI Metrics */}
      <div className="grid-cols-4">
        <div className="telemetry-widget">
          <span className="micro-label">{t('common.operational')}</span>
          <div className="telemetry-num cyan">{operationalCount}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{operationalCount} / {resources.length}</div>
        </div>

        <div className="telemetry-widget">
          <span className="micro-label">{t('offline.ambulance')}</span>
          <div className="telemetry-num crimson">{hospitalCount}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('offline.ambulanceDesc')}</div>
        </div>

        <div className="telemetry-widget">
          <span className="micro-label">{t('offline.fireBrigade')}</span>
          <div className="telemetry-num amber">{fireCount}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('offline.fireBrigadeDesc')}</div>
        </div>

        <div className="telemetry-widget">
          <span className="micro-label">{t('resources.sourceWarehouse')}</span>
          <div className="telemetry-num mint">{reliefHubCount}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('resources.resourcesTitle')}</div>
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
          placeholder={t('common.search')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <select
            className="form-select"
            style={{ width: 'auto', padding: '0.45rem 0.85rem', fontSize: '0.82rem' }}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="ALL">{t('common.all')}</option>
            <option value="Hospital">{t('offline.ambulance')}</option>
            <option value="Fire Station">{t('offline.fireBrigade')}</option>
            <option value="Police Station">{t('offline.nationalEmergency')}</option>
            <option value="Relief Center">{t('resources.sourceWarehouse')}</option>
            <option value="Disaster Management Office">{t('dashboard.missionControl')}</option>
          </select>

          <select
            className="form-select"
            style={{ width: 'auto', padding: '0.45rem 0.85rem', fontSize: '0.82rem' }}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="ALL">{t('common.status')}</option>
            <option value="Operational">{t('common.operational')}</option>
            <option value="Available">{t('shelters.availableSafeHavens')}</option>
            <option value="Limited">{t('common.warning')}</option>
            <option value="Standby">{t('common.pending')}</option>
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

      {!loading && !error && filteredResources.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏥</div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#ffffff' }}>{t('resources.resourcesTitle')}</div>
        </div>
      )}

      {/* Facilities Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
        {filteredResources.map((res) => (
          <div
            key={res._id}
            className="spatial-panel spatial-panel-hoverable"
            style={{
              padding: '1.35rem',
              background: 'rgba(11, 17, 30, 0.88)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span className="badge badge-info">
                  {res.type?.toUpperCase()}
                </span>
                <span className={`micro-label ${res.status === 'Operational' ? 'mint' : 'amber'}`}>
                  ● {res.status || t('common.operational')}
                </span>
              </div>

              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#ffffff', marginBottom: '0.35rem' }}>
                {res.name}
              </div>

              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.85rem' }}>
                📍 {res.address}
              </div>

              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.4 }}>
                {res.description || t('resources.resourcesSubtitle')}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.85rem' }}>
              <a
                href={`tel:${res.phone}`}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.75rem' }}
              >
                📞 {res.phone}
              </a>
              <button
                type="button"
                onClick={() => setSelectedResource(res)}
                className="btn btn-primary btn-sm"
                style={{ fontSize: '0.75rem' }}
              >
                {t('common.viewDetails')}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {selectedResource && (
        <ResourceDetailModal
          isOpen={Boolean(selectedResource)}
          resource={selectedResource}
          onClose={() => setSelectedResource(null)}
        />
      )}
    </div>
  );
};

export default EmergencyResourcesPage;
