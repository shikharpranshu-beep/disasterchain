import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import Icon from './Icons';

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
 * Procedurally generates a photorealistic 2048x1024 Real Earth Equirectangular Texture
 * with detailed continents, realistic ocean bathymetry, mountain ranges, night lights,
 * and high-detail highlighting for the Indian Subcontinent.
 */
const createRealEarthTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  const width = canvas.width;
  const height = canvas.height;

  // Helper: map Lat/Lon to Canvas X/Y
  const toX = (lon) => ((lon + 180) / 360) * width;
  const toY = (lat) => ((90 - lat) / 180) * height;

  // 1. Ocean Base & Bathymetric Gradient
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
  oceanGrad.addColorStop(0, '#040b17'); // Arctic dark
  oceanGrad.addColorStop(0.2, '#06162d');
  oceanGrad.addColorStop(0.5, '#0a2344'); // Tropical / Equatorial
  oceanGrad.addColorStop(0.8, '#06162d');
  oceanGrad.addColorStop(1, '#040b17'); // Antarctic dark
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Continental Shelf / Coastal Waters (Shallow lighter blues)
  ctx.strokeStyle = 'rgba(14, 56, 88, 0.4)';
  ctx.lineWidth = 14;
  ctx.lineJoin = 'round';

  // Draw helper for geographic polygons
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

  // --- MAJOR CONTINENTAL LANDMASSES ---
  const terrainColor = '#1b3829';
  const desertColor = '#3f3c27';

  // Africa
  const africa = [
    [-17, 30], [-10, 36], [10, 37], [25, 32], [32, 31], [35, 25],
    [43, 13], [51, 12], [42, -5], [40, -10], [35, -20], [30, -34],
    [26, -34], [18, -34], [14, -28], [12, -15], [9, 4], [-2, 5],
    [-13, 9], [-15, 12], [-17, 16], [-17, 30]
  ];
  drawPolygon(africa, terrainColor, 'rgba(0, 240, 255, 0.2)', 1.5);
  // Sahara Desert Overlay
  const sahara = [
    [-15, 28], [5, 33], [30, 30], [33, 20], [20, 16], [0, 16], [-14, 20]
  ];
  drawPolygon(sahara, desertColor, null);

  // Eurasia (excluding Indian peninsula which is detailed separately)
  const eurasia = [
    [-9, 36], [-8, 43], [-1, 46], [2, 51], [8, 55], [12, 58], [25, 71],
    [45, 68], [60, 73], [85, 74], [110, 73], [140, 70], [170, 66], [180, 65],
    [170, 60], [155, 55], [142, 48], [130, 38], [122, 30], [118, 22],
    [108, 14], [100, 5], [98, 10], [92, 22], [88, 27], [82, 28], [75, 32],
    [68, 30], [60, 25], [55, 25], [45, 13], [42, 22], [36, 31], [28, 41],
    [15, 45], [0, 43], [-9, 36]
  ];
  drawPolygon(eurasia, terrainColor, 'rgba(0, 240, 255, 0.2)', 1.5);

  // North America
  const northAmerica = [
    [-168, 65], [-150, 60], [-135, 55], [-125, 48], [-120, 35], [-110, 30],
    [-105, 20], [-90, 16], [-83, 9], [-77, 8], [-80, 22], [-82, 25],
    [-75, 35], [-70, 42], [-65, 45], [-55, 50], [-60, 62], [-75, 68],
    [-95, 70], [-120, 72], [-140, 70], [-168, 65]
  ];
  drawPolygon(northAmerica, terrainColor, 'rgba(0, 240, 255, 0.2)', 1.5);

  // South America
  const southAmerica = [
    [-77, 8], [-72, 11], [-60, 9], [-50, 0], [-35, -5], [-35, -12],
    [-40, -22], [-50, -30], [-58, -38], [-65, -55], [-74, -53], [-75, -45],
    [-72, -35], [-76, -20], [-80, -5], [-77, 8]
  ];
  drawPolygon(southAmerica, terrainColor, 'rgba(0, 240, 255, 0.2)', 1.5);

  // Australia
  const australia = [
    [114, -22], [122, -18], [130, -12], [136, -12], [142, -11], [148, -20],
    [153, -28], [150, -37], [140, -38], [130, -32], [115, -35], [113, -28], [114, -22]
  ];
  drawPolygon(australia, desertColor, 'rgba(0, 240, 255, 0.2)', 1.5);

  // --- 🇮🇳 DETAILED INDIAN SUB-CONTINENT ---
  // High-precision geographic boundary polygon for India
  const indiaPolygon = [
    [68.5, 23.8], // Rann of Kutch
    [70.0, 21.0], // Kathiawar / Saurashtra peninsula
    [72.8, 19.0], // Mumbai / Konkan coast
    [73.8, 15.5], // Goa
    [74.8, 13.0], // Karnataka coast / Mangalore
    [76.2, 9.9],  // Kerala coast / Kochi
    [77.5, 8.1],  // Kanyakumari (Cape Comorin)
    [78.2, 9.0],  // Gulf of Mannar
    [79.8, 10.8], // Coromandel Coast / Point Calimere
    [80.3, 13.1], // Chennai / Andhra coast
    [82.3, 16.9], // Godavari delta
    [85.0, 19.5], // Odisha coast / Chilika
    [87.0, 21.5], // Balasore / Bengal coast
    [88.3, 22.5], // Sundarbans delta
    [91.5, 23.5], // Tripura / Barak valley
    [93.0, 24.5], // Manipur
    [95.0, 27.5], // Arunachal Pradesh border
    [92.5, 27.8], // Bhutan border / Assam
    [88.5, 27.3], // Sikkim
    [84.0, 27.5], // Nepal border / Uttar Pradesh
    [80.0, 29.5], // Uttarakhand / Himalayas
    [78.0, 31.5], // Himachal Pradesh
    [75.0, 34.5], // Jammu & Kashmir / Ladakh
    [74.0, 33.0], // Western border
    [71.5, 28.0], // Rajasthan Thar desert
    [68.5, 23.8], // Return to Kutch
  ];

  // Draw Indian Peninsula Base with rich terrain gradient
  const indiaGrad = ctx.createRadialGradient(toX(78.5), toY(20.5), 10, toX(78.5), toY(20.5), 180);
  indiaGrad.addColorStop(0, '#2d5a3f');   // Fertile central plains / Deccan
  indiaGrad.addColorStop(0.5, '#224a33'); // Coastal Western/Eastern Ghats
  indiaGrad.addColorStop(0.9, '#1a3a28');
  drawPolygon(indiaPolygon, indiaGrad, '#00f0ff', 2.8); // Glowing Indian sovereign border

  // Sri Lanka Island
  const sriLanka = [
    [79.8, 9.5], [81.5, 8.5], [81.8, 7.0], [80.5, 6.0], [79.8, 7.5], [79.8, 9.5]
  ];
  drawPolygon(sriLanka, '#224a33', '#00f0ff', 1.5);

  // Himalayan Snow Arc (Northern Crown of India)
  ctx.beginPath();
  ctx.moveTo(toX(73.5), toY(34.8));
  ctx.quadraticCurveTo(toX(83.0), toY(28.5), toX(95.5), toY(28.0));
  ctx.lineWidth = 9;
  ctx.strokeStyle = 'rgba(235, 248, 255, 0.85)'; // Glacial white
  ctx.stroke();

  // Indo-Gangetic River Basin Line (Ganges / Yamuna / Brahmaputra)
  ctx.beginPath();
  ctx.moveTo(toX(78.0), toY(30.0));
  ctx.quadraticCurveTo(toX(84.0), toY(26.0), toX(88.3), toY(22.5));
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.6)';
  ctx.stroke();

  // Highlight Western Ghats Mountain Ridge
  ctx.beginPath();
  ctx.moveTo(toX(73.0), toY(20.5));
  ctx.quadraticCurveTo(toX(75.0), toY(14.0), toX(77.2), toY(8.5));
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = 'rgba(40, 80, 50, 0.9)';
  ctx.stroke();

  // 3. Cyber-Cartographic Graticule (15-degree Lat/Long Grid)
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.07)';
  ctx.lineWidth = 1;
  // Parallels (Latitude)
  for (let lat = -75; lat <= 75; lat += 15) {
    const y = toY(lat);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  // Meridians (Longitude)
  for (let lon = -180; lon <= 180; lon += 15) {
    const x = toX(lon);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // Equator Highlight Line
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(0, toY(0));
  ctx.lineTo(width, toY(0));
  ctx.stroke();
  ctx.setLineDash([]);

  // 4. City Night Lights & Tactical Command Hubs (Golden/Cyan nodes)
  const urbanNodes = [
    // Major Indian Strategic Metros
    { lon: 77.2090, lat: 28.6139, label: 'DELHI', r: 4.5, color: '#f59e0b' },
    { lon: 72.8777, lat: 19.0760, label: 'MUMBAI', r: 4.0, color: '#f59e0b' },
    { lon: 88.3639, lat: 22.5726, label: 'KOLKATA', r: 3.5, color: '#f59e0b' },
    { lon: 77.5946, lat: 12.9716, label: 'BENGALURU', r: 3.5, color: '#f59e0b' },
    { lon: 80.2707, lat: 13.0827, label: 'CHENNAI', r: 3.5, color: '#f59e0b' },
    { lon: 78.4867, lat: 17.3850, label: 'HYDERABAD', r: 3.5, color: '#f59e0b' },
    // Global Reference Metros
    { lon: -0.1278, lat: 51.5074, r: 2.5, color: '#e2e8f0' },
    { lon: 139.6917, lat: 35.6895, r: 2.5, color: '#e2e8f0' },
    { lon: -74.0060, lat: 40.7128, r: 2.5, color: '#e2e8f0' },
    { lon: 103.8198, lat: 1.3521, r: 2.5, color: '#e2e8f0' },
    { lon: 55.2708, lat: 25.2048, r: 2.5, color: '#e2e8f0' },
  ];

  urbanNodes.forEach((node) => {
    const x = toX(node.lon);
    const y = toY(node.lat);

    // Glow halo
    const glow = ctx.createRadialGradient(x, y, 1, x, y, node.r * 2.5);
    glow.addColorStop(0, node.color);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, node.r * 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Solid core
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, node.r * 0.6, 0, Math.PI * 2);
    ctx.fill();
  });

  return new THREE.CanvasTexture(canvas);
};

