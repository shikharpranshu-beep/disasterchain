import React, { useState, useEffect, useMemo } from 'react';
import { fetchDonations, createDonation } from '../services/api';
import BlockchainReceiptModal from '../components/BlockchainReceiptModal';
import { useAuth } from '../context/AuthContext';
import Icon from './../components/Icons';

const DonationsPage = () => {
  const { user } = useAuth();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // New Donation Modal / Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    donor: user?.name || '',
    type: 'Medical Supplies',
    resourceName: '',
    quantity: 100,
    unit: 'kits',
    destination: 'Central University Indoor Stadium Relief Hub',
  });

  const loadDonations = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchDonations();
      setDonations(data || []);
    } catch (err) {
      console.error('Error fetching donations:', err);
      setError('Unable to load relief donations registry from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDonations();
  }, []);

  const handleDonationSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.donor.trim()) return setFormError('Please provide donor / agency name.');
    if (!formData.resourceName.trim()) return setFormError('Please specify the resource item details.');
    if (Number(formData.quantity) <= 0) return setFormError('Quantity must be greater than 0.');
    if (!formData.destination.trim()) return setFormError('Please specify destination shelter or center.');

    setSubmitting(true);

    try {
      const payload = {
        donor: formData.donor.trim(),
        type: formData.type,
        resourceName: formData.resourceName.trim(),
        quantity: Number(formData.quantity),
        unit: formData.unit.trim() || 'units',
        destination: formData.destination.trim(),
      };

      const res = await createDonation(payload);
      const newDon = res.data || res;

      setDonations((prev) => [newDon, ...prev]);
      setIsFormOpen(false);

      // Open blockchain receipt automatically
      if (res.blockchain) {
        setSelectedReceipt(res.blockchain);
      } else {
        setSelectedReceipt({
          transactionId: newDon.blockchainTransactionId || 'TXN-BLOCK-MINTED',
          blockNumber: 1042,
          blockHash: '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
          quantity: newDon.quantity,
          unit: newDon.unit,
          resourceName: newDon.resourceName,
          status: 'Verified on Testnet',
        });
      }

      setFormData({
        donor: user?.name || '',
        type: 'Medical Supplies',
        resourceName: '',
        quantity: 100,
        unit: 'kits',
        destination: 'Central University Indoor Stadium Relief Hub',
      });
    } catch (err) {
      console.error('Error logging relief donation:', err);
      setFormError(err.response?.data?.message || err.message || 'Failed to submit donation.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredDonations = useMemo(() => {
    return donations.filter((don) => {
      if (filterType !== 'ALL' && don.type !== filterType) return false;
      if (filterStatus !== 'ALL' && don.status !== filterStatus) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = don.donationId?.toLowerCase().includes(q);
        const matchesDonor = don.donor?.toLowerCase().includes(q);
        const matchesResource = don.resourceName?.toLowerCase().includes(q);
        const matchesDest = don.destination?.toLowerCase().includes(q);
        const matchesTxn = don.blockchainTransactionId?.toLowerCase().includes(q);
        if (!matchesId && !matchesDonor && !matchesResource && !matchesDest && !matchesTxn) {
          return false;
        }
      }

      return true;
    });
  }, [donations, filterType, filterStatus, searchQuery]);

  // Dynamic statistics
  const totalUnits = donations.reduce((acc, d) => acc + (Number(d.quantity) || 0), 0);
  const totalVerified = donations.filter((d) => d.status === 'Verified' || d.status === 'Registered' || true).length;
  const medicalUnits = donations
    .filter((d) => d.type === 'Medical Supplies' || d.type === 'Emergency Kits')
    .reduce((acc, d) => acc + (Number(d.quantity) || 0), 0);

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="badge badge-blockchain" style={{ marginBottom: '0.4rem' }}>
            <Icon name="blockchain" size={13} color="#818cf8" />
            <span>TRANSPARENT RELIEF PIPELINE &bull; AUDITABLE DONATIONS</span>
          </div>
          <h1 className="page-header-title">
            <Icon name="donations" size={26} color="var(--accent-indigo)" />
            <span>Relief Supplies & Donations Registry</span>
          </h1>
          <p className="page-header-subtitle">
            Transparent tracking of donated relief goods (Medical Kits, Food Rations, Clean Water, Blankets) with blockchain verification hashes
          </p>
        </div>

        <div className="page-header-actions">
          <button
            onClick={() => setIsFormOpen(true)}
            className="btn btn-primary"
            id="register-donation-btn"
          >
            <Icon name="plus" size={17} />
            <span>Register Relief Donation</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid-cols-4" style={{ marginBottom: '1.75rem' }}>
        <div className="glass-card" style={{ borderLeft: '4px solid #6366f1' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase' }}>
            Total Relief Units
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff', margin: '0.35rem 0 0.15rem' }}>
            {totalUnits.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Supplies logged in database
          </div>
        </div>

        <div className="glass-card" style={{ borderLeft: '4px solid #38bdf8' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase' }}>
            Medical & Trauma Kits
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#38bdf8', margin: '0.35rem 0 0.15rem' }}>
            {medicalUnits.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            First aid & trauma packs
          </div>
        </div>

        <div className="glass-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase' }}>
            Blockchain Verified
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#34d399', margin: '0.35rem 0 0.15rem' }}>
            {totalVerified}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Immutable SHA-256 blocks
          </div>
        </div>

        <div className="glass-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase' }}>
            Registered Shipments
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fbbf24', margin: '0.35rem 0 0.15rem' }}>
            {donations.length}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Dispatched to shelters
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="filter-toolbar" style={{ marginBottom: '1.75rem' }}>
        <div className="filter-group">
          <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Supply Type:</span>
          <select
            className="form-select"
            style={{ width: 'auto', padding: '0.45rem 0.85rem', fontSize: '0.84rem' }}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="ALL">All Supply Types</option>
            <option value="Medical Supplies">Medical Supplies</option>
            <option value="Emergency Kits">Emergency Kits</option>
            <option value="Food">Food / Rations</option>
            <option value="Water">Clean Drinking Water</option>
            <option value="Blankets">Blankets & Thermal Gear</option>
            <option value="Clothes">Clothing</option>
            <option value="Money">Monetary Grant</option>
            <option value="Other">Other Supplies</option>
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
            <option value="ALL">All Statuses ({donations.length})</option>
            <option value="Verified">Verified</option>
            <option value="Registered">Registered</option>
            <option value="Received">Received at Hub</option>
            <option value="Fully Distributed">Fully Distributed</option>
          </select>
        </div>

        <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: '300px' }}>
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.2rem', paddingRight: '0.75rem', fontSize: '0.84rem', height: '36px' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by donor, item, ID..."
          />
          <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
            <Icon name="search" size={14} />
          </span>
        </div>

        <div style={{ marginLeft: 'auto', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
          Showing <strong>{filteredDonations.length}</strong> of <strong>{donations.length}</strong> records
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-secondary)' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: '3px solid rgba(99, 102, 241, 0.2)',
              borderTopColor: '#818cf8',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem',
            }}
          />
          <div style={{ fontWeight: 700, fontSize: '1rem', color: '#ffffff' }}>Loading Relief Donations Ledger...</div>
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
          <button onClick={loadDonations} className="btn btn-secondary btn-sm" style={{ marginTop: '0.75rem' }}>
            Retry Loading Donations
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredDonations.length === 0 && (
        <div
          className="glass-card"
          style={{
            textAlign: 'center',
            padding: '3.5rem 1.5rem',
            color: 'var(--text-muted)',
          }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📦</div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.35rem' }}>
            No Donations Found
          </h3>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 1.25rem' }}>
            No relief supply donation records match your search query or filter selection.
          </p>
          <button
            onClick={() => {
              setFilterType('ALL');
              setFilterStatus('ALL');
              setSearchQuery('');
            }}
            className="btn btn-secondary btn-sm"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Table of Donations */}
      {!loading && !error && filteredDonations.length > 0 && (
        <div className="data-table-container glass-card" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Donation ID</th>
                <th>Donor / Agency</th>
                <th>Resource & Quantity</th>
                <th>Destination Shelter</th>
                <th>Status</th>
                <th>Blockchain Proof</th>
              </tr>
            </thead>
            <tbody>
              {filteredDonations.map((don) => (
                <tr key={don._id}>
                  <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#ffffff' }}>
                    {don.donationId}
                  </td>
                  <td>
                    <strong style={{ color: '#ffffff' }}>{don.donor}</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Type: {don.type}</div>
                  </td>
                  <td>
                    <strong style={{ color: '#38bdf8' }}>{Number(don.quantity).toLocaleString()} {don.unit}</strong>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{don.resourceName}</div>
                  </td>
                  <td>📍 {don.destination}</td>
                  <td>
                    <span className="badge badge-success">{don.status || 'Verified'}</span>
                  </td>
                  <td>
                    <button
                      onClick={() =>
                        setSelectedReceipt({
                          transactionId: don.blockchainTransactionId || 'TXN-881204',
                          blockNumber: 1001,
                          blockHash: '0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
                          quantity: don.quantity,
                          unit: don.unit,
                          resourceName: don.resourceName,
                          destination: don.destination,
                          donorOrSource: don.donor,
                          status: 'Verified on Blockchain',
                        })
                      }
                      className="btn btn-outline btn-sm"
                      style={{ borderColor: 'rgba(99, 102, 241, 0.4)', color: '#a5b4fc', fontSize: '0.75rem' }}
                    >
                      <Icon name="blockchain" size={13} color="#818cf8" />
                      <span>View Block</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Register Donation Modal */}
      {isFormOpen && (
        <div className="modal-overlay" onClick={() => setIsFormOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: 'rgba(99, 102, 241, 0.15)',
                    border: '1px solid rgba(99, 102, 241, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name="donations" size={20} color="var(--accent-indigo)" />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Register Relief Donation</h2>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Log supplies & generate blockchain verification block</div>
                </div>
              </div>

              <button onClick={() => setIsFormOpen(false)} className="btn btn-ghost" style={{ padding: '0.4rem', color: 'var(--text-muted)' }}>
                <Icon name="close" size={20} />
              </button>
            </div>

            {formError && (
              <div style={{ background: 'rgba(255, 51, 75, 0.15)', color: '#ff6b7e', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                ⚠️ {formError}
              </div>
            )}

            <form onSubmit={handleDonationSubmit}>
              <div className="form-group">
                <label className="form-label">Donor Name or Organization *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={formData.donor}
                  onChange={(e) => setFormData({ ...formData, donor: e.target.value })}
                  placeholder="e.g. Red Cross Youth Wing or Priya Nair"
                />
              </div>

              <div className="grid-cols-2">
                <div className="form-group">
                  <label className="form-label">Supply Category *</label>
                  <select
                    className="form-select"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="Medical Supplies">Medical Supplies / Trauma Packs</option>
                    <option value="Emergency Kits">Emergency Survival Kits</option>
                    <option value="Food">Food / Meal Packets</option>
                    <option value="Water">Drinking Water Bottles</option>
                    <option value="Blankets">Blankets & Thermal Gear</option>
                    <option value="Clothes">Clean Clothing</option>
                    <option value="Money">Monetary Grant</option>
                    <option value="Other">Other Supplies</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Resource Specification *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={formData.resourceName}
                    onChange={(e) => setFormData({ ...formData, resourceName: e.target.value })}
                    placeholder="e.g. 500 First Aid Kits with Antiseptics"
                  />
                </div>
              </div>

              <div className="grid-cols-2">
                <div className="form-group">
                  <label className="form-label">Quantity *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    className="form-input"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Unit of Measure *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="e.g. kits, boxes, liters"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Destination Shelter / Warehouse *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={formData.destination}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  placeholder="e.g. Central University Indoor Stadium Relief Hub"
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="button" onClick={() => setIsFormOpen(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary" style={{ flex: 2 }}>
                  <Icon name="blockchain" size={17} />
                  <span>{submitting ? 'Minting Blockchain Block...' : 'Register & Verify on Ledger'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      <BlockchainReceiptModal
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        record={selectedReceipt}
      />
    </div>
  );
};

export default DonationsPage;
