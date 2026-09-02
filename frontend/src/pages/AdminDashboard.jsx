import React, { useState, useEffect } from 'react';
import StatCard from '../components/StatCard';
import BlockchainReceiptModal from '../components/BlockchainReceiptModal';
import Icon from '../components/Icons';
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
} from '../services/api';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'sos' | 'incidents' | 'shelters' | 'alerts' | 'donations' | 'blockchain' | 'users'
  const [sosList, setSosList] = useState([]);
  const [shelters, setShelters] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [donations, setDonations] = useState([]);
  const [distributions, setDistributions] = useState([]);
  const [blockchainRecords, setBlockchainRecords] = useState([]);
  const [users, setUsers] = useState([]);
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
      const [sos, sh, inc, alt, don, dist, bc, usr] = await Promise.all([
        fetchSosRequests(),
        fetchShelters(),
        fetchIncidents(),
        fetchAlerts(),
        fetchDonations(),
        fetchDistributions(),
        fetchBlockchainTransactions(),
        fetchAdminUsers(),
      ]);
      setSosList(sos || []);
      setShelters(sh || []);
      setIncidents(inc || []);
      setAlerts(alt || []);
      setDonations(don || []);
      setDistributions(dist || []);
      setBlockchainRecords(bc || []);
      setUsers(usr || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
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
            <span>DISASTER RESPONSE COMMAND CONSOLE</span>
          </div>
          <h1 className="page-header-title">
            <Icon name="admin" size={26} color="var(--accent-indigo)" />
            <span>Administrator Management Portal</span>
          </h1>
          <p className="page-header-subtitle">
            Coordinate SOS rescue dispatch, review hazard reports, broadcast emergency alerts & log blockchain relief shipments
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
          { id: 'overview', label: 'System Analytics', icon: 'activity' },
          { id: 'sos', label: `Manage SOS (${sosList.length})`, icon: 'sos' },
          { id: 'incidents', label: `Review Hazards (${incidents.length})`, icon: 'warning' },
          { id: 'shelters', label: `Shelters (${shelters.length})`, icon: 'home' },
          { id: 'alerts', label: 'Broadcast Alerts', icon: 'bell' },
          { id: 'donations', label: 'Log Aid & Donations', icon: 'box' },
          { id: 'blockchain', label: `Blockchain Ledger (${blockchainRecords.length})`, icon: 'ledger' },
          { id: 'users', label: `User Directory (${users.length})`, icon: 'user' },
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
              title="Total SOS Distress"
              value={sosList.length}
              subtitle={`${sosList.filter((s) => s.status === 'Pending').length} Pending Dispatch`}
              icon="sos"
              color="red"
            />
            <StatCard
              title="Hazard Tickets"
              value={incidents.length}
              subtitle={`${incidents.filter((i) => i.status === 'Pending').length} Pending Inspection`}
              icon="warning"
              color="amber"
            />
            <StatCard
              title="Shelter Capacity"
              value={`${shelters.reduce((a, s) => a + (s.occupancy || 0), 0)} / ${shelters.reduce((a, s) => a + (s.capacity || 0), 0)}`}
              subtitle={`${shelters.length} Total Registered Shelters`}
              icon="home"
              color="cyan"
            />
            <StatCard
              title="Blockchain Blocks"
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
                title="Pending Verifications"
                value={users.filter((u) => !u.isVerified).length}
                subtitle={`${users.filter((u) => !u.isVerified).length} Awaiting Approval →`}
                icon="user"
                color={users.filter((u) => !u.isVerified).length > 0 ? 'amber' : 'mint'}
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
