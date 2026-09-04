const https = require('https');
const http = require('http');

async function testEndpoint(name, url, opts = {}) {
  const start = Date.now();
  return new Promise((resolve) => {
    const isHttps = url.startsWith('https:');
    const client = isHttps ? https : http;
    const reqOptions = {
      family: 4,
      timeout: opts.timeout || 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        'Accept': '*/*',
        ...(opts.headers || {}),
      },
    };

    const parsedUrl = new URL(url);
    const req = client.get(url, reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const duration = Date.now() - start;
        let jsonSummary = 'non-json';
        let parsedSuccess = res.statusCode >= 200 && res.statusCode < 300;
        try {
          const parsed = JSON.parse(data);
          if (parsed.current || parsed.results || parsed.hourly || parsed.version) {
            jsonSummary = 'valid-json-payload';
          }
        } catch (e) {
          if (data.includes('<rss') || data.includes('<xml')) {
            jsonSummary = 'valid-xml-rss';
          }
        }
        console.log(`[SAFE DIAGNOSTIC] Host: ${parsedUrl.hostname} | Path: ${parsedUrl.pathname} | Status: ${res.statusCode} | Time: ${duration}ms | Payload: ${data.length} bytes | Format: ${jsonSummary} | Parsed: ${parsedSuccess}`);
        resolve({
          name,
          host: parsedUrl.hostname,
          path: parsedUrl.pathname,
          statusCode: res.statusCode,
          duration,
          bytes: data.length,
          success: parsedSuccess,
        });
      });
    });

    req.on('error', (err) => {
      const duration = Date.now() - start;
      console.log(`[SAFE DIAGNOSTIC] Host: ${parsedUrl.hostname} | Path: ${parsedUrl.pathname} | FAILED: ${err.message} | Time: ${duration}ms`);
      resolve({ name, host: parsedUrl.hostname, path: parsedUrl.pathname, error: err.message, success: false });
    });

    req.on('timeout', () => {
      req.destroy();
      const duration = Date.now() - start;
      console.log(`[SAFE DIAGNOSTIC] Host: ${parsedUrl.hostname} | Path: ${parsedUrl.pathname} | TIMEOUT (${reqOptions.timeout}ms) | Time: ${duration}ms`);
      resolve({ name, host: parsedUrl.hostname, path: parsedUrl.pathname, error: 'TIMEOUT', success: false });
    });
  });
}

async function runLiveDiagnostics() {
  console.log('=== REAL LIVE EXTERNAL ATMOSPHERIC FEED DIAGNOSTICS ===');
  console.log('Target Coordinates: Chandigarh, India (Lat: 30.7333, Lon: 76.7794)');

  const results = [];
  results.push(await testEndpoint('Open-Meteo Current Weather', 'https://api.open-meteo.com/v1/forecast?latitude=30.7333&longitude=76.7794&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&timezone=auto'));
  results.push(await testEndpoint('Open-Meteo 7-Day Forecast', 'https://api.open-meteo.com/v1/forecast?latitude=30.7333&longitude=76.7794&hourly=temperature_2m,precipitation_probability,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto'));
  results.push(await testEndpoint('Open-Meteo Air Quality', 'https://air-quality-api.open-meteo.com/v1/air-quality?latitude=30.7333&longitude=76.7794&current=european_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone&timezone=auto'));
  results.push(await testEndpoint('Open-Meteo Geocoding (Chandigarh)', 'https://geocoding-api.open-meteo.com/v1/search?name=Chandigarh&count=5&language=en&format=json'));
  results.push(await testEndpoint('GDACS RSS Feed', 'https://www.gdacs.org/xml/rss.xml'));
  results.push(await testEndpoint('RainViewer Maps API', 'https://api.rainviewer.com/public/weather-maps.json'));

  console.log('\n=== SUMMARY ===');
  const allSucceeded = results.every(r => r.success);
  console.log(`Total Tested: ${results.length} | Succeeded: ${results.filter(r => r.success).length} | Failed: ${results.filter(r => !r.success).length}`);
  return results;
}

if (require.main === module) {
  runLiveDiagnostics();
}

module.exports = { runLiveDiagnostics, testEndpoint };
