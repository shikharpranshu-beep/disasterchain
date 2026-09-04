import React from 'react';
import { usePWA } from '../context/PWAContext';
import Icon from './Icons';

/**
 * PWA Update Notification Toast
 * Renders when a new service worker version is waiting to activate.
 * Prompts: "NEW VERSION AVAILABLE — Refresh to update DisasterChain."
 */
const PWAUpdateToast = () => {
  const { isUpdateAvailable, triggerUpdate } = usePWA();

  if (!isUpdateAvailable) {
    return null;
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        position: 'fixed',
        top: 'calc(16px + env(safe-area-inset-top, 0px))',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 99999,
        maxWidth: '92vw',
        width: '440px',
        backgroundColor: 'rgba(28, 17, 13, 0.98)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid #FF6B2C',
        borderRadius: '12px',
        padding: '12px 16px',
        boxShadow: '0 10px 35px rgba(0,0,0,0.8), 0 0 20px rgba(255, 107, 44, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        animation: 'slideDown 0.3s ease-out',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'rgba(255, 107, 44, 0.15)',
            border: '1px solid rgba(255, 107, 44, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon name="refresh" size={16} color="#FF6B2C" />
        </div>
        <div>
          <div
            style={{
              fontSize: '0.80rem',
              fontWeight: '800',
              letterSpacing: '0.05em',
              color: '#FF8A3D',
              fontFamily: 'var(--font-heading, sans-serif)',
            }}
          >
            NEW VERSION AVAILABLE
          </div>
          <div style={{ fontSize: '0.74rem', color: '#B0A099', marginTop: '1px' }}>
            Refresh to update DisasterChain.
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={triggerUpdate}
        style={{
          background: 'linear-gradient(135deg, #FF6B2C, #F59E0B)',
          border: 'none',
          color: '#120B08',
          fontSize: '0.76rem',
          fontWeight: '800',
          padding: '7px 14px',
          borderRadius: '8px',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          flexShrink: 0,
          minHeight: '36px',
        }}
      >
        Refresh
      </button>
    </div>
  );
};

export default PWAUpdateToast;
