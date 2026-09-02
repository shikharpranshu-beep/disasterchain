import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/Icons';

const LandingPage = ({ onOpenSos }) => {
  const { isAuthenticated } = useAuth();

  const disasterCards = [
    { title: 'Earthquake', icon: '🏚️', desc: 'Seismic tremor precautions, structural safety & Drop-Cover-Hold protocols.' },
    { title: 'Flood Hazard', icon: '🌊', desc: 'Water inundation evacuation, drinking water safety & flood zones.' },
    { title: 'Campus Fire', icon: '🔥', desc: 'Building evacuation, smoke avoidance & PASS extinguisher usage.' },
    { title: 'Severe Cyclone', icon: '🌀', desc: 'Extreme wind protection, glass shelter safety & weather forecasts.' },
    { title: 'Landslide Risk', icon: '⛰️', desc: 'Slope failure detection, mudflow avoidance & escape route mapping.' },
    { title: 'Extreme Heatwave', icon: '☀️', desc: 'Hyperthermia prevention, hydration tactics & cooling stations.' },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Banner Disclaimer */}
      <div
        style={{
          background: 'rgba(239, 68, 68, 0.12)',
          borderBottom: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#fca5a5',
          textAlign: 'center',
          padding: '0.45rem 1rem',
          fontSize: '0.8rem',
        }}
      >
        ⚠️ <strong>ACADEMIC PROTOTYPE NOTICE:</strong> DisasterChain is an educational disaster management & relief transparency platform. In a real life-threatening emergency, dial <strong>112</strong> / <strong>101</strong> / <strong>108</strong> immediately.
      </div>

      {/* Hero Section */}
      <section
        style={{
          padding: '4.5rem 1.5rem 3.5rem',
          textAlign: 'center',
          maxWidth: '1080px',
          margin: '0 auto',
          position: 'relative',
        }}
      >
        <div
          className="badge badge-blockchain"
          style={{ padding: '0.4rem 1.15rem', fontSize: '0.84rem', marginBottom: '1.25rem' }}
        >
          <Icon name="blockchain" size={15} color="var(--accent-indigo)" />
          <span>Powered by Cryptographic Blockchain Verification</span>
        </div>

        <h1
          style={{
            fontSize: '3.4rem',
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-0.035em',
            marginBottom: '1.25rem',
            color: '#ffffff',
          }}
        >
          Respond Faster. Recover Smarter.<br />
          <span style={{ background: 'linear-gradient(135deg, #ff334b 0%, #6366f1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Track Relief Transparently.
          </span>
        </h1>

        <p
          style={{
            fontSize: '1.15rem',
            color: 'var(--text-secondary)',
            maxWidth: '780px',
            margin: '0 auto 2.25rem',
            lineHeight: 1.6,
          }}
        >
          DisasterChain unifies real-time emergency SOS signaling, shelter capacity tracking, campus hazard reporting, and cryptographic blockchain transparency for relief supplies into one authoritative crisis response ecosystem.
        </p>

        {/* Hero Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={onOpenSos}
            className="btn btn-sos btn-lg"
            id="hero-sos-btn"
          >
            <Icon name="sos" size={20} color="#ffffff" />
            <span>TRANSMIT EMERGENCY SOS</span>
          </button>

          <Link
            to={isAuthenticated ? '/dashboard' : '/login'}
            className="btn btn-primary btn-lg"
          >
            <Icon name="activity" size={19} />
            <span>{isAuthenticated ? 'Open Crisis Dashboard' : 'Enter Command Center'}</span>
            <Icon name="arrow-right" size={16} />
          </Link>

          <Link
            to="/guides"
            className="btn btn-secondary btn-lg"
          >
            <Icon name="book" size={18} />
            <span>Safety Protocols</span>
          </Link>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section style={{ maxWidth: '1240px', margin: '0 auto 4rem', padding: '0 2rem', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <span className="badge badge-info" style={{ marginBottom: '0.4rem' }}>
            CRISIS MANAGEMENT SUITE
          </span>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.5rem' }}>
            Unified Emergency Response Architecture
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Built specifically for students, campus safety teams, and disaster relief coordinators.
          </p>
        </div>

        <div className="grid-cols-3">
          <div className="glass-card glass-card-hoverable" style={{ borderLeft: '3px solid #ff334b' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(255, 51, 75, 0.14)',
                border: '1px solid rgba(255, 51, 75, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <Icon name="sos" size={24} color="#ff334b" />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.4rem', color: '#ffffff' }}>
              Live Emergency SOS
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.5 }}>
              Submit location-tagged distress signals with people count and severity. Safety teams can triage and dispatch rescue help in real time.
            </p>
          </div>

          <div className="glass-card glass-card-hoverable" style={{ borderLeft: '3px solid #10b981' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(16, 185, 129, 0.14)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <Icon name="home" size={24} color="#10b981" />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.4rem', color: '#ffffff' }}>
              Smart Shelter Locator
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.5 }}>
              Real-time shelter capacity progress meters, available bed counts, emergency medical facilities, and one-tap contact dialers.
            </p>
          </div>

          <div className="glass-card glass-card-hoverable" style={{ borderLeft: '3px solid #f59e0b' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(245, 158, 11, 0.14)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <Icon name="map" size={24} color="#f59e0b" />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.4rem', color: '#ffffff' }}>
              Impact Zone Surveillance
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.5 }}>
              Color-coded geographic risk indicators (Green/Yellow/Orange/Red) with casualty counts and localized impact severity.
            </p>
          </div>

          <div className="glass-card glass-card-hoverable" style={{ borderLeft: '3px solid #6366f1' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(99, 102, 241, 0.14)',
                border: '1px solid rgba(99, 102, 241, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <Icon name="blockchain" size={24} color="#818cf8" />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.4rem', color: '#ffffff' }}>
              Blockchain Transparency
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.5 }}>
              Cryptographically verified logging for donated food, water, blankets, and medical kits ensuring zero diversion of humanitarian aid.
            </p>
          </div>

          <div className="glass-card glass-card-hoverable" style={{ borderLeft: '3px solid #f97316' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(249, 115, 22, 0.14)',
                border: '1px solid rgba(249, 115, 22, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <Icon name="warning" size={24} color="#f97316" />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.4rem', color: '#ffffff' }}>
              Campus Hazard Reporting
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.5 }}>
              Crowdsourced hazard reporting for blocked fire escapes, sparking transformers, fallen trees, and cracked structures.
            </p>
          </div>

          <div className="glass-card glass-card-hoverable" style={{ borderLeft: '3px solid #06b6d4' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(6, 182, 212, 0.14)',
                border: '1px solid rgba(6, 182, 212, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <Icon name="wifi-off" size={24} color="#06b6d4" />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.4rem', color: '#ffffff' }}>
              Low-Connectivity Fallback
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.5 }}>
              Offline cached preparedness guides, direct emergency hotlines, and SMS dispatch interface for network blackout scenarios.
            </p>
          </div>
        </div>
      </section>

      {/* "Where does the relief go?" Blockchain Journey Section */}
      <section
        style={{
          background: 'rgba(12, 20, 38, 0.7)',
          borderTop: '1px solid var(--border-subtle)',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '4.5rem 2rem',
          margin: '0 0 4rem',
        }}
      >
        <div style={{ maxWidth: '1120px', margin: '0 auto', textAlign: 'center' }}>
          <span className="badge badge-blockchain" style={{ marginBottom: '0.75rem' }}>
            ⛓️ SUPPLY CHAIN INTEGRITY
          </span>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.75rem' }}>
            Where Does the Relief Go?
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem', maxWidth: '720px', margin: '0 auto 3rem', lineHeight: 1.6 }}>
            DisasterChain solves the critical humanitarian question: <em>"Did my aid reach the victims?"</em> Every package is tracked through an immutable cryptographic record.
          </p>

          {/* Flow Diagram */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              flexWrap: 'wrap',
            }}
          >
            {[
              { step: '1. Donation', icon: 'box', text: 'Donor logs relief supplies' },
              { step: '2. Verification', icon: 'shield-check', text: 'SHA-256 block minted' },
              { step: '3. Warehouse', icon: 'database', text: 'Central logistics intake' },
              { step: '4. Transit', icon: 'truck', text: 'Dispatched to shelter' },
              { step: '5. Handover', icon: 'check-circle', text: 'Delivered to victims' },
            ].map((item, index) => (
              <React.Fragment key={index}>
                <div
                  className="glass-card"
                  style={{
                    padding: '1.25rem 1rem',
                    flex: '1 1 170px',
                    textAlign: 'center',
                    background: 'rgba(15, 24, 44, 0.85)',
                  }}
                >
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      background: 'rgba(99, 102, 241, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 0.75rem',
                      color: '#818cf8',
                    }}
                  >
                    <Icon name={item.icon} size={22} color="#818cf8" />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#ffffff', marginBottom: '0.25rem' }}>
                    {item.step}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{item.text}</div>
                </div>
                {index < 4 && (
                  <div style={{ color: 'var(--accent-indigo)' }}>
                    <Icon name="arrow-right" size={20} />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          <div style={{ marginTop: '2.5rem' }}>
            <Link to="/transparency" className="btn btn-primary" style={{ padding: '0.75rem 1.65rem' }}>
              <Icon name="ledger" size={17} />
              <span>Explore Cryptographic Transparency Ledger</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Disaster Categories Section */}
      <section style={{ maxWidth: '1240px', margin: '0 auto 4rem', padding: '0 2rem', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.9rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.5rem' }}>
            Disaster Preparedness Categories
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Actionable Before, During, and After guides with interactive emergency kit checklists.
          </p>
        </div>

        <div className="grid-cols-3">
          {disasterCards.map((cat, idx) => (
            <Link to={`/guides`} key={idx} className="glass-card glass-card-hoverable" style={{ display: 'block' }}>
              <div style={{ fontSize: '2.4rem', marginBottom: '0.75rem' }}>{cat.icon}</div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.4rem', color: '#ffffff' }}>{cat.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{cat.desc}</p>
              <div style={{ color: 'var(--accent-indigo)', fontSize: '0.84rem', fontWeight: 700, marginTop: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span>Open Safety Checklist</span>
                <Icon name="arrow-up-right" size={14} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          marginTop: 'auto',
          borderTop: '1px solid var(--border-subtle)',
          padding: '2.5rem 2rem',
          background: 'rgba(8, 13, 26, 0.98)',
          textAlign: 'center',
          fontSize: '0.85rem',
          color: 'var(--text-muted)',
        }}
      >
        <div style={{ fontWeight: 800, color: '#ffffff', fontSize: '1.15rem', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <span>DisasterChain</span>
          <span className="pulse-indicator"></span>
        </div>
        <div style={{ marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
          "Respond Faster. Recover Smarter. Track Transparently."
        </div>
        <div style={{ fontSize: '0.78rem' }}>
          Student Innovation in Disaster Response & Blockchain Transparency &bull; Developed for Academic Evaluation
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
