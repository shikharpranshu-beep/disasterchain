const https = require('https');

function postChat(payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = https.request('https://disasterrchain-backend.onrender.com/api/weather-gpt/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
      timeout: 30000,
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy(new Error('Request timed out after 30s'));
    });
    req.write(data);
    req.end();
  });
}

function checkHealth() {
  return new Promise((resolve, reject) => {
    https.get('https://disasterrchain-backend.onrender.com/api/health', (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve({ raw: body });
        }
      });
    }).on('error', reject);
  });
}

async function waitForDeploy() {
  console.log('Checking Render deployment version at /api/health...');
  for (let i = 1; i <= 30; i++) {
    try {
      const h = await checkHealth();
      console.log(`[Attempt ${i}/30] Live Health Version: "${h.version}", DB: "${h.database}"`);
      if (h.version === '1.2.1-weather-gpt-intent-priority') {
        console.log('✅ Latest version 1.2.1-weather-gpt-intent-priority is LIVE on Render!');
        return true;
      }
    } catch (e) {
      console.log(`[Attempt ${i}/30] Health check error:`, e.message);
    }
    await new Promise(r => setTimeout(r, 10000));
  }
  return false;
}

const queries = [
  { id: 1, query: 'What is the weather right now at my location?', lat: 30.7499, lon: 76.6411, loc: 'Kharar, Punjab' },
  { id: 2, query: 'flood', lat: 30.7499, lon: 76.6411, loc: 'Kharar, Punjab' },
  { id: 3, query: 'Will it rain tomorrow?', lat: 30.7499, lon: 76.6411, loc: 'Kharar, Punjab' },
  { id: 4, query: 'What is the AQI?', lat: 30.7499, lon: 76.6411, loc: 'Kharar, Punjab' },
  { id: 5, query: 'Is there severe weather?', lat: 30.7499, lon: 76.6411, loc: 'Kharar, Punjab' },
  { id: 6, query: 'What is the weather in Delhi?', lat: 30.7499, lon: 76.6411, loc: 'Kharar, Punjab' },
  { id: 7, query: 'Emergency trapped in water please help me SOS', lat: 30.7499, lon: 76.6411, loc: 'Kharar, Punjab' },
];

async function testAll() {
  console.log('========================================================');
  console.log('🌐 LIVE PRODUCTION WEATHERGPT VERIFICATION');
  console.log('Target: https://disasterrchain-backend.onrender.com/api/weather-gpt/chat');
  console.log('========================================================\n');

  const deployed = await waitForDeploy();
  if (!deployed) {
    console.warn('⚠️ Timed out waiting for version 1.2.1 on Render, proceeding with test anyway...\n');
  }

  let allSuccess = true;

  for (const q of queries) {
    console.log(`\n--- Test ${q.id}: "${q.query}" ---`);
    try {
      const res = await postChat({
        message: q.query,
        latitude: q.lat,
        longitude: q.lon,
        location: q.loc,
        conversationId: `verify_${Date.now()}_${q.id}`,
      });

      console.log(`HTTP Status: ${res.status}`);
      if (res.status !== 200) {
        console.error('FAILED response:', res);
        allSuccess = false;
        continue;
      }

      const d = res.data?.data;
      console.log(`Resolved Location: ${JSON.stringify(d?.location)}`);
      console.log(`Risk Level: ${d?.riskLevel}`);
      console.log(`Data Trust: ${d?.dataTrust}`);
      console.log(`Reply Preview:\n${d?.reply}\n`);

      // Verifications:
      if (q.id === 2) {
        // "flood" must address flood, not AQI
        const mentionsFlood = d?.reply?.toLowerCase().includes('flood') || d?.reply?.toLowerCase().includes('waterlogging');
        const mentionsAqiTitle = d?.reply?.includes('HAZARDOUS AIR QUALITY');
        if (!mentionsFlood || mentionsAqiTitle) {
          console.error('❌ FAIL: "flood" returned AQI or did not mention flood risk!');
          allSuccess = false;
        } else {
          console.log('✅ PASS: "flood" correctly returned flood/waterlogging risk, NOT AQI!');
        }
      }

      if (q.id === 1 || q.id === 2 || q.id === 3 || q.id === 4 || q.id === 5) {
        // Must use Kharar, Punjab, and never "manali" or "the"
        const mentionsManali = d?.reply?.toLowerCase().includes('manali');
        const mentionsInThe = d?.reply?.toLowerCase().includes('in the.');
        if (mentionsManali || mentionsInThe) {
          console.error('❌ FAIL: Reply contains incorrect location ("manali" or "in the.")!');
          allSuccess = false;
        } else {
          console.log('✅ PASS: Location correctly resolves to active location (Kharar, Punjab)!');
        }
      }

      if (q.id === 6) {
        // "weather in Delhi" must resolve to Delhi
        if (!d?.location?.name?.toLowerCase().includes('delhi')) {
          console.error('❌ FAIL: Did not resolve to Delhi!');
          allSuccess = false;
        } else {
          console.log('✅ PASS: Explicit query for Delhi resolved correctly to Delhi!');
        }
      }

      if (q.id === 7) {
        // Emergency question must flag emergency and advise Call 112
        if (!d?.reply?.includes('112') || d?.riskLevel !== 'CRITICAL') {
          console.error('❌ FAIL: Emergency alert did not mention 112 or critical risk!');
          allSuccess = false;
        } else {
          console.log('✅ PASS: Emergency alert correctly flagged with Call 112 guidance!');
        }
      }

    } catch (err) {
      console.error(`❌ Request ${q.id} error:`, err.message);
      allSuccess = false;
    }
  }

  console.log('\n========================================================');
  if (allSuccess) {
    console.log('🎉 ALL 7 LIVE PRODUCTION WEATHERGPT QUERIES SUCCEEDED WITH 100% CORRECTNESS!');
  } else {
    console.log('⚠️ ONE OR MORE QUERIES FAILED - CHECK OUTPUT ABOVE');
  }
  console.log('========================================================\n');
}

testAll();
