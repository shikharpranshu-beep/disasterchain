import React, { useState, useEffect, useMemo } from 'react';
import { fetchAffectedAreas } from '../services/api';
import DisasterMap from '../components/DisasterMap';
import AreaDetailModal from '../components/AreaDetailModal';
import Icon from '../components/Icons';
import { useTranslation } from '../i18n/i18n';

const AffectedAreasPage = () => {
  const { t } = useTranslation();
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
      setError('Unable to load disaster zone telemetry from backend server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAreas();
  }, []);

  const filteredAreas = useMemo(() => {
    return areas.filter((a) => {
      if (filterSeverity !== 'ALL' && a.severity?.toLowerCase() !== filterSeverity.toLowerCase()) return false;
      if (filterStatus !== 'ALL' && a.status?.toLowerCase() !== filterStatus.toLowerCase()) return false;

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

  // Derived Telemetry
  const totalCasualties = useMemo(() => areas.reduce((acc, a) => acc + (Number(a.affectedPeople) || 0), 0), [areas]);
  const totalActiveSos = useMemo(() => areas.reduce((acc, a) => acc + (Number(a.activeSOS) || 0), 0), [areas]);
  const criticalZones = useMemo(() => areas.filter((a) => a.severity === 'Critical').length, [areas]);
  const activeSectorsCount = useMemo(() => areas.filter((a) => a.status === 'Active').length, [areas]);

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
            <span className="badge badge-warning">{t('affectedAreas.areasTitle')}</span>
            <span className="micro-label" style={{ color: 'var(--amber)' }}>
              {t('dashboard.monitoredZones')}
            </span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.25rem' }}>
            {t('affectedAreas.areasTitle')}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            {t('affectedAreas.areasSubtitle')}
          </p>
        </div>

        <button
          onClick={loadAreas}
          className="btn btn-secondary btn-sm"
        >
          <Icon name="refresh-cw" size={14} />
          <span>{t('common.refresh')}</span>
        </button>
      </div>

      {/* Telemetry KPI Metrics */}
      <div className="grid-cols-4">
        <div className="telemetry-widget">
          <span className="micro-label">{t('affectedAreas.monitoredZones')}</span>
          <div className="telemetry-num amber">{areas.length}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{activeSectorsCount} {t('common.active')}</div>
        </div>

        <div className="telemetry-widget">
          <span className="micro-label">{t('common.critical')}</span>
          <div className="telemetry-num crimson">{criticalZones}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('affectedAreas.evacuationMandatory')}</div>
        </div>

        <div className="telemetry-widget">
          <span className="micro-label">{t('affectedAreas.affectedPeople')}</span>
          <div className="telemetry-num cyan">{totalCasualties.toLocaleString()}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('affectedAreas.affectedPeople')}</div>
        </div>

        <div className="telemetry-widget">
          <span className="micro-label">{t('emergency.emergencySos')}</span>
          <div className="telemetry-num mint">{totalActiveSos}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('emergency.activeDistressCalls')}</div>
        </div>
      </div>

      {/* Embedded Geospatial Map */}
      <div className="spatial-panel" style={{ padding: '0.5rem', background: 'rgba(9, 14, 25, 0.94)' }}>
        <DisasterMap
          height="460px"
          initialFilter="AREAS"
          showToolbar={true}
          showLegend={true}
        />
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
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="ALL">{t('common.all')}</option>
            <option value="Active">{t('common.active')}</option>
            <option value="Monitoring">{t('dashboard.systemStatus')}</option>
            <option value="Contained">{t('common.resolved')}</option>
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

      {!loading && !error && filteredAreas.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚠️</div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#ffffff' }}>{t('affectedAreas.monitoredZones')}</div>
        </div>
      )}

      {/* Spatial Hazard Area Cards Grid */}
      <div className="responsive-card-grid">
        {filteredAreas.map((area) => (
          <div
            key={area._id}
            className="spatial-panel spatial-panel-hoverable"
            style={{
              padding: '1.35rem',
              background: 'rgba(11, 17, 30, 0.88)',
              borderLeft: `4px solid ${area.severity === 'Critical' ? 'var(--crimson)' : 'var(--amber)'}`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span className={`badge ${area.severity === 'Critical' ? 'badge-critical' : 'badge-warning'}`}>
                  {area.severity?.toUpperCase()} {t('common.severity')}
                </span>
                <span className="micro-label" style={{ color: 'var(--cyan)' }}>
                  {area.status || t('common.active')}
                </span>
              </div>

              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#ffffff', marginBottom: '0.35rem' }}>
                {area.name}
              </div>

              <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '0.85rem', lineHeight: 1.4 }}>
                {area.description || `Active ${area.disasterType} impact perimeter.`}
              </div>

              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.65rem 0.85rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div className="micro-label">{t('affectedAreas.affectedPeople')}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: '#ffffff', fontSize: '1.05rem' }}>
                    {(Number(area.affectedPeople) || 0).toLocaleString()}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="micro-label">{t('emergency.emergencySos')}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--crimson)', fontSize: '1.05rem' }}>
                    {area.activeSOS || 0}
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedArea(area)}
              className="btn btn-secondary btn-sm"
              style={{ width: '100%' }}
            >
              {t('affectedAreas.inspectZone')} →
            </button>
          </div>
        ))}
      </div>

      {/* Area Detail Modal */}
      {selectedArea && (
        <AreaDetailModal
          isOpen={Boolean(selectedArea)}
          area={selectedArea}
          onClose={() => setSelectedArea(null)}
        />
      )}
    </div>
  );
};

export default AffectedAreasPage;
