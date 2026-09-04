/**
 * DisasterChain Weather & Atmospheric Intelligence Automated Test Suite
 * Validates Open-Meteo weather normalization, AQI, GDACS cyclone feed,
 * caching behavior, coordinate boundaries, AI assistant tool integrations,
 * and error resilience without fabricated fallback values.
 */

const assert = require('assert');
const http = require('http');
const weatherService = require('./services/weatherService');
const aiAssistantService = require('./services/aiAssistantService');

let passedTests = 0;
let totalTests = 0;

function it(desc, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ [PASS] ${desc}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${desc}`);
    console.error(`     ${err.message}`);
    throw err;
  }
}

async function itAsync(desc, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✅ [PASS] ${desc}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${desc}`);
    console.error(`     ${err.message}`);
    throw err;
  }
}

// HTTP request helper
function requestGet(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:5000${path}`, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    }).on('error', reject);
  });
}

async function runWeatherTestSuite() {
  console.log('================================================================');
  console.log('🌤️ DISASTERCHAIN WEATHER & ATMOSPHERIC INTELLIGENCE TEST SUITE');
  console.log('================================================================\n');

  // --- 1. Coordinate Validation Tests ---
  console.log('--- 1. Coordinate Boundary & Input Validation ---');
  it('Validates normal coordinates within range (-90 to 90, -180 to 180)', () => {
    const coords = weatherService.validateCoordinates('28.6139', '77.2090');
    assert.strictEqual(coords.latitude, 28.6139);
    assert.strictEqual(coords.longitude, 77.209);
  });

  it('Rejects latitude above 90 degrees', () => {
    assert.throws(() => weatherService.validateCoordinates('95.0', '77.2'), /Latitude must be between -90 and 90/);
  });

  it('Rejects latitude below -90 degrees', () => {
    assert.throws(() => weatherService.validateCoordinates('-95.0', '77.2'), /Latitude must be between -90 and 90/);
  });

  it('Rejects longitude above 180 degrees', () => {
    assert.throws(() => weatherService.validateCoordinates('28.6', '195.0'), /Longitude must be between -180 and 180/);
  });

  it('Rejects longitude below -180 degrees', () => {
    assert.throws(() => weatherService.validateCoordinates('28.6', '-195.0'), /Longitude must be between -180 and 180/);
  });

  it('Rejects non-numeric strings as coordinates', () => {
    assert.throws(() => weatherService.validateCoordinates('invalid', 'coords'), /Coordinates must be valid numbers/);
  });

  // --- 2. Live Open-Meteo Current Weather Normalization ---
  console.log('\n--- 2. Live Current Weather Normalization (Open-Meteo) ---');
  await itAsync('Fetches and normalizes current weather for New Delhi', async () => {
    const data = await weatherService.fetchCurrentWeather(28.6139, 77.2090);
    assert(data != null, 'Weather data must not be null');
    assert(typeof data.temperature === 'number', 'Temperature must be numeric');
    assert(typeof data.apparentTemperature === 'number', 'Apparent temperature must be numeric');
    assert(typeof data.relativeHumidity === 'number', 'Humidity must be numeric');
    assert(typeof data.windSpeed === 'number', 'Wind speed must be numeric');
    assert(typeof data.pressureMsl === 'number', 'Atmospheric pressure must be numeric');
    assert(data.source === 'Open-Meteo', 'Source attribution must be Open-Meteo');
    assert(data.temperature > -50 && data.temperature < 60, 'Temperature within Earth atmospheric range');
  });

  // --- 3. Live Open-Meteo Forecast Normalization ---
  console.log('\n--- 3. Weather Forecast Normalization (24h Hourly & 7-Day Daily) ---');
  await itAsync('Fetches and formats next 24 hours hourly forecast', async () => {
    const data = await weatherService.fetchForecast(28.6139, 77.2090);
    assert(Array.isArray(data.hourly), 'Hourly must be an array');
    assert(data.hourly.length >= 24, `Must return at least 24 hours (got ${data.hourly.length})`);
    const h0 = data.hourly[0];
    assert(h0.time != null, 'Hourly entry must contain time');
    assert(typeof h0.temperature === 'number', 'Hourly entry must contain numeric temperature');
    assert(typeof h0.windSpeed === 'number', 'Hourly entry must contain wind speed');
  });

  await itAsync('Fetches and formats 7-day daily forecast outlook', async () => {
    const data = await weatherService.fetchForecast(28.6139, 77.2090);
    assert(Array.isArray(data.daily), 'Daily must be an array');
    assert(data.daily.length >= 7, `Must return at least 7 days (got ${data.daily.length})`);
    const d0 = data.daily[0];
    assert(d0.date != null, 'Daily entry must have date');
    assert(typeof d0.tempMax === 'number', 'Daily entry must have tempMax');
    assert(typeof d0.tempMin === 'number', 'Daily entry must have tempMin');
    assert(d0.tempMax >= d0.tempMin, 'Max temperature must be >= min temperature');
  });

  // --- 4. Live Open-Meteo Air Quality (AQI) Normalization ---
  console.log('\n--- 4. Air Quality Telemetry Normalization (Open-Meteo EAQI) ---');
  await itAsync('Fetches and categorizes air quality index', async () => {
    const data = await weatherService.fetchAirQuality(28.6139, 77.2090);
    assert(data != null, 'AQI data must not be null');
    assert(typeof data.europeanAqi === 'number', 'European AQI must be numeric');
    assert(['GOOD', 'FAIR', 'MODERATE', 'POOR', 'VERY POOR', 'EXTREMELY POOR', 'UNKNOWN'].includes(data.severity), `Valid severity (got ${data.severity})`);
    assert(data.methodology.includes('European Air Quality Index'), 'Methodology labeled clearly');
  });

  // --- 5. GDACS Tropical Cyclones Surveillance ---
  console.log('\n--- 5. Global Tropical Cyclone Surveillance (GDACS) ---');
  await itAsync('Fetches active tropical cyclones from GDACS RSS feed', async () => {
    const data = await weatherService.fetchActiveCyclones();
    assert(data != null, 'Cyclone feed must not be null');
    assert(Array.isArray(data.cyclones), 'Cyclones must be an array');
    assert(typeof data.count === 'number', 'Must return cyclone count');
    assert.strictEqual(data.source, 'GDACS');

    if (data.cyclones.length > 0) {
      const c = data.cyclones[0];
      assert(c.id != null, 'Cyclone must have ID');
      assert(c.name != null, 'Cyclone must have name');
      assert(typeof c.latitude === 'number', 'Cyclone must have numeric latitude');
      assert(typeof c.longitude === 'number', 'Cyclone must have numeric longitude');
      assert(typeof c.maxWindKmh === 'number', 'Cyclone must have numeric max wind speed');
    }
  });

  // --- 6. GDACS Global Disaster Events ---
  console.log('\n--- 6. Global Disaster Events (GDACS Multi-hazard) ---');
  await itAsync('Fetches disaster events across event types (EQ, FL, VO, WF)', async () => {
    const data = await weatherService.fetchDisasterEvents('ALL');
    assert(data != null, 'Disaster events must not be null');
    assert(Array.isArray(data.events), 'Events must be an array');
    assert(data.events.length > 0, 'GDACS global events feed should have active records');
    const ev = data.events[0];
    assert(ev.eventType != null, 'Event must have eventType');
    assert(typeof ev.latitude === 'number', 'Event must have coordinates');
  });

  // --- 7. In-Memory TTL Cache Behavior ---
  console.log('\n--- 7. In-Memory TTL Caching (5-Minute Guarantee) ---');
  await itAsync('Returns cached response on repeated request within 5 minutes', async () => {
    const t1 = await weatherService.fetchCurrentWeather(28.6139, 77.2090);
    const t2 = await weatherService.fetchCurrentWeather(28.6139, 77.2090);
    assert.strictEqual(t2.isCached, true, 'Second request must return from cache');
    assert.strictEqual(t1.temperature, t2.temperature, 'Cached temperature must match original');
  });

  // --- 8. Geocoding & Reverse Geocoding ---
  console.log('\n--- 8. Location Search & Reverse Geocoding ---');
  await itAsync('Searches for city "Mumbai" using Open-Meteo Geocoding', async () => {
    const res = await weatherService.searchGeocoding('Mumbai');
    assert(Array.isArray(res.results), 'Results must be an array');
    assert(res.results.length > 0, 'Must find results for Mumbai');
    const first = res.results[0];
    assert.strictEqual(first.name, 'Mumbai');
    assert(first.country === 'India' || first.countryCode === 'IN');
  });

  await itAsync('Reverse geocodes coordinates to location name', async () => {
    const res = await weatherService.reverseGeocode(28.6139, 77.2090);
    assert(res != null, 'Reverse geocode result must not be null');
    assert(res.city != null || res.displayName != null, 'Must provide city or display name');
  });

  // --- 9. AI Assistant Weather Tools Integration ---
  console.log('\n--- 9. AI Assistant Weather Tools & Truthful Synthesis ---');
  it('Exports safe weather tools in aiAssistantService', () => {
    assert.strictEqual(typeof aiAssistantService.getCurrentWeather, 'function', 'getCurrentWeather tool exported');
    assert.strictEqual(typeof aiAssistantService.getWeatherForecast, 'function', 'getWeatherForecast tool exported');
    assert.strictEqual(typeof aiAssistantService.getAirQuality, 'function', 'getAirQuality tool exported');
    assert.strictEqual(typeof aiAssistantService.getActiveCyclones, 'function', 'getActiveCyclones tool exported');
    assert.strictEqual(typeof aiAssistantService.getWeatherDisasterEvents, 'function', 'getWeatherDisasterEvents tool exported');
  });

  it('Detects weather query intent: "What is the current temperature?"', () => {
    const intent = aiAssistantService.analyzeIntent('What is the current temperature in Delhi?');
    assert.strictEqual(intent.primaryIntent, 'weather_current');
    assert.strictEqual(intent.dataCategory, 'LIVE_DATA');
  });

  it('Detects forecast query intent: "Will it rain tomorrow?"', () => {
    const intent = aiAssistantService.analyzeIntent('Will it rain tomorrow?');
    assert.strictEqual(intent.primaryIntent, 'weather_forecast');
    assert.strictEqual(intent.dataCategory, 'LIVE_DATA');
  });

  it('Detects air quality query intent: "What is the AQI level?"', () => {
    const intent = aiAssistantService.analyzeIntent('What is the AQI level and pollution status?');
    assert.strictEqual(intent.primaryIntent, 'air_quality');
    assert.strictEqual(intent.dataCategory, 'LIVE_DATA');
  });

  it('Detects cyclone query intent: "Are there any cyclones near me?"', () => {
    const intent = aiAssistantService.analyzeIntent('Are there any active cyclones near me?');
    assert.strictEqual(intent.primaryIntent, 'cyclone');
    assert.strictEqual(intent.dataCategory, 'LIVE_DATA');
  });

  await itAsync('Generates truthful AI response for weather query without hallucination', async () => {
    const res = await aiAssistantService.processChat({
      message: 'What is the current weather and temperature?',
      latitude: 28.6139,
      longitude: 77.2090,
    });
    assert(res.reply != null, 'Reply must not be null');
    assert(res.reply.includes('Live Weather') || res.reply.includes("can't access current weather"), 'Must provide live weather or truthful unavailable state');
    assert(res.dataCategory === 'LIVE_DATA', 'Data category marked LIVE_DATA');
  });

  // --- 10. HTTP REST API Endpoints Integration ---
  console.log('\n--- 10. Express REST API Integration Tests (Port 5000) ---');
  await itAsync('GET /api/weather/current returns 200 with live weather', async () => {
    const res = await requestGet('/api/weather/current?lat=28.6139&lon=77.2090');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert(typeof res.data.data.temperature === 'number');
  });

  await itAsync('GET /api/weather/current without coordinates returns 400 Bad Request', async () => {
    const res = await requestGet('/api/weather/current');
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.data.success, false);
  });

  await itAsync('GET /api/weather/current with invalid latitude returns 400 Bad Request', async () => {
    const res = await requestGet('/api/weather/current?lat=95&lon=77.2');
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.data.success, false);
  });

  await itAsync('GET /api/weather/forecast returns 200 with hourly and daily', async () => {
    const res = await requestGet('/api/weather/forecast?lat=28.6139&lon=77.2090');
    assert.strictEqual(res.status, 200);
    assert(Array.isArray(res.data.data.hourly));
    assert(Array.isArray(res.data.data.daily));
  });

  await itAsync('GET /api/weather/air-quality returns 200 with AQI', async () => {
    const res = await requestGet('/api/weather/air-quality?lat=28.6139&lon=77.2090');
    assert.strictEqual(res.status, 200);
    assert(typeof res.data.data.europeanAqi === 'number');
  });

  await itAsync('GET /api/weather/complete returns consolidated telemetry', async () => {
    const res = await requestGet('/api/weather/complete?lat=28.6139&lon=77.2090');
    assert.strictEqual(res.status, 200);
    assert(res.data.data.current != null);
    assert(res.data.data.forecast != null);
    assert(res.data.data.airQuality != null);
  });

  await itAsync('GET /api/weather/cyclones returns 200 with GDACS cyclones', async () => {
    const res = await requestGet('/api/weather/cyclones');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert(Array.isArray(res.data.data.cyclones));
  });

  await itAsync('GET /api/weather/disasters returns 200 with GDACS events', async () => {
    const res = await requestGet('/api/weather/disasters?type=ALL');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert(Array.isArray(res.data.data.events));
  });

  await itAsync('GET /api/weather/location?q=Delhi returns 200 with geocoding matches', async () => {
    const res = await requestGet('/api/weather/location?q=Delhi');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert(Array.isArray(res.data.data.results));
    assert(res.data.data.results.length > 0);
  });

  console.log('\n================================================================');
  console.log(`📊 WEATHER INTELLIGENCE TEST SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED (100%)`);
  console.log('🎉 ALL WEATHER & ATMOSPHERIC DISASTER INTELLIGENCE CHECKS PASSED!');
  console.log('================================================================\n');
}

runWeatherTestSuite().catch((err) => {
  console.error('Weather test suite failed with error:', err);
  process.exit(1);
});