/**
 * Generates an atmospheric cloud texture with soft procedural whisps
 */
const createCloudTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = 'rgba(0, 0, 0, 0)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw semi-transparent atmospheric cloud patterns
  ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
  for (let i = 0; i < 90; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const radius = 25 + Math.random() * 55;

    const grad = ctx.createRadialGradient(x, y, 5, x, y, radius);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.28)');
    grad.addColorStop(0.6, 'rgba(220, 245, 255, 0.12)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
};

const CrisisGlobe3D = ({
  sosRequests = [],
  affectedAreas = [],
  shelters = [],
  onSelectEntity,
}) => {
  const mountRef = useRef(null);
  const [webGlSupported, setWebGlSupported] = useState(true);
  const [activeViewMode, setActiveViewMode] = useState('3D'); // '3D' | '2D'
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [isRotating, setIsRotating] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'sos' | 'areas' | 'shelters'

  // Ref to hold rotation animator function to allow external focus
  const focusIndiaRef = useRef(null);
  const resetZoomRef = useRef(null);

  // Filter items with valid coordinates
  const validSos = useMemo(() => {
    return (sosRequests || []).filter(
      (s) => typeof s?.latitude === 'number' && typeof s?.longitude === 'number' && !isNaN(s.latitude) && !isNaN(s.longitude)
    );
  }, [sosRequests]);

  const validAreas = useMemo(() => {
    return (affectedAreas || []).filter(
      (a) => typeof a?.latitude === 'number' && typeof a?.longitude === 'number' && !isNaN(a.latitude) && !isNaN(a.longitude)
    );
  }, [affectedAreas]);

  const validShelters = useMemo(() => {
    return (shelters || []).filter(
      (sh) => typeof sh?.latitude === 'number' && typeof sh?.longitude === 'number' && !isNaN(sh.latitude) && !isNaN(sh.longitude)
    );
  }, [shelters]);

  useEffect(() => {
    if (activeViewMode !== '3D') return;

    // Check WebGL availability
    const testCanvas = document.createElement('canvas');
    const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
    if (!gl) {
      setWebGlSupported(false);
      setActiveViewMode('2D');
      return;
    }

    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 480;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1200);
    camera.position.z = 210;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Root Globe Group for Rotation
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    const GLOBE_RADIUS = 68;

    // 1. Real Earth Photorealistic Texture Surface
    const earthTexture = createRealEarthTexture();
    const sphereGeo = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64);
    const sphereMat = new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.65,
      metalness: 0.12,
    });
    const earthMesh = new THREE.Mesh(sphereGeo, sphereMat);
    globeGroup.add(earthMesh);

    // 2. Atmospheric Clouds Layer
    const cloudTexture = createCloudTexture();
    const cloudGeo = new THREE.SphereGeometry(GLOBE_RADIUS + 1.2, 48, 48);
    const cloudMat = new THREE.MeshBasicMaterial({
      map: cloudTexture,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
    });
    const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
    globeGroup.add(cloudMesh);

    // 3. Cyan Atmospheric Outer Halo Glow
    const haloGeo = new THREE.SphereGeometry(GLOBE_RADIUS + 4.5, 36, 36);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.09,
      side: THREE.BackSide,
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    scene.add(haloMesh);

    // 4. Subtle Deep Space Starfield
    const starGeo = new THREE.BufferGeometry();
    const starCount = 400;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 800;
      starPositions[i + 1] = (Math.random() - 0.5) * 800;
      starPositions[i + 2] = (Math.random() - 0.5) * 800;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0x64748b,
      size: 1.4,
      transparent: true,
      opacity: 0.5,
    });
    const starPoints = new THREE.Points(starGeo, starMat);
    scene.add(starPoints);

    // 5. Orbital Directional & Ambient Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.4);
    sunLight.position.set(150, 100, 120);
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x00f0ff, 0.75);
    rimLight.position.set(-150, -60, -100);
    scene.add(rimLight);

    // 6. INITIAL ORIENTATION: CENTER ON INDIA (Lat ~21°N, Lon ~79°E)
    // Longitude 78.96°E -> Target globeGroup.rotation.y = -Math.PI * 0.44
    // Latitude 20.59°N  -> Target globeGroup.rotation.x = 0.36
    const INDIA_ROT_Y = -Math.PI * 0.438;
    const INDIA_ROT_X = 0.355;
    globeGroup.rotation.y = INDIA_ROT_Y;
    globeGroup.rotation.x = INDIA_ROT_X;

    // Interactive Marker Objects Container
    const markersGroup = new THREE.Group();
    globeGroup.add(markersGroup);

    const interactiveMeshes = [];

    // Helper: Add SOS 🔴 Vertical Beacons
    if (activeFilter === 'all' || activeFilter === 'sos') {
      validSos.forEach((sos) => {
        const pos = latLongToVector3(sos.latitude, sos.longitude, GLOBE_RADIUS);

        // Radiant Light Column Needle
        const needleGeo = new THREE.CylinderGeometry(0.35, 1.4, 7.5, 8);
        needleGeo.rotateX(Math.PI / 2);
        const needleMat = new THREE.MeshBasicMaterial({ color: 0xff1744 });
        const needleMesh = new THREE.Mesh(needleGeo, needleMat);
        needleMesh.position.copy(pos);
        needleMesh.lookAt(0, 0, 0);

        // Beacon Head Glowing Sphere
        const headGeo = new THREE.SphereGeometry(1.6, 12, 12);
        const headMat = new THREE.MeshBasicMaterial({ color: 0xff0033 });
        const headPos = latLongToVector3(sos.latitude, sos.longitude, GLOBE_RADIUS + 7.5);
        const headMesh = new THREE.Mesh(headGeo, headMat);
        headMesh.position.copy(headPos);

        // Ground Ripple Rings
        const ringGeo = new THREE.RingGeometry(1.4, 3.2, 20);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0xff1744,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.75,
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.position.copy(pos);
        ringMesh.lookAt(0, 0, 0);

        needleMesh.userData = { type: 'SOS', item: sos, ring: ringMesh, head: headMesh };
        headMesh.userData = { type: 'SOS', item: sos, ring: ringMesh, head: headMesh };

        interactiveMeshes.push(needleMesh, headMesh);
        markersGroup.add(needleMesh);
        markersGroup.add(headMesh);
        markersGroup.add(ringMesh);
      });
    }

    // Helper: Add Affected Area 🟠 Danger Domes
    if (activeFilter === 'all' || activeFilter === 'areas') {
      validAreas.forEach((area) => {
        const pos = latLongToVector3(area.latitude, area.longitude, GLOBE_RADIUS + 0.4);
        const domeGeo = new THREE.SphereGeometry(3.8, 16, 16);
        const domeMat = new THREE.MeshBasicMaterial({
          color: 0xf59e0b,
          transparent: true,
          opacity: 0.6,
        });
        const domeMesh = new THREE.Mesh(domeGeo, domeMat);
        domeMesh.position.copy(pos);
        domeMesh.userData = { type: 'AREA', item: area };
        interactiveMeshes.push(domeMesh);
        markersGroup.add(domeMesh);
      });
    }

    // Helper: Add Shelter 🔵 Diamond Crystal Beacons
    if (activeFilter === 'all' || activeFilter === 'shelters') {
      validShelters.forEach((sh) => {
        const pos = latLongToVector3(sh.latitude, sh.longitude, GLOBE_RADIUS + 2.5);
        const octGeo = new THREE.OctahedronGeometry(2.4);
        const octMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
        const octMesh = new THREE.Mesh(octGeo, octMat);
        octMesh.position.copy(pos);

        // Base ground ring
        const basePos = latLongToVector3(sh.latitude, sh.longitude, GLOBE_RADIUS + 0.2);
        const ringGeo = new THREE.RingGeometry(1.2, 2.5, 16);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0x00f0ff,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.5,
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.position.copy(basePos);
        ringMesh.lookAt(0, 0, 0);

        octMesh.userData = { type: 'SHELTER', item: sh, crystal: octMesh };
        interactiveMeshes.push(octMesh);
        markersGroup.add(octMesh);
        markersGroup.add(ringMesh);
      });
    }

    // Interactive Drag & Zoom Controls
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let targetCameraZ = 210;

    const onMouseDown = (e) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      globeGroup.rotation.y += deltaX * 0.005;
      globeGroup.rotation.x = Math.max(-1.4, Math.min(1.4, globeGroup.rotation.x + deltaY * 0.005));
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e) => {
      e.preventDefault();
      targetCameraZ += e.deltaY * 0.12;
      targetCameraZ = Math.max(130, Math.min(340, targetCameraZ));
    };

    // Touch handlers for mobile
    let touchStartX = 0;
    let touchStartY = 0;
    const onTouchStart = (e) => {
      if (e.touches.length === 1) {
        isDragging = true;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    };
    const onTouchMove = (e) => {
      if (!isDragging || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - touchStartX;
      const deltaY = e.touches[0].clientY - touchStartY;
      globeGroup.rotation.y += deltaX * 0.006;
      globeGroup.rotation.x = Math.max(-1.4, Math.min(1.4, globeGroup.rotation.x + deltaY * 0.006));
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };
    const onTouchEnd = () => {
      isDragging = false;
    };

    const raycaster = new THREE.Raycaster();
    const mouseVector = new THREE.Vector2();

    const onClick = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouseVector.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseVector.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouseVector, camera);
      const intersects = raycaster.intersectObjects(interactiveMeshes);

      if (intersects.length > 0) {
        const hit = intersects[0].object.userData;
        setSelectedEntity(hit);
        if (onSelectEntity) onSelectEntity(hit);
      }
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    domElement.addEventListener('wheel', onWheel, { passive: false });
    domElement.addEventListener('touchstart', onTouchStart, { passive: true });
    domElement.addEventListener('touchmove', onTouchMove, { passive: true });
    domElement.addEventListener('touchend', onTouchEnd);
    domElement.addEventListener('click', onClick);

    // Provide Focus India Hook
    focusIndiaRef.current = () => {
      globeGroup.rotation.y = INDIA_ROT_Y;
      globeGroup.rotation.x = INDIA_ROT_X;
      targetCameraZ = 180;
    };

    resetZoomRef.current = () => {
      targetCameraZ = 210;
    };

    // Animation Loop
    let animId;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Slow smooth auto-rotation if idle
      if (isRotating && !isDragging) {
        globeGroup.rotation.y += 0.0018;
      }

      // Independent cloud rotation for true atmospheric depth
      cloudMesh.rotation.y += 0.0006;

      // Smooth camera zoom lerping
      camera.position.z += (targetCameraZ - camera.position.z) * 0.1;

      // Pulse SOS ripple rings & shelter crystals
      interactiveMeshes.forEach((mesh) => {
        if (mesh.userData?.type === 'SOS' && mesh.userData?.ring) {
          const s = 1 + 0.35 * Math.sin(elapsedTime * 4.5);
          mesh.userData.ring.scale.set(s, s, s);
          mesh.userData.ring.material.opacity = 0.5 + 0.3 * Math.sin(elapsedTime * 4.5);
        } else if (mesh.userData?.type === 'SHELTER' && mesh.userData?.crystal) {
          mesh.userData.crystal.rotation.y += 0.02;
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    // Responsive Resize Handler
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      domElement.removeEventListener('wheel', onWheel);
      domElement.removeEventListener('touchstart', onTouchStart);
      domElement.removeEventListener('touchmove', onTouchMove);
      domElement.removeEventListener('touchend', onTouchEnd);
      domElement.removeEventListener('click', onClick);

      if (container.contains(domElement)) {
        container.removeChild(domElement);
      }

      renderer.dispose();
      sphereGeo.dispose();
      sphereMat.dispose();
      earthTexture.dispose();
      cloudGeo.dispose();
      cloudMat.dispose();
      cloudTexture.dispose();
      haloGeo.dispose();
      haloMat.dispose();
      starGeo.dispose();
      starMat.dispose();
    };
  }, [activeViewMode, validSos, validAreas, validShelters, isRotating, activeFilter, onSelectEntity]);

  const handleFocusIndia = useCallback(() => {
    if (focusIndiaRef.current) focusIndiaRef.current();
  }, []);

  const handleResetZoom = useCallback(() => {
    if (resetZoomRef.current) resetZoomRef.current();
  }, []);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '520px',
        background: 'radial-gradient(ellipse at center, #0c182b 0%, #060b14 100%)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        overflow: 'hidden',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.75)',
      }}
    >
      {/* 3D WebGL Earth Mount */}
      {activeViewMode === '3D' && webGlSupported && (
        <div ref={mountRef} style={{ width: '100%', height: '100%', cursor: 'grab' }} />
      )}

      {/* Fallback 2D Tactical View */}
      {(activeViewMode === '2D' || !webGlSupported) && (
        <div
          style={{
            width: '100%',
            height: '100%',
            padding: '2rem',
            overflowY: 'auto',
            background: 'rgba(8, 12, 22, 0.98)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, color: '#ffffff', fontSize: '1.1rem', fontWeight: 800 }}>
                2D Geospatial Tactical Overview
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Direct crisis telemetry stream for low-bandwidth / 2D mission environments
              </span>
            </div>
            <button
              onClick={() => setActiveViewMode('3D')}
              className="btn btn-primary btn-sm"
              disabled={!webGlSupported}
            >
              Switch to 3D Real Earth Globe
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {/* SOS List */}
            <div className="spatial-panel" style={{ padding: '1rem' }}>
              <h4 style={{ margin: '0 0 0.75rem 0', color: 'var(--crimson)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--crimson)' }} />
                🔴 Live SOS Distress Beacons ({validSos.length})
              </h4>
              {validSos.map((s) => (
                <div
                  key={s._id}
                  onClick={() => setSelectedEntity({ type: 'SOS', item: s })}
                  style={{
                    padding: '0.65rem',
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: 'var(--radius-xs)',
                    marginBottom: '0.5rem',
                    cursor: 'pointer',
                  }}
                >
                  <strong style={{ color: '#ffffff', fontSize: '0.85rem' }}>{s.name}</strong>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{s.emergencyType} • Lat: {s.latitude.toFixed(2)}, Lon: {s.longitude.toFixed(2)}</div>
                </div>
              ))}
            </div>

            {/* Shelters List */}
            <div className="spatial-panel" style={{ padding: '1rem' }}>
              <h4 style={{ margin: '0 0 0.75rem 0', color: 'var(--cyan)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--cyan)' }} />
                🔵 Relief Shelters ({validShelters.length})
              </h4>
              {validShelters.map((sh) => (
                <div
                  key={sh._id}
                  onClick={() => setSelectedEntity({ type: 'SHELTER', item: sh })}
                  style={{
                    padding: '0.65rem',
                    background: 'rgba(0, 240, 255, 0.08)',
                    border: '1px solid rgba(0, 240, 255, 0.2)',
                    borderRadius: 'var(--radius-xs)',
                    marginBottom: '0.5rem',
                    cursor: 'pointer',
                  }}
                >
                  <strong style={{ color: '#ffffff', fontSize: '0.85rem' }}>{sh.name}</strong>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Capacity: {sh.capacity} beds • {sh.status}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Top HUD Mission Header Bar */}
      <div
        style={{
          position: 'absolute',
          top: '0.85rem',
          left: '1rem',
          right: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 10,
          pointerEvents: 'none',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', pointerEvents: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', background: 'rgba(5, 10, 20, 0.85)', padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '1.15rem' }}>🌍</span>
            <span style={{ fontWeight: 800, fontSize: '0.82rem', letterSpacing: '0.05em', color: '#ffffff' }}>
              REAL EARTH GLOBE
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(0, 240, 255, 0.12)', border: '1px solid var(--cyan)', padding: '0.35rem 0.65rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', color: 'var(--cyan)', fontWeight: 700 }}>
            <span>🇮🇳</span>
            <span>INDIA REGIONAL FOCUS</span>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '0.4rem', pointerEvents: 'auto' }}>
          <button
            type="button"
            onClick={handleFocusIndia}
            className="btn btn-sm"
            style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(16, 185, 129, 0.25) 100%)',
              border: '1px solid rgba(245, 158, 11, 0.6)',
              color: '#ffffff',
              fontSize: '0.75rem',
              fontWeight: 800,
              padding: '0.35rem 0.75rem',
            }}
          >
            🇮🇳 Focus India
          </button>

          <button
            type="button"
            onClick={() => setIsRotating(!isRotating)}
            className="btn btn-ghost btn-sm"
            style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
          >
            {isRotating ? '⏸ Pause Spin' : '▶ Auto-Orbit'}
          </button>

          <button
            type="button"
            onClick={handleResetZoom}
            className="btn btn-ghost btn-sm"
            style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
          >
            🔍 Reset Zoom
          </button>

          <button
            type="button"
            onClick={() => setActiveViewMode(activeViewMode === '3D' ? '2D' : '3D')}
            className="btn btn-ghost btn-sm"
            style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
          >
            {activeViewMode === '3D' ? '🗺️ 2D View' : '🌍 3D Globe'}
          </button>
        </div>
      </div>

      {/* Layer Filter Pills */}
      <div
        style={{
          position: 'absolute',
          top: '3.5rem',
          left: '1rem',
          display: 'flex',
          gap: '0.4rem',
          zIndex: 10,
        }}
      >
        <button
          type="button"
          onClick={() => setActiveFilter('all')}
          className={`btn btn-sm ${activeFilter === 'all' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem' }}
        >
          All Layers
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter('sos')}
          className={`btn btn-sm ${activeFilter === 'sos' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem', color: '#ff4d6d' }}
        >
          🔴 SOS ({validSos.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter('areas')}
          className={`btn btn-sm ${activeFilter === 'areas' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem', color: '#fbbf24' }}
        >
          🟠 Hazards ({validAreas.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter('shelters')}
          className={`btn btn-sm ${activeFilter === 'shelters' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem', color: '#00f0ff' }}
        >
          🔵 Shelters ({validShelters.length})
        </button>
      </div>

      {/* Selected Entity Tactical Card */}
      {selectedEntity && (
        <div
          style={{
            position: 'absolute',
            bottom: '1rem',
            left: '1rem',
            maxWidth: '380px',
            width: 'calc(100% - 2rem)',
            background: 'rgba(8, 14, 26, 0.96)',
            border: '1px solid var(--border-highlight)',
            borderRadius: 'var(--radius-md)',
            padding: '1.15rem',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.85)',
            zIndex: 25,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span
              className="badge"
              style={{
                fontSize: '0.7rem',
                background:
                  selectedEntity.type === 'SOS'
                    ? 'rgba(239, 68, 68, 0.2)'
                    : selectedEntity.type === 'SHELTER'
                    ? 'rgba(0, 240, 255, 0.2)'
                    : 'rgba(245, 158, 11, 0.2)',
                color:
                  selectedEntity.type === 'SOS'
                    ? 'var(--crimson)'
                    : selectedEntity.type === 'SHELTER'
                    ? 'var(--cyan)'
                    : 'var(--amber)',
                border: '1px solid currentColor',
              }}
            >
              {selectedEntity.type === 'SOS'
                ? '🔴 LIVE SOS DISTRESS'
                : selectedEntity.type === 'SHELTER'
                ? '🔵 EMERGENCY SHELTER'
                : '🟠 CRISIS THREAT ZONE'}
            </span>
            <button
              onClick={() => setSelectedEntity(null)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.1rem' }}
            >
              ✕
            </button>
          </div>

          <div style={{ fontWeight: 800, color: '#ffffff', fontSize: '1.05rem', marginBottom: '0.35rem' }}>
            {selectedEntity.item?.name || selectedEntity.item?.emergencyType || 'Geospatial Object'}
          </div>

          <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.65rem', lineHeight: 1.4 }}>
            📍 {selectedEntity.item?.address || selectedEntity.item?.location || `Lat: ${selectedEntity.item?.latitude?.toFixed(4)}, Lon: ${selectedEntity.item?.longitude?.toFixed(4)}`}
          </div>

          {selectedEntity.item?.emergencyType && (
            <div style={{ fontSize: '0.78rem', color: '#ff6b81', marginBottom: '0.25rem' }}>
              <strong>Emergency Type:</strong> {selectedEntity.item.emergencyType}
            </div>
          )}

          {selectedEntity.item?.capacity && (
            <div style={{ fontSize: '0.78rem', color: 'var(--cyan)', marginBottom: '0.25rem' }}>
              <strong>Beds Available:</strong> {selectedEntity.item.capacity - (selectedEntity.item.occupancy || 0)} / {selectedEntity.item.capacity} total
            </div>
          )}

          {selectedEntity.item?.severity && (
            <div style={{ fontSize: '0.78rem', color: 'var(--amber)', marginBottom: '0.25rem' }}>
              <strong>Severity:</strong> {selectedEntity.item.severity}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.85rem' }}>
            <button
              onClick={() => {
                if (onSelectEntity) onSelectEntity(selectedEntity);
              }}
              className="btn btn-primary btn-sm"
              style={{ fontSize: '0.75rem', width: '100%' }}
            >
              Open Crisis Record
            </button>
          </div>
        </div>
      )}

      {/* Bottom Telemetry Legend Bar */}
      <div
        style={{
          position: 'absolute',
          bottom: '0.85rem',
          right: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          background: 'rgba(6, 11, 20, 0.88)',
          padding: '0.4rem 0.85rem',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
          fontSize: '0.72rem',
          fontFamily: 'var(--font-mono)',
          zIndex: 10,
          pointerEvents: 'none',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#ff6b81' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--crimson)' }} /> 🔴 SOS ({validSos.length})
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#fbbf24' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--amber)' }} /> 🟠 Threat ({validAreas.length})
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--cyan)' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--cyan)' }} /> 🔵 Shelter ({validShelters.length})
        </span>
      </div>
    </div>
  );
};

export default CrisisGlobe3D;
