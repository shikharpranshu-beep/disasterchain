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
      <div className="page-header">
        <div>
          <h1 className="page-header-title">
            <Icon name="user" size={26} color="var(--accent-indigo)" />
            <span>User Account & Security Profile</span>
          </h1>
          <p className="page-header-subtitle">
            Manage your verified credentials, active distress broadcasts, and reported hazard tickets
          </p>
        </div>
      </div>

      {/* Main 2-Column Grid */}
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
          <div style={{ textAlign: 'center', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)' }}>
            <div
              style={{
                width: '76px',
                height: '76px',
                borderRadius: '50%',
                background: isAdmin ? 'linear-gradient(135deg, #6366f1, #a855f7)' : 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.1rem',
                fontWeight: 800,
                color: '#ffffff',
                marginBottom: '0.85rem',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
              }}
            >
              {user?.name?.charAt(0) || 'U'}
            </div>

            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff', margin: '0 0 0.25rem' }}>
              {user?.name || 'Citizen'}
            </h2>

            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.85rem' }}>
              {user?.email}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <span className={`badge ${isVerified ? 'badge-success' : 'badge-warning'}`}>
                {isVerified ? 'Verified Account' : 'Unverified'}
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
                {user?._id?.substring(0, 14)}...
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>Account Role</span>
              <strong style={{ color: '#ffffff', textTransform: 'capitalize' }}>
                {user?.role || 'Citizen'}
              </strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>Distress Signals</span>
              <strong style={{ color: '#ff6b7e' }}>{sosList.length} Broadcast(s)</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>Hazard Reports</span>
              <strong style={{ color: '#818cf8' }}>{incidents.length} Ticket(s)</strong>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '0.5rem' }}>
            {isAdmin && (
              <Link to="/admin" className="btn btn-secondary" style={{ width: '100%', borderColor: 'rgba(99, 102, 241, 0.4)' }}>
                <Icon name="shield" size={16} color="#818cf8" />
                <span>Go to Admin Control Center</span>
              </Link>
            )}

            <button
              onClick={handleLogout}
              className="btn btn-outline"
              style={{ width: '100%', borderColor: 'rgba(255, 51, 75, 0.4)', color: '#ff6b7e' }}
            >
              <Icon name="log-out" size={16} />
              <span>Sign Out of DisasterChain</span>
            </button>
          </div>
        </div>

        {/* Right Column: Interactive Tabs for Activity & Settings */}
        <div className="glass-card">
          {/* Tabs Navigation */}
          <div
            style={{
              display: 'flex',
              gap: '0.75rem',
              borderBottom: '1px solid var(--border-subtle)',
              marginBottom: '1.75rem',
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab('sos')}
              className={`btn ${activeTab === 'sos' ? 'btn-danger' : 'btn-ghost'}`}
              style={{ fontSize: '0.86rem', padding: '0.55rem 1rem' }}
            >
              <Icon name="sos" size={15} />
              <span>My SOS Signals ({sosList.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('incidents')}
              className={`btn ${activeTab === 'incidents' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: '0.86rem', padding: '0.55rem 1rem' }}
            >
              <Icon name="warning" size={15} />
              <span>My Hazard Tickets ({incidents.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`btn ${activeTab === 'settings' ? 'btn-secondary' : 'btn-ghost'}`}
              style={{ fontSize: '0.86rem', padding: '0.55rem 1rem' }}
            >
              <Icon name="user" size={15} />
              <span>Account Settings</span>
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
                  <Icon name="sos" size={32} color="var(--text-muted)" />
                  <div style={{ marginTop: '0.5rem' }}>No SOS distress signals broadcast from this account.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {sosList.map((sos) => (
                    <div
                      key={sos._id}
                      style={{
                        background: 'rgba(11, 18, 34, 0.85)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        padding: '1rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
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
                  <Icon name="warning" size={32} color="var(--text-muted)" />
                  <div style={{ marginTop: '0.5rem' }}>No hazard tickets reported from this account.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {incidents.map((inc) => (
                    <div
                      key={inc._id}
                      style={{
                        background: 'rgba(11, 18, 34, 0.85)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        padding: '1rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
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

                      <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 0.35rem', color: '#ffffff' }}>
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
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', marginBottom: '1.25rem' }}>
                Update Account Information
              </h3>

              {nameSuccess && (
                <div
                  style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    color: '#6ee7b7',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.85rem',
                    marginBottom: '1.25rem',
                  }}
                >
                  ✅ {nameSuccess}
                </div>
              )}

              {nameError && (
                <div
                  style={{
                    background: 'rgba(255, 51, 75, 0.15)',
                    border: '1px solid rgba(255, 51, 75, 0.35)',
                    color: '#ff6b7e',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.85rem',
                    marginBottom: '1.25rem',
                  }}
                >
                  ⚠️ {nameError}
                </div>
              )}

              <form onSubmit={handleUpdateName} style={{ maxWidth: '460px' }}>
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
                  style={{ padding: '0.65rem 1.35rem' }}
                >
                  {savingName ? 'Saving Changes...' : 'Save Profile Changes'}
                </button>
              </form>

              <div style={{ marginTop: '2.25rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-subtle)' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.4rem', color: '#ff6b7e' }}>
                  Password & Security Keys
                </h4>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  To change your password, request a secure verification reset link to your registered email address.
                </p>
                <Link to="/forgot-password" className="btn btn-outline btn-sm">
                  <Icon name="key" size={14} />
                  <span>Change Password via Reset Link</span>
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
