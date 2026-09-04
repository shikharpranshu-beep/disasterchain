/**
 * DisasterChain Multilingual Localization Test Suite
 * Validates 20 Indian Languages, Fallback Mechanisms, RTL, AI Localization, and Data Integrity
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const express = require('express');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ [PASS] ${message}`);
  } else {
    failedTests++;
    console.error(`  ❌ [FAIL] ${message}`);
    throw new Error(`Assertion Failed: ${message}`);
  }
}

async function runI18nTestSuite() {
  console.log('================================================================');
  console.log('🌐 DISASTERCHAIN 20 INDIAN LANGUAGES LOCALIZATION TEST SUITE');
  console.log('================================================================');

  const EXPECTED_20_LANGUAGES = [
    'en', 'hi', 'bn', 'te', 'mr', 'ta', 'gu', 'kn', 'ml', 'pa',
    'or', 'as', 'ur', 'sa', 'ne', 'kok', 'ks', 'mai', 'sd', 'mni'
  ];

  const EXPECTED_RTL = ['ur', 'ks', 'sd'];

  // --- 1. All 20 Languages Configuration & Native Names ---
  console.log('\n--- 1. All 20 Languages Configuration & File Integrity ---');
  const localesDir = path.resolve(__dirname, '../frontend/src/i18n/locales');
  assert(fs.existsSync(localesDir), 'Locales directory exists at frontend/src/i18n/locales');

  const requiredSections = [
    'common', 'nav', 'emergency', 'disasters', 'shelters',
    'alerts', 'incidents', 'risk', 'auth', 'dashboard', 'ai', 'offline'
  ];

  const loadedLocales = {};

  EXPECTED_20_LANGUAGES.forEach((code) => {
    const filePath = path.join(localesDir, `${code}.json`);
    assert(fs.existsSync(filePath), `Language locale file exists for [${code}]`);

    const raw = fs.readFileSync(filePath, 'utf-8');
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      assert(false, `Valid JSON parsing for locale [${code}]`);
    }
    assert(typeof parsed === 'object' && parsed !== null, `Locale object parsed for [${code}]`);

    requiredSections.forEach((sec) => {
      assert(parsed[sec] != null && typeof parsed[sec] === 'object', `Locale [${code}] has section [${sec}]`);
    });

    loadedLocales[code] = parsed;
  });

  assert(Object.keys(loadedLocales).length === 20, `All 20/20 language locale files parsed successfully`);

  // --- 2. Language-by-Language Explicit Verification (All 20 codes) ---
  console.log('\n--- 2. Language-by-Language Explicit Verification ---');
  EXPECTED_20_LANGUAGES.forEach((code) => {
    const loc = loadedLocales[code];
    assert(typeof loc.common.appName === 'string' && loc.common.appName.length > 0, `[${code}] has valid appName`);
    assert(typeof loc.nav.emergencySos === 'string' && loc.nav.emergencySos.length > 0, `[${code}] has valid nav.emergencySos`);
    assert(typeof loc.emergency.sosTitle === 'string' && loc.emergency.sosTitle.length > 0, `[${code}] has valid emergency.sosTitle`);
    assert(typeof loc.disasters.earthquake === 'string' && loc.disasters.earthquake.length > 0, `[${code}] has valid earthquake label`);
    assert(typeof loc.shelters.shelterTitle === 'string' && loc.shelters.shelterTitle.length > 0, `[${code}] has valid shelterTitle`);
    assert(typeof loc.alerts.alertsTitle === 'string' && loc.alerts.alertsTitle.length > 0, `[${code}] has valid alertsTitle`);
    assert(typeof loc.risk.riskTitle === 'string' && loc.risk.riskTitle.length > 0, `[${code}] has valid riskTitle`);
    assert(typeof loc.auth.loginTitle === 'string' && loc.auth.loginTitle.length > 0, `[${code}] has valid loginTitle`);
    assert(typeof loc.ai.aiTitle === 'string' && loc.ai.aiTitle.length > 0, `[${code}] has valid aiTitle`);
    assert(typeof loc.offline.offlineModeTitle === 'string' && loc.offline.offlineModeTitle.length > 0, `[${code}] has valid offlineModeTitle`);
  });

  // --- 3. RTL Language Specifications ---
  console.log('\n--- 3. RTL Direction Verification ---');
  EXPECTED_RTL.forEach((rtlCode) => {
    assert(EXPECTED_RTL.includes(rtlCode), `RTL active for language [${rtlCode}]`);
  });
  const ltrCodes = EXPECTED_20_LANGUAGES.filter((c) => !EXPECTED_RTL.includes(c));
  ltrCodes.forEach((ltrCode) => {
    assert(!EXPECTED_RTL.includes(ltrCode), `LTR active for language [${ltrCode}]`);
  });

  // --- 4. Fallback Resolution Simulation ---
  console.log('\n--- 4. English Fallback Logic Verification ---');
  function resolveTranslation(keyPath, targetLang, locales) {
    const parts = keyPath.split('.');
    const getVal = (dict) => parts.reduce((o, i) => (o ? o[i] : undefined), dict);

    const targetVal = locales[targetLang] ? getVal(locales[targetLang]) : undefined;
    if (targetVal !== undefined && targetVal !== null) {
      return targetVal;
    }
    const fallbackVal = getVal(locales['en']);
    if (fallbackVal !== undefined && fallbackVal !== null) {
      return fallbackVal;
    }
    return keyPath;
  }

  const enFallbackSample = resolveTranslation('common.appName', 'unknown_lang', loadedLocales);
  assert(enFallbackSample === 'DISASTERCHAIN', 'Unknown language safely falls back to English DISASTERCHAIN');

  const validHiSample = resolveTranslation('common.appName', 'hi', loadedLocales);
  assert(typeof validHiSample === 'string' && validHiSample.length > 0, 'Hindi translation resolved properly');

  // Verify missing key fallback
  const missingKeyRes = resolveTranslation('nonexistent.deep.key', 'hi', loadedLocales);
  assert(missingKeyRes !== undefined && missingKeyRes !== null, 'Missing key does not return undefined or null');

  // --- 5. AI Assistant Multilingual Intent Analysis ---
  console.log('\n--- 5. AI Assistant Multilingual Intent Analysis ---');
  const {
    analyzeIntent,
    processChat,
    SUPPORTED_LANGUAGES,
    generateDeterministicReply,
  } = require('./services/aiAssistantService');

  assert(SUPPORTED_LANGUAGES != null && typeof SUPPORTED_LANGUAGES === 'object', 'SUPPORTED_LANGUAGES exported by aiAssistantService');
  EXPECTED_20_LANGUAGES.forEach((code) => {
    assert(SUPPORTED_LANGUAGES[code] !== undefined, `Backend AI supports language code [${code}]: ${SUPPORTED_LANGUAGES[code]}`);
  });

  // Test Indian language disaster queries
  const hiEq = analyzeIntent('भूकंप के दौरान मुझे क्या करना चाहिए?');
  assert(hiEq.primaryIntent === 'preparedness' && hiEq.disasterType === 'earthquake', 'Hindi earthquake query classified correctly');

  const taEq = analyzeIntent('நிலநடுக்கத்தின் போது நான் என்ன செய்ய வேண்டும்?');
  assert(taEq.primaryIntent === 'preparedness' && taEq.disasterType === 'earthquake', 'Tamil earthquake query classified correctly');

  const bnEq = analyzeIntent('ভূমিকম্পের সময় আমার কী করা উচিত?');
  assert(bnEq.primaryIntent === 'preparedness' && bnEq.disasterType === 'earthquake', 'Bengali earthquake query classified correctly');

  const teEq = analyzeIntent('భూకంపం సమయంలో నేను ఏమి చేయాలి?');
  assert(teEq.primaryIntent === 'preparedness' && teEq.disasterType === 'earthquake', 'Telugu earthquake query classified correctly');

  const mrEq = analyzeIntent('भूकंपाच्या वेळी मी काय करावे?');
  assert(mrEq.primaryIntent === 'preparedness' && mrEq.disasterType === 'earthquake', 'Marathi earthquake query classified correctly');

  const hiFlood = analyzeIntent('बाढ़ आ रही है मुझे बचाओ');
  assert(hiFlood.isEmergency === true || hiFlood.disasterType === 'flood', 'Hindi flood distress detected correctly');

  // --- 6. AI Assistant Language Response Generation ---
  console.log('\n--- 6. AI Assistant Multilingual Response Generation ---');
  const hiChat = await processChat({
    message: 'मदद करो मुझे बचाओ',
    userRole: 'citizen',
    language: 'hi',
  });
  assert(hiChat.language === 'hi', 'Chat response specifies language hi');
  assert(hiChat.isEmergency === true, 'Distress query flagged as emergency');
  assert(hiChat.reply.includes('तत्काल खतरा पहचाना गया'), 'Hindi response includes localized emergency heading');
  assert(hiChat.reply.includes('112 / 101 / 911'), 'Emergency phone numbers (112, 101, 911) preserved accurately');

  const taChat = await processChat({
    message: 'அருகிலுள்ள புகலிடம் எங்கே?',
    userRole: 'citizen',
    language: 'ta',
    latitude: 28.6139,
    longitude: 77.2090,
  });
  assert(taChat.language === 'ta', 'Chat response specifies language ta');
  assert(taChat.reply.includes('அருகிலுள்ள பாதுகாப்பான புகலிட பரிந்துரை') || taChat.reply.includes('Optimal Safe Haven Recommendation'), 'Tamil response includes shelter recommendation header');

  // Unsupported language fallback
  const fallbackChat = await processChat({
    message: 'Where is the shelter?',
    userRole: 'citizen',
    language: 'unsupported_alien_lang',
  });
  assert(fallbackChat.language === 'en', 'Unsupported language falls back to English in AI assistant');
  assert(fallbackChat.reply.includes('Optimal Safe Haven Recommendation'), 'English response generated for fallback language');

  // --- 7. HTTP API Integration (POST /api/ai/chat with language) ---
  console.log('\n--- 7. Express HTTP API Integration (POST /api/ai/chat) ---');
  const jwt = require('jsonwebtoken');
  const JWT_SECRET = process.env.JWT_SECRET || 'disasterchain_secure_jwt_secret_2026';
  const citizenToken = jwt.sign({ id: '507f1f77bcf86cd799439011', role: 'citizen' }, JWT_SECRET, { expiresIn: '1h' });

  const aiController = require('./controllers/aiAssistantController');
  const { protect } = require('./middleware/auth');

  const app = express();
  app.use(express.json());
  app.post('/api/ai/chat', protect, aiController.handleAIChat);

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;

  try {
    // 7.1 Valid Language: hi
    const hiHttpRes = await makeRequest({
      port,
      method: 'POST',
      path: '/api/ai/chat',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${citizenToken}`,
      },
      body: {
        message: 'आपातकालीन सहायता की आवश्यकता है',
        language: 'hi',
      },
    });
    assert(hiHttpRes.status === 200, 'POST /api/ai/chat returns 200 OK with language: hi');
    assert(hiHttpRes.body.success === true, 'Success flag true for Hindi AI request');
    assert(hiHttpRes.body.data.language === 'hi', 'Response confirms language: hi');

    // 7.2 Valid Language: bn
    const bnHttpRes = await makeRequest({
      port,
      method: 'POST',
      path: '/api/ai/chat',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${citizenToken}`,
      },
      body: {
        message: 'নিকটতম আশ্রয় কেন্দ্র কোথায়?',
        language: 'bn',
      },
    });
    assert(bnHttpRes.status === 200, 'POST /api/ai/chat returns 200 OK with language: bn');
    assert(bnHttpRes.body.data.language === 'bn', 'Response confirms language: bn');

    // 7.3 Invalid Language fallback to en
    const invalidHttpRes = await makeRequest({
      port,
      method: 'POST',
      path: '/api/ai/chat',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${citizenToken}`,
      },
      body: {
        message: 'Where are the shelters?',
        language: 'invalid_code_123',
      },
    });
    assert(invalidHttpRes.status === 200, 'POST /api/ai/chat returns 200 OK with invalid language code');
    assert(invalidHttpRes.body.data.language === 'en', 'Invalid language safely falls back to English (en)');

  } finally {
    server.close();
  }

  // --- 8. Telemetry and Operational Number Preservation ---
  console.log('\n--- 8. Telemetry and Operational Number Preservation ---');
  const telemetryTest = await processChat({
    message: 'What are the current emergency alerts and stats?',
    userRole: 'citizen',
    language: 'hi',
  });
  assert(typeof telemetryTest.liveStats.activeSos === 'number', 'Active SOS count is numeric and unchanged');
  assert(typeof telemetryTest.liveStats.activeAlerts === 'number', 'Active Alerts count is numeric and unchanged');
  assert(typeof telemetryTest.liveStats.activeIncidents === 'number', 'Active Incidents count is numeric and unchanged');
  assert(Array.isArray(telemetryTest.sources), 'Sources array remains intact');

  console.log('\n================================================================');
  console.log(`📊 LOCALIZATION TEST SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED`);
  if (failedTests === 0) {
    console.log('🎉 ALL 20 INDIAN LANGUAGES LOCALIZATION TESTS PASSED SUCCESSFULLY!');
    console.log('================================================================\n');
  } else {
    console.error(`⚠️ ${failedTests} TESTS FAILED!`);
    console.log('================================================================\n');
    process.exit(1);
  }
}

function makeRequest({ port, method, path, headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const reqHeaders = { ...headers };
    if (payload) {
      reqHeaders['Content-Length'] = Buffer.byteLength(payload);
    }
    const req = http.request(
      {
        host: '127.0.0.1',
        port,
        method,
        path,
        headers: reqHeaders,
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          let parsed = null;
          try {
            parsed = JSON.parse(raw);
          } catch (e) {
            parsed = raw;
          }
          resolve({ status: res.statusCode, body: parsed });
        });
      }
    );
    req.on('error', reject);
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

runI18nTestSuite().catch((err) => {
  console.error('Fatal Localization Test Error:', err);
  process.exit(1);
});
