const https = require('https');
const http = require('http');

// In-memory TTL Cache (5 minutes default)
const cache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}

/**
 * Universal HTTPS GET helper with IPv4 enforcement (family: 4)
 * to prevent Windows ETIMEDOUT / ENETUNREACH errors on IPv6.
 */
function fetchUrl(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https:');
    const client = isHttps ? https : http;
    const reqOptions = {
      family: 4,
      timeout: options.timeout || 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        'Accept': options.accept || '*/*',
        ...(options.headers || {}),
      },
    };

    const req = client.get(url, reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode >= 400) {
          return reject(new Error(`HTTP ${res.statusCode} from ${url}`));
        }
        resolve({ statusCode: res.statusCode, body: data });
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Request timeout (${reqOptions.timeout}ms) from ${url}`));
    });

    req.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Validates coordinate inputs
 */
function validateCoordinates(lat, lon) {
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lon);
  if (isNaN(latitude) || isNaN(longitude)) {
    throw new Error('Coordinates must be valid numbers');
  }
  if (latitude < -90 || latitude > 90) {
    throw new Error('Latitude must be between -90 and 90');
  }
  if (longitude < -180 || longitude > 180) {
    throw new Error('Longitude must be between -180 and 180');
  }
  return { latitude: Number(latitude.toFixed(4)), longitude: Number(longitude.toFixed(4)) };
}

/**
 * 1. Fetch Current & Comprehensive Weather from Open-Meteo
 */
async function fetchCurrentWeather(lat, lon) {
  const coords = validateCoordinates(lat, lon);
  const cacheKey = `weather_current_${coords.latitude}_${coords.longitude}`;
  const cached = getCached(cacheKey);
  if (cached) return { ...cached, isCached: true };

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,visibility,wind_speed_10m,wind_direction_10m,wind_gusts_10m,uv_index,is_day&timezone=auto`;

  try {
    const res = await fetchUrl(url);
    const parsed = JSON.parse(res.body);

    if (!parsed || !parsed.current) {
      throw new Error('Malformed weather response from Open-Meteo');
    }

    const current = parsed.current;
    const normalized = {
      latitude: coords.latitude,
      longitude: coords.longitude,
      timezone: parsed.timezone,
      elevation: parsed.elevation,
      timestamp: current.time,
      temperature: current.temperature_2m,
      apparentTemperature: current.apparent_temperature,
      relativeHumidity: current.relative_humidity_2m,
      precipitation: current.precipitation,
      rain: current.rain,
      showers: current.showers,
      snowfall: current.snowfall,
      weatherCode: current.weather_code,
      cloudCover: current.cloud_cover,
      pressureMsl: current.pressure_msl,
      visibilityKm: current.visibility != null ? Math.round(current.visibility / 100) / 10 : null, // Open-Meteo returns meters
      windSpeed: current.wind_speed_10m,
      windDirection: current.wind_direction_10m,
      windGusts: current.wind_gusts_10m,
      uvIndex: current.uv_index,
      isDay: current.is_day === 1,
      source: 'Open-Meteo',
      fetchedAt: new Date().toISOString(),
    };

    setCache(cacheKey, normalized);
    return normalized;
  } catch (err) {
    if (cached) return { ...cached, isCached: true, stale: true };
    throw err;
  }
}

/**
 * 2. Fetch Hourly (24h) & 7-Day Forecast from Open-Meteo
 */
