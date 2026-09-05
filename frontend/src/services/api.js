import axios from 'axios';
import { Capacitor } from '@capacitor/core';

const isNativeApp = typeof window !== 'undefined' && (Capacitor.isNativePlatform() || window.Capacitor?.isNativePlatform?.());
const isLocalBrowser = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && 
  process.env.NODE_ENV !== 'production' &&
  !isNativeApp;

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  (isLocalBrowser
    ? 'http://localhost:5000/api'
    : 'https://disasterrchain-backend.onrender.com/api');

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add JWT Auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('disasterchain_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor to flag cached operational data served by Service Worker when offline
api.interceptors.response.use(
  (response) => {
    const isCached =
      response.headers &&
      (response.headers['x-disasterchain-cached'] === 'true' ||
        response.headers.get?.('x-disasterchain-cached') === 'true');

    if (isCached) {
      if (response.data && typeof response.data === 'object') {
        response.data._isCached = true;
        if (Array.isArray(response.data.data)) {
          response.data.data._isCached = true;
        }
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('disasterchain:cachedDataServed', {
            detail: { url: response.config?.url },
          })
        );
      }
    }
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ================= EMERGENCY SOS API =================
export const fetchSosRequests = async (params = {}) => {
  const res = await api.get('/sos', { params });
  return res.data.data || [];
};

export const createSosRequest = async (sosData) => {
  const res = await api.post('/sos', sosData);
  return res.data;
};

export const updateSosStatus = async (id, status) => {
  const res = await api.put(`/sos/${id}/status`, { status });
  return res.data;
};

// ================= SHELTERS API =================
export const fetchShelters = async (params = {}) => {
  const res = await api.get('/shelters', { params });
  return res.data.data || [];
};

export const createShelter = async (shelterData) => {
  const res = await api.post('/shelters', shelterData);
  return res.data;
};

export const updateShelterOccupancy = async (id, occupancy) => {
  const res = await api.put(`/shelters/${id}/occupancy`, { occupancy });
  return res.data;
};

// ================= AFFECTED AREAS API =================
export const fetchAffectedAreas = async () => {
  const res = await api.get('/affected-areas');
  return res.data.data || [];
};

// ================= EMERGENCY ALERTS API =================
export const fetchAlerts = async (params = {}) => {
  const res = await api.get('/alerts', { params });
  return res.data.data || [];
};

export const createAlert = async (alertData) => {
  const res = await api.post('/alerts', alertData);
  return res.data;
};

// ================= INCIDENTS / HAZARDS API =================
export const fetchIncidents = async (params = {}) => {
  const res = await api.get('/incidents', { params });
  return res.data.data || [];
};

export const createIncident = async (incidentData) => {
  const res = await api.post('/incidents', incidentData);
  return res.data;
};

export const updateIncidentStatus = async (id, status) => {
  const res = await api.put(`/incidents/${id}/status`, { status });
  return res.data;
};

// ================= EMERGENCY RESOURCES DIRECTORY API =================
export const fetchResources = async (params = {}) => {
  const res = await api.get('/resources', { params });
  return res.data.data || [];
};

export const createResource = async (resourceData) => {
  const res = await api.post('/resources', resourceData);
  return res.data;
};

// ================= RELIEF DONATIONS API =================
export const fetchDonations = async () => {
  const res = await api.get('/donations');
  return res.data.data || [];
};

export const createDonation = async (donationData) => {
  const res = await api.post('/donations', donationData);
  return res.data;
};

// ================= RESOURCE DISTRIBUTIONS API =================
export const fetchDistributions = async () => {
  const res = await api.get('/distributions');
  return res.data.data || [];
};

export const createDistribution = async (distributionData) => {
  const res = await api.post('/distributions', distributionData);
  return res.data;
};

// ================= BLOCKCHAIN AUDIT LEDGER API =================
export const fetchBlockchainTransactions = async (params = {}) => {
  const res = await api.get('/blockchain/transactions', { params });
  return res.data.data || [];
};

// ================= PREPAREDNESS GUIDES API =================
export const fetchPreparednessGuides = async () => {
  const res = await api.get('/preparedness');
  return res.data.data || [];
};

// ================= AUTHENTICATION & USER PROFILE API =================
export const registerUser = async ({ name, email, password, confirmPassword, role }) => {
  return await api.post('/auth/register', { name, email, password, confirmPassword, role });
};

export const loginUser = async ({ email, password }) => {
  return await api.post('/auth/login', { email, password });
};

export const verifyEmail = async (token) => {
  return await api.post('/auth/verify-email', { token });
};

export const resendVerification = async (email) => {
  return await api.post('/auth/resend-verification', { email });
};

export const forgotPassword = async (email) => {
  return await api.post('/auth/forgot-password', { email });
};

export const resetPassword = async ({ token, password, confirmPassword }) => {
  return await api.post('/auth/reset-password', { token, password, confirmPassword });
};

export const fetchUserProfile = async () => {
  const res = await api.get('/auth/me');
  return res.data.data;
};

export const updateUserProfile = async (name) => {
  const res = await api.put('/auth/updatedetails', { name });
  return res.data.data;
};

export const updateNotificationPreferences = async (preferences) => {
  const res = await api.put('/auth/preferences', preferences);
  return res.data.data;
};

export const fetchAdminUsers = async () => {
  const res = await api.get('/auth/users');
  return res.data.data || [];
};

export const updateUserRole = async (userId, role) => {
  const res = await api.put(`/auth/users/${userId}/role`, { role });
  return res.data;
};

export const adminVerifyUser = async (userId) => {
  const res = await api.put(`/auth/users/${userId}/verify`);
  return res.data;
};

// ================= PASSWORD RECOVERY REQUESTS ADMIN API =================
export const fetchPasswordRecoveryRequests = async (params = {}) => {
  const res = await api.get('/auth/password-recovery-requests', { params });
  return res.data.data || [];
};

export const approvePasswordRecoveryRequest = async (id) => {
  const res = await api.put(`/auth/password-recovery-requests/${id}/approve`);
  return res.data;
};

export const rejectPasswordRecoveryRequest = async (id, rejectionReason = '') => {
  const res = await api.put(`/auth/password-recovery-requests/${id}/reject`, { rejectionReason });
  return res.data;
};

export const logoutUser = async () => {
  try {
    await api.post('/auth/logout');
  } catch (err) {
    // Ignore offline errors on logout
  }
};

// ================= CRISIS INTELLIGENCE PRIORITY ENGINE API =================
export const fetchCrisisIntelligence = async (params = {}) => {
  const res = await api.get('/intelligence/active', { params });
  return res.data;
};

// ================= SMART SHELTER RECOMMENDATION API =================
export const fetchRecommendedShelter = async ({ latitude, longitude, incidentId } = {}) => {
  const res = await api.get('/intelligence/recommended-shelter', {
    params: { latitude, longitude, incidentId },
  });
  return res.data;
};

// ================= CRISIS RISK HEATMAP INTELLIGENCE API =================
export const fetchRiskHeatmap = async (params = {}) => {
  const res = await api.get('/intelligence/risk-heatmap', { params });
  return res.data;
};

// ================= AI EMERGENCY ASSISTANT API =================
export const sendAIChatMessage = async ({ message, conversation, latitude, longitude, language } = {}) => {
  const res = await api.post('/ai/chat', { message, conversation, latitude, longitude, language });
  return res.data;
};

// ================= WEATHERGPT INTELLIGENCE API =================
export const sendWeatherGPTChat = async ({
  message,
  conversation,
  latitude,
  longitude,
  location,
  language,
  conversationId,
} = {}) => {
  const res = await api.post('/weather-gpt/chat', {
    message,
    conversation,
    latitude,
    longitude,
    location,
    language,
    conversationId,
  });
  return res.data;
};

export default api;
