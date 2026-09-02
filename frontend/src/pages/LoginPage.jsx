import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/Icons';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isUnverified, setIsUnverified] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [resendStatus, setResendStatus] = useState('');
  const [resending, setResending] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login, resendVerification } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsUnverified(false);
    setResendStatus('');
    setLoading(true);

    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      if (result.user?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate(from);
      }
    } else {
      if (result.isUnverified) {
        setIsUnverified(true);
        setUnverifiedEmail(result.email || email);
      }
      setError(result.message || 'Authentication rejected. Verify email and credentials.');
    }
  };

  const handleResend = async () => {
    setResending(true);
    setResendStatus('');
    const res = await resendVerification(unverifiedEmail || email);
    setResending(false);
    setResendStatus(res.message);
  };

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 68px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.5rem',
        background: 'var(--bg-space)',
      }}
    >
      <div
        className="spatial-panel"
        style={{
          maxWidth: '460px',
          width: '100%',
          padding: '2.5rem 2.25rem',
          border: '1px solid var(--border-highlight)',
          boxShadow: 'var(--glow-cyan)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: 'var(--radius-sm)',
              background: 'linear-gradient(135deg, var(--crimson), var(--cyan))',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '0.85rem',
              boxShadow: 'var(--glow-cyan)',
            }}
          >
            <Icon name="shield-check" size={26} color="#ffffff" />
          </div>
          <div className="micro-label" style={{ color: 'var(--cyan)', marginBottom: '0.25rem' }}>
            OPERATOR AUTHENTICATION
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.65rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.35rem' }}>
            Sign In to DisasterChain
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem' }}>
            Access crisis operational dispatch & cryptographic relief systems
          </p>
        </div>

        {/* Error Notice */}
        {error && (
          <div
            style={{
              background: 'rgba(255, 46, 77, 0.15)',
              border: '1px solid var(--border-red)',
              borderRadius: 'var(--radius-xs)',
              padding: '0.75rem 1rem',
              color: '#ff8597',
              fontSize: '0.82rem',
              marginBottom: '1.25rem',
            }}
          >
            <div>⚠️ {error}</div>
            {isUnverified && (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--cyan)',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: '0.8rem',
                  marginTop: '0.4rem',
                }}
              >
                {resending ? 'Sending...' : 'Resend verification email'}
              </button>
            )}
          </div>
        )}

        {resendStatus && (
          <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid var(--border-mint)', color: 'var(--mint)', padding: '0.65rem 1rem', borderRadius: 'var(--radius-xs)', fontSize: '0.8rem', marginBottom: '1rem' }}>
            ✓ {resendStatus}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Registered Email Address</label>
            <input
              type="email"
              required
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@disasterchain.org"
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label className="form-label" style={{ margin: 0 }}>Password</label>
              <Link to="/forgot-password" style={{ fontSize: '0.75rem', color: 'var(--cyan)' }}>
                Forgot Password?
              </Link>
            </div>
            <input
              type="password"
              required
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem' }}
          >
            {loading ? 'Authenticating Operator...' : 'Authenticate & Enter Grid'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          New operator?{' '}
          <Link to="/register" style={{ color: 'var(--cyan)', fontWeight: 700 }}>
            Register Personnel Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
