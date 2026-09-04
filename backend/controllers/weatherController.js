const weatherService = require('../services/weatherService');

/**
 * Helper to extract coordinates supporting lat/latitude and lon/longitude/lng
 */
function extractCoords(query) {
  const lat = query.lat !== undefined ? query.lat : query.latitude;
  const lon = query.lon !== undefined ? query.lon : (query.longitude !== undefined ? query.longitude : query.lng);
  return { lat, lon };
}

/**
 * GET /api/weather/current?lat=&lon= or ?latitude=&longitude=
 */
async function getCurrentWeather(req, res) {
  try {
    const { lat, lon } = extractCoords(req.query);
    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        message: 'Query parameters "lat" (or "latitude") and "lon" (or "longitude") are required.',
      });
    }

    const data = await weatherService.fetchCurrentWeather(lat, lon);
    return res.json({
      success: true,
      data,
    });
  } catch (err) {
    const status = err.message.includes('Coordinates must') || err.message.includes('Latitude must') || err.message.includes('Longitude must') ? 400 : 502;
    return res.status(status).json({
      success: false,
      message: err.message || 'Failed to fetch current weather data.',
    });
  }
}

/**
 * GET /api/weather/forecast?lat=&lon= or ?latitude=&longitude=
 */
async function getForecast(req, res) {
  try {
    const { lat, lon } = extractCoords(req.query);
    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        message: 'Query parameters "lat" (or "latitude") and "lon" (or "longitude") are required.',
      });
    }

    const data = await weatherService.fetchForecast(lat, lon);
    return res.json({
      success: true,
      data,
    });
  } catch (err) {
    const status = err.message.includes('Coordinates must') || err.message.includes('Latitude must') || err.message.includes('Longitude must') ? 400 : 502;
    return res.status(status).json({
      success: false,
      message: err.message || 'Failed to fetch weather forecast.',
    });
  }
}

/**
 * GET /api/weather/air-quality?lat=&lon= or ?latitude=&longitude=
 */
async function getAirQuality(req, res) {
  try {
    const { lat, lon } = extractCoords(req.query);
    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        message: 'Query parameters "lat" (or "latitude") and "lon" (or "longitude") are required.',
      });
    }

    const data = await weatherService.fetchAirQuality(lat, lon);
    return res.json({
      success: true,
      data,
    });
  } catch (err) {
    const status = err.message.includes('Coordinates must') || err.message.includes('Latitude must') || err.message.includes('Longitude must') ? 400 : 502;
    return res.status(status).json({
      success: false,
      message: err.message || 'Failed to fetch air quality data.',
    });
  }
}

/**
 * GET /api/weather/complete?lat=&lon= or ?latitude=&longitude=
 * Consolidated endpoint returning current weather, forecast, and AQI independently
 */
async function getCompleteWeather(req, res) {
  try {
    const { lat, lon } = extractCoords(req.query);
    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        message: 'Query parameters "lat" (or "latitude") and "lon" (or "longitude") are required.',
      });
    }

    const [current, forecast, airQuality, location] = await Promise.allSettled([
      weatherService.fetchCurrentWeather(lat, lon),
      weatherService.fetchForecast(lat, lon),
      weatherService.fetchAirQuality(lat, lon),
      weatherService.reverseGeocode(lat, lon),
    ]);

    const feedsSuccessCount = [current, forecast, airQuality].filter((f) => f.status === 'fulfilled').length;
    let feedStatus = 'UNAVAILABLE';
    if (feedsSuccessCount === 3) feedStatus = 'LIVE';
    else if (feedsSuccessCount > 0) feedStatus = 'PARTIAL_LIVE';

    return res.json({
      success: feedsSuccessCount > 0,
      data: {
        feedStatus,
        isCached: false,
        timestamp: new Date().toISOString(),
        current: current.status === 'fulfilled' ? current.value : null,
        currentError: current.status === 'rejected' ? current.reason?.message : null,
        forecast: forecast.status === 'fulfilled' ? forecast.value : null,
        forecastError: forecast.status === 'rejected' ? forecast.reason?.message : null,
        airQuality: airQuality.status === 'fulfilled' ? airQuality.value : null,
        airQualityError: airQuality.status === 'rejected' ? airQuality.reason?.message : null,
        location: location.status === 'fulfilled' ? location.value : null,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to retrieve complete weather overview.',
    });
  }
}

/**
 * GET /api/weather/cyclones
 */
async function getCyclones(req, res) {
  try {
    const data = await weatherService.fetchActiveCyclones();
    return res.json({
      success: true,
      data,
    });
  } catch (err) {
    return res.status(502).json({
      success: false,
      message: err.message || 'Failed to fetch active cyclone registry.',
    });
  }
}

/**
 * GET /api/weather/cyclones/:id
 */
async function getCycloneById(req, res) {
  try {
    const { id } = req.params;
    const data = await weatherService.fetchCycloneById(id);
    return res.json({
      success: true,
      data,
    });
  } catch (err) {
    return res.status(404).json({
      success: false,
      message: err.message || 'Cyclone not found.',
    });
  }
}

/**
 * GET /api/weather/disasters?type=
 */
async function getDisasterEvents(req, res) {
  try {
    const type = req.query.type || 'ALL';
    const data = await weatherService.fetchDisasterEvents(type);
    return res.json({
      success: true,
      data,
    });
  } catch (err) {
    return res.status(502).json({
      success: false,
      message: err.message || 'Failed to fetch global disaster events.',
    });
  }
}

/**
 * GET /api/weather/location?q= or ?query= or ?name=
 */
async function searchLocation(req, res) {
  try {
    const q = req.query.q || req.query.query || req.query.name;
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Query parameter "q" (or "query" / "name") is required.',
      });
    }

    const data = await weatherService.searchGeocoding(q);
    return res.json({
      success: true,
      data,
    });
  } catch (err) {
    const status = err.message.includes('at least 2 characters') ? 400 : 502;
    return res.status(status).json({
      success: false,
      message: err.message || 'Location search failed.',
    });
  }
}

/**
 * GET /api/weather/reverse-geocode?lat=&lon= or ?latitude=&longitude=
 */
async function reverseGeocode(req, res) {
  try {
    const { lat, lon } = extractCoords(req.query);
    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        message: 'Query parameters "lat" (or "latitude") and "lon" (or "longitude") are required.',
      });
    }

    const data = await weatherService.reverseGeocode(lat, lon);
    return res.json({
      success: true,
      data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Reverse geocoding failed.',
    });
  }
}

module.exports = {
  getCurrentWeather,
  getForecast,
  getAirQuality,
  getCompleteWeather,
  getCyclones,
  getCycloneById,
  getDisasterEvents,
  searchLocation,
  reverseGeocode,
};
