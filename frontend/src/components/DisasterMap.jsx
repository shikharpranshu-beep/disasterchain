import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  fetchSosRequests,
  fetchShelters,
  fetchAffectedAreas,
  fetchResources,
  fetchIncidents,
  fetchRiskHeatmap,
} from '../services/api';
import Icon from './Icons';
import CrisisGlobe3D from './CrisisGlobe3D';

// Realistic base center for campus/metropolitan region (Delhi NCR coordinate baseline)
const DEFAULT_CENTER = [28.6139, 77.2090];
const DEFAULT_ZOOM = 13;

// Known landmark coordinates mapping for text-only address resolution
const KNOWN_LANDMARKS = {
  'north campus': [28.6850, 77.2100],
  'south campus': [28.5850, 77.1650],
  'sector 14': [28.6250, 77.2150],
  'sector 9': [28.6250, 77.2180],
  'river view': [28.6350, 77.2280],
  'riverfront': [28.6400, 77.2300],
  'science complex': [28.6180, 77.2050],
  'academic block': [28.6190, 77.2060],
  'central library': [28.6145, 77.2085],
  'sports complex': [28.6139, 77.2090],
  'green park': [28.5580, 77.2050],
  'railway station': [28.6050, 77.2150],
  'civil lines': [28.6750, 77.2250],
  'connaught place': [28.6304, 77.2177],
  'hauz khas': [28.5494, 77.2001],
};

/**
 * Extracts or parses coordinates from MongoDB document fields.
 */
