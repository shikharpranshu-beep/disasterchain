/**
 * DisasterChain Weather & Atmospheric Intelligence API Service
 * Handles live requests with client-side localStorage caching for offline resilience
 */

import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const STORAGE_PREFIX = 'dc_weather_cache_';

// Client-side cache helper
function getLocalCache(key) {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function setLocalCache(key, data) {
  try {
    localStorage.setItem(
      `${STORAGE_PREFIX}${key}`,
      JSON.stringify({ data, cachedAt: new Date().toISOString() })
    );
  } catch (e) {
    // LocalStorage quota might be full
  }
}

/**
 * 1. Fetch Complete Weather (Current + Forecast + Air Quality + Location)
 */
export async function fetchCompleteWeather(lat, lon) {
  const cacheKey = `complete_${Number(lat).toFixed(2)}_${Number(lon).toFixed(2)}`;

  try {
    const res = await axios.get(`${API_BASE_URL}/weather/complete`, {
      params: { lat, lon },
      timeout: 10000,
    });

    if (res.data?.success && res.data.data) {
      setLocalCache(cacheKey, res.data.data);
      // Also cache as fallback for general offline view
      setLocalCache('latest_overview', res.data.data);
      return { ...res.data.data, isCached: false };
    }
    throw new Error(res.data?.message || 'Failed to fetch weather data.');
  } catch (err) {
    // Offline or network failure: check local cache
    const cached = getLocalCache(cacheKey) || getLocalCache('latest_overview');
    if (cached) {
      return {
        ...cached.data,
        isCached: true,
        cachedAt: cached.cachedAt,
      };
    }
    throw err;
  }
}

/**
 * 2. Fetch Active Tropical Cyclones
 */
export async function fetchActiveCyclones() {
  const cacheKey = 'cyclones';

  try {
    const res = await axios.get(`${API_BASE_URL}/weather/cyclones`, { timeout: 10000 });
    if (res.data?.success && res.data.data) {
      setLocalCache(cacheKey, res.data.data);
      return { ...res.data.data, isCached: false };
    }
    throw new Error(res.data?.message || 'Failed to fetch active cyclones.');
  } catch (err) {
    const cached = getLocalCache(cacheKey);
    if (cached) {
      return {
        ...cached.data,
        isCached: true,
        cachedAt: cached.cachedAt,
      };
    }
    throw err;
  }
}

/**
 * 3. Fetch Single Cyclone Details + Track Polygon
 */
export async function fetchCycloneById(id) {
  const res = await axios.get(`${API_BASE_URL}/weather/cyclones/${id}`, { timeout: 8000 });
  if (res.data?.success) {
    return res.data.data;
  }
  throw new Error(res.data?.message || 'Cyclone not found.');
}

/**
 * 4. Fetch Global Disaster Events (GDACS)
 */
export async function fetchDisasterEvents(type = 'ALL') {
  const cacheKey = `disasters_${type}`;

  try {
    const res = await axios.get(`${API_BASE_URL}/weather/disasters`, {
      params: { type },
      timeout: 10000,
    });
    if (res.data?.success && res.data.data) {
      setLocalCache(cacheKey, res.data.data);
      return { ...res.data.data, isCached: false };
    }
    throw new Error(res.data?.message || 'Failed to fetch disaster events.');
  } catch (err) {
    const cached = getLocalCache(cacheKey);
    if (cached) {
      return {
        ...cached.data,
        isCached: true,
        cachedAt: cached.cachedAt,
      };
    }
    throw err;
  }
}

/**
 * 5. Search City / Region via Geocoding
 */
export async function searchLocations(query) {
  const res = await axios.get(`${API_BASE_URL}/weather/location`, {
    params: { q: query },
    timeout: 6000,
  });
  if (res.data?.success) {
    return res.data.data.results || [];
  }
  return [];
}

/**
 * 6. Reverse Geocoding
 */
export async function reverseGeocode(lat, lon) {
  try {
    const res = await axios.get(`${API_BASE_URL}/weather/reverse-geocode`, {
      params: { lat, lon },
      timeout: 6000,
    });
    if (res.data?.success) {
      return res.data.data;
    }
  } catch (e) {
    // Ignore error
  }
  return {
    latitude: lat,
    longitude: lon,
    displayName: `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`,
    city: 'Current Location',
  };
}
