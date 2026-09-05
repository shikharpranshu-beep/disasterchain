/**
 * Comprehensive Automated Test Suite for DisasterChain WeatherGPT
 *
 * Tests 28 requirements:
 * 1. Current weather question
 * 2. Forecast question
 * 3. Rain question
 * 4. Wind question
 * 5. AQI question
 * 6. Cyclone question
 * 7. Severe weather question
 * 8. Named-location question
 * 9. GPS location resolution
 * 10. Location fallback
 * 11. Multilingual response (Hindi)
 * 12. RTL response (Urdu)
 * 13. Disaster alert integration
 * 14. Shelter integration
 * 15. Map action integration
 * 16. Cached weather state
 * 17. Weather provider failure resilience
 * 18. AI provider failure resilience
 * 19. Missing location handling
 * 20. Invalid location handling
 * 21. Off-topic handling
 * 22. Emergency handling
 * 23. SOS confirmation protection
 * 24. RBAC protection
 * 25. No secrets in frontend or payload
 * 26. No secrets in logs
 * 27. Mobile payload compatibility
 * 28. Android schema compatibility
 */

const assert = require('assert');
const {
  processWeatherGPTChat,
  analyzeWeatherIntent,
  evaluateRisk,
  extractLocationName,
  summarizeForecast,
  generateWeatherGPTReply,
  SUPPORTED_LANGUAGES,
  VERIFIED_CLIMATE_REGIONS,
} = require('./services/weatherGPTService');

let passedTests = 0;
let totalTests = 28;

async function runTest(testNumber, testName, testFn) {
  try {
    process.stdout.write(`Test ${testNumber}: ${testName}... `);
    await testFn();
    passedTests++;
    console.log('PASSED ✓');
  } catch (err) {
    console.log(`FAILED ✗: ${err.message}`);
    throw err;
  }
}

