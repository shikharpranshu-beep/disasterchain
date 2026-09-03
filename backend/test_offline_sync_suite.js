/**
 * Automated Test Suite for Offline Emergency Mode & Synchronization Engine
 *
 * Covers:
 * 1. Offline queue structure, serialization & FIFO order
 * 2. Online detection simulation
 * 3. Idempotent SOS creation / duplicate prevention
 * 4. Automatic retry on transient failures
 * 5. Queue clearing upon successful sync
 * 6. Status transitions (ONLINE <-> OFFLINE <-> PENDING <-> SYNCING <-> SYNCED)
 * 7. Live HTTP integration with server deduplication logic
 */

const http = require('http');

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

// In-memory mock of the offline queue service for backend logic verification
class MockOfflineQueueService {
  constructor() {
    this.queue = [];
    this.syncedRecords = [];
    this.status = 'ONLINE'; // 'ONLINE' | 'OFFLINE' | 'PENDING' | 'SYNCING' | 'SYNCED'
  }

  setOnlineStatus(isOnline) {
    if (isOnline) {
      this.status = this.queue.length > 0 ? 'PENDING' : 'ONLINE';
    } else {
      this.status = 'OFFLINE';
    }
  }

  enqueue(type, payload) {
    const clientRequestId = `OFFLINE-${type.toUpperCase()}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const queuedItem = {
      queueId: clientRequestId,
      type,
      payload: {
        ...payload,
        clientRequestId,
      },
      retries: 0,
      timestamp: new Date().toISOString(),
      status: 'QUEUED',
    };

    this.queue.push(queuedItem);
    if (this.status === 'OFFLINE' || this.status === 'ONLINE') {
      this.status = 'PENDING';
    }

    return queuedItem;
  }

  async flushQueue(submitFn) {
    if (this.queue.length === 0) return [];
    this.status = 'SYNCING';

    const processed = [];
    const remaining = [];

    for (const item of this.queue) {
      try {
        const result = await submitFn(item.type, item.payload);
        if (result && result.success) {
          item.status = 'SYNCED';
          item.serverResult = result;
          this.syncedRecords.push(item);
          processed.push(item);
        } else {
          item.retries++;
          remaining.push(item);
        }
      } catch (err) {
        item.retries++;
        remaining.push(item);
      }
    }

    this.queue = remaining;
    this.status = this.queue.length === 0 ? 'SYNCED' : 'PENDING';
    return processed;
  }

  clearQueue() {
    this.queue = [];
    this.status = 'ONLINE';
  }
}

async function runTests() {
  console.log('================================================================');
  console.log('🔄 DISASTERCHAIN OFFLINE EMERGENCY SYNC TEST SUITE');
  console.log('================================================================\n');

  const syncService = new MockOfflineQueueService();

  // 1. Initial State Check
  console.log('--- 1. Queue Lifecycle & Status Transitions ---');
  assert(syncService.status === 'ONLINE', 'Initial sync status is ONLINE');
  assert(syncService.queue.length === 0, 'Queue is initially empty');

  // 2. Offline Transition
  syncService.setOnlineStatus(false);
  assert(syncService.status === 'OFFLINE', 'Status transitions to OFFLINE when network disconnects');

  // 3. Queueing SOS payload while offline
  const sosPayload = {
    name: 'Offline Citizen',
    emergencyType: 'Medical Emergency',
    description: 'Trapped due to debris, power cut',
    location: 'Gate 3, Hostel B',
    latitude: 28.6139,
    longitude: 77.2090,
    peopleAffected: 2,
    severity: 'High',
    contact: '+91 98777 66554',
  };

  const queuedItem = syncService.enqueue('sos', sosPayload);
  assert(queuedItem.queueId.startsWith('OFFLINE-SOS-'), 'Assigned unique client-side queue identifier');
  assert(queuedItem.payload.clientRequestId === queuedItem.queueId, 'Payload attaches clientRequestId for deduplication');
  assert(syncService.queue.length === 1, 'Queue stores exactly one pending request');
  assert(syncService.status === 'PENDING', 'Status transitions to PENDING when items await transmission');

  // 4. FIFO Order validation with multiple items
  const incidentPayload = {
    title: 'Fallen Tree Blocking Road',
    type: 'Infrastructure',
    description: 'Heavy branch blocking ambulance egress',
    location: 'Main Spine Road',
    latitude: 28.6150,
    longitude: 77.2100,
    severity: 'Medium',
  };
  const secondItem = syncService.enqueue('incident', incidentPayload);
  assert(syncService.queue.length === 2, 'Second event queued successfully');
  assert(syncService.queue[0].queueId === queuedItem.queueId, 'FIFO ordering preserved (first queued is first in array)');

  // 5. Online Network Recovery & Flush
  console.log('\n--- 2. Network Recovery & Automated Flush ---');
  syncService.setOnlineStatus(true);

  // Mock server submit function simulating HTTP POST
  let serverCallCount = 0;
  const mockSubmit = async (type, payload) => {
    serverCallCount++;
    return { success: true, id: `SERVER-${Date.now()}` };
  };

  const syncedItems = await syncService.flushQueue(mockSubmit);
  assert(serverCallCount === 2, 'Flushed all pending items to server');
  assert(syncedItems.length === 2, 'Both queued requests acknowledged as synced');
  assert(syncService.queue.length === 0, 'Queue successfully emptied after verified transmission');
  assert(syncService.status === 'SYNCED', 'Status transitions to SYNCED');

  // 6. Transient Failure & Retry Counter
  console.log('\n--- 3. Transient Failure & Retry Resilience ---');
  const failItem = syncService.enqueue('sos', sosPayload);
  let failedOnce = false;

  const flakySubmit = async (type, payload) => {
    if (!failedOnce) {
      failedOnce = true;
      throw new Error('Network timeout');
    }
    return { success: true, id: 'RETRY-OK' };
  };

  await syncService.flushQueue(flakySubmit);
  assert(syncService.queue.length === 1, 'Failed item remains in queue on error');
  assert(syncService.queue[0].retries === 1, 'Retry counter incremented to 1');
  assert(syncService.status === 'PENDING', 'Status stays PENDING while items remain in queue');

  // Second attempt succeeds
  await syncService.flushQueue(flakySubmit);
  assert(syncService.queue.length === 0, 'Retry attempt succeeds and removes item from queue');
  assert(syncService.status === 'SYNCED', 'Status returns to SYNCED');

  // -------------------------------------------------------------
  // Section 4: Live HTTP Server Deduplication / Idempotency Test
  // -------------------------------------------------------------
  console.log('\n--- 4. Live Server-Side Idempotency & Deduplication ---');

  const uniqueClientRequestId = `OFFLINE-TEST-DEDUPE-${Date.now()}`;
  const liveSosPayload = {
    name: 'Idempotency Tester',
    emergencyType: 'Fire',
    description: 'Testing duplicate rejection during offline sync replay',
    location: 'Lab 102, Academic Block',
    latitude: 28.6139,
    longitude: 77.2090,
    peopleAffected: 1,
    severity: 'High',
    contact: '+91 98123 45678',
    requestId: uniqueClientRequestId,
  };

  // First live dispatch
  const firstDispatch = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/sos',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    liveSosPayload
  );

  assert(firstDispatch.status === 201 || firstDispatch.status === 200, `First dispatch succeeded with status ${firstDispatch.status}`);
  assert(firstDispatch.body && firstDispatch.body.success === true, 'First dispatch returns success: true');

  // Second live dispatch with identical requestId (simulating sync retry)
  const replayDispatch = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/sos',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    liveSosPayload
  );

  assert(replayDispatch.status === 200, `Replayed dispatch returned 200 OK (got ${replayDispatch.status})`);
  assert(replayDispatch.body.deduplicated === true, 'Server detects duplicate requestId and flags deduplicated: true');
  assert(replayDispatch.body.data.requestId === uniqueClientRequestId, 'Server returns existing record without creating duplicate');

  console.log('\n================================================================');
  console.log(`📊 OFFLINE SYNC TEST SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED (${Math.round((passedTests / totalTests) * 100)}%)`);
  if (passedTests === totalTests) {
    console.log('🎉 ALL OFFLINE SYNC & DEDUPLICATION TESTS PASSED SUCCESSFULLY!\n');
  } else {
    console.error('⚠️ SOME OFFLINE SYNC TESTS FAILED.');
  }
  console.log('================================================================\n');
}

runTests().catch((err) => {
  console.error('Fatal Offline Sync Test Suite Error:', err);
  process.exit(1);
});
