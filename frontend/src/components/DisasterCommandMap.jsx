import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import Icon from './Icons';
import {
  WORLD_COUNTRIES,
  WORLD_CITIES,
  searchGeographicLocations,
  computeSpatialEmergencyTelemetry,
} from '../data/worldGeoData';
import MapLocationPanel from './MapLocationPanel';
import ErrorBoundary from './ErrorBoundary';

// Leaflet default icon fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom SVG-based Tactical Map Markers
const createTacticalDivIcon = (type, severity = 'High', label = '') => {
  let bgColor = '#FF6B2C';
  let iconSvg = '🚨';
  let pulseClass = '';

  if (type === 'sos') {
    bgColor = severity === 'Critical' ? '#E53935' : '#FF6B2C';
    iconSvg = '🚨';
    pulseClass = severity === 'Critical' ? 'marker-pulse-critical' : '';
  } else if (type === 'shelter') {
    bgColor = '#84CC16';
    iconSvg = '🏛️';
  } else if (type === 'incident') {
    bgColor = '#F59E0B';
    iconSvg = '⚠️';
  } else if (type === 'user') {
    bgColor = '#3B82F6';
    iconSvg = '📍';
  }

  const html = `
    <div class="tactical-marker-pin ${pulseClass}" style="
      background: ${bgColor};
      width: 32px;
      height: 32px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.6), 0 0 10px ${bgColor}80;
      border: 2px solid #ffffff;
      cursor: pointer;
    ">
      <span style="
        transform: rotate(45deg);
        font-size: 14px;
        line-height: 1;
      ">${iconSvg}</span>
    </div>
  `;

  return L.divIcon({
    className: 'custom-tactical-marker',
    html,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

/**
 * Controller helper to interact directly with Leaflet Map instance
 */
const MapViewController = ({
  centerTarget,
  boundsTarget,
  zoomTarget,
}) => {
  const map = useMap();

  useEffect(() => {
    if (boundsTarget && boundsTarget.length > 0) {
      try {
        const bounds = L.latLngBounds(boundsTarget);
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12, animate: true, duration: 0.6 });
        }
      } catch (err) {
        console.warn('Invalid bounds target:', err);
      }
    }
  }, [boundsTarget, map]);

  useEffect(() => {
    if (centerTarget && centerTarget.lat != null && centerTarget.lon != null) {
      map.flyTo([centerTarget.lat, centerTarget.lon], zoomTarget || 10, {
        duration: 0.6,
        easeLinearity: 0.25,
      });
    }
  }, [centerTarget, zoomTarget, map]);

  return null;
};

/**
 * Professional 2D Emergency Operations Command Map
 * Fully functional, responsive, high-performance GIS interface powered by Leaflet & OpenStreetMap.
 */
