import React from 'react';
import Icon from './Icons';

const StatCard = ({ title, value, subtitle, icon, color = 'indigo', badge }) => {
  const colorMap = {
    red: {
      bg: 'rgba(255, 51, 75, 0.12)',
      border: 'rgba(255, 51, 75, 0.4)',
      text: '#ff4d63',
      glow: 'rgba(255, 51, 75, 0.3)',
      badgeClass: 'badge-critical',
    },
    amber: {
      bg: 'rgba(245, 158, 11, 0.12)',
      border: 'rgba(245, 158, 11, 0.4)',
      text: '#fbbf24',
      glow: 'rgba(245, 158, 11, 0.3)',
      badgeClass: 'badge-warning',
    },
    green: {
      bg: 'rgba(16, 185, 129, 0.12)',
      border: 'rgba(16, 185, 129, 0.4)',
      text: '#34d399',
      glow: 'rgba(16, 185, 129, 0.3)',
      badgeClass: 'badge-success',
    },
    indigo: {
      bg: 'rgba(99, 102, 241, 0.12)',
      border: 'rgba(99, 102, 241, 0.4)',
      text: '#818cf8',
      glow: 'rgba(99, 102, 241, 0.3)',
      badgeClass: 'badge-blockchain',
    },
    cyan: {
      bg: 'rgba(6, 182, 212, 0.12)',
      border: 'rgba(6, 182, 212, 0.4)',
      text: '#38bdf8',
      glow: 'rgba(6, 182, 212, 0.3)',
      badgeClass: 'badge-info',
    },
  };

  const theme = colorMap[color] || colorMap.indigo;

  const renderIcon = () => {
    if (!icon) return <Icon name="activity" size={20} color={theme.text} />;
    if (typeof icon === 'string' && icon.length <= 4 && !icon.includes('-')) {
      return <span style={{ fontSize: '1.25rem' }}>{icon}</span>;
    }
    return <Icon name={icon} size={20} color={theme.text} />;
  };

  return (
    <div
      className="glass-card glass-card-hoverable"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem',
        position: 'relative',
        overflow: 'hidden',
        borderLeft: `4px solid ${theme.text}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {title}
        </span>
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: theme.bg,
            border: `1px solid ${theme.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 0 14px ${theme.glow}`,
          }}
        >
          {renderIcon()}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.65rem' }}>
        <span style={{ fontSize: '2.1rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.03em', lineHeight: 1 }}>
          {value}
        </span>
        {badge && (
          <span className={`badge ${theme.badgeClass}`} style={{ fontSize: '0.68rem', padding: '0.2rem 0.55rem' }}>
            {badge}
          </span>
        )}
      </div>

      {subtitle && (
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4, marginTop: 'auto' }}>
          {subtitle}
        </div>
      )}
    </div>
  );
};

export default StatCard;
