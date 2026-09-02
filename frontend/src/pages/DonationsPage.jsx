import React, { useState, useEffect, useMemo } from 'react';
import { fetchDonations, createDonation } from '../services/api';
import BlockchainReceiptModal from '../components/BlockchainReceiptModal';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/Icons';

const DonationsPage = () => {
  const { user } = useAuth();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // New In-Kind Donation Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    donor: user?.name || '',
    type: 'Medical Supplies',
    resourceName: '',
    quantity: 100,
    unit: 'kits',
    destination: 'Central Relief Shelter Depot',
  });

  const loadDonations = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchDonations();
      setDonations(data || []);
    } catch (err) {
      console.error('Error fetching donations:', err);
      setError('Unable to load relief donations registry from backend server.');
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

    if (!formData.donor.trim()) return setFormError('Please provide donor or organization name.');
    if (!formData.resourceName.trim()) return setFormError('Please describe the relief cargo/supplies.');
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

      if (res.blockchain) {
        setSelectedReceipt(res.blockchain);
      }

      setFormData({
        donor: user?.name || '',
        type: 'Medical Supplies',
        resourceName: '',
        quantity: 100,
        unit: 'kits',
        destination: 'Central Relief Shelter Depot',
      });
    } catch (err) {
      console.error('Error logging relief donation:', err);
      setFormError(err.response?.data?.message || err.message || 'Failed to submit in-kind relief donation.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredDonations = useMemo(() => {
    return donations.filter((don) => {
      if (filterType !== 'ALL' && don.type?.toLowerCase() !== filterType.toLowerCase()) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchDonor = don.donor?.toLowerCase().includes(q);
        const matchItem = don.resourceName?.toLowerCase().includes(q);
        const matchDest = don.destination?.toLowerCase().includes(q);
        const matchTxn = don.blockchainTransactionId?.toLowerCase().includes(q);
        if (!matchDonor && !matchItem && !matchDest && !matchTxn) return false;
      }

      return true;
    });
  }, [donations, filterType, searchQuery]);

  const totalQuantity = useMemo(() => donations.reduce((acc, d) => acc + (Number(d.quantity) || 0), 0), [donations]);

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
            <span className="badge badge-success">HUMANITARIAN RELIEF AID</span>
            <span className="micro-label" style={{ color: 'var(--cyan)' }}>
              IN-KIND CONTRIBUTIONS REGISTRY
            </span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.25rem' }}>
            Emergency Aid Donations & Supplies
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Direct registration of trauma kits, emergency food rations, drinking water & relief cargo with cryptographic receipt proofs.
          </p>
        </div>

        <button
          onClick={() => setIsFormOpen(true)}
          className="btn btn-primary"
        >
          <Icon name="plus" size={16} />
          <span>Register Aid Donation</span>
        </button>
      </div>

      {/* Telemetry KPI Metrics */}
      <div className="grid-cols-4">
        <div className="telemetry-widget">
          <span className="micro-label">TOTAL RELIEF CARGO</span>
          <div className="telemetry-num mint">{totalQuantity.toLocaleString()}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Registered aid units</div>
        </div>

        <div className="telemetry-widget">
          <span className="micro-label">AID CONSIGNMENTS</span>
          <div className="telemetry-num cyan">{donations.length}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Dispatched shipments</div>
        </div>

        <div className="telemetry-widget">
          <span className="micro-label">CRYPTOGRAPHIC PROOFS</span>
          <div className="telemetry-num violet">{donations.length}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Verified on audit ledger</div>
        </div>

        <div className="telemetry-widget">
          <span className="micro-label">AUDIT INTEGRITY</span>
          <div className="telemetry-num amber">100%</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tamper-evident verification</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="spatial-panel"
        style={{
          padding: '1rem 1.5rem',
          background: 'rgba(9, 14, 25, 0.92)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <input
          type="text"
          className="form-input"
          style={{ maxWidth: '280px', padding: '0.45rem 0.85rem', fontSize: '0.82rem' }}
          placeholder="Search by donor, item, destination..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <select
          className="form-select"
          style={{ width: 'auto', padding: '0.45rem 0.85rem', fontSize: '0.82rem' }}
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="ALL">All Aid Categories</option>
          <option value="Medical Supplies">Medical Supplies</option>
          <option value="Food & Water">Food & Water</option>
          <option value="Emergency Power">Emergency Power</option>
          <option value="Blankets & Shelter">Blankets & Shelter</option>
          <option value="Rescue Equipment">Rescue Equipment</option>
        </select>
      </div>

      {/* Loading / Error / Empty States */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '3.5rem 0', color: 'var(--text-muted)' }}>
          <div className="live-beacon-pulse" style={{ width: 22, height: 22, margin: '0 auto 1rem' }} />
          <span>Synchronizing donation manifests from MongoDB Atlas...</span>
        </div>
      )}

      {error && !loading && (
        <div style={{ padding: '1rem', background: 'rgba(255, 46, 77, 0.1)', border: '1px solid var(--border-red)', borderRadius: 'var(--radius-sm)', color: '#ff8597', textAlign: 'center' }}>
          {error}
        </div>
      )}

      {!loading && !error && filteredDonations.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎁</div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#ffffff' }}>No Donations Found</div>
          <div style={{ fontSize: '0.82rem' }}>No relief aid records match the active query.</div>
        </div>
      )}

      {/* In-Kind Donations Spatial Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
        {filteredDonations.map((don) => (
          <div
            key={don._id}
            className="spatial-panel spatial-panel-hoverable"
            style={{
              padding: '1.35rem',
              background: 'rgba(11, 17, 30, 0.88)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span className="badge badge-success">
                  {don.type?.toUpperCase() || 'RELIEF AID'}
                </span>
                <span className="micro-label" style={{ color: 'var(--cyan)' }}>
                  {don.status || 'Verified'}
                </span>
              </div>

              <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#ffffff', marginBottom: '0.35rem' }}>
                {don.resourceName}
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginBottom: '0.75rem' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.5rem', color: 'var(--mint)' }}>
                  {don.quantity}
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {don.unit || 'units'}
                </span>
              </div>

              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.65rem 0.85rem',
                  marginBottom: '1rem',
                  fontSize: '0.78rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.3rem',
                }}
              >
                <div>👤 Donor / Source: <strong style={{ color: '#ffffff' }}>{don.donor}</strong></div>
                <div>📍 Destination: <strong style={{ color: 'var(--cyan)' }}>{don.destination}</strong></div>
                {don.blockchainTransactionId && (
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--violet)' }}>
                    TXN: {don.blockchainTransactionId}
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedReceipt({
                transactionId: don.blockchainTransactionId || `TXN-${don._id}`,
                entityType: 'Donation',
                donorOrSource: don.donor,
                destination: don.destination,
                resourceName: don.resourceName,
                quantity: don.quantity,
                unit: don.unit || 'units',
                status: don.status || 'Verified on Ledger',
                timestamp: don.createdAt,
              })}
              className="btn btn-secondary btn-sm"
              style={{ width: '100%' }}
            >
              🔒 View Cryptographic Receipt
            </button>
          </div>
        ))}
      </div>

      {/* Register Donation Modal */}
      {isFormOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1100,
            background: 'rgba(5, 8, 14, 0.85)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.25rem',
          }}
        >
          <div
            className="spatial-panel"
            style={{
              width: '100%',
              maxWidth: '520px',
              border: '1px solid var(--border-highlight)',
              boxShadow: 'var(--glow-cyan)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <span className="micro-label" style={{ color: 'var(--cyan)' }}>HUMANITARIAN INTAKE</span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>Log In-Kind Aid Donation</h3>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {formError && (
              <div style={{ padding: '0.65rem 1rem', background: 'rgba(255, 46, 77, 0.15)', border: '1px solid var(--border-red)', borderRadius: 'var(--radius-xs)', color: '#ff8597', fontSize: '0.8rem', marginBottom: '1rem' }}>
                ⚠️ {formError}
              </div>
            )}

            <form onSubmit={handleDonationSubmit}>
              <div className="form-group">
                <label className="form-label">Donor Name / Agency</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={formData.donor}
                  onChange={(e) => setFormData({ ...formData, donor: e.target.value })}
                  placeholder="e.g. Red Cross India or Priya Nair"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Relief Item Category</label>
                <select
                  className="form-select"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="Medical Supplies">Medical Supplies</option>
                  <option value="Food & Water">Food & Water</option>
                  <option value="Emergency Power">Emergency Power</option>
                  <option value="Blankets & Shelter">Blankets & Shelter</option>
                  <option value="Rescue Equipment">Rescue Equipment</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Item Description & Specifications</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={formData.resourceName}
                  onChange={(e) => setFormData({ ...formData, resourceName: e.target.value })}
                  placeholder="e.g. 500 First Aid Trauma Packs with Antiseptics"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    className="form-input"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Packaging Unit</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="kits, boxes, pallets"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Destination Relief Hub</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={formData.destination}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  placeholder="e.g. Central University Indoor Stadium"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                >
                  {submitting ? 'Minting Block...' : 'Submit & Mint Proof'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Blockchain Receipt Modal */}
      {selectedReceipt && (
        <BlockchainReceiptModal
          item={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </div>
  );
};

export default DonationsPage;
