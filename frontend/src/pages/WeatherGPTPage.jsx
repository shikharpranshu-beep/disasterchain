import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from '../i18n/i18n';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/Icons';
import { sendWeatherGPTChat } from '../services/api';
import {
  fetchCompleteWeather,
  searchLocations,
  reverseGeocode,
} from '../services/weatherApi';
import { getWeatherCondition, getAqiDetails } from '../utils/weatherUtils';

/**
 * Clean Formatter for Structured Weather Intelligence
 */
const WeatherMessageContent = ({ content, isRtl }) => {
  if (!content) return null;

  const lines = content.split('\n');

  return (
    <div
      className={`weather-gpt-rendered-msg ${isRtl ? 'rtl-direction' : ''}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.45rem',
        fontSize: '0.92rem',
        lineHeight: 1.55,
        textAlign: isRtl ? 'right' : 'left',
        direction: isRtl ? 'rtl' : 'ltr',
      }}
    >
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} style={{ height: '0.2rem' }} />;

        // Risk Banners
        if (trimmed.startsWith('⚠️ HIGH RISK') || trimmed.startsWith('🚨 LIFE-SAFETY ALERT') || trimmed.startsWith('⚠️ ACTIVE CYCLONE')) {
          return (
            <div
              key={idx}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'rgba(239, 68, 68, 0.15)',
                borderLeft: '4px solid #ef4444',
                color: '#f87171',
                padding: '0.35rem 0.65rem',
                borderRadius: '4px',
                fontWeight: 800,
                fontSize: '0.92rem',
                letterSpacing: '0.02em',
                margin: '0.2rem 0',
              }}
            >
              {trimmed}
            </div>
          );
        }

        if (trimmed.startsWith('✓ SAFE / NORMAL')) {
          return (
            <div
              key={idx}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'rgba(16, 185, 129, 0.15)',
                borderLeft: '4px solid #10b981',
                color: '#34d399',
                padding: '0.35rem 0.65rem',
                borderRadius: '4px',
                fontWeight: 800,
                fontSize: '0.92rem',
                margin: '0.2rem 0',
              }}
            >
              {trimmed}
            </div>
          );
        }

        // Section Headers
        if (trimmed.startsWith('📍') || trimmed.startsWith('📊') || trimmed.startsWith('⏱️') || trimmed.startsWith('📅') || trimmed.startsWith('🌧️') || trimmed.startsWith('🌫️')) {
          return (
            <div
              key={idx}
              style={{
                color: '#ff6b2c',
                fontWeight: 800,
                fontSize: '0.96rem',
                marginTop: '0.3rem',
              }}
            >
              {trimmed}
            </div>
          );
        }

        // What is happening / What it means / What to do labels
        if (
          trimmed.startsWith('What is happening:') ||
          trimmed.startsWith('What it means:') ||
          trimmed.startsWith('What to do:') ||
          trimmed.startsWith('Emergency:') ||
          trimmed.startsWith('Data Trust:')
        ) {
          return (
            <div
              key={idx}
              style={{
                color: trimmed.startsWith('Emergency:') ? '#f87171' : '#94a3b8',
                fontWeight: 700,
                fontSize: '0.84rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginTop: '0.25rem',
              }}
            >
              {trimmed}
            </div>
          );
        }

        // Bullet / Numbered lists
        const isBullet = trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*');
        const isNumbered = /^[0-9]+\.\s+/.test(trimmed);

        const cleanText = isBullet
          ? trimmed.replace(/^[•\-*]\s*/, '')
          : isNumbered
            ? trimmed
            : trimmed;

        // Render bold markers
        const parts = cleanText.split(/(\*\*.*?\*\*)/g);
        const rendered = parts.map((part, pIdx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong key={pIdx} style={{ color: '#ffffff', fontWeight: 800 }}>
                {part.slice(2, -2)}
              </strong>
            );
          }
          return part;
        });

        if (isBullet) {
          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.4rem',
                paddingLeft: isRtl ? 0 : '0.4rem',
                paddingRight: isRtl ? '0.4rem' : 0,
              }}
            >
              <span style={{ color: '#ff6b2c', fontWeight: 800 }}>•</span>
              <span>{rendered}</span>
            </div>
          );
        }

        return <div key={idx}>{rendered}</div>;
      })}
    </div>
  );
};

export default function WeatherGPTPage() {
  const { t, currentLanguage } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Active Location & Telemetry state
  const [activeLocation, setActiveLocation] = useState(() => {
    // Check if state was passed via React Router navigation (e.g. from Weather page)
    if (location.state?.location) {
      return location.state.location;
    }
    return {
      name: 'New Delhi, India',
      latitude: 28.6139,
      longitude: 77.2090,
    };
  });

  const [liveTelemetry, setLiveTelemetry] = useState(null);
  const [feedStatus, setFeedStatus] = useState('LIVE'); // 'LIVE' | 'PARTIAL_LIVE' | 'CACHED' | 'UNAVAILABLE'
  const [isLocating, setIsLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showLocationSearch, setShowLocationSearch] = useState(false);

  // Conversational state
  const [conversationId] = useState(() => `wgpt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);
  const [messages, setMessages] = useState(() => [
    {
      id: 'welcome',
      role: 'assistant',
      content: `${t('weatherGpt.welcomeTitle', 'WeatherGPT')}\n${t('weatherGpt.welcomeSubtitle', 'Your conversational weather and disaster intelligence assistant.')}\n\nAsk me about current weather, upcoming rain, air quality, wind squalls, active cyclones, or flood risks.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      dataTrust: 'VERIFIED GUIDANCE',
    },
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sosConfirmOpen, setSosConfirmOpen] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const isRtl = ['ur', 'sd', 'ks'].includes(currentLanguage);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Load telemetry for active location
  const refreshTelemetry = useCallback(async (lat, lon, placeName) => {
    try {
      const data = await fetchCompleteWeather(lat, lon);
      if (data && data.current) {
        setLiveTelemetry({
          name: placeName || `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`,
          temperature: Math.round(data.current.temperature),
          condition: getWeatherCondition(data.current.weatherCode).label,
          icon: getWeatherCondition(data.current.weatherCode).icon,
          windSpeed: Math.round(data.current.windSpeed || 0),
          windGusts: Math.round(data.current.windGusts || 0),
          humidity: data.current.relativeHumidity,
          aqi: data.airQuality?.europeanAqi || null,
          aqiLabel: data.airQuality?.severity || 'UNKNOWN',
          precipitation: data.current.precipitation || 0,
        });

        if (data.isCached) {
          setFeedStatus('CACHED');
        } else {
          setFeedStatus(data.feedStatus || 'LIVE');
        }
      } else {
        setFeedStatus('UNAVAILABLE');
      }
    } catch (err) {
      setFeedStatus('UNAVAILABLE');
    }
  }, []);

  // Initial load
  useEffect(() => {
    refreshTelemetry(activeLocation.latitude, activeLocation.longitude, activeLocation.name);
  }, [activeLocation, refreshTelemetry]);

  // Handle Device GPS Geolocation
  const handleLocateMe = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(4));
        const lon = Number(pos.coords.longitude.toFixed(4));
        try {
          const rev = await reverseGeocode(lat, lon);
          const name = rev?.displayName || rev?.city || `${lat}°, ${lon}°`;
          const newLoc = { name, latitude: lat, longitude: lon };
          setActiveLocation(newLoc);
          refreshTelemetry(lat, lon, name);
          // Post contextual message
          sendMessage(`What is the weather right now at my location in ${name}?`, newLoc);
        } catch (e) {
          const newLoc = { name: `${lat}°, ${lon}°`, latitude: lat, longitude: lon };
          setActiveLocation(newLoc);
          refreshTelemetry(lat, lon, newLoc.name);
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        console.warn('Geolocation denied or failed:', err.message);
        setShowLocationSearch(true);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Location search handler
  const handleSearchSubmit = async (e) => {
    e?.preventDefault();
    if (!searchQuery || searchQuery.trim().length < 2) return;

    setIsSearching(true);
    try {
      const results = await searchLocations(searchQuery.trim());
      setSearchResults(results || []);
    } catch (e) {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const selectSearchResult = (item) => {
    const name = `${item.name}${item.admin1 ? `, ${item.admin1}` : ''}${item.country ? `, ${item.country}` : ''}`;
    const newLoc = {
      name,
      latitude: item.latitude,
      longitude: item.longitude,
    };
    setActiveLocation(newLoc);
    refreshTelemetry(item.latitude, item.longitude, name);
    setShowLocationSearch(false);
    setSearchQuery('');
    setSearchResults([]);

    // Query weather for newly selected location
    sendMessage(`What is the weather in ${item.name}?`, newLoc);
  };

  // Send message to WeatherGPT backend
  const sendMessage = async (textToSend, locationOverride = null) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const loc = locationOverride || activeLocation;

    const userMsg = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const res = await sendWeatherGPTChat({
        message: text,
        latitude: loc.latitude,
        longitude: loc.longitude,
        location: loc.name,
        language: currentLanguage,
        conversationId,
      });

      if (res.success && res.data) {
        const d = res.data;

        // If locationOverride was explicitly passed (e.g. from location search or locate me), update activeLocation
        if (locationOverride) {
          setActiveLocation(locationOverride);
          if (d.telemetry && d.telemetry.temperature != null) {
            setLiveTelemetry((prev) => ({
              ...prev,
              name: locationOverride.name,
              temperature: d.telemetry.temperature,
              condition: d.telemetry.condition || 'Clear',
              windSpeed: d.telemetry.windSpeed || 0,
              windGusts: d.telemetry.windGusts || 0,
              humidity: d.telemetry.humidity,
              aqi: d.telemetry.aqi,
              aqiLabel: d.telemetry.aqiSeverity,
              precipitation: d.telemetry.precipitation,
            }));
          }
        } else if (d.location?.latitude && d.location?.longitude) {
          // If the reply corresponds to the user's active location, keep live telemetry card fresh
          const isSameLoc = Math.abs(d.location.latitude - loc.latitude) < 0.1 && Math.abs(d.location.longitude - loc.longitude) < 0.1;
          if (isSameLoc && d.telemetry && d.telemetry.temperature != null) {
            setLiveTelemetry((prev) => ({
              ...prev,
              name: d.location.name || prev.name,
              temperature: d.telemetry.temperature,
              condition: d.telemetry.condition || 'Clear',
              windSpeed: d.telemetry.windSpeed || 0,
              windGusts: d.telemetry.windGusts || 0,
              humidity: d.telemetry.humidity,
              aqi: d.telemetry.aqi,
              aqiLabel: d.telemetry.aqiSeverity,
              precipitation: d.telemetry.precipitation,
            }));
          }
        }

        if (d.feedStatus) {
          setFeedStatus(d.feedStatus);
        }

        const botMsg = {
          id: `bot_${Date.now()}`,
          role: 'assistant',
          content: d.reply,
          riskLevel: d.riskLevel,
          isEmergency: d.isEmergency,
          actions: d.actions || [],
          dataTrust: d.dataTrust || 'LIVE TELEMETRY',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages((prev) => [...prev, botMsg]);
      } else {
        throw new Error(res.message || 'WeatherGPT response error');
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'assistant',
          content: 'Weather data is temporarily unavailable. Please try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          dataTrust: 'ERROR',
        },
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  // Quick Action questions
  const quickQuestions = [
    { label: `🌡️ ${t('weatherGpt.currentWeather', 'Current Weather')}`, query: `What is the weather right now in ${activeLocation.name}?` },
    { label: `🌧️ ${t('weatherGpt.rainForecast', 'Rain Forecast')}`, query: `Will it rain today in ${activeLocation.name}? Should I carry an umbrella?` },
    { label: `🌪️ ${t('weatherGpt.severeWeather', 'Severe Weather')}`, query: `Is there any severe weather, cyclone, or flood risk in ${activeLocation.name}?` },
    { label: `🌫️ ${t('weatherGpt.airQuality', 'Air Quality')}`, query: `How is the air quality (AQI) and PM2.5 in ${activeLocation.name}?` },
    { label: `📍 ${t('weatherGpt.myLocation', 'My Location')}`, action: handleLocateMe },
    { label: `🗺️ ${t('weatherGpt.weatherMap', 'Weather Map')}`, action: () => navigate('/weather', { state: { center: [activeLocation.latitude, activeLocation.longitude] } }) },
  ];

  // Derive atmospheric risk status for live card
  const aqiDetails = liveTelemetry?.aqi != null ? getAqiDetails(liveTelemetry.aqi) : null;
  const isDangerous = (liveTelemetry?.windSpeed >= 50) || (liveTelemetry?.precipitation >= 15) || (liveTelemetry?.aqi >= 80);

  return (
    <div
      className="weather-gpt-page-root"
      style={{
        minHeight: 'calc(100vh - 120px)',
        background: '#0d0a08',
        color: '#f8fafc',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* 1. Header Section */}
      <div
        className="weather-gpt-header"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          marginBottom: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(255, 107, 44, 0.2), rgba(56, 189, 248, 0.2))',
              border: '1px solid rgba(255, 107, 44, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.6rem',
            }}
          >
            🌦️
          </div>
          <div>
            <h1
              style={{
                fontSize: '1.35rem',
                fontWeight: 800,
                color: '#ffffff',
                margin: 0,
                letterSpacing: '0.02em',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              WeatherGPT
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  padding: '0.15rem 0.45rem',
                  borderRadius: '9999px',
                }}
              >
                INTELLIGENCE
              </span>
            </h1>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: 0, marginTop: '2px' }}>
              {t('weatherGpt.subtitle', 'Ask about weather, forecasts, air quality, and severe conditions.')}
            </p>
          </div>
        </div>

        {/* Action Controls (Location Switcher & Weather Map Button) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setShowLocationSearch((prev) => !prev)}
            style={{
              minHeight: '44px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#f1f5f9',
              fontSize: '0.85rem',
              padding: '0.5rem 0.85rem',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
            aria-label="Change active location"
          >
            <span>📍</span>
            <span style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {activeLocation.name}
            </span>
            <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>▼</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleLocateMe}
            disabled={isLocating}
            style={{
              minHeight: '44px',
              minWidth: '44px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              cursor: isLocating ? 'wait' : 'pointer',
            }}
            title="Use current device GPS location"
            aria-label="Use current device GPS location"
          >
            <span style={{ fontSize: '1.1rem' }}>{isLocating ? '⏳' : '🎯'}</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => navigate('/weather', { state: { center: [activeLocation.latitude, activeLocation.longitude] } })}
            style={{
              minHeight: '44px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#38bdf8',
              fontSize: '0.85rem',
              padding: '0.5rem 0.85rem',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 700,
            }}
            aria-label="Open 2D Weather Map"
          >
            <span>🗺️</span>
            <span>{t('weatherGpt.weatherMap', 'Weather Map')}</span>
          </button>
        </div>
      </div>

      {/* Location Search Dropdown (if toggled) */}
      {showLocationSearch && (
        <div
          className="location-search-popover"
          style={{
            background: '#15100c',
            border: '1px solid rgba(255, 107, 44, 0.3)',
            borderRadius: '10px',
            padding: '1rem',
            marginBottom: '1rem',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
          }}
        >
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              placeholder="Search city, district, or region..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                minHeight: '44px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                color: '#fff',
                padding: '0.5rem 0.85rem',
                fontSize: '0.9rem',
              }}
              autoFocus
            />
            <button
              type="submit"
              disabled={isSearching}
              style={{
                minHeight: '44px',
                minWidth: '80px',
                background: '#ff6b2c',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </form>

          {searchResults.length > 0 && (
            <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: '180px', overflowY: 'auto' }}>
              {searchResults.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => selectSearchResult(r)}
                  style={{
                    minHeight: '44px',
                    textAlign: 'left',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '6px',
                    padding: '0.5rem 0.75rem',
                    color: '#f1f5f9',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{r.name}, {r.admin1 || ''} {r.country || ''}</span>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{r.latitude.toFixed(2)}°, {r.longitude.toFixed(2)}°</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. Main Layout: Desktop (2-Column) vs Mobile (Single Column) */}
      <div
        className="weather-gpt-main-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(280px, 320px)',
          gap: '1.25rem',
          flex: 1,
          alignItems: 'start',
        }}
      >
        {/* Left Column: Conversational Stream */}
        <div
          className="weather-gpt-chat-container"
          style={{
            background: '#15100c',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            height: '75vh',
            minHeight: '480px',
            overflow: 'hidden',
          }}
        >
          {/* Quick Suggestions Chips */}
          <div
            className="weather-gpt-quick-chips"
            style={{
              display: 'flex',
              gap: '0.5rem',
              padding: '0.75rem',
              background: 'rgba(0, 0, 0, 0.25)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              overflowX: 'auto',
              whiteSpace: 'nowrap',
              scrollbarWidth: 'none',
              touchAction: 'pan-x',
            }}
          >
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                type="button"
                className="weather-gpt-chip"
                onClick={() => {
                  if (q.action) {
                    q.action();
                  } else {
                    sendMessage(q.query);
                  }
                }}
                disabled={isLoading}
                style={{
                  minHeight: '44px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.4rem 0.85rem',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '9999px',
                  color: '#f1f5f9',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                }}
              >
                {q.label}
              </button>
            ))}
          </div>

          {/* Messages Stream */}
          <div
            className="weather-gpt-messages"
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`weather-gpt-msg-wrapper ${isUser ? 'msg-user' : 'msg-assistant'}`}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isUser ? (isRtl ? 'flex-start' : 'flex-end') : (isRtl ? 'flex-end' : 'flex-start'),
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      marginBottom: '0.25rem',
                      fontSize: '0.72rem',
                      color: '#94a3b8',
                      fontWeight: 700,
                    }}
                  >
                    <span>{isUser ? 'You' : 'WeatherGPT'}</span>
                    {msg.dataTrust && !isUser && (
                      <span
                        style={{
                          fontSize: '0.65rem',
                          padding: '0.1rem 0.35rem',
                          borderRadius: '4px',
                          background:
                            msg.dataTrust === 'LIVE TELEMETRY'
                              ? 'rgba(16, 185, 129, 0.15)'
                              : msg.dataTrust === 'AI INTERPRETATION'
                                ? 'rgba(56, 189, 248, 0.15)'
                                : 'rgba(255, 255, 255, 0.08)',
                          color:
                            msg.dataTrust === 'LIVE TELEMETRY'
                              ? '#34d399'
                              : msg.dataTrust === 'AI INTERPRETATION'
                                ? '#38bdf8'
                                : '#94a3b8',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          fontWeight: 800,
                        }}
                      >
                        {msg.dataTrust}
                      </span>
                    )}
                    <span>• {msg.timestamp}</span>
                  </div>

                  <div
                    className="weather-gpt-bubble"
                    style={{
                      maxWidth: '88%',
                      background: isUser
                        ? '#ff6b2c'
                        : 'rgba(255, 255, 255, 0.04)',
                      color: isUser ? '#ffffff' : '#f1f5f9',
                      padding: '0.85rem 1.1rem',
                      borderRadius: isUser ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                      border: isUser
                        ? '1px solid #ff7a42'
                        : '1px solid rgba(255, 255, 255, 0.08)',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
                    }}
                  >
                    {isUser ? (
                      <div style={{ fontSize: '0.92rem', lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>
                        {msg.content}
                      </div>
                    ) : (
                      <WeatherMessageContent content={msg.content} isRtl={isRtl} />
                    )}

                    {/* Interactive Action Buttons */}
                    {msg.actions && msg.actions.length > 0 && (
                      <div
                        style={{
                          marginTop: '0.85rem',
                          paddingTop: '0.65rem',
                          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '0.45rem',
                        }}
                      >
                        {msg.actions.map((act, aIdx) => (
                          <button
                            key={aIdx}
                            type="button"
                            onClick={() => {
                              if (act.actionType === 'SOS_MODAL') {
                                setSosConfirmOpen(true);
                              } else if (act.link) {
                                navigate(act.link, { state: { center: [activeLocation.latitude, activeLocation.longitude] } });
                              } else if (act.query) {
                                sendMessage(act.query);
                              } else if (act.actionType === 'LOCATE_DEVICE') {
                                handleLocateMe();
                              }
                            }}
                            style={{
                              minHeight: '44px',
                              padding: '0.4rem 0.8rem',
                              borderRadius: '6px',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              background: act.isCritical
                                ? '#ef4444'
                                : 'rgba(255, 107, 44, 0.15)',
                              color: act.isCritical ? '#ffffff' : '#ff6b2c',
                              border: act.isCritical
                                ? '1px solid #f87171'
                                : '1px solid rgba(255, 107, 44, 0.35)',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                            }}
                          >
                            {act.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ff6b2c', fontSize: '0.85rem', padding: '0.5rem' }}>
                <span className="live-beacon-pulse" style={{ width: '8px', height: '8px' }} />
                <span>WeatherGPT is analyzing atmospheric telemetry...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <div
            className="weather-gpt-input-bar"
            style={{
              padding: '0.75rem 1rem',
              background: 'rgba(0, 0, 0, 0.4)',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={t('weatherGpt.askPlaceholder', 'Ask WeatherGPT about weather, rain, cyclones, AQI...')}
                disabled={isLoading}
                style={{
                  flex: 1,
                  minHeight: '44px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '10px',
                  color: '#ffffff',
                  padding: '0.6rem 1rem',
                  fontSize: '0.92rem',
                  outline: 'none',
                }}
                dir={isRtl ? 'rtl' : 'ltr'}
              />

              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                style={{
                  minHeight: '44px',
                  minWidth: '56px',
                  background: inputMessage.trim() && !isLoading ? '#ff6b2c' : 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: inputMessage.trim() && !isLoading ? 'pointer' : 'not-allowed',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  fontWeight: 700,
                  transition: 'background 0.15s ease',
                }}
                aria-label="Send message"
              >
                <span>➤</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Compact Live Weather Context Card (Sticky) */}
        <div
          className="weather-gpt-telemetry-sidebar"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            position: 'sticky',
            top: '1rem',
          }}
        >
          <div
            className="weather-gpt-telemetry-card"
            style={{
              background: '#15100c',
              border: isDangerous ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
              borderTop: isDangerous ? '4px solid #ef4444' : '4px solid #38bdf8',
              borderRadius: '12px',
              padding: '1.25rem',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
            }}
          >
            {/* Header / Feed status */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {t('weatherGpt.currentLocation', 'CURRENT LOCATION')}
              </div>

              {/* Status Badge */}
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  padding: '0.15rem 0.45rem',
                  borderRadius: '4px',
                  background:
                    feedStatus === 'LIVE'
                      ? 'rgba(16, 185, 129, 0.15)'
                      : feedStatus === 'PARTIAL_LIVE'
                        ? 'rgba(56, 189, 248, 0.15)'
                        : feedStatus === 'CACHED'
                          ? 'rgba(245, 158, 11, 0.15)'
                          : 'rgba(239, 68, 68, 0.15)',
                  color:
                    feedStatus === 'LIVE'
                      ? '#34d399'
                      : feedStatus === 'PARTIAL_LIVE'
                        ? '#38bdf8'
                        : feedStatus === 'CACHED'
                          ? '#fbbf24'
                          : '#f87171',
                  border: '1px solid currentColor',
                }}
              >
                {feedStatus}
              </span>
            </div>

            {/* Location Title */}
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>📍</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {activeLocation.name}
              </span>
            </div>

            {/* Metrics Breakdown */}
            {liveTelemetry ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '2rem', fontWeight: 900, color: '#ffffff' }}>
                    {liveTelemetry.temperature != null ? `${liveTelemetry.temperature}°C` : 'N/A'}
                  </span>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.4rem' }}>{liveTelemetry.icon || '🌤️'}</div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{liveTelemetry.condition}</div>
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.5rem',
                    padding: '0.65rem 0',
                    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                    fontSize: '0.82rem',
                  }}
                >
                  <div>
                    <span style={{ color: '#94a3b8' }}>Wind: </span>
                    <strong style={{ color: '#ffffff' }}>{liveTelemetry.windSpeed} km/h</strong>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8' }}>Rain: </span>
                    <strong style={{ color: '#ffffff' }}>{liveTelemetry.precipitation || 0} mm</strong>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8' }}>AQI: </span>
                    <strong style={{ color: aqiDetails?.color || '#38bdf8' }}>
                      {liveTelemetry.aqi != null ? liveTelemetry.aqi : 'Normal'}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8' }}>Risk: </span>
                    <strong style={{ color: isDangerous ? '#ef4444' : '#10b981' }}>
                      {isDangerous ? 'HIGH' : 'LOW'}
                    </strong>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => navigate('/weather', { state: { center: [activeLocation.latitude, activeLocation.longitude] } })}
                  style={{
                    width: '100%',
                    minHeight: '44px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#ffffff',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    marginTop: '0.25rem',
                  }}
                >
                  <span>🗺️</span>
                  <span>{t('weatherGpt.viewOnMap', 'VIEW ON MAP')}</span>
                </button>
              </div>
            ) : (
              <div style={{ padding: '1rem 0', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                Calibrating weather sensors...
              </div>
            )}
          </div>

          {/* Emergency Lifeline Card */}
          <div
            style={{
              background: '#15100c',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '1rem',
              fontSize: '0.82rem',
              color: '#94a3b8',
              lineHeight: 1.45,
            }}
          >
            <div style={{ color: '#ef4444', fontWeight: 800, marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span>🚨</span>
              <span>EMERGENCY PROTOCOL</span>
            </div>
            <div>
              In case of life-threatening flooding, collapsed structures, or immediate danger:
            </div>
            <div style={{ marginTop: '0.5rem', fontWeight: 800, color: '#ffffff', fontSize: '0.95rem' }}>
              Call 112
            </div>
            <div style={{ marginTop: '0.5rem', fontSize: '0.74rem', opacity: 0.8 }}>
              WeatherGPT will never auto-submit an SOS without explicit user confirmation.
            </div>
          </div>
        </div>
      </div>

      {/* Explicit SOS Confirmation Dialog (Safety Protected) */}
      {sosConfirmOpen && (
        <div
          className="modal-backdrop"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            className="modal-card"
            style={{
              background: '#15100c',
              border: '2px solid #ef4444',
              borderRadius: '14px',
              maxWidth: '460px',
              width: '100%',
              padding: '1.5rem',
              boxShadow: '0 0 32px rgba(239, 68, 68, 0.4)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', fontWeight: 800, fontSize: '1.2rem', marginBottom: '0.75rem' }}>
              <span>🚨</span>
              <span>CONFIRM EMERGENCY SOS</span>
            </div>

            <p style={{ fontSize: '0.9rem', color: '#f1f5f9', lineHeight: 1.5, margin: '0 0 1rem 0' }}>
              You are about to broadcast an emergency distress signal to nearby verified responders and shelter coordinators for <strong>{activeLocation.name}</strong>.
            </p>

            <div
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                borderLeft: '3px solid #ef4444',
                padding: '0.65rem 0.85rem',
                fontSize: '0.8rem',
                color: '#fca5a5',
                marginBottom: '1.25rem',
              }}
            >
              False SOS broadcasts hinder emergency search and rescue teams. Only confirm if you or someone nearby is in immediate danger.
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSosConfirmOpen(false)}
                style={{
                  minHeight: '44px',
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                className="btn btn-emergency"
                onClick={() => {
                  setSosConfirmOpen(false);
                  navigate('/sos', { state: { autoOpen: true, coordinates: [activeLocation.latitude, activeLocation.longitude] } });
                }}
                style={{
                  minHeight: '44px',
                  padding: '0.5rem 1.25rem',
                  borderRadius: '8px',
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                Confirm & Broadcast SOS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile-Friendly Media Query Styles */}
      <style>{`
        @media (max-width: 900px) {
          .weather-gpt-main-grid {
            grid-template-columns: 1fr !important;
          }
          .weather-gpt-telemetry-sidebar {
            order: -1;
            position: static !important;
          }
          .weather-gpt-chat-container {
            height: 65vh !important;
          }
        }
      `}</style>
    </div>
  );
}
