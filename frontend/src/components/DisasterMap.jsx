import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  fetchSosRequests,
  fetchShelters,
  fetchAffectedAreas,
  fetchResources,
} from '../services/api';

// Realistic base center for campus/metropolitan region (Delhi NCR coordinate baseline)
const DEFAULT_CENTER = [28.6139, 77.2090];
const DEFAULT_ZOOM = 13;

/**
 * Deterministically generates realistic demo coordinates within ~5km of center
 * if latitude/longitude are missing on an entity.
 */
const getEntityCoordinates = (item, index = 0, typePrefix = 'sos') => {
  const hasValidLat = typeof item.latitude === 'number' && !isNaN(item.latitude) && item.latitude !== 0;
  const hasValidLng = typeof item.longitude === 'number' && !isNaN(item.longitude) && item.longitude !== 0;

  if (hasValidLat && hasValidLng) {
    return {
      lat: item.latitude,
      lng: item.longitude,
      isDemoCoords: !!item.isDemoCoords,
    };
  }

  // Generate deterministic offset around baseline
  const seed = (item._id || item.requestId || item.name || `${typePrefix}-${index}`)
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);

  const angle = (seed % 360) * (Math.PI / 180);
  const distance = 0.012 + ((seed % 25) / 1000); // approx 1.2km to 3.7km radius

  const generatedLat = parseFloat((DEFAULT_CENTER[0] + Math.sin(angle) * distance).toFixed(6));
  const generatedLng = parseFloat((DEFAULT_CENTER[1] + Math.cos(angle) * distance * 1.15).toFixed(6));

  return {
    lat: generatedLat,
    lng: generatedLng,
    isDemoCoords: true,
  };
};

/**
 * Factory for Custom HTML DivIcons with pulsing effects & glowing badges
 */
const createCustomIcon = (type, severityOrCount) => {
  let iconHtml = '';
  let className = 'custom-leaflet-marker';

  switch (type) {
    case 'sos':
      iconHtml = `
        <div class="marker-pin-wrapper marker-pin-sos">
          <div class="marker-pulse-ring"></div>
          <span>🚨</span>
          ${severityOrCount ? `<div class="marker-badge-count">!</div>` : ''}
        </div>
      `;
      break;

    case 'shelter':
      iconHtml = `
        <div class="marker-pin-wrapper marker-pin-shelter">
          <span>🏠</span>
        </div>
      `;
      break;

    case 'area':
      iconHtml = `
        <div class="marker-pin-wrapper marker-pin-area">
          <span>⚠️</span>
        </div>
      `;
      break;

    case 'resource':
      iconHtml = `
        <div class="marker-pin-wrapper marker-pin-resource">
          <span>🏥</span>
        </div>
      `;
      break;

    default:
      iconHtml = `
        <div class="marker-pin-wrapper">
          <span>📍</span>
        </div>
      `;
  }

  return L.divIcon({
    html: iconHtml,
    className: className,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -20],
  });
};

/**
 * Helper component inside MapContainer to auto-fit bounds or reset view
 */
const MapViewAdjuster = ({ markers, triggerRecenter, onRecenterDone }) => {
  const map = useMap();

  useEffect(() => {
    // Invalidate size on mount to prevent partial tile render issues in tabs/modals
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);
    return () => clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    if (triggerRecenter) {
      if (markers.length > 0) {
        const bounds = L.latLngBounds(markers.map((m) => [m.coords.lat, m.coords.lng]));
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15, animate: true });
      } else {
        map.setView(DEFAULT_CENTER, DEFAULT_ZOOM, { animate: true });
      }
      onRecenterDone();
    }
  }, [triggerRecenter, markers, map, onRecenterDone]);

  return null;
};

