import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polygon,
  Circle,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import Icon from './Icons';
import { useTranslation } from '../i18n/i18n';

// Controller component to smoothly fly/pan map
function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && Array.isArray(center) && center.length === 2 && !isNaN(center[0]) && !isNaN(center[1])) {
      map.flyTo(center, zoom, { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
}

// Controller component for RainViewer radar tile overlay
function RainViewerRadarLayer({ active }) {
  const map = useMap();
  const [radarLayer, setRadarLayer] = useState(null);

  useEffect(() => {
    if (!active) {
      if (radarLayer) {
        map.removeLayer(radarLayer);
        setRadarLayer(null);
      }
      return;
    }

    let isMounted = true;
    fetch('https://api.rainviewer.com/public/weather-maps.json')
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted || !data.radar || !data.radar.past || data.radar.past.length === 0) return;
        const latest = data.radar.past[data.radar.past.length - 1];
        const host = data.host || 'https://tilecache.rainviewer.com';
        const tileUrl = `${host}${latest.path}/256/{z}/{x}/{y}/2/1_1.png`;

        const layer = L.tileLayer(tileUrl, {
          opacity: 0.65,
          zIndex: 10,
          attribution: 'RainViewer Radar',
        });

        layer.addTo(map);
        setRadarLayer(layer);
      })
      .catch((e) => console.warn('RainViewer tiles unavailable:', e.message));

    return () => {
      isMounted = false;
      if (radarLayer) {
        map.removeLayer(radarLayer);
      }
    };
  }, [active, map]);

  return null;
}

