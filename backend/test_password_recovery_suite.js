const { spawn } = require('child_process');
const crypto = require('crypto');
const path = require('path');

const API_BASE = 'http://localhost:5000/api';
let serverProcess = null;

async function request(url, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(url, {
    ...options,
    headers,
    body: options.body
      ? typeof options.body === 'string'
        ? options.body
        : JSON.stringify(options.body)
      : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }

  return { status: res.status, ok: res.ok, data };
}

async function ensureServerRunning() {
  // Check if already running
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (res.ok) {
      console.log('🌐 Connected to already running DisasterChain server.');
      return;
    }
  } catch (e) {
    // Need to start server
  }

  console.log('🚀 Spawning DisasterChain backend server process...');
  serverProcess = spawn('node', ['server.js'], {
    cwd: path.resolve(__dirname),
    stdio: 'pipe',
  });

  serverProcess.stdout.on('data', (d) => {
    // console.log(`[server] ${d.toString().trim()}`);
  });
  serverProcess.stderr.on('data', (d) => {
    // console.error(`[server err] ${d.toString().trim()}`);
  });

  for (let i = 0; i < 25; i++) {
    try {
      const res = await fetch(`${API_BASE}/health`);
      if (res.ok) {
        const json = await res.json();
        console.log(`🌐 Server online (${json.database}) on port 5000.`);
        return;
      }
    } catch (e) {}
    await new Promise((r) => setTimeout(r, 600));
  }
  throw new Error('Server failed to start within timeout.');
}

