import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ onOpenSos }) => {
  const { user, isAuthenticated, isAdmin, logout, demoLogin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header
      style={{
        height: '70px',
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2rem',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #ef4444, #6366f1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
              boxShadow: '0 0 12px rgba(239, 68, 68, 0.4)',
            }}
          >
            ⛓️
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>DisasterChain</span>
              <span className="pulse-indicator" title="Live Network Active"></span>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1 }}>
              Transparent Emergency Response
            </div>
          </div>
        </Link>
      </div>

      {/* Quick Action & User Menu */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Quick Emergency SOS Trigger */}
        <button
          onClick={onOpenSos}
          className="btn btn-sos"
          style={{ fontSize: '0.85rem' }}
        >
          🚨 SUBMIT SOS
        </button>

        <Link to="/offline" className="btn btn-outline" style={{ fontSize: '0.82rem', padding: '0.5rem 0.9rem' }}>
          📡 Low-Connectivity
        </Link>

        {isAuthenticated ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid var(--border-subtle)',
                padding: '0.4rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
              }}
            >
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: isAdmin ? 'var(--accent-indigo)' : 'var(--accent-cyan)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                }}
              >
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user?.name}</div>
                <div style={{ fontSize: '0.7rem', color: isAdmin ? 'var(--accent-amber)' : 'var(--accent-cyan)', textTransform: 'capitalize' }}>
                  {isAdmin ? '🛡️ Administrator' : '🎓 Student'}
                </div>
              </div>
            </div>
            <button onClick={handleLogout} className="btn btn-outline" style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}>
              Logout
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <button
              onClick={() => demoLogin('student')}
              className="btn btn-secondary"
              style={{ fontSize: '0.82rem', padding: '0.5rem 0.85rem' }}
              title="One-click demo student login"
            >
              Demo Student
            </button>
            <button
              onClick={() => demoLogin('admin')}
              className="btn btn-secondary"
              style={{ fontSize: '0.82rem', padding: '0.5rem 0.85rem' }}
              title="One-click demo admin login"
            >
              Demo Admin
            </button>
            <Link to="/login" className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
              Sign In
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
