import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import Icon from './Icons';
import {
  WORLD_COUNTRIES,
  WORLD_CITIES,
  searchGeographicLocations,
  haversineDistanceKm,
  computeSpatialEmergencyTelemetry,
} from '../data/worldGeoData';
import GlobeLocationPanel from './GlobeLocationPanel';

/**
 * Converts Geographic Latitude & Longitude to 3D Cartesian Coordinates on a Sphere
 */
const latLongToVector3 = (lat, lon, radius) => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
};

/**
 * Converts 3D Cartesian Coordinate on a Sphere back to Latitude & Longitude
 */
const vector3ToLatLong = (vector, radius) => {
  const norm = vector.clone().normalize();
  const lat = 90 - Math.acos(norm.y) * (180 / Math.PI);
  const lon = ((Math.atan2(norm.z, -norm.x) * (180 / Math.PI)) - 180 + 360) % 360 - 180;
  return { lat, lon };
};

/**
 * Generates an ultra-realistic 2048x1024 Real Earth Equirectangular Texture
 * with continents, realistic ocean bathymetry, terrain gradients, country borders,
 * and high-resolution illumination for urban clusters.
 */
const createRealEarthTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  const width = canvas.width;
  const height = canvas.height;

  const toX = (lon) => ((lon + 180) / 360) * width;
  const toY = (lat) => ((90 - lat) / 180) * height;

  // 1. Deep Ocean Gradient
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
  oceanGrad.addColorStop(0, '#020712');
  oceanGrad.addColorStop(0.2, '#06162d');
  oceanGrad.addColorStop(0.5, '#0b284c');
  oceanGrad.addColorStop(0.8, '#06162d');
  oceanGrad.addColorStop(1, '#020712');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, width, height);

  // Helper: Draw polygon
  const drawPolygon = (points, fillStyle, strokeStyle, lineWidth = 0) => {
    if (points.length < 3) return;
    ctx.beginPath();
    ctx.moveTo(toX(points[0][0]), toY(points[0][1]));
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(toX(points[i][0]), toY(points[i][1]));
    }
    ctx.closePath();
    if (fillStyle) {
      ctx.fillStyle = fillStyle;
      ctx.fill();
    }
    if (strokeStyle && lineWidth > 0) {
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    }
  };

  const landColor = '#1e382b';
  const desertColor = '#423d26';
  const coastStroke = 'rgba(100, 200, 255, 0.25)';

  // Africa
  drawPolygon([
    [-17, 30], [-10, 36], [10, 37], [25, 32], [32, 31], [35, 25],
    [43, 13], [51, 12], [42, -5], [40, -10], [35, -20], [30, -34],
    [26, -34], [18, -34], [14, -28], [12, -15], [9, 4], [-2, 5],
    [-13, 9], [-15, 12], [-17, 16], [-17, 30]
  ], landColor, coastStroke, 1.2);

  // Sahara
  drawPolygon([
    [-15, 28], [5, 33], [30, 30], [33, 20], [20, 16], [0, 16], [-14, 20]
  ], desertColor, null);

  // Eurasia
  drawPolygon([
    [-9, 36], [-8, 43], [-1, 46], [2, 51], [8, 55], [12, 58], [25, 71],
    [45, 68], [60, 73], [85, 74], [110, 73], [140, 70], [170, 66], [180, 65],
    [170, 60], [155, 55], [142, 48], [130, 38], [122, 30], [118, 22],
    [108, 14], [100, 5], [98, 10], [92, 22], [88, 27], [82, 28], [75, 32],
    [68, 30], [60, 25], [55, 25], [45, 13], [42, 22], [36, 31], [28, 41],
    [15, 45], [0, 43], [-9, 36]
  ], landColor, coastStroke, 1.2);

  // Detailed Indian Peninsula
  const indiaPolygon = [
    [68.1, 23.7], [70.2, 21.0], [72.8, 19.0], [73.8, 15.4], [75.8, 11.9],
    [77.5, 8.1], [78.2, 8.8], [79.8, 10.3], [80.3, 13.1], [82.3, 16.5],
    [85.8, 20.3], [88.3, 21.7], [89.0, 25.5], [92.0, 25.0], [97.4, 28.0],
    [94.0, 29.5], [89.0, 27.5], [84.0, 28.5], [80.0, 31.0], [77.0, 35.5],
    [74.0, 36.0], [73.5, 33.0], [71.0, 29.0], [68.5, 24.5], [68.1, 23.7]
  ];
  drawPolygon(indiaPolygon, '#264a38', '#ff7a36', 1.8);

  // North America
  drawPolygon([
    [-168, 65], [-160, 71], [-140, 70], [-120, 76], [-90, 70], [-80, 60],
    [-65, 55], [-60, 46], [-75, 35], [-80, 25], [-97, 26], [-97, 18],
    [-85, 13], [-80, 9], [-83, 8], [-90, 14], [-105, 20], [-115, 30],
    [-124, 38], [-125, 49], [-135, 57], [-150, 60], [-168, 65]
  ], landColor, coastStroke, 1.2);

  // South America
  drawPolygon([
    [-77, 8], [-72, 11], [-60, 8], [-50, 0], [-35, -5], [-37, -12],
    [-40, -22], [-50, -30], [-60, -38], [-65, -55], [-75, -50], [-72, -40],
    [-70, -30], [-76, -15], [-80, -2], [-77, 8]
  ], landColor, coastStroke, 1.2);

  // Australia
  drawPolygon([
    [113, -22], [115, -34], [135, -35], [145, -38], [150, -35], [153, -28],
    [148, -19], [142, -11], [136, -12], [130, -13], [123, -17], [113, -22]
  ], '#3a3826', coastStroke, 1.2);

  // City Lights Illumination Map (Warm golden dots for global metros)
  ctx.fillStyle = 'rgba(255, 210, 140, 0.7)';
  for (const city of WORLD_CITIES) {
    const cx = toX(city.lon);
    const cy = toY(city.lat);
    const rad = city.tier === 1 ? 3.5 : city.tier === 2 ? 2.5 : 1.8;
    ctx.beginPath();
    ctx.arc(cx, cy, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
};

/**
 * Procedurally generates subtle Earth Cloud Layer texture
 */
const createEarthCloudTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = 'rgba(0, 0, 0, 0)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Semi-transparent procedural cloud wisps
  ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
  for (let i = 0; i < 60; i++) {
    const x = Math.random() * canvas.width;
    const y = 80 + Math.random() * (canvas.height - 160);
    const rx = 30 + Math.random() * 80;
    const ry = 10 + Math.random() * 25;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
};

const CrisisGlobe3D = ({
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
  const activeSosList = Array.isArray(sosList) && sosList.length > 0 ? sosList : Array.isArray(sosRequests) ? sosRequests : [];
  const safeShelters = Array.isArray(shelters) ? shelters : [];
  const safeIncidents = Array.isArray(incidents) ? incidents : [];
  const safeAreas = Array.isArray(affectedAreas) ? affectedAreas : [];
  const safeAlerts = Array.isArray(alerts) ? alerts : [];
  const safeRiskZones = Array.isArray(riskZones) ? riskZones : [];

  const [hasWebGlError, setHasWebGlError] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [selectedType, setSelectedType] = useState('city');
  const [hoveredEntity, setHoveredEntity] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [cameraViewMode, setCameraViewMode] = useState('INDIA'); // 'INDIA' | 'WORLD' | 'USER'
  const [currentZoomLevel, setCurrentZoomLevel] = useState(1); // 1 = World, 2 = Regional, 3 = City

  // Layer Toggles
  const [layers, setLayers] = useState({
    cities: true,
    sos: true,
    shelters: true,
    incidents: true,
    affectedAreas: true,
    alerts: true,
    risk: true,
    connections: true,
  });

  const toggleLayer = (layerKey) => {
    setLayers((prev) => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  // Three.js State References
  const threeRef = useRef({
    scene: null,
    camera: null,
    renderer: null,
    globeMesh: null,
    cloudsMesh: null,
    markersGroup: null,
    citiesGroup: null,
    connectionsGroup: null,
    animationFrameId: null,
    isInteracting: false,
    targetRotation: { x: 0.35, y: -1.35 },
    currentRotation: { x: 0.35, y: -1.35 },
    targetZoom: 4.8,
    currentZoom: 4.8,
  });

  // Calculate live telemetry for selected entity
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

  // Handle focusTarget prop changes from parent
  useEffect(() => {
    if (focusTarget && (focusTarget.latitude != null || focusTarget.lat != null)) {
      const lat = focusTarget.latitude ?? focusTarget.lat;
      const lon = focusTarget.longitude ?? focusTarget.lon;
      flyToLocation(lat, lon, 3.4, focusTarget, focusTarget.type?.toLowerCase() || 'city');
    }
  }, [focusTarget]);

  // Smooth camera flight function to specific latitude/longitude
  const flyToLocation = useCallback((lat, lon, zoom = 3.6, entity = null, type = 'city') => {
    const t = threeRef.current;
    if (!t) return;

    // Convert lat/lon to target spherical Euler angles
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);

    t.targetRotation = {
      x: phi - Math.PI / 2,
      y: -theta + Math.PI / 2,
    };
    t.targetZoom = zoom;

    if (entity) {
      setSelectedEntity(entity);
      setSelectedType(type);
    }
  }, []);

  // Handle Search Input & Autocomplete
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
    flyToLocation(result.lat, result.lon, result.type === 'country' ? 4.6 : 3.4, result, result.type);
  };

  // Focus Actions
  const handleFocusIndia = () => {
    setCameraViewMode('INDIA');
    const india = WORLD_COUNTRIES.find((c) => c.id === 'IND');
    flyToLocation(21.0, 78.9, 4.4, india, 'country');
  };

  const handleFocusWorld = () => {
    setCameraViewMode('WORLD');
    flyToLocation(20.0, 0.0, 6.2, null, 'country');
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
        flyToLocation(userLat, userLon, 3.2, {
          name: 'Your Current Location',
          subtitle: 'Active GPS Coordinates',
          lat: userLat,
          lon: userLon,
        }, 'city');
      },
      (err) => {
        console.warn('Geolocation permission denied or unavailable:', err.message);
      }
    );
  };

  // Global listener for AI assistant or dashboard focus triggers
  useEffect(() => {
    const handleGlobalFocus = (e) => {
      if (e.detail) {
        const { lat, lon, zoom, entity, type } = e.detail;
        if (lat != null && lon != null) {
          flyToLocation(lat, lon, zoom || 3.4, entity || { lat, lon, name: 'Target Focus' }, type || 'city');
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('disasterchain:globe-focus', handleGlobalFocus);
      return () => window.removeEventListener('disasterchain:globe-focus', handleGlobalFocus);
    }
  }, [flyToLocation]);

  // Main Three.js Scene Setup & Render Loop
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer = null;
    let scene = null;
    let camera = null;
    let globeMesh = null;
    let cloudsMesh = null;

    try {
      const width = container.clientWidth || 800;
      const height = container.clientHeight || 550;

      // 1. Scene & Camera
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
      camera.position.z = 4.8;

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.setSize(width, height);
      renderer.setPixelRatio(typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1);
      renderer.shadowMap.enabled = false;
      container.innerHTML = '';
      container.appendChild(renderer.domElement);
    } catch (err) {
      console.warn('[CrisisGlobe3D] WebGL initialization failed, rendering 2D fallback:', err);
      setHasWebGlError(true);
      return;
    }

    // 2. Realistic Lighting (Day & Night Sun)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffeedd, 1.4);
    sunLight.position.set(5, 3, 5);
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0xff6b2c, 0.4);
    rimLight.position.set(-5, -2, -5);
    scene.add(rimLight);

    // 3. Realistic Globe Sphere
    const globeRadius = 1.8;
    const globeGeo = new THREE.SphereGeometry(globeRadius, 64, 64);
    const globeTexture = createRealEarthTexture();
    const globeMat = new THREE.MeshStandardMaterial({
      map: globeTexture,
      roughness: 0.65,
      metalness: 0.15,
    });
    globeMesh = new THREE.Mesh(globeGeo, globeMat);
    scene.add(globeMesh);

    // 4. Subtle Atmospheric Edge Ring
    const atmoGeo = new THREE.SphereGeometry(globeRadius * 1.025, 32, 32);
    const atmoMat = new THREE.MeshBasicMaterial({
      color: 0xff6b2c,
      transparent: true,
      opacity: 0.08,
      side: THREE.BackSide,
    });
    const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
    scene.add(atmoMesh);

    // 5. Cloud Layer
    const cloudsTexture = createEarthCloudTexture();
    const cloudsGeo = new THREE.SphereGeometry(globeRadius * 1.012, 48, 48);
    const cloudsMat = new THREE.MeshStandardMaterial({
      map: cloudsTexture,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
    });
    cloudsMesh = new THREE.Mesh(cloudsGeo, cloudsMat);
    scene.add(cloudsMesh);

    // 6. Entity Groups
    const citiesGroup = new THREE.Group();
    const markersGroup = new THREE.Group();
    const connectionsGroup = new THREE.Group();
    globeMesh.add(citiesGroup);
    globeMesh.add(markersGroup);
    globeMesh.add(connectionsGroup);

    threeRef.current = {
      ...threeRef.current,
      scene,
      camera,
      renderer,
      globeMesh,
      cloudsMesh,
      markersGroup,
      citiesGroup,
      connectionsGroup,
    };

    // 7. Mouse & Touch Drag Interaction
    let isDragging = false;
    let dragStartPos = { x: 0, y: 0 };
    let previousMousePosition = { x: 0, y: 0 };

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onClick = (e) => {
      // Ignore click if it was a drag
      if (Math.hypot(e.clientX - dragStartPos.x, e.clientY - dragStartPos.y) > 6) return;
      if (!camera || !renderer) return;

      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(
        [...citiesGroup.children, ...markersGroup.children],
        true
      );

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        if (hit.userData?.entity) {
          setSelectedEntity(hit.userData.entity);
          setSelectedType(hit.userData.type || 'city');
          if (onSelectEntity) onSelectEntity(hit.userData.entity);
        }
      }
    };

    const onMouseDown = (e) => {
      isDragging = true;
      threeRef.current.isInteracting = true;
      dragStartPos = { x: e.clientX, y: e.clientY };
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      threeRef.current.targetRotation.y += deltaX * 0.005;
      threeRef.current.targetRotation.x += deltaY * 0.005;

      // Clamp X tilt to prevent gimbal inversion
      threeRef.current.targetRotation.x = Math.max(-1.4, Math.min(1.4, threeRef.current.targetRotation.x));

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
      setTimeout(() => {
        threeRef.current.isInteracting = false;
      }, 3000);
    };

    const onWheel = (e) => {
      e.preventDefault();
      threeRef.current.targetZoom += e.deltaY * 0.0025;
      threeRef.current.targetZoom = Math.max(2.4, Math.min(7.5, threeRef.current.targetZoom));
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('click', onClick);
    domEl.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    domEl.addEventListener('wheel', onWheel, { passive: false });

    // Touch Support for Mobile Devices
    let touchStartDist = 0;
    const onTouchStart = (e) => {
      if (e.touches.length === 1) {
        isDragging = true;
        threeRef.current.isInteracting = true;
        previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        touchStartDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    };

    const onTouchMove = (e) => {
      if (e.touches.length === 1 && isDragging) {
        const deltaX = e.touches[0].clientX - previousMousePosition.x;
        const deltaY = e.touches[0].clientY - previousMousePosition.y;
        threeRef.current.targetRotation.y += deltaX * 0.007;
        threeRef.current.targetRotation.x += deltaY * 0.007;
        threeRef.current.targetRotation.x = Math.max(-1.4, Math.min(1.4, threeRef.current.targetRotation.x));
        previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const delta = touchStartDist - dist;
        threeRef.current.targetZoom += delta * 0.005;
        threeRef.current.targetZoom = Math.max(2.4, Math.min(7.5, threeRef.current.targetZoom));
        touchStartDist = dist;
      }
    };

    domEl.addEventListener('touchstart', onTouchStart, { passive: true });
    domEl.addEventListener('touchmove', onTouchMove, { passive: true });
    domEl.addEventListener('touchend', onMouseUp, { passive: true });

    // 8. Animation & Render Loop
    let lastTime = performance.now();
    const animate = () => {
      const now = performance.now();
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      // Slow passive auto-rotation when user is not interacting
      if (!threeRef.current.isInteracting && cameraViewMode === 'WORLD') {
        threeRef.current.targetRotation.y += 0.001;
      }

      // Smooth interpolation (damping)
      threeRef.current.currentRotation.x += (threeRef.current.targetRotation.x - threeRef.current.currentRotation.x) * 0.08;
      threeRef.current.currentRotation.y += (threeRef.current.targetRotation.y - threeRef.current.currentRotation.y) * 0.08;
      threeRef.current.currentZoom += (threeRef.current.targetZoom - threeRef.current.currentZoom) * 0.08;

      globeMesh.rotation.x = threeRef.current.currentRotation.x;
      globeMesh.rotation.y = threeRef.current.currentRotation.y;
      camera.position.z = threeRef.current.currentZoom;

      // Clouds gentle slow drift
      if (cloudsMesh) {
        cloudsMesh.rotation.y += 0.0003;
      }

      // Update LOD Zoom indicator
      const zoom = threeRef.current.currentZoom;
      if (zoom > 5.2) setCurrentZoomLevel(1);
      else if (zoom > 3.6) setCurrentZoomLevel(2);
      else setCurrentZoomLevel(3);

      renderer.render(scene, camera);
      threeRef.current.animationFrameId = requestAnimationFrame(animate);
    };

    threeRef.current.animationFrameId = requestAnimationFrame(animate);

    // Initial positioning to India
    handleFocusIndia();

    // Resize Handler
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      domEl.removeEventListener('click', onClick);
      domEl.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      domEl.removeEventListener('wheel', onWheel);
      domEl.removeEventListener('touchstart', onTouchStart);
      domEl.removeEventListener('touchmove', onTouchMove);
      domEl.removeEventListener('touchend', onMouseUp);
      if (threeRef.current.animationFrameId) {
        cancelAnimationFrame(threeRef.current.animationFrameId);
      }
      renderer.dispose();
    };
  }, []);

  // Update Dynamic City & Emergency Overlays on Globe
  useEffect(() => {
    const { citiesGroup, markersGroup, connectionsGroup } = threeRef.current;
    if (!citiesGroup || !markersGroup || !connectionsGroup) return;

    // Clear previous children
    while (citiesGroup.children.length > 0) citiesGroup.remove(citiesGroup.children[0]);
    while (markersGroup.children.length > 0) markersGroup.remove(markersGroup.children[0]);
    while (connectionsGroup.children.length > 0) connectionsGroup.remove(connectionsGroup.children[0]);

    const radius = 1.8;

    // --- 1. RENDER CITIES (LOD Filtered) ---
    if (layers.cities) {
      for (const city of WORLD_CITIES) {
        // Level of Detail: Tier 1 always, Tier 2 on regional zoom, Tier 3 on close zoom
        if (city.tier === 3 && currentZoomLevel < 3) continue;
        if (city.tier === 2 && currentZoomLevel < 2) continue;

        const pos = latLongToVector3(city.lat, city.lon, radius * 1.002);

        // Small neutral geographic marker dot
        const dotGeo = new THREE.SphereGeometry(0.016, 12, 12);
        const dotMat = new THREE.MeshBasicMaterial({
          color: city.isCapital ? 0xffc83b : 0x8899aa,
        });
        const dot = new THREE.Mesh(dotGeo, dotMat);
        dot.position.copy(pos);
        dot.userData = { entity: city, type: 'city' };
        citiesGroup.add(dot);
      }
    }

    // --- 2. RENDER LIVE DISASTERCHAIN CRISIS ENTITIES ---

    // A. SOS Distress Requests (Crimson Laser Beams & Pulsing Hubs)
    if (layers.sos) {
      for (const sos of activeSosList) {
        if (sos.latitude == null || sos.longitude == null) continue;
        const pos = latLongToVector3(sos.latitude, sos.longitude, radius * 1.006);

        const isCritical = sos.severity === 'Critical';
        const color = isCritical ? 0xe53935 : 0xff6b2c;

        // Base Beacon Disk
        const ringGeo = new THREE.RingGeometry(0.02, 0.045, 16);
        const ringMat = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.copy(pos);
        ring.lookAt(new THREE.Vector3(0, 0, 0));
        ring.userData = { entity: sos, type: 'sos' };
        markersGroup.add(ring);

        // Vertical Laser Beam Signal
        const beamHeight = isCritical ? 0.22 : 0.14;
        const beamGeo = new THREE.CylinderGeometry(0.005, 0.005, beamHeight, 8);
        const beamMat = new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.85,
        });
        const beam = new THREE.Mesh(beamGeo, beamMat);
        const normal = pos.clone().normalize();
        beam.position.copy(pos.clone().add(normal.clone().multiplyScalar(beamHeight / 2)));
        beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
        beam.userData = { entity: sos, type: 'sos' };
        markersGroup.add(beam);
      }
    }

    // B. Safe Shelters (Lime / Olive Shield Anchors)
    if (layers.shelters) {
      for (const sh of shelters) {
        if (sh.latitude == null || sh.longitude == null) continue;
        const pos = latLongToVector3(sh.latitude, sh.longitude, radius * 1.006);

        const shelterGeo = new THREE.BoxGeometry(0.035, 0.035, 0.035);
        const shelterMat = new THREE.MeshBasicMaterial({ color: 0x84cc16 });
        const shelterMesh = new THREE.Mesh(shelterGeo, shelterMat);
        shelterMesh.position.copy(pos);
        shelterMesh.lookAt(new THREE.Vector3(0, 0, 0));
        shelterMesh.userData = { entity: sh, type: 'shelter' };
        markersGroup.add(shelterMesh);
      }
    }

    // C. Field Incidents (Amber / Orange Warning Cubes)
    if (layers.incidents) {
      for (const inc of incidents) {
        if (inc.latitude == null || inc.longitude == null) continue;
        const pos = latLongToVector3(inc.latitude, inc.longitude, radius * 1.006);

        const incGeo = new THREE.OctahedronGeometry(0.03, 0);
        const incMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
        const incMesh = new THREE.Mesh(incGeo, incMat);
        incMesh.position.copy(pos);
        incMesh.userData = { entity: inc, type: 'incident' };
        markersGroup.add(incMesh);
      }
    }

    // D. Affected Hazard Perimeters
    if (layers.affectedAreas) {
      for (const area of affectedAreas) {
        if (area.latitude == null || area.longitude == null) continue;
        const pos = latLongToVector3(area.latitude, area.longitude, radius * 1.004);

        const areaRingGeo = new THREE.RingGeometry(0.06, 0.09, 24);
        const areaRingMat = new THREE.MeshBasicMaterial({
          color: area.severity === 'Critical' ? 0xe53935 : 0xff6b2c,
          transparent: true,
          opacity: 0.45,
          side: THREE.DoubleSide,
        });
        const areaMesh = new THREE.Mesh(areaRingGeo, areaRingMat);
        areaMesh.position.copy(pos);
        areaMesh.lookAt(new THREE.Vector3(0, 0, 0));
        areaMesh.userData = { entity: area, type: 'area' };
        markersGroup.add(areaMesh);
      }
    }

    // E. Emergency Network Connection Arcs (SOS -> Nearest Shelter)
    if (layers.connections) {
      for (const sos of activeSosList.slice(0, 10)) {
        if (sos.latitude == null || sos.longitude == null) continue;
        // Find nearest shelter
        let nearest = null;
        let minD = Infinity;
        for (const sh of shelters) {
          if (sh.latitude == null || sh.longitude == null) continue;
          const d = haversineDistanceKm(sos.latitude, sos.longitude, sh.latitude, sh.longitude);
          if (d < minD && d < 300) {
            minD = d;
            nearest = sh;
          }
        }

        if (nearest) {
          const start = latLongToVector3(sos.latitude, sos.longitude, radius * 1.006);
          const end = latLongToVector3(nearest.latitude, nearest.longitude, radius * 1.006);
          const mid = start.clone().add(end).multiplyScalar(0.5).normalize().multiplyScalar(radius * 1.15);

          const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
          const points = curve.getPoints(24);
          const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
          const lineMat = new THREE.LineBasicMaterial({
            color: 0xff6b2c,
            transparent: true,
            opacity: 0.65,
          });
          const arc = new THREE.Line(lineGeo, lineMat);
          connectionsGroup.add(arc);
        }
      }
    }
  }, [layers, sosList, shelters, incidents, affectedAreas, currentZoomLevel]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '560px',
        minHeight: '480px',
        background: 'radial-gradient(circle at center, #1c110d 0%, #0c0705 100%)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        border: '1px solid var(--border-medium)',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.9), inset 0 0 80px rgba(0, 0, 0, 0.8)',
      }}
    >
      {/* 3D Canvas Container */}
      <div ref={containerRef} style={{ width: '100%', height: '100%', cursor: 'grab' }} />

      {/* TOP LEFT: Geospatial Command Search Bar */}
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

        {/* Autocomplete Results Dropdown */}
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
                  flexDirection: 'column',
                  gap: '2px',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 107, 44, 0.15)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#ffffff' }}>
                  {res.name}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                  {res.subtitle}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TOP RIGHT: Focus Navigation Controls */}
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

      {/* BOTTOM LEFT: Layer Control Badges */}
      <div
        style={{
          position: 'absolute',
          bottom: '16px',
          left: '16px',
          zIndex: 90,
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
          maxWidth: '520px',
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
          onClick={() => toggleLayer('connections')}
          style={{
            background: layers.connections ? 'rgba(255, 107, 44, 0.15)' : 'rgba(0, 0, 0, 0.6)',
            border: `1px solid ${layers.connections ? 'var(--orange-primary)' : 'var(--border-subtle)'}`,
            color: layers.connections ? 'var(--orange-primary)' : 'var(--text-muted)',
            padding: '3px 8px',
            borderRadius: 'var(--radius-xs)',
            fontSize: '0.72rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          🌐 EVACUATION ARCS
        </button>
      </div>

      {/* BOTTOM RIGHT: Level of Detail (LOD) Status Indicator */}
      <div
        style={{
          position: 'absolute',
          bottom: '16px',
          right: '16px',
          zIndex: 80,
          background: 'rgba(0, 0, 0, 0.6)',
          padding: '4px 10px',
          borderRadius: 'var(--radius-xs)',
          fontSize: '0.68rem',
          color: 'var(--text-secondary)',
          fontFamily: 'monospace',
          border: '1px solid var(--border-subtle)',
        }}
      >
        {hasWebGlError ? '2D TACTICAL COMMAND GRID' : `LOD: ${currentZoomLevel === 1 ? 'GLOBAL VIEW (Capitals)' : currentZoomLevel === 2 ? 'REGIONAL VIEW (Major Hubs)' : 'LOCAL VIEW (Full Sector Telemetry)'}`}
      </div>

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

export default CrisisGlobe3D;
