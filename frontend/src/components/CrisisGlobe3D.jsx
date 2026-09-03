import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import Icon from './Icons';
import {
  WORLD_COUNTRIES,
  WORLD_CITIES,
  searchGeographicLocations,
  computeSpatialEmergencyTelemetry,
} from '../data/worldGeoData';
import GlobeLocationPanel from './GlobeLocationPanel';
import ErrorBoundary from './ErrorBoundary';

// Ensure Cesium base assets URL is configured
if (typeof window !== 'undefined' && !window.CESIUM_BASE_URL) {
  window.CESIUM_BASE_URL = '/cesium';
}

/**
 * Loads Cesium asynchronously if not already available on window
 */
const loadCesiumScript = () => {
  if (typeof window === 'undefined') return Promise.reject(new Error('No window'));
  if (window.Cesium) return Promise.resolve(window.Cesium);

  return new Promise((resolve, reject) => {
    let script = document.querySelector('script[src*="Cesium.js"]');
    if (script && window.Cesium) {
      return resolve(window.Cesium);
    }
    if (!script) {
      script = document.createElement('script');
      script.src = '/cesium/Cesium.js';
      script.async = true;
      document.head.appendChild(script);
    }

    script.onload = () => {
      if (window.Cesium) resolve(window.Cesium);
      else reject(new Error('Cesium not found on window'));
    };
    script.onerror = () => reject(new Error('Failed to load Cesium script'));
  });
};

/**
 * Professional Geospatial Command Globe using CesiumJS
 * Displays real-world planetary geography with live DisasterChain operational layers.
 */
