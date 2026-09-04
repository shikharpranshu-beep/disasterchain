import React from 'react';
import { usePWA } from '../context/PWAContext';
import Icon from './Icons';

/**
 * Global Tactical Network Connectivity Indicator
 * Displays:
 * - LIVE (green pulse) when connected
 * - OFFLINE (red/amber indicator) when disconnected
 * - RECONNECTED (emerald flash) when connectivity is restored
 */
const NetworkStatusIndicator = ({ showLabel = true, className = '' }) => {
  const { networkStatus, hasCachedData } = usePWA();

  const getStatusConfig = () => {
    switch (networkStatus) {
      case 'OFFLINE':
        return {
          label: 'OFFLINE',
          color: '#E53935',
          bg: 'rgba(229, 57, 53, 0.16)',
          border: 'rgba(229, 57, 53, 0.45)',
          dotClass: 'status-dot-offline',
          icon: 'alert',
          tooltip: 'Offline Mode: Live backend unavailable. Local survival guide active.',
        };
      case 'RECONNECTED':
        return {
          label: 'RECONNECTED',
          color: '#10B981',
          bg: 'rgba(16, 185, 129, 0.18)',
          border: 'rgba(16, 185, 129, 0.55)',
          dotClass: 'status-dot-reconnected',
          icon: 'check',
          tooltip: 'Connection Restored: Resuming live crisis intelligence sync.',
        };
      case 'LIVE':
      default:
        return {
          label: 'LIVE',
          color: '#84CC16',
          bg: 'rgba(132, 204, 22, 0.10)',
          border: 'rgba(132, 204, 22, 0.32)',
          dotClass: 'status-dot-live',
          icon: 'check',
          tooltip: 'Live: Real-time connection to DisasterChain emergency command network.',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
      <div
        className={`network-status-indicator ${className}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '3px 9px',
          borderRadius: '16px',
          background: config.bg,
          border: `1px solid ${config.border}`,
          fontSize: '0.70rem',
          fontWeight: '700',
          letterSpacing: '0.06em',
          color: config.color,
          fontFamily: 'var(--font-mono, monospace)',
          lineHeight: 1,
          transition: 'all 0.3s ease',
          cursor: 'default',
          userSelect: 'none',
        }}
        title={config.tooltip}
        aria-label={`Network status: ${networkStatus}`}
      >
        <span
          style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            backgroundColor: config.color,
            boxShadow: `0 0 6px ${config.color}`,
            display: 'inline-block',
            animation: networkStatus === 'OFFLINE' ? 'pulse 1.5s infinite' : 'none',
          }}
        />
        {showLabel && <span>{config.label}</span>}
      </div>

      {/* Clear CACHED DATA indicator when operational records are served from local SW cache */}
      {(hasCachedData || networkStatus === 'OFFLINE') && (
        <span
          style={{
            fontSize: '0.62rem',
            fontFamily: 'var(--font-mono, monospace)',
            fontWeight: '800',
            letterSpacing: '0.04em',
            padding: '2px 6px',
            borderRadius: '10px',
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.45)',
            color: '#F59E0B',
            lineHeight: 1,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
          }}
          title="CACHED DATA: Stored telemetry shown for safety while network is disconnected."
        >
          <span>📦</span>
          <span>CACHED DATA</span>
        </span>
      )}
    </div>
  );
};

export default NetworkStatusIndicator;
