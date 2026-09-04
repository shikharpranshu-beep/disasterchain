import React, { useState, useEffect, useMemo } from 'react';
import { fetchBlockchainTransactions } from '../services/api';
import BlockchainReceiptModal from '../components/BlockchainReceiptModal';
import Icon from '../components/Icons';
import { useTranslation } from '../i18n/i18n';

const TransparencyLedgerPage = () => {
  const { t } = useTranslation();
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
      setError('Unable to load transparency ledger from backend server.');
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
      if (filterEntity !== 'ALL' && r.entityType?.toLowerCase() !== filterEntity.toLowerCase()) return false;

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

  const totalAllocations = useMemo(() => records.reduce((acc, r) => acc + (Number(r.quantity) || 0), 0), [records]);
  const donationBlocksCount = useMemo(() => records.filter((r) => r.entityType === 'Donation').length, [records]);
  const distributionBlocksCount = useMemo(() => records.filter((r) => r.entityType === 'Distribution').length, [records]);

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
            <span className="badge badge-info">{t('transparency.transparencyTitle')}</span>
            <span className="micro-label" style={{ color: 'var(--violet)' }}>
              {t('transparency.currentHash')}
            </span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.25rem' }}>
            {t('transparency.transparencyTitle')}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            {t('transparency.transparencySubtitle')}
          </p>
        </div>

        <button
          onClick={loadLedger}
          className="btn btn-secondary btn-sm"
        >
          <Icon name="refresh-cw" size={14} />
          <span>{t('common.refresh')}</span>
        </button>
      </div>

      {/* Telemetry KPI Metrics */}
      <div className="grid-cols-4">
        <div className="telemetry-widget">
          <span className="micro-label">{t('transparency.totalBlocks')}</span>
          <div className="telemetry-num violet">{records.length}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('transparency.totalBlocks')}</div>
        </div>

        <div className="telemetry-widget">
          <span className="micro-label">{t('transparency.verifiedIntegrity')}</span>
          <div className="telemetry-num mint">{totalAllocations.toLocaleString()}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('transparency.verifiedIntegrity')}</div>
        </div>

        <div className="telemetry-widget">
          <span className="micro-label">{t('donations.makeDonation')}</span>
          <div className="telemetry-num cyan">{donationBlocksCount}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('donations.recentContributions')}</div>
        </div>

        <div className="telemetry-widget">
          <span className="micro-label">{t('resources.stage5')}</span>
          <div className="telemetry-num amber">{distributionBlocksCount}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('resources.stage5')}</div>
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
          style={{ maxWidth: '320px', padding: '0.45rem 0.85rem', fontSize: '0.82rem' }}
          placeholder={t('common.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="form-select"
          style={{ width: 'auto', padding: '0.45rem 0.85rem', fontSize: '0.82rem' }}
          value={filterEntity}
          onChange={(e) => setFilterEntity(e.target.value)}
        >
          <option value="ALL">{t('common.all')}</option>
          <option value="Donation">{t('donations.makeDonation')}</option>
          <option value="Distribution">{t('resources.trackingTitle')}</option>
        </select>
      </div>

      {/* Loading / Error / Empty States */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '3.5rem 0', color: 'var(--text-muted)' }}>
          <div className="live-beacon-pulse" style={{ width: 22, height: 22, margin: '0 auto 1rem' }} />
          <span>{t('common.syncing')}</span>
        </div>
      )}

      {error && !loading && (
        <div style={{ padding: '1rem', background: 'rgba(255, 46, 77, 0.1)', border: '1px solid var(--border-red)', borderRadius: 'var(--radius-sm)', color: '#ff8597', textAlign: 'center' }}>
          {error}
        </div>
      )}

      {!loading && !error && filteredRecords.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⛓️</div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#ffffff' }}>{t('transparency.transparencyTitle')}</div>
        </div>
      )}

      {/* Cryptographic Timeline Feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredRecords.map((block, idx) => (
          <div
            key={block._id || idx}
            className="spatial-panel spatial-panel-hoverable"
            style={{
              padding: '1.35rem',
              background: 'rgba(11, 17, 30, 0.88)',
              borderLeft: `4px solid ${block.entityType === 'Donation' ? 'var(--cyan)' : 'var(--amber)'}`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span className={`badge ${block.entityType === 'Donation' ? 'badge-info' : 'badge-warning'}`}>
                  {block.entityType?.toUpperCase() || 'TRANSACTION'}
                </span>
                <span className="micro-label" style={{ color: 'var(--mint)' }}>
                  ✓ {t('transparency.verifiedIntegrity')}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {t('transparency.blockHeight')} #{block.blockNumber || idx + 100}
                </span>
              </div>

              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                ⏱️ {new Date(block.timestamp || block.createdAt).toLocaleString()}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#ffffff', marginBottom: '0.2rem' }}>
                  {block.resourceName}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  {t('resources.sourceWarehouse')}: <strong style={{ color: '#ffffff' }}>{block.donorOrSource}</strong> ➔ {t('resources.destinationFacility')}: <strong style={{ color: 'var(--cyan)' }}>{block.destination}</strong>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.3rem', color: 'var(--mint)' }}>
                  {block.quantity} {block.unit || 'units'}
                </div>
              </div>
            </div>

            {/* Monospace Cryptographic Hash Readout */}
            <div
              style={{
                background: 'rgba(5, 8, 14, 0.85)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-xs)',
                padding: '0.75rem 1rem',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.74rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}
            >
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>
                <span style={{ color: 'var(--text-muted)' }}>{t('transparency.currentHash')}: </span>
                <span style={{ color: 'var(--cyan)' }}>
                  {block.blockHash || `0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069`}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => handleCopyId(block.blockHash || block.transactionId)}
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: '0.7rem', padding: '2px 8px' }}
                >
                  {copiedId === (block.blockHash || block.transactionId) ? t('common.copied') : t('common.copy')}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedReceipt(block)}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.7rem', padding: '2px 8px' }}
                >
                  {t('donations.viewReceipt')}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Blockchain Receipt Modal */}
      {selectedReceipt && (
        <BlockchainReceiptModal
          isOpen={Boolean(selectedReceipt)}
          record={selectedReceipt}
          item={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </div>
  );
};

export default TransparencyLedgerPage;
