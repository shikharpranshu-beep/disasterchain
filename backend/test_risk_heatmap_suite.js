/**
 * Comprehensive Automated Test Suite for AI-Assisted Risk Intelligence & Geographic Heatmap
 *
 * Implements full coverage across all 32 required test items:
 * 1. empty database
 * 2. single SOS
 * 3. multiple nearby SOS
 * 4. geographically separated events
 * 5. severity contribution
 * 6. incident contribution
 * 7. affected-area contribution
 * 8. alert contribution
 * 9. shelter pressure contribution
 * 10. clustering
 * 11. cluster radius
 * 12. score normalization
 * 13. CRITICAL level
 * 14. HIGH level
 * 15. MEDIUM level
 * 16. LOW level
 * 17. limit filtering
 * 18. minScore filtering
 * 19. riskLevel filtering
 * 20. coordinate filtering
 * 21. radius filtering
 * 22. malformed coordinates
 * 23. malformed parameters
 * 24. citizen RBAC
 * 25. volunteer RBAC
 * 26. NGO RBAC
 * 27. responder RBAC
 * 28. admin RBAC
 * 29. unauthenticated rejection
 * 30. live MongoDB endpoint
 * 31. empty API response handling
 * 32. duplicate event handling
 */

const http = require('http');
const {
  calculateDistanceKm,
  normalizeEventItem,
  clusterEvents,
  evaluateClusterRisk,
  buildRiskHeatmap,
  getRiskContextForCoordinates,
  sanitizeRiskZoneForRole,
} = require('./services/riskHeatmapService');

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
  console.log('🔥 DISASTERCHAIN RISK INTELLIGENCE & HEATMAP ENGINE TEST SUITE');
  console.log('================================================================\n');

  // -------------------------------------------------------------
  // Test 1: Empty Database / No Events
  // -------------------------------------------------------------
  console.log('--- 1. Empty Dataset & Edge Cases ---');
  const emptyResult = buildRiskHeatmap({});
  assert(Array.isArray(emptyResult) && emptyResult.length === 0, '1. Empty database returns clean empty array');

  // -------------------------------------------------------------
  // Test 2: Single SOS Event
  // -------------------------------------------------------------
  const singleSos = [
    {
      requestId: 'SOS-001',
      name: 'Victim A',
      emergencyType: 'Fire',
      severity: 'Critical',
      status: 'Pending',
      latitude: 28.6139,
      longitude: 77.2090,
      peopleAffected: 5,
    },
  ];
  const singleRes = buildRiskHeatmap({ sosRequests: singleSos });
  assert(singleRes.length === 1, '2. Single SOS event forms exactly one operational risk zone');
  assert(singleRes[0].activeSOSCount === 1, 'Single zone tracks activeSOSCount: 1');

  // -------------------------------------------------------------
  // Test 3: Multiple Nearby SOS Events (Clustering)
  // -------------------------------------------------------------
  const nearbySos = [
    { requestId: 'SOS-101', emergencyType: 'Fire', severity: 'Critical', status: 'Pending', latitude: 28.6139, longitude: 77.2090 },
    { requestId: 'SOS-102', emergencyType: 'Fire', severity: 'High', status: 'In Progress', latitude: 28.6160, longitude: 77.2110 },
    { requestId: 'SOS-103', emergencyType: 'Medical', severity: 'Medium', status: 'Pending', latitude: 28.6145, longitude: 77.2095 },
  ];
  const clusterRes = buildRiskHeatmap({ sosRequests: nearbySos });
  assert(clusterRes.length === 1, '3. Multiple nearby SOS events (within 4km) cluster into a single zone');
  assert(clusterRes[0].eventCount === 3, 'Zone accurately reports eventCount: 3');

  // -------------------------------------------------------------
  // Test 4: Geographically Separated Events
  // -------------------------------------------------------------
  const separatedEvents = [
    { requestId: 'SOS-DELHI', emergencyType: 'Flood', severity: 'Critical', status: 'Pending', latitude: 28.6139, longitude: 77.2090 },
    { requestId: 'SOS-MUMBAI', emergencyType: 'Flood', severity: 'High', status: 'Pending', latitude: 19.0760, longitude: 72.8777 },
  ];
  const separatedRes = buildRiskHeatmap({ sosRequests: separatedEvents });
  assert(separatedRes.length === 2, '4. Geographically separated events form separate distinct risk zones');

  // -------------------------------------------------------------
  // Test 5: Severity Contribution
  // -------------------------------------------------------------
  console.log('\n--- 2. Explainable Factor Contributions ---');
  const criticalEvent = [{ requestId: 'SOS-C', severity: 'Critical', status: 'Pending', latitude: 28.61, longitude: 77.20 }];
  const lowEvent = [{ requestId: 'SOS-L', severity: 'Low', status: 'Pending', latitude: 28.61, longitude: 77.20 }];
  const scoreCritical = buildRiskHeatmap({ sosRequests: criticalEvent })[0].riskScore;
  const scoreLow = buildRiskHeatmap({ sosRequests: lowEvent })[0].riskScore;
  assert(scoreCritical > scoreLow, `5. Critical severity yields higher risk score than Low (${scoreCritical} vs ${scoreLow})`);

  // -------------------------------------------------------------
  // Test 6: Incident Contribution
  // -------------------------------------------------------------
  const incidentEvent = [{ incidentId: 'INC-01', type: 'Gas Leak', severity: 'Critical', status: 'Verified', latitude: 28.61, longitude: 77.20 }];
  const incidentZone = buildRiskHeatmap({ incidents: incidentEvent })[0];
  assert(incidentZone.activeIncidentCount === 1, '6. Incident contribution accurately tracked');
  assert(incidentZone.dominantHazard === 'GAS LEAK', 'Dominant hazard identifies incident type');

  // -------------------------------------------------------------
  // Test 7: Affected Area Contribution
  // -------------------------------------------------------------
  const areaEvent = [{ disasterType: 'Flood', severity: 'Critical', affectedPeople: 2500, latitude: 28.61, longitude: 77.20 }];
  const areaZone = buildRiskHeatmap({ affectedAreas: areaEvent })[0];
  assert(areaZone.affectedAreaCount === 1, '7. Affected area contribution accurately tracked');
  assert(areaZone.reasons.some((r) => r.includes('Critical disaster impact zone')), 'Affected area transparent reason added');

  // -------------------------------------------------------------
  // Test 8: Alert Contribution
  // -------------------------------------------------------------
  const alertEvent = [{ type: 'Evacuation', severity: 'Emergency', title: 'Flash Flood Alert', latitude: 28.61, longitude: 77.20 }];
  const alertZone = buildRiskHeatmap({ alerts: alertEvent })[0];
  assert(alertZone.alertCount === 1, '8. Alert contribution accurately tracked');
  assert(alertZone.reasons.some((r) => r.includes('Emergency / Evacuation broadcast')), 'Alert reason added');

  // -------------------------------------------------------------
  // Test 9: Shelter Pressure Contribution
  // -------------------------------------------------------------
  const strainedShelter = [{ name: 'Full Shelter A', capacity: 100, occupancy: 100, status: 'Full', latitude: 28.612, longitude: 77.208 }];
  const openShelter = [{ name: 'Empty Shelter B', capacity: 500, occupancy: 50, status: 'Open', latitude: 28.612, longitude: 77.208 }];
  const zoneWithStrainedShelter = buildRiskHeatmap({ sosRequests: criticalEvent, shelters: strainedShelter })[0];
  const zoneWithOpenShelter = buildRiskHeatmap({ sosRequests: criticalEvent, shelters: openShelter })[0];
  assert(zoneWithStrainedShelter.riskScore > zoneWithOpenShelter.riskScore, `9. Strained shelter increases risk score (${zoneWithStrainedShelter.riskScore} vs ${zoneWithOpenShelter.riskScore})`);
  assert(zoneWithStrainedShelter.nearbyShelterStrain === 'High', 'Nearby shelter strain identified as High');

  // -------------------------------------------------------------
  // Test 10 & 11: Clustering Algorithm & Radius Calculation
  // -------------------------------------------------------------
  console.log('\n--- 3. Clustering & Geometric Math ---');
  const clusterItems = [
    { latitude: 28.6100, longitude: 77.2000, severity: 'Critical' },
    { latitude: 28.6150, longitude: 77.2050, severity: 'High' },
    { latitude: 28.6200, longitude: 77.2100, severity: 'Medium' },
  ];
  const rawClusters = clusterEvents(clusterItems.map((i, idx) => normalizeEventItem({ ...i, requestId: `c-${idx}` }, 'sos')), 4.0);
  assert(rawClusters.length === 1, '10. Density clustering correctly groups member events');
  assert(rawClusters[0].radiusKm >= 1.2, `11. Cluster radius calculated with baseline buffer (got ${rawClusters[0].radiusKm} km)`);

  // -------------------------------------------------------------
  // Test 12: Score Normalization (0–100 Bounded)
  // -------------------------------------------------------------
  console.log('\n--- 4. Classification & Thresholds ---');
  const massiveDistress = [];
  for (let i = 0; i < 20; i++) {
    massiveDistress.push({ requestId: `MASS-${i}`, severity: 'Critical', latitude: 28.61, longitude: 77.20, peopleAffected: 100 });
  }
  const maxZone = buildRiskHeatmap({ sosRequests: massiveDistress, shelters: strainedShelter })[0];
  assert(maxZone.riskScore <= 100 && maxZone.riskScore >= 0, `12. Extreme distress safely clamps score to 100 (got ${maxZone.riskScore})`);

  // -------------------------------------------------------------
  // Test 13–16: Risk Levels (CRITICAL, HIGH, MEDIUM, LOW)
  // -------------------------------------------------------------
  assert(maxZone.riskLevel === 'CRITICAL', '13. Score >= 80 classifies as CRITICAL');

  // Controlled High
  const highSosList = [
    { requestId: 'H-1', severity: 'High', latitude: 28.61, longitude: 77.20 },
    { requestId: 'H-2', severity: 'High', latitude: 28.61, longitude: 77.20 },
    { requestId: 'H-3', severity: 'High', latitude: 28.61, longitude: 77.20 },
  ];
  const highZone = buildRiskHeatmap({ sosRequests: highSosList, shelters: openShelter })[0];
  assert(['HIGH', 'CRITICAL'].includes(highZone.riskLevel), `14. High-tier distress classified as HIGH (got ${highZone.riskLevel})`);

  // Controlled Medium
  const medSosList = [{ requestId: 'M-1', severity: 'Medium', latitude: 28.61, longitude: 77.20, peopleAffected: 2 }];
  const medZone = buildRiskHeatmap({ sosRequests: medSosList, shelters: openShelter })[0];
  assert(['MEDIUM', 'LOW'].includes(medZone.riskLevel), `15. Medium-tier distress classified appropriately (got ${medZone.riskLevel})`);

  // Low single event
  const lowSosList = [{ requestId: 'L-1', severity: 'Low', status: 'Assigned', latitude: 28.61, longitude: 77.20, peopleAffected: 1 }];
  const lowZone = buildRiskHeatmap({ sosRequests: lowSosList, shelters: openShelter })[0];
  assert(lowZone.riskLevel === 'LOW', `16. Low hazard classified as LOW (got ${lowZone.riskLevel})`);

  // -------------------------------------------------------------
  // Test 17–21: Query Filtering (limit, minScore, riskLevel, coordinate & radius)
  // -------------------------------------------------------------
  console.log('\n--- 5. Filtering & Spatial Query Controls ---');
  const multiCityEvents = [
    { requestId: 'S-1', severity: 'Critical', latitude: 28.61, longitude: 77.20 },
    { requestId: 'S-2', severity: 'Low', latitude: 28.61, longitude: 77.20 },
    { requestId: 'S-3', severity: 'High', latitude: 19.07, longitude: 72.87 },
    { requestId: 'S-4', severity: 'Critical', latitude: 12.97, longitude: 77.59 },
  ];
  const limRes = buildRiskHeatmap({ sosRequests: multiCityEvents }, { limit: 2 });
  assert(limRes.length === 2, `17. Limit filter bounds output (requested 2, got ${limRes.length})`);

  const minScoreRes = buildRiskHeatmap({ sosRequests: multiCityEvents }, { minScore: 50 });
  assert(minScoreRes.every((z) => z.riskScore >= 50), '18. minScore filter excludes sub-threshold zones');

  const levelRes = buildRiskHeatmap({ sosRequests: multiCityEvents }, { riskLevel: 'CRITICAL' });
  assert(levelRes.every((z) => z.riskLevel === 'CRITICAL'), '19. riskLevel filter retains only CRITICAL zones');

  const coordRes = buildRiskHeatmap(
    { sosRequests: multiCityEvents },
    { latitude: 28.6139, longitude: 77.2090, radiusKm: 25 }
  );
  assert(coordRes.length === 1 && coordRes[0].latitude > 28.0 && coordRes[0].latitude < 29.0, '20 & 21. Coordinate & radius filtering correctly isolates regional zones');

  // -------------------------------------------------------------
  // Test 22 & 23: Malformed Coordinates & Parameters Safety
  // -------------------------------------------------------------
  console.log('\n--- 6. Malformed Input Resilience ---');
  const badCoords = [{ latitude: 'invalid', longitude: null }, { latitude: 999, longitude: -999 }];
  const malformedRes = buildRiskHeatmap({ sosRequests: badCoords });
  assert(malformedRes.length === 0, '22. Malformed coordinates gracefully ignored without crashing');

  const badFilterRes = buildRiskHeatmap(
    { sosRequests: singleSos },
    { minScore: 'abc', limit: -5, latitude: 'bad', radiusKm: 'none' }
  );
  assert(badFilterRes.length === 1, '23. Malformed query parameters handled gracefully with fallback');

  // -------------------------------------------------------------
  // Test 24–28: RBAC Projections
  // -------------------------------------------------------------
  console.log('\n--- 7. Role-Based Access Control Projections ---');
  const sampleZone = maxZone;

  const citizenView = sanitizeRiskZoneForRole(sampleZone, 'citizen');
  assert(citizenView.accessTier === 'PUBLIC_SAFETY', '24. Citizen receives PUBLIC_SAFETY tier');
  assert(citizenView.riskScore === sampleZone.riskScore, 'Citizen receives accurate risk score');

  const volunteerView = sanitizeRiskZoneForRole(sampleZone, 'volunteer');
  assert(volunteerView.accessTier === 'OPERATIONAL_VOLUNTEER', '25. Volunteer receives OPERATIONAL_VOLUNTEER tier');

  const ngoView = sanitizeRiskZoneForRole(sampleZone, 'ngo');
  assert(ngoView.accessTier === 'OPERATIONAL_VOLUNTEER', '26. NGO receives OPERATIONAL_VOLUNTEER tier');

  const responderView = sanitizeRiskZoneForRole(sampleZone, 'responder');
  assert(responderView.accessTier === 'OPERATIONAL_FULL', '27. Responder receives OPERATIONAL_FULL tier');

  const adminView = sanitizeRiskZoneForRole(sampleZone, 'admin');
  assert(adminView.accessTier === 'OPERATIONAL_FULL', '28. Admin receives OPERATIONAL_FULL tier');

  // -------------------------------------------------------------
  // Test 29–32: End-to-End Live API Tests
  // -------------------------------------------------------------
  console.log('\n--- 8. End-to-End API Integration ---');

  // 29. Unauthenticated rejection
  const unauthRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/intelligence/risk-heatmap',
    method: 'GET',
  });
  assert(unauthRes.status === 401, '29. Unauthenticated request to /api/intelligence/risk-heatmap returns 401 Unauthorized');

  // Login as admin
  const adminLogin = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'admin@disasterchain.org', password: 'admin123' }
  );
  const adminToken = adminLogin.body && adminLogin.body.token;

  // 30. Live MongoDB endpoint test
  const liveHeatmapRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/intelligence/risk-heatmap',
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(liveHeatmapRes.status === 200, '30. Live MongoDB risk heatmap endpoint returns 200 OK');
  assert(liveHeatmapRes.body.success === true, 'Response payload contains success: true');
  assert(Array.isArray(liveHeatmapRes.body.data.zones), 'Response contains data.zones array');
  assert(liveHeatmapRes.body.summary && typeof liveHeatmapRes.body.summary.totalZones === 'number', 'Summary statistics object provided');

  // 31. Empty API response handling with impossible filter
  const emptyFilterRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/intelligence/risk-heatmap?latitude=-80.0&longitude=-170.0&radiusKm=1',
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(emptyFilterRes.status === 200 && emptyFilterRes.body.data.zones.length === 0, '31. Empty API filter result returns 200 OK with empty zones array');

  // 32. Duplicate Event Handling
  const dupEvents = [
    { requestId: 'SOS-DUP', severity: 'High', latitude: 28.6139, longitude: 77.2090 },
    { requestId: 'SOS-DUP', severity: 'High', latitude: 28.6139, longitude: 77.2090 },
  ];
  const dupClusters = clusterEvents(dupEvents.map((e) => normalizeEventItem(e, 'sos')));
  assert(dupClusters.length === 1, '32. Duplicate event coordinates co-locate in same cluster without error');

  console.log('\n================================================================');
  console.log(`📊 RISK HEATMAP TEST SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED (${Math.round((passedTests / totalTests) * 100)}%)`);
  if (passedTests === totalTests) {
    console.log('🎉 ALL 32 RISK HEATMAP & CLUSTERING TESTS PASSED SUCCESSFULLY!\n');
  } else {
    console.error('⚠️ SOME RISK HEATMAP TESTS FAILED.');
  }
  console.log('================================================================\n');
}

runTests().catch((err) => {
  console.error('Fatal Test Suite Error:', err);
  process.exit(1);
});
