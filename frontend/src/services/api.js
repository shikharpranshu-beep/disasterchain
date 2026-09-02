import axios from 'axios';

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    ? 'https://disasterrchain-backend.onrender.com/api'
    : 'http://localhost:5000/api');

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

export const logoutUser = async () => {
  try {
    await api.post('/auth/logout');
  } catch (err) {
    // Ignore offline errors on logout
  }
};

export default api;
