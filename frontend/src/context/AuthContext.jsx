import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  loginUser,
  registerUser,
  verifyEmail as apiVerifyEmail,
  resendVerification as apiResendVerification,
  forgotPassword as apiForgotPassword,
  resetPassword as apiResetPassword,
  fetchUserProfile,
  logoutUser,
} from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('disasterchain_token') || null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state and load fresh user profile if token exists
  const refreshUser = useCallback(async () => {
    const savedToken = localStorage.getItem('disasterchain_token');
    if (!savedToken) {
      setUser(null);
      setLoading(false);
      return null;
    }

    try {
      const profile = await fetchUserProfile();
      setUser(profile);
      localStorage.setItem('disasterchain_user', JSON.stringify(profile));
      return profile;
    } catch (err) {
      // If token is expired or invalid
      if (err.response?.status === 401) {
        localStorage.removeItem('disasterchain_token');
        localStorage.removeItem('disasterchain_user');
        setToken(null);
        setUser(null);
      } else {
        // Retain saved user from cache if offline
        const cachedUser = localStorage.getItem('disasterchain_user');
        if (cachedUser) {
          try {
            setUser(JSON.parse(cachedUser));
          } catch (e) {
            setUser(null);
          }
        }
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Sign In
  const login = async (email, password) => {
    try {
      const res = await loginUser({ email, password });
      const { token: receivedToken, user: receivedUser } = res.data;

      localStorage.setItem('disasterchain_token', receivedToken);
      localStorage.setItem('disasterchain_user', JSON.stringify(receivedUser));

      setToken(receivedToken);
      setUser(receivedUser);
      return { success: true, user: receivedUser };
    } catch (err) {
      // Check for unverified account status
      if (err.response?.status === 403 && err.response?.data?.isUnverified) {
        return {
          success: false,
          isUnverified: true,
          email: err.response.data.email || email,
          message: err.response.data.message || 'Please verify your email before logging in.',
        };
      }

      const message = err.response?.data?.message || 'Login failed. Please check your credentials.';
      return { success: false, message };
    }
  };

  // Instant Login for Evaluation Accounts
  const demoLogin = (role = 'student') => {
    if (role === 'admin') {
      return login('admin@disasterchain.org', 'admin123');
    }
    return login('student@disasterchain.org', 'student123');
  };

  // User Registration
  const register = async ({ name, email, password, confirmPassword, role = 'user' }) => {
    try {
      const res = await registerUser({ name, email, password, confirmPassword, role });
      return {
        success: true,
        message: res.data.message || 'Registration successful! Please check your email to verify your account.',
        email,
      };
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed. Please check your input.';
      return { success: false, message };
    }
  };

  // Verify Email
  const verifyEmail = async (tokenString) => {
    try {
      const res = await apiVerifyEmail(tokenString);
      const { token: receivedToken, user: receivedUser, message } = res.data;

      if (receivedToken && receivedUser) {
        localStorage.setItem('disasterchain_token', receivedToken);
        localStorage.setItem('disasterchain_user', JSON.stringify(receivedUser));
        setToken(receivedToken);
        setUser(receivedUser);
      }

      return {
        success: true,
        message: message || 'Your email has been verified successfully!',
        user: receivedUser,
      };
    } catch (err) {
      const message = err.response?.data?.message || 'Email verification failed or token has expired.';
      return { success: false, message };
    }
  };

  // Resend Email Verification Link
  const resendVerification = async (email) => {
    try {
      const res = await apiResendVerification(email);
      return {
        success: true,
        message: res.data.message || 'A new verification link has been sent to your email.',
        alreadyVerified: !!res.data.alreadyVerified,
      };
    } catch (err) {
      const message = err.response?.data?.message || 'Could not resend verification email.';
      return { success: false, message };
    }
  };

  // Forgot Password Request
  const forgotPassword = async (email) => {
    try {
      const res = await apiForgotPassword(email);
      return {
        success: true,
        message: res.data.message || "If an account exists for this address, we've sent a password reset link.",
      };
    } catch (err) {
      const code = err.response?.data?.code;
      const message =
        code === 'EMAIL_DELIVERY_FAILED'
          ? 'Unable to send the password reset email right now. Please try again later.'
          : (err.response?.data?.message || 'Unable to process password reset request.');
      return { success: false, code, message };
    }
  };

  // Reset Password Execution
  const resetPassword = async ({ token: tokenString, password, confirmPassword }) => {
    try {
      const res = await apiResetPassword({ token: tokenString, password, confirmPassword });
      return {
        success: true,
        message: res.data.message || 'Password reset successfully! You can now log in with your new password.',
      };
    } catch (err) {
      const message = err.response?.data?.message || 'Password reset failed. Token may have expired.';
      return { success: false, message };
    }
  };

  // Logout
  const logout = async () => {
    await logoutUser();
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
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isVerified: !!user?.isVerified,
        login,
        demoLogin,
        register,
        verifyEmail,
        resendVerification,
        forgotPassword,
        resetPassword,
        logout,
        refreshUser,
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
