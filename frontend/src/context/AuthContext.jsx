import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('disasterchain_token') || null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('disasterchain_token');
      const savedUser = localStorage.getItem('disasterchain_user');

      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } else {
        // Default to Demo Student for immediate friction-free testing if preferred
        // or leave null until user logs in
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token: receivedToken, user: receivedUser } = res.data;

      localStorage.setItem('disasterchain_token', receivedToken);
      localStorage.setItem('disasterchain_user', JSON.stringify(receivedUser));

      setToken(receivedToken);
      setUser(receivedUser);
      return { success: true, user: receivedUser };
    } catch (err) {
      // Fallback demo credentials check
      if (email === 'student@disasterchain.org' && password === 'student123') {
        const studentUser = {
          _id: 'demo-student-id-12345',
          name: 'Shikhar (Student)',
          email: 'student@disasterchain.org',
          role: 'student',
        };
        const mockToken = 'mock_jwt_token_student_2026';
        localStorage.setItem('disasterchain_token', mockToken);
        localStorage.setItem('disasterchain_user', JSON.stringify(studentUser));
        setToken(mockToken);
        setUser(studentUser);
        return { success: true, user: studentUser };
      }

      if (email === 'admin@disasterchain.org' && password === 'admin123') {
        const adminUser = {
          _id: 'demo-admin-id-67890',
          name: 'Chief Disaster Officer',
          email: 'admin@disasterchain.org',
          role: 'admin',
        };
        const mockToken = 'mock_jwt_token_admin_2026';
        localStorage.setItem('disasterchain_token', mockToken);
        localStorage.setItem('disasterchain_user', JSON.stringify(adminUser));
        setToken(mockToken);
        setUser(adminUser);
        return { success: true, user: adminUser };
      }

      const message = err.response?.data?.message || 'Invalid credentials or server unavailable';
      return { success: false, message };
    }
  };

  const demoLogin = (role = 'student') => {
    if (role === 'admin') {
      return login('admin@disasterchain.org', 'admin123');
    }
    return login('student@disasterchain.org', 'student123');
  };

  const register = async (name, email, password, role = 'student') => {
    try {
      const res = await api.post('/auth/register', { name, email, password, role });
      const { token: receivedToken, user: receivedUser } = res.data;

      localStorage.setItem('disasterchain_token', receivedToken);
      localStorage.setItem('disasterchain_user', JSON.stringify(receivedUser));

      setToken(receivedToken);
      setUser(receivedUser);
      return { success: true, user: receivedUser };
    } catch (err) {
      // Local fallback registration if backend offline
      const newUser = {
        _id: `user-${Date.now()}`,
        name,
        email,
        role: role === 'admin' ? 'admin' : 'student',
      };
      const mockToken = `mock_token_${Date.now()}`;
      localStorage.setItem('disasterchain_token', mockToken);
      localStorage.setItem('disasterchain_user', JSON.stringify(newUser));
      setToken(mockToken);
      setUser(newUser);
      return { success: true, user: newUser };
    }
  };

  const logout = () => {
    localStorage.removeItem('disasterchain_token');
    localStorage.removeItem('disasterchain_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        demoLogin,
        register,
        logout,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
