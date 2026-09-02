import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/Icons';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const token = (searchParams.get('token') || '').trim();

  const [loading, setLoading] = useState(!!token);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  const { verifyEmail, resendVerification } = useAuth();

  useEffect(() => {
    let isMounted = true;

    const performVerification = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      const res = await verifyEmail(token);

      if (isMounted) {
        setLoading(false);
        if (res.success) {
          setVerified(true);
        } else {
          setError(res.message || 'Verification link is invalid or has expired.');
        }
      }
    };

    performVerification();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleResend = async (e) => {
    e.preventDefault();
    if (!resendEmail) return;

    setResending(true);
    setResendMessage('');
    const res = await resendVerification(resendEmail);
    setResending(false);
    setResendMessage(res.message);
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
          maxWidth: '500px',
          width: '100%',
          padding: '2.5rem 2.25rem',
          textAlign: 'center',
          borderColor: verified ? 'rgba(16, 185, 129, 0.4)' : error ? 'rgba(255, 51, 75, 0.4)' : 'var(--border-subtle)',
        }}
      >
        {loading ? (
          <div>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                border: '3px solid rgba(99, 102, 241, 0.2)',
                borderTopColor: 'var(--accent-indigo)',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 1.5rem',
              }}
            />
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.4rem' }}>
              Verifying Email Address...
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem' }}>
              Validating cryptographic security token with DisasterChain
            </p>
          </div>
        ) : verified ? (
          <div>
            <div
              style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '2px solid #10b981',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem',
                color: '#10b981',
              }}
            >
              <Icon name="shield-check" size={34} color="#10b981" />
            </div>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#34d399', marginBottom: '0.5rem' }}>
              Email Verified Successfully!
            </h2>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '1.75rem' }}>
              Your DisasterChain account is now active and verified. You can broadcast distress signals, view safe shelter capacities, and access the transparency ledger.
            </p>

            <Link to="/dashboard" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }}>
              Go to Emergency Dashboard →
            </Link>
          </div>
        ) : (
          <div>
            <div
              style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                background: 'rgba(255, 51, 75, 0.15)',
                border: '2px solid #ff334b',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem',
                color: '#ff4d63',
              }}
            >
              <Icon name="warning" size={32} color="#ff334b" />
            </div>

            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#ff6b7e', marginBottom: '0.5rem' }}>
              {error ? 'Verification Link Expired' : 'No Verification Token Found'}
            </h2>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              {error || 'Please provide a valid token link from your confirmation email, or enter your email address below to receive a fresh verification link.'}
            </p>

            {resendMessage && (
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
                ℹ️ {resendMessage}
              </div>
            )}

            <form onSubmit={handleResend} style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">Enter Account Email to Resend</label>
                <input
                  type="email"
                  required
                  className="form-input"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="e.g. student@disasterchain.org"
                />
              </div>

              <button
                type="submit"
                disabled={resending}
                className="btn btn-secondary"
                style={{ width: '100%', padding: '0.7rem' }}
              >
                <Icon name="mail" size={15} />
                <span>{resending ? 'Sending...' : 'Resend Verification Link'}</span>
              </button>
            </form>

            <Link to="/login" style={{ fontSize: '0.85rem', color: 'var(--accent-indigo)', fontWeight: 700 }}>
              ← Return to Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;