async function fetchForecast(lat, lon) {
  const coords = validateCoordinates(lat, lon);
  const cacheKey = `weather_forecast_${coords.latitude}_${coords.longitude}`;
  const cached = getCached(cacheKey);
  if (cached) return { ...cached, isCached: true };

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&hourly=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation_probability,precipitation,rain,showers,weather_code,cloud_cover,pressure_msl,visibility,wind_speed_10m,wind_direction_10m,wind_gusts_10m,uv_index&daily=temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_sum,precipitation_probability_max,weather_code,sunrise,sunset,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant,uv_index_max&timezone=auto&forecast_days=7`;

  try {
    const res = await fetchUrl(url);
    const parsed = JSON.parse(res.body);

    // Format next 24 hours
    const hourly = [];
    if (parsed.hourly && Array.isArray(parsed.hourly.time)) {
      const nowIso = new Date().toISOString();
      const startIndex = parsed.hourly.time.findIndex((t) => t >= nowIso.slice(0, 13)) || 0;
      const effectiveStart = Math.max(0, startIndex);

      for (let i = effectiveStart; i < Math.min(effectiveStart + 24, parsed.hourly.time.length); i++) {
        hourly.push({
          time: parsed.hourly.time[i],
          temperature: parsed.hourly.temperature_2m[i],
          apparentTemperature: parsed.hourly.apparent_temperature[i],
          humidity: parsed.hourly.relative_humidity_2m[i],
          precipitationProbability: parsed.hourly.precipitation_probability[i],
          precipitation: parsed.hourly.precipitation[i],
          weatherCode: parsed.hourly.weather_code[i],
          cloudCover: parsed.hourly.cloud_cover[i],
          pressure: parsed.hourly.pressure_msl[i],
          windSpeed: parsed.hourly.wind_speed_10m[i],
          windDirection: parsed.hourly.wind_direction_10m[i],
          windGusts: parsed.hourly.wind_gusts_10m[i],
          uvIndex: parsed.hourly.uv_index[i],
        });
      }
    }

    // Format 7 daily items
    const daily = [];
    if (parsed.daily && Array.isArray(parsed.daily.time)) {
      for (let i = 0; i < parsed.daily.time.length; i++) {
        daily.push({
          date: parsed.daily.time[i],
          tempMax: parsed.daily.temperature_2m_max[i],
          tempMin: parsed.daily.temperature_2m_min[i],
          apparentTempMax: parsed.daily.apparent_temperature_max[i],
          apparentTempMin: parsed.daily.apparent_temperature_min[i],
          precipitationSum: parsed.daily.precipitation_sum[i],
          precipitationProbabilityMax: parsed.daily.precipitation_probability_max[i],
          weatherCode: parsed.daily.weather_code[i],
          sunrise: parsed.daily.sunrise[i],
          sunset: parsed.daily.sunset[i],
          windSpeedMax: parsed.daily.wind_speed_10m_max[i],
          windGustsMax: parsed.daily.wind_gusts_10m_max[i],
          windDirectionDominant: parsed.daily.wind_direction_10m_dominant[i],
          uvIndexMax: parsed.daily.uv_index_max[i],
        });
      }
    }

    const normalized = {
      latitude: coords.latitude,
      longitude: coords.longitude,
      timezone: parsed.timezone,
      hourly,
      daily,
      source: 'Open-Meteo',
      fetchedAt: new Date().toISOString(),
    };

    setCache(cacheKey, normalized);
    return normalized;
  } catch (err) {
    if (cached) return { ...cached, isCached: true, stale: true };
    throw err;
  }
}

/**
 * 3. Fetch Air Quality (AQI, PM2.5, PM10, etc.) from Open-Meteo Air Quality API
 */
async function fetchAirQuality(lat, lon) {
  const coords = validateCoordinates(lat, lon);
  const cacheKey = `weather_aqi_${coords.latitude}_${coords.longitude}`;
  const cached = getCached(cacheKey);
  if (cached) return { ...cached, isCached: true };

  const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${coords.latitude}&longitude=${coords.longitude}&current=european_aqi,pm2_5,pm10,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,aerosol_optical_depth,dust,uv_index&timezone=auto`;

  try {
    const res = await fetchUrl(url);
    const parsed = JSON.parse(res.body);

    if (!parsed || !parsed.current) {
      throw new Error('Malformed air quality response from Open-Meteo');
    }

    const current = parsed.current;

    // Determine category based on European Air Quality Index (1-5+)
    // 0-20: Good, 20-40: Fair, 40-60: Moderate, 60-80: Poor, 80-100: Very Poor, >100: Extremely Poor
    const aqiVal = current.european_aqi;
    let severity = 'MODERATE';
    if (aqiVal == null) severity = 'UNKNOWN';
    else if (aqiVal <= 20) severity = 'GOOD';
    else if (aqiVal <= 40) severity = 'FAIR';
    else if (aqiVal <= 60) severity = 'MODERATE';
    else if (aqiVal <= 80) severity = 'POOR';
    else if (aqiVal <= 100) severity = 'VERY POOR';
    else severity = 'EXTREMELY POOR';

    const normalized = {
      latitude: coords.latitude,
      longitude: coords.longitude,
      timestamp: current.time,
      europeanAqi: current.european_aqi,
      severity,
      pm2_5: current.pm2_5,
      pm10: current.pm10,
      carbonMonoxide: current.carbon_monoxide,
      nitrogenDioxide: current.nitrogen_dioxide,
      sulphurDioxide: current.sulphur_dioxide,
      ozone: current.ozone,
      dust: current.dust,
      uvIndex: current.uv_index,
      aerosolOpticalDepth: current.aerosol_optical_depth,
      methodology: 'European Air Quality Index (EAQI) / Open-Meteo CAMS',
      source: 'Open-Meteo Air Quality',
      fetchedAt: new Date().toISOString(),
    };

    setCache(cacheKey, normalized);
    return normalized;
  } catch (err) {
    if (cached) return { ...cached, isCached: true, stale: true };
    throw err;
  }
}

