import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CrisisGlobe3D from '../components/CrisisGlobe3D';
import Icon from '../components/Icons';
import { fetchSosRequests, fetchShelters, fetchAffectedAreas } from '../services/api';

const LandingPage = ({ onOpenSos }) => {
  const { isAuthenticated } = useAuth();
  const [sosList, setSosList] = useState([]);
  const [shelters, setShelters] = useState([]);
  const [affectedAreas, setAffectedAreas] = useState([]);

  useEffect(() => {
    const loadPreviewData = async () => {
      try {
        const [sos, sh, areas] = await Promise.all([
          fetchSosRequests(),
          fetchShelters(),
          fetchAffectedAreas(),
        ]);
        setSosList(sos || []);
        setShelters(sh || []);
        setAffectedAreas(areas || []);
      } catch (e) {
        // Fallback silently if unauthenticated
      }
    };
    loadPreviewData();
  }, []);

  const hazardCategories = [
    { title: 'Earthquake', icon: '🏚️', desc: 'Seismic tremor precautions, structural safety & Drop-Cover-Hold protocols.' },
    { title: 'Flood Inundation', icon: '🌊', desc: 'Water level monitoring, drinking water purification & evacuation vectors.' },
    { title: 'Fire & Chemical', icon: '🔥', desc: 'Rapid smoke evacuation, building egress mapping & hazardous zone avoidance.' },
    { title: 'Severe Cyclone', icon: '🌀', desc: 'High-velocity wind shelter, structural bracing & meteorological warnings.' },
    { title: 'Landslide Risk', icon: '⛰️', desc: 'Slope failure telemetry, geological mudflow alerts & escape routing.' },
    { title: 'Extreme Heatwave', icon: '☀️', desc: 'Severe hyperthermia prevention, hydration points & community cooling hubs.' },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-space)' }}>
      {/* Top Academic Prototype Disclaimer */}
      <div
        style={{
          background: 'rgba(255, 46, 77, 0.1)',
          borderBottom: '1px solid var(--border-red)',
          color: '#ff8597',
          textAlign: 'center',
          padding: '0.45rem 1rem',
          fontSize: '0.78rem',
          fontFamily: 'var(--font-mono)',
        }}
      >
        ⚠️ <strong>ACADEMIC PROTOCOL:</strong> DisasterChain is an emergency response & cryptographic relief transparency system. In immediate danger, call <strong>112</strong> / <strong>101</strong>.
      </div>

      {/* Hero Section */}
      <section
        style={{
          padding: '4rem 1.5rem 3rem',
          maxWidth: '1280px',
          margin: '0 auto',
          width: '100%',
          display: 'grid',
          gridTemplateColumns: '1.1fr 0.9fr',
          gap: '2.5rem',
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.85rem', background: 'rgba(0, 240, 255, 0.08)', border: '1px solid var(--border-highlight)', borderRadius: 'var(--radius-xs)', marginBottom: '1.25rem' }}>
            <span className="live-beacon-pulse" />
            <span className="micro-label" style={{ color: 'var(--cyan)' }}>
              NEXT-GEN IMMERSIVE CRISIS OPERATIONS
            </span>
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '3.2rem',
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              marginBottom: '1.25rem',
              color: '#ffffff',
            }}
          >
            Mission-Critical Response.<br />
            <span style={{ background: 'linear-gradient(135deg, var(--cyan) 0%, var(--violet) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Cryptographic Integrity.
            </span>
          </h1>

          <p
            style={{
              fontSize: '1.05rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              marginBottom: '2rem',
              maxWidth: '560px',
            }}
          >
            DisasterChain connects real-time GPS distress signaling, live shelter occupancy rings, interactive 3D crisis intelligence, and immutable SHA-256 relief supply tracking into a unified civil defense network.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={onOpenSos}
              className="btn btn-emergency btn-lg"
              id="hero-sos-btn"
            >
              <Icon name="alert-circle" size={18} color="#ffffff" />
              <span>TRANSMIT DISTRESS SOS</span>
            </button>

            <Link
              to={isAuthenticated ? '/dashboard' : '/login'}
              className="btn btn-primary btn-lg"
            >
              <Icon name="activity" size={18} />
              <span>{isAuthenticated ? 'Enter Command HUD' : 'Sign In to Grid'}</span>
            </Link>
          </div>
        </div>

        {/* Hero 3D Crisis Globe Feature Display */}
        <div style={{ height: '440px', width: '100%', position: 'relative' }}>
          <CrisisGlobe3D
            sosRequests={sosList}
            affectedAreas={affectedAreas}
            shelters={shelters}
          />
        </div>
      </section>

      <style>{`
        @media (max-width: 960px) {
          section[style*="gridTemplateColumns: 1.1fr 0.9fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* 4 Core Pillars */}
      <section style={{ maxWidth: '1280px', margin: '0 auto', width: '100%', padding: '0 1.5rem 3rem' }}>
        <div className="grid-cols-4">
          {[
            {
              title: 'Satellite SOS Beacon',
              desc: 'High-accuracy browser GPS telemetry and emergency distress triage routed immediately to frontline responders.',
              icon: '🚨',
              color: 'var(--crimson)',
            },
            {
              title: '3D Geospatial Intel',
              desc: 'Interactive WebGL planetary grid visualizing distress spikes, impact perimeters, and safe haven clusters in real-time.',
              icon: '🌍',
              color: 'var(--cyan)',
            },
            {
              title: '5-Stage Supply Chain',
              desc: 'End-to-end relief logistics progression from source intake and inspection through transit and shelter distribution.',
              icon: '📦',
              color: 'var(--amber)',
            },
            {
              title: 'SHA-256 Audit Trail',
              desc: 'Cryptographically hashed donation and distribution records ensuring complete public auditability with zero tampering.',
              icon: '⛓️',
              color: 'var(--violet)',
            },
          ].map((pillar) => (
            <div
              key={pillar.title}
              className="spatial-panel spatial-panel-hoverable"
              style={{
                padding: '1.5rem',
                background: 'rgba(11, 17, 30, 0.88)',
                borderTop: `3px solid ${pillar.color}`,
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{pillar.icon}</div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.4rem' }}>
                {pillar.title}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.5 }}>
                {pillar.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Emergency Hotline Banner */}
      <section style={{ background: 'rgba(7, 11, 19, 0.95)', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)', padding: '2rem 1.5rem' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div className="micro-label" style={{ color: 'var(--crimson)' }}>CIVIL DEFENSE HOTLINES</div>
            <div style={{ fontWeight: 800, fontSize: '1.25rem', color: '#ffffff' }}>Direct Emergency Telephony</div>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div>
              <div className="micro-label">NATIONAL EMERGENCY</div>
              <a href="tel:112" style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1.4rem', color: 'var(--crimson)' }}>
                112
              </a>
            </div>
            <div>
              <div className="micro-label">FIRE BRIGADE</div>
              <a href="tel:101" style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1.4rem', color: 'var(--amber)' }}>
                101
              </a>
            </div>
            <div>
              <div className="micro-label">AMBULANCE</div>
              <a href="tel:108" style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1.4rem', color: 'var(--cyan)' }}>
                108
              </a>
            </div>
            <div>
              <div className="micro-label">NDRF DISASTER FORCE</div>
              <a href="tel:1078" style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1.4rem', color: 'var(--mint)' }}>
                1078
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Disaster Categories Section */}
      <section style={{ maxWidth: '1280px', margin: '0 auto', width: '100%', padding: '3.5rem 1.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div className="micro-label" style={{ color: 'var(--cyan)', marginBottom: '0.4rem' }}>
            PREPAREDNESS & CIVIL MITIGATION
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, color: '#ffffff' }}>
            Tactical Survival Directives by Hazard
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {hazardCategories.map((cat) => (
            <div
              key={cat.title}
              className="spatial-panel spatial-panel-hoverable"
              style={{
                padding: '1.25rem',
                background: 'rgba(11, 17, 30, 0.88)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1rem',
              }}
            >
              <div style={{ fontSize: '2rem' }}>{cat.icon}</div>
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.25rem' }}>
                  {cat.title}
                </h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.4 }}>
                  {cat.desc}
                </p>
                <Link to="/guides" style={{ fontSize: '0.76rem', color: 'var(--cyan)', fontWeight: 700, marginTop: '0.5rem', display: 'inline-block' }}>
                  View Protocol →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: 'var(--bg-void)', borderTop: '1px solid var(--border-subtle)', padding: '2rem 1.5rem', textAlign: 'center' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          DisasterChain Emergency Network v2.6 • Cryptographic Crisis Response Platform
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
