import React, { useState, useEffect } from 'react';
import StatCard from '../components/StatCard';
import BlockchainReceiptModal from '../components/BlockchainReceiptModal';
import Icon from '../components/Icons';
import { useTranslation } from '../i18n/i18n';
import {
  fetchSosRequests,
  updateSosStatus,
  fetchShelters,
  createShelter,
  fetchIncidents,
  updateIncidentStatus,
  fetchAlerts,
  createAlert,
  fetchDonations,
  createDonation,
  fetchDistributions,
  fetchBlockchainTransactions,
  fetchAdminUsers,
  updateUserRole,
  adminVerifyUser,
  fetchPasswordRecoveryRequests,
  approvePasswordRecoveryRequest,
  rejectPasswordRecoveryRequest,
} from '../services/api';

const AdminDashboard = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'sos' | 'incidents' | 'shelters' | 'alerts' | 'donations' | 'blockchain' | 'users' | 'recoveries'
  const [sosList, setSosList] = useState([]);
  const [shelters, setShelters] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [donations, setDonations] = useState([]);
  const [distributions, setDistributions] = useState([]);
  const [blockchainRecords, setBlockchainRecords] = useState([]);
  const [users, setUsers] = useState([]);
  const [recoveryRequests, setRecoveryRequests] = useState([]);
  const [recoveryFilter, setRecoveryFilter] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected' | 'completed' | 'expired'
  const [recoveryCodeModal, setRecoveryCodeModal] = useState(null); // { email, code, expiresAt }
  const [rejectionModalTarget, setRejectionModalTarget] = useState(null); // request object
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [approvingRecoveryId, setApprovingRecoveryId] = useState(null);
  const [rejectingRecoveryId, setRejectingRecoveryId] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [confirmVerifyUser, setConfirmVerifyUser] = useState(null);
  const [verifyingUserId, setVerifyingUserId] = useState(null);
  const [userFilter, setUserFilter] = useState('all'); // 'all' | 'pending' | 'verified'
  const [loading, setLoading] = useState(true);

  // Forms
  const [newAlert, setNewAlert] = useState({ title: '', message: '', type: 'Flood', severity: 'Warning', location: '' });
  const [newShelter, setNewShelter] = useState({ name: '', address: '', capacity: 300, phone: '+91 11 2345 0000', facilities: ['Food', 'Water', 'Medical'] });
  const [newDonation, setNewDonation] = useState({ donor: '', type: 'Medical Supplies', resourceName: '', quantity: 500, unit: 'kits', destination: 'Central Shelter' });

  const [actionNotice, setActionNotice] = useState('');

  const loadAll = async () => {
    setLoading(true);
    try {
      const [sos, sh, inc, alt, don, dist, bc, usr, rec] = await Promise.all([
        fetchSosRequests(),
        fetchShelters(),
        fetchIncidents(),
        fetchAlerts(),
        fetchDonations(),
        fetchDistributions(),
        fetchBlockchainTransactions(),
        fetchAdminUsers(),
        fetchPasswordRecoveryRequests().catch(() => []),
      ]);
      setSosList(sos || []);
      setShelters(sh || []);
      setIncidents(inc || []);
      setAlerts(alt || []);
      setDonations(don || []);
      setDistributions(dist || []);
      setBlockchainRecords(bc || []);
      setUsers(usr || []);
      setRecoveryRequests(rec || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRecoveries = async () => {
    try {
      const rec = await fetchPasswordRecoveryRequests();
      setRecoveryRequests(rec || []);
    } catch (err) {
      console.error('Failed to load password recoveries:', err);
    }
  };

  const handleApproveRecovery = async (id) => {
    setApprovingRecoveryId(id);
    try {
      const res = await approvePasswordRecoveryRequest(id);
      if (res.success) {
        setRecoveryCodeModal({
          email: res.data?.email,
          code: res.recoveryCode,
          expiresAt: res.expiresAt,
        });
        setActionNotice(`Recovery request for ${res.data?.email} approved.`);
        await loadRecoveries();
      }
    } catch (err) {
      setActionNotice(err.response?.data?.message || 'Failed to approve recovery request.');
    } finally {
      setApprovingRecoveryId(null);
      setTimeout(() => setActionNotice(''), 4000);
    }
  };

  const handleRejectRecovery = async () => {
    if (!rejectionModalTarget) return;
    setRejectingRecoveryId(rejectionModalTarget._id);
    try {
      const res = await rejectPasswordRecoveryRequest(rejectionModalTarget._id, rejectionReasonInput);
      if (res.success) {
        setActionNotice(`Recovery request for ${rejectionModalTarget.email} rejected.`);
        setRejectionModalTarget(null);
        setRejectionReasonInput('');
        await loadRecoveries();
      }
    } catch (err) {
      setActionNotice(err.response?.data?.message || 'Failed to reject recovery request.');
    } finally {
      setRejectingRecoveryId(null);
      setTimeout(() => setActionNotice(''), 4000);
    }
  };

  const handleCopyCode = (code) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(code);
    }
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 3000);
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Update SOS status
  const handleUpdateSosStatus = async (id, status) => {
    try {
      await updateSosStatus(id, status);
      setActionNotice(`SOS #${id} status updated to ${status}`);
      setSosList((prev) => prev.map((s) => (s._id === id ? { ...s, status } : s)));
    } catch (err) {
      setActionNotice('Failed to update SOS status on server.');
    }
    setTimeout(() => setActionNotice(''), 3000);
  };

  // Update Incident status
  const handleUpdateIncidentStatus = async (id, status) => {
    try {
      await updateIncidentStatus(id, status);
      setActionNotice(`Incident status updated to ${status}`);
      setIncidents((prev) => prev.map((inc) => (inc._id === id ? { ...inc, status } : inc)));
    } catch (err) {
      setActionNotice('Failed to update incident status on server.');
    }
    setTimeout(() => setActionNotice(''), 3000);
  };

  // Update User role
  const handleUpdateRole = async (userId, role) => {
    try {
      await updateUserRole(userId, role);
      setUsers((prev) => prev.map((u) => (u._id === userId ? { ...u, role } : u)));
      setActionNotice(`Updated user role to ${role}`);
    } catch (err) {
      setActionNotice('Failed to update user role on server.');
    }
    setTimeout(() => setActionNotice(''), 3000);
  };

  // Admin Manual User Verification
  const handleVerifyUser = async (userId) => {
    try {
      setVerifyingUserId(userId);
      await adminVerifyUser(userId);
      setActionNotice('User account verified successfully.');
      setUsers((prev) => prev.map((u) => (u._id === userId ? { ...u, isVerified: true } : u)));
      setConfirmVerifyUser(null);
    } catch (err) {
      setActionNotice(err.response?.data?.message || 'Failed to verify user.');
    } finally {
      setVerifyingUserId(null);
    }
    setTimeout(() => setActionNotice(''), 4000);
  };

  // Create Alert
  const handleCreateAlert = async (e) => {
    e.preventDefault();
    try {
      const res = await createAlert(newAlert);
      if (res.data) {
        setAlerts([res.data, ...alerts]);
      }
      setActionNotice('Emergency alert broadcasted successfully!');
      setNewAlert({ title: '', message: '', type: 'Flood', severity: 'Warning', location: '' });
    } catch (err) {
      setActionNotice('Failed to broadcast alert. Check server connection.');
    }
    setTimeout(() => setActionNotice(''), 3000);
  };

  // Create Shelter
  const handleCreateShelter = async (e) => {
    e.preventDefault();
    try {
      const res = await createShelter(newShelter);
      if (res.data) {
        setShelters([res.data, ...shelters]);
      }
      setActionNotice('New shelter added successfully!');
      setNewShelter({ name: '', address: '', capacity: 300, phone: '+91 11 2345 0000', facilities: ['Food', 'Water', 'Medical'] });
    } catch (err) {
      setActionNotice('Failed to add shelter. Check server connection.');
    }
    setTimeout(() => setActionNotice(''), 3000);
  };

  // Record Donation & Mint Blockchain Block
  const handleCreateDonation = async (e) => {
    e.preventDefault();
    try {
      const res = await createDonation(newDonation);
      if (res.data) {
        setDonations([res.data, ...donations]);
      }
      if (res.blockchain) {
        setBlockchainRecords([res.blockchain, ...blockchainRecords]);
      }
      setActionNotice('Donation recorded & cryptographic blockchain block minted!');
      setNewDonation({ donor: '', type: 'Medical Supplies', resourceName: '', quantity: 500, unit: 'kits', destination: 'Central Shelter' });
    } catch (err) {
      setActionNotice('Failed to record donation. Check server connection.');
    }
    setTimeout(() => setActionNotice(''), 3000);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="badge badge-blockchain" style={{ marginBottom: '0.4rem' }}>
            <Icon name="shield" size={13} color="var(--accent-indigo)" />
            <span>{t('dashboard.missionControl', 'DISASTER RESPONSE COMMAND CONSOLE')}</span>
          </div>
          <h1 className="page-header-title">
            <Icon name="admin" size={26} color="var(--accent-indigo)" />
            <span>{t('admin.adminTitle', 'Administrator Management Portal')}</span>
          </h1>
          <p className="page-header-subtitle">
            {t('admin.adminSubtitle', 'Coordinate SOS rescue dispatch, review hazard reports, broadcast emergency alerts & log blockchain relief shipments')}
          </p>
        </div>
      </div>

      {actionNotice && (
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            color: '#34d399',
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            fontWeight: 700,
          }}
        >
          ✅ {actionNotice}
        </div>
      )}

      {/* Admin Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          marginBottom: '1.75rem',
          overflowX: 'auto',
        }}
      >
        {[
          { id: 'overview', label: t('admin.systemHealth', 'System Analytics'), icon: 'activity' },
          { id: 'sos', label: `${t('nav.emergencySos', 'Manage SOS')} (${sosList.length})`, icon: 'sos' },
          { id: 'incidents', label: `${t('nav.incidentReports', 'Review Hazards')} (${incidents.length})`, icon: 'warning' },
          { id: 'shelters', label: `${t('nav.shelters', 'Shelters')} (${shelters.length})`, icon: 'home' },
          { id: 'alerts', label: t('alerts.broadcastAlert', 'Broadcast Alerts'), icon: 'bell' },
          { id: 'donations', label: t('donations.title', 'Log Aid & Donations'), icon: 'box' },
          { id: 'blockchain', label: `${t('transparency.blockchainVerified', 'Blockchain Ledger')} (${blockchainRecords.length})`, icon: 'ledger' },
          { id: 'users', label: `${t('admin.userManagement', 'User Directory')} (${users.length})`, icon: 'user' },
          { id: 'recoveries', label: `Password Recovery (${recoveryRequests.filter((r) => r.status === 'pending').length})`, icon: 'key' },
        ].map((tab) => {
          const isTabActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`btn ${isTabActive ? 'btn-primary' : 'btn-ghost'}`}
              style={{
                padding: '0.65rem 1rem',
                fontSize: '0.86rem',
                whiteSpace: 'nowrap',
              }}
            >
              <Icon name={tab.icon} size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. OVERVIEW & ANALYTICS CHARTS */}
      {activeTab === 'overview' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
            <StatCard
              title={t('emergency.activeCrisis', 'Total SOS Distress')}
              value={sosList.length}
              subtitle={`${sosList.filter((s) => s.status === 'Pending').length} Pending Dispatch`}
              icon="sos"
              color="red"
            />
            <StatCard
              title={t('incidents.fieldReports', 'Hazard Tickets')}
              value={incidents.length}
              subtitle={`${incidents.filter((i) => i.status === 'Pending').length} Pending Inspection`}
              icon="warning"
              color="amber"
            />
            <StatCard
              title={t('shelters.capacity', 'Shelter Capacity')}
              value={`${shelters.reduce((a, s) => a + (s.occupancy || 0), 0)} / ${shelters.reduce((a, s) => a + (s.capacity || 0), 0)}`}
              subtitle={`${shelters.length} Total Registered Shelters`}
              icon="home"
              color="cyan"
            />
            <StatCard
              title={t('transparency.blockchainVerified', 'Blockchain Blocks')}
              value={blockchainRecords.length}
              subtitle="100% Cryptographic Verification"
              icon="blockchain"
              color="indigo"
            />
            <div
              onClick={() => {
                setActiveTab('users');
                setUserFilter('pending');
              }}
              style={{ cursor: 'pointer' }}
              title="Click to view and approve pending users"
            >
              <StatCard
                title={t('admin.pendingVerifications', 'Pending Verifications')}
                value={users.filter((u) => !u.isVerified).length}
                subtitle={`${users.filter((u) => !u.isVerified).length} Awaiting Approval →`}
                icon="user"
                color={users.filter((u) => !u.isVerified).length > 0 ? 'amber' : 'mint'}
              />
            </div>
            <div
              onClick={() => {
                setActiveTab('recoveries');
                setRecoveryFilter('pending');
              }}
              style={{ cursor: 'pointer' }}
              title="Click to review pending password recoveries"
            >
              <StatCard
                title="Recovery Requests"
                value={recoveryRequests.filter((r) => r.status === 'pending').length}
                subtitle={`${recoveryRequests.filter((r) => r.status === 'pending').length} Awaiting Verification →`}
                icon="key"
                color={recoveryRequests.filter((r) => r.status === 'pending').length > 0 ? 'amber' : 'mint'}
              />
            </div>
          </div>

          {/* Visual Analytics Charts */}
          <div className="grid-cols-2" style={{ marginBottom: '1.75rem' }}>
            {/* SOS by Severity Breakdown */}
            <div className="glass-card">
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1.15rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Icon name="sos" size={18} color="#ff334b" />
                <span>SOS Requests by Severity Breakdown</span>
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {['Critical', 'High', 'Medium', 'Low'].map((sev) => {
                  const count = sosList.filter((s) => s.severity === sev).length;
                  const pct = Math.round((count / (sosList.length || 1)) * 100);
                  const color = sev === 'Critical' ? '#ff334b' : sev === 'High' ? '#f97316' : sev === 'Medium' ? '#f59e0b' : '#10b981';

                  return (
                    <div key={sev}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                        <span style={{ color: '#ffffff', fontWeight: 600 }}>{sev} Severity</span>
                        <strong style={{ color }}>{count} ({pct}%)</strong>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Shelter Occupancy Distribution */}
            <div className="glass-card">
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1.15rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Icon name="home" size={18} color="#10b981" />
                <span>Shelter Occupancy Status</span>
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {shelters.map((sh) => {
                  const pct = Math.min(100, Math.round(((sh.occupancy || 0) / (sh.capacity || 1)) * 100));
                  return (
                    <div key={sh._id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                        <span style={{ color: '#ffffff', fontWeight: 600 }}>{sh.name}</span>
                        <strong style={{ color: pct >= 100 ? '#ff6b7e' : '#34d399' }}>{sh.occupancy} / {sh.capacity} ({pct}%)</strong>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: pct >= 100 ? '#ff334b' : 'linear-gradient(90deg, #10b981, #06b6d4)' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. SOS MANAGEMENT */}
      {activeTab === 'sos' && (
        <div className="data-table-container glass-card" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Type & Severity</th>
                <th>Location</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Change Status</th>
              </tr>
            </thead>
            <tbody>
              {sosList.map((sos) => (
                <tr key={sos._id}>
                  <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#ffffff' }}>{sos.requestId}</td>
                  <td>
                    <strong style={{ color: '#ffffff' }}>{sos.emergencyType}</strong>
                    <div><span className={`badge badge-${sos.severity?.toLowerCase()}`}>{sos.severity}</span></div>
                  </td>
                  <td>{sos.location}</td>
                  <td>{sos.contact}</td>
                  <td>
                    <span className="badge badge-warning">{sos.status}</span>
                  </td>
                  <td>
                    <select
                      className="form-select"
                      style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', width: 'auto' }}
                      value={sos.status}
                      onChange={(e) => handleUpdateSosStatus(sos._id, e.target.value)}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Assigned">Assigned</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 3. INCIDENT MANAGEMENT */}
      {activeTab === 'incidents' && (
        <div className="data-table-container glass-card" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title & Category</th>
                <th>Location</th>
                <th>Reporter</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {incidents.map((inc) => (
                <tr key={inc._id}>
                  <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#ffffff' }}>{inc.incidentId}</td>
                  <td>
                    <strong style={{ color: '#ffffff' }}>{inc.title}</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{inc.type}</div>
                  </td>
                  <td>{inc.location}</td>
                  <td>{inc.reporterName || 'Student'}</td>
                  <td>
                    <span className="badge badge-info">{inc.status}</span>
                  </td>
                  <td>
                    <select
                      className="form-select"
                      style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', width: 'auto' }}
                      value={inc.status}
                      onChange={(e) => handleUpdateIncidentStatus(inc._id, e.target.value)}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Under Review">Under Review</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 4. SHELTER CREATOR & MANAGER */}
      {activeTab === 'shelters' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.5rem' }}>
          <div className="glass-card">
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1.15rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Icon name="home" size={18} color="#10b981" />
              <span>Register Emergency Shelter</span>
            </h3>
            <form onSubmit={handleCreateShelter}>
              <div className="form-group">
                <label className="form-label">Shelter Name</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={newShelter.name}
                  onChange={(e) => setNewShelter({ ...newShelter, name: e.target.value })}
                  placeholder="e.g. Science Auditorium Shelter"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Address</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={newShelter.address}
                  onChange={(e) => setNewShelter({ ...newShelter, address: e.target.value })}
                  placeholder="Street / Campus Gate"
                />
              </div>

              <div className="grid-cols-2">
                <div className="form-group">
                  <label className="form-label">Capacity (Beds)</label>
                  <input
                    type="number"
                    min={10}
                    className="form-input"
                    value={newShelter.capacity}
                    onChange={(e) => setNewShelter({ ...newShelter, capacity: parseInt(e.target.value) || 100 })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Contact Phone</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newShelter.phone}
                    onChange={(e) => setNewShelter({ ...newShelter, phone: e.target.value })}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                <Icon name="plus" size={16} />
                <span>Register Shelter</span>
              </button>
            </form>
          </div>

          <div className="data-table-container glass-card" style={{ padding: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Shelter Name</th>
                  <th>Occupancy</th>
                  <th>Status</th>
                  <th>Phone</th>
                </tr>
              </thead>
              <tbody>
                {shelters.map((s) => (
                  <tr key={s._id}>
                    <td>
                      <strong style={{ color: '#ffffff' }}>{s.name}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.address}</div>
                    </td>
                    <td>{s.occupancy} / {s.capacity}</td>
                    <td><span className="badge badge-success">{s.status}</span></td>
                    <td>{s.phone}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. ALERT BROADCASTER */}
      {activeTab === 'alerts' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.5rem' }}>
          <div className="glass-card">
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1.15rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Icon name="bell" size={18} color="#ff334b" />
              <span>Broadcast Emergency Alert</span>
            </h3>
            <form onSubmit={handleCreateAlert}>
              <div className="form-group">
                <label className="form-label">Alert Headline</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={newAlert.title}
                  onChange={(e) => setNewAlert({ ...newAlert, title: e.target.value })}
                  placeholder="e.g. DANGER: Chemical Spill in Lab 3"
                />
              </div>

              <div className="grid-cols-2">
                <div className="form-group">
                  <label className="form-label">Severity Level</label>
                  <select
                    className="form-select"
                    value={newAlert.severity}
                    onChange={(e) => setNewAlert({ ...newAlert, severity: e.target.value })}
                  >
                    <option value="Critical">🔴 Critical (Red Banner)</option>
                    <option value="Danger">🟠 Danger</option>
                    <option value="Warning">🟡 Warning</option>
                    <option value="Information">🔵 Information</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Disaster Type</label>
                  <select
                    className="form-select"
                    value={newAlert.type}
                    onChange={(e) => setNewAlert({ ...newAlert, type: e.target.value })}
                  >
                    <option value="Flood">Flood</option>
                    <option value="Fire">Fire</option>
                    <option value="Earthquake">Earthquake</option>
                    <option value="Cyclone">Cyclone</option>
                    <option value="Thunderstorm">Thunderstorm</option>
                    <option value="General">General Safety</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Location / Impact Sector</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={newAlert.location}
                  onChange={(e) => setNewAlert({ ...newAlert, location: e.target.value })}
                  placeholder="e.g. South Campus Quadrangle"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Advisory Message</label>
                <textarea
                  rows={3}
                  required
                  className="form-textarea"
                  value={newAlert.message}
                  onChange={(e) => setNewAlert({ ...newAlert, message: e.target.value })}
                  placeholder="Instructions for students and campus residents..."
                />
              </div>

              <button type="submit" className="btn btn-danger" style={{ width: '100%' }}>
                <Icon name="bell" size={16} />
                <span>Broadcast Alert Instantly</span>
              </button>
            </form>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>Active Broadcasts</h3>
            {alerts.map((a) => (
              <div key={a._id} className="glass-card" style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <strong style={{ fontSize: '0.95rem', color: '#ffffff' }}>{a.title}</strong>
                  <span className={`badge badge-${a.severity?.toLowerCase()}`}>{a.severity}</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{a.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. DONATION & DISTRIBUTION LOGGING */}
      {activeTab === 'donations' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '1.5rem' }}>
          <div className="glass-card">
            <span className="badge badge-blockchain" style={{ marginBottom: '0.4rem' }}>
              ⛓️ MINT TO LEDGER
            </span>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1.15rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Icon name="box" size={18} color="#818cf8" />
              <span>Log Relief Aid Donation</span>
            </h3>
            <form onSubmit={handleCreateDonation}>
              <div className="form-group">
                <label className="form-label">Donor Name / Agency</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={newDonation.donor}
                  onChange={(e) => setNewDonation({ ...newDonation, donor: e.target.value })}
                  placeholder="e.g. Red Cross India"
                />
              </div>

              <div className="grid-cols-2">
                <div className="form-group">
                  <label className="form-label">Resource Type</label>
                  <select
                    className="form-select"
                    value={newDonation.type}
                    onChange={(e) => setNewDonation({ ...newDonation, type: e.target.value })}
                  >
                    <option value="Medical Supplies">Medical Supplies</option>
                    <option value="Food">Food Rations</option>
                    <option value="Water">Clean Drinking Water</option>
                    <option value="Blankets">Blankets / Clothing</option>
                    <option value="Emergency Kits">Emergency Flashlights / Kits</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    className="form-input"
                    value={newDonation.quantity}
                    onChange={(e) => setNewDonation({ ...newDonation, quantity: parseInt(e.target.value) || 100 })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Resource Description</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={newDonation.resourceName}
                  onChange={(e) => setNewDonation({ ...newDonation, resourceName: e.target.value })}
                  placeholder="e.g. 500 First-Aid Emergency Trauma Kits"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Destination Shelter</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={newDonation.destination}
                  onChange={(e) => setNewDonation({ ...newDonation, destination: e.target.value })}
                  placeholder="e.g. Central University Indoor Stadium"
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                <Icon name="blockchain" size={16} />
                <span>Record & Mint Block Hash</span>
              </button>
            </form>
          </div>

          <div className="data-table-container glass-card" style={{ padding: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Txn ID</th>
                  <th>Donor</th>
                  <th>Supply</th>
                  <th>Destination</th>
                  <th>Block Hash</th>
                </tr>
              </thead>
              <tbody>
                {donations.map((d) => (
                  <tr key={d._id}>
                    <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#ffffff' }}>{d.donationId}</td>
                    <td>{d.donor}</td>
                    <td>{d.quantity} {d.unit} &bull; {d.resourceName}</td>
                    <td>{d.destination}</td>
                    <td>
                      <span className="badge badge-blockchain" style={{ fontSize: '0.68rem' }}>
                        {d.blockchainTransactionId || 'TXN-881204'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. BLOCKCHAIN LEDGER */}
      {activeTab === 'blockchain' && (
        <div className="data-table-container glass-card" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Block #</th>
                <th>Txn ID</th>
                <th>Entity</th>
                <th>Resource</th>
                <th>Block Hash (SHA-256)</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {blockchainRecords.map((r) => (
                <tr key={r._id}>
                  <td style={{ fontWeight: 700, color: '#818cf8', fontFamily: 'var(--font-mono)' }}>#{r.blockNumber || 1001}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: '#ffffff' }}>{r.transactionId}</td>
                  <td><span className="badge badge-info">{r.entityType || 'Donation'}</span></td>
                  <td>{r.quantity} {r.unit} {r.resourceName}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#38bdf8' }}>
                    {r.blockHash?.substring(0, 20)}...
                  </td>
                  <td>
                    <button
                      onClick={() => setSelectedReceipt(r)}
                      className="btn btn-outline btn-sm"
                    >
                      <Icon name="blockchain" size={13} color="#818cf8" />
                      <span>Audit Proof</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 8. USER DIRECTORY & PENDING VERIFICATIONS MANAGEMENT */}
      {activeTab === 'users' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {/* Top Sub-Navigation & Filter */}
          <div
            className="spatial-panel"
            style={{
              padding: '1rem 1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', margin: '0 0 0.25rem 0' }}>
                Personnel & Operator Management
              </h2>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Approve pending registrations, audit roles, and assign security clearances
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setUserFilter('all')}
                className={`btn btn-sm ${userFilter === 'all' ? 'btn-primary' : 'btn-ghost'}`}
              >
                All Operators ({users.length})
              </button>
              <button
                type="button"
                onClick={() => setUserFilter('pending')}
                className={`btn btn-sm ${userFilter === 'pending' ? 'btn-primary' : 'btn-ghost'}`}
                style={users.filter((u) => !u.isVerified).length > 0 && userFilter !== 'pending' ? { border: '1px solid var(--amber)', color: 'var(--amber)' } : {}}
              >
                Pending Approval ({users.filter((u) => !u.isVerified).length})
              </button>
              <button
                type="button"
                onClick={() => setUserFilter('verified')}
                className={`btn btn-sm ${userFilter === 'verified' ? 'btn-primary' : 'btn-ghost'}`}
              >
                Verified ({users.filter((u) => u.isVerified).length})
              </button>
            </div>
          </div>

          {/* Dedicated Section: PENDING VERIFICATIONS */}
          {(userFilter === 'all' || userFilter === 'pending') && (
            <div className="spatial-panel" style={{ padding: '1.5rem', border: '1px solid rgba(245, 158, 11, 0.35)', background: 'rgba(245, 158, 11, 0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <span style={{ fontSize: '1.25rem' }}>⏳</span>
                  <div>
                    <h3 style={{ margin: 0, color: '#ffffff', fontSize: '1.05rem', fontWeight: 800 }}>
                      PENDING VERIFICATIONS
                    </h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--amber)' }}>
                      Awaiting administrator approval ({users.filter((u) => !u.isVerified).length} operators)
                    </span>
                  </div>
                </div>
              </div>

              {users.filter((u) => !u.isVerified).length === 0 ? (
                <div style={{ padding: '1.75rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  ✓ All operator accounts are verified. No pending approvals in queue.
                </div>
              ) : (
                <div className="data-table-container glass-card" style={{ padding: 0, margin: 0 }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Registered Date</th>
                        <th>Verification Status</th>
                        <th style={{ textAlign: 'center' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users
                        .filter((u) => !u.isVerified)
                        .map((u) => (
                          <tr key={u._id}>
                            <td>
                              <strong style={{ color: '#ffffff' }}>{u.name}</strong>
                            </td>
                            <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                            <td>
                              <span
                                className={`badge ${
                                  u.role === 'admin'
                                    ? 'badge-critical'
                                    : u.role === 'responder'
                                    ? 'badge-danger'
                                    : u.role === 'ngo'
                                    ? 'badge-info'
                                    : 'badge-neutral'
                                }`}
                                style={{ textTransform: 'capitalize' }}
                              >
                                {u.role || 'citizen'}
                              </span>
                            </td>
                            <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                              {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Recent'}
                            </td>
                            <td>
                              <span className="badge badge-warning">
                                Pending
                              </span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <button
                                type="button"
                                onClick={() => setConfirmVerifyUser(u)}
                                className="btn btn-primary btn-sm"
                                style={{
                                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                  borderColor: '#10b981',
                                  padding: '0.35rem 0.85rem',
                                  fontSize: '0.78rem',
                                  fontWeight: 800,
                                }}
                              >
                                [ VERIFY ]
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Complete Directory Table */}
          {userFilter !== 'pending' && (
            <div className="data-table-container glass-card" style={{ padding: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>User Name</th>
                    <th>Email Address</th>
                    <th>Current Role</th>
                    <th>Status</th>
                    <th>Change Role</th>
                    <th>Approval Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users
                    .filter((u) => (userFilter === 'verified' ? u.isVerified : true))
                    .map((u) => (
                      <tr key={u._id}>
                        <td>
                          <strong style={{ color: '#ffffff' }}>{u.name}</strong>
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                        <td>
                          <span
                            className={`badge ${
                              u.role === 'admin'
                                ? 'badge-critical'
                                : u.role === 'responder'
                                ? 'badge-danger'
                                : u.role === 'ngo'
                                ? 'badge-info'
                                : 'badge-neutral'
                            }`}
                            style={{ textTransform: 'capitalize' }}
                          >
                            {u.role || 'citizen'}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${u.isVerified ? 'badge-success' : 'badge-warning'}`}>
                            {u.isVerified ? 'Verified' : 'Pending'}
                          </span>
                        </td>
                        <td>
                          <select
                            className="form-select"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', width: 'auto' }}
                            value={u.role || 'citizen'}
                            onChange={(e) => handleUpdateRole(u._id, e.target.value)}
                          >
                            <option value="citizen">Citizen / Student</option>
                            <option value="volunteer">Volunteer</option>
                            <option value="ngo">NGO Coordinator</option>
                            <option value="responder">First Responder</option>
                            <option value="admin">Administrator</option>
                          </select>
                        </td>
                        <td>
                          {!u.isVerified ? (
                            <button
                              type="button"
                              onClick={() => setConfirmVerifyUser(u)}
                              className="btn btn-outline btn-sm"
                              style={{ borderColor: 'var(--mint)', color: 'var(--mint)' }}
                            >
                              Verify Account
                            </button>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>✓ Active</span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 9. PASSWORD RECOVERY REQUESTS */}
      {activeTab === 'recoveries' && (
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.25rem',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.25rem' }}>
                Password Recovery Verification Grid
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', margin: 0 }}>
                Review and approve operator account recovery requests. Single-use 15-minute codes are cryptographically generated upon approval.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button
                onClick={loadRecoveries}
                className="btn btn-ghost"
                style={{ padding: '0.5rem 0.85rem', fontSize: '0.82rem' }}
                title="Refresh Recovery Requests"
              >
                <Icon name="refresh" size={15} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: `All (${recoveryRequests.length})` },
              { id: 'pending', label: `Pending (${recoveryRequests.filter((r) => r.status === 'pending').length})` },
              { id: 'approved', label: `Approved (${recoveryRequests.filter((r) => r.status === 'approved').length})` },
              { id: 'completed', label: `Completed (${recoveryRequests.filter((r) => r.status === 'completed').length})` },
              { id: 'rejected', label: `Rejected (${recoveryRequests.filter((r) => r.status === 'rejected').length})` },
              { id: 'expired', label: `Expired (${recoveryRequests.filter((r) => r.status === 'expired').length})` },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setRecoveryFilter(f.id)}
                className={`btn ${recoveryFilter === f.id ? 'btn-primary' : 'btn-ghost'}`}
                style={{
                  padding: '0.4rem 0.85rem',
                  fontSize: '0.8rem',
                  minHeight: '36px',
                  borderRadius: 'var(--radius-xs)',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Recovery Requests Table */}
          {recoveryRequests.filter((r) => recoveryFilter === 'all' || r.status === recoveryFilter).length === 0 ? (
            <div
              className="glass-card"
              style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-secondary)' }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🛡️</div>
              <h3 style={{ color: '#ffffff', fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                No Recovery Requests Found
              </h3>
              <p style={{ fontSize: '0.85rem', maxWidth: '400px', margin: '0 auto' }}>
                {recoveryFilter === 'pending'
                  ? 'All pending password recovery requests have been reviewed.'
                  : `No requests found in '${recoveryFilter}' status.`}
              </p>
            </div>
          ) : (
            <div className="glass-card" style={{ overflowX: 'auto', padding: 0 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--border-subtle)' }}>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 700 }}>OPERATOR</th>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 700 }}>ROLE</th>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 700 }}>REQUESTED AT</th>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 700 }}>STATUS</th>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 700 }}>REVIEW DETAILS</th>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 700, textAlign: 'right' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {recoveryRequests
                    .filter((r) => recoveryFilter === 'all' || r.status === recoveryFilter)
                    .map((req) => {
                      const userObj = req.userId && typeof req.userId === 'object' ? req.userId : null;
                      const reviewerObj = req.reviewedBy && typeof req.reviewedBy === 'object' ? req.reviewedBy : null;
                      const isPending = req.status === 'pending';
                      const isApproved = req.status === 'approved';
                      const isCompleted = req.status === 'completed';
                      const isRejected = req.status === 'rejected';
                      const isExpired = req.status === 'expired';

                      return (
                        <tr
                          key={req._id}
                          style={{
                            borderBottom: '1px solid var(--border-subtle)',
                            background: isPending ? 'rgba(245, 158, 11, 0.03)' : 'transparent',
                          }}
                        >
                          <td style={{ padding: '1rem' }}>
                            <div style={{ fontWeight: 700, color: '#ffffff' }}>
                              {userObj?.name || req.email}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                              {req.email}
                            </div>
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '0.2rem 0.5rem',
                                borderRadius: '4px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                background: 'rgba(56, 189, 248, 0.12)',
                                color: '#38bdf8',
                                border: '1px solid rgba(56, 189, 248, 0.25)',
                              }}
                            >
                              {userObj?.role || 'User'}
                            </span>
                          </td>
                          <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                            {req.requestedAt ? new Date(req.requestedAt).toLocaleString() : '—'}
                          </td>
                          <td style={{ padding: '1rem' }}>
                            {isPending && (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                  padding: '0.25rem 0.65rem',
                                  borderRadius: '999px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  background: 'rgba(245, 158, 11, 0.15)',
                                  color: '#f59e0b',
                                  border: '1px solid rgba(245, 158, 11, 0.35)',
                                }}
                              >
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b' }} />
                                Pending Review
                              </span>
                            )}
                            {isApproved && (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                  padding: '0.25rem 0.65rem',
                                  borderRadius: '999px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  background: 'rgba(56, 189, 248, 0.15)',
                                  color: '#38bdf8',
                                  border: '1px solid rgba(56, 189, 248, 0.35)',
                                }}
                              >
                                Code Active
                              </span>
                            )}
                            {isCompleted && (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                  padding: '0.25rem 0.65rem',
                                  borderRadius: '999px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  background: 'rgba(16, 185, 129, 0.15)',
                                  color: '#10b981',
                                  border: '1px solid rgba(16, 185, 129, 0.35)',
                                }}
                              >
                                ✓ Reset Completed
                              </span>
                            )}
                            {isRejected && (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                  padding: '0.25rem 0.65rem',
                                  borderRadius: '999px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  background: 'rgba(244, 63, 94, 0.15)',
                                  color: '#f43f5e',
                                  border: '1px solid rgba(244, 63, 94, 0.35)',
                                }}
                              >
                                Rejected
                              </span>
                            )}
                            {isExpired && (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                  padding: '0.25rem 0.65rem',
                                  borderRadius: '999px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  background: 'rgba(148, 163, 184, 0.15)',
                                  color: '#94a3b8',
                                  border: '1px solid rgba(148, 163, 184, 0.35)',
                                }}
                              >
                                Expired
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {reviewerObj && (
                              <div>
                                <strong style={{ color: '#ffffff' }}>By:</strong> {reviewerObj.name || reviewerObj.email}
                              </div>
                            )}
                            {req.reviewedAt && <div>{new Date(req.reviewedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>}
                            {req.rejectionReason && (
                              <div style={{ color: '#f43f5e', fontStyle: 'italic', marginTop: '0.2rem' }}>
                                "{req.rejectionReason}"
                              </div>
                            )}
                            {isApproved && req.resetTokenExpiresAt && (
                              <div style={{ color: '#38bdf8', fontSize: '0.75rem' }}>
                                Expires: {new Date(req.resetTokenExpiresAt).toLocaleTimeString()}
                              </div>
                            )}
                            {!reviewerObj && !req.rejectionReason && '—'}
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'right' }}>
                            {isPending ? (
                              <div style={{ display: 'inline-flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                <button
                                  type="button"
                                  disabled={approvingRecoveryId === req._id || rejectingRecoveryId === req._id}
                                  onClick={() => handleApproveRecovery(req._id)}
                                  className="btn btn-primary"
                                  style={{
                                    padding: '0.45rem 0.85rem',
                                    fontSize: '0.78rem',
                                    minHeight: '36px',
                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    borderColor: '#10b981',
                                  }}
                                  title="Approve recovery and generate one-time 15-minute code"
                                >
                                  {approvingRecoveryId === req._id ? 'Approving...' : '✓ Approve'}
                                </button>
                                <button
                                  type="button"
                                  disabled={approvingRecoveryId === req._id || rejectingRecoveryId === req._id}
                                  onClick={() => {
                                    setRejectionModalTarget(req);
                                    setRejectionReasonInput('');
                                  }}
                                  className="btn btn-ghost"
                                  style={{
                                    padding: '0.45rem 0.85rem',
                                    fontSize: '0.78rem',
                                    minHeight: '36px',
                                    color: '#f43f5e',
                                    borderColor: 'rgba(244, 63, 94, 0.3)',
                                  }}
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                                {isCompleted ? '✓ Resolved' : isApproved ? 'Pending User Entry' : 'Closed'}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Recovery Code One-Time Modal */}
      {recoveryCodeModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(3, 7, 18, 0.9)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '1rem',
          }}
        >
          <div
            className="spatial-panel"
            style={{
              maxWidth: '520px',
              width: '100%',
              padding: '2.25rem',
              background: '#0c1424',
              border: '1px solid var(--border-highlight)',
              boxShadow: 'var(--glow-cyan)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'linear-gradient(135deg, var(--cyan), var(--mint))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name="key" size={22} color="#ffffff" />
              </div>
              <div>
                <h3 style={{ margin: 0, color: '#ffffff', fontSize: '1.2rem', fontWeight: 800 }}>
                  Single-Use Recovery Code Generated
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--cyan)', fontWeight: 700 }}>
                  OPERATOR VERIFICATION APPROVED
                </span>
              </div>
            </div>

            <div
              style={{
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                borderRadius: 'var(--radius-xs)',
                padding: '0.85rem 1rem',
                fontSize: '0.82rem',
                color: '#fcd34d',
                lineHeight: 1.45,
                marginBottom: '1.5rem',
              }}
            >
              ⚠️ <strong>SECURITY MANDATE:</strong> This single-use recovery code is shown <strong>only once</strong>. The plaintext code is never stored in the database (only a SHA-256 hash is retained). Provide this code directly to <strong>{recoveryCodeModal.email}</strong> via an authenticated communication channel.
            </div>

            {/* Code Display Box */}
            <div
              style={{
                background: 'rgba(5, 8, 14, 0.8)',
                border: '2px dashed var(--border-highlight)',
                borderRadius: 'var(--radius-sm)',
                padding: '1.25rem',
                textAlign: 'center',
                marginBottom: '1.5rem',
              }}
            >
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
                SINGLE-USE RECOVERY CODE (EXPIRES IN 15 MINUTES)
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '1.85rem',
                  fontWeight: 900,
                  letterSpacing: '0.12em',
                  color: '#38bdf8',
                  userSelect: 'all',
                  padding: '0.5rem 0',
                }}
              >
                {recoveryCodeModal.code}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                Expires at: {recoveryCodeModal.expiresAt ? new Date(recoveryCodeModal.expiresAt).toLocaleTimeString() : '15 minutes'}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => handleCopyCode(recoveryCodeModal.code)}
                className="btn btn-ghost"
                style={{ minHeight: '44px', padding: '0 1.25rem' }}
              >
                <Icon name="copy" size={16} />
                <span>{copiedCode ? '✓ Copied!' : 'Copy Code'}</span>
              </button>
              <button
                type="button"
                onClick={() => setRecoveryCodeModal(null)}
                className="btn btn-primary"
                style={{ minHeight: '44px', padding: '0 1.5rem' }}
              >
                Done & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recovery Rejection Modal */}
      {rejectionModalTarget && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(3, 7, 18, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '1rem',
          }}
        >
          <div
            className="spatial-panel"
            style={{
              maxWidth: '460px',
              width: '100%',
              padding: '2rem',
              background: '#0c1424',
              border: '1px solid rgba(244, 63, 94, 0.4)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '1.5rem' }}>⚠️</span>
              <div>
                <h3 style={{ margin: 0, color: '#ffffff', fontSize: '1.15rem', fontWeight: 800 }}>
                  Reject Password Recovery
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#f43f5e', fontWeight: 700 }}>
                  SECURITY VERIFICATION DENIAL
                </span>
              </div>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', lineHeight: 1.5, marginBottom: '1rem' }}>
              Deny password recovery request for <strong style={{ color: '#ffffff' }}>{rejectionModalTarget.email}</strong>?
            </p>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Rejection Reason (Audit Logged)</label>
              <input
                type="text"
                className="form-input"
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                placeholder="e.g. Identity verification failed, unconfirmed device"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setRejectionModalTarget(null)}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={rejectingRecoveryId === rejectionModalTarget._id}
                onClick={handleRejectRecovery}
                className="btn btn-primary"
                style={{ background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)', borderColor: '#f43f5e' }}
              >
                {rejectingRecoveryId === rejectionModalTarget._id ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Admin Verification */}
      {confirmVerifyUser && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(3, 7, 18, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            className="spatial-panel"
            style={{
              maxWidth: '460px',
              width: '100%',
              padding: '2rem',
              background: '#0c1424',
              border: '1px solid var(--border-highlight)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '1.5rem' }}>🛡️</span>
              <div>
                <h3 style={{ margin: 0, color: '#ffffff', fontSize: '1.15rem', fontWeight: 800 }}>
                  Administrator User Approval
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--cyan)' }}>MANUAL OPERATOR VERIFICATION</span>
              </div>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              Verify this user account?
            </p>

            <div
              style={{
                background: 'rgba(5, 8, 14, 0.6)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-xs)',
                padding: '1rem',
                marginBottom: '1.5rem',
                fontSize: '0.82rem',
              }}
            >
              <div style={{ marginBottom: '0.35rem' }}>
                <strong style={{ color: '#ffffff' }}>Operator:</strong> {confirmVerifyUser.name}
              </div>
              <div style={{ marginBottom: '0.35rem' }}>
                <strong style={{ color: '#ffffff' }}>Email:</strong> {confirmVerifyUser.email}
              </div>
              <div>
                <strong style={{ color: '#ffffff' }}>Role:</strong>{' '}
                <span style={{ textTransform: 'capitalize', color: 'var(--cyan)', fontWeight: 700 }}>
                  {confirmVerifyUser.role}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setConfirmVerifyUser(null)}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={verifyingUserId === confirmVerifyUser._id}
                onClick={() => handleVerifyUser(confirmVerifyUser._id)}
                className="btn btn-primary"
                style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderColor: '#10b981' }}
              >
                {verifyingUserId === confirmVerifyUser._id ? 'Verifying...' : 'Verify Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      <BlockchainReceiptModal
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        record={selectedReceipt}
      />
    </div>
  );
};

export default AdminDashboard;
