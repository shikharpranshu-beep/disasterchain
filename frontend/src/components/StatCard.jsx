import React from 'react';

const StatCard = ({ title, value, subtitle, icon, color = 'indigo', badge }) => {
  const colorMap = {
    red: { bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.3)', text: '#f87171' },
    amber: { bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.3)', text: '#fbbf24' },
    green: { bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.3)', text: '#34d399' },
    indigo: { bg: 'rgba(99, 102, 241, 0.12)', border: 'rgba(99, 102, 241, 0.3)', text: '#818cf8' },
    cyan: { bg: 'rgba(6, 182, 212, 0.12)', border: 'rgba(6, 182, 212, 0.3)', text: '#38bdf8' },
  };

  const theme = colorMap[color] || colorMap.indigo;

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          {title}
        </span>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: theme.bg,
            border: `1px solid ${theme.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.2rem',
          }}
        >
          {icon}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
        <span style={{ fontSize: '1.9rem', fontWeight: 800, color: theme.text, letterSpacing: '-0.02em' }}>
          {value}
        </span>
        {badge && (
          <span className={`badge badge-${color}`}>
            {badge}
          </span>
        )}
      </div>

      {subtitle && (
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          {subtitle}
        </div>
      )}
    </div>
  );
};

export default StatCard;
