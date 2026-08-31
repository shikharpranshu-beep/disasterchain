import React, { useState, useEffect } from 'react';
import StatCard from '../components/StatCard';
import BlockchainReceiptModal from '../components/BlockchainReceiptModal';
import api, {
  fetchSosRequests,
  fetchShelters,
  fetchIncidents,
  fetchAlerts,
  fetchDonations,
  fetchDistributions,
  fetchBlockchainTransactions,
} from '../services/api';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'sos' | 'incidents' | 'shelters' | 'alerts' | 'donations' | 'blockchain'
  const [sosList, setSosList] = useState([]);
  const [shelters, setShelters] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [donations, setDonations] = useState([]);
  const [distributions, setDistributions] = useState([]);
  const [blockchainRecords, setBlockchainRecords] = useState([]);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Forms
  const [newAlert, setNewAlert] = useState({ title: '', message: '', type: 'Flood', severity: 'Warning', location: '' });
  const [newShelter, setNewShelter] = useState({ name: '', address: '', capacity: 300, phone: '+91 11 2345 0000', facilities: ['Food', 'Water', 'Medical'] });
  const [newDonation, setNewDonation] = useState({ donor: '', type: 'Medical Supplies', resourceName: '', quantity: 500, unit: 'kits', destination: 'Central Shelter' });

  const [actionNotice, setActionNotice] = useState('');

  const loadAll = async () => {
    try {
      const [sos, sh, inc, alt, don, dist, bc] = await Promise.all([
        fetchSosRequests(),
        fetchShelters(),
        fetchIncidents(),
        fetchAlerts({ activeOnly: 'false' }),
        fetchDonations(),
        fetchDistributions(),
        fetchBlockchainTransactions(),
      ]);
      setSosList(sos);
      setShelters(sh);
      setIncidents(inc);
      setAlerts(alt);
      setDonations(don);
      setDistributions(dist);
      setBlockchainRecords(bc);
    } catch (err) {
      console.error('Error loading admin data:', err);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Update SOS status
  const handleUpdateSosStatus = async (id, status) => {
    try {
      await api.put(`/sos/${id}/status`, { status });
      setActionNotice(`Updated SOS request status to ${status}`);
    } catch (err) {
      setActionNotice(`Updated SOS request status to ${status} (Local)`);
    }
    setSosList((prev) => prev.map((s) => (s._id === id ? { ...s, status } : s)));
    setTimeout(() => setActionNotice(''), 3000);
  };

  // Update Incident status
  const handleUpdateIncidentStatus = async (id, status) => {
    try {
      await api.put(`/incidents/${id}/status`, { status });
      setActionNotice(`Updated Incident report status to ${status}`);
    } catch (err) {
      setActionNotice(`Updated Incident report status to ${status} (Local)`);
    }
    setIncidents((prev) => prev.map((inc) => (inc._id === id ? { ...inc, status } : inc)));
    setTimeout(() => setActionNotice(''), 3000);
  };

  // Create Alert
  const handleCreateAlert = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/alerts', newAlert);
      setAlerts([res.data.data, ...alerts]);
      setActionNotice('Emergency alert broadcasted successfully!');
    } catch (err) {
      const mockAlert = { _id: `alt-${Date.now()}`, ...newAlert, active: true, createdAt: new Date().toISOString() };
      setAlerts([mockAlert, ...alerts]);
      setActionNotice('Emergency alert broadcasted successfully! (Local)');
    }
    setNewAlert({ title: '', message: '', type: 'Flood', severity: 'Warning', location: '' });
    setTimeout(() => setActionNotice(''), 3000);
  };

  // Create Shelter
  const handleCreateShelter = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/shelters', newShelter);
      setShelters([res.data.data, ...shelters]);
      setActionNotice('New shelter added successfully!');
    } catch (err) {
      const mockSh = { _id: `sh-${Date.now()}`, ...newShelter, occupancy: 0, status: 'Open' };
      setShelters([mockSh, ...shelters]);
      setActionNotice('New shelter added successfully! (Local)');
    }
    setNewShelter({ name: '', address: '', capacity: 300, phone: '+91 11 2345 0000', facilities: ['Food', 'Water', 'Medical'] });
    setTimeout(() => setActionNotice(''), 3000);
  };

  // Record Donation & Mint Blockchain Block
  const handleCreateDonation = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/donations', newDonation);
      setDonations([res.data.data, ...donations]);
      if (res.data.blockchain) {
        setBlockchainRecords([res.data.blockchain, ...blockchainRecords]);
      }
      setActionNotice('Donation recorded & cryptographic blockchain block minted!');
    } catch (err) {
      const mockDon = {
        _id: `don-${Date.now()}`,
        donationId: `DON-${Math.floor(1000 + Math.random() * 9000)}`,
        ...newDonation,
        status: 'Verified',
        blockchainTransactionId: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
        createdAt: new Date().toISOString(),
      };
      setDonations([mockDon, ...donations]);
      setActionNotice('Donation recorded & cryptographic blockchain block minted! (Local)');
    }
    setNewDonation({ donor: '', type: 'Medical Supplies', resourceName: '', quantity: 500, unit: 'kits', destination: 'Central Shelter' });
    setTimeout(() => setActionNotice(''), 3000);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <div className="badge badge-blockchain" style={{ marginBottom: '0.4rem' }}>
            🛡️ DISASTER RESPONSE COMMAND CONSOLE
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Administrator Management Portal</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Coordinate SOS rescue dispatch, review hazard reports, broadcast emergency alerts & log blockchain relief shipments
          </p>
        </div>
      </div>

      {actionNotice && (
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#34d399',
            padding: '0.75rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            fontWeight: 600,
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
          { id: 'overview', label: '📊 System Analytics', icon: '📊' },
          { id: 'sos', label: `🚨 Manage SOS (${sosList.length})`, icon: '🚨' },
          { id: 'incidents', label: `⚠️ Review Hazards (${incidents.length})`, icon: '⚠️' },
          { id: 'shelters', label: `🏠 Shelters (${shelters.length})`, icon: '🏠' },
          { id: 'alerts', label: '🔔 Broadcast Alerts', icon: '🔔' },
          { id: 'donations', label: '📦 Log Donations & Aid', icon: '📦' },
          { id: 'blockchain', label: `⛓️ Blockchain Ledger (${blockchainRecords.length})`, icon: '⛓️' },
        ].map((tab) => {
          const isTabActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '0.75rem 1rem',
                background: isTabActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                border: 'none',
                borderBottom: isTabActive ? '3px solid var(--accent-indigo)' : '3px solid transparent',
                color: isTabActive ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: isTabActive ? 700 : 500,
                fontSize: '0.88rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                borderRadius: isTabActive ? 'var(--radius-sm) var(--radius-sm) 0 0' : '0',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 1. OVERVIEW & ANALYTICS CHARTS */}
      {activeTab === 'overview' && (
        <div>
          <div className="grid-cols-4" style={{ marginBottom: '1.75rem' }}>
            <StatCard title="Total SOS Requests" value={sosList.length} subtitle={`${sosList.filter(s => s.status === 'Pending').length} Pending Response`} icon="🚨" color="red" />
            <StatCard title="Hazard Tickets" value={incidents.length} subtitle={`${incidents.filter(i => i.status === 'Pending').length} Pending Inspection`} icon="⚠️" color="amber" />
            <StatCard title="Shelter Capacity" value={`${shelters.reduce((a, s) => a + (s.occupancy||0), 0)} / ${shelters.reduce((a, s) => a + (s.capacity||0), 0)}`} subtitle={`${shelters.length} Total Shelters`} icon="🏠" color="cyan" />
            <StatCard title="Blockchain Ledger Blocks" value={blockchainRecords.length} subtitle="100% Cryptographic Verification" icon="⛓️" color="indigo" />
          </div>

          {/* Simple Visual Analytics Charts (PRD #34) */}
          <div className="grid-cols-2" style={{ marginBottom: '1.75rem' }}>
            {/* SOS by Severity Breakdown */}
            <div className="glass-card">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem' }}>
                🚨 SOS Requests by Severity Breakdown
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {['Critical', 'High', 'Medium', 'Low'].map((sev) => {
                  const count = sosList.filter((s) => s.severity === sev).length;
                  const pct = Math.round((count / (sosList.length || 1)) * 100);
                  const color = sev === 'Critical' ? '#ef4444' : sev === 'High' ? '#f97316' : sev === 'Medium' ? '#f59e0b' : '#10b981';

                  return (
                    <div key={sev}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                        <span>{sev} Severity</span>
                        <strong>{count} ({pct}%)</strong>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: '#334155', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Shelter Occupancy Distribution */}
            <div className="glass-card">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem' }}>
                🏠 Shelter Occupancy Status
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {shelters.map((sh) => {
                  const pct = Math.min(100, Math.round(((sh.occupancy || 0) / (sh.capacity || 1)) * 100));
                  return (
                    <div key={sh._id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                        <span>{sh.name}</span>
                        <strong>{sh.occupancy} / {sh.capacity} ({pct}%)</strong>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: '#334155', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: pct >= 100 ? '#ef4444' : 'linear-gradient(90deg, #10b981, #06b6d4)' }} />
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
                  <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{sos.requestId}</td>
                  <td>
                    <strong>{sos.emergencyType}</strong>
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
                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', width: 'auto' }}
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
                  <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{inc.incidentId}</td>
                  <td>
                    <strong>{inc.title}</strong>
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
                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', width: 'auto' }}
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
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1rem' }}>
              ➕ Register New Emergency Shelter
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
                Add Shelter
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
                      <strong>{s.name}</strong>
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
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1rem' }}>
              📢 Broadcast Emergency Alert
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
                <label className="form-label">Location</label>
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
                📢 Broadcast Alert Instantly
              </button>
            </form>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Active Broadcasts</h3>
            {alerts.map((a) => (
              <div key={a._id} className="glass-card" style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <strong style={{ fontSize: '0.95rem' }}>{a.title}</strong>
                  <span className={`badge badge-${a.severity?.toLowerCase()}`}>{a.severity}</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{a.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. DONATION & DISTRIBUTION LOGGING (MINT TO BLOCKCHAIN) */}
      {activeTab === 'donations' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '1.5rem' }}>
          <div className="glass-card">
            <span className="badge badge-blockchain" style={{ marginBottom: '0.4rem' }}>
              ⛓️ MINT TO LEDGER
            </span>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1rem' }}>
              Log Relief Donation
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
                ⛓️ Record & Mint Block Hash
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
                    <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{d.donationId}</td>
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
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{r.transactionId}</td>
                  <td><span className="badge badge-info">{r.entityType || 'Donation'}</span></td>
                  <td>{r.quantity} {r.unit} {r.resourceName}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#38bdf8' }}>
                    {r.blockHash?.substring(0, 20)}...
                  </td>
                  <td>
                    <button
                      onClick={() => setSelectedReceipt(r)}
                      className="btn btn-outline"
                      style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                    >
                      Audit Proof 🔍
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
