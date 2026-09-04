import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/i18n';
import Icon from '../components/Icons';
import { fetchShelters, fetchAlerts } from '../services/api';
import { fetchCompleteWeather } from '../services/weatherApi';

const LandingPage = ({ onOpenSos }) => {
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();

  const [shelterCount, setShelterCount] = useState(8);
  const [nearestDistance, setNearestDistance] = useState('1.8 km');
  const [activeAlertsCount, setActiveAlertsCount] = useState(0);
  const [weatherInfo, setWeatherInfo] = useState({
    temp: '28°C',
    condition: 'Clear',
    wind: '12 km/h',
  });
  const [riskStatus, setRiskStatus] = useState({
    level: 'Moderate risk',
    description: 'No critical threat detected nearby',
    color: '#f59e0b',
  });

  useEffect(() => {
    let isMounted = true;
    const loadSummaryData = async () => {
      try {
        const [shRes, altRes] = await Promise.allSettled([
          fetchShelters(),
          fetchAlerts(),
        ]);

        if (!isMounted) return;

        if (shRes.status === 'fulfilled' && Array.isArray(shRes.value)) {
          const validShelters = shRes.value;
          if (validShelters.length > 0) {
            setShelterCount(validShelters.length);
            const distances = validShelters
              .map((s) => s.distanceKm || s.distance)
              .filter((d) => typeof d === 'number' && d > 0);
            if (distances.length > 0) {
              setNearestDistance(`${Math.min(...distances).toFixed(1)} km`);
            }
          }
        }

        if (altRes.status === 'fulfilled' && Array.isArray(altRes.value)) {
          const active = altRes.value.filter((a) => a.status === 'ACTIVE' || !a.status);
          setActiveAlertsCount(active.length);
          const hasCritical = active.some((a) => a.severity === 'CRITICAL' || a.severity === 'EXTREME');
          if (hasCritical) {
            setRiskStatus({
              level: 'High risk',
              description: 'Critical weather or flood alert active in region',
              color: '#ef4444',
            });
          } else if (active.length > 0) {
            setRiskStatus({
              level: 'Moderate risk',
              description: `${active.length} active regional advisory`,
              color: '#f59e0b',
            });
          } else {
            setRiskStatus({
              level: 'Low risk',
              description: 'No critical threats detected in your area',
              color: '#10b981',
            });
          }
        }
      } catch (err) {
        // Fallback gracefully
      }

      // Fetch weather
      try {
        const wData = await fetchCompleteWeather(28.6139, 77.2090);
        if (isMounted && wData?.current) {
          const temp = wData.current.temperature != null ? `${Math.round(wData.current.temperature)}°C` : '28°C';
          const wind = wData.current.windSpeed != null ? `${Math.round(wData.current.windSpeed)} km/h` : '12 km/h';
          const condition = wData.current.weatherCode <= 3 ? 'Clear' : 'Overcast';
          setWeatherInfo({ temp, condition, wind });
        }
      } catch (e) {
        // Keep standard fallback
      }
    };

    loadSummaryData();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#0d0a08', color: '#f8fafc' }}>
      {/* Top Quiet Helpline Banner */}
      <div
        style={{
          background: 'rgba(239, 68, 68, 0.08)',
          borderBottom: '1px solid rgba(239, 68, 68, 0.2)',
          color: '#fca5a5',
          textAlign: 'center',
          padding: '0.4rem 1rem',
          fontSize: '0.78rem',
          letterSpacing: '0.02em',
        }}
      >
        <span>Emergency Civil Defense Hotlines: </span>
        <a href="tel:112" style={{ color: '#ef4444', fontWeight: 800, textDecoration: 'none', marginLeft: '0.25rem' }}>
          Call 112 (National)
        </a>
        <span style={{ margin: '0 0.5rem', opacity: 0.5 }}>•</span>
        <a href="tel:108" style={{ color: '#f8fafc', fontWeight: 700, textDecoration: 'none' }}>
          Ambulance 108
        </a>
        <span style={{ margin: '0 0.5rem', opacity: 0.5 }}>•</span>
        <a href="tel:101" style={{ color: '#f8fafc', fontWeight: 700, textDecoration: 'none' }}>
          Fire 101
        </a>
      </div>

      {/* Main Simplified Hero Container */}
      <main
        style={{
          flex: 1,
          maxWidth: '1080px',
          width: '100%',
          margin: '0 auto',
          padding: '3rem 1.25rem 4rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxSizing: 'border-box',
          textAlign: 'center',
        }}
      >
        {/* Title and Subtitle */}
        <div style={{ marginBottom: '2.25rem', maxWidth: '640px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px',
              background: 'rgba(255, 107, 44, 0.12)',
              border: '1px solid rgba(255, 107, 44, 0.3)',
              color: '#ff6b2c',
              fontSize: '0.78rem',
              fontWeight: 700,
              letterSpacing: '0.05em',
              marginBottom: '1rem',
            }}
          >
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
            <span>CRISIS READY SYSTEM</span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(2.2rem, 5vw, 3.4rem)',
              fontWeight: 900,
              letterSpacing: '-0.03em',
              lineHeight: 1.15,
              margin: '0 0 0.75rem',
              color: '#ffffff',
            }}
          >
            DISASTERCHAIN
          </h1>

          <p
            style={{
              fontSize: 'clamp(1.1rem, 2.5vw, 1.35rem)',
              color: '#cbd5e1',
              margin: 0,
              fontWeight: 400,
              lineHeight: 1.4,
            }}
          >
            Emergency response, simplified.
          </p>
        </div>

        {/* Primary CTA: EMERGENCY SOS */}
        <div style={{ width: '100%', maxWidth: '440px', marginBottom: '1.25rem' }}>
          <button
            type="button"
            onClick={onOpenSos}
            id="landing-primary-sos-btn"
            aria-label="Send Emergency SOS"
            style={{
              width: '100%',
              minHeight: '56px',
              background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
              color: '#ffffff',
              border: '2px solid rgba(255, 255, 255, 0.35)',
              borderRadius: '14px',
              fontSize: '1.15rem',
              fontWeight: 900,
              letterSpacing: '0.04em',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.65rem',
              boxShadow: '0 10px 30px rgba(239, 68, 68, 0.45), 0 2px 6px rgba(0, 0, 0, 0.5)',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px) scale(1.01)';
              e.currentTarget.style.boxShadow = '0 14px 36px rgba(239, 68, 68, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(239, 68, 68, 0.45)';
            }}
          >
            <span style={{ fontSize: '1.35rem' }}>🚨</span>
            <span>EMERGENCY SOS</span>
          </button>
        </div>

        {/* Secondary Actions */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '0.75rem',
            width: '100%',
            maxWidth: '520px',
            marginBottom: '3rem',
          }}
        >
          <Link
            to="/shelters"
            className="landing-secondary-btn"
            style={{
              flex: '1 1 140px',
              minHeight: '44px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '10px',
              color: '#f1f5f9',
              fontSize: '0.92rem',
              fontWeight: 600,
              textDecoration: 'none',
              padding: '0.6rem 1rem',
              transition: 'all 0.15s ease',
            }}
          >
            <span>🏠</span>
            <span>Find Shelter</span>
          </Link>

          <Link
            to="/alerts"
            className="landing-secondary-btn"
            style={{
              flex: '1 1 140px',
              minHeight: '44px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '10px',
              color: '#f1f5f9',
              fontSize: '0.92rem',
              fontWeight: 600,
              textDecoration: 'none',
              padding: '0.6rem 1rem',
              transition: 'all 0.15s ease',
            }}
          >
            <span>⚠️</span>
            <span>View Alerts</span>
            {activeAlertsCount > 0 && (
              <span
                style={{
                  background: '#ef4444',
                  color: '#fff',
                  fontSize: '0.7rem',
                  padding: '0.1rem 0.4rem',
                  borderRadius: '9999px',
                  fontWeight: 800,
                }}
              >
                {activeAlertsCount}
              </span>
            )}
          </Link>

          <Link
            to="/weather"
            className="landing-secondary-btn"
            style={{
              flex: '1 1 140px',
              minHeight: '44px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '10px',
              color: '#f1f5f9',
              fontSize: '0.92rem',
              fontWeight: 600,
              textDecoration: 'none',
              padding: '0.6rem 1rem',
              transition: 'all 0.15s ease',
            }}
          >
            <span>🌦️</span>
            <span>Weather</span>
          </Link>
        </div>

        {/* THREE COMPACT INFORMATION BLOCKS */}
        <div
          className="landing-compact-blocks"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1rem',
            width: '100%',
            maxWidth: '920px',
            marginBottom: '3rem',
            textAlign: 'left',
          }}
        >
          {/* 1. LOCAL RISK */}
          <div
            style={{
              background: '#15100c',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderTop: `3px solid ${riskStatus.color}`,
              borderRadius: '12px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#94a3b8',
                  marginBottom: '0.4rem',
                }}
              >
                LOCAL RISK
              </div>
              <div
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: riskStatus.color,
                  marginBottom: '0.25rem',
                }}
              >
                {riskStatus.level}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.4 }}>
                {riskStatus.description}
              </div>
            </div>
            <Link
              to="/alerts"
              style={{
                fontSize: '0.78rem',
                color: '#ff6b2c',
                fontWeight: 700,
                textDecoration: 'none',
                marginTop: '1rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}
            >
              <span>View local hazards</span>
              <span>→</span>
            </Link>
          </div>

          {/* 2. NEARBY HELP */}
          <div
            style={{
              background: '#15100c',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderTop: '3px solid #ff6b2c',
              borderRadius: '12px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#94a3b8',
                  marginBottom: '0.4rem',
                }}
              >
                NEARBY HELP
              </div>
              <div
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: '#ffffff',
                  marginBottom: '0.25rem',
                }}
              >
                {shelterCount} shelters nearby
              </div>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.4 }}>
                {nearestDistance} closest shelter with available beds
              </div>
            </div>
            <Link
              to="/shelters"
              style={{
                fontSize: '0.78rem',
                color: '#ff6b2c',
                fontWeight: 700,
                textDecoration: 'none',
                marginTop: '1rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}
            >
              <span>Locate closest shelter</span>
              <span>→</span>
            </Link>
          </div>

          {/* 3. WEATHER */}
          <div
            style={{
              background: '#15100c',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderTop: '3px solid #38bdf8',
              borderRadius: '12px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#94a3b8',
                  marginBottom: '0.4rem',
                }}
              >
                WEATHER
              </div>
              <div
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: '#ffffff',
                  marginBottom: '0.25rem',
                }}
              >
                {weatherInfo.temp}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.4 }}>
                {weatherInfo.condition} • Wind {weatherInfo.wind}
              </div>
            </div>
            <Link
              to="/weather"
              style={{
                fontSize: '0.78rem',
                color: '#ff6b2c',
                fontWeight: 700,
                textDecoration: 'none',
                marginTop: '1rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}
            >
              <span>View full forecast</span>
              <span>→</span>
            </Link>
          </div>
        </div>

        {/* Secondary Links to Operational Command */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '1rem',
            paddingTop: '0.5rem',
          }}
        >
          <Link
            to={isAuthenticated ? '/dashboard' : '/login'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.7rem 1.4rem',
              borderRadius: '10px',
              background: '#ff6b2c',
              color: '#ffffff',
              fontSize: '0.9rem',
              fontWeight: 700,
              textDecoration: 'none',
              minHeight: '44px',
            }}
          >
            <Icon name="activity" size={17} color="#ffffff" />
            <span>View Command Center</span>
          </Link>

          <Link
            to="/affected-areas"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.7rem 1.4rem',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#cbd5e1',
              fontSize: '0.9rem',
              fontWeight: 600,
              textDecoration: 'none',
              minHeight: '44px',
            }}
          >
            <Icon name="map" size={17} color="#cbd5e1" />
            <span>View All Emergency Data</span>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;
