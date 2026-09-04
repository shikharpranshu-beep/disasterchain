/**
 * DisasterChain Weather & Atmospheric Intelligence API Service
 * Production-ready hybrid client:
 * 1. Queries DisasterChain backend (Render / Local) with 5-minute server-side caching
 * 2. If backend is cold-starting / deploying / unreachable: falls back to direct Open-Meteo client queries in real-time
 * 3. If completely offline: falls back to localStorage client cache with exact last-updated timestamp
 */

import axios from 'axios';

export const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    ? 'https://disasterrchain-backend.onrender.com/api'
    : 'http://localhost:5000/api');

const STORAGE_PREFIX = 'dc_weather_cache_';

// Client-side cache helper
export function getLocalCache(key) {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function setLocalCache(key, data) {
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
 * Direct client-side fetch to Open-Meteo if backend is sleeping or unreachable
 */
async function fetchDirectOpenMeteo(lat, lon) {
  const latitude = Number(Number(lat).toFixed(4));
  const longitude = Number(Number(lon).toFixed(4));

  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,visibility,wind_speed_10m,wind_direction_10m,wind_gusts_10m,uv_index,is_day&hourly=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation_probability,precipitation,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m,uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_sum,precipitation_probability_max,sunrise,sunset,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant,uv_index_max&timezone=auto`;
  const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=european_aqi,pm2_5,pm10,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,aerosol_optical_depth,dust,uv_index&timezone=auto`;

  const [weatherRes, aqiRes] = await Promise.allSettled([
    axios.get(weatherUrl, { timeout: 15000 }),
    axios.get(aqiUrl, { timeout: 15000 }),
  ]);

  let current = null;
  let forecast = null;
  let airQuality = null;

  if (weatherRes.status === 'fulfilled' && weatherRes.value?.data) {
    const wData = weatherRes.value.data;
    const c = wData.current || {};
    current = {
      latitude,
      longitude,
      timezone: wData.timezone,
      elevation: wData.elevation,
      timestamp: c.time,
      temperature: c.temperature_2m,
      apparentTemperature: c.apparent_temperature,
      relativeHumidity: c.relative_humidity_2m,
      precipitation: c.precipitation,
      rain: c.rain,
      showers: c.showers,
      snowfall: c.snowfall,
      weatherCode: c.weather_code,
      cloudCover: c.cloud_cover,
      pressure: c.pressure_msl,
      visibility: c.visibility != null ? Number((c.visibility / 1000).toFixed(1)) : null,
      windSpeed: c.wind_speed_10m,
      windDirection: c.wind_direction_10m,
      windGusts: c.wind_gusts_10m,
      uvIndex: c.uv_index,
      isDay: c.is_day,
      source: 'Open-Meteo Direct',
      fetchedAt: new Date().toISOString(),
    };

    const hourly = [];
    if (wData.hourly?.time) {
      const nowIso = new Date().toISOString();
      const startIndex = Math.max(0, wData.hourly.time.findIndex((t) => t >= nowIso.slice(0, 13)));
      for (let i = startIndex; i < Math.min(startIndex + 24, wData.hourly.time.length); i++) {
        hourly.push({
          time: wData.hourly.time[i],
          temperature: wData.hourly.temperature_2m?.[i],
          apparentTemperature: wData.hourly.apparent_temperature?.[i],
          humidity: wData.hourly.relative_humidity_2m?.[i],
          precipitationProbability: wData.hourly.precipitation_probability?.[i],
          precipitation: wData.hourly.precipitation?.[i],
          weatherCode: wData.hourly.weather_code?.[i],
          cloudCover: wData.hourly.cloud_cover?.[i],
          pressure: wData.hourly.pressure_msl?.[i],
          windSpeed: wData.hourly.wind_speed_10m?.[i],
          windDirection: wData.hourly.wind_direction_10m?.[i],
          windGusts: wData.hourly.wind_gusts_10m?.[i],
          uvIndex: wData.hourly.uv_index?.[i],
        });
      }
    }

    const daily = [];
    if (wData.daily?.time) {
      for (let i = 0; i < wData.daily.time.length; i++) {
        daily.push({
          date: wData.daily.time[i],
          tempMax: wData.daily.temperature_2m_max?.[i],
          tempMin: wData.daily.temperature_2m_min?.[i],
          apparentTempMax: wData.daily.apparent_temperature_max?.[i],
          apparentTempMin: wData.daily.apparent_temperature_min?.[i],
          precipitationSum: wData.daily.precipitation_sum?.[i],
          precipitationProbabilityMax: wData.daily.precipitation_probability_max?.[i],
          weatherCode: wData.daily.weather_code?.[i],
          sunrise: wData.daily.sunrise?.[i],
          sunset: wData.daily.sunset?.[i],
          windSpeedMax: wData.daily.wind_speed_10m_max?.[i],
          windGustsMax: wData.daily.wind_gusts_10m_max?.[i],
          windDirectionDominant: wData.daily.wind_direction_10m_dominant?.[i],
          uvIndexMax: wData.daily.uv_index_max?.[i],
        });
      }
    }

    forecast = {
      latitude,
      longitude,
      timezone: wData.timezone,
      hourly,
      daily,
      source: 'Open-Meteo Direct',
      fetchedAt: new Date().toISOString(),
    };
  }

  if (aqiRes.status === 'fulfilled' && aqiRes.value?.data?.current) {
    const ac = aqiRes.value.data.current;
    const aqiVal = ac.european_aqi;
    let severity = 'MODERATE';
    if (aqiVal == null) severity = 'UNKNOWN';
    else if (aqiVal <= 20) severity = 'GOOD';
    else if (aqiVal <= 40) severity = 'FAIR';
    else if (aqiVal <= 60) severity = 'MODERATE';
    else if (aqiVal <= 80) severity = 'POOR';
    else if (aqiVal <= 100) severity = 'VERY POOR';
    else severity = 'EXTREMELY POOR';

    airQuality = {
      latitude,
      longitude,
      timestamp: ac.time,
      europeanAqi: ac.european_aqi,
      severity,
      pm2_5: ac.pm2_5,
      pm10: ac.pm10,
      carbonMonoxide: ac.carbon_monoxide,
      nitrogenDioxide: ac.nitrogen_dioxide,
      sulphurDioxide: ac.sulphur_dioxide,
      ozone: ac.ozone,
      dust: ac.dust,
      uvIndex: ac.uv_index,
      aerosolOpticalDepth: ac.aerosol_optical_depth,
      source: 'Open-Meteo Air Quality Direct',
      fetchedAt: new Date().toISOString(),
    };
  }

  const successCount = (current ? 1 : 0) + (forecast ? 1 : 0) + (airQuality ? 1 : 0);
  if (successCount === 0) {
    throw new Error('Both backend and direct atmospheric feeds failed.');
  }

  const feedStatus = successCount >= 2 ? (airQuality ? 'LIVE' : 'PARTIAL_LIVE') : 'PARTIAL_LIVE';

  return {
    feedStatus,
    isCached: false,
    timestamp: new Date().toISOString(),
    current,
    forecast,
    airQuality,
    location: {
      latitude,
      longitude,
      displayName: `Sector [${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°]`,
      city: 'Live Coordinate Sector',
    },
  };
}

/**
 * 1. Fetch Complete Weather (Current + Forecast + Air Quality + Location)
 * Uses backend API first, then falls back to direct Open-Meteo, then to localStorage cache.
 */
export async function fetchCompleteWeather(lat, lon) {
  const cacheKey = `complete_${Number(lat).toFixed(2)}_${Number(lon).toFixed(2)}`;

  // Step 1: Try DisasterChain backend
  try {
    const res = await axios.get(`${API_BASE_URL}/weather/complete`, {
      params: { lat, lon },
      timeout: 15000,
    });

    if (res.data?.success && res.data.data) {
      const data = res.data.data;
      setLocalCache(cacheKey, data);
      setLocalCache('latest_overview', data);
      return {
        ...data,
        isCached: false,
        feedStatus: data.feedStatus || (data.current && data.airQuality ? 'LIVE' : 'PARTIAL_LIVE'),
      };
    }
  } catch (backendErr) {
    // Backend 404/502/timeout: proceed to Step 2
  }

  // Step 2: Fallback to direct client-side Open-Meteo request
  try {
    const directData = await fetchDirectOpenMeteo(lat, lon);
    setLocalCache(cacheKey, directData);
    setLocalCache('latest_overview', directData);
    return directData;
  } catch (directErr) {
    // Direct network also failed: proceed to Step 3
  }

  // Step 3: Offline local storage cache
  const cached = getLocalCache(cacheKey) || getLocalCache('latest_overview');
  if (cached && cached.data) {
    return {
      ...cached.data,
      isCached: true,
      feedStatus: 'CACHED',
      cachedAt: cached.cachedAt,
    };
  }

  throw new Error('External atmospheric feeds could not be reached. Local cached weather records remain active.');
}

/**
 * 2. Fetch Active Tropical Cyclones
 */
export async function fetchActiveCyclones() {
  const cacheKey = 'cyclones';

  try {
    const res = await axios.get(`${API_BASE_URL}/weather/cyclones`, { timeout: 12000 });
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
    // Return empty list safely rather than crashing
    return { count: 0, cyclones: [], isCached: true };
  }
}

/**
 * 3. Fetch Single Cyclone Details + Track Polygon
 */
export async function fetchCycloneById(id) {
  try {
    const res = await axios.get(`${API_BASE_URL}/weather/cyclones/${id}`, { timeout: 10000 });
    if (res.data?.success) {
      return res.data.data;
    }
  } catch (e) {
    // Fall back to active cyclones list in cache
    const cached = getLocalCache('cyclones');
    if (cached?.cyclones) {
      const found = cached.cyclones.find((c) => String(c.id) === String(id));
      if (found) return found;
    }
  }
  throw new Error('Cyclone details unavailable.');
}

/**
 * 4. Fetch Global Disaster Events (GDACS)
 */
export async function fetchDisasterEvents(type = 'ALL') {
  const cacheKey = `disasters_${type}`;

  try {
    const res = await axios.get(`${API_BASE_URL}/weather/disasters`, {
      params: { type },
      timeout: 12000,
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
    return { count: 0, events: [], isCached: true };
  }
}

/**
 * 5. Search City / Region via Geocoding
 * Uses backend API with direct Open-Meteo fallback
 */
export async function searchLocations(query) {
  if (!query || typeof query !== 'string' || query.trim().length < 2) {
    return [];
  }

  // Try backend first
  try {
    const res = await axios.get(`${API_BASE_URL}/weather/location`, {
      params: { q: query },
      timeout: 8000,
    });
    if (res.data?.success && res.data.data?.results) {
      return res.data.data.results;
    }
  } catch (e) {
    // Backend unavailable, fallback to direct Open-Meteo geocoding
  }

  try {
    const directRes = await axios.get(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query.trim())}&count=10&language=en&format=json`,
      { timeout: 8000 }
    );
    if (directRes.data?.results) {
      return directRes.data.results.map((r) => ({
        id: r.id,
        name: r.name,
        latitude: r.latitude,
        longitude: r.longitude,
        elevation: r.elevation,
        country: r.country,
        countryCode: r.country_code,
        admin1: r.admin1,
        admin2: r.admin2,
        timezone: r.timezone,
        population: r.population,
      }));
    }
  } catch (e) {
    // Direct search error
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
      timeout: 8000,
    });
    if (res.data?.success && res.data.data) {
      return res.data.data;
    }
  } catch (e) {
    // Backend unavailable: fallback to Nominatim
  }

  try {
    const nomRes = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`,
      { timeout: 8000 }
    );
    if (nomRes.data) {
      const addr = nomRes.data.address || {};
      const city = addr.city || addr.town || addr.village || addr.county || 'Local Sector';
      return {
        latitude: lat,
        longitude: lon,
        displayName: nomRes.data.display_name || `${city}, ${addr.country || ''}`,
        city,
        state: addr.state || '',
        country: addr.country || '',
      };
    }
  } catch (e) {
    // Ignore error
  }

  return {
    latitude: lat,
    longitude: lon,
    displayName: `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`,
    city: 'Current Coordinates',
  };
}