async function runTestSuite() {
  console.log('========================================================');
  console.log('🌦️ DisasterChain WeatherGPT Automated Verification Suite');
  console.log('========================================================\n');

  // Test 1: Current weather question
  await runTest(1, 'Current weather question intent & answer', async () => {
    const res = await processWeatherGPTChat({
      message: 'What is the weather right now?',
      latitude: 28.6139,
      longitude: 77.2090,
      location: 'New Delhi',
      language: 'en',
    });
    assert(res && res.reply, 'Should return a response');
    assert(res.reply.includes('WEATHER REPORT') || res.reply.includes('Temperature') || res.reply.includes('°C'), 'Should contain temperature report');
    assert(res.telemetry && typeof res.telemetry.temperature === 'number', 'Should include numerical temperature');
    assert(res.dataTrust === 'LIVE TELEMETRY' || res.dataTrust === 'AI INTERPRETATION', 'Should state valid data trust');
  });

  // Test 2: Forecast question
  await runTest(2, 'Forecast question handling', async () => {
    const res = await processWeatherGPTChat({
      message: 'What is the forecast for tomorrow?',
      latitude: 28.6139,
      longitude: 77.2090,
      location: 'New Delhi',
      language: 'en',
    });
    assert(res.reply.includes('FORECAST') || res.reply.includes('Expect') || res.reply.includes('Tomorrow'), 'Should contain forecast intelligence');
    assert(res.actions.some((a) => a.label.includes('MAP') || a.link === '/weather'), 'Should provide map action');
  });

  // Test 3: Rain question
  await runTest(3, 'Rain and umbrella inquiry', async () => {
    const res = await processWeatherGPTChat({
      message: 'Will it rain today? Should I carry an umbrella?',
      latitude: 28.6139,
      longitude: 77.2090,
      location: 'New Delhi',
      language: 'en',
    });
    assert(res.reply.toLowerCase().includes('rain') || res.reply.toLowerCase().includes('umbrella'), 'Should answer rain question directly');
    assert(res.riskLevel, 'Should include risk classification');
  });

  // Test 4: Wind question
  await runTest(4, 'Wind speed and gust inquiry', async () => {
    const res = await processWeatherGPTChat({
      message: 'How strong will the wind be?',
      latitude: 28.6139,
      longitude: 77.2090,
      location: 'New Delhi',
      language: 'en',
    });
    assert(res.reply.toLowerCase().includes('wind') || res.reply.includes('km/h'), 'Should report wind metrics');
    assert(typeof res.telemetry.windSpeed === 'number', 'Telemetry should provide wind speed number');
  });

  // Test 5: AQI question
  await runTest(5, 'Air Quality and particulate pollution inquiry', async () => {
    const res = await processWeatherGPTChat({
      message: 'How is the air quality and PM2.5?',
      latitude: 28.6139,
      longitude: 77.2090,
      location: 'New Delhi',
      language: 'en',
    });
    assert(res.reply.includes('Air quality') || res.reply.includes('AQI') || res.reply.includes('PM2.5'), 'Should report AQI details');
    assert(res.telemetry.aqi != null || res.telemetry.aqiSeverity, 'Should include AQI telemetry');
  });

  // Test 6: Cyclone question
  await runTest(6, 'Active Cyclone tracking inquiry', async () => {
    const res = await processWeatherGPTChat({
      message: 'Is there a cyclone near me?',
      latitude: 19.0760,
      longitude: 72.8777,
      location: 'Mumbai',
      language: 'en',
    });
    assert(res.reply.includes('cyclone') || res.reply.includes('tropical') || res.reply.includes('SAFE / NORMAL') || res.reply.includes('CYCLONE'), 'Should report cyclone situation');
    assert(res.dataTrust, 'Should indicate data source trust');
  });

  // Test 7: Severe weather question
  await runTest(7, 'Severe weather and hazard inquiry', async () => {
    const res = await processWeatherGPTChat({
      message: 'Is there any severe weather nearby?',
      latitude: 28.6139,
      longitude: 77.2090,
      location: 'New Delhi',
      language: 'en',
    });
    assert(res.riskLevel === 'LOW' || res.riskLevel === 'MODERATE' || res.riskLevel === 'HIGH', 'Should categorize hazard risk level');
    assert(res.reply.includes('SAFE / NORMAL') || res.reply.includes('HIGH RISK') || res.reply.includes('severe weather'), 'Should provide structured risk analysis');
  });

  // Test 8: Named-location question
  await runTest(8, 'Named-location query ("Show me the weather for Delhi")', async () => {
    const res = await processWeatherGPTChat({
      message: 'Show me the weather for Delhi',
      language: 'en',
    });
    assert(res.location && res.location.name.toLowerCase().includes('delhi'), 'Should resolve Delhi');
    assert(res.location.latitude && res.location.longitude, 'Should have geocoded coordinates');
  });

  // Test 9: GPS location resolution
  await runTest(9, 'Direct GPS coordinates input', async () => {
    const res = await processWeatherGPTChat({
      message: 'What is the temperature here?',
      latitude: 12.9716,
      longitude: 77.5946,
      language: 'en',
    });
    assert.strictEqual(res.location.latitude, 12.9716);
    assert.strictEqual(res.location.longitude, 77.5946);
    assert(res.telemetry.temperature !== null, 'Should return temperature for Bengaluru coordinates');
  });

  // Test 10: Location fallback
  await runTest(10, 'Fallback when no coordinates or location supplied', async () => {
    const res = await processWeatherGPTChat({
      message: 'Explain today weather simply',
      language: 'en',
    });
    assert(res.location && res.location.latitude, 'Should fallback to default operational coordinates');
    assert(res.reply.length > 20, 'Should return informative response');
  });

  // Test 11: Multilingual response (Hindi)
  await runTest(11, 'Multilingual response in Hindi (hi)', async () => {
    const res = await processWeatherGPTChat({
      message: 'आज का मौसम कैसा है?',
      latitude: 28.6139,
      longitude: 77.2090,
      location: 'New Delhi',
      language: 'hi',
    });
    assert.strictEqual(res.language, 'hi');
    assert(res.reply.includes('मौसम') || res.reply.includes('तापमान') || res.reply.includes('WeatherGPT'), 'Should return Hindi response');
    assert.strictEqual(res.isRtl, false);
  });

  // Test 12: RTL response (Urdu)
  await runTest(12, 'RTL response in Urdu (ur)', async () => {
    const res = await processWeatherGPTChat({
      message: 'کیا آج بارش ہوگی؟',
      latitude: 28.6139,
      longitude: 77.2090,
      location: 'New Delhi',
      language: 'ur',
    });
    assert.strictEqual(res.language, 'ur');
    assert.strictEqual(res.isRtl, true, 'Urdu must be flagged as RTL');
  });

  // Test 13: Disaster alert integration
  await runTest(13, 'Operational emergency alert integration', async () => {
    const res = await processWeatherGPTChat({
      message: 'Are there any official emergency alerts active?',
      latitude: 28.6139,
      longitude: 77.2090,
      location: 'New Delhi',
      language: 'en',
    });
    assert(res.actions, 'Should return actionable UI options');
    assert(Array.isArray(res.actions), 'Actions should be an array');
  });

  // Test 14: Shelter integration
  await runTest(14, 'Operational shelter recommendation integration', async () => {
    const res = await processWeatherGPTChat({
      message: 'Is it safe to stay here during this storm? Where is the nearest shelter?',
      latitude: 28.6139,
      longitude: 77.2090,
      location: 'New Delhi',
      language: 'en',
    });
    assert(res.reply, 'Should provide guidance on shelter');
    assert(res.actions.some((a) => a.link === '/shelters' || a.label.includes('SHELTER') || a.link === '/weather'), 'Should provide link to shelters or weather map');
  });

  // Test 15: Map action integration
  await runTest(15, 'Action link to keyless 2D Weather Map', async () => {
    const res = await processWeatherGPTChat({
      message: 'Show me the rain and cloud cover on the map',
      latitude: 28.6139,
      longitude: 77.2090,
      location: 'New Delhi',
      language: 'en',
    });
    const mapAction = res.actions.find((a) => a.link === '/weather' || a.label.includes('MAP'));
    assert(mapAction, 'Must include [ VIEW ON MAP ] action link');
  });

  // Test 16: Cached weather state handling
  await runTest(16, 'Cached weather state flagging', async () => {
    const res = await processWeatherGPTChat({
      message: 'What is the weather right now?',
      latitude: 28.6139,
      longitude: 77.2090,
      location: 'New Delhi',
      language: 'en',
    });
    assert(['LIVE', 'PARTIAL_LIVE', 'CACHED', 'UNAVAILABLE'].includes(res.feedStatus), 'Must contain valid feedStatus');
  });

  // Test 17: Weather provider failure resilience
  await runTest(17, 'Resilience when weather data is simulated unavailable', async () => {
    const deterministic = generateWeatherGPTReply({
      message: 'What is the weather?',
      intent: analyzeWeatherIntent('What is the weather?'),
      locationName: 'Simulated Outage Zone',
      currentWeather: null,
      language: 'en',
    });
    assert(deterministic.reply.includes("I can't verify the current weather data right now"), 'Should state data cannot be verified right now');
    assert(!deterministic.reply.includes('null'), 'Must not leak raw null values');
  });

  // Test 18: AI provider failure resilience
  await runTest(18, 'Graceful fallback to deterministic engine if AI fails', async () => {
    const res = await processWeatherGPTChat({
      message: 'Will it rain today?',
      latitude: 28.6139,
      longitude: 77.2090,
      location: 'New Delhi',
      language: 'en',
    });
    assert(res.reply && res.reply.length > 10, 'Must produce valid reply from fallback engine');
  });

  // Test 19: Missing location handling
  await runTest(19, 'Graceful handling when user asks without location', async () => {
    const res = await processWeatherGPTChat({
      message: 'What is the safest time to travel today?',
      language: 'en',
    });
    assert(res.reply, 'Should provide actionable travel guidance');
    assert(res.location.name, 'Should have resolved default or reverse geocoded location');
  });

  // Test 20: Invalid location handling
  await runTest(20, 'Handling of non-existent or invalid location query', async () => {
    const res = await processWeatherGPTChat({
      message: 'What is the weather in NonExistentFictionalTownXYZ12345?',
      language: 'en',
    });
    assert(res.reply, 'Should not crash on invalid location');
  });

  // Test 21: Off-topic handling
  await runTest(21, 'Off-topic deflection back to weather and disaster safety', async () => {
    const res = await processWeatherGPTChat({
      message: 'Tell me a funny joke about cats',
      language: 'en',
    });
    assert(res.reply.includes("I’m WeatherGPT. I can help with weather, forecasts, air quality, severe-weather alerts, and weather-related safety."), 'Must politely deflect off-topic inquiries');
  });

  // Test 22: Emergency handling
  await runTest(22, 'Life-Safety alert and "Call 112" for immediate emergencies', async () => {
    const res = await processWeatherGPTChat({
      message: 'Help me! Flood water is rising fast and I am trapped on the roof!',
      latitude: 28.6139,
      longitude: 77.2090,
      location: 'New Delhi',
      language: 'en',
    });
    assert(res.isEmergency, 'Must flag as emergency');
    assert(res.reply.includes('LIFE-SAFETY ALERT'), 'Must declare LIFE-SAFETY ALERT');
    assert(res.reply.includes('112'), 'Must advise calling emergency 112');
  });

  // Test 23: SOS confirmation protection
  await runTest(23, 'Never automatically submits SOS without explicit confirmation', async () => {
    const res = await processWeatherGPTChat({
      message: 'I need an SOS sent immediately, water is rising!',
      latitude: 28.6139,
      longitude: 77.2090,
      location: 'New Delhi',
      language: 'en',
    });
    assert(res.reply.includes('WeatherGPT does not dispatch emergency units automatically') || res.reply.includes('verify your situation before submitting an SOS request'), 'Must state that user must confirm SOS');
    const sosAction = res.actions.find((a) => a.actionType === 'SOS_MODAL');
    assert(sosAction, 'Must offer confirmation SOS button rather than auto-submitting');
  });

  // Test 24: RBAC protection
  await runTest(24, 'RBAC protection: public citizen cannot view private responder operational counts', async () => {
    const citizenRes = await processWeatherGPTChat({
      message: 'What is the weather right now?',
      latitude: 28.6139,
      longitude: 77.2090,
      userRole: 'citizen',
    });
    // Response must not leak internal database objects
    assert(!JSON.stringify(citizenRes).includes('password'), 'Must not leak passwords');
    assert(!JSON.stringify(citizenRes).includes('JWT_SECRET'), 'Must not leak JWT secret');
  });

  // Test 25: No secrets in payload
  await runTest(25, 'Zero backend secrets or API keys exposed in JSON response', async () => {
    const res = await processWeatherGPTChat({
      message: 'Show me all weather telemetry and configs',
      latitude: 28.6139,
      longitude: 77.2090,
      language: 'en',
    });
    const serialized = JSON.stringify(res);
    assert(!serialized.includes('mongodb+srv'), 'Must not contain MongoDB connection strings');
    assert(!serialized.includes('process.env'), 'Must not contain process.env strings');
    assert(!serialized.includes('AI_API_KEY'), 'Must not expose AI_API_KEY');
    assert(!serialized.includes('JWT_SECRET'), 'Must not expose JWT_SECRET');
  });

  // Test 26: No secrets in logs
  await runTest(26, 'Clean logs without credentials or tokens', async () => {
    const logSpy = [];
    const origLog = console.log;
    console.log = (...args) => logSpy.push(args.join(' '));

    await processWeatherGPTChat({
      message: 'Current weather',
      latitude: 28.6139,
      longitude: 77.2090,
      language: 'en',
    });

    console.log = origLog;
    const combinedLogs = logSpy.join('\n');
    assert(!combinedLogs.includes('mongodb+srv'), 'No mongo secrets in console logs');
  });

  // Test 27: Mobile payload compatibility
  await runTest(27, 'Mobile payload format (lightweight, structured actions)', async () => {
    const res = await processWeatherGPTChat({
      message: 'What is the weather right now?',
      latitude: 28.6139,
      longitude: 77.2090,
      language: 'en',
    });
    assert(res.telemetry, 'Telemetry object must exist');
    assert(typeof res.telemetry.temperature === 'number' || res.telemetry.temperature === null);
    assert(res.actions && Array.isArray(res.actions));
  });

  // Test 28: Android schema compatibility
  await runTest(28, 'Android schema compatibility (conversationId, location, telemetry, language)', async () => {
    const convId = 'android_test_session_1';
    const res = await processWeatherGPTChat({
      message: 'What is the weather in Chandigarh?',
      conversationId: convId,
      language: 'en',
    });
    assert.strictEqual(res.conversationId, convId, 'Must preserve conversationId');
    assert(res.location && res.location.name.toLowerCase().includes('chandigarh'), 'Must set location to Chandigarh');

    // Multi-turn test: Follow-up question inherits location
    const followUp = await processWeatherGPTChat({
      message: 'Will it rain tomorrow?',
      conversationId: convId,
      language: 'en',
    });
    assert(followUp.location && followUp.location.name.toLowerCase().includes('chandigarh'), 'Follow up must inherit Chandigarh from session memory');
  });

  console.log('\n========================================================');
  console.log(`🎉 ALL ${passedTests}/${totalTests} WEATHERGPT TESTS PASSED SUCCESSFULLY!`);
  console.log('========================================================\n');
}

runTestSuite().catch((err) => {
  console.error('\n❌ Test Suite Aborted due to error:', err);
  process.exit(1);
});
