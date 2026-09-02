import React, { useState, useEffect, useMemo } from 'react';
import { fetchBlockchainTransactions } from '../services/api';
import BlockchainReceiptModal from '../components/BlockchainReceiptModal';
import Icon from '../components/Icons';

const TransparencyLedgerPage = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterEntity, setFilterEntity] = useState('ALL');
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const loadLedger = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchBlockchainTransactions();
      setRecords(data || []);
    } catch (err) {
      console.error('Error loading blockchain ledger:', err);
      setError('Unable to load transparency ledger from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLedger();
  }, []);

  const handleCopyId = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (filterEntity !== 'ALL' && r.entityType !== filterEntity) return false;

      if (search.trim()) {
        const s = search.toLowerCase();
        const matchesId = r.transactionId?.toLowerCase().includes(s);
        const matchesResource = r.resourceName?.toLowerCase().includes(s);
        const matchesDonor = r.donorOrSource?.toLowerCase().includes(s);
        const matchesDest = r.destination?.toLowerCase().includes(s);
        const matchesHash = r.blockHash?.toLowerCase().includes(s);
        if (!matchesId && !matchesResource && !matchesDonor && !matchesDest && !matchesHash) {
          return false;
        }
      }

      return true;
    });
  }, [records, filterEntity, search]);

  const totalAllocations = records.reduce((acc, r) => acc + (Number(r.quantity) || 0), 0);
  const totalVerifiedBlocks = records.length;
  const donationBlocksCount = records.filter((r) => r.entityType === 'Donation').length;
  const distributionBlocksCount = records.filter((r) => r.entityType === 'Distribution').length;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="badge badge-blockchain" style={{ marginBottom: '0.4rem' }}>
            <Icon name="blockchain" size={13} color="var(--accent-indigo)" />
            <span>CRYPTOGRAPHIC TAMPER-EVIDENT AUDIT TRAIL</span>
          </div>
          <h1 className="page-header-title">
            <Icon name="ledger" size={26} color="var(--accent-indigo)" />
            <span>Blockchain Transparency Ledger</span>
          </h1>
          <p className="page-header-subtitle">
            Every disaster relief donation and distribution event is hashed with SHA-256 to provide an immutable public verification ledger
          </p>
        </div>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid-cols-4" style={{ marginBottom: '1.75rem' }}>
        <div className="glass-card" style={{ borderLeft: '4px solid #6366f1' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase' }}>
            Minted Audit Blocks
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#818cf8', margin: '0.35rem 0 0.15rem' }}>
            {totalVerifiedBlocks}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Total SHA-256 blocks
          </div>
        </div>

        <div className="glass-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase' }}>
            Verified Relief Units
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#34d399', margin: '0.35rem 0 0.15rem' }}>
            {totalAllocations.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Supplies logged on ledger
          </div>
        </div>

        <div className="glass-card" style={{ borderLeft: '4px solid #38bdf8' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase' }}>
            Donation Blocks
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#38bdf8', margin: '0.35rem 0 0.15rem' }}>
            {donationBlocksCount}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            In-kind intake receipts
          </div>
        </div>

        <div className="glass-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase' }}>
            Distribution Blocks
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fbbf24', margin: '0.35rem 0 0.15rem' }}>
            {distributionBlocksCount}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Handoffs & shelter arrivals
          </div>
        </div>
      </div>

      {/* Explanation Banner */}
      <div
        className="glass-card"
        style={{
          background: 'rgba(99, 102, 241, 0.08)',
          borderColor: 'rgba(99, 102, 241, 0.35)',
          marginBottom: '1.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1.15rem',
        }}
      >
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'rgba(99, 102, 241, 0.15)',
            border: '1px solid rgba(99, 102, 241, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon name="shield-check" size={24} color="#818cf8" />
        </div>
        <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
          <strong style={{ color: '#ffffff' }}>Why is every relief allocation cryptographically logged?</strong><br />
          This public ledger provides transparent verification for humanitarian resource allocations. It ensures every relief shipment can be verified by students, donors, and relief coordinators with tamper-resistant SHA-256 cryptographic proof.
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="filter-toolbar" style={{ marginBottom: '1.5rem' }}>
        <div className="filter-group">
          <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Entity Type:</span>
          <select
            className="form-select"
            style={{ width: 'auto', padding: '0.45rem 0.85rem', fontSize: '0.84rem' }}
            value={filterEntity}
            onChange={(e) => setFilterEntity(e.target.value)}
          >
            <option value="ALL">All Block Types ({records.length})</option>
            <option value="Donation">Donation Intakes</option>
            <option value="Distribution">Distribution Handoffs</option>
            <option value="ShelterAllocation">Shelter Allocations</option>
            <option value="EmergencySupply">Emergency Supplies</option>
          </select>
        </div>

        <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: '360px' }}>
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.2rem', paddingRight: '0.75rem', fontSize: '0.84rem', height: '36px' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Transaction ID, item, donor, hash..."
          />
          <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
            <Icon name="search" size={14} />
          </span>
        </div>

        <div style={{ marginLeft: 'auto', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
          Showing <strong>{filteredRecords.length}</strong> of <strong>{records.length}</strong> ledger records
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
          <div style={{ fontWeight: 700, fontSize: '1rem', color: '#ffffff' }}>Loading Blockchain Ledger Blocks...</div>
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
          <button onClick={loadLedger} className="btn btn-secondary btn-sm" style={{ marginTop: '0.75rem' }}>
            Retry Loading Ledger
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredRecords.length === 0 && (
        <div
          className="glass-card"
          style={{
            textAlign: 'center',
            padding: '3.5rem 1.5rem',
            color: 'var(--text-muted)',
          }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>⛓️</div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.35rem' }}>
            No Ledger Records Found
          </h3>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 1.25rem' }}>
            No blockchain transaction records match your search criteria.
          </p>
          <button
            onClick={() => {
              setFilterEntity('ALL');
              setSearch('');
            }}
            className="btn btn-secondary btn-sm"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Ledger Table */}
      {!loading && !error && filteredRecords.length > 0 && (
        <div className="data-table-container glass-card" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Txn ID & Block</th>
                <th>Entity Type</th>
                <th>Resource Details</th>
                <th>Source / Donor</th>
                <th>Destination</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((r) => (
                <tr key={r._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#818cf8' }}>
                        {r.transactionId}
                      </span>
                      <button
                        onClick={() => handleCopyId(r.transactionId)}
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '0.1rem 0.35rem', fontSize: '0.65rem' }}
                        title="Copy Transaction ID"
                      >
                        <Icon name={copiedId === r.transactionId ? 'check' : 'copy'} size={11} color={copiedId === r.transactionId ? '#34d399' : '#94a3b8'} />
                      </button>
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      Block #{r.blockNumber || 1001}
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                      {r.entityType || 'Donation'}
                    </span>
                  </td>
                  <td>
                    <strong style={{ color: '#ffffff' }}>{Number(r.quantity).toLocaleString()} {r.unit || 'units'}</strong>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{r.resourceName}</div>
                  </td>
                  <td>{r.donorOrSource}</td>
                  <td>📍 {r.destination}</td>
                  <td>
                    <span className="badge badge-success">{r.status || 'Verified'}</span>
                  </td>
                  <td>
                    <button
                      onClick={() => setSelectedReceipt(r)}
                      className="btn btn-outline btn-sm"
                      style={{ borderColor: 'rgba(99, 102, 241, 0.4)', color: '#a5b4fc', fontSize: '0.74rem' }}
                    >
                      <Icon name="blockchain" size={13} color="#818cf8" />
                      <span>View Proof</span>
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

export default TransparencyLedgerPage;
