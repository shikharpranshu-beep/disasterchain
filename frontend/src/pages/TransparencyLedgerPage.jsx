import React, { useState, useEffect } from 'react';
import { fetchBlockchainTransactions } from '../services/api';
import BlockchainReceiptModal from '../components/BlockchainReceiptModal';

const TransparencyLedgerPage = () => {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  useEffect(() => {
    const loadLedger = async () => {
      const data = await fetchBlockchainTransactions();
      setRecords(data);
    };
    loadLedger();
  }, []);

  const filteredRecords = records.filter((r) => {
    const s = search.toLowerCase();
    return (
      r.transactionId?.toLowerCase().includes(s) ||
      r.resourceName?.toLowerCase().includes(s) ||
      r.donorOrSource?.toLowerCase().includes(s) ||
      r.destination?.toLowerCase().includes(s) ||
      r.blockHash?.toLowerCase().includes(s)
    );
  });

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <div className="badge badge-blockchain" style={{ marginBottom: '0.4rem' }}>
          ⛓️ PROTOTYPE CRYPTOGRAPHIC AUDIT LEDGER
        </div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Blockchain Transparency Ledger</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Every donation and distribution event is cryptographically hashed with SHA-256 to provide an immutable, public audit trail
        </p>
      </div>

      {/* Explanation Banner */}
      <div
        className="glass-card"
        style={{
          background: 'rgba(99, 102, 241, 0.1)',
          borderColor: 'rgba(99, 102, 241, 0.3)',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
        }}
      >
        <span style={{ fontSize: '2rem' }}>🛡️</span>
        <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
          <strong style={{ color: '#ffffff' }}>Why is this transaction recorded?</strong><br />
          This record provides a transparent verification reference for humanitarian resource allocations. It ensures every relief shipment can be verified by students, donors, and relief coordinators with cryptographic proof.
        </div>
      </div>

      {/* Search Input */}
      <div style={{ marginBottom: '1.25rem' }}>
        <input
          type="text"
          className="form-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Search by Transaction ID, Resource, Donor, Shelter destination, or Block Hash..."
        />
      </div>

      {/* Ledger Table */}
      <div className="data-table-container glass-card" style={{ padding: 0 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Txn ID & Block</th>
              <th>Entity</th>
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
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#818cf8' }}>
                    {r.transactionId}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Block #{r.blockNumber || 1001}
                  </div>
                </td>
                <td>
                  <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                    {r.entityType || 'Donation'}
                  </span>
                </td>
                <td>
                  <strong>{r.quantity} {r.unit || 'units'}</strong>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{r.resourceName}</div>
                </td>
                <td>{r.donorOrSource}</td>
                <td>📍 {r.destination}</td>
                <td>
                  <span className="badge badge-success">{r.status}</span>
                </td>
                <td>
                  <button
                    onClick={() => setSelectedReceipt(r)}
                    className="btn btn-outline"
                    style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', borderColor: 'rgba(99, 102, 241, 0.4)' }}
                  >
                    View Blockchain Record ⛓️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <BlockchainReceiptModal
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        record={selectedReceipt}
      />
    </div>
  );
};

export default TransparencyLedgerPage;
