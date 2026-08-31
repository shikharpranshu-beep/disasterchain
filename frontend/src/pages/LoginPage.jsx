import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, demoLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      if (result.user?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } else {
      setError(result.message || 'Login failed. Please check credentials.');
    }
  };

  const handleDemo = async (role) => {
    setError('');
    setLoading(true);
    const result = await demoLogin(role);
    setLoading(false);
    if (result.success) {
      if (role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }
  };

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 70px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
    >
      <div
        className="glass-card"
        style={{
          maxWidth: '440px',
          width: '100%',
          padding: '2.5rem 2rem',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #ef4444, #6366f1)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              marginBottom: '0.75rem',
            }}
          >
            ⛓️
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem' }}>
            Sign In to DisasterChain
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Access emergency response tools & transparent records
          </p>
        </div>

        {error && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              padding: '0.65rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              marginBottom: '1.25rem',
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* 1-Click Demo Logins */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textAlign: 'center' }}>
            ⚡ Instant Evaluation Demo Accounts:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
            <button
              type="button"
              onClick={() => handleDemo('student')}
              className="btn btn-secondary"
              style={{ fontSize: '0.82rem', padding: '0.6rem 0.5rem' }}
            >
              🎓 Student Demo
            </button>
            <button
              type="button"
              onClick={() => handleDemo('admin')}
              className="btn btn-secondary"
              style={{ fontSize: '0.82rem', padding: '0.6rem 0.5rem', borderColor: 'rgba(99, 102, 241, 0.4)' }}
            >
              🛡️ Admin Demo
            </button>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1.5rem',
            color: 'var(--text-muted)',
            fontSize: '0.75rem',
          }}
        >
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
          <span>OR SIGN IN WITH EMAIL</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              required
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. student@disasterchain.org"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              required
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--accent-indigo)', fontWeight: 600 }}>
            Register as Student
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