// Custom DivIcons
function createCycloneDivIcon(cyclone) {
  const isSevere = cyclone.alertLevel === 'Red' || cyclone.alertLevel === 'Orange';
  const color = isSevere ? '#FF2E4D' : '#FF9900';
  const html = `
    <div class="dc-weather-cyclone-marker ${isSevere ? 'critical-pulse' : ''}" style="
      background: rgba(11, 17, 30, 0.9);
      border: 2px solid ${color};
      border-radius: 50%;
      width: 44px;
      height: 44px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 16px ${color}88;
      cursor: pointer;
    ">
      <span style="font-size: 16px; line-height: 1;">🌀</span>
      <span style="font-size: 8px; font-weight: 800; color: ${color}; font-family: var(--font-mono); margin-top: 2px;">${cyclone.maxWindKmh}k</span>
    </div>
  `;
  return L.divIcon({
    html,
    className: 'custom-cyclone-icon',
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
}

function createDisasterDivIcon(type, alertLevel = 'Green') {
  let iconChar = '⚠';
  let color = '#FFB300';
  if (type === 'EQ') { iconChar = '⚡'; color = '#FF6B2C'; }
  else if (type === 'FL') { iconChar = '🌊'; color = '#00E5FF'; }
  else if (type === 'VO') { iconChar = '🌋'; color = '#FF2E4D'; }
  else if (type === 'WF') { iconChar = '🔥'; color = '#FF5722'; }

  const html = `
    <div style="
      background: rgba(11, 17, 30, 0.92);
      border: 1.5px solid ${color};
      border-radius: 20px;
      padding: 2px 7px;
      display: flex;
      align-items: center;
      gap: 4px;
      color: #ffffff;
      font-size: 11px;
      font-weight: 700;
      box-shadow: 0 0 10px ${color}66;
    ">
      <span>${iconChar}</span>
      <span style="font-size: 9px; font-family: var(--font-mono);">${type}</span>
    </div>
  `;
  return L.divIcon({
    html,
    className: 'custom-disaster-icon',
    iconSize: [48, 24],
    iconAnchor: [24, 12],
  });
}

function createUserLocationDivIcon() {
  const html = `
    <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
      <div style="position: absolute; width: 32px; height: 32px; border-radius: 50%; background: rgba(0, 229, 255, 0.3); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      <div style="width: 14px; height: 14px; border-radius: 50%; background: var(--cyan); border: 2.5px solid #ffffff; box-shadow: 0 0 10px var(--cyan);"></div>
    </div>
  `;
  return L.divIcon({
    html,
    className: 'user-location-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

function createTelemetryDivIcon(type, value, unit, color = 'var(--cyan)') {
  const html = `
    <div style="
      background: rgba(11, 17, 30, 0.88);
      border: 1px solid ${color};
      border-radius: var(--radius-xs);
      padding: 2px 6px;
      font-size: 11px;
      font-weight: 800;
      color: #ffffff;
      font-family: var(--font-mono);
      display: flex;
      align-items: center;
      gap: 3px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.5);
    ">
      <span>${type === 'temp' ? '🌡' : type === 'wind' ? '💨' : '☁'}</span>
      <span style="color: ${color};">${value}${unit}</span>
    </div>
  `;
  return L.divIcon({
    html,
    className: 'telemetry-sample-icon',
    iconSize: [54, 22],
    iconAnchor: [27, 11],
  });
}

// Representative Indian & Global weather sample nodes for layer display
const SAMPLE_WEATHER_NODES = [
  { name: 'Delhi', lat: 28.6139, lon: 77.2090, temp: 31, wind: 18, clouds: 42 },
  { name: 'Mumbai', lat: 19.0760, lon: 72.8777, temp: 30, wind: 24, clouds: 75 },
  { name: 'Kolkata', lat: 22.5726, lon: 88.3639, temp: 32, wind: 12, clouds: 60 },
  { name: 'Chennai', lat: 13.0827, lon: 80.2707, temp: 33, wind: 16, clouds: 35 },
  { name: 'Bengaluru', lat: 12.9716, lon: 77.5946, temp: 26, wind: 14, clouds: 55 },
  { name: 'Hyderabad', lat: 17.3850, lon: 78.4867, temp: 29, wind: 15, clouds: 48 },
  { name: 'Tokyo', lat: 35.6762, lon: 139.6503, temp: 24, wind: 20, clouds: 30 },
  { name: 'London', lat: 51.5074, lon: -0.1278, temp: 19, wind: 15, clouds: 65 },
  { name: 'New York', lat: 40.7128, lon: -74.0060, temp: 25, wind: 14, clouds: 40 },
  { name: 'Sydney', lat: -33.8688, lon: 151.2093, temp: 17, wind: 22, clouds: 50 },
  { name: 'Dubai', lat: 25.2048, lon: 55.2708, temp: 39, wind: 18, clouds: 10 },
  { name: 'Singapore', lat: 1.3521, lon: 103.8198, temp: 31, wind: 10, clouds: 80 },
];

export default function WeatherMap({
  userCoords,
  selectedLocation,
  currentWeather,
  cyclones = [],
  disasters = [],
  selectedCyclone,
  onSelectCyclone,
}) {
  const { t } = useTranslation();

  // Active layer toggles
  const [activeLayer, setActiveLayer] = useState('cyclones'); // 'temp' | 'wind' | 'clouds' | 'precip' | 'cyclones' | 'disasters'
  const [showUserLocation, setShowUserLocation] = useState(true);

  // Map viewport state
  const defaultCenter = useMemo(() => {
    if (selectedLocation?.latitude != null && selectedLocation?.longitude != null) {
      return [selectedLocation.latitude, selectedLocation.longitude];
    }
    if (userCoords?.latitude != null && userCoords?.longitude != null) {
      return [userCoords.latitude, userCoords.longitude];
    }
    return [20.5937, 78.9629]; // Center of India / Global perspective
  }, [selectedLocation, userCoords]);

  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapZoom, setMapZoom] = useState(4);

  // When selected location changes, smoothly pan
  useEffect(() => {
    if (selectedLocation?.latitude != null && selectedLocation?.longitude != null) {
      setMapCenter([selectedLocation.latitude, selectedLocation.longitude]);
      setMapZoom(7);
    }
  }, [selectedLocation]);

  // When a cyclone is clicked, focus on it
  useEffect(() => {
    if (selectedCyclone?.latitude != null && selectedCyclone?.longitude != null) {
      setMapCenter([selectedCyclone.latitude, selectedCyclone.longitude]);
      setMapZoom(6);
    }
  }, [selectedCyclone]);

  const handleFitWorld = () => {
    setMapCenter([20, 0]);
    setMapZoom(2);
  };

  const handleFitIndia = () => {
    setMapCenter([22.5, 79.5]);
    setMapZoom(5);
  };

  const handleFitMyLocation = () => {
    if (userCoords?.latitude != null && userCoords?.longitude != null) {
      setMapCenter([userCoords.latitude, userCoords.longitude]);
      setMapZoom(8);
      setShowUserLocation(true);
    }
  };

  const handleFitCyclones = () => {
    if (cyclones && cyclones.length > 0) {
      const first = cyclones[0];
      setMapCenter([first.latitude, first.longitude]);
      setMapZoom(4);
      setActiveLayer('cyclones');
    }
  };

  return (
    <div
      className="spatial-panel"
      style={{
        padding: '0',
        overflow: 'hidden',
        position: 'relative',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
        background: '#090d16',
      }}
    >
      {/* Tactical Map Header & Controls HUD */}
      <div
        style={{
          padding: '0.85rem 1.25rem',
          background: 'rgba(11, 17, 30, 0.95)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          zIndex: 400,
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '1.2rem' }}>🌐</span>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {t('weather.globalMapTitle', 'GLOBAL ATMOSPHERIC & CYCLONE MAP')}
            </h3>
          </div>
          <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
            {activeLayer.toUpperCase()}
          </span>
        </div>

        {/* Preset Quick Centers */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleFitWorld}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
          >
            🌍 {t('weather.mapWorld', 'WORLD')}
          </button>
          <button
            type="button"
            onClick={handleFitIndia}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
          >
            🇮🇳 {t('weather.mapIndia', 'INDIA')}
          </button>
          {userCoords && (
            <button
              type="button"
              onClick={handleFitMyLocation}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
            >
              📍 {t('weather.myLocation', 'MY LOCATION')}
            </button>
          )}
          {cyclones.length > 0 && (
            <button
              type="button"
              onClick={handleFitCyclones}
              className="btn btn-emergency btn-sm"
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
            >
              🌀 {t('weather.fitCyclones', 'CYCLONES')} ({cyclones.length})
            </button>
          )}
        </div>
      </div>

      {/* Layer Selector Bar */}
      <div
        style={{
          padding: '0.5rem 1.25rem',
          background: 'rgba(5, 8, 14, 0.92)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          gap: '0.5rem',
          overflowX: 'auto',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, whiteSpace: 'nowrap' }}>
          {t('weather.layers', 'LAYERS')}:
        </span>

        {[
          { id: 'cyclones', label: t('weather.layerCyclones', '🌀 CYCLONES'), count: cyclones.length },
          { id: 'precip', label: t('weather.layerPrecipitation', '🌧️ RADAR PRECIPITATION') },
          { id: 'temp', label: t('weather.layerTemperature', '🌡️ TEMPERATURE') },
          { id: 'wind', label: t('weather.layerWind', '💨 WIND FIELD') },
          { id: 'clouds', label: t('weather.layerClouds', '☁️ CLOUD COVER') },
          { id: 'disasters', label: t('weather.layerDisasters', '⚠ GDACS EVENTS'), count: disasters.length },
        ].map((layer) => {
          const isActive = activeLayer === layer.id;
          return (
            <button
              key={layer.id}
              type="button"
              onClick={() => setActiveLayer(layer.id)}
              className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                fontSize: '0.75rem',
                padding: '0.3rem 0.75rem',
                whiteSpace: 'nowrap',
                borderColor: isActive ? 'var(--primary)' : 'var(--border-subtle)',
              }}
            >
              {layer.label} {layer.count != null ? `(${layer.count})` : ''}
            </button>
          );
        })}
      </div>

      {/* Leaflet Map Canvas */}
      <div style={{ height: '480px', width: '100%', position: 'relative' }}>
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%', background: '#090d16' }}
        >
          <MapController center={mapCenter} zoom={mapZoom} />

          {/* CartoDB Dark Matter base tiles */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
            maxZoom={18}
          />

          {/* RainViewer Live Radar Overlay */}
          <RainViewerRadarLayer active={activeLayer === 'precip'} />

          {/* User Location Marker */}
          {showUserLocation && userCoords?.latitude != null && userCoords?.longitude != null && (
            <Marker
              position={[userCoords.latitude, userCoords.longitude]}
              icon={createUserLocationDivIcon()}
            >
              <Popup>
                <div style={{ color: '#090d16', padding: '0.25rem' }}>
                  <strong>📍 {t('weather.yourLocation', 'YOUR LOCATION')}</strong>
                  <div style={{ fontSize: '0.8rem', marginTop: '0.2rem' }}>
                    {selectedLocation?.city || 'Coordinates'}: [{userCoords.latitude.toFixed(3)}, {userCoords.longitude.toFixed(3)}]
                  </div>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Active Tropical Cyclones Markers & CAP Track Polygons */}
          {activeLayer === 'cyclones' && cyclones.map((c) => (
            <React.Fragment key={c.id}>
              <Marker
                position={[c.latitude, c.longitude]}
                icon={createCycloneDivIcon(c)}
                eventHandlers={{
                  click: () => onSelectCyclone && onSelectCyclone(c),
                }}
              >
                <Popup>
                  <div style={{ color: '#090d16', minWidth: '180px' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#c62828' }}>
                      🌀 {c.name}
                    </div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, margin: '0.2rem 0' }}>
                      {c.category}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#444' }}>
                      • Max Wind: <strong>{c.maxWindKmh} km/h</strong><br />
                      • Basin / Country: <strong>{c.country}</strong><br />
                      • Alert Level: <strong>{c.alertLevel}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelectCyclone && onSelectCyclone(c)}
                      style={{
                        marginTop: '0.5rem',
                        width: '100%',
                        padding: '0.35rem',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: '#c62828',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      {t('weather.viewDetails', 'VIEW INTELLIGENCE')}
                    </button>
                  </div>
                </Popup>
              </Marker>

              {/* Draw CAP track polygon if available */}
              {c.trackPolygon && c.trackPolygon.length > 2 && (
                <Polygon
                  positions={c.trackPolygon}
                  pathOptions={{
                    color: c.alertLevel === 'Red' ? '#FF2E4D' : '#FF9900',
                    weight: 2,
                    fillOpacity: 0.2,
                    dashArray: '4, 4',
                  }}
                />
              )}
            </React.Fragment>
          ))}

          {/* GDACS Global Disaster Events */}
          {activeLayer === 'disasters' && disasters.map((ev) => (
            <Marker
              key={ev.id}
              position={[ev.latitude, ev.longitude]}
              icon={createDisasterDivIcon(ev.eventType, ev.alertLevel)}
            >
              <Popup>
                <div style={{ color: '#090d16', minWidth: '160px' }}>
                  <strong>{ev.title}</strong>
                  <div style={{ fontSize: '0.75rem', color: '#555', marginTop: '0.25rem' }}>
                    Type: <strong>{ev.eventType}</strong> • {ev.country}<br />
                    Severity: {ev.severityText || 'Active'}<br />
                    Alert Level: <strong>{ev.alertLevel}</strong>
                  </div>
                  {ev.link && (
                    <a
                      href={ev.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '0.75rem', color: '#0077cc', display: 'inline-block', marginTop: '0.4rem' }}
                    >
                      GDACS Report ↗
                    </a>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Temperature Layer */}
          {activeLayer === 'temp' && SAMPLE_WEATHER_NODES.map((node) => (
            <Marker
              key={node.name}
              position={[node.lat, node.lon]}
              icon={createTelemetryDivIcon('temp', node.temp, '°C', node.temp > 35 ? 'var(--crimson)' : 'var(--amber)')}
            >
              <Popup>
                <div style={{ color: '#090d16' }}>
                  <strong>{node.name}</strong>: {node.temp}°C
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Wind Layer */}
          {activeLayer === 'wind' && SAMPLE_WEATHER_NODES.map((node) => (
            <Marker
              key={node.name}
              position={[node.lat, node.lon]}
              icon={createTelemetryDivIcon('wind', node.wind, 'km/h', 'var(--cyan)')}
            >
              <Popup>
                <div style={{ color: '#090d16' }}>
                  <strong>{node.name}</strong>: Wind {node.wind} km/h
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Clouds Layer */}
          {activeLayer === 'clouds' && SAMPLE_WEATHER_NODES.map((node) => (
            <Marker
              key={node.name}
              position={[node.lat, node.lon]}
              icon={createTelemetryDivIcon('cloud', node.clouds, '%', 'var(--text-secondary)')}
            >
              <Popup>
                <div style={{ color: '#090d16' }}>
                  <strong>{node.name}</strong>: Cloud Cover {node.clouds}%
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Map Legend Footer */}
      <div
        style={{
          padding: '0.65rem 1.25rem',
          background: 'rgba(11, 17, 30, 0.95)',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          fontSize: '0.75rem',
          color: 'var(--text-secondary)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <span><strong>LEGEND:</strong></span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FF2E4D' }} />
            {t('weather.severeStorm', 'Severe Cyclone (Red/Orange)')}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FF9900' }} />
            {t('weather.moderateStorm', 'Tropical Storm (Green)')}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--cyan)' }} />
            {t('weather.myLocation', 'User GPS')}
          </span>
        </div>

        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          {t('weather.sourcesAttribution', 'OpenStreetMap • GDACS TC Feed • RainViewer Radar')}
        </div>
      </div>
    </div>
  );
}
