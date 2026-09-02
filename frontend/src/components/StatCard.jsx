import React from 'react';
import Icon from './Icons';

const StatCard = ({ title, value, subtitle, icon, color = 'cyan', badge }) => {
  const colorMap = {
    red: {
      text: 'var(--crimson)',
      bg: 'rgba(255, 46, 77, 0.1)',
      border: 'var(--border-red)',
      glow: 'var(--glow-crimson)',
      badgeClass: 'badge-critical',
    },
    amber: {
      text: 'var(--amber)',
      bg: 'rgba(245, 158, 11, 0.1)',
      border: 'rgba(245, 158, 11, 0.3)',
      glow: 'var(--glow-amber)',
      badgeClass: 'badge-warning',
    },
    green: {
      text: 'var(--mint)',
      bg: 'rgba(16, 185, 129, 0.1)',
      border: 'var(--border-mint)',
      glow: '0 0 16px rgba(16, 185, 129, 0.25)',
      badgeClass: 'badge-success',
    },
    indigo: {
      text: 'var(--violet)',
      bg: 'rgba(129, 140, 248, 0.1)',
      border: 'rgba(129, 140, 248, 0.3)',
      glow: 'var(--glow-violet)',
      badgeClass: 'badge-blockchain',
    },
    cyan: {
      text: 'var(--cyan)',
      bg: 'rgba(0, 240, 255, 0.1)',
      border: 'var(--border-highlight)',
      glow: 'var(--glow-cyan)',
      badgeClass: 'badge-info',
    },
  };

  const theme = colorMap[color] || colorMap.cyan;

  const renderIcon = () => {
    if (!icon) return <Icon name="activity" size={18} color={theme.text} />;
    if (typeof icon === 'string' && icon.length <= 4 && !icon.includes('-')) {
      return <span style={{ fontSize: '1.2rem' }}>{icon}</span>;
    }
    return <Icon name={icon} size={18} color={theme.text} />;
  };

  return (
    <div
      className="spatial-panel spatial-panel-hoverable"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        padding: '1.25rem 1.4rem',
        background: 'rgba(11, 17, 30, 0.88)',
        borderLeft: `4px solid ${theme.text}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="micro-label" style={{ color: 'var(--text-secondary)' }}>
          {title}
        </span>
        <div
          style={{
            width: '34px',
            height: '34px',
            borderRadius: 'var(--radius-xs)',
            background: theme.bg,
            border: `1px solid ${theme.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: theme.glow,
          }}
        >
          {renderIcon()}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.65rem' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, color: '#ffffff', lineHeight: 1 }}>
          {value}
        </span>
        {badge && (
          <span className={`badge ${theme.badgeClass}`} style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem' }}>
            {badge}
          </span>
        )}
      </div>

      {subtitle && (
        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: 1.4, marginTop: 'auto' }}>
          {subtitle}
        </div>
      )}
    </div>
  );
};

export default StatCard;
