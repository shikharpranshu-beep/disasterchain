import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Geolocation } from '@capacitor/geolocation';
import { Network } from '@capacitor/network';
import { Share } from '@capacitor/share';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

export const isNativePlatform = () => {
  return typeof window !== 'undefined' && (Capacitor.isNativePlatform() || Boolean(window.Capacitor?.isNativePlatform?.()));
};

/**
 * Native Geolocation coordinates getter
 */
const getNativeCoordinates = async (options = { enableHighAccuracy: true, timeout: 10000 }) => {
  if (isNativePlatform()) {
    try {
      const check = await Geolocation.checkPermissions();
      if (check.location !== 'granted') {
        const req = await Geolocation.requestPermissions({ permissions: ['location'] });
        if (req.location !== 'granted') {
          throw new Error('Location permission denied by user');
        }
      }
      const pos = await Geolocation.getCurrentPosition({
        enableHighAccuracy: options.enableHighAccuracy ?? true,
        timeout: options.timeout ?? 10000,
        maximumAge: 5000,
      });
      return {
        coords: {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          altitude: pos.coords.altitude,
          altitudeAccuracy: pos.coords.altitudeAccuracy,
          heading: pos.coords.heading,
          speed: pos.coords.speed,
        },
        timestamp: pos.timestamp,
      };
    } catch (nativeErr) {
      console.warn('[NativeService] Capacitor geolocation error:', nativeErr);
      throw nativeErr;
    }
  }

  // Fallback to Web Geolocation API
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported by device'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos),
      (err) => reject(err),
      options
    );
  });
};

/**
 * Universal getCurrentPosition supporting both callback and Promise forms
 */
export const getCurrentPosition = (successOrOptions, maybeError, maybeOptions) => {
  if (typeof successOrOptions === 'function') {
    const success = successOrOptions;
    const error = typeof maybeError === 'function' ? maybeError : () => {};
    const options = maybeOptions || {};
    getNativeCoordinates(options)
      .then((pos) => success(pos))
      .catch((err) => error(err));
    return;
  }
  return getNativeCoordinates(successOrOptions);
};

/**
 * Polyfill native geolocation inside Capacitor WebView
 */
export const polyfillNativeGeolocation = () => {
  if (isNativePlatform() && typeof navigator !== 'undefined' && navigator.geolocation) {
    const origGetCurrentPosition = navigator.geolocation.getCurrentPosition.bind(navigator.geolocation);
    navigator.geolocation.getCurrentPosition = (success, error, options) => {
      getCurrentPosition(
        success,
        (err) => {
          // If native plugin failed, fallback to original
          if (origGetCurrentPosition) {
            origGetCurrentPosition(success, error, options);
          } else if (error) {
            error(err);
          }
        },
        options
      );
    };
  }
};

/**
 * Initialize native system UI (status bar, splash screen, geolocation polyfill)
 */
export const initNativeApp = async () => {
  if (!isNativePlatform()) return;

  // Polyfill geolocation to ensure runtime permissions prompt
  polyfillNativeGeolocation();

  try {
    // Configure Warm Crisis Command dark status bar
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#120B08' });
  } catch (err) {
    console.warn('[NativeService] StatusBar init error:', err);
  }

  try {
    // Hide splash screen smoothly after app is ready
    await SplashScreen.hide({ fadeOutDuration: 350 });
  } catch (err) {
    console.warn('[NativeService] SplashScreen hide error:', err);
  }
};

/**
 * Native emergency dialer action (invokes phone dialer explicitly on user tap, never auto-calling)
 */
export const openPhoneDialer = (phoneNumber = '112') => {
  if (typeof window === 'undefined') return;
  const cleanNumber = phoneNumber.replace(/[^0-9+]/g, '');
  window.location.href = `tel:${cleanNumber}`;
};

/**
 * Native emergency SMS composer action (invokes SMS client explicitly on user tap)
 */
export const openSmsComposer = (phoneNumber = '112', message = '') => {
  if (typeof window === 'undefined') return;
  const cleanNumber = phoneNumber.replace(/[^0-9+]/g, '');
  const encodedBody = encodeURIComponent(message);
  window.location.href = `sms:${cleanNumber}?body=${encodedBody}`;
};

/**
 * Native sharing
 */
export const shareEmergencyInfo = async ({ title, text, url }) => {
  if (isNativePlatform()) {
    try {
      await Share.share({
        title: title || 'DisasterChain Emergency Alert',
        text: text || '',
        url: url || 'https://disasterchain.vercel.app',
        dialogTitle: 'Share DisasterChain Emergency Info',
      });
      return true;
    } catch (err) {
      console.warn('[NativeService] Native share failed:', err);
    }
  }

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return true;
    } catch (e) {
      // User cancelled or not supported
    }
  }

  // Clipboard fallback
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(`${title}\n${text}\n${url || ''}`);
      return true;
    } catch {}
  }
  return false;
};

/**
 * Listen to network status changes
 */
export const watchNetworkStatus = (callback) => {
  if (isNativePlatform()) {
    let handle = null;
    Network.addListener('networkStatusChange', (status) => {
      callback({
        connected: status.connected,
        connectionType: status.connectionType,
      });
    }).then((h) => {
      handle = h;
    });

    Network.getStatus().then((status) => {
      callback({
        connected: status.connected,
        connectionType: status.connectionType,
      });
    });

    return () => {
      if (handle && handle.remove) handle.remove();
    };
  }

  // Web fallback
  const onOnline = () => callback({ connected: true, connectionType: 'wifi' });
  const onOffline = () => callback({ connected: false, connectionType: 'none' });
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);
  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
};

/**
 * Register hardware Back Button listener with priority hierarchy:
 * 1. If Drawer is open -> close drawer
 * 2. If AI Assistant is open -> close AI
 * 3. If Modal is open -> close modal
 * 4. Otherwise -> navigate back in router history
 * 5. Do NOT immediately exit app unless at root with no history
 */
export const registerBackButtonHandler = ({
  isDrawerOpen,
  closeDrawer,
  isAiOpen,
  closeAi,
  isModalOpen,
  closeModal,
  navigateBack,
  canGoBack,
}) => {
  if (!isNativePlatform()) return () => {};

  const listenerPromise = App.addListener('backButton', (data) => {
    // 1. Check if drawer is open
    if (isDrawerOpen()) {
      closeDrawer();
      return;
    }

    // 2. Check if AI assistant is open
    if (isAiOpen()) {
      closeAi();
      return;
    }

    // 3. Check if modal is open
    if (isModalOpen()) {
      closeModal();
      return;
    }

    // 4. Navigate back in history if possible
    if (canGoBack()) {
      navigateBack();
      return;
    }

    // 5. Exit only if explicitly at the root and user presses back
    if (data.canGoBack) {
      window.history.back();
    } else {
      App.exitApp();
    }
  });

  return () => {
    listenerPromise.then((handle) => handle.remove());
  };
};
