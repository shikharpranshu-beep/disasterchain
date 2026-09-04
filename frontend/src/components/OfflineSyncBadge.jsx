import React, { useState, useEffect } from 'react';
import offlineSyncService from '../services/offlineSyncService';
import { useTranslation } from '../i18n/i18n';
import Icon from './Icons';

/**
 * Offline Synchronization Status Badge & Control
 * Renders status states: ONLINE | OFFLINE | SYNCING | SYNCED | PENDING
 */
const OfflineSyncBadge = () => {
  const { t } = useTranslation();
  const [syncState, setSyncState] = useState(offlineSyncService.getState());

  useEffect(() => {
    const unsubscribe = offlineSyncService.subscribe((state) => {
      setSyncState(state);
    });
    return () => unsubscribe();
  }, []);

  const handleManualSync = () => {
    if (syncState.isOnline && !syncState.status.includes('SYNCING')) {
      offlineSyncService.syncPendingQueue();
    }
  };

  const getStatusConfig = () => {
    switch (syncState.status) {
      case 'OFFLINE':
        return {
          label: t('common.offline', 'OFFLINE MODE'),
          color: '#E53935',
          bg: 'rgba(229, 57, 53, 0.15)',
          border: 'rgba(229, 57, 53, 0.4)',
          icon: 'alert',
          tooltip: 'Offline: New SOS and reports are queued locally in browser storage.',
        };
      case 'SYNCING':
        return {
          label: t('common.syncing', 'SYNCING DISPATCHES...'),
          color: '#FF8A3D',
          bg: 'rgba(255, 138, 61, 0.15)',
          border: 'rgba(255, 138, 61, 0.4)',
          icon: 'refresh',
          tooltip: 'Transmitting queued emergency records to live database...',
        };
      case 'SYNCED':
        return {
          label: t('common.synced', 'DISPATCHES SYNCED'),
          color: '#84CC16',
          bg: 'rgba(132, 204, 22, 0.15)',
          border: 'rgba(132, 204, 22, 0.4)',
          icon: 'check',
          tooltip: 'All local emergency dispatches verified by server.',
        };
      case 'PENDING':
        return {
          label: `${syncState.pendingCount} ${t('common.pending', 'QUEUED (PENDING)')}`,
          color: '#F59E0B',
          bg: 'rgba(245, 158, 11, 0.15)',
          border: 'rgba(245, 158, 11, 0.4)',
          icon: 'clock',
          tooltip: `${syncState.pendingCount} record(s) queued. Will transmit automatically.`,
        };
      case 'ONLINE':
      default:
        return {
          label: t('common.online', 'NETWORK SYNCED'),
          color: '#84CC16',
          bg: 'rgba(132, 204, 22, 0.08)',
          border: 'rgba(132, 204, 22, 0.25)',
          icon: 'check',
          tooltip: 'Live connection to DisasterChain operational network.',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        borderRadius: '20px',
        background: config.bg,
        border: `1px solid ${config.border}`,
        fontSize: '0.75rem',
        fontWeight: '700',
        letterSpacing: '0.04em',
        color: config.color,
        fontFamily: 'monospace',
        cursor: syncState.pendingCount > 0 && syncState.isOnline ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
      }}
      title={config.tooltip}
      onClick={syncState.pendingCount > 0 && syncState.isOnline ? handleManualSync : undefined}
    >
      <span
        style={{
          width: '7px',
          height: '7px',
          borderRadius: '50%',
          background: config.color,
          boxShadow: `0 0 8px ${config.color}`,
          display: 'inline-block',
          animation: syncState.status === 'SYNCING' || syncState.status === 'OFFLINE' ? 'pulse 1.5s infinite' : 'none',
        }}
      />
      <span>{config.label}</span>
      {syncState.pendingCount > 0 && syncState.isOnline && (
        <span
          style={{
            marginLeft: '4px',
            textDecoration: 'underline',
            fontSize: '0.7rem',
            opacity: 0.9,
          }}
        >
          [SYNC]
        </span>
      )}
    </div>
  );
};

export default OfflineSyncBadge;
