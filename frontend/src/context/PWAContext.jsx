import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const PWAContext = createContext(null);

const DISMISSED_STORAGE_KEY = 'disasterchain_pwa_install_dismissed';

export const PWAProvider = ({ children }) => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISSED_STORAGE_KEY) === 'true';
    } catch (e) {
      return false;
    }
  });

  // Network State Management
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [networkStatus, setNetworkStatus] = useState(
    typeof navigator !== 'undefined' && !navigator.onLine ? 'OFFLINE' : 'LIVE'
  );

  // SW Update State
  const [waitingWorker, setWaitingWorker] = useState(null);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);

  // Detect standalone mode
  useEffect(() => {
    const checkStandalone = () => {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true ||
        document.referrer.includes('android-app://');
      setIsInstalled(Boolean(isStandalone));
    };

    checkStandalone();

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayChange = (e) => setIsInstalled(e.matches);
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleDisplayChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleDisplayChange);
      }
    };
  }, []);

  // Listen for native beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent browser's default mini-infobar on mobile
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      console.log('[DisasterChain PWA] App successfully installed by user');
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      try {
        localStorage.removeItem(DISMISSED_STORAGE_KEY);
      } catch (e) {}
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Listen for service worker update event
  useEffect(() => {
    const handleSwUpdate = (e) => {
      const registration = e.detail;
      if (registration && registration.waiting) {
        setWaitingWorker(registration.waiting);
        setIsUpdateAvailable(true);
      }
    };
    window.addEventListener('disasterchain:swUpdate', handleSwUpdate);
    return () => window.removeEventListener('disasterchain:swUpdate', handleSwUpdate);
  }, []);

  // Network Connectivity Lifecycle
  useEffect(() => {
    let reconnectTimer = null;

    const handleOnline = () => {
      setIsOnline(true);
      setNetworkStatus('RECONNECTED');

      // Dispatch custom window event so active pages can refresh live data
      window.dispatchEvent(new CustomEvent('disasterchain:reconnected'));

      // Keep RECONNECTED status for 4 seconds before transitioning to LIVE
      reconnectTimer = setTimeout(() => {
        setNetworkStatus('LIVE');
      }, 4000);
    };

    const handleOffline = () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      setIsOnline(false);
      setNetworkStatus('OFFLINE');
      window.dispatchEvent(new CustomEvent('disasterchain:offline'));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, []);

  // Track whether cached emergency data is active due to offline operation
  const [hasCachedData, setHasCachedData] = useState(false);

  useEffect(() => {
    const handleCachedServed = () => setHasCachedData(true);
    const handleReconnected = () => setHasCachedData(false);
    window.addEventListener('disasterchain:cachedDataServed', handleCachedServed);
    window.addEventListener('disasterchain:reconnected', handleReconnected);
    return () => {
      window.removeEventListener('disasterchain:cachedDataServed', handleCachedServed);
      window.removeEventListener('disasterchain:reconnected', handleReconnected);
    };
  }, []);

  // Service Worker controllerchange listener for smooth refresh
  useEffect(() => {
    let refreshing = false;
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }
  }, []);

  // Prompt the user to install the PWA
  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) {
      return false;
    }
    try {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        console.log('[DisasterChain PWA] User accepted installation prompt');
        setIsInstallable(false);
        setDeferredPrompt(null);
        return true;
      } else {
        console.log('[DisasterChain PWA] User dismissed installation prompt');
        return false;
      }
    } catch (err) {
      console.error('[DisasterChain PWA] Error during promptInstall:', err);
      return false;
    }
  }, [deferredPrompt]);

  // Dismiss mobile banner and remember choice
  const dismissInstallPrompt = useCallback(() => {
    setIsDismissed(true);
    try {
      localStorage.setItem(DISMISSED_STORAGE_KEY, 'true');
    } catch (e) {}
  }, []);

  // Trigger service worker update
  const triggerUpdate = useCallback(() => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    } else {
      window.location.reload();
    }
  }, [waitingWorker]);

  const value = {
    isInstallable: isInstallable && !isInstalled,
    isInstalled,
    isDismissed,
    promptInstall,
    dismissInstallPrompt,
    isOnline,
    networkStatus,
    hasCachedData,
    isUpdateAvailable,
    setIsUpdateAvailable,
    setWaitingWorker,
    triggerUpdate,
  };

  return <PWAContext.Provider value={value}>{children}</PWAContext.Provider>;
};

export const usePWA = () => {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error('usePWA must be used within a PWAProvider');
  }
  return context;
};

export default PWAContext;
