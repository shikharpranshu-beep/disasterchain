/**
 * Offline Emergency Mode & Synchronization Engine
 *
 * Implements browser-based offline resilience:
 * - Monitors network connectivity (navigator.onLine, window online/offline events)
 * - Persistent local queue in localStorage for SOS and incident distress dispatches
 * - Generates unique client queue IDs for idempotent server deduplication
 * - Automatic background synchronization when network connectivity restores
 * - Reactive listener pattern for UI status indicators: ONLINE | OFFLINE | SYNCING | SYNCED | PENDING
 */

import { createSosRequest, createIncident } from './api';

const QUEUE_STORAGE_KEY = 'disasterchain_offline_emergency_queue';
const SYNCED_LOG_KEY = 'disasterchain_synced_records_cache';

class OfflineSyncService {
  constructor() {
    this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    this.status = this.isOnline ? 'ONLINE' : 'OFFLINE';
    this.subscribers = new Set();
    this.isSyncing = false;

    // Load initial queue
    this.queue = this.loadQueue();
    if (this.queue.length > 0 && this.isOnline) {
      this.status = 'PENDING';
    }

    // Attach browser connectivity lifecycle listeners
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleNetworkChange(true));
      window.addEventListener('offline', () => this.handleNetworkChange(false));
    }
  }

  loadQueue() {
    if (typeof localStorage === 'undefined') return [];
    try {
      const stored = localStorage.getItem(QUEUE_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.warn('Failed to parse offline emergency queue from localStorage:', e);
      return [];
    }
  }

  saveQueue() {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(this.queue));
    } catch (e) {
      console.warn('Failed to persist offline queue to localStorage:', e);
    }
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    // Initial emit
    callback(this.getState());
    return () => this.subscribers.delete(callback);
  }

  notify() {
    const state = this.getState();
    for (const sub of this.subscribers) {
      try {
        sub(state);
      } catch (err) {
        console.error('OfflineSync subscriber error:', err);
      }
    }
  }

  getState() {
    return {
      isOnline: this.isOnline,
      status: this.status, // 'ONLINE' | 'OFFLINE' | 'PENDING' | 'SYNCING' | 'SYNCED'
      pendingCount: this.queue.length,
      queue: [...this.queue],
    };
  }

  handleNetworkChange(isOnline) {
    this.isOnline = isOnline;

    if (!isOnline) {
      this.status = 'OFFLINE';
      this.notify();
    } else {
      if (this.queue.length > 0) {
        this.status = 'PENDING';
        this.notify();
        // Trigger auto-sync with slight delay to allow network sockets to stabilize
        setTimeout(() => this.syncPendingQueue(), 1200);
      } else {
        this.status = 'ONLINE';
        this.notify();
      }
    }
  }

  /**
   * Enqueues an emergency distress dispatch locally when connectivity is unavailable or impaired
   */
  enqueueEmergency(type, payload) {
    const queueId = `OFFLINE-${type.toUpperCase()}-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const queuedItem = {
      queueId,
      type, // 'sos' or 'incident'
      payload: {
        ...payload,
        requestId: queueId,
        clientRequestId: queueId,
      },
      retries: 0,
      timestamp: new Date().toISOString(),
      status: 'QUEUED',
    };

    this.queue.push(queuedItem);
    this.saveQueue();

    this.status = this.isOnline ? 'PENDING' : 'OFFLINE';
    this.notify();

    return queuedItem;
  }

  /**
   * Automatically synchronizes all pending offline emergency records to the live backend
   */
  async syncPendingQueue() {
    if (this.isSyncing || this.queue.length === 0 || !this.isOnline) {
      return { success: true, count: 0 };
    }

    this.isSyncing = true;
    this.status = 'SYNCING';
    this.notify();

    const successfullySynced = [];
    const remainingQueue = [];

    for (const item of this.queue) {
      try {
        let res = null;
        if (item.type === 'sos') {
          res = await createSosRequest(item.payload);
        } else if (item.type === 'incident') {
          res = await createIncident(item.payload);
        }

        if (res && (res.success || res.status === 200 || res.status === 201)) {
          successfullySynced.push({
            ...item,
            serverResult: res.data || res,
            syncedAt: new Date().toISOString(),
          });
        } else {
          item.retries = (item.retries || 0) + 1;
          remainingQueue.push(item);
        }
      } catch (err) {
        console.warn(`Transient sync failure for queue item ${item.queueId}:`, err.message);
        item.retries = (item.retries || 0) + 1;
        remainingQueue.push(item);
      }
    }

    this.queue = remainingQueue;
    this.saveQueue();

    // Cache completed sync history in localStorage for user transparency
    if (successfullySynced.length > 0 && typeof localStorage !== 'undefined') {
      try {
        const existing = JSON.parse(localStorage.getItem(SYNCED_LOG_KEY) || '[]');
        localStorage.setItem(SYNCED_LOG_KEY, JSON.stringify([...successfullySynced, ...existing].slice(0, 20)));
      } catch (e) {
        // Ignore cache storage error
      }
    }

    this.isSyncing = false;
    this.status = this.queue.length === 0 ? 'SYNCED' : 'PENDING';
    this.notify();

    // Reset status back to ONLINE after showing SYNCED confirmation for 3 seconds
    if (this.status === 'SYNCED') {
      setTimeout(() => {
        if (this.status === 'SYNCED' && this.queue.length === 0 && this.isOnline) {
          this.status = 'ONLINE';
          this.notify();
        }
      }, 3500);
    }

    return {
      success: remainingQueue.length === 0,
      syncedCount: successfullySynced.length,
      remainingCount: remainingQueue.length,
    };
  }

  clearQueue() {
    this.queue = [];
    this.saveQueue();
    this.status = this.isOnline ? 'ONLINE' : 'OFFLINE';
    this.notify();
  }
}

const offlineSyncService = new OfflineSyncService();
export default offlineSyncService;
