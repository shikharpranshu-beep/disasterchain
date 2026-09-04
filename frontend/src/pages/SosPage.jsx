import React, { useState, useEffect, useMemo } from 'react';
import { fetchSosRequests, createSosRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/Icons';
import { useTranslation } from '../i18n/i18n';

const SosPage = ({ onOpenSos, refreshKey }) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [sosList, setSosList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Beacon activation state
  const [beaconState, setBeaconState] = useState('READY'); // 'READY' | 'LOCATING' | 'CONFIRM' | 'DISPATCHED'
  const [formData, setFormData] = useState({
    name: user?.name || '',
    emergencyType: 'Medical Emergency',
    description: '',
    location: '',
    latitude: 28.6139,
    longitude: 77.2090,
    peopleAffected: 1,
    severity: 'High',
    contact: '',
  });
  const [formError, setFormError] = useState('');
  const [dispatchedReceipt, setDispatchedReceipt] = useState(null);

  const loadSos = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchSosRequests();
      setSosList(data || []);
    } catch (err) {
      console.error('Error fetching SOS signals:', err);
      setError('Unable to fetch live SOS distress signals from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSos();
  }, [refreshKey]);

  useEffect(() => {
    if (user?.name && !formData.name) {
      setFormData((prev) => ({ ...prev, name: user.name }));
    }
  }, [user]);

  const handleAcquireGps = () => {
    setBeaconState('LOCATING');
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = parseFloat(pos.coords.latitude.toFixed(6));
          const lng = parseFloat(pos.coords.longitude.toFixed(6));
          const acc = Math.round(pos.coords.accuracy || 10);
          setFormData((prev) => ({
            ...prev,
            latitude: lat,
            longitude: lng,
            location: `GPS Lat: ${lat}, Long: ${lng} (±${acc}m accuracy)`,
          }));
          setBeaconState('READY');
        },
        () => {
          setBeaconState('READY');
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setBeaconState('READY');
    }
  };

  const handleSubmitBeacon = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) return setFormError('Name or caller identifier required.');
    if (!formData.description.trim() || formData.description.length < 5) {
      return setFormError('Please detail the emergency distress situation (min 5 chars).');
    }
    if (!formData.location.trim()) return setFormError('Please acquire GPS or provide location.');
    if (!formData.contact.trim()) return setFormError('Phone or radio contact required.');

    setBeaconState('LOCATING');

    try {
      const payload = {
        name: formData.name.trim(),
        emergencyType: formData.emergencyType,
        description: formData.description.trim(),
        location: formData.location.trim(),
        latitude: Number(formData.latitude) || 28.6139,
        longitude: Number(formData.longitude) || 77.2090,
        peopleAffected: Number(formData.peopleAffected) || 1,
        severity: formData.severity,
        contact: formData.contact.trim(),
      };

      const result = await createSosRequest(payload);
      if (result) {
        setDispatchedReceipt(result);
        setBeaconState('DISPATCHED');
        loadSos();
      } else {
        throw new Error('Server returned empty response.');
      }
    } catch (err) {
      setBeaconState('READY');
      setFormError(err.message || 'Distress broadcast failed. Check network.');
    }
  };

  // Metrics
  const criticalCount = useMemo(() => sosList.filter((s) => s.severity === 'Critical').length, [sosList]);
  const pendingCount = useMemo(() => sosList.filter((s) => !s.status || s.status === 'Pending').length, [sosList]);
  const activeCount = useMemo(() => sosList.filter((s) => s.status !== 'Resolved' && s.status !== 'Cancelled').length, [sosList]);
  const resolvedCount = useMemo(() => sosList.filter((s) => s.status === 'Resolved').length, [sosList]);

  // Filtered list
  const filteredList = useMemo(() => {
    return sosList.filter((item) => {
      const matchSeverity = filterSeverity === 'ALL' || item.severity?.toLowerCase() === filterSeverity.toLowerCase();
      const matchStatus = filterStatus === 'ALL' || (item.status || 'Pending').toLowerCase() === filterStatus.toLowerCase();
      const matchSearch =
        !searchQuery ||
        item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.emergencyType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.requestId?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchSeverity && matchStatus && matchSearch;
    });
  }, [sosList, filterSeverity, filterStatus, searchQuery]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Banner with Floating Emergency Beacon */}
      <div
        className="spatial-panel spatial-panel-critical"
        style={{
          padding: '1.75rem 2rem',
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          gap: '2rem',
          alignItems: 'center',
        }}
      >
        {/* Giant Interactive Pulsing Beacon Ring */}
        <div
          onClick={handleAcquireGps}
          title="Click to Trigger Satellite GPS Lock"
          style={{
            width: '90px',
            height: '90px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, #ff2e4d 0%, #991b1b 100%)',
            border: '4px solid rgba(255, 46, 77, 0.4)',
            boxShadow: 'var(--glow-crimson)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            animation: 'pulse-ring 2.2s infinite',
            userSelect: 'none',
          }}
        >
          <Icon name="alert-circle" size={36} color="#ffffff" />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', fontWeight: 800, color: '#ffffff', marginTop: 2 }}>
            {t('emergency.emergencySos')}
          </span>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
            <span className="badge badge-critical">{t('emergency.activeDistressCalls')}</span>
            <span className="micro-label" style={{ color: 'var(--cyan)' }}>
              {t('common.status')}: {beaconState}
            </span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.85rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.4rem' }}>
            {t('emergency.emergencySos')}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', maxWidth: '780px' }}>
            {t('emergency.disasterDescription')}
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          div[style*="gridTemplateColumns: auto 1fr"] {
            grid-template-columns: 1fr !important;
            text-align: center;
            justify-items: center;
          }
        }
      `}</style>

      {/* Telemetry Metric Cards */}
      <div className="grid-cols-4">
        <div className="telemetry-widget">
          <span className="micro-label">{t('emergency.activeDistressCalls')}</span>
          <div className="telemetry-num crimson">{activeCount}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('emergency.activeDistressCalls')}</div>
        </div>

        <div className="telemetry-widget">
          <span className="micro-label">{t('common.critical')}</span>
          <div className="telemetry-num amber">{criticalCount}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('common.critical')}</div>
        </div>

        <div className="telemetry-widget">
          <span className="micro-label">{t('common.pending')}</span>
          <div className="telemetry-num cyan">{pendingCount}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('common.pending')}</div>
        </div>

        <div className="telemetry-widget">
          <span className="micro-label">{t('common.resolved')}</span>
          <div className="telemetry-num mint">{resolvedCount}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('common.resolved')}</div>
        </div>
      </div>

      {/* Fast Dispatch Form Drawer */}
      <div className="spatial-panel" style={{ background: 'rgba(9, 14, 25, 0.92)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <span className="micro-label" style={{ color: 'var(--cyan)' }}>{t('emergency.broadcastSos')}</span>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>{t('emergency.broadcastSos')}</h3>
          </div>

          <button
            type="button"
            onClick={handleAcquireGps}
            className="btn btn-secondary btn-sm"
          >
            🛰️ {beaconState === 'LOCATING' ? t('common.loading') : t('emergency.acquireGps')}
          </button>
        </div>

        {formError && (
          <div style={{ padding: '0.65rem 1rem', background: 'rgba(255, 46, 77, 0.15)', border: '1px solid var(--border-red)', borderRadius: 'var(--radius-xs)', color: '#ff8597', fontSize: '0.8rem', marginBottom: '1rem' }}>
            ⚠️ {formError}
          </div>
        )}

        {beaconState === 'DISPATCHED' && dispatchedReceipt ? (
          <div style={{ padding: '1.25rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--border-mint)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.3rem' }}>✅</div>
            <div style={{ fontWeight: 800, color: '#ffffff', fontSize: '1.1rem', marginBottom: '0.25rem' }}>
              {t('emergency.sosSuccess')}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--cyan)', marginBottom: '0.75rem' }}>
              SIGNAL ID: {dispatchedReceipt.requestId || dispatchedReceipt._id}
            </div>
            <button
              onClick={() => { setBeaconState('READY'); setDispatchedReceipt(null); }}
              className="btn btn-primary btn-sm"
            >
              {t('common.refresh')}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmitBeacon}>
            <div className="grid-cols-3">
              <div className="form-group">
                <label className="form-label">{t('auth.name')}</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Full name or team identifier"
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('offline.emergencyCategory')}</label>
                <select
                  className="form-select"
                  value={formData.emergencyType}
                  onChange={(e) => setFormData({ ...formData, emergencyType: e.target.value })}
                >
                  <option value="Medical Emergency">{t('offline.catMedical')}</option>
                  <option value="Severe Trauma / Bleeding">{t('offline.catTrauma')}</option>
                  <option value="Fire Hazard / Trapped">{t('offline.catFire')}</option>
                  <option value="Structural Collapse">{t('offline.catCollapse')}</option>
                  <option value="Water Inundation / Flood">{t('offline.catFlood')}</option>
                  <option value="Hazardous Gas / Chemical">{t('offline.catHazardous')}</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">{t('common.severity')}</label>
                <select
                  className="form-select"
                  value={formData.severity}
                  onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                >
                  <option value="Critical">🔴 {t('common.critical')}</option>
                  <option value="High">🟠 {t('common.high')}</option>
                  <option value="Medium">🟡 {t('common.medium')}</option>
                  <option value="Low">🟢 {t('common.low')}</option>
                </select>
              </div>
            </div>

            <div className="grid-cols-2">
              <div className="form-group">
                <label className="form-label">{t('emergency.currentLocation')}</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. Science Block Wing B Floor 2 or GPS coordinates"
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('offline.hotlineNumber')}</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  placeholder="e.g. +91 98765 43210 or VHF 14"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">{t('incidents.incidentDescription')}</label>
              <textarea
                required
                rows={2}
                className="form-textarea"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Injuries, trapped individuals, water level, or urgent supplies needed..."
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="submit"
                disabled={beaconState === 'LOCATING'}
                className="btn btn-emergency"
              >
                {beaconState === 'LOCATING' ? t('common.loading') : `🚨 ${t('emergency.confirmSos')}`}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Live SOS Distress Records Feed */}
      <div className="spatial-panel" style={{ background: 'rgba(9, 14, 25, 0.94)' }}>
        {/* Feed Header & Filters */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <span className="micro-label" style={{ color: 'var(--crimson)' }}>DATABASE FEED</span>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff' }}>{t('emergency.activeSosSignals')}</h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <input
              type="text"
              className="form-input"
              style={{ width: '200px', padding: '0.4rem 0.75rem', fontSize: '0.78rem' }}
              placeholder={t('common.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <select
              className="form-select"
              style={{ width: 'auto', padding: '0.4rem 0.75rem', fontSize: '0.78rem' }}
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
            >
              <option value="ALL">{t('alerts.allSeverities')}</option>
              <option value="Critical">{t('common.critical')}</option>
              <option value="High">{t('common.high')}</option>
              <option value="Medium">{t('common.medium')}</option>
              <option value="Low">{t('common.low')}</option>
            </select>

            <select
              className="form-select"
              style={{ width: 'auto', padding: '0.4rem 0.75rem', fontSize: '0.78rem' }}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="ALL">{t('common.status')}</option>
              <option value="Pending">{t('common.pending')}</option>
              <option value="Assigned">{t('common.active')}</option>
              <option value="In Progress">{t('common.active')}</option>
              <option value="Resolved">{t('common.resolved')}</option>
            </select>
          </div>
        </div>

        {/* Loading / Error / Empty States */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
            <div className="live-beacon-pulse" style={{ width: 20, height: 20, margin: '0 auto 1rem' }} />
            <span>{t('common.syncing')}</span>
          </div>
        )}

        {error && !loading && (
          <div style={{ padding: '1rem', background: 'rgba(255, 46, 77, 0.1)', border: '1px solid var(--border-red)', borderRadius: 'var(--radius-sm)', color: '#ff8597', textAlign: 'center' }}>
            {error}
          </div>
        )}

        {!loading && !error && filteredList.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🛡️</div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#ffffff' }}>{t('emergency.emergencySos')}</div>
            <div style={{ fontSize: '0.8rem' }}>{t('dashboard.operationalBriefing')}</div>
          </div>
        )}

        {/* Signals Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
          {filteredList.map((item) => (
            <div
              key={item._id}
              className="spatial-panel spatial-panel-hoverable"
              style={{
                padding: '1.15rem',
                borderLeft: `3px solid ${item.severity === 'Critical' ? 'var(--crimson)' : 'var(--amber)'}`,
                background: 'rgba(15, 23, 42, 0.75)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span className={`badge ${item.severity === 'Critical' ? 'badge-critical' : 'badge-warning'}`}>
                  {item.severity}
                </span>
                <span className="micro-label" style={{ color: 'var(--cyan)' }}>
                  {item.status || t('common.pending')}
                </span>
              </div>

              <div style={{ fontWeight: 700, fontSize: '0.98rem', color: '#ffffff', marginBottom: '0.35rem' }}>
                {item.emergencyType}
              </div>

              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', lineHeight: 1.4 }}>
                {item.description}
              </div>

              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.65rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <div>📍 {t('alerts.sector')}: <span style={{ color: 'var(--text-primary)' }}>{item.location}</span></div>
                <div>👤 {t('auth.name')}: <span style={{ color: 'var(--text-primary)' }}>{item.name}</span> ({item.contact})</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--cyan-dim)' }}>
                  ID: {item.requestId || item._id}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SosPage;
