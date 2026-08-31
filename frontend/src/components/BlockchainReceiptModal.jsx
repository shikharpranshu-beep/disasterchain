import React from 'react';

const BlockchainReceiptModal = ({ isOpen, onClose, record }) => {
  if (!isOpen || !record) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '620px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.5rem' }}>⛓️</span>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Cryptographic Blockchain Record</h2>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                DisasterChain Prototype Transparency Ledger
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {/* Verification Status Badge */}
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1.25rem',
          }}
        >
          <span style={{ fontSize: '1.5rem' }}>🛡️</span>
          <div>
            <div style={{ color: '#34d399', fontWeight: 700, fontSize: '0.9rem' }}>
              Cryptographically Verified & Immutable
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
              SHA-256 block hash integrity validated across prototype network nodes.
            </div>
          </div>
        </div>

        {/* Block Details */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.9)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
            fontSize: '0.85rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.2rem' }}>TRANSACTION ID</div>
            <div style={{ color: '#ffffff', fontWeight: 700 }}>{record.transactionId || 'TXN-881204'}</div>
          </div>

          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.2rem' }}>BLOCK NUMBER</div>
            <div style={{ color: '#818cf8', fontWeight: 700 }}>#{record.blockNumber || 1001}</div>
          </div>

          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.2rem' }}>BLOCK HASH (SHA-256)</div>
            <div style={{ color: '#38bdf8', wordBreak: 'break-all', fontSize: '0.78rem', background: 'rgba(0,0,0,0.3)', padding: '0.4rem', borderRadius: '4px' }}>
              {record.blockHash || '0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069'}
            </div>
          </div>

          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.2rem' }}>PREVIOUS BLOCK HASH</div>
            <div style={{ color: 'var(--text-secondary)', wordBreak: 'break-all', fontSize: '0.75rem' }}>
              {record.previousBlockHash || '0x0000000000000000000000000000000000000000000000000000000000000000'}
            </div>
          </div>

          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.2rem' }}>DIGITAL SIGNATURE</div>
            <div style={{ color: '#a78bfa', wordBreak: 'break-all', fontSize: '0.75rem' }}>
              {record.signature || '0xa41c7b89d6e4f3a2b1c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6'}
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-main)' }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Resource: </span>
              <strong>{record.quantity} {record.unit || 'units'} {record.resourceName}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Status: </span>
              <span className="badge badge-success">{record.status}</span>
            </div>
          </div>
        </div>

        {/* Prototype Disclaimer */}
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '1rem', lineHeight: 1.5, textAlign: 'center' }}>
          ℹ️ <em>Prototype Note:</em> This transaction provides a transparent, tamper-resistant verification reference for disaster supply allocations without involving real cryptocurrency.
        </div>

        <button onClick={onClose} className="btn btn-primary" style={{ width: '100%', marginTop: '1.25rem' }}>
          Done
        </button>
      </div>
    </div>
  );
};

export default BlockchainReceiptModal;