const DisasterMap = ({
  height = '520px',
  variant = 'standard', // 'compact' | 'standard' | 'large'
  initialFilter = 'ALL',
  showToolbar = true,
  showLegend = true,
  onOpenSos,
}) => {
  const [sosList, setSosList] = useState([]);
  const [shelters, setShelters] = useState([]);
  const [affectedAreas, setAffectedAreas] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter state: 'ALL' | 'SOS' | 'SHELTERS' | 'AREAS' | 'RESOURCES'
  const [activeFilter, setActiveFilter] = useState(initialFilter);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLegendExpanded, setIsLegendExpanded] = useState(true);
  const [recenterFlag, setRecenterFlag] = useState(false);

  // Load all 4 endpoints
  useEffect(() => {
    let isMounted = true;
    const loadMapData = async () => {
      setLoading(true);
      try {
        const [sos, sh, areas, res] = await Promise.all([
          fetchSosRequests(),
          fetchShelters(),
          fetchAffectedAreas(),
          fetchResources(),
        ]);

        if (isMounted) {
          setSosList(sos || []);
          setShelters(sh || []);
          setAffectedAreas(areas || []);
          setResources(res || []);
        }
      } catch (err) {
        console.error('Error fetching map data:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadMapData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Normalize all entities into marker objects
  const processedMarkers = useMemo(() => {
    const list = [];

    // 🔴 SOS Requests
    (sosList || []).forEach((item, idx) => {
      const coords = getEntityCoordinates(item, idx, 'sos');
      list.push({
        id: `sos-${item._id || idx}`,
        type: 'sos',
        category: 'SOS Emergency',
        name: item.name || `Emergency ${item.requestId || idx + 1}`,
        title: item.emergencyType || 'Critical Distress Signal',
        coords,
        severity: item.severity || 'High',
        status: item.status || 'Pending',
        people: item.peopleAffected || 1,
        contact: item.contact || 'Emergency Dispatch',
        description: item.description || 'Assistance requested immediately.',
        locationText: item.location || 'Reported Incident Area',
        raw: item,
      });
    });

    // 🟢 Shelters
    (shelters || []).forEach((item, idx) => {
      const coords = getEntityCoordinates(item, idx, 'shelter');
      list.push({
        id: `shelter-${item._id || idx}`,
        type: 'shelter',
        category: 'Emergency Shelter',
        name: item.name || `Relief Shelter #${idx + 1}`,
        title: `${item.status === 'Full' ? '🔴 Capacity Full' : '🟢 Available Beds'}`,
        coords,
        status: item.status || 'Open',
        capacity: item.capacity || 0,
        occupancy: item.occupancy || 0,
        available: Math.max(0, (item.capacity || 0) - (item.occupancy || 0)),
        facilities: item.facilities || [],
        phone: item.phone || '+91 11 2345 6780',
        address: item.address || 'Designated Campus Safe Zone',
        raw: item,
      });
    });

    // 🟠 Affected / Hazard Areas
    (affectedAreas || []).forEach((item, idx) => {
      const coords = getEntityCoordinates(item, idx, 'area');
      list.push({
        id: `area-${item._id || idx}`,
        type: 'area',
        category: 'Disaster Impact Zone',
        name: item.name || `Hazard Zone ${idx + 1}`,
        title: item.disasterType || 'Disaster Hazard',
        coords,
        severity: item.severity || 'Moderate',
        status: item.status || 'Active',
        affectedPeople: item.affectedPeople || 0,
        activeSOS: item.activeSOS || 0,
        description: item.description || 'Active hazard monitoring in progress.',
        raw: item,
      });
    });

    // 🔵 Hospitals & Emergency Resources
    (resources || []).forEach((item, idx) => {
      const coords = getEntityCoordinates(item, idx, 'resource');
      list.push({
        id: `res-${item._id || idx}`,
        type: 'resource',
        category: item.type || 'Emergency Resource',
        name: item.name || `Facility #${idx + 1}`,
        title: item.type || 'Medical / Rescue Unit',
        coords,
        status: item.status || 'Operational',
        phone: item.phone || '+91 11 112',
        address: item.address || 'City Emergency Grid',
        description: item.description || 'Equipped for rapid casualty care and relief operations.',
        raw: item,
      });
    });

    return list;
  }, [sosList, shelters, affectedAreas, resources]);

  // Filter and search markers
  const filteredMarkers = useMemo(() => {
    return processedMarkers.filter((marker) => {
      // Layer Filter
      if (activeFilter === 'SOS' && marker.type !== 'sos') return false;
      if (activeFilter === 'SHELTERS' && marker.type !== 'shelter') return false;
      if (activeFilter === 'AREAS' && marker.type !== 'area') return false;
      if (activeFilter === 'RESOURCES' && marker.type !== 'resource') return false;

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = marker.name?.toLowerCase().includes(query);
        const matchesTitle = marker.title?.toLowerCase().includes(query);
        const matchesDesc = marker.description?.toLowerCase().includes(query);
        const matchesLoc = (marker.locationText || marker.address || '')?.toLowerCase().includes(query);
        if (!matchesName && !matchesTitle && !matchesDesc && !matchesLoc) {
          return false;
        }
      }

      return true;
    });
  }, [processedMarkers, activeFilter, searchQuery]);

  // Counts for toolbar pills
  const counts = useMemo(() => {
    return {
      all: processedMarkers.length,
      sos: processedMarkers.filter((m) => m.type === 'sos').length,
      shelter: processedMarkers.filter((m) => m.type === 'shelter').length,
      area: processedMarkers.filter((m) => m.type === 'area').length,
      resource: processedMarkers.filter((m) => m.type === 'resource').length,
    };
  }, [processedMarkers]);

  const handleRecenter = useCallback(() => {
    setRecenterFlag(true);
  }, []);

  const handleRecenterDone = useCallback(() => {
    setRecenterFlag(false);
  }, []);

  return (
    <div className="disaster-map-wrapper">
      {/* Interactive Map Header & Toolbar */}
      {showToolbar && (
        <div className="disaster-map-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                  🗺️ Live Interactive Disaster & Relief Map
                </h3>
                <span className="pulse-indicator" title="Live OpenStreetMap feed" />
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0' }}>
                Real-time geospatial signals from SOS beacons, shelters, hazard zones, and medical facilities
              </p>
            </div>

            {/* Quick Search */}
            <div style={{ position: 'relative', minWidth: '220px' }}>
              <input
                type="text"
                placeholder="🔍 Search locations, shelters..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input"
                style={{
                  padding: '0.45rem 0.85rem',
                  fontSize: '0.82rem',
                  borderRadius: '9999px',
                  background: 'rgba(30, 41, 59, 0.8)',
                  borderColor: 'var(--border-subtle)',
                  width: '100%',
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Layer Filter Pills */}
          <div className="disaster-map-toolbar">
            <div className="map-filter-group">
              <button
                type="button"
                className={`map-filter-chip ${activeFilter === 'ALL' ? 'active-all' : ''}`}
                onClick={() => setActiveFilter('ALL')}
              >
                <span>🌐 All Layers</span>
                <span className="map-chip-badge">{counts.all}</span>
              </button>

              <button
                type="button"
                className={`map-filter-chip ${activeFilter === 'SOS' ? 'active-sos' : ''}`}
                onClick={() => setActiveFilter('SOS')}
              >
                <span>🔴 SOS Distress</span>
                <span className="map-chip-badge">{counts.sos}</span>
              </button>

              <button
                type="button"
                className={`map-filter-chip ${activeFilter === 'SHELTERS' ? 'active-shelter' : ''}`}
                onClick={() => setActiveFilter('SHELTERS')}
              >
                <span>🟢 Safe Shelters</span>
                <span className="map-chip-badge">{counts.shelter}</span>
              </button>

              <button
                type="button"
                className={`map-filter-chip ${activeFilter === 'AREAS' ? 'active-area' : ''}`}
                onClick={() => setActiveFilter('AREAS')}
              >
                <span>🟠 Hazard Zones</span>
                <span className="map-chip-badge">{counts.area}</span>
              </button>

              <button
                type="button"
                className={`map-filter-chip ${activeFilter === 'RESOURCES' ? 'active-resource' : ''}`}
                onClick={() => setActiveFilter('RESOURCES')}
              >
                <span>🔵 Hospitals & Units</span>
                <span className="map-chip-badge">{counts.resource}</span>
              </button>
            </div>

            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Showing <strong>{filteredMarkers.length}</strong> active map pins
            </div>
          </div>
        </div>
      )}

      {/* Leaflet Map Canvas Container */}
      <div
        className={`disaster-map-canvas-container ${variant === 'compact' ? 'compact' : variant === 'large' ? 'large' : ''}`}
        style={{ height }}
      >
        {/* Floating Top Controls (Recenter) */}
        <div className="map-controls-overlay">
          <button
            type="button"
            className="map-control-btn"
            onClick={handleRecenter}
            title="Recenter and fit all active pins into view"
          >
            <span>🎯</span>
            <span>Fit All Pins</span>
          </button>
        </div>

        {/* Floating Bottom Legend */}
        {showLegend && (
          <div className="map-legend-overlay">
            <div className="map-legend-header">
              <span>📍 Map Legend</span>
              <button
                type="button"
                onClick={() => setIsLegendExpanded(!isLegendExpanded)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                }}
              >
                {isLegendExpanded ? '▲ Hide' : '▼ Show'}
              </button>
            </div>

            {isLegendExpanded && (
              <div className="map-legend-list">
                <div className="map-legend-item">
                  <div className="map-legend-key">
                    <span className="map-legend-dot red" />
                    <span>🔴 SOS Requests</span>
                  </div>
                  <strong>{counts.sos}</strong>
                </div>

                <div className="map-legend-item">
                  <div className="map-legend-key">
                    <span className="map-legend-dot green" />
                    <span>🟢 Safe Shelters</span>
                  </div>
                  <strong>{counts.shelter}</strong>
                </div>

                <div className="map-legend-item">
                  <div className="map-legend-key">
                    <span className="map-legend-dot amber" />
                    <span>🟠 Disaster Areas</span>
                  </div>
                  <strong>{counts.area}</strong>
                </div>

                <div className="map-legend-item">
                  <div className="map-legend-key">
                    <span className="map-legend-dot cyan" />
                    <span>🔵 Hospitals & Aid</span>
                  </div>
                  <strong>{counts.resource}</strong>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Core Leaflet Map */}
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={DEFAULT_ZOOM}
          scrollWheelZoom={true}
          style={{ width: '100%', height: '100%' }}
        >
          {/* OpenStreetMap Tiles with Official Attribution */}
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
            maxZoom={19}
          />

          <MapViewAdjuster
            markers={filteredMarkers}
            triggerRecenter={recenterFlag}
            onRecenterDone={handleRecenterDone}
          />

          {/* Render Affected Area Impact Radius Circles */}
          {filteredMarkers
            .filter((m) => m.type === 'area')
            .map((areaMarker) => (
              <Circle
                key={`circle-${areaMarker.id}`}
                center={[areaMarker.coords.lat, areaMarker.coords.lng]}
                radius={areaMarker.severity === 'Critical' ? 1200 : areaMarker.severity === 'High' ? 850 : 500}
                pathOptions={{
                  color: areaMarker.severity === 'Critical' ? '#ef4444' : '#f59e0b',
                  fillColor: areaMarker.severity === 'Critical' ? '#ef4444' : '#f59e0b',
                  fillOpacity: 0.18,
                  weight: 2,
                  dashArray: '4, 6',
                }}
              />
            ))}

          {/* Render Interactive Custom Markers */}
          {filteredMarkers.map((marker) => {
            const icon = createCustomIcon(marker.type, marker.severity);

            return (
              <Marker
                key={marker.id}
                position={[marker.coords.lat, marker.coords.lng]}
                icon={icon}
              >
                <Popup>
                  <div className="map-popup-card">
                    {/* Header */}
                    <div>
                      <div
                        className="map-popup-category"
                        style={{
                          color:
                            marker.type === 'sos'
                              ? '#f87171'
                              : marker.type === 'shelter'
                              ? '#34d399'
                              : marker.type === 'area'
                              ? '#fbbf24'
                              : '#38bdf8',
                        }}
                      >
                        {marker.type === 'sos' && '🚨 SOS Emergency'}
                        {marker.type === 'shelter' && '🏠 Safe Shelter'}
                        {marker.type === 'area' && '⚠️ Hazard Impact Area'}
                        {marker.type === 'resource' && `🏥 ${marker.category}`}
                      </div>
                      <div className="map-popup-title">{marker.name}</div>
                    </div>

                    {/* Demo Coordinates Flag */}
                    {marker.coords.isDemoCoords && (
                      <div className="map-popup-demo-tag">
                        <span>⚠️</span>
                        <span>[DEMO COORDINATES] Estimated Location</span>
                      </div>
                    )}

                    {/* Specific Details: 🔴 SOS */}
                    {marker.type === 'sos' && (
                      <>
                        <div className="map-popup-desc">
                          <strong>Incident:</strong> {marker.description}
                        </div>

                        <div className="map-popup-meta-grid">
                          <div>🚨 <strong>Severity:</strong> {marker.severity}</div>
                          <div>👥 <strong>People:</strong> {marker.people}</div>
                          <div>📍 <strong>Status:</strong> {marker.status}</div>
                          <div>📞 <strong>Contact:</strong> {marker.contact}</div>
                        </div>

                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          📍 <em>{marker.locationText}</em>
                        </div>

                        <div className="map-popup-actions">
                          <a
                            href={`tel:${marker.contact}`}
                            className="map-popup-btn map-popup-btn-sos"
                          >
                            📞 Call Contact
                          </a>
                        </div>
                      </>
                    )}

                    {/* Specific Details: 🟢 Shelter */}
                    {marker.type === 'shelter' && (
                      <>
                        <div className="map-popup-meta-grid">
                          <div>🛏️ <strong>Available:</strong> {marker.available} Beds</div>
                          <div>👥 <strong>Occupancy:</strong> {marker.occupancy}/{marker.capacity}</div>
                          <div>🚦 <strong>Status:</strong> {marker.status}</div>
                          <div>📞 <strong>Phone:</strong> {marker.phone}</div>
                        </div>

                        {marker.facilities && marker.facilities.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                            {marker.facilities.slice(0, 4).map((f, i) => (
                              <span
                                key={i}
                                style={{
                                  fontSize: '0.68rem',
                                  padding: '0.15rem 0.4rem',
                                  borderRadius: '4px',
                                  background: 'rgba(16, 185, 129, 0.15)',
                                  color: '#a7f3d0',
                                  border: '1px solid rgba(16, 185, 129, 0.3)',
                                }}
                              >
                                ✓ {f}
                              </span>
                            ))}
                          </div>
                        )}

                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          📍 <em>{marker.address}</em>
                        </div>

                        <div className="map-popup-actions">
                          <a
                            href={`tel:${marker.phone}`}
                            className="map-popup-btn map-popup-btn-primary"
                          >
                            📞 Call Shelter
                          </a>
                        </div>
                      </>
                    )}

                    {/* Specific Details: 🟠 Affected Area */}
                    {marker.type === 'area' && (
                      <>
                        <div className="map-popup-desc">
                          {marker.description}
                        </div>

                        <div className="map-popup-meta-grid">
                          <div>🌪️ <strong>Disaster:</strong> {marker.title}</div>
                          <div>⚠️ <strong>Severity:</strong> {marker.severity}</div>
                          <div>👥 <strong>Affected:</strong> {marker.affectedPeople?.toLocaleString()}</div>
                          <div>🚨 <strong>Active SOS:</strong> {marker.activeSOS}</div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: '#94a3b8' }}>
                          <span>Status: <strong style={{ color: '#34d399' }}>{marker.status}</strong></span>
                          <span>GPS: {marker.coords.lat}, {marker.coords.lng}</span>
                        </div>

                        {onOpenSos && (
                          <div className="map-popup-actions">
                            <button
                              type="button"
                              onClick={onOpenSos}
                              className="map-popup-btn map-popup-btn-sos"
                            >
                              🚨 Report Distress in this Zone
                            </button>
                          </div>
                        )}
                      </>
                    )}

                    {/* Specific Details: 🔵 Resource */}
                    {marker.type === 'resource' && (
                      <>
                        <div className="map-popup-desc">
                          {marker.description}
                        </div>

                        <div className="map-popup-meta-grid">
                          <div>🏥 <strong>Facility:</strong> {marker.category}</div>
                          <div>🟢 <strong>Status:</strong> {marker.status}</div>
                          <div style={{ gridColumn: 'span 2' }}>
                            📍 <strong>Address:</strong> {marker.address}
                          </div>
                        </div>

                        <div className="map-popup-actions">
                          <a
                            href={`tel:${marker.phone}`}
                            className="map-popup-btn map-popup-btn-primary"
                          >
                            📞 Call Emergency Unit ({marker.phone})
                          </a>
                        </div>
                      </>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
};

export default DisasterMap;
