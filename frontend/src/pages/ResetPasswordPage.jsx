import React, { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

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
      <div style={{ minHeight: 'calc(100vh - 70px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div className="glass-card" style={{ maxWidth: '440px', width: '100%', padding: '2.5rem 2rem', textAlign: 'center', borderColor: 'rgba(239, 68, 68, 0.4)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f87171', marginBottom: '0.5rem' }}>
            Invalid Reset Link
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
            No password reset token was provided in the URL. Please request a new password reset link.
          </p>
          <Link to="/forgot-password" className="btn btn-primary" style={{ display: 'inline-block' }}>
            Request New Reset Link
          </Link>
        </div>
      </div>
    );
  }

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
          maxWidth: '460px',
          width: '100%',
          padding: '2.5rem 2rem',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #10b981, #6366f1)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              marginBottom: '0.75rem',
            }}
          >
            🔒
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem' }}>
            Create New Password
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Set a strong, secure password for your DisasterChain account
          </p>
        </div>

        {error && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              padding: '0.65rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              marginBottom: '1.25rem',
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {success ? (
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                color: '#6ee7b7',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.9rem',
                marginBottom: '1.5rem',
                lineHeight: 1.5,
              }}
            >
              🎉 <strong>Password Reset Successful!</strong>
              <div style={{ fontSize: '0.82rem', marginTop: '0.35rem', color: '#a7f3d0' }}>
                Your account password has been updated. You can now sign in with your new credentials.
              </div>
            </div>

            <Link to="/login" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }}>
              Sign In to DisasterChain
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
                placeholder="Enter new strong password"
              />
            </div>

            {/* Password Strength Checklist */}
            {password && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.35rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Security Strength:</span>
                  <span
                    style={{
                      fontWeight: 700,
                      color:
                        passwordScore <= 2
                          ? '#ef4444'
                          : passwordScore <= 4
                          ? '#f59e0b'
                          : '#10b981',
                    }}
                  >
                    {passwordScore <= 2 ? 'Weak' : passwordScore <= 4 ? 'Moderate' : 'Strong ✅'}
                  </span>
                </div>

                <div style={{ width: '100%', height: '5px', background: '#334155', borderRadius: '3px', overflow: 'hidden', marginBottom: '0.65rem' }}>
                  <div
                    style={{
                      width: `${(passwordScore / 5) * 100}%`,
                      height: '100%',
                      background:
                        passwordScore <= 2
                          ? '#ef4444'
                          : passwordScore <= 4
                          ? '#f59e0b'
                          : '#10b981',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem', fontSize: '0.72rem' }}>
                  <span style={{ color: passwordCriteria.hasLength ? '#34d399' : '#94a3b8' }}>
                    {passwordCriteria.hasLength ? '✓' : '○'} Min. 8 characters
                  </span>
                  <span style={{ color: passwordCriteria.hasUpper ? '#34d399' : '#94a3b8' }}>
                    {passwordCriteria.hasUpper ? '✓' : '○'} Uppercase letter
                  </span>
                  <span style={{ color: passwordCriteria.hasLower ? '#34d399' : '#94a3b8' }}>
                    {passwordCriteria.hasLower ? '✓' : '○'} Lowercase letter
                  </span>
                  <span style={{ color: passwordCriteria.hasNumber ? '#34d399' : '#94a3b8' }}>
                    {passwordCriteria.hasNumber ? '✓' : '○'} At least 1 number
                  </span>
                  <span style={{ color: passwordCriteria.hasSpecial ? '#34d399' : '#94a3b8', gridColumn: 'span 2' }}>
                    {passwordCriteria.hasSpecial ? '✓' : '○'} Special character (!@#$%...)
                  </span>
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input
                type="password"
                required
                className="form-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
              />
              {confirmPassword && password !== confirmPassword && (
                <span style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '0.25rem', display: 'block' }}>
                  Passwords do not match
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}
            >
              {loading ? 'Updating Password...' : 'Save New Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