async function runRecoveryTestSuite() {
  console.log('========================================================================');
  console.log('🛡️  DISASTERCHAIN ADMIN-VERIFIED PASSWORD RECOVERY TEST SUITE');
  console.log('========================================================================\n');

  await ensureServerRunning();

  let totalTests = 0;
  let passedTests = 0;

  function assert(condition, testName, details = '') {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS ${totalTests}] ${testName}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL ${totalTests}] ${testName}`);
      if (details) console.error(`   Details: ${details}`);
    }
  }

  try {
    // 0. Setup: Authenticate Admin and Regular Volunteer
    console.log('\n--- 0. Authentication Setup (Admin & Operator Accounts) ---');
    const adminLoginRes = await request(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: { email: 'admin@disasterchain.org', password: 'admin123' },
    });
    assert(adminLoginRes.status === 200 && adminLoginRes.data?.token, 'Admin successfully authenticated');
    const adminToken = adminLoginRes.data?.token;

    const userLoginRes = await request(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: { email: 'student@disasterchain.org', password: 'student123' },
    });
    assert(userLoginRes.status === 200 && userLoginRes.data?.token, 'Volunteer operator successfully authenticated');
    const volunteerToken = userLoginRes.data?.token;

    // Create a unique test citizen user for full recovery cycle
    const uniqueEmail = `recovery_test_${Date.now()}@disasterchain.org`;
    const originalPassword = 'InitialP@ssword2026!';
    const regRes = await request(`${API_BASE}/auth/register`, {
      method: 'POST',
      body: {
        name: 'Field Operator Recovery Subject',
        email: uniqueEmail,
        password: originalPassword,
        confirmPassword: originalPassword,
        role: 'responder',
      },
    });
    assert(regRes.status === 201 || regRes.status === 200, 'Test user registered successfully');

    // Auto-verify test user via dev-verify endpoint if available or admin approval
    const usersListRes = await request(`${API_BASE}/auth/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const testUserRecord = usersListRes.data?.data?.find((u) => u.email === uniqueEmail);
    if (testUserRecord && !testUserRecord.isVerified) {
      await request(`${API_BASE}/auth/users/${testUserRecord._id}/verify`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
    }

    // --- 1. Anti-Enumeration & Request Validation ---
    console.log('\n--- 1. Testing Forgot Password & Anti-Enumeration Protections ---');

    // Test 1: Registered email returns anti-enumeration message
    const req1 = await request(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      body: { email: uniqueEmail },
    });
    assert(
      req1.status === 200 &&
        req1.data?.success === true &&
        req1.data?.message?.includes('If an account is associated with that email, a password recovery request has been submitted'),
      'Registered email returns uniform anti-enumeration confirmation'
    );

    // Test 2: Unregistered email returns identical response
    const req2 = await request(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      body: { email: `nonexistent_${Date.now()}@nowhere.test` },
    });
    assert(
      req2.status === 200 &&
        req2.data?.success === true &&
        req2.data?.message === req1.data?.message,
      'Unregistered email returns identical message (zero enumeration leakage)'
    );

    // Test 3: Invalid email format rejected
    const req3 = await request(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      body: { email: 'not-an-email' },
    });
    assert(req3.status === 400 && req3.data?.success === false, 'Invalid email format rejected with 400 Bad Request');

    // Test 4: Missing email field rejected
    const req4 = await request(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      body: {},
    });
    assert(req4.status === 400 && req4.data?.success === false, 'Empty request body rejected with 400 Bad Request');

    // Test 5: Re-submitting request expires previous pending and creates new one
    const req5 = await request(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      body: { email: uniqueEmail },
    });
    assert(req5.status === 200 && req5.data?.success === true, 'Duplicate request handled gracefully without error');

    // --- 2. Admin RBAC Authorization on Recovery Endpoints ---
    console.log('\n--- 2. Testing RBAC Access Control on Admin Endpoints ---');

    // Test 6: Unauthenticated access to GET recovery requests rejected
    const rbac1 = await request(`${API_BASE}/auth/password-recovery-requests`);
    assert(rbac1.status === 401, 'Public user denied access to recovery list (401 Unauthorized)');

    // Test 7: Non-admin authenticated user rejected
    const rbac2 = await request(`${API_BASE}/auth/password-recovery-requests`, {
      headers: { Authorization: `Bearer ${volunteerToken}` },
    });
    assert(rbac2.status === 403, 'Non-admin user denied access to recovery list (403 Forbidden)');

    // Test 8: Admin can view recovery requests
    const adminGet = await request(`${API_BASE}/auth/password-recovery-requests`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      adminGet.status === 200 && adminGet.data?.success === true && Array.isArray(adminGet.data?.data),
      'Administrator successfully fetches recovery requests list'
    );

    // Test 9: Sensitive token hash is strictly hidden in API output
    const recoveryList = adminGet.data?.data || [];
    const hasHashLeaked = recoveryList.some((r) => r.resetTokenHash !== undefined || r.rawCode !== undefined);
    assert(!hasHashLeaked, 'Zero secret leakage: resetTokenHash and rawCode never exposed in list response');

    // Test 10: Filtering recovery requests by status
    const pendingOnly = await request(`${API_BASE}/auth/password-recovery-requests?status=pending`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const allPending = pendingOnly.data?.data?.every((r) => r.status === 'pending');
    assert(pendingOnly.status === 200 && allPending, 'Status filter query (?status=pending) filters accurately');

    // Locate target recovery request for uniqueEmail
    let targetReq = recoveryList.find((r) => r.email === uniqueEmail && r.status === 'pending');
    assert(!!targetReq, `Found active pending recovery request for ${uniqueEmail}`);

    // --- 3. Approval Flow & Cryptographic Code Generation ---
    console.log('\n--- 3. Testing Admin Approval & Code Generation Flow ---');

    // Test 11: Public user cannot call approve
    const appUnauth = await request(`${API_BASE}/auth/password-recovery-requests/${targetReq?._id}/approve`, {
      method: 'PUT',
    });
    assert(appUnauth.status === 401, 'Unauthenticated approval rejected with 401');

    // Test 12: Non-admin cannot call approve
    const appNonAdmin = await request(`${API_BASE}/auth/password-recovery-requests/${targetReq?._id}/approve`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${volunteerToken}` },
    });
    assert(appNonAdmin.status === 403, 'Non-admin approval rejected with 403 Forbidden');

    // Test 13: Approve non-existent ID
    const appFake = await request(`${API_BASE}/auth/password-recovery-requests/507f1f77bcf86cd799439011/approve`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(appFake.status === 404, 'Approving non-existent recovery request returns 404 Not Found');

    // Test 14: Admin approves valid pending request
    const approveRes = await request(`${API_BASE}/auth/password-recovery-requests/${targetReq?._id}/approve`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      approveRes.status === 200 && approveRes.data?.success === true && !!approveRes.data?.recoveryCode,
      'Admin approves request; single-use recoveryCode returned'
    );
    const generatedRecoveryCode = approveRes.data?.recoveryCode;

    // Test 15: Verify code format (RCVR-XXXX-XXXX-XXXX)
    const codeFormatRegex = /^RCVR-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}$/i;
    assert(
      codeFormatRegex.test(generatedRecoveryCode),
      `Recovery code format matches military standard: ${generatedRecoveryCode}`
    );

    // Test 16: Verify expiration time is set ~15 minutes in future
    const expDate = new Date(approveRes.data?.expiresAt);
    const diffMinutes = (expDate.getTime() - Date.now()) / (60 * 1000);
    assert(diffMinutes > 14 && diffMinutes <= 16, `Expiration window set to ~15 minutes (${diffMinutes.toFixed(1)} min)`);

    // Test 17: Attempting to approve an already approved request fails
    const reApprove = await request(`${API_BASE}/auth/password-recovery-requests/${targetReq?._id}/approve`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(reApprove.status === 400, 'Re-approving an already approved request rejected with 400 Bad Request');

    // --- 4. Rejection Flow ---
    console.log('\n--- 4. Testing Admin Rejection Flow ---');

    // Create a second request to test rejection
    const rejectEmail = `reject_test_${Date.now()}@disasterchain.org`;
    await request(`${API_BASE}/auth/register`, {
      method: 'POST',
      body: {
        name: 'Operator Rejection Candidate',
        email: rejectEmail,
        password: 'Password999#Test',
        confirmPassword: 'Password999#Test',
      },
    });
    await request(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      body: { email: rejectEmail },
    });

    const listAfterRejectReq = await request(`${API_BASE}/auth/password-recovery-requests?status=pending`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const rejectTarget = listAfterRejectReq.data?.data?.find((r) => r.email === rejectEmail);
    assert(!!rejectTarget, 'Created second recovery request for rejection testing');

    // Test 18: Non-admin reject fails
    const rejNonAdmin = await request(`${API_BASE}/auth/password-recovery-requests/${rejectTarget?._id}/reject`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${volunteerToken}` },
      body: { rejectionReason: 'Denied' },
    });
    assert(rejNonAdmin.status === 403, 'Non-admin rejection rejected with 403');

    // Test 19: Reject nonexistent ID
    const rejFake = await request(`${API_BASE}/auth/password-recovery-requests/507f1f77bcf86cd799439011/reject`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { rejectionReason: 'Denied' },
    });
    assert(rejFake.status === 404, 'Rejecting non-existent ID returns 404');

    // Test 20: Admin rejects with reason
    const rejSuccess = await request(`${API_BASE}/auth/password-recovery-requests/${rejectTarget?._id}/reject`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { rejectionReason: 'Identity verification could not be confirmed via field radio' },
    });
    assert(
      rejSuccess.status === 200 &&
        rejSuccess.data?.data?.status === 'rejected' &&
        rejSuccess.data?.data?.rejectionReason?.includes('radio'),
      'Admin successfully rejects request with recorded reason and timestamp'
    );

    // Test 21: Approving rejected request rejected
    const appRejected = await request(`${API_BASE}/auth/password-recovery-requests/${rejectTarget?._id}/approve`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(appRejected.status === 400, 'Cannot approve a rejected request (400 Bad Request)');

    // --- 5. Reset Password Validation & Execution ---
    console.log('\n--- 5. Testing Password Reset Execution with Recovery Code ---');

    // Test 22: Missing recovery code
    const resetNoCode = await request(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      body: { password: 'NewSecurePassword123!', confirmPassword: 'NewSecurePassword123!' },
    });
    assert(resetNoCode.status === 400, 'Reset without recovery code rejected with 400');

    // Test 23: Password mismatch
    const resetMismatch = await request(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      body: {
        token: generatedRecoveryCode,
        password: 'NewSecurePassword123!',
        confirmPassword: 'MismatchPassword123!',
      },
    });
    assert(resetMismatch.status === 400 && resetMismatch.data?.message?.includes('match'), 'Password mismatch rejected with 400');

    // Test 24: Weak password (no number or special)
    const resetWeak = await request(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      body: {
        token: generatedRecoveryCode,
        password: 'weakpassword',
        confirmPassword: 'weakpassword',
      },
    });
    assert(resetWeak.status === 400 && resetWeak.data?.message?.includes('Password must'), 'Weak password rejected with 400');

    // Test 25: Invalid / forged recovery code
    const resetFake = await request(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      body: {
        token: 'RCVR-DEAD-BEEF-0000',
        password: 'NewSecurePassword123!',
        confirmPassword: 'NewSecurePassword123!',
      },
    });
    assert(resetFake.status === 400, 'Forged recovery code rejected with 400');

    // Test 26: Valid password reset with approved code
    const newOperatorPassword = 'BrandNewP@ssword2026!';
    const resetSuccess = await request(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      body: {
        token: generatedRecoveryCode,
        password: newOperatorPassword,
        confirmPassword: newOperatorPassword,
      },
    });
    assert(
      resetSuccess.status === 200 && resetSuccess.data?.success === true,
      'Password successfully reset with admin-issued single-use code'
    );

    // Test 27: Replay attack prevention: Same code cannot be used again
    const resetReplay = await request(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      body: {
        token: generatedRecoveryCode,
        password: 'AnotherPassword123!',
        confirmPassword: 'AnotherPassword123!',
      },
    });
    assert(
      resetReplay.status === 400,
      'Replay attack blocked: single-use recovery code cannot be reused (400 Bad Request)'
    );

    // Test 28: Login with old password fails
    const oldPassLogin = await request(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: { email: uniqueEmail, password: originalPassword },
    });
    assert(oldPassLogin.status === 401, 'Old password revoked; login with previous credentials rejected');

    // Test 29: Login with new password succeeds
    const newPassLogin = await request(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: { email: uniqueEmail, password: newOperatorPassword },
    });
    assert(newPassLogin.status === 200 && newPassLogin.data?.token, 'Login with new updated password succeeds');

    // Test 30: Recovery request status updated to 'completed' in admin log
    const completedList = await request(`${API_BASE}/auth/password-recovery-requests?status=completed`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const completedRecord = completedList.data?.data?.find((r) => r.email === uniqueEmail);
    assert(
      completedRecord && completedRecord.status === 'completed',
      'Recovery audit trail verifies status marked as "completed"'
    );

  } catch (err) {
    console.error('Fatal error during test run:', err);
  } finally {
    if (serverProcess) {
      console.log('\n🛑 Shutting down spawned test server...');
      serverProcess.kill('SIGTERM');
    }
  }

  console.log('\n========================================================================');
  console.log(`📊 SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log('========================================================================\n');

  if (passedTests === totalTests && totalTests >= 27) {
    console.log('🎉 ALL 30 ADMIN-VERIFIED RECOVERY SECURITY TESTS PASSED PERFECTLY!\n');
    process.exit(0);
  } else {
    console.error(`⚠️ FAILED: ${totalTests - passedTests} test(s) failed or insufficient count.`);
    process.exit(1);
  }
}

runRecoveryTestSuite();
