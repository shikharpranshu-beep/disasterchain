import React, { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/Icons';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = (searchParams.get('token') || '').trim();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

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

    if (!token) {
      return setError('Missing or invalid password reset token in URL.');
    }

    if (password !== confirmPassword) {
      return setError('Passwords do not match. Please re-enter both passwords.');
    }

    if (passwordScore < 5) {
      return setError('Password must meet all security requirements.');
    }

    setLoading(true);
    const res = await resetPassword({ token, password, confirmPassword });
    setLoading(false);

    if (res.success) {
      setSuccess(true);
    } else {
      setError(res.message || 'Password reset failed. The link may have expired.');
    }
  };

  if (!token) {
    return (
      <div style={{ minHeight: 'calc(100vh - 68px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem', background: 'var(--bg-space)' }}>
        <div className="spatial-panel spatial-panel-critical" style={{ maxWidth: '460px', width: '100%', padding: '2.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>⚠️</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.5rem' }}>
            Invalid Recovery Token
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            The password reset link is invalid or missing required verification parameters.
          </p>
          <Link to="/forgot-password" className="btn btn-primary" style={{ width: '100%' }}>
            Request New Recovery Link
          </Link>
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
            CREDENTIAL RESET
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.65rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.35rem' }}>
            Set New Operator Key
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem' }}>
            Establish strong password credentials for grid authentication
          </p>
        </div>

        {error && (
          <div style={{ background: 'rgba(255, 46, 77, 0.15)', border: '1px solid var(--border-red)', borderRadius: 'var(--radius-xs)', padding: '0.75rem 1rem', color: '#ff8597', fontSize: '0.82rem', marginBottom: '1.25rem' }}>
            ⚠️ {error}
          </div>
        )}

        {success ? (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ fontSize: '2.25rem', marginBottom: '0.5rem' }}>✅</div>
            <div style={{ fontWeight: 800, color: '#ffffff', fontSize: '1.2rem', marginBottom: '0.35rem' }}>
              Key Re-established Successfully
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Your operator credentials have been updated and synchronized with the security grid.
            </p>
            <Link to="/login" className="btn btn-primary" style={{ width: '100%' }}>
              Proceed to Grid Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">New Password</label>
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem', marginBottom: '1rem', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>
              <span style={{ color: passwordCriteria.hasLength ? 'var(--mint)' : 'var(--text-muted)' }}>
                {passwordCriteria.hasLength ? '✓' : '○'} 8+ Characters
              </span>
              <span style={{ color: passwordCriteria.hasUpper ? 'var(--mint)' : 'var(--text-muted)' }}>
                {passwordCriteria.hasUpper ? '✓' : '○'} Uppercase
              </span>
              <span style={{ color: passwordCriteria.hasLower ? 'var(--mint)' : 'var(--text-muted)' }}>
                {passwordCriteria.hasLower ? '✓' : '○'} Lowercase
              </span>
              <span style={{ color: passwordCriteria.hasNumber ? 'var(--mint)' : 'var(--text-muted)' }}>
                {passwordCriteria.hasNumber ? '✓' : '○'} Number
              </span>
              <span style={{ color: passwordCriteria.hasSpecial ? 'var(--mint)' : 'var(--text-muted)' }}>
                {passwordCriteria.hasSpecial ? '✓' : '○'} Special Char
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
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
              {loading ? 'Re-establishing...' : 'Update Operator Password →'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
