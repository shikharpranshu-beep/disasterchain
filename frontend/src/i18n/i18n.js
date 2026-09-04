import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  getLanguageConfig,
  isValidLanguageCode,
  RTL_LANGUAGES,
} from './languageConfig';

// Import all 20 locale dictionaries
import en from './locales/en.json';
import hi from './locales/hi.json';
import bn from './locales/bn.json';
import te from './locales/te.json';
import mr from './locales/mr.json';
import ta from './locales/ta.json';
import gu from './locales/gu.json';
import kn from './locales/kn.json';
import ml from './locales/ml.json';
import pa from './locales/pa.json';
import or from './locales/or.json';
import as from './locales/as.json';
import ur from './locales/ur.json';
import sa from './locales/sa.json';
import ne from './locales/ne.json';
import kok from './locales/kok.json';
import ks from './locales/ks.json';
import mai from './locales/mai.json';
import sd from './locales/sd.json';
import mni from './locales/mni.json';

const LOCALES = {
  en,
  hi,
  bn,
  te,
  mr,
  ta,
  gu,
  kn,
  ml,
  pa,
  or,
  as,
  ur,
  sa,
  ne,
  kok,
  ks,
  mai,
  sd,
  mni,
};

// Set of warned missing keys to avoid spamming console
const warnedKeys = new Set();

/**
 * Resolves a nested key string like 'nav.emergencySos' in an object
 */
function resolveNestedKey(obj, keyPath) {
  if (!obj || typeof obj !== 'object') return undefined;
  const segments = keyPath.split('.');
  let current = obj;
  for (const seg of segments) {
    if (current && typeof current === 'object' && seg in current) {
      current = current[seg];
    } else {
      return undefined;
    }
  }
  return typeof current === 'string' ? current : undefined;
}

/**
 * Standalone translation resolver with English fallback and parameter replacement
 */
export function translate(key, language = DEFAULT_LANGUAGE, paramsOrFallback = null, explicitFallback = null) {
  if (!key || typeof key !== 'string') return '';

  let params = null;
  let fallback = explicitFallback;

  if (paramsOrFallback && typeof paramsOrFallback === 'object') {
    params = paramsOrFallback;
  } else if (typeof paramsOrFallback === 'string') {
    fallback = paramsOrFallback;
  }

  const activeLocale = LOCALES[language] || LOCALES[DEFAULT_LANGUAGE];
  const fallbackLocale = LOCALES[DEFAULT_LANGUAGE];

  // 1. Try active language
  let result = resolveNestedKey(activeLocale, key);

  // 2. Fall back to English if missing
  if (result === undefined && activeLocale !== fallbackLocale) {
    result = resolveNestedKey(fallbackLocale, key);
  }

  // 3. Fall back to explicit default text or the key itself
  if (result === undefined) {
    if (process.env.NODE_ENV === 'development' && !warnedKeys.has(key)) {
      warnedKeys.add(key);
      console.warn(`[i18n] Missing translation for key: "${key}" in language: "${language}"`);
    }
    result = fallback || key;
  }

  // 4. Parameter substitution for {param} or {{param}}
  if (params && typeof params === 'object') {
    result = result.replace(/\{\{\s*(\w+)\s*\}\}|\{\s*(\w+)\s*\}/g, (match, p1, p2) => {
      const paramName = p1 || p2;
      return params[paramName] !== undefined ? String(params[paramName]) : match;
    });
  }

  return result;
}

export const LanguageContext = createContext(null);

/**
 * Determines initial language on application boot
 */
function getInitialLanguage() {
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved && isValidLanguageCode(saved)) {
      return saved;
    }

    if (typeof navigator !== 'undefined' && navigator.language) {
      const browserCode = navigator.language.split('-')[0].toLowerCase();
      if (isValidLanguageCode(browserCode)) {
        return browserCode;
      }
    }
  } catch {
    // Ignore storage errors
  }
  return DEFAULT_LANGUAGE;
}

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguageState] = useState(getInitialLanguage);

  const languageConfig = useMemo(() => getLanguageConfig(currentLanguage), [currentLanguage]);
  const isRtl = useMemo(() => RTL_LANGUAGES.includes(currentLanguage), [currentLanguage]);

  // Synchronize document attributes (lang, dir) on language change
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = currentLanguage;
      document.documentElement.dir = isRtl ? 'rtl' : 'ltr';

      // Set CSS custom property for language font family if present
      if (languageConfig?.fontFamily && languageConfig.fontFamily !== 'inherit') {
        document.documentElement.style.setProperty('--font-i18n', languageConfig.fontFamily);
      } else {
        document.documentElement.style.removeProperty('--font-i18n');
      }
    }
  }, [currentLanguage, isRtl, languageConfig]);

  const setLanguage = useCallback((code) => {
    if (!isValidLanguageCode(code)) {
      console.warn(`[i18n] Rejected invalid language code: ${code}. Falling back to English.`);
      code = DEFAULT_LANGUAGE;
    }

    setCurrentLanguageState(code);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
    } catch (e) {
      console.warn('[i18n] Failed to persist language to localStorage:', e);
    }
  }, []);

  const t = useCallback(
    (key, paramsOrFallback = null, explicitFallback = null) => {
      return translate(key, currentLanguage, paramsOrFallback, explicitFallback);
    },
    [currentLanguage]
  );

  // Safe formatting helpers using Intl
  const formatNumber = useCallback(
    (num, options = {}) => {
      if (num == null || isNaN(Number(num))) return '';
      try {
        return new Intl.NumberFormat(currentLanguage, options).format(num);
      } catch {
        return String(num);
      }
    },
    [currentLanguage]
  );

  const formatDate = useCallback(
    (date, options = {}) => {
      if (!date) return '';
      try {
        const d = date instanceof Date ? date : new Date(date);
        return new Intl.DateTimeFormat(currentLanguage, options).format(d);
      } catch {
        return String(date);
      }
    },
    [currentLanguage]
  );

  const contextValue = useMemo(
    () => ({
      currentLanguage,
      setLanguage,
      languageConfig,
      isRtl,
      languages: SUPPORTED_LANGUAGES,
      t,
      formatNumber,
      formatDate,
    }),
    [currentLanguage, setLanguage, languageConfig, isRtl, t, formatNumber, formatDate]
  );

  return <LanguageContext.Provider value={contextValue}>{children}</LanguageContext.Provider>;
};

/**
 * Hook for consuming translations in any functional component
 */
export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    // Safe fallback if used outside LanguageProvider
    return {
      t: (key, p, fallback) => translate(key, DEFAULT_LANGUAGE, p, fallback),
      currentLanguage: DEFAULT_LANGUAGE,
      setLanguage: () => {},
      languageConfig: getLanguageConfig(DEFAULT_LANGUAGE),
      isRtl: false,
      languages: SUPPORTED_LANGUAGES,
      formatNumber: (n) => String(n),
      formatDate: (d) => String(d),
    };
  }
  return context;
};

export default {
  LanguageProvider,
  useTranslation,
  translate,
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
};
