import React, { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/i18n';
import Icon from '../components/Icons';

const ResetPasswordPage = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const initialToken = (searchParams.get('token') || searchParams.get('code') || '').trim();

  const [recoveryCode, setRecoveryCode] = useState(initialToken);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialToken) {
      setRecoveryCode(initialToken);
    }
  }, [initialToken]);

  const { resetPassword } = useAuth();

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

    const trimmedCode = recoveryCode.trim();
    if (!trimmedCode) {
      return setError('Please enter the recovery authorization code provided by your administrator.');
    }

    if (password !== confirmPassword) {
      return setError('Passwords do not match. Please re-enter both passwords.');
    }

    if (passwordScore < 5) {
      return setError('Password must meet all security requirements listed below.');
    }

    setLoading(true);
    const res = await resetPassword({ token: trimmedCode, password, confirmPassword });
    setLoading(false);

    if (res.success) {
      setSuccess(true);
    } else {
      setError(res.message || 'Password reset failed. The code may be invalid, expired, or already used.');
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
              background: 'linear-gradient(135deg, var(--cyan), var(--mint))',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '0.85rem',
              boxShadow: 'var(--glow-cyan)',
            }}
          >
            <Icon name="key" size={24} color="#ffffff" />
          </div>
          <div className="micro-label" style={{ color: 'var(--cyan)', marginBottom: '0.25rem' }}>
            {t('auth.credentialReset', 'CREDENTIAL RESET')}
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.65rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.35rem' }}>
            {t('auth.resetPasswordTitle', 'Set New Operator Key')}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem' }}>
            Enter your admin-issued recovery code and new password to restore account access.
          </p>
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

        {success ? (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ fontSize: '2.25rem', marginBottom: '0.5rem' }}>✅</div>
            <div style={{ fontWeight: 800, color: '#ffffff', fontSize: '1.2rem', marginBottom: '0.35rem' }}>
              {t('auth.keyResetSuccess', 'Key Re-established Successfully')}
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Your operator credentials have been updated and synchronized with the security grid. You can now log in.
            </p>
            <Link to="/login" className="btn btn-primary" style={{ width: '100%', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {t('auth.proceedToSignIn', 'Proceed to Grid Sign In')}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '1.15rem' }}>
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Recovery Authorization Code</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--amber)', fontWeight: 600 }}>Valid for 15 min</span>
              </label>
              <input
                type="text"
                required
                className="form-input"
                style={{
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.08em',
                  fontWeight: 700,
                  color: '#38bdf8',
                  textTransform: 'uppercase',
                }}
                value={recoveryCode}
                onChange={(e) => setRecoveryCode(e.target.value)}
                placeholder="RCVR-XXXX-XXXX-XXXX"
              />
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                Provided directly by your DisasterChain incident commander or administrator.
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.15rem' }}>
              <label className="form-label">{t('auth.newPassword', 'New Password')}</label>
              <input
                type="password"
                required
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
              />
            </div>

            {/* Criteria Checklist */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.35rem',
                marginBottom: '1rem',
                fontSize: '0.72rem',
                fontFamily: 'var(--font-mono)',
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-xs)',
              }}
            >
              <span style={{ color: passwordCriteria.hasLength ? 'var(--mint)' : 'var(--text-muted)' }}>
                {passwordCriteria.hasLength ? '✓' : '○'} {t('auth.criteriaLength', '8+ Characters')}
              </span>
              <span style={{ color: passwordCriteria.hasUpper ? 'var(--mint)' : 'var(--text-muted)' }}>
                {passwordCriteria.hasUpper ? '✓' : '○'} {t('auth.criteriaUpper', 'Uppercase (A-Z)')}
              </span>
              <span style={{ color: passwordCriteria.hasLower ? 'var(--mint)' : 'var(--text-muted)' }}>
                {passwordCriteria.hasLower ? '✓' : '○'} {t('auth.criteriaLower', 'Lowercase (a-z)')}
              </span>
              <span style={{ color: passwordCriteria.hasNumber ? 'var(--mint)' : 'var(--text-muted)' }}>
                {passwordCriteria.hasNumber ? '✓' : '○'} {t('auth.criteriaNumber', 'Number (0-9)')}
              </span>
              <span style={{ color: passwordCriteria.hasSpecial ? 'var(--mint)' : 'var(--text-muted)' }}>
                {passwordCriteria.hasSpecial ? '✓' : '○'} {t('auth.criteriaSpecial', 'Special (!@#...)')}
              </span>
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">{t('auth.confirmPassword', 'Confirm New Password')}</label>
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
              style={{ width: '100%', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {loading ? t('common.loading', 'Re-establishing...') : t('auth.resetBtn', 'Update Operator Password →')}
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          Don't have a recovery code yet?{' '}
          <Link to="/forgot-password" style={{ color: 'var(--cyan)', fontWeight: 700 }}>
            Request Recovery
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