const CesiumCrisisGlobe = ({
  sosList = [],
  sosRequests = [],
  shelters = [],
  incidents = [],
  affectedAreas = [],
  alerts = [],
  riskZones = [],
  intelligenceList = [],
  focusTarget = null,
  onOpenShelter = () => {},
  onOpenIncident = () => {},
  onOpenSos = () => {},
  onSelectEntity = () => {},
  onViewMap = () => {},
  onNavigate = () => {},
}) => {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const handlerRef = useRef(null);

  // Safe normalized props
  const activeSosList = Array.isArray(sosList) && sosList.length > 0 ? sosList : Array.isArray(sosRequests) ? sosRequests : [];
  const safeShelters = Array.isArray(shelters) ? shelters : [];
  const safeIncidents = Array.isArray(incidents) ? incidents : [];
  const safeAreas = Array.isArray(affectedAreas) ? affectedAreas : [];
  const safeAlerts = Array.isArray(alerts) ? alerts : [];
  const safeRiskZones = Array.isArray(riskZones) ? riskZones : [];

  const [cesiumLoaded, setCesiumLoaded] = useState(false);
  const [hasWebGlError, setHasWebGlError] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [selectedType, setSelectedType] = useState('city');
  const [hoveredTooltip, setHoveredTooltip] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [cameraViewMode, setCameraViewMode] = useState('INDIA'); // 'INDIA' | 'WORLD' | 'USER'

  // Layer toggles
  const [layers, setLayers] = useState({
    cities: true,
    sos: true,
    shelters: true,
    incidents: true,
    affectedAreas: true,
    alerts: true,
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

  // Smooth camera flight
  const flyToLocation = useCallback((lon, lat, altitude = 45000.0, entity = null, type = 'city') => {
    const viewer = viewerRef.current;
    const Cesium = window.Cesium;
    if (!viewer || viewer.isDestroyed() || !Cesium) return;

    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(lon, lat, altitude),
      orientation: {
        heading: Cesium.Math.toRadians(0.0),
        pitch: Cesium.Math.toRadians(altitude > 1000000 ? -90.0 : -65.0),
        roll: 0.0,
      },
      duration: 0.7,
    });

    if (entity) {
      setSelectedEntity(entity);
      setSelectedType(type);
      if (onSelectEntity) onSelectEntity(entity);
    }
  }, [onSelectEntity]);

  // Handle Search Input
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
    const altitude = result.type === 'country' ? 2500000.0 : 35000.0;
    flyToLocation(result.lon, result.lat, altitude, result, result.type);
  };

  // Fast Zoom In / Out Step Functions
  const handleZoomIn = () => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;
    const currentHeight = viewer.camera.positionCartographic.height;
    viewer.camera.zoomIn(currentHeight * 0.45);
  };

  const handleZoomOut = () => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;
    const currentHeight = viewer.camera.positionCartographic.height;
    viewer.camera.zoomOut(currentHeight * 0.75);
  };

  // Navigation Presets (Fast Responsive Flights)
  const handleFocusIndia = () => {
    setCameraViewMode('INDIA');
    const india = WORLD_COUNTRIES.find((c) => c.id === 'IND');
    flyToLocation(78.9629, 21.5937, 4500000.0, india, 'country');
  };

  const handleFocusWorld = () => {
    setCameraViewMode('WORLD');
    flyToLocation(0.0, 20.0, 16000000.0, null, 'country');
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
        setCameraViewMode('USER');
        flyToLocation(userLon, userLat, 15000.0, {
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

  // External focus triggers (AI assistant, cards)
  useEffect(() => {
    const handleGlobalFocus = (e) => {
      if (e.detail) {
        const { lat, lon, zoom, entity, type } = e.detail;
        if (lat != null && lon != null) {
          const altitude = zoom ? (10 - zoom) * 15000.0 : 45000.0;
          flyToLocation(lon, lat, Math.max(10000.0, altitude), entity || { lat, lon, name: 'Target Focus' }, type || 'city');
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('disasterchain:globe-focus', handleGlobalFocus);
      return () => window.removeEventListener('disasterchain:globe-focus', handleGlobalFocus);
    }
  }, [flyToLocation]);

  // Handle focusTarget prop changes
  useEffect(() => {
    if (focusTarget && (focusTarget.latitude != null || focusTarget.lat != null)) {
      const lat = focusTarget.latitude ?? focusTarget.lat;
      const lon = focusTarget.longitude ?? focusTarget.lon;
      flyToLocation(lon, lat, 45000.0, focusTarget, focusTarget.type?.toLowerCase() || 'city');
    }
  }, [focusTarget, flyToLocation]);

  // Initialize Cesium Viewer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let isCancelled = false;

    loadCesiumScript()
      .then((Cesium) => {
        if (isCancelled || !container) return;

        try {
          // Configure keyless, reliable base imagery
          const baseImageryProvider = new Cesium.UrlTemplateImageryProvider({
            url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
            credit: '© OpenStreetMap contributors',
            maximumLevel: 19,
          });

          const viewer = new Cesium.Viewer(container, {
            animation: false,
            baseLayerPicker: false,
            fullscreenButton: false,
            geocoder: false,
            homeButton: false,
            infoBox: false,
            sceneModePicker: false,
            selectionIndicator: false,
            timeline: false,
            navigationHelpButton: false,
            navigationInstructionsInitiallyVisible: false,
            scene3DOnly: true,
            baseLayer: new Cesium.ImageryLayer(baseImageryProvider),
          });

          // Style atmosphere and scene for DisasterChain Warm Crisis Command
          const scene = viewer.scene;
          scene.globe.baseColor = Cesium.Color.fromCssColorString('#120B08');
          scene.globe.enableLighting = true;
          scene.globe.atmosphereBrightnessShift = -0.12;
          scene.globe.atmosphereHueShift = 0.04;
          scene.globe.atmosphereSaturationShift = -0.15;
          scene.backgroundColor = Cesium.Color.fromCssColorString('#0a0705');

          // FAST & RESPONSIVE CAMERA CONTROLLER TUNING (Eliminates sluggish/slow zoom)
          const controller = scene.screenSpaceCameraController;
          controller.inertiaSpin = 0.05; // crisp, responsive rotation
          controller.inertiaTranslate = 0.05; // responsive panning
          controller.inertiaZoom = 0.02; // instant stop, zero floaty zoom lag
          controller.zoomFactor = 16.0; // powerful, fast zoom response per notch
          controller.minimumZoomDistance = 250.0; // street/local level accessibility
          controller.maximumZoomDistance = 25000000.0; // full orbital overview
          controller.enableCollisionDetection = false;

          // Set initial view to India
          viewer.camera.setView({
            destination: Cesium.Cartesian3.fromDegrees(78.9629, 21.5937, 4500000.0),
            orientation: {
              heading: 0.0,
              pitch: Cesium.Math.toRadians(-75.0),
              roll: 0.0,
            },
          });

          // Screen space event handler for clicks, double clicks, and hover
          const handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);

          // Left Click (Select Entity)
          handler.setInputAction((click) => {
            const pickedObject = scene.pick(click.position);
            if (Cesium.defined(pickedObject) && pickedObject.id && pickedObject.id.dcData) {
              const entityData = pickedObject.id.dcData;
              const entityType = pickedObject.id.dcType || 'city';
              setSelectedEntity(entityData);
              setSelectedType(entityType);
              if (onSelectEntity) onSelectEntity(entityData);
            } else {
              setSelectedEntity(null);
            }
          }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

          // Double Click (Fast Direct Zoom to Position)
          handler.setInputAction((click) => {
            const ray = viewer.camera.getPickRay(click.position);
            const targetPos = scene.globe.pick(ray, scene);
            if (Cesium.defined(targetPos)) {
              const carto = Cesium.Cartographic.fromCartesian(targetPos);
              const targetHeight = Math.max(12000.0, viewer.camera.positionCartographic.height * 0.35);
              viewer.camera.flyTo({
                destination: Cesium.Cartesian3.fromRadians(carto.longitude, carto.latitude, targetHeight),
                duration: 0.5,
              });
            }
          }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

          handler.setInputAction((movement) => {
            const pickedObject = scene.pick(movement.endPosition);
            if (Cesium.defined(pickedObject) && pickedObject.id && pickedObject.id.dcData) {
              const data = pickedObject.id.dcData;
              const type = pickedObject.id.dcType;
              setHoveredTooltip({
                x: movement.endPosition.x,
                y: movement.endPosition.y,
                title: data.name || data.title || (type === 'sos' ? `🚨 SOS [${data.severity || 'HIGH'}]` : 'Incident'),
                subtitle: data.subtitle || data.country || data.location || (type === 'shelter' ? `Safe Shelter (${data.availableBeds ?? 0} beds)` : 'Active Entity'),
                type,
              });
            } else {
              setHoveredTooltip(null);
            }
          }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

          viewerRef.current = viewer;
          handlerRef.current = handler;
          setCesiumLoaded(true);
        } catch (err) {
          console.warn('[CesiumCrisisGlobe] Failed to initialize Cesium Viewer, falling back to 2D:', err);
          setHasWebGlError(true);
        }
      })
      .catch((err) => {
        console.warn('[CesiumCrisisGlobe] Cesium loader error:', err);
        setHasWebGlError(true);
      });

    return () => {
      isCancelled = true;
      if (handlerRef.current && !handlerRef.current.isDestroyed()) {
        handlerRef.current.destroy();
        handlerRef.current = null;
      }
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, [onSelectEntity]);

  // Update Dynamic Cesium Entities
  useEffect(() => {
    const viewer = viewerRef.current;
    const Cesium = window.Cesium;
    if (!viewer || viewer.isDestroyed() || !Cesium) return;

    const entities = viewer.entities;
    entities.removeAll();

    // 1. CITIES (Level of Detail via Distance Display Conditions)
    if (layers.cities) {
      for (const city of WORLD_CITIES) {
        // Distance visibility: Tier 1 always, Tier 2 under 8500km, Tier 3 under 4500km
        const maxDist = city.tier === 1 ? 15000000.0 : city.tier === 2 ? 8500000.0 : 4500000.0;
        const color = city.isCapital ? Cesium.Color.fromCssColorString('#FFC83B') : Cesium.Color.fromCssColorString('#94A3B8');

        entities.add({
          position: Cesium.Cartesian3.fromDegrees(city.lon, city.lat, 0.0),
          point: {
            pixelSize: city.isCapital ? 6 : 4,
            color,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 1,
            distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0.0, maxDist),
          },
          label: {
            text: city.name,
            font: '11px "Plus Jakarta Sans", sans-serif',
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -8),
            distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0.0, maxDist * 0.7),
          },
          dcData: city,
          dcType: 'city',
        });
      }
    }

    // 2. SOS DISTRESS REQUESTS (Crimson / Orange Emergency Beacons)
    if (layers.sos) {
      for (const sos of activeSosList) {
        if (sos.latitude == null || sos.longitude == null) continue;
        const isCritical = sos.severity === 'Critical';
        const color = isCritical
          ? Cesium.Color.fromCssColorString('#E53935')
          : Cesium.Color.fromCssColorString('#FF6B2C');

        entities.add({
          position: Cesium.Cartesian3.fromDegrees(sos.longitude, sos.latitude, 0.0),
          point: {
            pixelSize: isCritical ? 12 : 9,
            color,
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 2,
          },
          label: {
            text: `🚨 SOS ${sos.severity ? `[${sos.severity.toUpperCase()}]` : ''}`,
            font: 'bold 12px "JetBrains Mono", monospace',
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            fillColor: color,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 3,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -12),
          },
          dcData: sos,
          dcType: 'sos',
        });
      }
    }

    // 3. SAFE SHELTERS (Lime Safe Haven Shield Pins)
    if (layers.shelters) {
      for (const sh of safeShelters) {
        if (sh.latitude == null || sh.longitude == null) continue;
        const color = Cesium.Color.fromCssColorString('#84CC16');

        entities.add({
          position: Cesium.Cartesian3.fromDegrees(sh.longitude, sh.latitude, 0.0),
          point: {
            pixelSize: 10,
            color,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
          },
          label: {
            text: `🏛️ ${sh.name || 'Shelter'}`,
            font: '11px "Plus Jakarta Sans", sans-serif',
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -10),
            distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0.0, 3500000.0),
          },
          dcData: sh,
          dcType: 'shelter',
        });
      }
    }

    // 4. FIELD INCIDENTS (Amber Hazard Octahedrons)
    if (layers.incidents) {
      for (const inc of safeIncidents) {
        if (inc.latitude == null || inc.longitude == null) continue;
        const color = Cesium.Color.fromCssColorString('#F59E0B');

        entities.add({
          position: Cesium.Cartesian3.fromDegrees(inc.longitude, inc.latitude, 0.0),
          point: {
            pixelSize: 8,
            color,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 1,
          },
          label: {
            text: `📋 ${inc.title || inc.type || 'Incident'}`,
            font: '10px "Plus Jakarta Sans", sans-serif',
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            fillColor: color,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -8),
            distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0.0, 2500000.0),
          },
          dcData: inc,
          dcType: 'incident',
        });
      }
    }

    // 5. AFFECTED HAZARD PERIMETERS
    if (layers.affectedAreas) {
      for (const area of safeAreas) {
        if (area.latitude == null || area.longitude == null) continue;
        const isCritical = area.severity === 'Critical';
        const color = isCritical
          ? Cesium.Color.fromCssColorString('#E53935').withAlpha(0.25)
          : Cesium.Color.fromCssColorString('#FF6B2C').withAlpha(0.22);
        const radiusMeters = (area.radiusKm || 25) * 1000.0;

        entities.add({
          position: Cesium.Cartesian3.fromDegrees(area.longitude, area.latitude, 0.0),
          ellipse: {
            semiMinorAxis: radiusMeters,
            semiMajorAxis: radiusMeters,
            material: color,
            outline: true,
            outlineColor: isCritical
              ? Cesium.Color.fromCssColorString('#E53935')
              : Cesium.Color.fromCssColorString('#FF6B2C'),
            outlineWidth: 2,
          },
          dcData: area,
          dcType: 'area',
        });
      }
    }

    // 6. RISK INTELLIGENCE OVERLAYS
    if (layers.risk) {
      for (const rz of safeRiskZones) {
        if (rz.latitude == null || rz.longitude == null) continue;
        const riskColor =
          rz.riskLevel === 'CRITICAL'
            ? Cesium.Color.fromCssColorString('#E53935').withAlpha(0.25)
            : rz.riskLevel === 'HIGH'
            ? Cesium.Color.fromCssColorString('#FF6B2C').withAlpha(0.2)
            : Cesium.Color.fromCssColorString('#F59E0B').withAlpha(0.18);

        entities.add({
          position: Cesium.Cartesian3.fromDegrees(rz.longitude, rz.latitude, 0.0),
          ellipse: {
            semiMinorAxis: 40000.0,
            semiMajorAxis: 40000.0,
            material: riskColor,
          },
          dcData: rz,
          dcType: 'riskZone',
        });
      }
    }
  }, [layers, activeSosList, safeShelters, safeIncidents, safeAreas, safeRiskZones]);

  // 2D Tactical Command Fallback View if WebGL fails
  if (hasWebGlError) {
    return (
      <div
        className="spatial-panel"
        style={{
          position: 'relative',
          width: '100%',
          height: '560px',
          background: 'radial-gradient(circle at center, #1C110D 0%, #0C0705 100%)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          border: '1px solid var(--border-medium)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center',
        }}
      >
        <div style={{ color: 'var(--orange-primary)', fontSize: '2.5rem', marginBottom: '0.75rem' }}>🌐</div>
        <h3 style={{ color: '#ffffff', fontWeight: 800, marginBottom: '0.5rem' }}>2D Tactical Command Grid</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', maxWidth: '480px', marginBottom: '1.5rem' }}>
          3D hardware acceleration is running in 2D compatibility mode. All DisasterChain emergency telemetry, SOS beacons, and shelters are accessible via the Tactical Map below.
        </p>
        <button
          type="button"
          onClick={() => {
            if (onViewMap) onViewMap();
          }}
          className="btn btn-primary"
        >
          OPEN TACTICAL 2D COMMAND MAP →
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '560px',
        minHeight: '480px',
        background: 'radial-gradient(circle at center, #1C110D 0%, #0C0705 100%)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        border: '1px solid var(--border-medium)',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.9), inset 0 0 80px rgba(0, 0, 0, 0.8)',
      }}
    >
      {/* Cesium 3D Globe Container */}
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          cursor: 'grab',
        }}
      />

      {/* TOP LEFT: Geospatial Search Input */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          zIndex: 90,
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
              background: 'rgba(18, 11, 8, 0.92)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-xs)',
              padding: '0.65rem 0.85rem',
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

      {/* TOP RIGHT: Navigation Flight Buttons */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          right: selectedEntity ? '370px' : '16px',
          zIndex: 90,
          display: 'flex',
          gap: '6px',
          transition: 'right 0.2s ease',
        }}
      >
        <button
          type="button"
          onClick={handleZoomIn}
          className="btn btn-secondary btn-sm"
          style={{
            background: 'rgba(18, 11, 8, 0.9)',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: '0.9rem',
            padding: '2px 9px',
            minWidth: '28px',
          }}
          title="Zoom In (Fast)"
        >
          +
        </button>

        <button
          type="button"
          onClick={handleZoomOut}
          className="btn btn-secondary btn-sm"
          style={{
            background: 'rgba(18, 11, 8, 0.9)',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: '0.9rem',
            padding: '2px 9px',
            minWidth: '28px',
          }}
          title="Zoom Out (Fast)"
        >
          −
        </button>

        <button
          type="button"
          onClick={handleFocusIndia}
          className="btn btn-secondary btn-sm"
          style={{
            background: cameraViewMode === 'INDIA' ? 'var(--orange-primary)' : 'rgba(18, 11, 8, 0.9)',
            color: cameraViewMode === 'INDIA' ? '#ffffff' : 'var(--text-primary)',
            borderColor: 'var(--orange-primary)',
            fontWeight: 800,
            fontSize: '0.74rem',
            padding: '4px 10px',
          }}
          title="Focus Indian Subcontinent"
        >
          🇮🇳 INDIA FOCUS
        </button>

        <button
          type="button"
          onClick={handleFocusWorld}
          className="btn btn-secondary btn-sm"
          style={{
            background: cameraViewMode === 'WORLD' ? 'var(--orange-primary)' : 'rgba(18, 11, 8, 0.9)',
            color: cameraViewMode === 'WORLD' ? '#ffffff' : 'var(--text-primary)',
            fontSize: '0.74rem',
            padding: '4px 10px',
          }}
          title="Global Orbital Overview"
        >
          🌐 WORLD
        </button>

        <button
          type="button"
          onClick={handleFocusUserLocation}
          className="btn btn-secondary btn-sm"
          style={{
            background: cameraViewMode === 'USER' ? 'var(--safe)' : 'rgba(18, 11, 8, 0.9)',
            color: cameraViewMode === 'USER' ? '#ffffff' : 'var(--text-primary)',
            fontSize: '0.74rem',
            padding: '4px 10px',
          }}
          title="Center My Location"
        >
          📍 MY LOCATION
        </button>
      </div>

      {/* BOTTOM LEFT: Layer Controls */}
      <div
        style={{
          position: 'absolute',
          bottom: '16px',
          left: '16px',
          zIndex: 90,
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
          maxWidth: '560px',
        }}
      >
        <button
          type="button"
          onClick={() => toggleLayer('cities')}
          style={{
            background: layers.cities ? 'rgba(255, 200, 59, 0.18)' : 'rgba(0, 0, 0, 0.6)',
            border: `1px solid ${layers.cities ? '#ffc83b' : 'var(--border-subtle)'}`,
            color: layers.cities ? '#ffc83b' : 'var(--text-muted)',
            padding: '3px 8px',
            borderRadius: 'var(--radius-xs)',
            fontSize: '0.72rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          🏙️ CITIES
        </button>

        <button
          type="button"
          onClick={() => toggleLayer('sos')}
          style={{
            background: layers.sos ? 'rgba(229, 57, 53, 0.2)' : 'rgba(0, 0, 0, 0.6)',
            border: `1px solid ${layers.sos ? 'var(--crimson)' : 'var(--border-subtle)'}`,
            color: layers.sos ? 'var(--crimson)' : 'var(--text-muted)',
            padding: '3px 8px',
            borderRadius: 'var(--radius-xs)',
            fontSize: '0.72rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          🚨 SOS ({activeSosList.length})
        </button>

        <button
          type="button"
          onClick={() => toggleLayer('shelters')}
          style={{
            background: layers.shelters ? 'rgba(132, 204, 22, 0.2)' : 'rgba(0, 0, 0, 0.6)',
            border: `1px solid ${layers.shelters ? 'var(--safe)' : 'var(--border-subtle)'}`,
            color: layers.shelters ? 'var(--safe)' : 'var(--text-muted)',
            padding: '3px 8px',
            borderRadius: 'var(--radius-xs)',
            fontSize: '0.72rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          🏛️ SHELTERS ({safeShelters.length})
        </button>

        <button
          type="button"
          onClick={() => toggleLayer('incidents')}
          style={{
            background: layers.incidents ? 'rgba(245, 158, 11, 0.2)' : 'rgba(0, 0, 0, 0.6)',
            border: `1px solid ${layers.incidents ? 'var(--amber)' : 'var(--border-subtle)'}`,
            color: layers.incidents ? 'var(--amber)' : 'var(--text-muted)',
            padding: '3px 8px',
            borderRadius: 'var(--radius-xs)',
            fontSize: '0.72rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          📋 INCIDENTS ({safeIncidents.length})
        </button>

        <button
          type="button"
          onClick={() => toggleLayer('affectedAreas')}
          style={{
            background: layers.affectedAreas ? 'rgba(255, 107, 44, 0.2)' : 'rgba(0, 0, 0, 0.6)',
            border: `1px solid ${layers.affectedAreas ? 'var(--orange-primary)' : 'var(--border-subtle)'}`,
            color: layers.affectedAreas ? 'var(--orange-primary)' : 'var(--text-muted)',
            padding: '3px 8px',
            borderRadius: 'var(--radius-xs)',
            fontSize: '0.72rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          ⚠️ HAZARDS ({safeAreas.length})
        </button>

        <button
          type="button"
          onClick={() => toggleLayer('risk')}
          style={{
            background: layers.risk ? 'rgba(245, 158, 11, 0.2)' : 'rgba(0, 0, 0, 0.6)',
            border: `1px solid ${layers.risk ? 'var(--amber)' : 'var(--border-subtle)'}`,
            color: layers.risk ? 'var(--amber)' : 'var(--text-muted)',
            padding: '3px 8px',
            borderRadius: 'var(--radius-xs)',
            fontSize: '0.72rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          🌡️ RISK GRID
        </button>
      </div>

      {/* Hover Tooltip HUD */}
      {hoveredTooltip && (
        <div
          style={{
            position: 'absolute',
            left: `${hoveredTooltip.x + 12}px`,
            top: `${hoveredTooltip.y - 12}px`,
            background: 'rgba(18, 11, 8, 0.95)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-xs)',
            padding: '4px 8px',
            pointerEvents: 'none',
            zIndex: 95,
            boxShadow: '0 4px 12px rgba(0,0,0,0.7)',
          }}
        >
          <div style={{ fontWeight: 800, fontSize: '0.78rem', color: '#ffffff' }}>
            {hoveredTooltip.title}
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
            {hoveredTooltip.subtitle}
          </div>
        </div>
      )}

      {/* Selected Location Information HUD Panel */}
      {selectedEntity && (
        <GlobeLocationPanel
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

const CrisisGlobe3D = (props) => (
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
          background: 'radial-gradient(circle at center, #1C110D 0%, #0C0705 100%)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-md)',
          padding: '2rem',
          textAlign: 'center',
        }}
      >
        <div style={{ color: 'var(--orange-primary)', fontSize: '2.5rem', marginBottom: '0.5rem' }}>🌐</div>
        <h3 style={{ color: '#ffffff', fontWeight: 800, marginBottom: '0.5rem' }}>2D Tactical Command Fallback</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '420px', marginBottom: '1.25rem' }}>
          Geographic 3D acceleration is running in 2D compatibility mode. All live DisasterChain telemetry remains accessible.
        </p>
        <button type="button" onClick={reset} className="btn btn-secondary btn-sm">
          ↻ RELOAD COMMAND VIEW
        </button>
      </div>
    )}
  >
    <CesiumCrisisGlobe {...props} />
  </ErrorBoundary>
);

export default CrisisGlobe3D;
