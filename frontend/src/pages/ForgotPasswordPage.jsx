import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/Icons';
import { useTranslation } from '../i18n/i18n';

const ForgotPasswordPage = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const { forgotPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    const res = await forgotPassword(email);
    setLoading(false);

    if (res.success) {
      setSubmitted(true);
      setMessage(res.message || 'If an account is associated with that email, a password recovery request has been submitted for administrator review.');
    } else {
      setError(res.message || 'Unable to submit recovery request right now. Please try again shortly.');
    }
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
              background: 'linear-gradient(135deg, var(--amber), var(--crimson))',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '0.85rem',
              boxShadow: 'var(--glow-amber)',
            }}
          >
            <Icon name="key" size={24} color="#ffffff" />
          </div>
          <div className="micro-label" style={{ color: 'var(--amber)', marginBottom: '0.25rem' }}>
            {t('auth.forgotPasswordTitle', 'PASSWORD RECOVERY')}
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.65rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.35rem' }}>
            Verified Account Recovery
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem' }}>
            DisasterChain uses admin-verified recovery to ensure mission-critical field security.
          </p>
        </div>

        {/* Security Workflow Card */}
        <div
          style={{
            background: 'rgba(30, 41, 59, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.85rem 1rem',
            marginBottom: '1.5rem',
            fontSize: '0.78rem',
            lineHeight: 1.5,
            color: 'var(--text-secondary)',
          }}
        >
          <div style={{ fontWeight: 700, color: '#ffffff', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Icon name="shield-check" size={14} color="#38bdf8" />
            <span>How Admin-Verified Recovery Works:</span>
          </div>
          <ol style={{ paddingLeft: '1.2rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <li>Submit your registered email address below.</li>
            <li>Incident Commander or System Administrator verifies your identity.</li>
            <li>You receive a single-use 15-minute recovery code.</li>
          </ol>
        </div>

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
            ⚠️ {error}
          </div>
        )}

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🛡️</div>
            <div style={{ fontWeight: 800, color: '#ffffff', fontSize: '1.15rem', marginBottom: '0.35rem' }}>
              Recovery Request Logged
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              {message}
            </p>
            <div
              style={{
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                borderRadius: 'var(--radius-xs)',
                padding: '0.75rem 0.9rem',
                fontSize: '0.78rem',
                color: '#fcd34d',
                marginBottom: '1.5rem',
                textAlign: 'left',
                lineHeight: 1.45,
              }}
            >
              ⏱️ <strong>Next Step:</strong> Contact your field supervisor or system administrator to approve your recovery request. Once approved, you will receive a single-use code valid for 15 minutes.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <Link
                to="/reset-password"
                className="btn btn-primary"
                style={{ width: '100%', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                I Received My Code → Enter Code
              </Link>
              <Link
                to="/login"
                className="btn btn-ghost"
                style={{ width: '100%', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                Back to Login
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">{t('auth.email', 'Registered Email Address')}</label>
              <input
                type="email"
                required
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@disasterchain.org"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {loading ? t('common.loading', 'Processing...') : 'Request Password Recovery →'}
            </button>
          </form>
        )}

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '1.75rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-subtle)',
            fontSize: '0.82rem',
          }}
        >
          <Link to="/reset-password" style={{ color: 'var(--cyan)', fontWeight: 700 }}>
            Have a recovery code?
          </Link>
          <Link to="/login" style={{ color: 'var(--text-secondary)' }}>
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
