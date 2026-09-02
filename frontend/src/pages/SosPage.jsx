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

  // Inline Quick SOS Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [detectingGps, setDetectingGps] = useState(false);
  const [gpsStatus, setGpsStatus] = useState('');
  const [submittedReceipt, setSubmittedReceipt] = useState(null);

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

  const loadSos = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchSosRequests();
      setSosList(data || []);
    } catch (err) {
      console.error('Error fetching SOS signals from backend:', err);
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
      setFormData((prev) => ({
        ...prev,
        name: user.name,
      }));
    }
  }, [user]);

  // GPS Auto-Detection for inline form
  const handleDetectLocation = () => {
    setDetectingGps(true);
    setGpsStatus('');

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = parseFloat(position.coords.latitude.toFixed(6));
          const lng = parseFloat(position.coords.longitude.toFixed(6));
          const coordsStr = `Lat: ${lat}, Long: ${lng} (GPS Verified \u00B1${Math.round(position.coords.accuracy || 10)}m)`;

          setFormData((prev) => ({
            ...prev,
            location: coordsStr,
            latitude: lat,
            longitude: lng,
          }));
          setDetectingGps(false);
          setGpsStatus('detected');
        },
        () => {
          setDetectingGps(false);
          setGpsStatus('denied');
          setFormData((prev) => ({
            ...prev,
            location: prev.location || 'North Campus, Building 4 (Geofence Default)',
            latitude: 28.6139,
            longitude: 77.2090,
          }));
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
      );
    } else {
      setDetectingGps(false);
      setGpsStatus('error');
    }
  };

  // Handle direct SOS form submission
  const handleInlineSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) return setFormError('Please enter your name.');
    if (!formData.description.trim() || formData.description.trim().length < 5) {
      return setFormError('Please provide a detailed distress description (min 5 characters).');
    }
    if (!formData.location.trim()) return setFormError('Please provide location or detect GPS.');
    if (!formData.contact.trim()) return setFormError('Please provide contact phone number.');

    setFormSubmitting(true);

    try {
      const payload = {
        name: formData.name.trim(),
        emergencyType: formData.emergencyType,
        description: formData.description.trim(),
        location: formData.location.trim(),
        latitude: Number(formData.latitude) || 28.6139,
        longitude: Number(formData.longitude) || 77.2090,
        peopleAffected: Math.max(1, parseInt(formData.peopleAffected) || 1),
        severity: formData.severity,
        contact: formData.contact.trim(),
      };

      const res = await createSosRequest(payload);
      const newSos = res.data || res;

      // Prepend newly created SOS into active list
      setSosList((prev) => [newSos, ...prev]);
      setSubmittedReceipt(newSos);

      // Reset form
      setFormData({
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
    } catch (err) {
      console.error('Error creating SOS signal:', err);
      setFormError(err.response?.data?.message || err.message || 'Failed to submit SOS distress signal.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Filter and search computation
  const filteredList = useMemo(() => {
    return sosList.filter((item) => {
      const matchesSeverity = filterSeverity === 'ALL' || item.severity === filterSeverity;
      const matchesStatus = filterStatus === 'ALL' || item.status === filterStatus;

      if (!matchesSeverity || !matchesStatus) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = item.requestId?.toLowerCase().includes(q);
        const matchesName = item.name?.toLowerCase().includes(q);
        const matchesType = item.emergencyType?.toLowerCase().includes(q);
        const matchesDesc = item.description?.toLowerCase().includes(q);
        const matchesLoc = item.location?.toLowerCase().includes(q);
        if (!matchesId && !matchesName && !matchesType && !matchesDesc && !matchesLoc) {
          return false;
        }
      }

      return true;
    });
  }, [sosList, filterSeverity, filterStatus, searchQuery]);

  // Statistics
  const activeCount = sosList.filter((s) => s.status !== 'Resolved' && s.status !== 'Cancelled').length;
  const criticalCount = sosList.filter((s) => s.severity === 'Critical' && s.status !== 'Resolved').length;
  const highCount = sosList.filter((s) => s.severity === 'High' && s.status !== 'Resolved').length;
  const resolvedCount = sosList.filter((s) => s.status === 'Resolved').length;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="badge badge-critical" style={{ marginBottom: '0.4rem' }}>
            <span className="pulse-indicator" style={{ width: '7px', height: '7px' }}></span>
            <span>LIVE RESCUE DISPATCH QUEUE</span>
          </div>
          <h1 className="page-header-title">
            <Icon name="sos" size={26} color="#ff334b" />
            <span>Emergency SOS Distress Signals</span>
          </h1>
          <p className="page-header-subtitle">
            Real-time distress broadcasts, medical emergency triage & casualty rescue coordination
          </p>
        </div>

        <div className="page-header-actions">
          <button
            onClick={() => {
              if (onOpenSos) onOpenSos();
              else setIsFormOpen(true);
            }}
            className="btn btn-sos"
            id="sos-page-broadcast-btn"
          >
            <Icon name="sos" size={17} color="#ffffff" />
            <span>Broadcast Emergency SOS</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Summary Bar */}
      <div className="grid-cols-4" style={{ marginBottom: '1.75rem' }}>
        <div className="glass-card" style={{ borderLeft: '4px solid #ff334b' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase' }}>
            Active Distress Signals
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff', margin: '0.35rem 0 0.15rem' }}>
            {activeCount}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Awaiting rescue / In progress
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
            Immediate life-safety threat
          </div>
        </div>

        <div className="glass-card" style={{ borderLeft: '4px solid #f97316' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase' }}>
            High Priority
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fb923c', margin: '0.35rem 0 0.15rem' }}>
            {highCount}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Urgent medical / Fire needs
          </div>
        </div>

        <div className="glass-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase' }}>
            Resolved Cases
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#34d399', margin: '0.35rem 0 0.15rem' }}>
            {resolvedCount}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Successfully rescued & safe
          </div>
        </div>
      </div>

      {/* Confirmation Receipt Banner if submitted on this page */}
      {submittedReceipt && (
        <div
          className="glass-card"
          style={{
            borderColor: 'rgba(255, 51, 75, 0.5)',
            background: 'linear-gradient(135deg, rgba(255, 51, 75, 0.15), rgba(15, 24, 44, 0.95))',
            marginBottom: '1.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: 'rgba(255, 51, 75, 0.2)',
                border: '2px solid #ff334b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ff4d63',
                flexShrink: 0,
              }}
            >
              <Icon name="sos" size={24} color="#ff334b" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                <strong style={{ fontSize: '1.05rem', color: '#ffffff' }}>SOS Broadcast Confirmed</strong>
                <span className="badge badge-critical" style={{ fontFamily: 'var(--font-mono)' }}>
                  ID: {submittedReceipt.requestId}
                </span>
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                Type: <strong>{submittedReceipt.emergencyType}</strong> &bull; Location: <strong>{submittedReceipt.location}</strong> &bull; Status: <strong style={{ color: '#fbbf24' }}>{submittedReceipt.status}</strong>
              </div>
            </div>
          </div>

          <button
            onClick={() => setSubmittedReceipt(null)}
            className="btn btn-secondary btn-sm"
          >
            Dismiss Receipt
          </button>
        </div>
      )}

      {/* Filter & Search Toolbar */}
      <div className="filter-toolbar" style={{ marginBottom: '1.5rem' }}>
        <div className="filter-group">
          <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Severity:</span>
          <select
            className="form-select"
            style={{ width: 'auto', padding: '0.45rem 0.85rem', fontSize: '0.84rem' }}
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
          >
            <option value="ALL">All Severities</option>
            <option value="Critical">🔴 Critical</option>
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
            <option value="Pending">Pending Dispatch</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: '300px' }}>
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.2rem', paddingRight: '0.75rem', fontSize: '0.84rem', height: '36px' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID, name, or location..."
          />
          <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
            <Icon name="search" size={14} />
          </span>
        </div>

        <div style={{ marginLeft: 'auto', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
          Showing <strong>{filteredList.length}</strong> of <strong>{sosList.length}</strong> distress signals
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
          <div style={{ fontWeight: 700, fontSize: '1rem', color: '#ffffff' }}>Loading Live SOS Distress Signals...</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Connecting to MongoDB real-time emergency stream</div>
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
          <button onClick={loadSos} className="btn btn-secondary btn-sm" style={{ marginTop: '0.75rem' }}>
            Retry Loading Signals
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredList.length === 0 && (
        <div
          className="glass-card"
          style={{
            textAlign: 'center',
            padding: '3.5rem 1.5rem',
            color: 'var(--text-muted)',
          }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🚨</div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.35rem' }}>
            No Distress Signals Match Filters
          </h3>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 1.25rem' }}>
            {searchQuery || filterSeverity !== 'ALL' || filterStatus !== 'ALL'
              ? 'Try adjusting your severity or status filters to see other active emergencies.'
              : 'There are currently no active SOS distress signals in the database.'}
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

      {/* SOS List Grid */}
      {!loading && !error && filteredList.length > 0 && (
        <div className="grid-cols-2">
          {filteredList.map((sos) => {
            const isCritical = sos.severity === 'Critical';
            const isPending = sos.status === 'Pending';
            const isInProgress = sos.status === 'In Progress';
            const isResolved = sos.status === 'Resolved';

            return (
              <div
                key={sos._id}
                className={`glass-card glass-card-hoverable ${isCritical ? 'glass-card-critical' : ''}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                        {sos.requestId || 'SOS'}
                      </span>
                      <span className={`badge badge-${sos.severity?.toLowerCase()}`}>
                        {sos.severity}
                      </span>
                      {isCritical && isPending && (
                        <span className="pulse-indicator" title="Urgent Dispatch Required"></span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#ff6b7e' }}>
                      {sos.emergencyType}
                    </div>
                  </div>

                  <span
                    className="badge"
                    style={{
                      background: isResolved
                        ? 'rgba(16, 185, 129, 0.2)'
                        : isInProgress
                        ? 'rgba(99, 102, 241, 0.2)'
                        : 'rgba(245, 158, 11, 0.2)',
                      color: isResolved ? '#34d399' : isInProgress ? '#818cf8' : '#fbbf24',
                      border: '1px solid currentColor',
                    }}
                  >
                    {sos.status}
                  </span>
                </div>

                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '0.85rem', lineHeight: 1.5 }}>
                  {sos.description}
                </p>

                <div
                  style={{
                    background: 'rgba(11, 18, 34, 0.85)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.85rem 1rem',
                    fontSize: '0.82rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.45rem',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                    <Icon name="map-pin" size={14} color="#818cf8" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <span>
                      <strong style={{ color: 'var(--text-primary)' }}>Location: </strong>
                      {sos.location}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.2rem' }}>
                    <span>👥 <strong>People affected:</strong> {sos.peopleAffected || 1}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Icon name="phone" size={13} color="#38bdf8" />
                      <strong>Contact: </strong>
                      <a href={`tel:${sos.contact}`} style={{ color: '#38bdf8' }}>{sos.contact}</a>
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: 'auto',
                    paddingTop: '0.85rem',
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                  }}
                >
                  <span>Reported by: <strong style={{ color: 'var(--text-secondary)' }}>{sos.name || 'Anonymous'}</strong></span>
                  <span>{new Date(sos.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SosPage;
