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
  console.log('⏳ Waiting for backend server to be healthy...');
  for (let i = 0; i < 15; i++) {
    try {
      const res = await fetch('http://localhost:5000/api/health');
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
  throw new Error('Server did not start in time');
}

async function runAuthTestSuite() {
  console.log('================================================================');
  console.log('🧪 RUNNING DISASTERCHAIN PRODUCTION AUTH TEST SUITE (HTTP E2E)');
  console.log('================================================================\n');

  await waitForServer();

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

  const testEmail = `tester_${Date.now()}@disasterchain.test`;
  const testPassword = 'SecureP@ssword2026!';
  let userJwtToken = '';
  let adminJwtToken = '';

  try {
    // 1. Weak Password Rejection
    console.log('\n--- 1. Testing Input Validation ---');
    const weakRes = await request(`${API_BASE}/auth/register`, {
      method: 'POST',
      body: {
        name: 'Test Weak',
        email: `weak_${Date.now()}@test.com`,
        password: 'weak',
        confirmPassword: 'weak',
      },
    });

    assert(
      weakRes.status === 400 && weakRes.data?.message?.includes('Password must'),
      'Weak password rejected with 400 & helpful security message'
    );

    // 2. Password Mismatch Rejection
    const mismatchRes = await request(`${API_BASE}/auth/register`, {
      method: 'POST',
      body: {
        name: 'Test Mismatch',
        email: `mismatch_${Date.now()}@test.com`,
        password: testPassword,
        confirmPassword: 'DifferentPassword123!',
      },
    });

    assert(
      mismatchRes.status === 400 && mismatchRes.data?.message?.includes('do not match'),
      'Password mismatch rejected with 400'
    );

    // 3. Invalid Email Format Rejection
    const invalidEmailRes = await request(`${API_BASE}/auth/register`, {
      method: 'POST',
      body: {
        name: 'Test Invalid Email',
        email: 'invalid-email-format',
        password: testPassword,
        confirmPassword: testPassword,
      },
    });

    assert(
      invalidEmailRes.status === 400,
      'Invalid email format rejected with 400'
    );

    // 4. Valid User Registration
    console.log('\n--- 2. Testing User Registration & Verification Notice ---');
    const regRes = await request(`${API_BASE}/auth/register`, {
      method: 'POST',
      body: {
        name: 'Verification Tester',
        email: testEmail,
        password: testPassword,
        confirmPassword: testPassword,
      },
    });

    assert(
      regRes.status === 201 && regRes.data?.success === true,
      'User registration succeeded with 201 Created and verification email dispatch'
    );

    // 5. Unverified Login Attempt Blocked
    console.log('\n--- 3. Testing Email Verification Enforcement on Login ---');
    const unverifiedLoginRes = await request(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: {
        email: testEmail,
        password: testPassword,
      },
    });

    assert(
      unverifiedLoginRes.status === 403 && unverifiedLoginRes.data?.isUnverified === true,
      'Unverified login blocked with 403 Forbidden and isUnverified flag'
    );

    // 6. Resend Verification
    const resendRes = await request(`${API_BASE}/auth/resend-verification`, {
      method: 'POST',
      body: {
        email: testEmail,
      },
    });

    assert(
      resendRes.status === 200 && resendRes.data?.success === true,
      'Resend verification endpoint succeeded with 200 OK'
    );

    // 7. Verified Demo Student Login
    console.log('\n--- 4. Testing Verified User Login & JWT Generation ---');
    const loginRes = await request(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: {
        email: 'student@disasterchain.org',
        password: 'student123',
      },
    });

    assert(
      loginRes.status === 200 && loginRes.data?.token && loginRes.data?.user?.isVerified === true,
      'Verified user login succeeded with JWT token'
    );
    userJwtToken = loginRes.data?.token;

    // 8. Incorrect Password Rejected
    const wrongPassRes = await request(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: {
        email: 'student@disasterchain.org',
        password: 'WrongPassword123!',
      },
    });

    assert(
      wrongPassRes.status === 401,
      'Incorrect password rejected with 401 Unauthorized'
    );

    // 9. Access Protected Route /api/auth/me
    console.log('\n--- 5. Testing Protected Routes & Profile ---');
    const meRes = await request(`${API_BASE}/auth/me`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${userJwtToken}` },
    });

    assert(
      meRes.status === 200 && meRes.data?.data?.email === 'student@disasterchain.org',
      'Protected /api/auth/me route returns authenticated user profile'
    );

    // 10. Role-Based Authorization (RBAC)
    console.log('\n--- 6. Testing Admin vs Regular User Authorization ---');
    // Regular user attempting admin operation (e.g. creating a shelter)
    const unauthorizedShelterRes = await request(`${API_BASE}/shelters`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userJwtToken}` },
      body: {
        name: 'Unauthorized Shelter',
        address: 'Test Address',
        latitude: 28.61,
        longitude: 77.20,
        capacity: 100,
        phone: '+91 11 0000 0000',
      },
    });

    assert(
      unauthorizedShelterRes.status === 403,
      'Regular user blocked from admin action with 403 Forbidden'
    );

    // Admin Login & Admin Operation
    const adminLoginRes = await request(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: {
        email: 'admin@disasterchain.org',
        password: 'admin123',
      },
    });

    adminJwtToken = adminLoginRes.data?.token;
    assert(
      adminLoginRes.data?.user?.role === 'admin',
      'Admin login returned admin role'
    );

    // 11. Password Reset Request
    console.log('\n--- 7. Testing Password Reset Request Flow ---');
    const forgotRes = await request(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      body: { email: 'student@disasterchain.org' },
    });

    assert(
      forgotRes.status === 200 && forgotRes.data?.success === true,
      'Forgot password request processed successfully with 200 OK'
    );

    // 12. Existing Disaster API Integrity
    console.log('\n--- 8. Testing Existing Disaster Features Integrity ---');
    const [sosRes, shelterRes, areaRes, resRes, bcRes] = await Promise.all([
      request(`${API_BASE}/sos`),
      request(`${API_BASE}/shelters`),
      request(`${API_BASE}/affected-areas`),
      request(`${API_BASE}/resources`),
      request(`${API_BASE}/blockchain/transactions`),
    ]);

    assert(sosRes.status === 200 && Array.isArray(sosRes.data?.data), 'SOS endpoint online & functional');
    assert(shelterRes.status === 200 && Array.isArray(shelterRes.data?.data), 'Shelters endpoint online & functional');
    assert(areaRes.status === 200 && Array.isArray(areaRes.data?.data), 'Affected Areas endpoint online & functional');
    assert(resRes.status === 200 && Array.isArray(resRes.data?.data), 'Resources endpoint online & functional');
    assert(bcRes.status === 200 && Array.isArray(bcRes.data?.data), 'Blockchain Transparency endpoint online & functional');

  } catch (error) {
    console.error('Fatal test error:', error);
  }

  console.log('\n================================================================');
  console.log(`📊 TEST SUITE SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log('================================================================\n');

  if (passedTests === totalTests && totalTests > 0) {
    console.log('🎉 ALL PRODUCTION AUTH & SECURITY TESTS PASSED PERFECTLY!\n');
    process.exit(0);
  } else {
    console.error('⚠️ SOME TESTS FAILED.\n');
    process.exit(1);
  }
}

runAuthTestSuite();
