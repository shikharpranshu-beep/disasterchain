import React, { useState, useEffect, useMemo } from 'react';
import { fetchSosRequests, createSosRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/Icons';

const SosPage = ({ onOpenSos, refreshKey }) => {
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
            SOS BEACON
          </span>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
            <span className="badge badge-critical">LIVE DISTRESS GRID</span>
            <span className="micro-label" style={{ color: 'var(--cyan)' }}>
              STATE: {beaconState}
            </span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.85rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.4rem' }}>
            Emergency SOS Dispatch Console
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', maxWidth: '780px' }}>
            Direct satellite and terrestrial distress telemetry for life-threatening situations, trapped individuals, and urgent disaster triage.
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
          <span className="micro-label">ACTIVE DISTRESS</span>
          <div className="telemetry-num crimson">{activeCount}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Signals pending assistance</div>
        </div>

        <div className="telemetry-widget">
          <span className="micro-label">CRITICAL PRIORITY</span>
          <div className="telemetry-num amber">{criticalCount}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Immediate life-safety triage</div>
        </div>

        <div className="telemetry-widget">
          <span className="micro-label">TRIAGE PENDING</span>
          <div className="telemetry-num cyan">{pendingCount}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Awaiting responder dispatch</div>
        </div>

        <div className="telemetry-widget">
          <span className="micro-label">RESOLVED RESCUES</span>
          <div className="telemetry-num mint">{resolvedCount}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Successfully evacuated</div>
        </div>
      </div>

      {/* Fast Dispatch Form Drawer */}
      <div className="spatial-panel" style={{ background: 'rgba(9, 14, 25, 0.92)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <span className="micro-label" style={{ color: 'var(--cyan)' }}>DIRECT SATELLITE DISPATCH</span>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>Transmit Emergency Distress Signal</h3>
          </div>

          <button
            type="button"
            onClick={handleAcquireGps}
            className="btn btn-secondary btn-sm"
          >
            🛰️ {beaconState === 'LOCATING' ? 'Acquiring GPS...' : 'Acquire GPS Position'}
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
              DISTRESS BEACON BROADCAST CONFIRMED
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--cyan)', marginBottom: '0.75rem' }}>
              SIGNAL ID: {dispatchedReceipt.requestId || dispatchedReceipt._id}
            </div>
            <button
              onClick={() => { setBeaconState('READY'); setDispatchedReceipt(null); }}
              className="btn btn-primary btn-sm"
            >
              Reset Dispatch Terminal
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmitBeacon}>
            <div className="grid-cols-3">
              <div className="form-group">
                <label className="form-label">Caller Name</label>
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
                <label className="form-label">Emergency Category</label>
                <select
                  className="form-select"
                  value={formData.emergencyType}
                  onChange={(e) => setFormData({ ...formData, emergencyType: e.target.value })}
                >
                  <option value="Medical Emergency">Medical Emergency</option>
                  <option value="Severe Trauma / Bleeding">Severe Trauma / Bleeding</option>
                  <option value="Fire Hazard / Trapped">Fire Hazard / Trapped</option>
                  <option value="Structural Collapse">Structural Collapse</option>
                  <option value="Water Inundation / Flood">Water Inundation / Flood</option>
                  <option value="Hazardous Gas / Chemical">Hazardous Gas / Chemical</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Severity Level</label>
                <select
                  className="form-select"
                  value={formData.severity}
                  onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                >
                  <option value="Critical">🔴 Critical (Life Threat)</option>
                  <option value="High">🟠 High (Urgent)</option>
                  <option value="Medium">🟡 Medium (Moderate)</option>
                  <option value="Low">🟢 Low (Advisory)</option>
                </select>
              </div>
            </div>

            <div className="grid-cols-2">
              <div className="form-group">
                <label className="form-label">Location / Verified Coordinates</label>
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
                <label className="form-label">Contact Telephone / Radio</label>
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
              <label className="form-label">Distress Description</label>
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
                {beaconState === 'LOCATING' ? 'Transmitting...' : '🚨 Transmit Distress Beacon'}
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
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff' }}>Active Emergency Distress Registry</h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <input
              type="text"
              className="form-input"
              style={{ width: '200px', padding: '0.4rem 0.75rem', fontSize: '0.78rem' }}
              placeholder="Search caller, ID, place..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <select
              className="form-select"
              style={{ width: 'auto', padding: '0.4rem 0.75rem', fontSize: '0.78rem' }}
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
            >
              <option value="ALL">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            <select
              className="form-select"
              style={{ width: 'auto', padding: '0.4rem 0.75rem', fontSize: '0.78rem' }}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
        </div>

        {/* Loading / Error / Empty States */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
            <div className="live-beacon-pulse" style={{ width: 20, height: 20, margin: '0 auto 1rem' }} />
            <span>Loading live SOS distress signals from MongoDB Atlas...</span>
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
            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#ffffff' }}>No Active SOS Distress Signals Found</div>
            <div style={{ fontSize: '0.8rem' }}>No emergency distress calls match the active query parameters.</div>
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
                  {item.status || 'Pending'}
                </span>
              </div>

              <div style={{ fontWeight: 700, fontSize: '0.98rem', color: '#ffffff', marginBottom: '0.35rem' }}>
                {item.emergencyType}
              </div>

              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', lineHeight: 1.4 }}>
                {item.description}
              </div>

              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.65rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <div>📍 Location: <span style={{ color: 'var(--text-primary)' }}>{item.location}</span></div>
                <div>👤 Caller: <span style={{ color: 'var(--text-primary)' }}>{item.name}</span> ({item.contact})</div>
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