/**
 * Parses XML tag contents using regex
 */
function extractXmlTag(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match ? match[1].trim() : '';
}

function extractXmlAttr(xml, tag, attr) {
  const match = xml.match(new RegExp(`<${tag}[^>]*\\s+${attr}=["']([^"']*)["'][^>]*>`, 'i'));
  return match ? match[1].trim() : '';
}

/**
 * 4. Fetch Active Tropical Cyclones from GDACS RSS feed
 */
async function fetchActiveCyclones() {
  const cacheKey = 'weather_active_cyclones';
  const cached = getCached(cacheKey);
  if (cached) return { ...cached, isCached: true };

  const url = 'https://www.gdacs.org/xml/rss.xml';

  try {
    const res = await fetchUrl(url, { timeout: 10000 });
    const rawXml = res.body;

    const items = rawXml.split('<item>').slice(1);
    const cyclones = [];

    for (const itemXml of items) {
      const eventType = extractXmlTag(itemXml, 'gdacs:eventtype');
      if (eventType !== 'TC') continue;

      const eventId = extractXmlTag(itemXml, 'gdacs:eventid');
      const episodeId = extractXmlTag(itemXml, 'gdacs:episodeid');
      const name = extractXmlTag(itemXml, 'gdacs:eventname') || extractXmlTag(itemXml, 'title') || 'Tropical Cyclone';
      const alertLevel = extractXmlTag(itemXml, 'gdacs:alertlevel') || 'Green';
      const alertScore = parseFloat(extractXmlTag(itemXml, 'gdacs:alertscore')) || 0;
      const lat = parseFloat(extractXmlTag(itemXml, 'geo:lat'));
      const lon = parseFloat(extractXmlTag(itemXml, 'geo:long'));
      const country = extractXmlTag(itemXml, 'gdacs:country');
      const iso3 = extractXmlTag(itemXml, 'gdacs:iso3');
      const pubDate = extractXmlTag(itemXml, 'pubDate');
      const fromDate = extractXmlTag(itemXml, 'gdacs:fromdate');
      const toDate = extractXmlTag(itemXml, 'gdacs:todate');
      const link = extractXmlTag(itemXml, 'link');
      const capUrl = extractXmlTag(itemXml, 'gdacs:cap');
      const iconUrl = extractXmlTag(itemXml, 'gdacs:icon');
      const severityText = extractXmlTag(itemXml, 'gdacs:severity');
      const severityVal = parseFloat(extractXmlAttr(itemXml, 'gdacs:severity', 'value')) || 0;
      const severityUnit = extractXmlAttr(itemXml, 'gdacs:severity', 'unit') || 'km/h';
      const description = extractXmlTag(itemXml, 'description');

      // Extract wind speed and category from severity description
      let maxWindKmh = severityVal;
      let category = 'Tropical Depression / Storm';
      if (maxWindKmh >= 252) category = 'Category 5 Super Typhoon / Hurricane';
      else if (maxWindKmh >= 209) category = 'Category 4 Major Cyclone';
      else if (maxWindKmh >= 178) category = 'Category 3 Severe Cyclone';
      else if (maxWindKmh >= 154) category = 'Category 2 Cyclone';
      else if (maxWindKmh >= 119) category = 'Category 1 Cyclone';
      else if (maxWindKmh >= 63) category = 'Tropical Storm';

      cyclones.push({
        id: eventId,
        episodeId,
        name,
        eventType: 'TC',
        alertLevel,
        alertScore,
        category,
        maxWindKmh: Math.round(maxWindKmh),
        maxWindUnit: severityUnit,
        severityText,
        latitude: !isNaN(lat) ? lat : 0,
        longitude: !isNaN(lon) ? lon : 0,
        country: country || 'International Waters',
        iso3,
        fromDate,
        toDate,
        pubDate,
        link,
        capUrl,
        iconUrl,
        description,
        source: 'GDACS (Global Disaster Alert and Coordination System)',
      });
    }

    const payload = {
      count: cyclones.length,
      cyclones,
      source: 'GDACS',
      fetchedAt: new Date().toISOString(),
    };

    setCache(cacheKey, payload);
    return payload;
  } catch (err) {
    if (cached) return { ...cached, isCached: true, stale: true };
    throw err;
  }
}

