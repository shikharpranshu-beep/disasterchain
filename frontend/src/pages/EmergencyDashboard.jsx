import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../components/Icons';
import {
  fetchSosRequests,
  fetchShelters,
  fetchAffectedAreas,
  fetchAlerts,
  fetchIncidents,
} from '../services/api';
import { fetchCompleteWeather } from '../services/weatherApi';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/i18n';

const EmergencyDashboard = ({ onOpenSos, onOpenIncident, refreshKey }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [sosList, setSosList] = useState([]);
  const [shelters, setShelters] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [affectedAreas, setAffectedAreas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Weather state
  const [weather, setWeather] = useState({
    temp: '28°C',
    condition: 'Clear',
    wind: '12 km/h',
    aqi: 42,
    isSevere: false,
    severityLabel: 'Conditions currently stable',
  });

  // Fetch summary emergency data
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const [sosRes, shRes, altRes, incRes, areaRes] = await Promise.allSettled([
          fetchSosRequests(),
          fetchShelters(),
          fetchAlerts(),
          fetchIncidents(),
          fetchAffectedAreas(),
        ]);

        if (!isMounted) return;

        if (sosRes.status === 'fulfilled' && Array.isArray(sosRes.value)) {
          setSosList(sosRes.value);
        }
        if (shRes.status === 'fulfilled' && Array.isArray(shRes.value)) {
          setShelters(shRes.value);
        }
        if (altRes.status === 'fulfilled' && Array.isArray(altRes.value)) {
          setAlerts(altRes.value);
        }
        if (incRes.status === 'fulfilled' && Array.isArray(incRes.value)) {
          setIncidents(incRes.value);
        }
        if (areaRes.status === 'fulfilled' && Array.isArray(areaRes.value)) {
          setAffectedAreas(areaRes.value);
        }
      } catch (e) {
        // Fallback gracefully
      } finally {
        if (isMounted) setLoading(false);
      }

      // Fetch Live Weather
      try {
        const wData = await fetchCompleteWeather(28.6139, 77.2090);
        if (isMounted && wData?.current) {
          const temp = wData.current.temperature != null ? `${Math.round(wData.current.temperature)}°C` : '28°C';
          const wind = wData.current.windSpeed != null ? `${Math.round(wData.current.windSpeed)} km/h` : '12 km/h';
          const condition = wData.current.weatherCode <= 3 ? 'Clear' : 'Cloudy / Rainfall';
          const isSevere = wData.current.weatherCode >= 80 || (wData.current.windSpeed && wData.current.windSpeed > 50);
          setWeather({
            temp,
            condition,
            wind,
            aqi: wData.airQuality?.aqi || 42,
            isSevere: !!isSevere,
            severityLabel: isSevere ? 'Adverse weather conditions detected' : 'Conditions currently stable',
          });
        }
      } catch (err) {
        // Keep fallback
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  // Derived Active Alerts
  const activeAlerts = useMemo(() => {
    return alerts.filter((a) => a.status === 'ACTIVE' || !a.status);
  }, [alerts]);

  // Local Risk calculation
  const riskStatus = useMemo(() => {
    const hasCriticalAlert = activeAlerts.some((a) => a.severity === 'CRITICAL' || a.severity === 'EXTREME');
    const hasSevereSos = sosList.some((s) => s.status === 'PENDING' || s.status === 'CRITICAL');

    if (hasCriticalAlert || hasSevereSos || weather.isSevere) {
      return {
        level: 'High',
        tag: 'Critical threat in area',
        color: '#ef4444',
      };
    }
    if (activeAlerts.length > 0) {
      return {
        level: 'Moderate',
        tag: `${activeAlerts.length} active advisories`,
        color: '#f59e0b',
      };
    }
    return {
      level: 'Low',
      tag: 'No immediate threat',
      color: '#10b981',
    };
  }, [activeAlerts, sosList, weather.isSevere]);

  // Nearest Shelter
  const nearestShelter = useMemo(() => {
    if (!shelters.length) {
      return {
        name: 'City Youth Center',
        distance: '1.8 km away',
        capacity: '124 spaces available',
        id: null,
      };
    }
    const sorted = [...shelters].sort((a, b) => {
      const distA = a.distanceKm ?? a.distance ?? 999;
      const distB = b.distanceKm ?? b.distance ?? 999;
      return distA - distB;
    });
    const s = sorted[0];
    const dist = s.distanceKm ?? s.distance;
    return {
      name: s.name || 'Emergency Shelter',
      distance: typeof dist === 'number' ? `${dist.toFixed(1)} km away` : '1.8 km away',
      capacity: s.capacity ? `${s.availableCapacity ?? s.capacity} spaces available` : '124 spaces available',
      id: s._id || s.id,
    };
  }, [shelters]);

  // Greeting based on hour
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  return (
    <div
      className="emergency-overview-container"
      style={{
        minHeight: '100vh',
        background: '#0e0b08',
        color: '#f8fafc',
        padding: '1.5rem 1rem 4rem',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          maxWidth: '1240px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
        }}
      >
        {/* TOP HEADER */}
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
            paddingBottom: '0.5rem',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#ff6b2c',
                marginBottom: '0.2rem',
              }}
            >
              EMERGENCY OVERVIEW
            </div>
            <h1
              style={{
                fontSize: 'clamp(1.4rem, 4vw, 1.85rem)',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                margin: 0,
                color: '#ffffff',
              }}
            >
              {greeting}{user?.name ? `, ${user.name}` : ''}
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.35rem 0.75rem',
                borderRadius: '9999px',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#10b981',
                fontSize: '0.76rem',
                fontWeight: 700,
              }}
            >
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: '#10b981',
                  boxShadow: '0 0 8px #10b981',
                }}
              />
              <span>SYSTEM ONLINE</span>
            </div>
          </div>
        </header>

        {/* 1. EMERGENCY SOS CARD */}
        <section
          style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.16) 0%, rgba(20, 14, 12, 0.95) 100%)',
            border: '1.5px solid rgba(239, 68, 68, 0.45)',
            borderRadius: '16px',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            boxShadow: '0 8px 30px rgba(239, 68, 68, 0.18)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '1.25rem' }}>🚨</span>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ffffff', margin: 0, letterSpacing: '0.02em' }}>
                EMERGENCY SOS
              </h2>
            </div>
            <p style={{ margin: 0, color: '#fca5a5', fontSize: '0.92rem' }}>
              Get help immediately. Broadcasts your live coordinates to civil defense and responders.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenSos}
            id="dashboard-send-sos-btn"
            aria-label="Send Emergency SOS"
            style={{
              minHeight: '48px',
              minWidth: '160px',
              background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
              color: '#ffffff',
              border: '2px solid rgba(255, 255, 255, 0.35)',
              borderRadius: '10px',
              fontWeight: 800,
              fontSize: '0.95rem',
              letterSpacing: '0.04em',
              padding: '0.75rem 1.5rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 6px 20px rgba(239, 68, 68, 0.45)',
              transition: 'transform 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px) scale(1.02)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0) scale(1)')}
          >
            <span>SEND SOS</span>
            <span>🚨</span>
          </button>
        </section>

        {/* 2. 4-ITEM STATUS ROW */}
        <section
          className="dashboard-status-row"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
          }}
        >
          {/* Status 1: LOCAL RISK */}
          <div
            style={{
              background: '#16100c',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderLeft: `4px solid ${riskStatus.color}`,
              borderRadius: '12px',
              padding: '1rem 1.25rem',
            }}
          >
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              LOCAL RISK
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: riskStatus.color, margin: '0.2rem 0' }}>
              {riskStatus.level}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
              {riskStatus.tag}
            </div>
          </div>

          {/* Status 2: SHELTERS */}
          <div
            style={{
              background: '#16100c',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderLeft: '4px solid #ff6b2c',
              borderRadius: '12px',
              padding: '1rem 1.25rem',
            }}
          >
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              SHELTERS
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#ffffff', margin: '0.2rem 0' }}>
              {shelters.length || 8} nearby
            </div>
            <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
              {nearestShelter.distance}
            </div>
          </div>

          {/* Status 3: ALERTS */}
          <div
            style={{
              background: '#16100c',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderLeft: `4px solid ${activeAlerts.length > 0 ? '#ef4444' : '#10b981'}`,
              borderRadius: '12px',
              padding: '1rem 1.25rem',
            }}
          >
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              ALERTS
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#ffffff', margin: '0.2rem 0' }}>
              {activeAlerts.length} active
            </div>
            <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
              {activeAlerts.length > 0 ? 'Official advisories issued' : 'No active warning'}
            </div>
          </div>

          {/* Status 4: WEATHER */}
          <div
            style={{
              background: '#16100c',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderLeft: '4px solid #38bdf8',
              borderRadius: '12px',
              padding: '1rem 1.25rem',
            }}
          >
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              WEATHER
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#ffffff', margin: '0.2rem 0' }}>
              {weather.temp}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
              {weather.condition} • Wind {weather.wind}
            </div>
          </div>
        </section>

        {/* 3. WHAT NEEDS YOUR ATTENTION (MAX 3 ITEMS) */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2
              style={{
                fontSize: '1rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: '#e2e8f0',
                margin: 0,
              }}
            >
              WHAT NEEDS YOUR ATTENTION
            </h2>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>3 priority items</span>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            {/* Item 1: Alert Item */}
            <div
              style={{
                background: '#16100c',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '1rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <span style={{ fontSize: '1.35rem' }}>🔴</span>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#ffffff' }}>
                      {activeAlerts[0]?.title || 'Heavy rainfall warning in your area'}
                    </span>
                    <span
                      style={{
                        background: 'rgba(239, 68, 68, 0.15)',
                        color: '#ef4444',
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        padding: '0.1rem 0.4rem',
                        borderRadius: '4px',
                      }}
                    >
                      CRITICAL
                    </span>
                  </div>
                  <p style={{ margin: '0.2rem 0 0', color: '#94a3b8', fontSize: '0.82rem' }}>
                    {activeAlerts[0]?.description || 'Take shelter and avoid low-lying roads and water accumulation zones.'}
                  </p>
                </div>
              </div>

              <Link
                to="/alerts"
                style={{
                  minHeight: '44px',
                  padding: '0.5rem 1.1rem',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                View
              </Link>
            </div>

            {/* Item 2: Nearby Shelter */}
            <div
              style={{
                background: '#16100c',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '1rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <span style={{ fontSize: '1.35rem' }}>🟠</span>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#ffffff' }}>
                      Nearby shelter: {nearestShelter.name}
                    </span>
                    <span
                      style={{
                        background: 'rgba(255, 107, 44, 0.15)',
                        color: '#ff6b2c',
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        padding: '0.1rem 0.4rem',
                        borderRadius: '4px',
                      }}
                    >
                      OPEN
                    </span>
                  </div>
                  <p style={{ margin: '0.2rem 0 0', color: '#94a3b8', fontSize: '0.82rem' }}>
                    {nearestShelter.distance} • {nearestShelter.capacity}
                  </p>
                </div>
              </div>

              <Link
                to="/shelters"
                style={{
                  minHeight: '44px',
                  padding: '0.5rem 1.1rem',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                View
              </Link>
            </div>

            {/* Item 3: Weather Condition */}
            <div
              style={{
                background: '#16100c',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '1rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <span style={{ fontSize: '1.35rem' }}>🟢</span>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#ffffff' }}>
                      Weather & Air Quality
                    </span>
                    <span
                      style={{
                        background: 'rgba(16, 185, 129, 0.15)',
                        color: '#10b981',
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        padding: '0.1rem 0.4rem',
                        borderRadius: '4px',
                      }}
                    >
                      MONITORED
                    </span>
                  </div>
                  <p style={{ margin: '0.2rem 0 0', color: '#94a3b8', fontSize: '0.82rem' }}>
                    {weather.severityLabel} • {weather.temp} • AQI {weather.aqi}
                  </p>
                </div>
              </div>

              <Link
                to="/weather"
                style={{
                  minHeight: '44px',
                  padding: '0.5rem 1.1rem',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                Details
              </Link>
            </div>
          </div>
        </section>

        {/* 4. QUICK ACTIONS */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h2
            style={{
              fontSize: '1rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: '#e2e8f0',
              margin: 0,
            }}
          >
            QUICK ACTIONS
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '0.75rem',
            }}
          >
            <Link
              to="/shelters"
              style={{
                minHeight: '48px',
                background: '#16100c',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                padding: '0.75rem 1rem',
                color: '#ffffff',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                fontWeight: 700,
                fontSize: '0.92rem',
                transition: 'border-color 0.15s ease',
              }}
            >
              <span style={{ fontSize: '1.25rem' }}>🏠</span>
              <span>Find Shelter</span>
            </Link>

            <Link
              to="/affected-areas"
              style={{
                minHeight: '48px',
                background: '#16100c',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                padding: '0.75rem 1rem',
                color: '#ffffff',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                fontWeight: 700,
                fontSize: '0.92rem',
                transition: 'border-color 0.15s ease',
              }}
            >
              <span style={{ fontSize: '1.25rem' }}>🗺️</span>
              <span>View Map</span>
            </Link>

            <Link
              to="/weather"
              style={{
                minHeight: '48px',
                background: '#16100c',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                padding: '0.75rem 1rem',
                color: '#ffffff',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                fontWeight: 700,
                fontSize: '0.92rem',
                transition: 'border-color 0.15s ease',
              }}
            >
              <span style={{ fontSize: '1.25rem' }}>🌦️</span>
              <span>Weather</span>
            </Link>

            <Link
              to="/guides"
              style={{
                minHeight: '48px',
                background: '#16100c',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                padding: '0.75rem 1rem',
                color: '#ffffff',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                fontWeight: 700,
                fontSize: '0.92rem',
                transition: 'border-color 0.15s ease',
              }}
            >
              <span style={{ fontSize: '1.25rem' }}>🧰</span>
              <span>Preparedness</span>
            </Link>
          </div>
        </section>

        {/* 5. COMPACT LIVE MAP PREVIEW */}
        <section
          style={{
            background: '#16100c',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '1.25rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                color: '#ff6b2c',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '0.2rem',
              }}
            >
              LIVE MAP
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.2rem' }}>
              {shelters.length || 8} shelters • {incidents.length || 2} incidents • {activeAlerts.length} active alert{activeAlerts.length === 1 ? '' : 's'}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Full GIS layers, radius buffers, satellite overlay, and route navigation available.
            </div>
          </div>

          <Link
            to="/affected-areas"
            style={{
              minHeight: '44px',
              padding: '0.65rem 1.25rem',
              background: '#ff6b2c',
              color: '#ffffff',
              borderRadius: '8px',
              fontWeight: 800,
              fontSize: '0.86rem',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <span>OPEN FULL MAP</span>
            <span>→</span>
          </Link>
        </section>
      </div>
    </div>
  );
};

export default EmergencyDashboard;
