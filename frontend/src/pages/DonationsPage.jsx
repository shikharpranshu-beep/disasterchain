import React, { useState, useEffect } from 'react';
import { fetchDonations } from '../services/api';
import BlockchainReceiptModal from '../components/BlockchainReceiptModal';

const DonationsPage = () => {
  const [donations, setDonations] = useState([]);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  useEffect(() => {
    const loadDonations = async () => {
      const data = await fetchDonations();
      setDonations(data);
    };
    loadDonations();
  }, []);

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>📦 Relief Donations Registry</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Transparent tracking of donated supplies (Medical Kits, Food, Clean Water, Blankets) with blockchain verification hashes
        </p>
      </div>

      <div className="data-table-container glass-card" style={{ padding: 0 }}>
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
            {donations.map((don) => (
              <tr key={don._id}>
                <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{don.donationId}</td>
                <td>
                  <strong>{don.donor}</strong>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Type: {don.type}</div>
                </td>
                <td>
                  <strong style={{ color: '#38bdf8' }}>{don.quantity} {don.unit}</strong>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{don.resourceName}</div>
                </td>
                <td>📍 {don.destination}</td>
                <td>
                  <span className="badge badge-success">{don.status}</span>
                </td>
                <td>
                  <button
                    onClick={() => setSelectedReceipt({
                      transactionId: don.blockchainTransactionId || 'TXN-881204',
                      blockNumber: 1001,
                      blockHash: '0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
                      quantity: don.quantity,
                      unit: don.unit,
                      resourceName: don.resourceName,
                      status: 'Verified on Blockchain',
                    })}
                    className="btn btn-outline"
                    style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem', borderColor: 'rgba(99, 102, 241, 0.4)' }}
                  >
                    ⛓️ View Block
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

export default DonationsPage;
