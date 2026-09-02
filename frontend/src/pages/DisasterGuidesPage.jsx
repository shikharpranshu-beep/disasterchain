import React, { useState, useEffect } from 'react';
import { fetchPreparednessGuides } from '../services/api';
import Icon from '../components/Icons';

const DisasterGuidesPage = () => {
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDisaster, setSelectedDisaster] = useState('Earthquake');
  const [activeTab, setActiveTab] = useState('before'); // 'before' | 'during' | 'after' | 'dos_donts' | 'kit'
  const [searchQuery, setSearchQuery] = useState('');

  // Persist emergency kit checklist in localStorage
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
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="badge badge-info" style={{ marginBottom: '0.4rem' }}>
            <Icon name="book" size={13} color="#38bdf8" />
            <span>CIVIL DEFENSE HANDBOOK &bull; EMERGENCY PREPAREDNESS</span>
          </div>
          <h1 className="page-header-title">
            <Icon name="book" size={26} color="var(--accent-cyan)" />
            <span>Disaster Preparedness & Safety Manual</span>
          </h1>
          <p className="page-header-subtitle">
            Actionable Before/During/After safety protocols, survival do's and don'ts & interactive emergency kit checklist
          </p>
        </div>
      </div>

      {/* Search and Category Selector Chips */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {filteredGuides.map((g) => {
            const isSelected = g.disasterType === currentGuide?.disasterType;
            return (
              <button
                key={g.disasterType}
                onClick={() => setSelectedDisaster(g.disasterType)}
                className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                style={{
                  fontSize: '0.84rem',
                  padding: '0.45rem 0.85rem',
                }}
              >
                <span>{g.icon || '⚠️'}</span>
                <span>{g.disasterType}</span>
              </button>
            );
          })}
        </div>

        <div style={{ position: 'relative', width: '220px' }}>
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2rem', paddingRight: '0.75rem', fontSize: '0.82rem', height: '34px' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search guides..."
          />
          <span style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
            <Icon name="search" size={13} />
          </span>
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: '3px solid rgba(6, 182, 212, 0.2)',
              borderTopColor: '#06b6d4',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem',
            }}
          />
          <div>Loading Disaster Guides...</div>
        </div>
      )}

      {/* Main Guide Content */}
      {!loading && currentGuide && (
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
            <span style={{ fontSize: '2.5rem' }}>{currentGuide.icon || '⚠️'}</span>
            <div>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#ffffff' }}>{currentGuide.title}</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{currentGuide.description}</p>
            </div>
          </div>

          {/* Phase Tabs */}
          <div
            style={{
              display: 'flex',
              borderBottom: '1px solid var(--border-subtle)',
              marginBottom: '1.75rem',
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
                    padding: '0.75rem 1.15rem',
                    background: isTabActive ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                    border: 'none',
                    borderBottom: isTabActive ? '3px solid var(--accent-indigo)' : '3px solid transparent',
                    color: isTabActive ? '#ffffff' : 'var(--text-secondary)',
                    fontWeight: isTabActive ? 700 : 500,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    borderRadius: isTabActive ? 'var(--radius-sm) var(--radius-sm) 0 0' : '0',
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
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#38bdf8', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Icon name="shield" size={18} color="#38bdf8" />
                <span>Preventive Actions & Preparation (Before)</span>
              </h3>
              <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', color: 'var(--text-primary)', fontSize: '0.92rem' }}>
                {currentGuide.before?.map((point, i) => (
                  <li key={i}>{point}</li>
                ))}
              </ul>
            </div>
          )}

          {activeTab === 'during' && (
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ff6b7e', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Icon name="sos" size={18} color="#ff334b" />
                <span>Immediate Survival Actions (During)</span>
              </h3>
              <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', color: 'var(--text-primary)', fontSize: '0.92rem' }}>
                {currentGuide.during?.map((point, i) => (
                  <li key={i}>{point}</li>
                ))}
              </ul>
            </div>
          )}

          {activeTab === 'after' && (
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#34d399', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Icon name="check-circle" size={18} color="#10b981" />
                <span>Recovery & Inspection Actions (After)</span>
              </h3>
              <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', color: 'var(--text-primary)', fontSize: '0.92rem' }}>
                {currentGuide.after?.map((point, i) => (
                  <li key={i}>{point}</li>
                ))}
              </ul>
            </div>
          )}

          {activeTab === 'dos_donts' && (
            <div className="grid-cols-2">
              <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
                <h3 style={{ color: '#34d399', fontWeight: 800, fontSize: '1.05rem', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Icon name="check-circle" size={18} color="#34d399" />
                  <span>Recommended Do's:</span>
                </h3>
                <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                  {currentGuide.dos?.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </div>

              <div style={{ background: 'rgba(255, 51, 75, 0.08)', border: '1px solid rgba(255, 51, 75, 0.3)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
                <h3 style={{ color: '#ff6b7e', fontWeight: 800, fontSize: '1.05rem', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Icon name="x" size={18} color="#ff334b" />
                  <span>Critical Don'ts:</span>
                </h3>
                <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                  {currentGuide.donts?.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'kit' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Icon name="box" size={18} color="#f59e0b" />
                  <span>Emergency Kit Readiness Checklist</span>
                </h3>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Stored locally for offline availability
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {currentGuide.emergencyKit?.map((kit, i) => {
                  const key = `${currentGuide.disasterType}-${i}`;
                  const isChecked = !!checkedItems[key];

                  return (
                    <div
                      key={i}
                      onClick={() => toggleCheckItem(key)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.85rem',
                        background: isChecked ? 'rgba(16, 185, 129, 0.12)' : 'rgba(11, 18, 34, 0.8)',
                        border: `1px solid ${isChecked ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-subtle)'}`,
                        borderRadius: 'var(--radius-md)',
                        padding: '0.85rem 1.15rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        style={{ width: '18px', height: '18px', accentColor: '#10b981', cursor: 'pointer' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.92rem', textDecoration: isChecked ? 'line-through' : 'none', color: isChecked ? '#34d399' : '#ffffff' }}>
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
      )}
    </div>
  );
};

export default DisasterGuidesPage;