const DisasterCommandMapContent = ({
  sosList = [],
  sosRequests = [],
  shelters = [],
  incidents = [],
  affectedAreas = [],
  alerts = [],
  riskZones = [],
  intelligenceList = [],
  focusTarget = null,
  isLoading = false,
  error = null,
  onRetry = () => {},
  onOpenShelter = () => {},
  onOpenIncident = () => {},
  onOpenSos = () => {},
  onSelectEntity = () => {},
  onNavigate = () => {},
}) => {
  const mapRef = useRef(null);

  // Safe prop arrays
  const activeSosList = Array.isArray(sosList) && sosList.length > 0 ? sosList : Array.isArray(sosRequests) ? sosRequests : [];
  const safeShelters = Array.isArray(shelters) ? shelters : [];
  const safeIncidents = Array.isArray(incidents) ? incidents : [];
  const safeAreas = Array.isArray(affectedAreas) ? affectedAreas : [];
  const safeAlerts = Array.isArray(alerts) ? alerts : [];
  const safeRiskZones = Array.isArray(riskZones) ? riskZones : [];

  // Map state
  const [centerTarget, setCenterTarget] = useState({ lat: 21.5937, lon: 78.9629 });
  const [zoomTarget, setZoomTarget] = useState(5);
  const [boundsTarget, setBoundsTarget] = useState(null);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [selectedType, setSelectedType] = useState('city');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  // Layer toggles
  const [layers, setLayers] = useState({
    sos: true,
    shelters: true,
    incidents: true,
    affectedAreas: true,
    risk: true,
  });

  const toggleLayer = (layerKey) => {
    setLayers((prev) => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  // Compute live telemetry for selected entity
  const selectedTelemetry = useMemo(() => {
    if (!selectedEntity) return null;
    const lat = selectedEntity.lat ?? selectedEntity.latitude;
    const lon = selectedEntity.lon ?? selectedEntity.longitude;
    if (lat == null || lon == null) return null;

    return computeSpatialEmergencyTelemetry({
      lat,
      lon,
      radiusKm: 180,
      sosList: activeSosList,
      incidents: safeIncidents,
      shelters: safeShelters,
      alerts: safeAlerts,
      riskZones: safeRiskZones,
    });
  }, [selectedEntity, activeSosList, safeIncidents, safeShelters, safeAlerts, safeRiskZones]);

  // Handle entity selection
  const handleSelectEntity = useCallback((entity, type) => {
    setSelectedEntity(entity);
    setSelectedType(type);
    if (onSelectEntity) onSelectEntity(entity);
  }, [onSelectEntity]);

  // Navigation Presets
  const handleFocusIndia = () => {
    setBoundsTarget(null);
    setCenterTarget({ lat: 21.5937, lon: 78.9629 });
    setZoomTarget(5);
    const india = WORLD_COUNTRIES.find((c) => c.id === 'IND');
    if (india) handleSelectEntity(india, 'country');
  };

  const handleFocusWorld = () => {
    setBoundsTarget(null);
    setCenterTarget({ lat: 20.0, lon: 0.0 });
    setZoomTarget(2);
    setSelectedEntity(null);
  };

  const handleFocusUserLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLat = pos.coords.latitude;
        const userLon = pos.coords.longitude;
        setUserLocation({ lat: userLat, lon: userLon });
        setBoundsTarget(null);
        setCenterTarget({ lat: userLat, lon: userLon });
        setZoomTarget(13);
        handleSelectEntity({
          name: 'Your Current Location',
          subtitle: 'Active GPS Coordinates',
          lat: userLat,
          lon: userLon,
        }, 'city');
      },
      (err) => {
        console.warn('Geolocation permission denied:', err.message);
      }
    );
  };

  // Fit active incidents bounds
  const handleFitActiveIncidents = () => {
    const coords = [];

    activeSosList.forEach((s) => {
      if (s.latitude != null && s.longitude != null) coords.push([s.latitude, s.longitude]);
    });
    safeIncidents.forEach((i) => {
      if (i.latitude != null && i.longitude != null) coords.push([i.latitude, i.longitude]);
    });
    safeAreas.forEach((a) => {
      if (a.latitude != null && a.longitude != null) coords.push([a.latitude, a.longitude]);
    });
    safeShelters.forEach((sh) => {
      if (sh.latitude != null && sh.longitude != null) coords.push([sh.latitude, sh.longitude]);
    });

    if (coords.length === 0) {
      handleFocusIndia();
      return;
    }

    setBoundsTarget(coords);
  };

  // Search Input Handler
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.trim().length > 0) {
      const matches = searchGeographicLocations(val, 6);
      setSearchResults(matches);
      setIsSearching(true);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (result) => {
    setSearchQuery(result.name);
    setIsSearching(false);
    setBoundsTarget(null);
    setCenterTarget({ lat: result.lat, lon: result.lon });
    setZoomTarget(result.type === 'country' ? 4 : 11);
    handleSelectEntity(result, result.type);
  };

  // External focus triggers (AI assistant, cards, global events)
  useEffect(() => {
    const handleGlobalFocus = (e) => {
      if (e.detail) {
        const { lat, lon, zoom, entity, type } = e.detail;
        if (lat != null && lon != null) {
          setBoundsTarget(null);
          setCenterTarget({ lat, lon });
          setZoomTarget(zoom || 11);
          if (entity) handleSelectEntity(entity, type || 'city');
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('disasterchain:map-focus', handleGlobalFocus);
      window.addEventListener('disasterchain:globe-focus', handleGlobalFocus);
      return () => {
        window.removeEventListener('disasterchain:map-focus', handleGlobalFocus);
        window.removeEventListener('disasterchain:globe-focus', handleGlobalFocus);
      };
    }
  }, [handleSelectEntity]);

  // FocusTarget prop changes
  useEffect(() => {
    if (focusTarget && (focusTarget.latitude != null || focusTarget.lat != null)) {
      const lat = focusTarget.latitude ?? focusTarget.lat;
      const lon = focusTarget.longitude ?? focusTarget.lon;
      setBoundsTarget(null);
      setCenterTarget({ lat, lon });
      setZoomTarget(11);
      handleSelectEntity(focusTarget, focusTarget.type?.toLowerCase() || 'city');
    }
  }, [focusTarget, handleSelectEntity]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '560px',
        minHeight: '480px',
        background: '#120B08',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        border: '1px solid var(--border-medium)',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.9), inset 0 0 40px rgba(0, 0, 0, 0.6)',
      }}
    >
      {/* MAP HEADER / LIVE INTELLIGENCE BANNER */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '42px',
          background: 'rgba(18, 11, 8, 0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border-subtle)',
          zIndex: 500,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              display: 'inline-block',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#84CC16',
              boxShadow: '0 0 8px #84CC16',
            }}
          />
          <span style={{ fontWeight: 800, fontSize: '0.82rem', letterSpacing: '0.04em', color: '#ffffff' }}>
            DISASTER MAP
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>
            | LIVE OPERATIONAL INTELLIGENCE
          </span>
        </div>

        {/* Live Counters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.72rem', fontWeight: 700 }}>
          <span style={{ color: 'var(--crimson)' }}>
            SOS: <strong style={{ color: '#ffffff' }}>{activeSosList.length}</strong>
          </span>
          <span style={{ color: 'var(--amber)' }}>
            INCIDENTS: <strong style={{ color: '#ffffff' }}>{safeIncidents.length}</strong>
          </span>
          <span style={{ color: 'var(--safe)' }}>
            SHELTERS: <strong style={{ color: '#ffffff' }}>{safeShelters.length}</strong>
          </span>
          <span style={{ color: 'var(--orange-primary)' }}>
            RISK ZONES: <strong style={{ color: '#ffffff' }}>{safeRiskZones.length}</strong>
          </span>
        </div>
      </div>

      {/* TOP LEFT: Geospatial Search */}
      <div
        style={{
          position: 'absolute',
          top: '52px',
          left: '14px',
          zIndex: 500,
          width: '280px',
        }}
      >
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="🔍 Search City or Country..."
            style={{
              width: '100%',
              background: 'rgba(18, 11, 8, 0.94)',
              backdropFilter: 'blur(12px)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-xs)',
              padding: '0.6rem 0.8rem',
              color: '#ffffff',
              fontSize: '0.82rem',
              fontWeight: 600,
              outline: 'none',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.6)',
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setIsSearching(false);
              }}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '0.8rem',
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {isSearching && searchResults.length > 0 && (
          <div
            style={{
              marginTop: '4px',
              background: 'rgba(18, 11, 8, 0.98)',
              backdropFilter: 'blur(16px)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-xs)',
              maxHeight: '220px',
              overflowY: 'auto',
              boxShadow: '0 12px 24px rgba(0, 0, 0, 0.85)',
            }}
          >
            {searchResults.map((res) => (
              <div
                key={res.id}
                onClick={() => handleSelectSearchResult(res)}
                style={{
                  padding: '0.55rem 0.85rem',
                  borderBottom: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '6px',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 107, 44, 0.15)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#ffffff' }}>
                    {res.name}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                    {res.subtitle}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    color: res.type === 'country' ? 'var(--orange-primary)' : 'var(--text-muted)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    padding: '2px 6px',
                    borderRadius: 'var(--radius-xs)',
                  }}
                >
                  {res.type === 'country' ? 'COUNTRY' : 'CITY'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TOP RIGHT: Command Presets Bar */}
      <div
        style={{
          position: 'absolute',
          top: '52px',
          right: selectedEntity ? '370px' : '14px',
          zIndex: 500,
          display: 'flex',
          gap: '6px',
          transition: 'right 0.2s ease',
        }}
      >
        <button
          type="button"
          onClick={handleFocusIndia}
          className="btn btn-secondary btn-sm"
          style={{
            background: 'rgba(18, 11, 8, 0.92)',
            color: '#ffffff',
            borderColor: 'var(--orange-primary)',
            fontWeight: 800,
            fontSize: '0.74rem',
            padding: '4px 10px',
          }}
          title="Center Indian Subcontinent"
        >
          🇮🇳 INDIA
        </button>

        <button
          type="button"
          onClick={handleFocusWorld}
          className="btn btn-secondary btn-sm"
          style={{
            background: 'rgba(18, 11, 8, 0.92)',
            color: '#ffffff',
            fontSize: '0.74rem',
            padding: '4px 10px',
          }}
          title="Global Overview"
        >
          🌐 WORLD
        </button>

        <button
          type="button"
          onClick={handleFocusUserLocation}
          className="btn btn-secondary btn-sm"
          style={{
            background: 'rgba(18, 11, 8, 0.92)',
            color: '#ffffff',
            fontSize: '0.74rem',
            padding: '4px 10px',
          }}
          title="Center My Location"
        >
          📍 MY LOCATION
        </button>

        <button
          type="button"
          onClick={handleFitActiveIncidents}
          className="btn btn-secondary btn-sm"
          style={{
            background: 'rgba(18, 11, 8, 0.92)',
            color: 'var(--orange-primary)',
            borderColor: 'var(--orange-primary)',
            fontSize: '0.74rem',
            padding: '4px 10px',
          }}
          title="Fit bounds to all active emergency events"
        >
          🎯 FIT ACTIVE INCIDENTS
        </button>
      </div>

      {/* BOTTOM LEFT: Live Layer Filter Bar */}
      <div
        style={{
          position: 'absolute',
          bottom: '14px',
          left: '14px',
          zIndex: 500,
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
          maxWidth: '580px',
        }}
      >
        <button
          type="button"
          onClick={() => toggleLayer('sos')}
          style={{
            background: layers.sos ? 'rgba(229, 57, 53, 0.25)' : 'rgba(18, 11, 8, 0.85)',
            border: `1px solid ${layers.sos ? 'var(--crimson)' : 'var(--border-subtle)'}`,
            color: layers.sos ? 'var(--crimson)' : 'var(--text-muted)',
            padding: '4px 10px',
            borderRadius: 'var(--radius-xs)',
            fontSize: '0.72rem',
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          🚨 SOS ({activeSosList.length})
        </button>

        <button
          type="button"
          onClick={() => toggleLayer('shelters')}
          style={{
            background: layers.shelters ? 'rgba(132, 204, 22, 0.25)' : 'rgba(18, 11, 8, 0.85)',
            border: `1px solid ${layers.shelters ? 'var(--safe)' : 'var(--border-subtle)'}`,
            color: layers.shelters ? 'var(--safe)' : 'var(--text-muted)',
            padding: '4px 10px',
            borderRadius: 'var(--radius-xs)',
            fontSize: '0.72rem',
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          🏛️ SHELTERS ({safeShelters.length})
        </button>

        <button
          type="button"
          onClick={() => toggleLayer('incidents')}
          style={{
            background: layers.incidents ? 'rgba(245, 158, 11, 0.25)' : 'rgba(18, 11, 8, 0.85)',
            border: `1px solid ${layers.incidents ? 'var(--amber)' : 'var(--border-subtle)'}`,
            color: layers.incidents ? 'var(--amber)' : 'var(--text-muted)',
            padding: '4px 10px',
            borderRadius: 'var(--radius-xs)',
            fontSize: '0.72rem',
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          ⚠️ INCIDENTS ({safeIncidents.length})
        </button>

        <button
          type="button"
          onClick={() => toggleLayer('affectedAreas')}
          style={{
            background: layers.affectedAreas ? 'rgba(255, 107, 44, 0.25)' : 'rgba(18, 11, 8, 0.85)',
            border: `1px solid ${layers.affectedAreas ? 'var(--orange-primary)' : 'var(--border-subtle)'}`,
            color: layers.affectedAreas ? 'var(--orange-primary)' : 'var(--text-muted)',
            padding: '4px 10px',
            borderRadius: 'var(--radius-xs)',
            fontSize: '0.72rem',
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          🔥 HAZARDS ({safeAreas.length})
        </button>

        <button
          type="button"
          onClick={() => toggleLayer('risk')}
          style={{
            background: layers.risk ? 'rgba(245, 158, 11, 0.25)' : 'rgba(18, 11, 8, 0.85)',
            border: `1px solid ${layers.risk ? 'var(--amber)' : 'var(--border-subtle)'}`,
            color: layers.risk ? 'var(--amber)' : 'var(--text-muted)',
            padding: '4px 10px',
            borderRadius: 'var(--radius-xs)',
            fontSize: '0.72rem',
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          🌡️ RISK GRID
        </button>
      </div>

      {/* ERROR / RETRY OVERLAY */}
      {error && (
        <div
          style={{
            position: 'absolute',
            top: '50px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(229, 57, 53, 0.95)',
            color: '#ffffff',
            padding: '8px 16px',
            borderRadius: 'var(--radius-xs)',
            zIndex: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.8rem',
            fontWeight: 700,
          }}
        >
          <span>Unable to load live operational data.</span>
          <button
            type="button"
            onClick={onRetry}
            style={{
              background: '#ffffff',
              color: '#E53935',
              border: 'none',
              borderRadius: '2px',
              padding: '2px 8px',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            ↻ RETRY
          </button>
        </div>
      )}

      {/* LEAFLET MAP CONTAINER */}
      <MapContainer
        ref={mapRef}
        center={[21.5937, 78.9629]}
        zoom={5}
        scrollWheelZoom={true}
        wheelPxPerZoomLevel={60}
        zoomDelta={1}
        zoomSnap={0.5}
        style={{
          width: '100%',
          height: '100%',
          paddingTop: '42px',
          background: '#120B08',
        }}
      >
        <MapViewController
          centerTarget={centerTarget}
          boundsTarget={boundsTarget}
          zoomTarget={zoomTarget}
        />

        {/* Keyless OpenStreetMap Tile Layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* 1. SOS DISTRESS CALLS */}
        {layers.sos &&
          activeSosList.map((sos, idx) => {
            if (sos.latitude == null || sos.longitude == null) return null;
            const key = sos._id || sos.id || `sos-${idx}`;
            return (
              <Marker
                key={key}
                position={[sos.latitude, sos.longitude]}
                icon={createTacticalDivIcon('sos', sos.severity || 'Critical')}
                eventHandlers={{
                  click: () => handleSelectEntity(sos, 'sos'),
                }}
              >
                <Popup className="tactical-popup">
                  <div style={{ color: '#120B08', padding: '4px' }}>
                    <div style={{ fontWeight: 800, color: '#E53935' }}>
                      🚨 SOS DISTRESS [{sos.severity?.toUpperCase() || 'CRITICAL'}]
                    </div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                      {sos.type || 'Emergency Dispatch'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#666', marginTop: '2px' }}>
                      {sos.location || `${sos.latitude.toFixed(4)}, ${sos.longitude.toFixed(4)}`}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {/* 2. SAFE SHELTERS */}
        {layers.shelters &&
          safeShelters.map((sh, idx) => {
            if (sh.latitude == null || sh.longitude == null) return null;
            const key = sh._id || sh.id || `shelter-${idx}`;
            return (
              <Marker
                key={key}
                position={[sh.latitude, sh.longitude]}
                icon={createTacticalDivIcon('shelter')}
                eventHandlers={{
                  click: () => handleSelectEntity(sh, 'shelter'),
                }}
              >
                <Popup className="tactical-popup">
                  <div style={{ color: '#120B08', padding: '4px' }}>
                    <div style={{ fontWeight: 800, color: '#65A30D' }}>
                      🏛️ {sh.name || 'Emergency Shelter'}
                    </div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600 }}>
                      Available Beds: {sh.availableBeds ?? (sh.capacity ? sh.capacity - (sh.occupancy || 0) : 'Available')}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#666' }}>
                      {sh.location || sh.address}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {/* 3. FIELD INCIDENTS */}
        {layers.incidents &&
          safeIncidents.map((inc, idx) => {
            if (inc.latitude == null || inc.longitude == null) return null;
            const key = inc._id || inc.id || `inc-${idx}`;
            return (
              <Marker
                key={key}
                position={[inc.latitude, inc.longitude]}
                icon={createTacticalDivIcon('incident', inc.severity)}
                eventHandlers={{
                  click: () => handleSelectEntity(inc, 'incident'),
                }}
              >
                <Popup className="tactical-popup">
                  <div style={{ color: '#120B08', padding: '4px' }}>
                    <div style={{ fontWeight: 800, color: '#D97706' }}>
                      ⚠️ {inc.title || inc.type || 'Incident Report'}
                    </div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                      Severity: {inc.severity || 'Medium'} | Status: {inc.status || 'Active'}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {/* 4. AFFECTED HAZARD PERIMETERS */}
        {layers.affectedAreas &&
          safeAreas.map((area, idx) => {
            if (area.latitude == null || area.longitude == null) return null;
            const key = area._id || area.id || `area-${idx}`;
            const isCritical = area.severity === 'Critical';
            const radiusMeters = (area.radiusKm || 25) * 1000;
            return (
              <Circle
                key={key}
                center={[area.latitude, area.longitude]}
                radius={radiusMeters}
                pathOptions={{
                  color: isCritical ? '#E53935' : '#FF6B2C',
                  fillColor: isCritical ? '#E53935' : '#FF6B2C',
                  fillOpacity: 0.18,
                  weight: 2,
                }}
                eventHandlers={{
                  click: () => handleSelectEntity(area, 'area'),
                }}
              />
            );
          })}

        {/* 5. RISK INTELLIGENCE OVERLAYS */}
        {layers.risk &&
          safeRiskZones.map((rz, idx) => {
            if (rz.latitude == null || rz.longitude == null) return null;
            const key = `risk-${idx}`;
            const riskColor =
              rz.riskLevel === 'CRITICAL'
                ? '#E53935'
                : rz.riskLevel === 'HIGH'
                ? '#FF6B2C'
                : '#F59E0B';
            return (
              <Circle
                key={key}
                center={[rz.latitude, rz.longitude]}
                radius={40000}
                pathOptions={{
                  color: riskColor,
                  fillColor: riskColor,
                  fillOpacity: 0.15,
                  weight: 1,
                  dashArray: '4, 4',
                }}
                eventHandlers={{
                  click: () => handleSelectEntity(rz, 'riskZone'),
                }}
              />
            );
          })}

        {/* USER LOCATION MARKER */}
        {userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lon]}
            icon={createTacticalDivIcon('user')}
          >
            <Popup>
              <div style={{ color: '#120B08', fontWeight: 800 }}>📍 Your GPS Location</div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* SELECTED ENTITY DETAIL PANEL */}
      {selectedEntity && (
        <MapLocationPanel
          entity={selectedEntity}
          type={selectedType}
          telemetry={selectedTelemetry}
          onClose={() => setSelectedEntity(null)}
          onOpenShelter={onOpenShelter}
          onOpenIncident={onOpenIncident}
          onOpenSos={onOpenSos}
          onNavigate={onNavigate}
        />
      )}
    </div>
  );
};

const DisasterCommandMap = (props) => (
  <ErrorBoundary
    fallback={(error, reset) => (
      <div
        className="spatial-panel"
        style={{
          width: '100%',
          height: '480px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#120B08',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-md)',
          padding: '2rem',
          textAlign: 'center',
        }}
      >
        <div style={{ color: 'var(--orange-primary)', fontSize: '2.5rem', marginBottom: '0.5rem' }}>🗺️</div>
        <h3 style={{ color: '#ffffff', fontWeight: 800, marginBottom: '0.5rem' }}>Map Rendering Error</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '420px', marginBottom: '1.25rem' }}>
          An error occurred while displaying the tactical map. You can reload the map interface below.
        </p>
        <button type="button" onClick={reset} className="btn btn-primary btn-sm">
          ↻ RELOAD DISASTER MAP
        </button>
      </div>
    )}
  >
    <DisasterCommandMapContent {...props} />
  </ErrorBoundary>
);

export default DisasterCommandMap;
