import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      return setError('Password must be at least 6 characters long.');
    }

    setLoading(true);
    const result = await register(name, email, password, role);
    setLoading(false);

    if (result.success) {
      if (role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } else {
      setError(result.message || 'Registration failed.');
    }
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
          maxWidth: '460px',
          width: '100%',
          padding: '2.5rem 2rem',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem' }}>
            Create Student Account
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Join DisasterChain emergency preparedness & reporting network
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
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              required
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Shikhar Student"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Campus / Personal Email</label>
            <input
              type="email"
              required
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@university.edu"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password (Min. 6 chars)</label>
            <input
              type="password"
              required
              minLength={6}
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a strong password"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Account Role</label>
            <select
              className="form-select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="student">🎓 Student / Citizen</option>
              <option value="admin">🛡️ Disaster Response Administrator</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}
          >
            {loading ? 'Creating Account...' : 'Register Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Already registered?{' '}
          <Link to="/login" style={{ color: 'var(--accent-indigo)', fontWeight: 600 }}>
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
