/**
 * Automated Test Suite for DisasterChain Crisis Intelligence Priority Engine
 *
 * Verifies:
 * 1. Unit evaluation of scoring algorithm, reasons, and recommendations
 * 2. Spatial Haversine distance computations
 * 3. Role-based data sanitization & privacy redaction
 * 4. End-to-end HTTP API integration with live MongoDB Atlas data
 * 5. Query filtering and validation
 */

require('dotenv').config();
const {
  calculateDistanceKm,
  evaluateEmergencyPriority,
  sanitizeIntelligenceForRole,
} = require('./services/crisisIntelligenceService');

const API_BASE = 'http://localhost:5000/api';

async function request(url, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(url, {
    ...options,
    headers,
    body: options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }

  return { status: res.status, ok: res.ok, data };
}

async function waitForServer() {
  console.log('⏳ Verifying backend server connection...');
  for (let i = 0; i < 15; i++) {
    try {
      const res = await fetch(`${API_BASE}/health`);
      if (res.ok) {
        const json = await res.json();
        console.log(`🌐 Connected to DisasterChain server (${json.database})`);
        return true;
      }
    } catch (e) {
      // Retry
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error('Server is not responding on port 5000');
}

async function runIntelligenceTestSuite() {
  console.log('================================================================');
  console.log('🚨 DISASTERCHAIN CRISIS INTELLIGENCE PRIORITY ENGINE TEST SUITE');
  console.log('================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, testName, details = '') {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      if (details) console.error(`   Details: ${details}`);
    }
  }

  // ==================================================================
  // PART 1: Unit Tests for Scoring Engine & Spatial Math
  // ==================================================================
  console.log('--- 1. Spatial Math & Distance Computation ---');
  const distSame = calculateDistanceKm(28.6139, 77.2090, 28.6139, 77.2090);
  assert(distSame === 0, 'Zero distance for identical coordinates', `Got: ${distSame}`);

  const distClose = calculateDistanceKm(28.6139, 77.2090, 28.6250, 77.2180);
  assert(distClose > 1.0 && distClose < 2.5, 'Haversine calculation accurately computes campus scale distance (~1.5km)', `Got: ${distClose} km`);

  console.log('\n--- 2. Explainable Rule-Based Priority Scoring ---');
  // Scenario A: Critical SOS with multiple people and active fire in critical zone
  const criticalSos = {
    requestId: 'SOS-TEST-CRITICAL',
    name: 'Victim A',
    emergencyType: 'Fire',
    severity: 'Critical',
    status: 'Pending',
    peopleAffected: 8,
    latitude: 28.6410,
    longitude: 77.2210,
    contact: '+91 99999 88888',
  };

  const mockContext = {
    affectedAreas: [
      {
        name: 'North Riverfront Zone',
        severity: 'Critical',
        latitude: 28.6400,
        longitude: 77.2200,
        status: 'Active',
      },
    ],
    shelters: [
      {
        name: 'Sector 9 Shelter',
        capacity: 400,
        occupancy: 400,
        status: 'Full',
        latitude: 28.6250,
        longitude: 77.2180,
      },
    ],
    resources: [
      {
        name: 'Apex Civil Hospital',
        type: 'Hospital',
        phone: '+91 11 2233 4455',
        latitude: 28.6150,
        longitude: 77.2100,
      },
      {
        name: 'City Fire Station No. 4',
        type: 'Fire Station',
        phone: '+91 11 101',
        latitude: 28.6280,
        longitude: 77.2150,
      },
    ],
  };

  const evalCritical = evaluateEmergencyPriority(criticalSos, 'sos', mockContext);
  assert(evalCritical.priorityScore >= 80, `Critical SOS receives priority score >= 80 (got ${evalCritical.priorityScore})`);
  assert(evalCritical.priorityLevel === 'CRITICAL', `Priority level assigned is CRITICAL (got ${evalCritical.priorityLevel})`);
  assert(evalCritical.reasons.length >= 4, `Explainable reasons provided (count: ${evalCritical.reasons.length})`);
  assert(evalCritical.recommendedActions.length >= 1, `Actionable emergency recommendations generated (count: ${evalCritical.recommendedActions.length})`);

  // Scenario B: Low severity incident
  const lowIncident = {
    incidentId: 'INC-TEST-LOW',
    title: 'Pothole near walkway',
    type: 'Other',
    severity: 'Low',
    status: 'Pending',
    peopleAffected: 1,
    latitude: 28.6139,
    longitude: 77.2090,
  };
  const evalLow = evaluateEmergencyPriority(lowIncident, 'incident', { shelters: [], resources: [], affectedAreas: [] });
  assert(evalLow.priorityScore < 40, `Low hazard receives priority score < 40 (got ${evalLow.priorityScore})`);
  assert(evalLow.priorityLevel === 'LOW', `Priority level assigned is LOW (got ${evalLow.priorityLevel})`);

  // Scenario C: Medium / High triage differentiation
  const highSos = {
    requestId: 'SOS-TEST-HIGH',
    name: 'Victim B',
    emergencyType: 'Flood',
    severity: 'High',
    status: 'Pending',
    peopleAffected: 3,
    latitude: 28.6139,
    longitude: 77.2090,
  };
  const evalHigh = evaluateEmergencyPriority(highSos, 'sos', { shelters: [], resources: [], affectedAreas: [] });
  assert(evalHigh.priorityScore >= 60 && evalHigh.priorityScore < 80, `High severity unassigned SOS falls in HIGH band (got ${evalHigh.priorityScore})`);
  assert(evalHigh.priorityLevel === 'HIGH', `Priority level assigned is HIGH (got ${evalHigh.priorityLevel})`);

  console.log('\n--- 3. Role-Based Access Control & Privacy Data Minimization ---');
  // Citizen role sanitization
  const citizenView = sanitizeIntelligenceForRole(criticalSos, 'sos', evalCritical, 'citizen');
  assert(citizenView.contact === undefined, 'Citizen view does NOT expose victim phone number');
  assert(citizenView.reporterName === undefined, 'Citizen view does NOT expose reporter name');
  assert(citizenView.accessTier === 'PUBLIC_SAFETY', 'Citizen accessTier marked PUBLIC_SAFETY');
  assert(citizenView.priorityScore === evalCritical.priorityScore, 'Citizen view retains accurate priority score');

  // Volunteer role sanitization
  const volunteerView = sanitizeIntelligenceForRole(criticalSos, 'sos', evalCritical, 'volunteer');
  assert(volunteerView.contact && volunteerView.contact.includes('****'), 'Volunteer view masks contact phone number');
  assert(volunteerView.accessTier === 'OPERATIONAL_VOLUNTEER', 'Volunteer accessTier marked OPERATIONAL_VOLUNTEER');

  // Admin / Responder role
  const adminView = sanitizeIntelligenceForRole(criticalSos, 'sos', evalCritical, 'admin');
  assert(adminView.contact === criticalSos.contact, 'Admin view receives unmasked operational contact phone');
  assert(adminView.accessTier === 'OPERATIONAL_FULL', 'Admin accessTier marked OPERATIONAL_FULL');
  assert(adminView.spatialContext !== undefined, 'Admin view includes full spatial context diagnostics');

  // ==================================================================
  // PART 2: End-to-End API Integration & RBAC HTTP Verification
  // ==================================================================
  console.log('\n--- 4. End-to-End API Integration (GET /api/intelligence/active) ---');
  await waitForServer();

  // Test 4.1: Unauthenticated request should be rejected (401)
  const unauthRes = await request(`${API_BASE}/intelligence/active`);
  assert(unauthRes.status === 401, 'Unauthenticated request to /api/intelligence/active returns 401 Unauthorized', `Status: ${unauthRes.status}`);

  // Test 4.2: Login as Admin
  const adminLoginRes = await request(`${API_BASE}/auth/login`, {
    method: 'POST',
    body: {
      email: 'admin@disasterchain.org',
      password: 'admin123',
    },
  });

  const adminToken = adminLoginRes.data && adminLoginRes.data.token;
  assert(adminLoginRes.status === 200 && adminToken, 'Admin login succeeded and retrieved JWT token');

  // Test 4.3: Admin fetch of active intelligence
  const adminIntelRes = await request(`${API_BASE}/intelligence/active`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });

  assert(adminIntelRes.status === 200, 'Admin can fetch /api/intelligence/active (200 OK)');
  assert(adminIntelRes.data && adminIntelRes.data.success === true, 'Response contains success: true');
  assert(Array.isArray(adminIntelRes.data.data), 'Response data is an array of emergency records');
  assert(adminIntelRes.data.count > 0, `Live MongoDB returned active emergencies (count: ${adminIntelRes.data.count})`);

  const firstAdminItem = adminIntelRes.data.data[0];
  assert(firstAdminItem && firstAdminItem.priorityScore != null, 'Top emergency has priorityScore calculated');
  assert(firstAdminItem && ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(firstAdminItem.priorityLevel), `Top emergency has valid priorityLevel (${firstAdminItem?.priorityLevel})`);
  assert(firstAdminItem && Array.isArray(firstAdminItem.reasons) && firstAdminItem.reasons.length > 0, 'Top emergency includes explainable reasons');
  assert(firstAdminItem && Array.isArray(firstAdminItem.recommendedActions), 'Top emergency includes recommended actions');
  assert(firstAdminItem && firstAdminItem.accessTier === 'OPERATIONAL_FULL', 'Admin received OPERATIONAL_FULL access tier');

  // Test 4.4: Login as Volunteer (student@disasterchain.org)
  const volunteerLoginRes = await request(`${API_BASE}/auth/login`, {
    method: 'POST',
    body: {
      email: 'student@disasterchain.org',
      password: 'student123',
    },
  });

  const volunteerToken = volunteerLoginRes.data && volunteerLoginRes.data.token;
  assert(volunteerLoginRes.status === 200 && volunteerToken, 'Volunteer login succeeded and retrieved JWT token');

  // Test 4.5: Volunteer fetch of active intelligence
  const volunteerIntelRes = await request(`${API_BASE}/intelligence/active`, {
    headers: { Authorization: `Bearer ${volunteerToken}` },
  });

  assert(volunteerIntelRes.status === 200, 'Volunteer can fetch /api/intelligence/active');
  const firstVolunteerItem = volunteerIntelRes.data.data[0];
  assert(firstVolunteerItem && firstVolunteerItem.accessTier === 'OPERATIONAL_VOLUNTEER', `Volunteer receives OPERATIONAL_VOLUNTEER tier (got ${firstVolunteerItem?.accessTier})`);
  assert(!firstVolunteerItem.spatialContext, 'Volunteer does NOT receive internal spatialContext diagnostics');
  if (firstVolunteerItem.contact) {
    assert(firstVolunteerItem.contact.includes('****') || firstVolunteerItem.contact === 'Confidential', 'Volunteer receives masked contact phone');
  }

  // Test 4.6: Citizen Role Access Verification
  const jwt = require('jsonwebtoken');
  const citizenToken = jwt.sign(
    { id: 'demo-citizen-id-11111', role: 'citizen', email: 'citizen@disasterchain.org' },
    process.env.JWT_SECRET || 'disasterchain_secure_jwt_secret_2026',
    { expiresIn: '1h' }
  );

  const citizenIntelRes = await request(`${API_BASE}/intelligence/active`, {
    headers: { Authorization: `Bearer ${citizenToken}` },
  });

  assert(citizenIntelRes.status === 200, 'Citizen can fetch /api/intelligence/active');
  const firstCitizenItem = citizenIntelRes.data.data[0];
  assert(firstCitizenItem && firstCitizenItem.accessTier === 'PUBLIC_SAFETY', `Citizen receives PUBLIC_SAFETY tier (got ${firstCitizenItem?.accessTier})`);
  assert(!firstCitizenItem.contact, 'Citizen does NOT receive caller phone number');
  assert(!firstCitizenItem.reporterName, 'Citizen does NOT receive reporter name');
  assert(!firstCitizenItem.spatialContext, 'Citizen does NOT receive internal spatialContext payload');
  assert(firstCitizenItem.priorityScore != null && firstCitizenItem.priorityLevel != null, 'Citizen receives accurate priority score and level');

  // Test 4.7: Query Filter - type=sos
  const sosOnlyRes = await request(`${API_BASE}/intelligence/active?type=sos`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(sosOnlyRes.status === 200, 'Query filter type=sos returns 200 OK');
  const allSos = sosOnlyRes.data.data.every((i) => i.entityType === 'sos');
  assert(allSos, 'All items returned are SOS requests when type=sos');

  // Test 4.8: Query Filter - priorityLevel=CRITICAL
  const criticalOnlyRes = await request(`${API_BASE}/intelligence/active?priorityLevel=CRITICAL`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(criticalOnlyRes.status === 200, 'Query filter priorityLevel=CRITICAL returns 200 OK');
  const allCritical = criticalOnlyRes.data.data.every((i) => i.priorityLevel === 'CRITICAL');
  assert(allCritical, 'All items returned have priorityLevel CRITICAL');

  // Test 4.9: Verify descending priority order
  const feed = adminIntelRes.data.data;
  let isSorted = true;
  for (let i = 0; i < feed.length - 1; i++) {
    if (feed[i].priorityScore < feed[i + 1].priorityScore) {
      isSorted = false;
      break;
    }
  }
  assert(isSorted, 'Active intelligence feed is strictly sorted descending by priorityScore');

  console.log('\n================================================================');
  console.log(`📊 INTELLIGENCE TEST SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED (${Math.round((passedTests / totalTests) * 100)}%)`);
  if (passedTests === totalTests) {
    console.log('🎉 ALL CRISIS INTELLIGENCE TESTS PASSED SUCCESSFULLY!\n');
  } else {
    console.error('⚠️ SOME INTELLIGENCE TESTS FAILED.\n');
  }
  console.log('================================================================');

  return passedTests === totalTests;
}

// Execute suite
runIntelligenceTestSuite()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((err) => {
    console.error('Test runner fatal failure:', err);
    process.exit(1);
  });
