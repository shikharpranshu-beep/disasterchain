import React, { useState } from 'react';
import { fallbackData } from '../services/api';

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
      <div style={{ marginBottom: '1.75rem' }}>
        <div className="badge badge-success" style={{ marginBottom: '0.4rem' }}>
          📡 LOCAL CACHE ACTIVE &bull; LOW-CONNECTIVITY MODE
        </div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Low-Connectivity Emergency Support</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Critical emergency protocols, local telephone hotlines & SMS dispatch interface designed for zero/poor internet conditions
        </p>
      </div>

      {/* Emergency Hotlines Grid */}
      <div className="grid-cols-4" style={{ marginBottom: '1.75rem' }}>
        <div className="glass-card" style={{ textAlign: 'center', borderColor: 'rgba(239, 68, 68, 0.4)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>🚨</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>National Emergency</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f87171', margin: '0.25rem 0' }}>112</div>
          <a href="tel:112" className="btn btn-danger" style={{ fontSize: '0.78rem', width: '100%', padding: '0.4rem' }}>
            Dial 112
          </a>
        </div>

        <div className="glass-card" style={{ textAlign: 'center', borderColor: 'rgba(245, 158, 11, 0.4)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>🚒</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Fire Brigade</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fbbf24', margin: '0.25rem 0' }}>101</div>
          <a href="tel:101" className="btn btn-secondary" style={{ fontSize: '0.78rem', width: '100%', padding: '0.4rem' }}>
            Dial 101
          </a>
        </div>

        <div className="glass-card" style={{ textAlign: 'center', borderColor: 'rgba(6, 182, 212, 0.4)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>🚑</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Ambulance Triage</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#38bdf8', margin: '0.25rem 0' }}>108</div>
          <a href="tel:108" className="btn btn-secondary" style={{ fontSize: '0.78rem', width: '100%', padding: '0.4rem' }}>
            Dial 108
          </a>
        </div>

        <div className="glass-card" style={{ textAlign: 'center', borderColor: 'rgba(99, 102, 241, 0.4)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>🏛️</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Disaster Authority (NDRF)</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#818cf8', margin: '0.25rem 0' }}>1078</div>
          <a href="tel:1078" className="btn btn-secondary" style={{ fontSize: '0.78rem', width: '100%', padding: '0.4rem' }}>
            Dial 1078
          </a>
        </div>
      </div>

      <div className="grid-cols-2" style={{ marginBottom: '1.75rem' }}>
        {/* SMS Emergency Dispatch Interface */}
        <div className="glass-card">
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>💬</span> SMS Emergency Dispatch Generator
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            Generates standardized GSM SMS text messages to be sent via cellular network when mobile internet (4G/5G) is down.
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
              📱 Generate SMS Template
            </button>
          </form>

          {smsSentNotice && (
            <div
              style={{
                marginTop: '1.25rem',
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem 1rem',
                fontSize: '0.82rem',
                color: '#fbbf24',
                lineHeight: 1.5,
              }}
            >
              <strong>ℹ️ PROTOTYPE SMS STATUS:</strong><br />
              SMS gateway is not configured in this academic prototype. In actual production deployment, this payload will dispatch via GSM SMS modem or Twilio gateway. Use your mobile phone to send this text directly to <strong>112</strong>.
            </div>
          )}
        </div>

        {/* Offline Cached Quick Safety Cards */}
        <div className="glass-card">
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>💾</span> Offline Cached Safety Checklist
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            Essential life-safety reminders always accessible without network connection.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '0.85rem' }}>
              <strong style={{ color: '#f87171', fontSize: '0.9rem' }}>🏚️ Earthquake (Immediate):</strong>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                DROP to floor, COVER head under sturdy desk, HOLD ON. Do not run outside during shaking.
              </div>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '0.85rem' }}>
              <strong style={{ color: '#fbbf24', fontSize: '0.9rem' }}>🔥 Fire & Smoke:</strong>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                CRAWL LOW under smoke where clean air exists. Touch doors before opening. Never use elevators.
              </div>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '0.85rem' }}>
              <strong style={{ color: '#38bdf8', fontSize: '0.9rem' }}>🌊 Flood Rising:</strong>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                Move to top floor or roof. Cut main electricity breaker. Never walk through moving water.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfflineEmergencyPage;
