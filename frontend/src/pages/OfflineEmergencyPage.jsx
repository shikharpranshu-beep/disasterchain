import React, { useState } from 'react';
import Icon from '../components/Icons';

const OfflineEmergencyPage = () => {
  const [smsData, setSmsData] = useState({
    recipient: '112 (National Emergency)',
    messageType: 'Medical Assistance',
    details: 'Trapped on terrace with 4 students. Need evacuation.',
  });

  const [smsSentNotice, setSmsSentNotice] = useState(false);

  const handleSendSms = (e) => {
    e.preventDefault();
    setSmsSentNotice(true);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="badge badge-success" style={{ marginBottom: '0.4rem' }}>
            <Icon name="wifi-off" size={13} color="#34d399" />
            <span>LOCAL CACHE ACTIVE &bull; LOW-CONNECTIVITY MODE</span>
          </div>
          <h1 className="page-header-title">
            <Icon name="wifi-off" size={26} color="#38bdf8" />
            <span>Low-Connectivity Emergency Support</span>
          </h1>
          <p className="page-header-subtitle">
            Critical emergency protocols, telephone hotlines & SMS dispatch interface designed for zero/poor internet conditions
          </p>
        </div>
      </div>

      {/* Emergency Hotlines Grid */}
      <div className="grid-cols-4" style={{ marginBottom: '2rem' }}>
        <div className="glass-card glass-card-hoverable" style={{ textAlign: 'center', borderColor: 'rgba(255, 51, 75, 0.45)', borderTop: '4px solid #ff334b' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>🚨</div>
          <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', fontWeight: 700 }}>National Emergency</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ff4d63', margin: '0.25rem 0', fontFamily: 'var(--font-mono)' }}>112</div>
          <a href="tel:112" className="btn btn-danger" style={{ fontSize: '0.8rem', width: '100%', padding: '0.45rem' }}>
            <Icon name="phone" size={14} />
            <span>Dial 112</span>
          </a>
        </div>

        <div className="glass-card glass-card-hoverable" style={{ textAlign: 'center', borderColor: 'rgba(245, 158, 11, 0.45)', borderTop: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>🚒</div>
          <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', fontWeight: 700 }}>Fire Brigade</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fbbf24', margin: '0.25rem 0', fontFamily: 'var(--font-mono)' }}>101</div>
          <a href="tel:101" className="btn btn-secondary" style={{ fontSize: '0.8rem', width: '100%', padding: '0.45rem' }}>
            <Icon name="phone" size={14} />
            <span>Dial 101</span>
          </a>
        </div>

        <div className="glass-card glass-card-hoverable" style={{ textAlign: 'center', borderColor: 'rgba(6, 182, 212, 0.45)', borderTop: '4px solid #06b6d4' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>🚑</div>
          <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', fontWeight: 700 }}>Ambulance Triage</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#38bdf8', margin: '0.25rem 0', fontFamily: 'var(--font-mono)' }}>108</div>
          <a href="tel:108" className="btn btn-secondary" style={{ fontSize: '0.8rem', width: '100%', padding: '0.45rem' }}>
            <Icon name="phone" size={14} />
            <span>Dial 108</span>
          </a>
        </div>

        <div className="glass-card glass-card-hoverable" style={{ textAlign: 'center', borderColor: 'rgba(99, 102, 241, 0.45)', borderTop: '4px solid #6366f1' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>🏛️</div>
          <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', fontWeight: 700 }}>Disaster Authority (NDRF)</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#818cf8', margin: '0.25rem 0', fontFamily: 'var(--font-mono)' }}>1078</div>
          <a href="tel:1078" className="btn btn-secondary" style={{ fontSize: '0.8rem', width: '100%', padding: '0.45rem' }}>
            <Icon name="phone" size={14} />
            <span>Dial 1078</span>
          </a>
        </div>
      </div>

      <div className="grid-cols-2" style={{ marginBottom: '1.75rem' }}>
        {/* SMS Emergency Dispatch Interface */}
        <div className="glass-card">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#ffffff' }}>
            <Icon name="mail" size={20} color="var(--accent-indigo)" />
            <span>SMS Emergency Dispatch Generator</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            Generates standardized cellular text payloads when mobile data (4G/5G) is unreachable.
          </p>

          <form onSubmit={handleSendSms}>
            <div className="form-group">
              <label className="form-label">Dispatch Recipient</label>
              <input
                type="text"
                className="form-input"
                value={smsData.recipient}
                onChange={(e) => setSmsData({ ...smsData, recipient: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Distress Category</label>
              <select
                className="form-select"
                value={smsData.messageType}
                onChange={(e) => setSmsData({ ...smsData, messageType: e.target.value })}
              >
                <option value="Medical Assistance">Medical Emergency Assistance</option>
                <option value="Fire Alarm">Fire Incident Alert</option>
                <option value="Flood Evacuation">Flood Trapped Evacuation</option>
                <option value="Structural Collapse">Structural Damage / Collapse</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Formatted Emergency Payload</label>
              <textarea
                rows={3}
                className="form-textarea"
                value={smsData.details}
                onChange={(e) => setSmsData({ ...smsData, details: e.target.value })}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              <Icon name="mail" size={16} />
              <span>Generate SMS Template</span>
            </button>
          </form>

          {smsSentNotice && (
            <div
              style={{
                marginTop: '1.25rem',
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem 1rem',
                fontSize: '0.82rem',
                color: '#fbbf24',
                lineHeight: 1.5,
              }}
            >
              <strong>ℹ️ PROTOTYPE SMS STATUS:</strong><br />
              SMS gateway is simulated in this academic prototype. In production deployment, this payload dispatches via Twilio or GSM hardware modem. Use your mobile phone to send this text directly to <strong>112</strong>.
            </div>
          )}
        </div>

        {/* Offline Cached Quick Safety Cards */}
        <div className="glass-card">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#ffffff' }}>
            <Icon name="book" size={20} color="#10b981" />
            <span>Offline Cached Safety Protocols</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            Essential life-safety instructions always accessible without network connection.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ background: 'rgba(11, 18, 34, 0.85)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '0.95rem' }}>
              <strong style={{ color: '#ff6b7e', fontSize: '0.92rem' }}>🏚️ Earthquake (Immediate):</strong>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                DROP to floor, COVER head under sturdy desk, HOLD ON. Do not run outside during shaking.
              </div>
            </div>

            <div style={{ background: 'rgba(11, 18, 34, 0.85)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '0.95rem' }}>
              <strong style={{ color: '#fbbf24', fontSize: '0.92rem' }}>🔥 Fire & Smoke:</strong>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                CRAWL LOW under smoke where clean air exists. Touch doors with back of hand before opening. Never use elevators.
              </div>
            </div>

            <div style={{ background: 'rgba(11, 18, 34, 0.85)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '0.95rem' }}>
              <strong style={{ color: '#38bdf8', fontSize: '0.92rem' }}>🌊 Flood Rising:</strong>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                Move to top floor or roof. Cut main electricity breaker. Never walk or drive through moving water.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfflineEmergencyPage;
