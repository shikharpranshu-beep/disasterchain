import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchSosRequests, fetchIncidents, updateUserProfile } from '../services/api';
import Icon from '../components/Icons';

const ProfilePage = () => {
  const { user, logout, isAdmin, isVerified, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [sosList, setSosList] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [activeTab, setActiveTab] = useState('sos'); // 'sos' | 'incidents' | 'settings'

  const [editName, setEditName] = useState(user?.name || '');
  const [savingName, setSavingName] = useState(false);
  const [nameSuccess, setNameSuccess] = useState('');
  const [nameError, setNameError] = useState('');

  useEffect(() => {
    if (user?.name) {
      setEditName(user.name);
    }
  }, [user]);

  useEffect(() => {
    const loadUserActivity = async () => {
      setLoadingActivity(true);
      try {
        const [allSos, allInc] = await Promise.all([
          fetchSosRequests(),
          fetchIncidents(),
        ]);

        const userId = user?._id?.toString();
        const userName = user?.name?.toLowerCase().trim();

        const userSos = (allSos || []).filter(
          (s) => (userId && (s.reportedBy === userId || s.reportedBy?._id?.toString() === userId)) ||
                 (userName && s.name?.toLowerCase().trim() === userName)
        );
        const userInc = (allInc || []).filter(
          (i) => (userId && (i.reportedBy === userId || i.reportedBy?._id?.toString() === userId)) ||
                 (userName && i.reporterName?.toLowerCase().trim() === userName)
        );

        setSosList(userSos.slice(0, 5));
        setIncidents(userInc.slice(0, 5));
      } catch (err) {
        console.error('Error loading profile activity:', err);
      } finally {
        setLoadingActivity(false);
      }
    };

    loadUserActivity();
  }, [user]);

  const handleUpdateName = async (e) => {
    e.preventDefault();
    if (!editName.trim()) return;

    setSavingName(true);
    setNameSuccess('');
    setNameError('');

    try {
      await updateUserProfile(editName.trim());
      if (refreshUser) await refreshUser();
      setNameSuccess('Dossier name updated successfully.');
    } catch (err) {
      setNameError(err.response?.data?.message || 'Failed to update personnel name.');
    } finally {
      setSavingName(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

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
            <span className="badge badge-info">PERSONNEL DOSSIER</span>
            <span className="micro-label" style={{ color: 'var(--cyan)' }}>
              IDENTITY & ROLE CLEARANCE
            </span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.25rem' }}>
            Operator Identity & Security Clearance
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Verified credentials, operational activity history, and authentication parameters.
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="btn btn-secondary btn-sm"
          style={{ borderColor: 'var(--border-red)', color: '#ff8597' }}
        >
          <Icon name="logout" size={14} />
          <span>Sign Out of Grid</span>
        </button>
      </div>

      {/* Main 2-Column Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '1.5rem', alignItems: 'flex-start' }}>
        {/* Left Column: Personnel Identity Card */}
        <div className="spatial-panel" style={{ padding: '1.75rem', background: 'rgba(11, 17, 30, 0.92)' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--cyan-dim), var(--violet-dim))',
                border: '2px solid var(--cyan)',
                boxShadow: 'var(--glow-cyan)',
                margin: '0 auto 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.75rem',
                color: '#ffffff',
                fontWeight: 800,
              }}
            >
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.25rem' }}>
              {user?.name || 'Authorized Operator'}
            </h3>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)', marginBottom: '0.65rem' }}>
              {user?.email || 'N/A'}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
              <span className="badge badge-info" style={{ textTransform: 'uppercase' }}>
                ROLE: {user?.role || 'CITIZEN'}
              </span>
              {isVerified ? (
                <span className="badge badge-success">✓ EMAIL VERIFIED</span>
              ) : (
                <span className="badge badge-warning">UNVERIFIED</span>
              )}
            </div>
          </div>

          <div
            style={{
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              fontSize: '0.8rem',
              marginBottom: '1.5rem',
            }}
          >
            <div>
              <span style={{ color: 'var(--text-muted)' }}>OPERATOR ID: </span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--cyan)' }}>{user?._id}</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>ENROLLED: </span>
              <span style={{ color: 'var(--text-primary)' }}>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Active'}</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>CLEARANCE LEVEL: </span>
              <span style={{ color: isAdmin ? 'var(--crimson)' : 'var(--mint)', fontWeight: 700 }}>
                {isAdmin ? 'LEVEL 5 — FULL SYSTEM ADMIN' : 'LEVEL 1 — CIVIL DEFENSE'}
              </span>
            </div>
          </div>

          {isAdmin && (
            <Link
              to="/admin"
              className="btn btn-primary"
              style={{ width: '100%', textAlign: 'center' }}
            >
              Launch Admin Command Center →
            </Link>
          )}
        </div>

        {/* Right Column: Profile Management & History */}
        <div className="spatial-panel" style={{ padding: '1.75rem', background: 'rgba(11, 17, 30, 0.92)' }}>
          {/* Tabs Header */}
          <div style={{ display: 'flex', gap: '0.65rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem', marginBottom: '1.5rem' }}>
            <button
              type="button"
              onClick={() => setActiveTab('sos')}
              className={`btn ${activeTab === 'sos' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            >
              My SOS Distresses ({sosList.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('incidents')}
              className={`btn ${activeTab === 'incidents' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            >
              My Hazard Reports ({incidents.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`btn ${activeTab === 'settings' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            >
              Dossier Settings
            </button>
          </div>

          {/* Tab 1: SOS Activity */}
          {activeTab === 'sos' && (
            <div>
              {loadingActivity ? (
                <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>
                  Loading distress activity...
                </div>
              ) : sosList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🛡️</div>
                  <div style={{ fontWeight: 700, color: '#ffffff' }}>No Active SOS Signals Registered</div>
                  <div style={{ fontSize: '0.8rem' }}>You have not broadcasted any emergency distress calls.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {sosList.map((sos) => (
                    <div
                      key={sos._id}
                      style={{
                        padding: '1rem',
                        background: 'rgba(15, 23, 42, 0.7)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 800, color: '#ffffff', fontSize: '0.92rem' }}>
                          {sos.emergencyType}
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                          📍 {sos.location} • {new Date(sos.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <span className={`badge ${sos.severity === 'Critical' ? 'badge-critical' : 'badge-warning'}`}>
                        {sos.status || 'Pending'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Incidents Activity */}
          {activeTab === 'incidents' && (
            <div>
              {loadingActivity ? (
                <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>
                  Loading incident activity...
                </div>
              ) : incidents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📋</div>
                  <div style={{ fontWeight: 700, color: '#ffffff' }}>No Hazard Tickets Filed</div>
                  <div style={{ fontSize: '0.8rem' }}>You have not submitted any campus hazard reports.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {incidents.map((inc) => (
                    <div
                      key={inc._id}
                      style={{
                        padding: '1rem',
                        background: 'rgba(15, 23, 42, 0.7)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 800, color: '#ffffff', fontSize: '0.92rem' }}>
                          {inc.title}
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                          📍 {inc.location} • {new Date(inc.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <span className="badge badge-info">
                        {inc.status || 'Pending'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Settings Form */}
          {activeTab === 'settings' && (
            <form onSubmit={handleUpdateName} style={{ maxWidth: '420px' }}>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#ffffff', marginBottom: '0.75rem' }}>
                Update Personnel Dossier Details
              </div>

              {nameSuccess && (
                <div style={{ padding: '0.65rem 1rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--border-mint)', borderRadius: 'var(--radius-xs)', color: 'var(--mint)', fontSize: '0.8rem', marginBottom: '1rem' }}>
                  ✓ {nameSuccess}
                </div>
              )}

              {nameError && (
                <div style={{ padding: '0.65rem 1rem', background: 'rgba(255, 46, 77, 0.15)', border: '1px solid var(--border-red)', borderRadius: 'var(--radius-xs)', color: '#ff8597', fontSize: '0.8rem', marginBottom: '1rem' }}>
                  ⚠️ {nameError}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Full Operator Name</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Registered Email (Read-Only)</label>
                <input
                  type="email"
                  disabled
                  className="form-input"
                  value={user?.email || ''}
                  style={{ opacity: 0.6, cursor: 'not-allowed' }}
                />
              </div>

              <button
                type="submit"
                disabled={savingName}
                className="btn btn-primary"
                style={{ marginTop: '0.5rem' }}
              >
                {savingName ? 'Saving...' : 'Save Dossier Changes'}
              </button>
            </form>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 960px) {
          div[style*="gridTemplateColumns: 360px 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ProfilePage;
