import React, { useState, useEffect } from 'react';
import { fetchPreparednessGuides } from '../services/api';

const DisasterGuidesPage = () => {
  const [guides, setGuides] = useState([]);
  const [selectedDisaster, setSelectedDisaster] = useState('Earthquake');
  const [activeTab, setActiveTab] = useState('before'); // 'before' | 'during' | 'after' | 'dos_donts' | 'kit'
  const [checkedItems, setCheckedItems] = useState({});

  useEffect(() => {
    const loadGuides = async () => {
      const data = await fetchPreparednessGuides();
      setGuides(data);
    };
    loadGuides();
  }, []);

  const currentGuide = guides.find((g) => g.disasterType === selectedDisaster) || guides[0];

  const toggleCheckItem = (itemKey) => {
    setCheckedItems((prev) => ({
      ...prev,
      [itemKey]: !prev[itemKey],
    }));
  };

  if (!currentGuide) return null;

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>📖 Disaster Preparedness & Safety Guides</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Actionable before/during/after safety protocols, survival do's and don'ts & interactive emergency kit checklist
        </p>
      </div>

      {/* Disaster Category Selector Buttons */}
      <div
        style={{
          display: 'flex',
          gap: '0.65rem',
          flexWrap: 'wrap',
          marginBottom: '1.5rem',
        }}
      >
        {guides.map((g) => {
          const isSelected = g.disasterType === selectedDisaster;
          return (
            <button
              key={g.disasterType}
              onClick={() => setSelectedDisaster(g.disasterType)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.6rem 1.1rem',
                borderRadius: 'var(--radius-md)',
                background: isSelected
                  ? 'linear-gradient(135deg, #6366f1, #4f46e5)'
                  : 'rgba(30, 41, 59, 0.7)',
                color: '#ffffff',
                border: `1px solid ${isSelected ? '#6366f1' : 'var(--border-subtle)'}`,
                fontWeight: 600,
                fontSize: '0.88rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <span>{g.icon || '⚠️'}</span>
              <span>{g.disasterType}</span>
            </button>
          );
        })}
      </div>

      {/* Main Guide Content */}
      <div className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <span style={{ fontSize: '2.5rem' }}>{currentGuide.icon}</span>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{currentGuide.title}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{currentGuide.description}</p>
          </div>
        </div>

        {/* Phase Tabs */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-subtle)',
            marginBottom: '1.5rem',
            gap: '0.5rem',
            overflowX: 'auto',
          }}
        >
          {[
            { id: 'before', label: '1. Before Disaster' },
            { id: 'during', label: '2. During Disaster' },
            { id: 'after', label: '3. After Disaster' },
            { id: 'dos_donts', label: "4. Do's & Don'ts" },
            { id: 'kit', label: '5. Emergency Kit Checklist' },
          ].map((tab) => {
            const isTabActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '0.75rem 1rem',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: isTabActive ? '3px solid var(--accent-indigo)' : '3px solid transparent',
                  color: isTabActive ? '#ffffff' : 'var(--text-secondary)',
                  fontWeight: isTabActive ? 700 : 500,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === 'before' && (
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#38bdf8', marginBottom: '0.75rem' }}>
              🛡️ Preventive Actions & Preparation (Before)
            </h3>
            <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.65rem', color: 'var(--text-primary)', fontSize: '0.92rem' }}>
              {currentGuide.before?.map((point, i) => (
                <li key={i}>{point}</li>
              ))}
            </ul>
          </div>
        )}

        {activeTab === 'during' && (
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f87171', marginBottom: '0.75rem' }}>
              🚨 Immediate Survival Actions (During)
            </h3>
            <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.65rem', color: 'var(--text-primary)', fontSize: '0.92rem' }}>
              {currentGuide.during?.map((point, i) => (
                <li key={i}>{point}</li>
              ))}
            </ul>
          </div>
        )}

        {activeTab === 'after' && (
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#34d399', marginBottom: '0.75rem' }}>
              🌱 Recovery & Inspection Actions (After)
            </h3>
            <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.65rem', color: 'var(--text-primary)', fontSize: '0.92rem' }}>
              {currentGuide.after?.map((point, i) => (
                <li key={i}>{point}</li>
              ))}
            </ul>
          </div>
        )}

        {activeTab === 'dos_donts' && (
          <div className="grid-cols-2">
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
              <h3 style={{ color: '#34d399', fontWeight: 700, fontSize: '1rem', marginBottom: '0.75rem' }}>
                ✅ Recommended Do's:
              </h3>
              <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.88rem' }}>
                {currentGuide.dos?.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </div>

            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
              <h3 style={{ color: '#f87171', fontWeight: 700, fontSize: '1rem', marginBottom: '0.75rem' }}>
                ❌ Critical Don'ts:
              </h3>
              <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.88rem' }}>
                {currentGuide.donts?.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'kit' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fbbf24' }}>
                🎒 Emergency Kit Readiness Checklist
              </h3>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Check items to track your readiness
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {currentGuide.emergencyKit?.map((kit, i) => {
                const key = `${selectedDisaster}-${i}`;
                const isChecked = !!checkedItems[key];

                return (
                  <div
                    key={i}
                    onClick={() => toggleCheckItem(key)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      background: isChecked ? 'rgba(16, 185, 129, 0.12)' : 'rgba(15, 23, 42, 0.7)',
                      border: `1px solid ${isChecked ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-subtle)'}`,
                      borderRadius: 'var(--radius-md)',
                      padding: '0.75rem 1rem',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      style={{ width: '18px', height: '18px', accentColor: '#10b981', cursor: 'pointer' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', textDecoration: isChecked ? 'line-through' : 'none', color: isChecked ? '#34d399' : 'var(--text-primary)' }}>
                        {kit.item}
                      </div>
                      {kit.description && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {kit.description}
                        </div>
                      )}
                    </div>
                    {kit.essential && (
                      <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>
                        ESSENTIAL
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DisasterGuidesPage;