/**
 * 5. Fetch Single Cyclone Details + CAP Polygon Track
 */
async function fetchCycloneById(id) {
  const allCyclones = await fetchActiveCyclones();
  const found = allCyclones.cyclones.find((c) => String(c.id) === String(id));
  if (!found) {
    throw new Error(`Cyclone with ID ${id} not found in active registry.`);
  }

  // If CAP URL is available, fetch the track polygon
  let polygon = [];
  if (found.capUrl) {
    try {
      const capRes = await fetchUrl(found.capUrl, { timeout: 6000 });
      const polygonRaw = extractXmlTag(capRes.body, 'polygon');
      if (polygonRaw) {
        // Format: "lat1,lon1 lat2,lon2 ..."
        polygon = polygonRaw
          .split(/\s+/)
          .map((pair) => {
            const [pLat, pLon] = pair.split(',').map(Number);
            return !isNaN(pLat) && !isNaN(pLon) ? [pLat, pLon] : null;
          })
          .filter(Boolean);
      }
    } catch (e) {
      console.warn(`Could not load CAP polygon for cyclone ${id}:`, e.message);
    }
  }

  return {
    ...found,
    trackPolygon: polygon,
  };
}

/**
 * 6. Fetch Global Disaster Events from GDACS (EQ, FL, VO, WF, TC)
 */
async function fetchDisasterEvents(filterType = 'ALL') {
  const cacheKey = `weather_disaster_events_${filterType}`;
  const cached = getCached(cacheKey);
  if (cached) return { ...cached, isCached: true };

  const url = 'https://www.gdacs.org/xml/rss.xml';

  try {
    const res = await fetchUrl(url, { timeout: 10000 });
    const rawXml = res.body;

    const items = rawXml.split('<item>').slice(1);
    const events = [];

    for (const itemXml of items) {
      const eventType = extractXmlTag(itemXml, 'gdacs:eventtype');
      if (filterType !== 'ALL' && eventType !== filterType.toUpperCase()) {
        continue;
      }

      const eventId = extractXmlTag(itemXml, 'gdacs:eventid');
      const name = extractXmlTag(itemXml, 'gdacs:eventname') || extractXmlTag(itemXml, 'title');
      const alertLevel = extractXmlTag(itemXml, 'gdacs:alertlevel') || 'Green';
      const lat = parseFloat(extractXmlTag(itemXml, 'geo:lat'));
      const lon = parseFloat(extractXmlTag(itemXml, 'geo:long'));
      const country = extractXmlTag(itemXml, 'gdacs:country');
      const pubDate = extractXmlTag(itemXml, 'pubDate');
      const severityText = extractXmlTag(itemXml, 'gdacs:severity');
      const link = extractXmlTag(itemXml, 'link');

      if (!isNaN(lat) && !isNaN(lon)) {
        events.push({
          id: eventId || `ev_${Math.random().toString(36).slice(2, 9)}`,
          title: name,
          eventType,
          alertLevel,
          latitude: lat,
          longitude: lon,
          country: country || 'Global',
          severityText,
          pubDate,
          link,
          source: 'GDACS',
        });
      }
    }

    const payload = {
      count: events.length,
      events,
      filter: filterType,
      source: 'GDACS',
      fetchedAt: new Date().toISOString(),
    };

    setCache(cacheKey, payload);
    return payload;
  } catch (err) {
    if (cached) return { ...cached, isCached: true, stale: true };
    throw err;
  }
}

