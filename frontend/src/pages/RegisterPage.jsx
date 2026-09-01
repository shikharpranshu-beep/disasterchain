import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registeredSuccess, setRegisteredSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState('');

  const { register, resendVerification } = useAuth();

  // Real-time password validation criteria
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
      setError(result.message || 'Registration failed. Please check your details.');
    }
  };

  const handleResend = async () => {
    setResending(true);
    setResendStatus('');
    const res = await resendVerification(registeredEmail);
    setResending(false);
    setResendStatus(res.message);
  };

  // Verification Instructions Screen upon successful registration
  if (registeredSuccess) {
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
            borderColor: 'rgba(16, 185, 129, 0.4)',
          }}
        >
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
            ✉️
          </div>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', color: '#ffffff' }}>
            Verify Your Email Address
          </h2>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            We've sent a secure verification link to <strong>{registeredEmail}</strong>. Please check your inbox and click the verification link to activate your DisasterChain account.
          </p>

          <div
            style={{
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              fontSize: '0.82rem',
              color: 'var(--text-muted)',
              marginBottom: '1.75rem',
              textAlign: 'left',
              lineHeight: 1.5,
            }}
          >
            💡 <strong>Next steps:</strong>
            <ul style={{ paddingLeft: '1.25rem', marginTop: '0.4rem' }}>
              <li>Open your email client and find the verification email.</li>
              <li>Click <strong>Verify Email Address</strong> within 24 hours.</li>
              <li>Once verified, sign in to broadcast emergency signals or view records.</li>
            </ul>
          </div>

          {resendStatus && (
            <div
              style={{
                background: 'rgba(99, 102, 241, 0.15)',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                color: '#a5b4fc',
                padding: '0.65rem 1rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                marginBottom: '1.25rem',
              }}
            >
              ℹ️ {resendStatus}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Link to="/login" className="btn btn-primary" style={{ padding: '0.75rem' }}>
              Proceed to Sign In
            </Link>

            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="btn btn-outline"
              style={{ fontSize: '0.85rem', padding: '0.6rem' }}
            >
              {resending ? 'Resending Link...' : 'Resend Verification Email'}
            </button>
          </div>
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
          maxWidth: '500px',
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
              background: 'linear-gradient(135deg, #ef4444, #6366f1)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              marginBottom: '0.75rem',
            }}
          >
            🛡️
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem' }}>
            Create DisasterChain Account
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Join the verified emergency response & transparent relief network
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

        <form onSubmit={handleSubmit}>
          {/* Full Name */}
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              required
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Shikhar Sharma"
            />
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              required
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. citizen@example.com"
            />
          </div>

          {/* Account Role */}
          <div className="form-group">
            <label className="form-label">Account Role</label>
            <select
              className="form-select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="user">👤 Citizen / Community Member</option>
              <option value="student">🎓 Student / Volunteer Responder</option>
            </select>
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              required
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a strong password"
            />
          </div>

          {/* Password Strength Meter */}
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

              {/* Progress Bar */}
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

              {/* Checklist */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem', fontSize: '0.72rem' }}>
                <span style={{ color: passwordCriteria.hasLength ? '#34d399' : '#94a3b8' }}>
                  {passwordCriteria.hasLength ? '✓' : '○'} Min. 8 characters
                </span>
                <span style={{ color: passwordCriteria.hasUpper ? '#34d399' : '#94a3b8' }}>
                  {passwordCriteria.hasUpper ? '✓' : '○'} Uppercase letter (A-Z)
                </span>
                <span style={{ color: passwordCriteria.hasLower ? '#34d399' : '#94a3b8' }}>
                  {passwordCriteria.hasLower ? '✓' : '○'} Lowercase letter (a-z)
                </span>
                <span style={{ color: passwordCriteria.hasNumber ? '#34d399' : '#94a3b8' }}>
                  {passwordCriteria.hasNumber ? '✓' : '○'} At least 1 number (0-9)
                </span>
                <span style={{ color: passwordCriteria.hasSpecial ? '#34d399' : '#94a3b8', gridColumn: 'span 2' }}>
                  {passwordCriteria.hasSpecial ? '✓' : '○'} Special character (!@#$%^&*...)
                </span>
              </div>
            </div>
          )}

          {/* Confirm Password */}
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input
              type="password"
              required
              className="form-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
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
            {loading ? 'Creating Secure Account...' : 'Create Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent-indigo)', fontWeight: 600 }}>
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
