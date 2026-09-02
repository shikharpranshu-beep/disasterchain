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
      setError(result.message || 'Login failed. Please check credentials.');
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
        minHeight: 'calc(100vh - 70px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.5rem',
      }}
    >
      <div
        className="glass-card"
        style={{
          maxWidth: '460px',
          width: '100%',
          padding: '2.5rem 2.25rem',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #ff334b, #6366f1)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '0.85rem',
              boxShadow: '0 0 20px rgba(255, 51, 75, 0.45)',
            }}
          >
            <Icon name="shield-check" size={28} color="#ffffff" />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.35rem' }}>
            Sign In to DisasterChain
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem' }}>
            Access crisis response tools & transparent relief records
          </p>
        </div>

        {/* Error / Unverified Notice */}
        {error && (
          <div
            style={{
              background: isUnverified ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 51, 75, 0.15)',
              border: `1px solid ${isUnverified ? 'rgba(245, 158, 11, 0.4)' : 'rgba(255, 51, 75, 0.35)'}`,
              color: isUnverified ? '#fcd34d' : '#ff6b7e',
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              marginBottom: '1.25rem',
              lineHeight: 1.5,
            }}
          >
            <div style={{ fontWeight: 700 }}>{isUnverified ? '⚠️ Email Not Verified' : `⚠️ ${error}`}</div>
            {isUnverified && (
              <div style={{ marginTop: '0.65rem' }}>
                <p style={{ fontSize: '0.8rem', color: '#fef3c7', marginBottom: '0.5rem' }}>
                  Your account requires email verification before accessing DisasterChain.
                </p>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="btn btn-secondary btn-sm"
                  style={{
                    fontSize: '0.78rem',
                    background: 'rgba(0, 0, 0, 0.4)',
                    borderColor: 'rgba(245, 158, 11, 0.5)',
                    color: '#fef08a',
                  }}
                >
                  <Icon name="mail" size={13} />
                  <span>{resending ? 'Sending...' : 'Resend Verification Email'}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {resendStatus && (
          <div
            style={{
              background: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              color: '#a5b4fc',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              marginBottom: '1.25rem',
            }}
          >
            ℹ️ {resendStatus}
          </div>
        )}

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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label className="form-label" style={{ margin: 0 }}>Password</label>
              <Link
                to="/forgot-password"
                style={{ fontSize: '0.78rem', color: 'var(--accent-indigo)', fontWeight: 700 }}
              >
                Forgot Password?
              </Link>
            </div>
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
            <Icon name="lock" size={16} />
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--accent-indigo)', fontWeight: 700 }}>
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
