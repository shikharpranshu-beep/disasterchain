import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LandingPage = ({ onOpenSos }) => {
  const { demoLogin, isAuthenticated } = useAuth();

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
          background: 'rgba(239, 68, 68, 0.15)',
          borderBottom: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#fca5a5',
          textAlign: 'center',
          padding: '0.4rem 1rem',
          fontSize: '0.8rem',
        }}
      >
        ⚠️ <strong>ACADEMIC PROTOTYPE NOTICE:</strong> DisasterChain is an educational disaster response & transparency prototype. In a real life-threatening emergency, dial <strong>112</strong> / <strong>101</strong> / <strong>108</strong> immediately.
      </div>

      {/* Hero Section */}
      <section
        style={{
          padding: '4.5rem 2rem 3.5rem',
          textAlign: 'center',
          maxWidth: '1000px',
          margin: '0 auto',
          position: 'relative',
        }}
      >
        <div
          className="badge badge-blockchain"
          style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', marginBottom: '1.25rem' }}
        >
          ⛓️ Powered by Transparent Blockchain Verification
        </div>

        <h1
          style={{
            fontSize: '3.2rem',
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            marginBottom: '1.25rem',
            background: 'linear-gradient(135deg, #ffffff 40%, #94a3b8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Respond Faster. Recover Smarter.<br />
          <span style={{ background: 'linear-gradient(135deg, #ef4444, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Track Transparently.
          </span>
        </h1>

        <p
          style={{
            fontSize: '1.15rem',
            color: 'var(--text-secondary)',
            maxWidth: '750px',
            margin: '0 auto 2rem',
            lineHeight: 1.6,
          }}
        >
          DisasterChain unifies real-time emergency SOS signaling, shelter capacity tracking, campus hazard reporting, and cryptographic blockchain transparency for relief supplies into one student-friendly command center.
        </p>

        {/* Hero Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={onOpenSos}
            className="btn btn-sos"
            style={{ fontSize: '1rem', padding: '0.8rem 1.75rem' }}
          >
            🚨 TRANSMIT EMERGENCY SOS
          </button>

          <Link
            to={isAuthenticated ? '/dashboard' : '/login'}
            className="btn btn-primary"
            style={{ fontSize: '1rem', padding: '0.8rem 1.75rem' }}
          >
            {isAuthenticated ? 'Open Live Dashboard →' : 'Enter Dashboard →'}
          </Link>

          <Link
            to="/guides"
            className="btn btn-secondary"
            style={{ fontSize: '1rem', padding: '0.8rem 1.5rem' }}
          >
            Explore Safety Guides 📖
          </Link>
        </div>

        {/* 1-Click Demo Testing Shortcuts for Student Evaluation */}
        <div
          style={{
            marginTop: '2rem',
            padding: '1rem',
            background: 'rgba(30, 41, 59, 0.5)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            🎯 Quick Evaluation Shortcuts:
          </span>
          <button
            onClick={() => demoLogin('student')}
            className="btn btn-outline"
            style={{ fontSize: '0.82rem', padding: '0.4rem 0.85rem' }}
          >
            🎓 Login as Demo Student
          </button>
          <button
            onClick={() => demoLogin('admin')}
            className="btn btn-outline"
            style={{ fontSize: '0.82rem', padding: '0.4rem 0.85rem', borderColor: 'rgba(99, 102, 241, 0.4)' }}
          >
            🛡️ Login as Demo Admin
          </button>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section style={{ maxWidth: '1200px', margin: '0 auto 4rem', padding: '0 2rem', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            Comprehensive Disaster Management Ecosystem
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Built specifically for students, campus safety teams, and disaster relief administrators.
          </p>
        </div>

        <div className="grid-cols-3">
          <div className="glass-card">
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🚨</div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem', color: '#f87171' }}>
              Live Emergency SOS
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
              Submit location-tagged distress signals with people count and severity. Safety teams can triage and assign help in real time.
            </p>
          </div>

          <div className="glass-card">
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🏠</div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem', color: '#38bdf8' }}>
              Smart Shelter Locator
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
              Real-time shelter capacity progress meters, available bed counts, emergency medical facilities, and one-tap contact dialers.
            </p>
          </div>

          <div className="glass-card">
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🗺️</div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem', color: '#fbbf24' }}>
              Affected Zone Visualization
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
              Color-coded geographic risk indicators (Green/Yellow/Orange/Red) with casualty counts and localized impact severity.
            </p>
          </div>

          <div className="glass-card">
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⛓️</div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem', color: '#818cf8' }}>
              Blockchain Transparency Ledger
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
              Cryptographically verified logging for donated food, water, blankets, and medical kits ensuring zero diversion of relief aid.
            </p>
          </div>

          <div className="glass-card">
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⚠️</div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem', color: '#f59e0b' }}>
              Campus Hazard Reporting
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
              Crowdsourced incident reporting for blocked fire escapes, sparking transformers, fallen trees, and cracked structures.
            </p>
          </div>

          <div className="glass-card">
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📡</div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem', color: '#34d399' }}>
              Low-Connectivity Fallback
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
              Offline cached preparedness guides, direct emergency hotlines, and SMS dispatch interface for network blackouts.
            </p>
          </div>
        </div>
      </section>

      {/* "Where does the relief go?" Blockchain Journey Section */}
      <section
        style={{
          background: 'rgba(15, 23, 42, 0.6)',
          borderTop: '1px solid var(--border-subtle)',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '4rem 2rem',
          margin: '0 0 4rem',
        }}
      >
        <div style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
          <span className="badge badge-blockchain" style={{ marginBottom: '0.75rem' }}>
            ⛓️ SUPPLY CHAIN INTEGRITY
          </span>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.75rem' }}>
            Where Does the Relief Go?
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '700px', margin: '0 auto 3rem' }}>
            DisasterChain answers the critical humanitarian question: <em>"Did my donation reach the victims?"</em> Every package is tracked through an immutable cryptographic record.
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
              { step: '1. Donation', icon: '📦', text: 'Donor logs relief supplies' },
              { step: '2. Verification', icon: '🛡️', text: 'SHA-256 block minted' },
              { step: '3. Warehouse', icon: '🏬', text: 'Central logistics intake' },
              { step: '4. Transit', icon: '🚚', text: 'Dispatched to shelter' },
              { step: '5. Handover', icon: '🤝', text: 'Delivered to victims' },
            ].map((item, index) => (
              <React.Fragment key={index}>
                <div
                  style={{
                    background: 'rgba(30, 41, 59, 0.8)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.25rem 1rem',
                    flex: '1 1 160px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{item.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#818cf8', marginBottom: '0.25rem' }}>
                    {item.step}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.text}</div>
                </div>
                {index < 4 && (
                  <span style={{ fontSize: '1.5rem', color: 'var(--accent-indigo)' }}>→</span>
                )}
              </React.Fragment>
            ))}
          </div>

          <div style={{ marginTop: '2.5rem' }}>
            <Link to="/transparency" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
              Explore Blockchain Transparency Ledger ⛓️
            </Link>
          </div>
        </div>
      </section>

      {/* Disaster Categories Section */}
      <section style={{ maxWidth: '1200px', margin: '0 auto 4rem', padding: '0 2rem', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            Disaster Preparedness Categories
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Step-by-step Before, During, and After guides with interactive emergency kit checklists.
          </p>
        </div>

        <div className="grid-cols-3">
          {disasterCards.map((cat, idx) => (
            <Link to={`/guides`} key={idx} className="glass-card" style={{ display: 'block' }}>
              <div style={{ fontSize: '2.2rem', marginBottom: '0.75rem' }}>{cat.icon}</div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.4rem' }}>{cat.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{cat.desc}</p>
              <div style={{ color: 'var(--accent-indigo)', fontSize: '0.82rem', fontWeight: 600, marginTop: '0.75rem' }}>
                Open Safety Checklist →
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
          background: 'rgba(15, 23, 42, 0.95)',
          textAlign: 'center',
          fontSize: '0.85rem',
          color: 'var(--text-muted)',
        }}
      >
        <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1.1rem', marginBottom: '0.4rem' }}>
          DisasterChain 🚨
        </div>
        <div style={{ marginBottom: '1rem' }}>
          "Respond Faster. Recover Smarter. Track Transparently."
        </div>
        <div>
          Student Innovation in Disaster Management & Blockchain Transparency &bull; Developed for Academic Evaluation
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
