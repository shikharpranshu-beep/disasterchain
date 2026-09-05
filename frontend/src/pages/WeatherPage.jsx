import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../i18n/i18n';
import Icon from '../components/Icons';
import WeatherMap from '../components/WeatherMap';
import {
  fetchCompleteWeather,
  fetchActiveCyclones,
  fetchDisasterEvents,
  searchLocations,
  reverseGeocode,
} from '../services/weatherApi';
import {
  getWeatherCondition,
  degreesToCardinal,
  getAqiDetails,
  evaluateAtmosphericRisk,
} from '../utils/weatherUtils';

export default function WeatherPage() {
  const { t } = useTranslation();

  // Location state (Default: New Delhi, India)
  const [selectedLocation, setSelectedLocation] = useState({
    city: 'New Delhi',
    state: 'Delhi',
    country: 'India',
    latitude: 28.6139,
    longitude: 77.2090,
  });

  const [userCoords, setUserCoords] = useState(null);
  const [locPermissionError, setLocPermissionError] = useState(null);
  const [isLocating, setIsLocating] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Weather telemetry state
  const [weatherData, setWeatherData] = useState(null);
  const [cyclonesData, setCyclonesData] = useState([]);
  const [disastersData, setDisastersData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorNotice, setErrorNotice] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isCached, setIsCached] = useState(false);
  const [feedStatus, setFeedStatus] = useState('LIVE'); // 'LIVE' | 'PARTIAL_LIVE' | 'CACHED' | 'UNAVAILABLE'

  // Selected Cyclone for Detail Panel
  const [selectedCyclone, setSelectedCyclone] = useState(null);

  // Expandable atmospheric details
  const [showDetailedMetrics, setShowDetailedMetrics] = useState(false);

  // Load weather and cyclone data for the active coordinates
  const loadWeatherData = useCallback(async (lat, lon) => {
    setIsLoading(true);
    setErrorNotice(null);

    try {
      const [completeRes, cyclonesRes, disastersRes] = await Promise.allSettled([
        fetchCompleteWeather(lat, lon),
        fetchActiveCyclones(),
        fetchDisasterEvents('ALL'),
      ]);

      if (completeRes.status === 'fulfilled' && completeRes.value) {
        const val = completeRes.value;
        setWeatherData(val);
        const cachedFlag = Boolean(val.isCached);
        setIsCached(cachedFlag);

        if (cachedFlag) {
          setFeedStatus('CACHED');
          setLastUpdated(val.cachedAt ? new Date(val.cachedAt).toLocaleTimeString() : new Date().toLocaleTimeString());
        } else {
          const status = val.feedStatus || (val.current && val.airQuality ? 'LIVE' : 'PARTIAL_LIVE');
          setFeedStatus(status);
          setLastUpdated(new Date().toLocaleTimeString());
          setErrorNotice(null);
        }
      } else {
        setFeedStatus('UNAVAILABLE');
        setErrorNotice(t('weather.unavailable', 'WEATHER DATA UNAVAILABLE'));
      }

      if (cyclonesRes.status === 'fulfilled' && cyclonesRes.value?.cyclones) {
        setCyclonesData(cyclonesRes.value.cyclones);
      }

      if (disastersRes.status === 'fulfilled' && disastersRes.value?.events) {
        setDisastersData(disastersRes.value.events);
      }
    } catch (err) {
      setFeedStatus('UNAVAILABLE');
      setErrorNotice(err.message || t('weather.unavailable', 'WEATHER DATA UNAVAILABLE'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  // Initial load
  useEffect(() => {
    loadWeatherData(selectedLocation.latitude, selectedLocation.longitude);
  }, [selectedLocation.latitude, selectedLocation.longitude, loadWeatherData]);

  // Handle "USE MY LOCATION"
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setLocPermissionError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setLocPermissionError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setIsLocating(false);
        const lat = Number(pos.coords.latitude.toFixed(4));
        const lon = Number(pos.coords.longitude.toFixed(4));
        setUserCoords({ latitude: lat, longitude: lon });

        // Reverse geocode to get city name
        try {
          const resolved = await reverseGeocode(lat, lon);
          setSelectedLocation({
            city: resolved.city || 'My Coordinates',
            state: resolved.state || '',
            country: resolved.country || '',
            latitude: lat,
            longitude: lon,
          });
        } catch (e) {
          setSelectedLocation({
            city: 'My Coordinates',
            state: '',
            country: '',
            latitude: lat,
            longitude: lon,
          });
        }

        // Trigger immediate live refresh
        loadWeatherData(lat, lon);
      },
      (err) => {
        setIsLocating(false);
        if (err.code === 1) {
          setLocPermissionError('Location access was denied. You can still search for any city below.');
        } else {
          setLocPermissionError('Location access is currently unavailable.');
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Debounced Search
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await searchLocations(searchQuery);
        setSearchResults(res || []);
      } catch (e) {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectLocation = (loc) => {
    setSelectedLocation({
      city: loc.name,
      state: loc.admin1 || loc.admin2 || '',
      country: loc.country || '',
      latitude: loc.latitude,
      longitude: loc.longitude,
    });
    setSearchQuery('');
    setSearchResults([]);
  };

  const current = weatherData?.current;
  const forecast = weatherData?.forecast;
  const airQuality = weatherData?.airQuality;

  const condition = useMemo(() => {
    return getWeatherCondition(current?.weatherCode);
  }, [current?.weatherCode]);

  const windCardinal = useMemo(() => {
    return degreesToCardinal(current?.windDirection);
  }, [current?.windDirection]);

  const aqiInfo = useMemo(() => {
    return getAqiDetails(airQuality?.europeanAqi);
  }, [airQuality?.europeanAqi]);

  const atmosphericRisk = useMemo(() => {
    return evaluateAtmosphericRisk(current, airQuality, cyclonesData);
  }, [current, airQuality, cyclonesData]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', paddingBottom: '3rem' }}>
      {/* 1. Page Header & Status HUD */}
      <div
        className="spatial-panel"
        style={{
          padding: '1.75rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem',
          borderLeft: isCached ? '4px solid var(--amber)' : '4px solid var(--primary)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
            {feedStatus === 'LIVE' && (
              <span className="badge" style={{ background: 'rgba(0, 230, 118, 0.15)', color: '#00E676', border: '1px solid #00E676' }}>
                ● LIVE DATA
              </span>
            )}
            {feedStatus === 'PARTIAL_LIVE' && (
              <span className="badge" style={{ background: 'rgba(255, 171, 0, 0.15)', color: '#FFAB00', border: '1px solid #FFAB00' }}>
                ◐ PARTIAL LIVE DATA
              </span>
            )}
            {feedStatus === 'CACHED' && (
              <span className="badge" style={{ background: 'rgba(148, 163, 184, 0.15)', color: '#94A3B8', border: '1px solid #94A3B8' }}>
                ● CACHED DATA
              </span>
            )}
            {feedStatus === 'UNAVAILABLE' && (
              <span className="badge" style={{ background: 'rgba(255, 46, 77, 0.15)', color: '#FF2E4D', border: '1px solid #FF2E4D' }}>
                ✕ FEED UNAVAILABLE
              </span>
            )}
            <span className="micro-label" style={{ color: 'var(--text-muted)' }}>
              {lastUpdated ? `${t('weather.lastUpdated', 'Last updated')}: ${lastUpdated}` : 'INITIALIZING...'}
            </span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.85rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.25rem' }}>
            {t('weather.weatherIntelligence', 'WEATHER & ATMOSPHERIC INTELLIGENCE')}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            {t('weather.subtitle', 'Live atmospheric conditions, 7-day forecasts, air quality index, and global tropical cyclone tracking.')}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link
            to="/weather-gpt"
            state={{
              location: {
                name: `${selectedLocation.city}, ${selectedLocation.country}`,
                latitude: selectedLocation.latitude,
                longitude: selectedLocation.longitude,
              },
            }}
            className="btn btn-primary"
            style={{
              fontSize: '0.85rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'linear-gradient(135deg, #ff6b2c, #f97316)',
              minHeight: '44px',
            }}
          >
            <span>🌦️</span>
            <span>Ask WeatherGPT</span>
          </Link>
          <button
            type="button"
            onClick={() => loadWeatherData(selectedLocation.latitude, selectedLocation.longitude)}
            disabled={isLoading}
            className="btn btn-secondary"
            style={{ fontSize: '0.85rem', minHeight: '44px' }}
          >
            ↻ {isLoading ? t('common.refreshing', 'SYNCING...') : t('common.refresh', 'REFRESH')}
          </button>
        </div>
      </div>

      {/* 2. Location Command Bar */}
      <div
        className="spatial-panel"
        style={{
          padding: '1.25rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          background: 'rgba(11, 17, 30, 0.9)',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          {/* Active Target Banner */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(0, 229, 255, 0.1)',
                border: '1px solid var(--border-highlight)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.35rem',
              }}
            >
              📍
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--cyan)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {t('weather.monitoredLocation', 'TARGET LOCATION')}
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>
                {selectedLocation.city}
                {selectedLocation.state ? `, ${selectedLocation.state}` : ''}
                {selectedLocation.country ? ` (${selectedLocation.country})` : ''}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                GPS: {selectedLocation.latitude.toFixed(4)}°N, {selectedLocation.longitude.toFixed(4)}°E
              </div>
            </div>
          </div>

          {/* Action Buttons: Geolocation & City Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', flexGrow: 1, maxWidth: '520px' }}>
            <button
              type="button"
              onClick={handleUseMyLocation}
              disabled={isLocating}
              className="btn btn-primary btn-sm"
              style={{ whiteSpace: 'nowrap', padding: '0.55rem 0.9rem' }}
            >
              📍 {isLocating ? t('weather.detectingLocation', 'LOCATING...') : t('weather.useMyLocation', 'USE MY LOCATION')}
            </button>

            {/* City Search Box */}
            <div style={{ position: 'relative', flexGrow: 1 }}>
              <input
                type="text"
                className="form-input"
                style={{ padding: '0.55rem 0.85rem', fontSize: '0.85rem', background: 'rgba(5, 8, 14, 0.8)' }}
                placeholder={t('weather.searchPlaceholder', 'Search city, district, state or country...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              {/* Search Results Dropdown */}
              {searchResults.length > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 1000,
                    background: 'rgba(11, 17, 30, 0.98)',
                    border: '1px solid var(--border-highlight)',
                    borderRadius: 'var(--radius-sm)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.7)',
                    marginTop: '4px',
                    maxHeight: '260px',
                    overflowY: 'auto',
                  }}
                >
                  {searchResults.map((res) => (
                    <div
                      key={res.id || `${res.latitude}_${res.longitude}`}
                      onClick={() => handleSelectLocation(res)}
                      style={{
                        padding: '0.65rem 0.9rem',
                        cursor: 'pointer',
                        borderBottom: '1px solid var(--border-subtle)',
                        fontSize: '0.85rem',
                        color: '#ffffff',
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0, 229, 255, 0.12)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div>
                        <strong>{res.name}</strong>
                        <span style={{ color: 'var(--text-secondary)', marginLeft: '6px' }}>
                          {res.admin1 ? `${res.admin1}, ` : ''}{res.country}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {res.latitude.toFixed(2)}°, {res.longitude.toFixed(2)}°
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Location permission error feedback */}
        {locPermissionError && (
          <div style={{ color: 'var(--amber)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>⚠</span>
            <span>{locPermissionError}</span>
          </div>
        )}
      </div>

      {/* Feedback banner: Unavailability / Partial / Cached */}
      {errorNotice && !weatherData && (
        <div className="spatial-panel spatial-panel-critical" style={{ padding: '1.25rem', textAlign: 'center' }}>
          <h3 style={{ color: 'var(--crimson)', fontSize: '1.1rem', marginBottom: '0.35rem' }}>
            {errorNotice}
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {t('weather.errorNotice', 'External atmospheric feeds could not be reached. Local cached weather records remain active.')}
          </p>
        </div>
      )}

      {feedStatus === 'PARTIAL_LIVE' && (
        <div className="spatial-panel" style={{ padding: '0.65rem 1.25rem', borderLeft: '4px solid var(--amber)', background: 'rgba(255, 171, 0, 0.08)' }}>
          <span style={{ color: 'var(--amber)', fontSize: '0.85rem', fontWeight: 600 }}>
            ◐ Atmospheric feeds partially synchronized. Core weather conditions are live; secondary feeds are refreshing.
          </span>
        </div>
      )}

      {feedStatus === 'CACHED' && weatherData && (
        <div className="spatial-panel" style={{ padding: '0.65rem 1.25rem', borderLeft: '4px solid var(--text-muted)', background: 'rgba(148, 163, 184, 0.08)' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            ● Operating in offline resilience mode. Displaying cached records from {lastUpdated}.
          </span>
        </div>
      )}

      {/* 3. Hero Current Conditions & Metrics Grid */}
      <div className="responsive-card-grid">
        {/* Current Weather Card */}
        <div
          className="spatial-panel"
          style={{
            padding: '2rem',
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(11, 17, 30, 0.98))',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            borderTop: '3px solid var(--primary)',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span className="badge badge-info" style={{ marginBottom: '0.5rem' }}>
                  {t('weather.current', 'CURRENT CONDITIONS')}
                </span>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  {selectedLocation.city.toUpperCase()}
                </h2>
              </div>
              <div style={{ fontSize: '3.5rem', lineHeight: 1 }}>
                {condition.icon}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginTop: '1rem' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '4.2rem', fontWeight: 800, color: '#ffffff', lineHeight: 1 }}>
                {current?.temperature != null ? Math.round(current.temperature) : '--'}°C
              </div>
              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)' }}>
                  {condition.label}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {t('weather.feelsLike', 'Feels like')} {current?.apparentTemperature != null ? Math.round(current.apparentTemperature) : '--'}°C
                </div>
              </div>
            </div>
          </div>

          {/* Compact Primary Metrics Grid */}
          <div
            className="weather-metrics-grid"
            style={{
              marginTop: '1.75rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>💧 {t('weather.humidity', 'Humidity')}</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                {current?.relativeHumidity != null ? `${current.relativeHumidity}%` : '--'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>💨 {t('weather.wind', 'Wind')}</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                {current?.windSpeed != null ? `${current.windSpeed} km/h` : '--'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>🧭 {t('weather.direction', 'Heading')}</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>
                {windCardinal} ({current?.windDirection ?? 0}°)
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>🌡 {t('weather.pressure', 'Pressure')}</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                {current?.pressureMsl != null ? `${Math.round(current.pressureMsl)} hPa` : '--'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>👁 {t('weather.visibility', 'Visibility')}</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                {current?.visibilityKm != null ? `${current.visibilityKm} km` : '--'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>☁ {t('weather.cloudCover', 'Clouds')}</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                {current?.cloudCover != null ? `${current.cloudCover}%` : '--'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>☀️ {t('weather.uvIndex', 'UV Index')}</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--amber)', fontFamily: 'var(--font-mono)' }}>
                {current?.uvIndex != null ? current.uvIndex : '--'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>🌧 {t('weather.precipitation', 'Rain')}</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>
                {current?.precipitation != null ? `${current.precipitation} mm` : '0 mm'}
              </div>
            </div>
          </div>
        </div>

        {/* Air Quality (AQI) Card */}
        <div
          className="spatial-panel"
          style={{
            padding: '2rem',
            background: 'rgba(11, 17, 30, 0.95)',
            borderTop: `3px solid ${aqiInfo.color}`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span className="badge badge-info">{t('weather.airQuality', 'AIR QUALITY')}</span>
              <span className={`badge ${aqiInfo.badgeClass}`} style={{ fontWeight: 800 }}>
                {aqiInfo.label}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '3.6rem', fontWeight: 800, color: aqiInfo.color, lineHeight: 1 }}>
                {airQuality?.europeanAqi != null ? airQuality.europeanAqi : '--'}
              </div>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff' }}>
                  {t('weather.europeanAqi', 'European Air Quality Index')}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  {aqiInfo.advisory}
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Pollutants Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.85rem',
              marginTop: '1.5rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>PM2.5</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                {airQuality?.pm2_5 != null ? `${airQuality.pm2_5} μg/m³` : '--'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>PM10</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                {airQuality?.pm10 != null ? `${airQuality.pm10} μg/m³` : '--'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>O₃ (Ozone)</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                {airQuality?.ozone != null ? `${airQuality.ozone} μg/m³` : '--'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>NO₂</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                {airQuality?.nitrogenDioxide != null ? `${airQuality.nitrogenDioxide} μg/m³` : '--'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>SO₂</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                {airQuality?.sulphurDioxide != null ? `${airQuality.sulphurDioxide} μg/m³` : '--'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>CO (Monoxide)</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                {airQuality?.carbonMonoxide != null ? `${airQuality.carbonMonoxide} μg/m³` : '--'}
              </div>
            </div>
          </div>

          <div style={{ marginTop: '1rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            {t('weather.aqiSource', 'Source: Open-Meteo Air Quality / CAMS European Scale')}
          </div>
        </div>
      </div>

      {/* 4. Atmospheric Risk Context Banner */}
      <div
        className={`spatial-panel ${atmosphericRisk.hasRisks ? 'spatial-panel-critical' : ''}`}
        style={{
          padding: '1.25rem 1.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          borderLeft: atmosphericRisk.hasRisks ? '4px solid var(--crimson)' : '4px solid var(--mint)',
          background: 'rgba(11, 17, 30, 0.92)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.2rem' }}>{atmosphericRisk.hasRisks ? '⚠️' : '✓'}</span>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
              {atmosphericRisk.headline}
            </h3>
          </div>
          <span className="micro-label" style={{ color: 'var(--text-muted)' }}>
            {atmosphericRisk.disclaimer}
          </span>
        </div>

        {atmosphericRisk.risks.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem', marginTop: '0.25rem' }}>
            {atmosphericRisk.risks.map((r, idx) => (
              <div
                key={idx}
                style={{
                  padding: '0.75rem 1rem',
                  background: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-xs)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                  <span>{r.icon}</span>
                  <strong style={{ fontSize: '0.85rem', color: r.severity === 'CRITICAL' ? 'var(--crimson)' : 'var(--amber)' }}>
                    {r.title}
                  </strong>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                  {r.detail}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Hourly Forecast Timeline (Next 24 Hours) */}
      <div className="spatial-panel" style={{ padding: '1.5rem', background: 'rgba(11, 17, 30, 0.9)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>⏱</span> {t('weather.hourlyForecast', '24-HOUR HOURLY FORECAST')}
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {t('weather.hourlyDesc', 'Scroll horizontally for full 24-hour progression')}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '0.85rem',
            overflowX: 'auto',
            paddingBottom: '0.75rem',
          }}
        >
          {forecast?.hourly && forecast.hourly.length > 0 ? (
            forecast.hourly.map((h, idx) => {
              const hCond = getWeatherCondition(h.weatherCode);
              const timeLabel = h.time ? h.time.slice(11, 16) : `${idx}:00`;
              return (
                <div
                  key={idx}
                  style={{
                    minWidth: '95px',
                    padding: '0.85rem 0.65rem',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '0.4rem',
                  }}
                >
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {timeLabel}
                  </div>
                  <div style={{ fontSize: '1.6rem', margin: '0.1rem 0' }}>
                    {hCond.icon}
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-display)' }}>
                    {Math.round(h.temperature)}°C
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--cyan)' }}>
                    🌧 {h.precipitationProbability != null ? `${h.precipitationProbability}%` : '0%'}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    💨 {Math.round(h.windSpeed)}k
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '1rem' }}>
              {t('common.loading', 'Loading hourly forecast...')}
            </div>
          )}
        </div>
      </div>

      {/* 6. 7-Day Outlook */}
      <div className="spatial-panel" style={{ padding: '1.5rem', background: 'rgba(11, 17, 30, 0.9)' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', margin: 0, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>📅</span> {t('weather.sevenDayOutlook', '7-DAY WEATHER OUTLOOK')}
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.85rem' }}>
          {forecast?.daily && forecast.daily.length > 0 ? (
            forecast.daily.map((d, idx) => {
              const dCond = getWeatherCondition(d.weatherCode);
              const dateObj = new Date(d.date);
              const dayName = dateObj.toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase();
              const dateStr = `${dateObj.getDate()} ${dateObj.toLocaleDateString(undefined, { month: 'short' })}`;

              return (
                <div
                  key={idx}
                  style={{
                    padding: '1rem 0.75rem',
                    background: 'rgba(15, 23, 42, 0.75)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '0.5rem',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff' }}>{dayName}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{dateStr}</div>
                  </div>

                  <div style={{ fontSize: '2rem', margin: '0.2rem 0' }}>
                    {dCond.icon}
                  </div>

                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', minHeight: '1.8rem', lineHeight: 1.2 }}>
                    {dCond.label}
                  </div>

                  <div>
                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>
                      {Math.round(d.tempMax)}°
                    </span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: '4px' }}>
                      / {Math.round(d.tempMin)}°
                    </span>
                  </div>

                  <div style={{ fontSize: '0.72rem', color: 'var(--cyan)' }}>
                    🌧 Rain {d.precipitationProbabilityMax ?? 0}%
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    💨 {Math.round(d.windSpeedMax)} km/h
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '1rem' }}>
              {t('common.loading', 'Loading 7-day outlook...')}
            </div>
          )}
        </div>
      </div>

      {/* 7. Wind Intelligence & Sky Profile (2-Column) */}
      <div className="responsive-card-grid">
        {/* Wind Intelligence Card with Compass */}
        <div className="spatial-panel" style={{ padding: '1.75rem', background: 'rgba(11, 17, 30, 0.95)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>💨</span> {t('weather.windIntelligence', 'WIND INTELLIGENCE')}
            </h3>
            <span className="badge badge-info">{windCardinal}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: '1.5rem', marginTop: '0.5rem' }}>
            {/* Animated Wind Compass */}
            <div
              style={{
                width: '110px',
                height: '110px',
                borderRadius: '50%',
                border: '2px solid var(--border-highlight)',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'radial-gradient(circle, rgba(0, 229, 255, 0.05), transparent)',
              }}
            >
              {/* Compass Labels */}
              <span style={{ position: 'absolute', top: '4px', fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)' }}>N</span>
              <span style={{ position: 'absolute', right: '6px', fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)' }}>E</span>
              <span style={{ position: 'absolute', bottom: '4px', fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)' }}>S</span>
              <span style={{ position: 'absolute', left: '6px', fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)' }}>W</span>

              {/* Rotating Arrow */}
              <div
                style={{
                  width: '3px',
                  height: '65px',
                  background: 'linear-gradient(to top, transparent 50%, var(--cyan) 50%)',
                  transform: `rotate(${current?.windDirection ?? 0}deg)`,
                  transition: 'transform 1s ease',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: '-4px',
                    width: 0,
                    height: 0,
                    borderLeft: '5.5px solid transparent',
                    borderRight: '5.5px solid transparent',
                    borderBottom: '10px solid var(--cyan)',
                  }}
                />
              </div>
            </div>

            {/* Wind Telemetry Numbers */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('weather.currentWind', 'Sustained Speed')}</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                  {current?.windSpeed != null ? `${current.windSpeed} km/h` : '--'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('weather.windGust', 'Peak Gusts')}</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--amber)', fontFamily: 'var(--font-mono)' }}>
                  {current?.windGusts != null ? `${current.windGusts} km/h` : '--'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('weather.direction', 'Azimuth Heading')}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--cyan)', fontWeight: 700 }}>
                  {current?.windDirection != null ? `${current.windDirection}° (${windCardinal})` : '--'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sky / Cloud Profile Card */}
        <div className="spatial-panel" style={{ padding: '1.75rem', background: 'rgba(11, 17, 30, 0.95)' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', margin: 0, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>☁</span> {t('weather.skyConditions', 'SKY & CLOUD PROFILE')}
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{t('weather.cloudCover', 'Total Cloud Cover')}</span>
                <strong style={{ color: '#ffffff' }}>{current?.cloudCover ?? 0}%</strong>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${current?.cloudCover ?? 0}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, var(--cyan), var(--primary))',
                    borderRadius: '4px',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('weather.condition', 'Sky Status')}</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff' }}>
                  {condition.label}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('weather.daylight', 'Daylight Phase')}</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: current?.isDay ? 'var(--amber)' : 'var(--cyan)' }}>
                  {current?.isDay ? '☀️ Daytime' : '🌙 Nighttime'}
                </div>
              </div>
            </div>

            {/* Expandable Details Toggle */}
            <button
              type="button"
              onClick={() => setShowDetailedMetrics(!showDetailedMetrics)}
              className="btn btn-secondary btn-sm"
              style={{ marginTop: '0.5rem', width: '100%', fontSize: '0.8rem' }}
            >
              {showDetailedMetrics ? '▲ ' + t('weather.hideDetails', 'Hide Detailed Atmospheric Panel') : '▼ ' + t('weather.showDetails', 'View Full Atmospheric Parameter Grid')}
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Detailed Atmospheric Metrics Grid */}
      {showDetailedMetrics && (
        <div className="spatial-panel" style={{ padding: '1.5rem', background: 'rgba(11, 17, 30, 0.9)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff', margin: 0, marginBottom: '1rem' }}>
            📊 {t('weather.detailedMetrics', 'COMPREHENSIVE ATMOSPHERIC TELEMETRY')}
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', background: 'rgba(15, 23, 42, 0.6)', borderRadius: 'var(--radius-xs)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Temperature (2m)</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>{current?.temperature}°C</div>
            </div>
            <div style={{ padding: '0.75rem', background: 'rgba(15, 23, 42, 0.6)', borderRadius: 'var(--radius-xs)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Apparent (Feels Like)</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>{current?.apparentTemperature}°C</div>
            </div>
            <div style={{ padding: '0.75rem', background: 'rgba(15, 23, 42, 0.6)', borderRadius: 'var(--radius-xs)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Barometric Pressure MSL</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>{current?.pressureMsl} hPa</div>
            </div>
            <div style={{ padding: '0.75rem', background: 'rgba(15, 23, 42, 0.6)', borderRadius: 'var(--radius-xs)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Horizontal Visibility</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>{current?.visibilityKm != null ? `${current.visibilityKm} km` : '10 km'}</div>
            </div>
            <div style={{ padding: '0.75rem', background: 'rgba(15, 23, 42, 0.6)', borderRadius: 'var(--radius-xs)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Precipitation Sum</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>{current?.precipitation ?? 0} mm</div>
            </div>
            <div style={{ padding: '0.75rem', background: 'rgba(15, 23, 42, 0.6)', borderRadius: 'var(--radius-xs)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Rain Rate</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>{current?.rain ?? 0} mm/h</div>
            </div>
            <div style={{ padding: '0.75rem', background: 'rgba(15, 23, 42, 0.6)', borderRadius: 'var(--radius-xs)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Today Sunrise</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--amber)' }}>
                {forecast?.daily?.[0]?.sunrise ? forecast.daily[0].sunrise.slice(11, 16) : '05:58'}
              </div>
            </div>
            <div style={{ padding: '0.75rem', background: 'rgba(15, 23, 42, 0.6)', borderRadius: 'var(--radius-xs)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Today Sunset</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>
                {forecast?.daily?.[0]?.sunset ? forecast.daily[0].sunset.slice(11, 16) : '18:38'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. Global Atmospheric & Cyclone Map */}
      <WeatherMap
        userCoords={userCoords}
        selectedLocation={selectedLocation}
        currentWeather={current}
        cyclones={cyclonesData}
        disasters={disastersData}
        selectedCyclone={selectedCyclone}
        onSelectCyclone={(c) => setSelectedCyclone(c)}
      />

      {/* 9. Active Tropical Cyclones Registry Section */}
      <div className="spatial-panel" style={{ padding: '1.75rem', background: 'rgba(11, 17, 30, 0.95)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🌀</span> {t('weather.activeCyclones', 'GLOBAL TROPICAL CYCLONE INTELLIGENCE')}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '0.2rem 0 0 0' }}>
              {t('weather.cycloneDesc', 'Live monitoring of oceanic cyclonic storms, super typhoons, and hurricanes via GDACS.')}
            </p>
          </div>
          <span className="badge badge-emergency">
            {cyclonesData.length} {t('weather.cyclonesMonitored', 'ACTIVE STORMS')}
          </span>
        </div>

        {cyclonesData.length > 0 ? (
          <div className="responsive-card-grid">
            {cyclonesData.map((c) => {
              const isSelected = selectedCyclone?.id === c.id;
              return (
                <div
                  key={c.id}
                  style={{
                    padding: '1.25rem',
                    background: isSelected ? 'rgba(255, 46, 77, 0.12)' : 'rgba(15, 23, 42, 0.8)',
                    border: isSelected ? '2px solid var(--crimson)' : '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#ffffff' }}>
                          🌀 {c.name}
                        </div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary)', marginTop: '2px' }}>
                          {c.category}
                        </div>
                      </div>
                      <span className={`badge ${c.alertLevel === 'Red' ? 'badge-critical' : c.alertLevel === 'Orange' ? 'badge-warning' : 'badge-info'}`}>
                        {c.alertLevel.toUpperCase()}
                      </span>
                    </div>

                    <div style={{ marginTop: '0.75rem', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', fontSize: '0.78rem' }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Max Wind:</span>{' '}
                        <strong style={{ color: '#ffffff' }}>{c.maxWindKmh} km/h</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Basin/State:</span>{' '}
                        <strong style={{ color: '#ffffff' }}>{c.country}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Coordinates:</span>{' '}
                        <strong style={{ color: 'var(--cyan)' }}>{c.latitude.toFixed(1)}°, {c.longitude.toFixed(1)}°</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Last Update:</span>{' '}
                        <strong style={{ color: '#ffffff' }}>{c.pubDate ? c.pubDate.slice(0, 16) : 'Live'}</strong>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedCyclone(c)}
                      className="btn btn-primary btn-sm"
                      style={{ flexGrow: 1, fontSize: '0.75rem' }}
                    >
                      🎯 {t('weather.fitToCyclone', 'VIEW ON MAP')}
                    </button>
                    {c.link && (
                      <a
                        href={c.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.75rem' }}
                      >
                        GDACS ↗
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            ✓ {t('weather.noActiveCyclones', 'No active tropical cyclones currently reported in the global monitoring feed.')}
          </div>
        )}
      </div>

      {/* 10. Data Attribution & Compliance Footer */}
      <div
        className="spatial-panel"
        style={{
          padding: '1.25rem 1.75rem',
          background: 'rgba(5, 8, 14, 0.85)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          fontSize: '0.78rem',
          color: 'var(--text-muted)',
        }}
      >
        <div>
          <strong>DISASTERCHAIN OPERATIONAL WEATHER ATTRIBUTION:</strong>
          <div style={{ marginTop: '0.2rem' }}>
            Weather Forecasts: <strong>Open-Meteo (Open-Meteo.com)</strong> • Air Quality: <strong>Open-Meteo / Copernicus CAMS</strong> • Tropical Cyclones & Disasters: <strong>GDACS (EC / UN)</strong> • Radar Precipitation: <strong>RainViewer</strong> • Geospatial Base: <strong>OpenStreetMap</strong>
          </div>
        </div>

        <div>
          <span>{t('weather.nonCommercialNotice', 'Compliant non-commercial civic emergency intelligence data architecture.')}</span>
        </div>
      </div>
    </div>
  );
}