/**
 * 7. Location Search via Open-Meteo Geocoding API
 */
async function searchGeocoding(query) {
  if (!query || typeof query !== 'string' || query.trim().length < 2) {
    throw new Error('Search query must be at least 2 characters');
  }

  const cleanQuery = query.trim();
  const cacheKey = `geocoding_${cleanQuery.toLowerCase()}`;
  const cached = getCached(cacheKey);
  if (cached) return { ...cached, isCached: true };

  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cleanQuery)}&count=10&language=en&format=json`;

  try {
    const res = await fetchUrl(url, { timeout: 6000 });
    const parsed = JSON.parse(res.body);

    const results = (parsed.results || []).map((r) => ({
      id: r.id,
      name: r.name,
      latitude: r.latitude,
      longitude: r.longitude,
      elevation: r.elevation,
      featureCode: r.feature_code,
      country: r.country,
      countryCode: r.country_code,
      admin1: r.admin1, // State / Province
      admin2: r.admin2, // District
      timezone: r.timezone,
      population: r.population,
    }));

    const payload = { results, count: results.length };
    setCache(cacheKey, payload);
    return payload;
  } catch (err) {
    if (cached) return { ...cached, isCached: true, stale: true };
    throw err;
  }
}

/**
 * 8. Reverse Geocoding (coordinates to location name)
 */
async function reverseGeocode(lat, lon) {
  const coords = validateCoordinates(lat, lon);
  const cacheKey = `reverse_geo_${coords.latitude}_${coords.longitude}`;
  const cached = getCached(cacheKey);
  if (cached) return { ...cached, isCached: true };

  // Use OpenStreetMap Nominatim with proper User-Agent
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}&zoom=10&addressdetails=1`;

  try {
    const res = await fetchUrl(url, {
      timeout: 6000,
      headers: { 'User-Agent': 'DisasterChain-CivicProtection/2.0' },
    });
    const parsed = JSON.parse(res.body);

    const address = parsed.address || {};
    const city = address.city || address.town || address.village || address.county || address.state_district || 'Local Sector';
    const state = address.state || address.region || '';
    const country = address.country || '';

    const payload = {
      latitude: coords.latitude,
      longitude: coords.longitude,
      displayName: parsed.display_name || `${city}, ${country}`,
      city,
      state,
      country,
      countryCode: address.country_code?.toUpperCase(),
    };

    setCache(cacheKey, payload);
    return payload;
  } catch (err) {
    // Graceful fallback without crashing
    const fallback = {
      latitude: coords.latitude,
      longitude: coords.longitude,
      displayName: `Coordinates [${coords.latitude}, ${coords.longitude}]`,
      city: 'Current Coordinates',
      state: '',
      country: '',
      countryCode: '',
    };
    return fallback;
  }
}

module.exports = {
  fetchCurrentWeather,
  fetchForecast,
  fetchAirQuality,
  fetchActiveCyclones,
  fetchCycloneById,
  fetchDisasterEvents,
  searchGeocoding,
  reverseGeocode,
  validateCoordinates,
};
