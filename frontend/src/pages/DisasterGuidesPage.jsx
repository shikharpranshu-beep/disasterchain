import React, { useState, useEffect } from 'react';
import { fetchPreparednessGuides } from '../services/api';
import Icon from '../components/Icons';
import { useTranslation } from '../i18n/i18n';

const DisasterGuidesPage = () => {
  const { t } = useTranslation();
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDisaster, setSelectedDisaster] = useState('Earthquake');
  const [activeTab, setActiveTab] = useState('immediate'); // 'immediate' | 'before' | 'during' | 'after' | 'checklist'
  const [searchQuery, setSearchQuery] = useState('');

  const [checkedItems, setCheckedItems] = useState(() => {
    try {
      const saved = localStorage.getItem('disasterchain_kit_checklist');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('disasterchain_kit_checklist', JSON.stringify(checkedItems));
    } catch (e) {
      console.warn('Unable to persist checklist in localStorage', e);
    }
  }, [checkedItems]);

  useEffect(() => {
    const loadGuides = async () => {
      setLoading(true);
      try {
        const data = await fetchPreparednessGuides();
        setGuides(data || []);
      } catch (err) {
        console.error('Error loading preparedness guides:', err);
      } finally {
        setLoading(false);
      }
    };
    loadGuides();
  }, []);

  const currentGuide =
    guides.find((g) => g.disasterType?.toLowerCase() === selectedDisaster?.toLowerCase()) ||
    guides[0];

  const toggleCheckItem = (itemKey) => {
    setCheckedItems((prev) => ({
      ...prev,
      [itemKey]: !prev[itemKey],
    }));
  };

  const filteredGuides = guides.filter((g) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      g.disasterType?.toLowerCase().includes(q) ||
      g.title?.toLowerCase().includes(q) ||
      g.description?.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Header */}
      <div
        className="spatial-panel"
        style={{
          padding: '1.5rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          background: 'rgba(9, 14, 25, 0.94)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
            <span className="badge badge-info">{t('guides.guidesTitle')}</span>
            <span className="micro-label" style={{ color: 'var(--cyan)' }}>
              {t('guides.guidesSubtitle')}
            </span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.25rem' }}>
            {t('guides.guidesTitle')}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            {t('guides.guidesSubtitle')}
          </p>
        </div>
      </div>

      {/* Guide Category Selection Bar */}
      <div
        className="spatial-panel"
        style={{
          padding: '0.85rem 1.25rem',
          background: 'rgba(9, 14, 25, 0.92)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {filteredGuides.map((g) => {
            const isSelected = g.disasterType === currentGuide?.disasterType;
            return (
              <button
                key={g.disasterType}
                type="button"
                onClick={() => setSelectedDisaster(g.disasterType)}
                className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                style={{ fontSize: '0.82rem' }}
              >
                <span>{g.icon || '⚠️'}</span>
                <span>{g.disasterType}</span>
              </button>
            );
          })}
        </div>

        <input
          type="text"
          className="form-input"
          style={{ maxWidth: '240px', padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
          placeholder={t('common.search')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '3.5rem 0', color: 'var(--text-muted)' }}>
          <div className="live-beacon-pulse" style={{ width: 22, height: 22, margin: '0 auto 1rem' }} />
          <span>{t('common.loading')}</span>
        </div>
      )}

      {/* Active Tactical Survival Manual View */}
      {currentGuide && !loading && (
        <div className="spatial-panel" style={{ padding: '2rem', background: 'rgba(11, 17, 30, 0.88)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '2rem' }}>{currentGuide.icon || '⚠️'}</span>
                <div>
                  <div className="micro-label" style={{ color: 'var(--cyan)' }}>
                    {t('guides.guidesTitle')} • {currentGuide.disasterType.toUpperCase()}
                  </div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800, color: '#ffffff' }}>
                    {currentGuide.title || `${currentGuide.disasterType} Safety Protocol`}
                  </h2>
                </div>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', maxWidth: '750px' }}>
                {currentGuide.description}
              </p>
            </div>
          </div>

          {/* Phase Navigation Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            {[
              { id: 'immediate', label: `🚨 ${t('guides.immediateAction')}` },
              { id: 'during', label: t('guides.whatToDo') },
              { id: 'after', label: t('guides.evacuationGuidelines') },
              { id: 'checklist', label: t('guides.emergencyKit') },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                style={{ fontSize: '0.78rem' }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab 1: WHAT TO DO FIRST (IMMEDIATE) */}
          {activeTab === 'immediate' && (
            <div>
              <div
                style={{
                  padding: '1.25rem',
                  background: 'rgba(255, 46, 77, 0.1)',
                  border: '1px solid var(--border-red)',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '1.5rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: '#ff6b81', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                  <span>⚡</span>
                  <span>{t('guides.immediateAction')}</span>
                </div>
                <div style={{ color: 'var(--text-primary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  {currentGuide.immediateAction || 'Drop to ground, cover your head and neck under sturdy shelter, hold on firmly until movement ceases. If outdoors, move to an open area away from power lines and collapsing structures.'}
                </div>
              </div>

              {/* Do's and Don'ts Matrix */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div
                  style={{
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid var(--border-mint)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '1.25rem',
                  }}
                >
                  <div style={{ fontWeight: 800, color: 'var(--mint)', fontSize: '0.95rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>✓</span>
                    <span>{t('guides.whatToDo')}</span>
                  </div>
                  <ul style={{ paddingLeft: '1.2rem', color: 'var(--text-secondary)', fontSize: '0.84rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {currentGuide.dos?.map((item, i) => (
                      <li key={i}>{item}</li>
                    )) || <li>Stay calm, protect your respiratory tract, monitor emergency radio.</li>}
                  </ul>
                </div>

                <div
                  style={{
                    background: 'rgba(255, 46, 77, 0.08)',
                    border: '1px solid var(--border-red)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '1.25rem',
                  }}
                >
                  <div style={{ fontWeight: 800, color: 'var(--crimson)', fontSize: '0.95rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>✕</span>
                    <span>{t('guides.whatNotToDo')}</span>
                  </div>
                  <ul style={{ paddingLeft: '1.2rem', color: 'var(--text-secondary)', fontSize: '0.84rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {currentGuide.donts?.map((item, i) => (
                      <li key={i}>{item}</li>
                    )) || <li>Do not use elevators, do not re-enter damaged buildings, do not touch fallen cables.</li>}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: DURING HAZARD */}
          {activeTab === 'during' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>{t('guides.whatToDo')}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {currentGuide.during?.map((step, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '1rem',
                      background: 'rgba(15, 23, 42, 0.7)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                    }}
                  >
                    <span className="micro-label" style={{ color: 'var(--cyan)', marginTop: 2 }}>
                      STEP 0{idx + 1}
                    </span>
                    <span style={{ color: 'var(--text-primary)', fontSize: '0.88rem', lineHeight: 1.5 }}>
                      {step}
                    </span>
                  </div>
                )) || <p style={{ color: 'var(--text-secondary)' }}>Follow official broadcast alerts and maintain shelter.</p>}
              </div>
            </div>
          )}

          {/* Tab 3: AFTER HAZARD / EVACUATION */}
          {activeTab === 'after' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>{t('guides.evacuationGuidelines')}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {currentGuide.after?.map((step, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '1rem',
                      background: 'rgba(15, 23, 42, 0.7)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                    }}
                  >
                    <span className="micro-label" style={{ color: 'var(--mint)', marginTop: 2 }}>
                      CHECK 0{idx + 1}
                    </span>
                    <span style={{ color: 'var(--text-primary)', fontSize: '0.88rem', lineHeight: 1.5 }}>
                      {step}
                    </span>
                  </div>
                )) || <p style={{ color: 'var(--text-secondary)' }}>Check for gas leaks and proceed to designated relief shelters.</p>}
              </div>
            </div>
          )}

          {/* Tab 4: SURVIVAL KIT CHECKLIST */}
          {activeTab === 'checklist' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>{t('guides.emergencyKit')}</h3>
                <span className="micro-label" style={{ color: 'var(--cyan)' }}>
                  {t('offline.offlineActive')}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
                {(currentGuide.emergencyKit || [
                  'Water (1 gallon per person per day for 3 days)',
                  'Non-perishable food rations (minimum 3-day supply)',
                  'Battery-powered or hand-crank emergency radio',
                  'High-intensity LED flashlight & extra batteries',
                  'Comprehensive first aid medical kit & prescription medications',
                  'Emergency whistle to signal rescue personnel',
                  'Dust masks to help filter contaminated air',
                  'Moist towelettes, garbage bags, plastic ties for sanitation',
                  'Local topographical maps & emergency contacts',
                  'Cell phone with power banks and charging cords',
                ]).map((item, idx) => {
                  const itemKey = `${currentGuide.disasterType}_kit_${idx}`;
                  const isChecked = !!checkedItems[itemKey];

                  return (
                    <div
                      key={idx}
                      onClick={() => toggleCheckItem(itemKey)}
                      style={{
                        padding: '0.85rem 1rem',
                        background: isChecked ? 'rgba(16, 185, 129, 0.1)' : 'rgba(15, 23, 42, 0.7)',
                        border: `1px solid ${isChecked ? 'var(--border-mint)' : 'var(--border-subtle)'}`,
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span style={{ fontSize: '1.1rem', color: isChecked ? 'var(--mint)' : 'var(--text-muted)' }}>
                        {isChecked ? '☑' : '☐'}
                      </span>
                      <span style={{ fontSize: '0.84rem', color: isChecked ? '#ffffff' : 'var(--text-secondary)', textDecoration: isChecked ? 'line-through' : 'none' }}>
                        {item}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DisasterGuidesPage;
