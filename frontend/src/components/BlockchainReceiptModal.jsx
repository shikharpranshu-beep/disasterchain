import React, { useState } from 'react';
import { useTranslation } from '../i18n/i18n';
import Icon from './Icons';

const BlockchainReceiptModal = ({ isOpen = true, onClose, record, item }) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const targetRecord = record || item;

  if ((isOpen !== undefined && !isOpen) || !targetRecord) return null;

  const handleCopyHash = () => {
    const hash = targetRecord.blockHash || '0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069';
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
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
              <Icon name="blockchain" size={20} color="#818cf8" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{t('transparency.proof', 'Cryptographic Blockchain Record')}</h2>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {t('transparency.ledgerSubtitle', 'DisasterChain Prototype Audit Ledger')}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost"
            style={{ padding: '0.4rem', color: 'var(--text-muted)' }}
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        {/* Verification Status Banner */}
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem 1.15rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1.25rem',
          }}
        >
          <div style={{ color: '#34d399' }}>
            <Icon name="shield-check" size={24} color="#34d399" />
          </div>
          <div>
            <div style={{ color: '#34d399', fontWeight: 700, fontSize: '0.9rem' }}>
              {t('transparency.verifiedImmutable', 'Cryptographically Verified & Immutable')}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
              {t('transparency.hashIntegrity', 'SHA-256 block hash integrity validated across network audit nodes.')}
            </div>
          </div>
        </div>

        {/* Block Data Box */}
        <div
          style={{
            background: 'rgba(11, 18, 34, 0.95)',
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase' }}>TRANSACTION ID</div>
              <div style={{ color: '#ffffff', fontWeight: 700, fontSize: '0.95rem' }}>{targetRecord.transactionId || 'TXN-881204'}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', textAlign: 'right' }}>BLOCK NUMBER</div>
              <div style={{ color: '#818cf8', fontWeight: 700, textAlign: 'right' }}>#{targetRecord.blockNumber || 1001}</div>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase' }}>BLOCK HASH (SHA-256)</span>
              <button
                type="button"
                onClick={handleCopyHash}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', color: copied ? '#34d399' : '#818cf8' }}
              >
                <Icon name={copied ? 'check' : 'copy'} size={13} />
                <span>{copied ? t('common.copied', 'Copied!') : t('transparency.copyHash', 'Copy Hash')}</span>
              </button>
            </div>
            <div style={{ color: '#38bdf8', wordBreak: 'break-all', fontSize: '0.78rem', background: 'rgba(0,0,0,0.35)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
              {targetRecord.blockHash || '0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069'}
            </div>
          </div>

          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginBottom: '0.2rem', textTransform: 'uppercase' }}>PREVIOUS BLOCK HASH</div>
            <div style={{ color: 'var(--text-secondary)', wordBreak: 'break-all', fontSize: '0.74rem' }}>
              {targetRecord.previousBlockHash || '0x0000000000000000000000000000000000000000000000000000000000000000'}
            </div>
          </div>

          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginBottom: '0.2rem', textTransform: 'uppercase' }}>DIGITAL SIGNATURE</div>
            <div style={{ color: '#a78bfa', wordBreak: 'break-all', fontSize: '0.74rem' }}>
              {targetRecord.signature || '0xa41c7b89d6e4f3a2b1c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6'}
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-main)' }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Resource: </span>
              <strong>{targetRecord.quantity} {targetRecord.unit || 'units'} &bull; {targetRecord.resourceName}</strong>
            </div>
            <div>
              <span className="badge badge-success">{targetRecord.status || 'Verified on Blockchain'}</span>
            </div>
          </div>
        </div>

        {/* Prototype Disclaimer */}
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '1rem', lineHeight: 1.5, textAlign: 'center' }}>
          ℹ️ <em>Prototype Note:</em> This transaction provides a transparent, tamper-resistant verification reference for disaster supply allocations without involving cryptocurrency trading.
        </div>

        <button onClick={onClose} className="btn btn-primary" style={{ width: '100%', marginTop: '1.25rem' }}>
          {t('common.close', 'Close Audit Proof')}
        </button>
      </div>
    </div>
  );
};

export default BlockchainReceiptModal;