export const getEntityCoordinates = (item, index = 0, typePrefix = 'sos') => {
  // 1. Direct numeric latitude & longitude
  const hasValidLat = typeof item?.latitude === 'number' && !isNaN(item.latitude) && item.latitude !== 0;
  const hasValidLng = typeof item?.longitude === 'number' && !isNaN(item.longitude) && item.longitude !== 0;

  if (hasValidLat && hasValidLng) {
    return {
      lat: item.latitude,
      lng: item.longitude,
    };
  }

  // 2. Parse coordinates embedded in location string: "Lat: 28.6139, Long: 77.2090" or "28.6139, 77.2090"
  if (typeof item?.location === 'string') {
    const latLngMatch = item.location.match(/(?:lat|latitude)?:?\s*(-?\d+\.\d+)\s*,\s*(?:long|longitude|lng)?:?\s*(-?\d+\.\d+)/i);
    if (latLngMatch) {
      const parsedLat = parseFloat(latLngMatch[1]);
      const parsedLng = parseFloat(latLngMatch[2]);
      if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
        return {
          lat: parsedLat,
          lng: parsedLng,
        };
      }
    }

    // 3. Match known location names in location string
    const locLower = item.location.toLowerCase();
    for (const [key, coords] of Object.entries(KNOWN_LANDMARKS)) {
      if (locLower.includes(key)) {
        return {
          lat: coords[0],
          lng: coords[1],
        };
      }
    }
  }

  // 4. Match known address in address field
  if (typeof item?.address === 'string') {
    const addrLower = item.address.toLowerCase();
    for (const [key, coords] of Object.entries(KNOWN_LANDMARKS)) {
      if (addrLower.includes(key)) {
        return {
          lat: coords[0],
          lng: coords[1],
        };
      }
    }
  }

  // 5. If no valid coordinates can be parsed or matched, return null to skip
  return null;
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
          ${severityOrCount === 'Critical' ? `<div class="marker-badge-count">!</div>` : ''}
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

    case 'incident':
      iconHtml = `
        <div class="marker-pin-wrapper" style="background: linear-gradient(135deg, #f97316, #ef4444); border-color: #f97316;">
          <span>⚡</span>
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
  const [incidents, setIncidents] = useState([]);
  const [riskZones, setRiskZones] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter state: 'ALL' | 'RISK' | 'SOS' | 'SHELTERS' | 'AREAS' | 'RESOURCES' | 'INCIDENTS'
  const [activeFilter, setActiveFilter] = useState(initialFilter);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLegendExpanded, setIsLegendExpanded] = useState(true);
  const [recenterFlag, setRecenterFlag] = useState(false);
  const [is3DMode, setIs3DMode] = useState(false);

  // Load real data from backend
  useEffect(() => {
    let isMounted = true;
    const loadMapData = async () => {
      setLoading(true);
      try {
        const [sos, sh, areas, res, inc, heatmapRes] = await Promise.all([
          fetchSosRequests(),
          fetchShelters(),
          fetchAffectedAreas(),
          fetchResources(),
          fetchIncidents(),
          fetchRiskHeatmap().catch(() => ({ data: { zones: [] } })),
        ]);

        if (isMounted) {
          setSosList(sos || []);
          setShelters(sh || []);
          setAffectedAreas(areas || []);
          setResources(res || []);
          setIncidents(inc || []);
          setRiskZones(heatmapRes?.data?.zones || []);
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
      if (!coords) return;
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
      if (!coords) return;
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
      if (!coords) return;
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
      if (!coords) return;
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

    // ⚡ Hazard / Incident Reports
    (incidents || []).forEach((item, idx) => {
      const coords = getEntityCoordinates(item, idx, 'incident');
      if (!coords) return;
      list.push({
        id: `inc-${item._id || idx}`,
        type: 'incident',
        category: 'Campus Hazard Report',
        name: item.title || `Incident ${item.incidentId || idx + 1}`,
        title: item.type || 'Hazard Warning',
        coords,
        severity: item.severity || 'Medium',
        status: item.status || 'Pending',
        locationText: item.location || 'Campus Hazard Zone',
        description: item.description || 'Hazard ticket reported by student.',
        raw: item,
      });
    });

    return list;
  }, [sosList, shelters, affectedAreas, resources, incidents]);

  // Filter and search markers
  const filteredMarkers = useMemo(() => {
    return processedMarkers.filter((marker) => {
      // Layer Filter
      if (activeFilter === 'SOS' && marker.type !== 'sos') return false;
      if (activeFilter === 'SHELTERS' && marker.type !== 'shelter') return false;
      if (activeFilter === 'AREAS' && marker.type !== 'area') return false;
      if (activeFilter === 'RESOURCES' && marker.type !== 'resource') return false;
      if (activeFilter === 'INCIDENTS' && marker.type !== 'incident') return false;

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

  // Filter circles for affected areas
  const filteredAreas = useMemo(() => {
    if (activeFilter !== 'ALL' && activeFilter !== 'AREAS') return [];
    return affectedAreas.map((area, idx) => {
      const coords = getEntityCoordinates(area, idx, 'area');
      const radiusMap = {
        Critical: 1800,
        High: 1400,
        Moderate: 1000,
        Low: 700,
      };
      const radius = radiusMap[area.severity] || 1000;

      const colorMap = {
        Critical: '#ff334b',
        High: '#f97316',
        Moderate: '#f59e0b',
        Low: '#10b981',
      };
      const color = colorMap[area.severity] || '#f59e0b';

      return {
        ...area,
        coords,
        radius,
        color,
      };
    });
  }, [affectedAreas, activeFilter]);

  const handleRecenter = useCallback(() => {
    setRecenterFlag(true);
  }, []);

  const handleRecenterDone = useCallback(() => {
    setRecenterFlag(false);
  }, []);

  // Compute live counts
  const sosCount = sosList.length;
  const shelterCount = shelters.length;
  const areaCount = affectedAreas.length;
  const resourceCount = resources.length;
  const incidentCount = incidents.length;

  return (
    <div
      className="glass-card"
      style={{
        padding: 0,
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Map Control Toolbar */}
      {showToolbar && (
        <div
          style={{
            padding: '0.85rem 1.25rem',
            background: 'rgba(15, 24, 44, 0.95)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            zIndex: 10,
          }}
        >
          {/* Layer Selector Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setActiveFilter('ALL')}
              className={`btn ${activeFilter === 'ALL' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
            >
              <span>All Layers</span>
              <span className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>
                {processedMarkers.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('SOS')}
              className={`btn ${activeFilter === 'SOS' ? 'btn-danger' : 'btn-secondary'} btn-sm`}
              style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
            >
              <span>🚨 SOS Distress</span>
              <span className="badge badge-critical" style={{ fontSize: '0.65rem' }}>
                {sosCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('SHELTERS')}
              className={`btn ${activeFilter === 'SHELTERS' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
            >
              <span>🏠 Shelters</span>
              <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                {shelterCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('AREAS')}
              className={`btn ${activeFilter === 'AREAS' ? 'btn-secondary' : 'btn-secondary'} btn-sm`}
              style={{
                fontSize: '0.78rem',
                padding: '0.35rem 0.75rem',
                borderColor: activeFilter === 'AREAS' ? 'var(--accent-amber)' : 'var(--border-subtle)',
                color: activeFilter === 'AREAS' ? '#fbbf24' : 'var(--text-secondary)',
              }}
            >
              <span>⚠️ Impact Zones</span>
              <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>
                {areaCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('RESOURCES')}
              className={`btn ${activeFilter === 'RESOURCES' ? 'btn-secondary' : 'btn-secondary'} btn-sm`}
              style={{
                fontSize: '0.78rem',
                padding: '0.35rem 0.75rem',
                borderColor: activeFilter === 'RESOURCES' ? 'var(--accent-cyan)' : 'var(--border-subtle)',
                color: activeFilter === 'RESOURCES' ? '#38bdf8' : 'var(--text-secondary)',
              }}
            >
              <span>🏥 Facilities</span>
              <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>
                {resourceCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('INCIDENTS')}
              className={`btn ${activeFilter === 'INCIDENTS' ? 'btn-secondary' : 'btn-secondary'} btn-sm`}
              style={{
                fontSize: '0.78rem',
                padding: '0.35rem 0.75rem',
                borderColor: activeFilter === 'INCIDENTS' ? '#f97316' : 'var(--border-subtle)',
                color: activeFilter === 'INCIDENTS' ? '#fb923c' : 'var(--text-secondary)',
              }}
            >
              <span>⚡ Hazards</span>
              <span className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>
                {incidentCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('RISK')}
              className={`btn ${activeFilter === 'RISK' ? 'btn-secondary' : 'btn-secondary'} btn-sm`}
              style={{
                fontSize: '0.78rem',
                padding: '0.35rem 0.75rem',
                borderColor: activeFilter === 'RISK' ? '#ff0044' : 'var(--border-subtle)',
                color: activeFilter === 'RISK' ? '#ff0044' : 'var(--text-secondary)',
                fontWeight: 700,
              }}
            >
              <span>⚡ Risk Zones</span>
              <span className="badge badge-critical" style={{ fontSize: '0.65rem', background: 'rgba(255, 0, 68, 0.2)' }}>
                {riskZones.length}
              </span>
            </button>
          </div>

          {/* Search & Recenter Tools */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search map markers..."
                style={{
                  background: 'rgba(11, 18, 34, 0.9)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.35rem 0.75rem 0.35rem 2rem',
                  fontSize: '0.78rem',
                  color: '#ffffff',
                  width: '180px',
                }}
              />
              <span style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <Icon name="search" size={13} />
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIs3DMode((prev) => !prev)}
              className="btn btn-secondary btn-sm"
              style={{
                padding: '0.35rem 0.65rem',
                fontSize: '0.78rem',
                borderColor: is3DMode ? 'var(--cyan)' : 'var(--border-subtle)',
                color: is3DMode ? 'var(--cyan)' : 'var(--text-secondary)',
                boxShadow: is3DMode ? 'var(--glow-cyan)' : 'none',
              }}
              title="Toggle 3D Crisis Globe Overview"
            >
              <span>{is3DMode ? '🌐 2D Map' : '🌍 3D Globe'}</span>
            </button>

            <button
              type="button"
              onClick={handleRecenter}
              className="btn btn-secondary btn-sm"
              style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
              title="Auto-Fit and Center Map to Markers"
            >
              <Icon name="compass" size={14} />
              <span>Center</span>
            </button>
          </div>
        </div>
      )}

      {/* 3D Crisis Globe Overview or 2D Leaflet Container */}
      {is3DMode ? (
        <CrisisGlobe3D
          sosRequests={sosList}
          affectedAreas={affectedAreas}
          shelters={shelters}
          incidents={incidents}
          riskZones={riskZones}
        />
      ) : (
      <div style={{ width: '100%', height, position: 'relative' }}>
        {loading && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(8, 13, 26, 0.85)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              gap: '0.75rem',
              color: '#ffffff',
              fontSize: '0.9rem',
              fontWeight: 700,
            }}
          >
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                border: '3px solid rgba(99, 102, 241, 0.3)',
                borderTopColor: 'var(--accent-indigo)',
                animation: 'spin 1s linear infinite',
              }}
            />
            <span>Loading Live Geo-Spatial Grid...</span>
          </div>
        )}

        <MapContainer
          center={DEFAULT_CENTER}
          zoom={DEFAULT_ZOOM}
          style={{ width: '100%', height: '100%', background: '#0b1222' }}
          scrollWheelZoom={true}
        >
          {/* Free, Public OpenStreetMap Tile Layer - Zero-Cost & No API Key Required */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />

          <MapViewAdjuster
            markers={filteredMarkers}
            triggerRecenter={recenterFlag}
            onRecenterDone={handleRecenterDone}
          />

          {/* AI-Assisted Live Risk Heatmap Zones */}
          {(activeFilter === 'ALL' || activeFilter === 'RISK') &&
            riskZones.map((zone) => {
              const isCritical = zone.riskLevel === 'CRITICAL';
              const isHigh = zone.riskLevel === 'HIGH';
              const color = isCritical
                ? '#ff0044'
                : isHigh
                ? '#f97316'
                : zone.riskLevel === 'MEDIUM'
                ? '#f59e0b'
                : '#38bdf8';

              return (
                <Circle
                  key={zone.id}
                  center={[zone.latitude, zone.longitude]}
                  radius={(zone.radiusKm || 2.5) * 1000}
                  pathOptions={{
                    color: color,
                    fillColor: color,
                    fillOpacity: isCritical ? 0.3 : 0.18,
                    weight: isCritical ? 2.5 : 1.5,
                    dashArray: isCritical ? '6, 6' : undefined,
                  }}
                >
                  <Popup className="custom-leaflet-popup">
                    <div style={{ padding: '0.45rem', minWidth: '240px', maxWidth: '300px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                        <span
                          style={{
                            background: `${color}22`,
                            color: color,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontWeight: 800,
                            fontSize: '0.72rem',
                            border: `1px solid ${color}`,
                          }}
                        >
                          ⚡ {zone.riskLevel} [{zone.riskScore}/100]
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          ~{zone.radiusKm} km radius
                        </span>
                      </div>

                      <h4 style={{ margin: '0 0 0.35rem 0', fontSize: '0.95rem', color: '#ffffff', fontWeight: 800 }}>
                        {zone.dominantHazard} CONVERGENCE
                      </h4>

                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', lineHeight: 1.4 }}>
                        <div>• Active SOS Signals: <strong style={{ color: '#ff4d6d' }}>{zone.activeSOSCount}</strong></div>
                        <div>• Active Incidents: <strong style={{ color: '#f97316' }}>{zone.activeIncidentCount}</strong></div>
                        <div>• Nearby Shelter Strain: <strong style={{ color: zone.nearbyShelterStrain === 'High' ? '#ff0044' : '#10b981' }}>{zone.nearbyShelterStrain}</strong></div>
                      </div>

                      {zone.reasons && zone.reasons[0] && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.35rem' }}>
                          Key Driver: {zone.reasons[0]}
                        </div>
                      )}
                    </div>
                  </Popup>
                </Circle>
              );
            })}

          {/* Affected Area Radii Circles */}
          {filteredAreas.map((area) => (
            <Circle
              key={`circle-${area._id}`}
              center={[area.coords.lat, area.coords.lng]}
              radius={area.radius}
              pathOptions={{
                color: area.color,
                fillColor: area.color,
                fillOpacity: 0.15,
                weight: 2,
                dashArray: area.severity === 'Critical' ? '6, 6' : undefined,
              }}
            >
              <Popup className="custom-leaflet-popup">
                <div style={{ padding: '0.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span className={`badge badge-${area.severity?.toLowerCase()}`} style={{ fontSize: '0.65rem' }}>
                      {area.severity} Zone
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Status: {area.status}</span>
                  </div>
                  <strong style={{ fontSize: '0.95rem', color: '#ffffff', display: 'block', marginBottom: '0.2rem' }}>
                    {area.name}
                  </strong>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    Disaster: <strong>{area.disasterType}</strong> &bull; Affected: <strong>{area.affectedPeople?.toLocaleString()}</strong>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                    {area.description}
                  </p>
                </div>
              </Popup>
            </Circle>
          ))}

          {/* Markers */}
          {filteredMarkers.map((marker) => {
            const icon = createCustomIcon(marker.type, marker.severity);

            return (
              <Marker
                key={marker.id}
                position={[marker.coords.lat, marker.coords.lng]}
                icon={icon}
              >
                <Popup className="custom-leaflet-popup">
                  <div style={{ minWidth: '220px', maxWidth: '280px', padding: '0.2rem' }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem', gap: '0.5rem' }}>
                      <span
                        className={`badge ${
                          marker.type === 'sos'
                            ? 'badge-critical'
                            : marker.type === 'shelter'
                            ? 'badge-success'
                            : marker.type === 'area'
                            ? 'badge-warning'
                            : marker.type === 'incident'
                            ? 'badge-warning'
                            : 'badge-info'
                        }`}
                        style={{ fontSize: '0.65rem' }}
                      >
                        {marker.category}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {marker.status}
                      </span>
                    </div>

                    <strong style={{ fontSize: '0.95rem', color: '#ffffff', display: 'block', marginBottom: '0.25rem' }}>
                      {marker.name}
                    </strong>

                    <div style={{ fontSize: '0.82rem', color: '#818cf8', fontWeight: 600, marginBottom: '0.4rem' }}>
                      {marker.title}
                    </div>

                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.65rem', lineHeight: 1.4 }}>
                      {marker.description}
                    </p>

                    {/* Metadata details based on type */}
                    {marker.type === 'sos' && (
                      <div style={{ fontSize: '0.75rem', background: 'rgba(0,0,0,0.3)', padding: '0.4rem 0.6rem', borderRadius: '4px', marginBottom: '0.5rem' }}>
                        <div>👥 Affected: <strong>{marker.people} Person(s)</strong></div>
                        <div>📞 Contact: <strong>{marker.contact}</strong></div>
                      </div>
                    )}

                    {marker.type === 'shelter' && (
                      <div style={{ fontSize: '0.75rem', background: 'rgba(0,0,0,0.3)', padding: '0.4rem 0.6rem', borderRadius: '4px', marginBottom: '0.5rem' }}>
                        <div>🛏️ Occupancy: <strong>{marker.occupancy} / {marker.capacity}</strong></div>
                        <div style={{ color: marker.available > 0 ? '#34d399' : '#ff6b7e' }}>
                          Available Beds: <strong>{marker.available}</strong>
                        </div>
                      </div>
                    )}

                    {marker.type === 'resource' && (
                      <div style={{ fontSize: '0.75rem', background: 'rgba(0,0,0,0.3)', padding: '0.4rem 0.6rem', borderRadius: '4px', marginBottom: '0.5rem' }}>
                        <div>📍 {marker.address}</div>
                        <div>📞 {marker.phone}</div>
                      </div>
                    )}

                    {marker.type === 'incident' && (
                      <div style={{ fontSize: '0.75rem', background: 'rgba(0,0,0,0.3)', padding: '0.4rem 0.6rem', borderRadius: '4px', marginBottom: '0.5rem' }}>
                        <div>📍 Location: <strong>{marker.locationText}</strong></div>
                        <div>Severity: <strong>{marker.severity}</strong></div>
                      </div>
                    )}

                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.35rem', marginTop: '0.35rem', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Lat: {marker.coords.lat.toFixed(4)}, Lng: {marker.coords.lng.toFixed(4)}</span>
                      <span>Verified Location</span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
      )}

      {/* Expandable Map Legend */}
      {showLegend && (
        <div
          style={{
            padding: '0.65rem 1.25rem',
            background: 'rgba(11, 18, 34, 0.95)',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.9rem' }}>🚨</span>
              <strong>Active SOS Distress Signal</strong>
            </span>

            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.9rem' }}>🏠</span>
              <strong>Safe Relief Shelter</strong>
            </span>

            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.9rem' }}>⚠️</span>
              <strong>Monitored Impact Zone</strong>
            </span>

            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.9rem' }}>🏥</span>
              <strong>Emergency Facility</strong>
            </span>

            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.9rem' }}>⚡</span>
              <strong>Hazard Ticket</strong>
            </span>
          </div>

          {onOpenSos && (
            <button
              type="button"
              onClick={onOpenSos}
              className="btn btn-sos btn-sm"
              style={{ fontSize: '0.74rem', padding: '0.25rem 0.75rem' }}
            >
              <span>+ Tag SOS on Map</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default DisasterMap;
