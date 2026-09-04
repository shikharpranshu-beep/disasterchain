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
      setMessage(res.message || 'Password reset link sent to your email.');
    } else {
      setError(res.message || 'Unable to process password reset request.');
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
            {t('auth.forgotPasswordTitle')}
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.65rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.35rem' }}>
            {t('auth.forgotPasswordTitle')}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem' }}>
            {t('auth.forgotPasswordSubtitle')}
          </p>
        </div>

        {error && (
          <div style={{ background: 'rgba(255, 46, 77, 0.15)', border: '1px solid var(--border-red)', borderRadius: 'var(--radius-xs)', padding: '0.75rem 1rem', color: '#ff8597', fontSize: '0.82rem', marginBottom: '1.25rem' }}>
            ⚠️ {error}
          </div>
        )}

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📨</div>
            <div style={{ fontWeight: 800, color: '#ffffff', fontSize: '1.1rem', marginBottom: '0.35rem' }}>
              {t('auth.verifyNotice')}
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              {message}
            </p>
            <Link to="/login" className="btn btn-primary" style={{ width: '100%' }}>
              {t('auth.alreadyAccount')}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">{t('auth.email')}</label>
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
              style={{ width: '100%', marginTop: '0.5rem' }}
            >
              {loading ? t('common.loading') : `${t('auth.sendResetLink')} →`}
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          {t('auth.alreadyAccount')}{' '}
          <Link to="/login" style={{ color: 'var(--cyan)', fontWeight: 700 }}>
            {t('auth.loginBtn')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
