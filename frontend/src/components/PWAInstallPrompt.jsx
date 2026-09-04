import React from 'react';
import { usePWA } from '../context/PWAContext';
import Icon from './Icons';

/**
 * Mobile PWA Install Prompt Banner
 * Unobtrusive prompt complying with:
 * "INSTALL DISASTERCHAIN"
 * "Install DisasterChain for faster emergency access."
 * Buttons: Install / Not now
 * Stored locally to avoid repeated interruptions.
 */
const PWAInstallPrompt = () => {
  const { isInstallable, isInstalled, isDismissed, promptInstall, dismissInstallPrompt } = usePWA();

  // If not installable, already installed, or previously dismissed by user, do not render
  if (!isInstallable || isInstalled || isDismissed) {
    return null;
  }

  const handleInstallClick = async () => {
    await promptInstall();
  };

  return (
    <aside
      className="pwa-install-banner"
      role="region"
      aria-label="Install DisasterChain Application"
      style={{
        position: 'fixed',
        bottom: 'calc(68px + env(safe-area-inset-bottom, 0px))',
        left: '12px',
        right: '12px',
        zIndex: 9990,
        backgroundColor: 'rgba(28, 17, 13, 0.96)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 107, 44, 0.45)',
        borderRadius: '14px',
        padding: '12px 14px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.65), 0 0 15px rgba(255, 107, 44, 0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        animation: 'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* Icon + Information */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
        <img
          src="/icon-192.png"
          alt="DisasterChain Logo"
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            border: '1px solid rgba(255, 107, 44, 0.4)',
            flexShrink: 0,
            objectFit: 'cover',
          }}
        />
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: '0.85rem',
              fontWeight: '800',
              letterSpacing: '0.04em',
              color: '#FFF',
              fontFamily: 'var(--font-heading, sans-serif)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            INSTALL DISASTERCHAIN
          </div>
          <div
            style={{
              fontSize: '0.74rem',
              color: 'var(--text-secondary, #A08D85)',
              lineHeight: 1.25,
              marginTop: '2px',
            }}
          >
            Install DisasterChain for faster emergency access.
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        <button
          type="button"
          onClick={dismissInstallPrompt}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#B0A099',
            fontSize: '0.74rem',
            fontWeight: '600',
            padding: '6px 10px',
            borderRadius: '8px',
            cursor: 'pointer',
            minHeight: '34px',
          }}
        >
          Not now
        </button>

        <button
          type="button"
          onClick={handleInstallClick}
          style={{
            background: 'linear-gradient(135deg, #FF6B2C, #F59E0B)',
            border: 'none',
            color: '#120B08',
            fontSize: '0.78rem',
            fontWeight: '800',
            letterSpacing: '0.03em',
            padding: '6px 14px',
            borderRadius: '8px',
            cursor: 'pointer',
            minHeight: '34px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            boxShadow: '0 2px 10px rgba(255, 107, 44, 0.4)',
          }}
        >
          <Icon name="download" size={14} color="#120B08" />
          <span>Install</span>
        </button>
      </div>
    </aside>
  );
};

export default PWAInstallPrompt;
