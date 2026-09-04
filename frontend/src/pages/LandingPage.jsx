import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/i18n';
import DisasterCommandMap from '../components/DisasterCommandMap';
import Icon from '../components/Icons';
import { fetchSosRequests, fetchShelters, fetchAffectedAreas } from '../services/api';

const LandingPage = ({ onOpenSos }) => {
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();
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
    { title: t('landing.earthquakeTitle'), icon: '🏚️', desc: t('landing.earthquakeDesc') },
    { title: t('landing.floodTitle'), icon: '🌊', desc: t('landing.floodDesc') },
    { title: t('landing.fireTitle'), icon: '🔥', desc: t('landing.fireDesc') },
    { title: t('landing.cycloneTitle'), icon: '🌀', desc: t('landing.cycloneDesc') },
    { title: t('landing.landslideTitle'), icon: '⛰️', desc: t('landing.landslideDesc') },
    { title: t('landing.heatwaveTitle'), icon: '☀️', desc: t('landing.heatwaveDesc') },
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
        ⚠️ <strong>{t('landing.academicDisclaimer')} 112 / 101.</strong>
      </div>

      {/* Hero Section */}
      <section
        className="landing-hero-section"
        style={{
          padding: '3.5rem 1.5rem 2.5rem',
          maxWidth: '1360px',
          margin: '0 auto',
          width: '100%',
          minHeight: '620px',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 0.9fr) minmax(500px, 1.1fr)',
          gap: '2.5rem',
          alignItems: 'center',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ zIndex: 2 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.85rem', background: 'rgba(255, 107, 44, 0.08)', border: '1px solid var(--border-highlight)', borderRadius: 'var(--radius-xs)', marginBottom: '1.25rem' }}>
            <span className="live-beacon-pulse" />
            <span className="micro-label" style={{ color: 'var(--orange-primary)' }}>
              {t('landing.realtimeOpsBadge')}
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
            {t('landing.heroTitle1')}<br />
            <span style={{ background: 'linear-gradient(135deg, var(--orange-primary) 0%, #FF8A3D 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {t('landing.heroTitle2')}
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
            {t('landing.heroSubtitle')}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={onOpenSos}
              className="btn btn-emergency btn-lg"
              id="hero-sos-btn"
            >
              <Icon name="alert-circle" size={18} color="#ffffff" />
              <span>{t('landing.broadcastSos')}</span>
            </button>

            <Link
              to={isAuthenticated ? '/dashboard' : '/login'}
              className="btn btn-primary btn-lg"
            >
              <Icon name="activity" size={18} />
              <span>{isAuthenticated ? t('common.enterCommandHud') : t('landing.signInToGrid')}</span>
            </Link>
          </div>
        </div>

        {/* Hero 2D Crisis Command Map Display */}
        <div
          className="landing-hero-map-wrapper"
          style={{
            height: '560px',
            maxHeight: '620px',
            width: '100%',
            position: 'relative',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            boxSizing: 'border-box',
          }}
        >
          <DisasterCommandMap
            height="100%"
            sosRequests={sosList}
            affectedAreas={affectedAreas}
            shelters={shelters}
            onOpenSos={onOpenSos}
          />
        </div>
      </section>

      <style>{`
        @media (max-width: 1080px) {
          .landing-hero-section {
            grid-template-columns: 1fr !important;
            gap: 2.5rem !important;
            min-height: auto !important;
          }
          .landing-hero-map-wrapper {
            height: 480px !important;
            min-height: 440px !important;
          }
        }
        @media (max-width: 640px) {
          .landing-hero-map-wrapper {
            height: 400px !important;
            min-height: 380px !important;
          }
        }
      `}</style>

      {/* 4 Core Pillars */}
      <section style={{ maxWidth: '1360px', margin: '3.5rem auto 3rem', width: '100%', padding: '0 1.5rem 3rem' }}>
        <div className="grid-cols-4">
          {[
            {
              title: t('landing.pillarSosTitle'),
              desc: t('landing.pillarSosDesc'),
              icon: '🚨',
              color: 'var(--crimson)',
            },
            {
              title: t('landing.pillarIntelTitle'),
              desc: t('landing.pillarIntelDesc'),
              icon: '🗺️',
              color: 'var(--orange-primary)',
            },
            {
              title: t('landing.pillarSupplyTitle'),
              desc: t('landing.pillarSupplyDesc'),
              icon: '📦',
              color: 'var(--amber)',
            },
            {
              title: t('landing.pillarAuditTitle'),
              desc: t('landing.pillarAuditDesc'),
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
            <div className="micro-label" style={{ color: 'var(--crimson)' }}>{t('landing.civilDefenseHotlines')}</div>
            <div style={{ fontWeight: 800, fontSize: '1.25rem', color: '#ffffff' }}>{t('landing.directEmergencyTelephony')}</div>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div>
              <div className="micro-label">{t('offline.nationalEmergency')}</div>
              <a href="tel:112" style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1.4rem', color: 'var(--crimson)' }}>
                112
              </a>
            </div>
            <div>
              <div className="micro-label">{t('offline.fireBrigade')}</div>
              <a href="tel:101" style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1.4rem', color: 'var(--amber)' }}>
                101
              </a>
            </div>
            <div>
              <div className="micro-label">{t('offline.ambulanceTrauma')}</div>
              <a href="tel:108" style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1.4rem', color: 'var(--cyan)' }}>
                108
              </a>
            </div>
            <div>
              <div className="micro-label">{t('offline.ndrfForce')}</div>
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
            {t('landing.preparednessMitigation')}
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, color: '#ffffff' }}>
            {t('landing.tacticalSurvivalDirectives')}
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
                  {t('landing.viewProtocol')}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: 'var(--bg-void)', borderTop: '1px solid var(--border-subtle)', padding: '2rem 1.5rem', textAlign: 'center' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          {t('landing.footerText')}
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
