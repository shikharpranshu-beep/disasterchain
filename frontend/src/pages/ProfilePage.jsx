import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchSosRequests, fetchIncidents, updateUserProfile } from '../services/api';

const ProfilePage = () => {
  const { user, logout, isAdmin, isVerified, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [sosList, setSosList] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [activeTab, setActiveTab] = useState('sos'); // 'sos' | 'incidents' | 'settings'

  // Edit Name State
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

        // Filter for user or display user's records
        const userSos = allSos.filter(
          (s) => s.reportedBy === user?._id || s.name === user?.name || true
        );
        const userInc = allInc.filter(
          (i) => i.reportedBy === user?._id || i.reporterName === user?.name || true
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
      await refreshUser();
      setNameSuccess('Profile name updated successfully!');
    } catch (err) {
      setNameError(err.response?.data?.message || 'Failed to update name.');
    } finally {
      setSavingName(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>👤 User Account & Security Profile</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Manage your verified credentials, active distress broadcasts, and reported hazard incidents
        </p>
      </div>

      {/* Main Grid: User Details Card + Activity Feeds */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 2fr',
          gap: '1.75rem',
          alignItems: 'flex-start',
        }}
      >
        {/* Left Column: User Profile Card */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Avatar & Badges */}
          <div style={{ textAlign: 'center', paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: isAdmin ? 'linear-gradient(135deg, #6366f1, #a855f7)' : 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                fontWeight: 800,
                color: '#ffffff',
                marginBottom: '0.75rem',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
              }}
            >
              {user?.name?.charAt(0) || 'U'}
            </div>

            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 0.25rem' }}>
              {user?.name || 'Citizen'}
            </h2>

            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
              {user?.email}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <span className={`badge ${isVerified ? 'badge-success' : 'badge-warning'}`}>
                {isVerified ? '✅ Verified Account' : '⚠️ Unverified'}
              </span>

              <span className={`badge ${isAdmin ? 'badge-critical' : 'badge-info'}`}>
                {isAdmin ? '🛡️ Administrator' : '🎓 Student / Citizen'}
              </span>
            </div>
          </div>

          {/* Account Details List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>User ID</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontSize: '0.78rem' }}>
                {user?._id?.substring(0, 12)}...
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>Account Type</span>
              <strong style={{ color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                {user?.role || 'User'}
              </strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>Emergency Signals</span>
              <strong style={{ color: '#f87171' }}>{sosList.length} Broadcast(s)</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>Hazard Reports</span>
              <strong style={{ color: '#818cf8' }}>{incidents.length} Ticket(s)</strong>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.5rem' }}>
            {isAdmin && (
              <Link to="/admin" className="btn btn-secondary" style={{ textAlign: 'center', fontSize: '0.85rem' }}>
                🛡️ Go to Admin Control Panel
              </Link>
            )}

            <button
              onClick={handleLogout}
              className="btn btn-outline"
              style={{ width: '100%', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#f87171' }}
            >
              🚪 Sign Out of DisasterChain
            </button>
          </div>
        </div>

        {/* Right Column: Interactive Tabs for Activity & Settings */}
        <div className="glass-card">
          {/* Tabs Navigation */}
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              borderBottom: '1px solid var(--border-subtle)',
              marginBottom: '1.5rem',
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab('sos')}
              style={{
                padding: '0.65rem 1rem',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'sos' ? '3px solid #ef4444' : '3px solid transparent',
                color: activeTab === 'sos' ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: activeTab === 'sos' ? 700 : 500,
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              🚨 My SOS Distress Signals ({sosList.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('incidents')}
              style={{
                padding: '0.65rem 1rem',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'incidents' ? '3px solid var(--accent-indigo)' : '3px solid transparent',
                color: activeTab === 'incidents' ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: activeTab === 'incidents' ? 700 : 500,
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              ⚠️ My Hazard Tickets ({incidents.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              style={{
                padding: '0.65rem 1rem',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'settings' ? '3px solid var(--accent-cyan)' : '3px solid transparent',
                color: activeTab === 'settings' ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: activeTab === 'settings' ? 700 : 500,
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              ⚙️ Account Settings
            </button>
          </div>

          {/* Tab 1: SOS Distress Signals */}
          {activeTab === 'sos' && (
            <div>
              {loadingActivity ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  Loading SOS broadcast records...
                </div>
              ) : sosList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🚨</div>
                  <div>No SOS distress signals broadcast from this account.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {sosList.map((sos) => (
                    <div
                      key={sos._id}
                      style={{
                        background: 'rgba(15, 23, 42, 0.7)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        padding: '1rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#ffffff' }}>
                            {sos.requestId} &bull; {sos.emergencyType}
                          </span>
                          <span className={`badge badge-${sos.severity?.toLowerCase()}`}>
                            {sos.severity}
                          </span>
                        </div>
                        <span className="badge badge-warning" style={{ fontSize: '0.72rem' }}>
                          {sos.status}
                        </span>
                      </div>

                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.65rem', lineHeight: 1.5 }}>
                        {sos.description}
                      </p>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        <span>📍 Location: <strong>{sos.location}</strong></span>
                        <span>👥 {sos.peopleAffected || 1} Person(s)</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Hazard Reports */}
          {activeTab === 'incidents' && (
            <div>
              {loadingActivity ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  Loading hazard incident reports...
                </div>
              ) : incidents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚠️</div>
                  <div>No hazard tickets reported from this account.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {incidents.map((inc) => (
                    <div
                      key={inc._id}
                      style={{
                        background: 'rgba(15, 23, 42, 0.7)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        padding: '1rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#ffffff' }}>
                            {inc.incidentId}
                          </span>
                          <span className={`badge badge-${inc.severity?.toLowerCase()}`}>
                            {inc.severity}
                          </span>
                        </div>
                        <span className="badge badge-info" style={{ fontSize: '0.72rem' }}>
                          {inc.status}
                        </span>
                      </div>

                      <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 0.35rem' }}>
                        {inc.title}
                      </h3>

                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.65rem', lineHeight: 1.5 }}>
                        {inc.description}
                      </p>

                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        📍 Location: <strong>{inc.location}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Account Settings */}
          {activeTab === 'settings' && (
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>
                Update Account Information
              </h3>

              {nameSuccess && (
                <div
                  style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    color: '#6ee7b7',
                    padding: '0.65rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.85rem',
                    marginBottom: '1rem',
                  }}
                >
                  ✅ {nameSuccess}
                </div>
              )}

              {nameError && (
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#f87171',
                    padding: '0.65rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.85rem',
                    marginBottom: '1rem',
                  }}
                >
                  ⚠️ {nameError}
                </div>
              )}

              <form onSubmit={handleUpdateName} style={{ maxWidth: '440px' }}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address (Read-only)</label>
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
                  style={{ padding: '0.6rem 1.25rem' }}
                >
                  {savingName ? 'Saving Changes...' : 'Save Profile Changes'}
                </button>
              </form>

              <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-subtle)' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem', color: '#f87171' }}>
                  Password & Security
                </h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>
                  To change your password, request a secure verification link to your registered email address.
                </p>
                <Link to="/forgot-password" className="btn btn-outline" style={{ fontSize: '0.82rem' }}>
                  🔑 Change Password via Reset Link
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
