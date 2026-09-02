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
          setError(res.message || 'Verification token is invalid or has expired.');
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
          maxWidth: '480px',
          width: '100%',
          padding: '2.5rem 2.25rem',
          textAlign: 'center',
          border: '1px solid var(--border-highlight)',
          boxShadow: 'var(--glow-cyan)',
        }}
      >
        {loading ? (
          <div>
            <div className="live-beacon-pulse" style={{ width: 32, height: 32, margin: '0 auto 1.5rem' }} />
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.4rem' }}>
              Validating Dispatch Token...
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Communicating with security authority to verify your cryptographic signature.
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
                border: '2px solid var(--mint)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem',
                color: 'var(--mint)',
                boxShadow: '0 0 24px rgba(16, 185, 129, 0.3)',
              }}
            >
              <Icon name="shield-check" size={32} />
            </div>

            <div className="micro-label" style={{ color: 'var(--mint)', marginBottom: '0.3rem' }}>
              CLEARANCE CONFIRMED
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.5rem' }}>
              Identity Successfully Verified
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', lineHeight: 1.5, marginBottom: '1.75rem' }}>
              Your operator credentials have been authenticated. You now possess active clearance on DisasterChain.
            </p>

            <Link to="/login" className="btn btn-primary" style={{ width: '100%' }}>
              Proceed to Sign In →
            </Link>
          </div>
        ) : (
          <div>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(255, 46, 77, 0.12)',
                border: '2px solid var(--crimson)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem',
                color: 'var(--crimson)',
              }}
            >
              <Icon name="alert-circle" size={32} />
            </div>

            <div className="micro-label" style={{ color: 'var(--crimson)', marginBottom: '0.3rem' }}>
              VERIFICATION REJECTED
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.5rem' }}>
              Token Invalid or Expired
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              {error || 'This verification token is no longer recognized by the cryptographic security grid.'}
            </p>

            {resendMessage && (
              <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid var(--border-mint)', color: 'var(--mint)', padding: '0.65rem', borderRadius: 'var(--radius-xs)', fontSize: '0.8rem', marginBottom: '1.25rem' }}>
                ✓ {resendMessage}
              </div>
            )}

            <form onSubmit={handleResend} style={{ textAlign: 'left', marginBottom: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Request Fresh Verification Dispatch</label>
                <input
                  type="email"
                  required
                  className="form-input"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="operator@disasterchain.org"
                />
              </div>
              <button
                type="submit"
                disabled={resending}
                className="btn btn-secondary btn-sm"
                style={{ width: '100%' }}
              >
                {resending ? 'Dispatching...' : 'Resend Verification Token'}
              </button>
            </form>

            <Link to="/login" style={{ color: 'var(--cyan)', fontSize: '0.82rem' }}>
              Return to Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;
