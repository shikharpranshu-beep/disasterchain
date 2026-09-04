import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/Icons';
import { useTranslation } from '../i18n/i18n';

const RegisterPage = () => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('citizen');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registeredSuccess, setRegisteredSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState('');

  const { register, resendVerification } = useAuth();

  const passwordCriteria = useMemo(() => {
    return {
      hasLength: password.length >= 8,
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
    };
  }, [password]);

  const passwordScore = useMemo(() => {
    return Object.values(passwordCriteria).filter(Boolean).length;
  }, [passwordCriteria]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      return setError('Passwords do not match. Please re-enter both passwords.');
    }

    if (passwordScore < 5) {
      return setError('Password does not meet all security requirements listed below.');
    }

    setLoading(true);
    const result = await register({
      name,
      email,
      password,
      confirmPassword,
      role,
    });
    setLoading(false);

    if (result.success) {
      setRegisteredSuccess(true);
      setRegisteredEmail(email);
    } else {
      setError(result.message || 'Registration failed. Please verify submitted parameters.');
    }
  };

  const handleResend = async () => {
    setResending(true);
    setResendStatus('');
    const res = await resendVerification(registeredEmail);
    setResending(false);
    setResendStatus(res.message);
  };

  if (registeredSuccess) {
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
            maxWidth: '500px',
            width: '100%',
            padding: '2.5rem 2.25rem',
            textAlign: 'center',
            border: '1px solid var(--border-mint)',
            boxShadow: '0 0 24px rgba(16, 185, 129, 0.2)',
          }}
        >
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
            }}
          >
            <Icon name="shield-check" size={32} />
          </div>

          <div className="micro-label" style={{ color: 'var(--mint)', marginBottom: '0.3rem' }}>
            {t('auth.verifyEmailTitle')}
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.5rem' }}>
            {t('auth.verifyEmailTitle')}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
            {t('auth.verifyNotice')} <strong style={{ color: '#ffffff' }}>{registeredEmail}</strong>
          </p>

          {resendStatus && (
            <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid var(--border-mint)', color: 'var(--mint)', padding: '0.65rem', borderRadius: 'var(--radius-xs)', fontSize: '0.8rem', marginBottom: '1.25rem' }}>
              ✓ {resendStatus}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Link to="/login" className="btn btn-primary" style={{ width: '100%' }}>
              {t('auth.alreadyAccount')}
            </Link>
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="btn btn-secondary btn-sm"
            >
              {resending ? t('common.loading') : t('auth.sendResetLink')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 68px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2.5rem 1.5rem',
        background: 'var(--bg-space)',
      }}
    >
      <div
        className="spatial-panel"
        style={{
          maxWidth: '520px',
          width: '100%',
          padding: '2.5rem 2.25rem',
          border: '1px solid var(--border-highlight)',
          boxShadow: 'var(--glow-cyan)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div className="micro-label" style={{ color: 'var(--cyan)', marginBottom: '0.25rem' }}>
            {t('auth.registerSubtitle')}
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.65rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.35rem' }}>
            {t('auth.registerTitle')}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem' }}>
            {t('auth.registerSubtitle')}
          </p>
        </div>

        {error && (
          <div style={{ background: 'rgba(255, 46, 77, 0.15)', border: '1px solid var(--border-red)', borderRadius: 'var(--radius-xs)', padding: '0.75rem 1rem', color: '#ff8597', fontSize: '0.82rem', marginBottom: '1.25rem' }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">{t('auth.name')}</label>
            <input
              type="text"
              required
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Captain Shikhar Sharma"
            />
          </div>

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

          <div className="form-group">
            <label className="form-label">{t('auth.role')}</label>
            <select
              className="form-select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="citizen">{t('auth.roleCitizen')}</option>
              <option value="volunteer">{t('auth.roleVolunteer')}</option>
              <option value="ngo">{t('auth.roleNgo')}</option>
              <option value="responder">{t('auth.roleResponder')}</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">{t('auth.password')}</label>
            <input
              type="password"
              required
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
            />
          </div>

          {/* Password Security Check Chips */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem', marginBottom: '1rem', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>
            <span style={{ color: passwordCriteria.hasLength ? 'var(--mint)' : 'var(--text-muted)' }}>
              {passwordCriteria.hasLength ? '✓' : '○'} 8+ Characters
            </span>
            <span style={{ color: passwordCriteria.hasUpper ? 'var(--mint)' : 'var(--text-muted)' }}>
              {passwordCriteria.hasUpper ? '✓' : '○'} Uppercase Letter
            </span>
            <span style={{ color: passwordCriteria.hasLower ? 'var(--mint)' : 'var(--text-muted)' }}>
              {passwordCriteria.hasLower ? '✓' : '○'} Lowercase Letter
            </span>
            <span style={{ color: passwordCriteria.hasNumber ? 'var(--mint)' : 'var(--text-muted)' }}>
              {passwordCriteria.hasNumber ? '✓' : '○'} Number (0-9)
            </span>
            <span style={{ color: passwordCriteria.hasSpecial ? 'var(--mint)' : 'var(--text-muted)' }}>
              {passwordCriteria.hasSpecial ? '✓' : '○'} Special Symbol (!@#$)
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">{t('auth.confirmPassword')}</label>
            <input
              type="password"
              required
              className="form-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem' }}
          >
            {loading ? t('common.loading') : `${t('auth.registerBtn')} →`}
          </button>
        </form>

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

export default RegisterPage;
