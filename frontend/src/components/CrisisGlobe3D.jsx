import React, { useEffect, useRef, useState, useMemo } from 'react';
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
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
      setWebGlSupported(false);
      setActiveViewMode('2D');
      return;
    }

    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 450;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 210;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Root Globe Group for Rotation
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    const GLOBE_RADIUS = 68;

    // 1. Dark Mission Earth Base Sphere
    const sphereGeo = new THREE.SphereGeometry(GLOBE_RADIUS, 48, 48);
    const sphereMat = new THREE.MeshStandardMaterial({
      color: 0x090e1a,
      roughness: 0.85,
      metalness: 0.15,
    });
    const earthMesh = new THREE.Mesh(sphereGeo, sphereMat);
    globeGroup.add(earthMesh);

    // 2. Wireframe Geospatial Grid (Latitude & Longitude)
    const wireGeo = new THREE.SphereGeometry(GLOBE_RADIUS + 0.25, 24, 24);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      wireframe: true,
      transparent: true,
      opacity: 0.085,
    });
    const wireMesh = new THREE.Mesh(wireGeo, wireMat);
    globeGroup.add(wireMesh);

    // 3. Atmospheric Halo Glow
    const haloGeo = new THREE.SphereGeometry(GLOBE_RADIUS + 3.5, 32, 32);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.04,
      side: THREE.BackSide,
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    scene.add(haloMesh);

    // 4. Subtle Deep Space Starfield
    const starGeo = new THREE.BufferGeometry();
    const starCount = 350;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 600;
      starPositions[i + 1] = (Math.random() - 0.5) * 600;
      starPositions[i + 2] = (Math.random() - 0.5) * 600;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0x64748b,
      size: 1.2,
      transparent: true,
      opacity: 0.45,
    });
    const starPoints = new THREE.Points(starGeo, starMat);
    scene.add(starPoints);

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x00f0ff, 1.2);
    dirLight1.position.set(120, 80, 100);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x818cf8, 0.6);
    dirLight2.position.set(-120, -50, -80);
    scene.add(dirLight2);

    // 6. Interactive Marker Objects Container
    const markersGroup = new THREE.Group();
    globeGroup.add(markersGroup);

    const interactiveMeshes = [];

    // Helper: Add SOS Pin
    validSos.forEach((sos) => {
      const pos = latLongToVector3(sos.latitude, sos.longitude, GLOBE_RADIUS + 0.8);

      // Spike Cylinder
      const spikeGeo = new THREE.CylinderGeometry(0.3, 1.2, 5, 8);
      spikeGeo.rotateX(Math.PI / 2);
      const spikeMat = new THREE.MeshBasicMaterial({ color: 0xff2e4d });
      const spikeMesh = new THREE.Mesh(spikeGeo, spikeMat);
      spikeMesh.position.copy(pos);
      spikeMesh.lookAt(0, 0, 0);

      // Pulse Ring
      const ringGeo = new THREE.RingGeometry(1.2, 2.4, 16);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xff2e4d,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.copy(pos);
      ringMesh.lookAt(0, 0, 0);

      spikeMesh.userData = { type: 'SOS', item: sos, ring: ringMesh };
      interactiveMeshes.push(spikeMesh);
      markersGroup.add(spikeMesh);
      markersGroup.add(ringMesh);
    });

    // Helper: Add Affected Area Impact Dome
    validAreas.forEach((area) => {
      const pos = latLongToVector3(area.latitude, area.longitude, GLOBE_RADIUS + 0.5);
      const domeGeo = new THREE.SphereGeometry(3.5, 16, 16);
      const domeMat = new THREE.MeshBasicMaterial({
        color: 0xf59e0b,
        transparent: true,
        opacity: 0.55,
      });
      const domeMesh = new THREE.Mesh(domeGeo, domeMat);
      domeMesh.position.copy(pos);
      domeMesh.userData = { type: 'AREA', item: area };
      interactiveMeshes.push(domeMesh);
      markersGroup.add(domeMesh);
    });

    // Helper: Add Shelter Diamond Beacon
    validShelters.forEach((sh) => {
      const pos = latLongToVector3(sh.latitude, sh.longitude, GLOBE_RADIUS + 1.2);
      const octGeo = new THREE.OctahedronGeometry(2.2);
      const octMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
      const octMesh = new THREE.Mesh(octGeo, octMat);
      octMesh.position.copy(pos);
      octMesh.userData = { type: 'SHELTER', item: sh };
      interactiveMeshes.push(octMesh);
      markersGroup.add(octMesh);
    });

    // Mouse Interaction (Drag to Rotate, Click to Inspect)
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

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
      globeGroup.rotation.x += deltaY * 0.005;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseUp = (e) => {
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
    domElement.addEventListener('click', onClick);

    // Animation Loop
    let animId;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Gentle continuous rotation if not manually dragging
      if (isRotating && !isDragging) {
        globeGroup.rotation.y += 0.002;
      }

      // Animate SOS pulse rings
      interactiveMeshes.forEach((mesh) => {
        if (mesh.userData?.type === 'SOS' && mesh.userData?.ring) {
          const s = 1 + 0.3 * Math.sin(elapsedTime * 4);
          mesh.userData.ring.scale.set(s, s, s);
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
      domElement.removeEventListener('click', onClick);

      if (container.contains(domElement)) {
        container.removeChild(domElement);
      }

      renderer.dispose();
      sphereGeo.dispose();
      sphereMat.dispose();
      wireGeo.dispose();
      wireMat.dispose();
      haloGeo.dispose();
      haloMat.dispose();
      starGeo.dispose();
      starMat.dispose();
    };
  }, [activeViewMode, validSos, validAreas, validShelters, isRotating, onSelectEntity]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '480px',
        background: 'linear-gradient(180deg, rgba(8, 12, 22, 0.95) 0%, #06090f 100%)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-lg)',
      }}
    >
      {/* Top HUD Controls Overlay */}
      <div
        style={{
          position: 'absolute',
          top: '1rem',
          left: '1.25rem',
          right: '1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 10,
          pointerEvents: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div className="live-beacon-pulse" />
          <span className="micro-label" style={{ color: 'var(--cyan)' }}>
            GEOSPATIAL CRISIS TELEMETRY
          </span>
          <span className="badge badge-info" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
            LIVE ATLAS FEED
          </span>
        </div>

        {/* View Mode & Orbit Toggle Controls */}
        <div style={{ display: 'flex', gap: '0.5rem', pointerEvents: 'auto' }}>
          <button
            type="button"
            onClick={() => setIsRotating((prev) => !prev)}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.72rem', padding: '4px 10px' }}
            title={isRotating ? 'Pause Orbit Rotation' : 'Resume Orbit Rotation'}
          >
            {isRotating ? '⏸️ Orbit Active' : '▶️ Resume Orbit'}
          </button>
          <div
            style={{
              display: 'inline-flex',
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-xs)',
              overflow: 'hidden',
            }}
          >
            <button
              type="button"
              onClick={() => setActiveViewMode('3D')}
              style={{
                padding: '4px 10px',
                fontSize: '0.72rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: activeViewMode === '3D' ? 'var(--cyan)' : 'transparent',
                color: activeViewMode === '3D' ? '#040812' : 'var(--text-secondary)',
              }}
            >
              3D Globe
            </button>
            <button
              type="button"
              onClick={() => setActiveViewMode('2D')}
              style={{
                padding: '4px 10px',
                fontSize: '0.72rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: activeViewMode === '2D' ? 'var(--cyan)' : 'transparent',
                color: activeViewMode === '2D' ? '#040812' : 'var(--text-secondary)',
              }}
            >
              2D Matrix
            </button>
          </div>
        </div>
      </div>

      {/* 3D WebGL Canvas Mount Container */}
      {activeViewMode === '3D' && webGlSupported && (
        <div
          ref={mountRef}
          style={{
            width: '100%',
            height: '100%',
            cursor: 'grab',
          }}
        />
      )}

      {/* 2D Tactical Matrix Projection Fallback */}
      {(activeViewMode === '2D' || !webGlSupported) && (
        <div
          style={{
            width: '100%',
            height: '100%',
            padding: '4rem 1.5rem 1.5rem',
            overflowY: 'auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1rem',
          }}
        >
          <div className="spatial-panel" style={{ background: 'rgba(11, 17, 30, 0.9)' }}>
            <div className="micro-label" style={{ color: 'var(--crimson)', marginBottom: '0.6rem' }}>
              🚨 ACTIVE SOS DISTRESS BEACONS ({validSos.length})
            </div>
            {validSos.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No active signals.</div>
            ) : (
              validSos.slice(0, 4).map((s) => (
                <div
                  key={s._id}
                  onClick={() => setSelectedEntity({ type: 'SOS', item: s })}
                  style={{
                    padding: '0.5rem 0.65rem',
                    background: 'rgba(255, 46, 77, 0.08)',
                    border: '1px solid var(--border-red)',
                    borderRadius: 'var(--radius-xs)',
                    marginBottom: '0.4rem',
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                  }}
                >
                  <div style={{ fontWeight: 700, color: '#ff8597' }}>{s.emergencyType} — {s.name}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>📍 {s.location}</div>
                </div>
              ))
            )}
          </div>

          <div className="spatial-panel" style={{ background: 'rgba(11, 17, 30, 0.9)' }}>
            <div className="micro-label" style={{ color: 'var(--amber)', marginBottom: '0.6rem' }}>
              ⚠️ HAZARD IMPACT ZONES ({validAreas.length})
            </div>
            {validAreas.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No active zones.</div>
            ) : (
              validAreas.slice(0, 4).map((a) => (
                <div
                  key={a._id}
                  onClick={() => setSelectedEntity({ type: 'AREA', item: a })}
                  style={{
                    padding: '0.5rem 0.65rem',
                    background: 'rgba(245, 158, 11, 0.08)',
                    border: '1px solid var(--border-amber)',
                    borderRadius: 'var(--radius-xs)',
                    marginBottom: '0.4rem',
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                  }}
                >
                  <div style={{ fontWeight: 700, color: '#fcd34d' }}>{a.name} ({a.disasterType})</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Severity: {a.severity} | Affected: {a.affectedPeople}</div>
                </div>
              ))
            )}
          </div>

          <div className="spatial-panel" style={{ background: 'rgba(11, 17, 30, 0.9)' }}>
            <div className="micro-label" style={{ color: 'var(--cyan)', marginBottom: '0.6rem' }}>
              🛡️ OPEN RELIEF SHELTERS ({validShelters.length})
            </div>
            {validShelters.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No open shelters.</div>
            ) : (
              validShelters.slice(0, 4).map((sh) => (
                <div
                  key={sh._id}
                  onClick={() => setSelectedEntity({ type: 'SHELTER', item: sh })}
                  style={{
                    padding: '0.5rem 0.65rem',
                    background: 'rgba(0, 240, 255, 0.08)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-xs)',
                    marginBottom: '0.4rem',
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                  }}
                >
                  <div style={{ fontWeight: 700, color: 'var(--cyan)' }}>{sh.name}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Capacity: {sh.capacity - sh.occupancy} beds available</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Selected 3D Marker Mission Intelligence Popover */}
      {selectedEntity && (
        <div
          style={{
            position: 'absolute',
            bottom: '1rem',
            left: '1.25rem',
            maxWidth: '360px',
            background: 'rgba(9, 14, 25, 0.94)',
            border: '1px solid var(--border-highlight)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            backdropFilter: 'blur(16px)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 20,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
            <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>
              {selectedEntity.type} INSPECTION
            </span>
            <button
              onClick={() => setSelectedEntity(null)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem' }}
            >
              ✕
            </button>
          </div>
          <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.95rem', marginBottom: '0.25rem' }}>
            {selectedEntity.item?.name || selectedEntity.item?.emergencyType || 'Unknown Object'}
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
            📍 {selectedEntity.item?.location || selectedEntity.item?.address || 'Verified Coordinates'}
          </div>
          {selectedEntity.item?.severity && (
            <div style={{ fontSize: '0.75rem', color: 'var(--amber)' }}>
              Severity Level: {selectedEntity.item.severity}
            </div>
          )}
          {selectedEntity.item?.capacity && (
            <div style={{ fontSize: '0.75rem', color: 'var(--cyan)' }}>
              Capacity: {selectedEntity.item.occupancy} / {selectedEntity.item.capacity}
            </div>
          )}
        </div>
      )}

      {/* Bottom Telemetry Legend Bar */}
      <div
        style={{
          position: 'absolute',
          bottom: '0.85rem',
          right: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          background: 'rgba(7, 11, 19, 0.85)',
          padding: '0.35rem 0.85rem',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
          fontSize: '0.72rem',
          fontFamily: 'var(--font-mono)',
          zIndex: 10,
          pointerEvents: 'none',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ff6b81' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--crimson)' }} /> SOS Beacon
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#fbbf24' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--amber)' }} /> Impact Zone
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--cyan)' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--cyan)' }} /> Relief Shelter
        </span>
      </div>
    </div>
  );
};

export default CrisisGlobe3D;
