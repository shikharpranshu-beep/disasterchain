import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

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
        padding: '2rem',
      }}
    >
      <div
        className="glass-card"
        style={{
          maxWidth: '480px',
          width: '100%',
          padding: '2.5rem 2rem',
          textAlign: 'center',
          borderColor: verified ? 'rgba(16, 185, 129, 0.4)' : error ? 'rgba(239, 68, 68, 0.4)' : 'var(--border-subtle)',
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
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Verifying Email Address...
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Validating cryptographic security token with DisasterChain
            </p>
          </div>
        ) : verified ? (
          <div>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '2px solid #10b981',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                marginBottom: '1.25rem',
              }}
            >
              ✅
            </div>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#34d399', marginBottom: '0.5rem' }}>
              Email Verified Successfully!
            </h2>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.75rem' }}>
              Your DisasterChain account is now active and fully verified. You can broadcast emergency distress signals, track relief logistics, and access the transparency ledger.
            </p>

            <Link to="/dashboard" className="btn btn-primary" style={{ display: 'inline-block', width: '100%', padding: '0.75rem' }}>
              Go to Emergency Dashboard →
            </Link>
          </div>
        ) : (
          <div>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '2px solid #ef4444',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                marginBottom: '1.25rem',
              }}
            >
              ⚠️
            </div>

            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f87171', marginBottom: '0.5rem' }}>
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
                style={{ width: '100%', padding: '0.65rem' }}
              >
                {resending ? 'Sending...' : '📩 Resend Verification Link'}
              </button>
            </form>

            <Link to="/login" style={{ fontSize: '0.85rem', color: 'var(--accent-indigo)', fontWeight: 600 }}>
              ← Return to Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;
