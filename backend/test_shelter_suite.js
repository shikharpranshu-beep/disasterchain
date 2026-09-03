/**
 * Automated Test Suite for Smart Shelter Recommendation System
 *
 * Covers:
 * 1. Haversine distance calculations and edge cases
 * 2. Explainable 0-100 match scoring logic
 * 3. Full / closed shelter disqualification
 * 4. Role-based privacy redaction (Admin vs Citizen)
 * 5. End-to-end HTTP integration for GET /api/intelligence/recommended-shelter
 * 6. Live integration with Crisis Intelligence GET /api/intelligence/active
 */

const http = require('http');
const {
  calculateDistanceKm,
  evaluateShelterMatch,
  recommendBestShelter,
  sanitizeShelterForRole,
} = require('./services/shelterRecommendationService');

let totalTests = 0;
let passedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`✅ [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`❌ [FAIL] ${message}`);
    process.exitCode = 1;
  }
}

function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(body);
        } catch (e) {
          json = body;
        }
        resolve({ status: res.statusCode, headers: res.headers, body: json });
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('================================================================');
  console.log('🏛️  DISASTERCHAIN SMART SHELTER RECOMMENDATION TEST SUITE');
  console.log('================================================================\n');

  // -------------------------------------------------------------
  // Section 1: Haversine Distance & Spatial Math
  // -------------------------------------------------------------
  console.log('--- 1. Spatial Math & Haversine Distance ---');
  const dZero = calculateDistanceKm(28.6139, 77.209, 28.6139, 77.209);
  assert(dZero === 0, `Zero distance for identical coordinates (got ${dZero})`);

  // Delhi to South Campus (~1.5 km)
  const dCampus = calculateDistanceKm(28.6139, 77.209, 28.625, 77.218);
  assert(dCampus > 1.2 && dCampus < 1.8, `Accurate campus-scale distance calculation (~1.5 km, got ${dCampus})`);

  const dNull = calculateDistanceKm(null, null, 28.6, 77.2);
  assert(dNull === null, 'Graceful handling of null coordinates');

  // -------------------------------------------------------------
  // Section 2: Explainable Match Scoring (0 - 100)
  // -------------------------------------------------------------
  console.log('\n--- 2. Explainable 0-100 Shelter Match Scoring ---');

  const idealShelter = {
    _id: 'sh-1',
    name: 'Central Indoor Stadium Safe Haven',
    address: 'Gate 2, Complex',
    latitude: 28.6145,
    longitude: 77.2095,
    capacity: 500,
    occupancy: 200, // 300 available, 40% occupancy
    status: 'Open',
    facilities: ['Food', 'Drinking Water', 'Medical Support', 'Electricity', 'Toilets'],
    phone: '+91 98111 22233',
  };

  const originLat = 28.6139;
  const originLon = 77.209;

  const idealMatch = evaluateShelterMatch(idealShelter, originLat, originLon);
  assert(idealMatch.eligible === true, 'Ideal shelter is eligible');
  assert(idealMatch.matchScore === 100, `Ideal shelter scores 100/100 (got ${idealMatch.matchScore})`);
  assert(idealMatch.reasons.length >= 5, `Transparent reasons provided (count: ${idealMatch.reasons.length})`);
  assert(idealMatch.directionsUrl.includes('google.com/maps/dir'), 'Directions URL generated with real coordinates');

  // Full Shelter Exclusion
  const fullShelter = {
    _id: 'sh-2',
    name: 'Overcrowded Hall',
    latitude: 28.614,
    longitude: 77.209,
    capacity: 200,
    occupancy: 200, // 0 available
    status: 'Full',
    facilities: ['Food'],
    phone: '+91 98111 44455',
  };
  const fullMatch = evaluateShelterMatch(fullShelter, originLat, originLon);
  assert(fullMatch.eligible === false, '100% full shelter is disqualified');
  assert(fullMatch.matchScore === 0, 'Full shelter receives match score 0');

  // Temporarily Closed Shelter Exclusion
  const closedShelter = {
    _id: 'sh-3',
    name: 'Renovation Center',
    latitude: 28.614,
    longitude: 77.209,
    capacity: 300,
    occupancy: 50,
    status: 'Temporarily Closed',
    facilities: ['Medical Support'],
    phone: '+91 98111 55566',
  };
  const closedMatch = evaluateShelterMatch(closedShelter, originLat, originLon);
  assert(closedMatch.eligible === false, 'Temporarily closed shelter is disqualified');
  assert(closedMatch.matchScore === 0, 'Closed shelter receives match score 0');

  // Candidate Ranking
  const farShelter = {
    _id: 'sh-4',
    name: 'Outskirts Relief Camp',
    latitude: 28.68,
    longitude: 77.28,
    capacity: 100,
    occupancy: 80, // 20 available, 80% occupancy, ~10km away
    status: 'Open',
    facilities: ['Food', 'Drinking Water'],
    phone: '+91 98111 66677',
  };

  const bestCandidate = recommendBestShelter(originLat, originLon, [
    farShelter,
    fullShelter,
    closedShelter,
    idealShelter,
  ]);
  assert(bestCandidate !== null, 'Recommendation found among candidates');
  assert(bestCandidate.shelterId === 'sh-1', `Best shelter selected is ideal candidate (got ${bestCandidate.name})`);

  // No Suitable Shelter Case
  const noCandidate = recommendBestShelter(originLat, originLon, [fullShelter, closedShelter]);
  assert(noCandidate === null, 'Returns null when all candidate shelters are full or closed');

  // -------------------------------------------------------------
  // Section 3: Role-Based Privacy & RBAC Projection
  // -------------------------------------------------------------
  console.log('\n--- 3. Role-Based Privacy & RBAC Projection ---');

  const adminSanitized = sanitizeShelterForRole(idealMatch, 'admin');
  assert(adminSanitized.accessTier === 'OPERATIONAL_FULL', 'Admin receives OPERATIONAL_FULL tier');
  assert(adminSanitized.phone === '+91 98111 22233', 'Admin receives shelter phone contact');

  const citizenSanitized = sanitizeShelterForRole(idealMatch, 'citizen');
  assert(citizenSanitized.accessTier === 'PUBLIC_SAFETY', 'Citizen receives PUBLIC_SAFETY tier');
  assert(citizenSanitized.matchScore === 100, 'Citizen receives accurate match score');
  assert(citizenSanitized.directionsUrl != null, 'Citizen receives navigation directions URL');

  // -------------------------------------------------------------
  // Section 4: End-to-End API Integration
  // -------------------------------------------------------------
  console.log('\n--- 4. End-to-End API Integration ---');

  // Login as admin
  const loginRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'admin@disasterchain.org', password: 'admin123' }
  );

  assert(loginRes.status === 200 && loginRes.body.token, 'Admin login succeeded and retrieved JWT');
  const adminToken = loginRes.body && loginRes.body.token;

  // Login as student / volunteer / citizen
  const citizenLogin = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'student@disasterchain.org', password: 'student123' }
  );
  assert(citizenLogin.status === 200 && citizenLogin.body.token, 'Citizen/Volunteer login succeeded and retrieved JWT');
  const citizenToken = citizenLogin.body && citizenLogin.body.token;

  // Unauthenticated request should return 401
  const unauthRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/intelligence/recommended-shelter?latitude=28.6139&longitude=77.209',
    method: 'GET',
  });
  assert(unauthRes.status === 401, 'Unauthenticated request blocked with 401 Unauthorized');

  // Missing coordinate params should return 400
  const badParamRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/intelligence/recommended-shelter?latitude=28.6139',
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(badParamRes.status === 400, 'Missing longitude returns 400 Bad Request');

  // Successful Admin Shelter Recommendation Query
  const adminShelterRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/intelligence/recommended-shelter?latitude=28.6139&longitude=77.209',
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });

  assert(adminShelterRes.status === 200, `Admin shelter recommendation returned 200 OK (got ${adminShelterRes.status})`);
  assert(adminShelterRes.body.success === true, 'Response contains success: true');
  assert(adminShelterRes.body.data != null, 'Response contains data payload');
  assert(typeof adminShelterRes.body.data.matchScore === 'number', `Match score present: ${adminShelterRes.body.data.matchScore}`);
  assert(Array.isArray(adminShelterRes.body.data.reasons), 'Reasons array provided');
  assert(adminShelterRes.body.data.accessTier === 'OPERATIONAL_FULL', 'Admin receives OPERATIONAL_FULL access tier');

  // Successful Citizen Shelter Recommendation Query
  const citizenShelterRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/intelligence/recommended-shelter?latitude=28.6139&longitude=77.209',
    method: 'GET',
    headers: { Authorization: `Bearer ${citizenToken}` },
  });
  assert(citizenShelterRes.status === 200, 'Citizen shelter recommendation returned 200 OK');
  assert(citizenShelterRes.body.data.accessTier === 'PUBLIC_SAFETY', 'Citizen receives PUBLIC_SAFETY tier');

  // Out of bounds / Pacific Ocean coordinates with no nearby shelters
  // Note: if our shelters are in India, an Indian shelter still exists on Earth, but let's check distance calculation
  const farQuery = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/intelligence/recommended-shelter?latitude=-45.0&longitude=-150.0',
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(farQuery.status === 200 || farQuery.status === 404, 'Pacific Ocean query handled gracefully without crash');

  // -------------------------------------------------------------
  // Section 5: Crisis Intelligence Integration with Recommended Shelter
  // -------------------------------------------------------------
  console.log('\n--- 5. Crisis Intelligence Integration (GET /api/intelligence/active) ---');

  const intelRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/intelligence/active',
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });

  assert(intelRes.status === 200, 'Crisis intelligence active feed returned 200 OK');
  assert(intelRes.body.data.length > 0, `Active emergencies returned (count: ${intelRes.body.data.length})`);

  const topEmergency = intelRes.body.data[0];
  assert(topEmergency.recommendedShelter !== undefined, 'Top emergency has recommendedShelter attached');

  if (topEmergency.recommendedShelter) {
    assert(typeof topEmergency.recommendedShelter.name === 'string', `Shelter name: "${topEmergency.recommendedShelter.name}"`);
    assert(typeof topEmergency.recommendedShelter.distanceKm === 'number', `Shelter distance: ${topEmergency.recommendedShelter.distanceKm} km`);
    assert(typeof topEmergency.recommendedShelter.availableCapacity === 'number', `Shelter available beds: ${topEmergency.recommendedShelter.availableCapacity}`);
    assert(typeof topEmergency.recommendedShelter.matchScore === 'number', `Shelter match score: ${topEmergency.recommendedShelter.matchScore}/100`);
    assert(Array.isArray(topEmergency.recommendedShelter.reasons), 'Shelter recommendation reasons provided');
  }

  console.log('\n================================================================');
  console.log(`📊 SHELTER RECOMMENDATION TEST SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED (${Math.round((passedTests / totalTests) * 100)}%)`);
  if (passedTests === totalTests) {
    console.log('🎉 ALL SMART SHELTER RECOMMENDATION TESTS PASSED SUCCESSFULLY!\n');
  } else {
    console.error('⚠️ SOME SHELTER TESTS FAILED.');
  }
  console.log('================================================================\n');
}

runTests().catch((err) => {
  console.error('Fatal Test Suite Error:', err);
  process.exit(1);
});
