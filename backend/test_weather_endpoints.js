const http = require('http');

function request(path) {
  return new Promise((resolve) => {
    const start = Date.now();
    http.get('http://localhost:5000' + path, (res) => {
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(d);
        } catch (e) {}
        const duration = Date.now() - start;
        resolve({
          path,
          status: res.statusCode,
          duration,
          success: Boolean(parsed && parsed.success),
          dataPreview: parsed?.data ? Object.keys(parsed.data) : null,
          error: parsed?.message || null,
        });
      });
    }).on('error', (err) => {
      resolve({ path, error: err.message, status: 0, duration: 0 });
    });
  });
}

async function runTests() {
  console.log('=== TESTING DISASTERCHAIN WEATHER REST API (LIVE RUNTIME) ===\n');

  const tests = [
    { name: '1. Current Weather (lat/lon)', path: '/api/weather/current?lat=30.7333&lon=76.7794' },
    { name: '2. Current Weather (latitude/longitude)', path: '/api/weather/current?latitude=30.7333&longitude=76.7794' },
    { name: '3. Forecast (lat/lon)', path: '/api/weather/forecast?lat=30.7333&lon=76.7794' },
    { name: '4. Forecast (latitude/longitude)', path: '/api/weather/forecast?latitude=30.7333&longitude=76.7794' },
    { name: '5. Air Quality (lat/lon)', path: '/api/weather/air-quality?lat=30.7333&lon=76.7794' },
    { name: '6. Air Quality (latitude/longitude)', path: '/api/weather/air-quality?latitude=30.7333&longitude=76.7794' },
    { name: '7. Complete Weather Overview', path: '/api/weather/complete?latitude=30.7333&longitude=76.7794' },
    { name: '8. Search Location (Chandigarh)', path: '/api/weather/location?q=Chandigarh' },
    { name: '9. Search Location (query=Chandigarh)', path: '/api/weather/location?query=Chandigarh' },
    { name: '10. Reverse Geocode (lat/lon)', path: '/api/weather/reverse-geocode?lat=30.7333&lon=76.7794' },
    { name: '11. Active Cyclones', path: '/api/weather/cyclones' },
    { name: '12. Disaster Events Feed', path: '/api/weather/disasters?type=ALL' },
  ];

  let passed = 0;
  for (const t of tests) {
    const res = await request(t.path);
    const ok = res.status === 200 && res.success;
    if (ok) passed++;
    console.log(`[${ok ? 'PASS' : 'FAIL'}] ${t.name}`);
    console.log(`       Path: ${t.path}`);
    console.log(`       Status: ${res.status} | Duration: ${res.duration}ms | Success: ${res.success}`);
    if (res.dataPreview) {
      console.log(`       Data Keys: ${JSON.stringify(res.dataPreview)}`);
    }
    if (res.error && !ok) {
      console.log(`       Error Message: ${res.error}`);
    }
    console.log('');
  }

  console.log(`====================================================`);
  console.log(`SUMMARY: ${passed} / ${tests.length} tests passed (${Math.round((passed / tests.length) * 100)}%)`);
  console.log(`====================================================`);

  if (passed === tests.length) {
    console.log('✅ ALL BACKEND WEATHER ROUTES OPERATING WITH 100% SUCCESS');
  } else {
    console.log('❌ SOME TESTS FAILED');
    process.exit(1);
  }
}

runTests();
