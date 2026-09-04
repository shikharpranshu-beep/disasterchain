import React, { useState } from 'react';
import { useTranslation } from '../i18n/i18n';
import Icon from '../components/Icons';

const OfflineEmergencyPage = () => {
  const { t } = useTranslation();
  const [smsData, setSmsData] = useState({
    recipient: '112',
    messageType: 'Medical Assistance',
    location: '',
    details: 'Immediate emergency dispatch required.',
  });

  const [copiedSms, setCopiedSms] = useState(false);

  const fullSmsBody = `[EMERGENCY SOS] Type: ${smsData.messageType} | Location: ${smsData.location || 'GPS Unknown'} | Info: ${smsData.details}`;

  const handleCopySms = () => {
    navigator.clipboard.writeText(fullSmsBody);
    setCopiedSms(true);
    setTimeout(() => setCopiedSms(false), 2500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* High-Contrast Survival Banner */}
      <div
        className="spatial-panel spatial-panel-critical"
        style={{
          padding: '1.75rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          borderLeft: '4px solid var(--crimson)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
            <span className="badge badge-critical">{t('offline.recoveryMode', 'LOCAL AIR-GAP SURVIVAL MODE')}</span>
            <span className="micro-label" style={{ color: 'var(--amber)' }}>
              {t('offline.offlineTitle', 'OFFLINE PRE-CACHED DIRECTIVES')}
            </span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.25rem' }}>
            {t('offline.offlineTitle', 'Low-Connectivity Emergency Telephony & SMS')}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            {t('offline.offlineSubtitle', 'Zero-internet survival tools, direct GSM cellular calling, and standardized SMS distress dispatchers.')}
          </p>
        </div>

        <div className="telemetry-chip" style={{ background: 'rgba(255, 46, 77, 0.15)', borderColor: 'var(--border-red)' }}>
          <span className="live-beacon-pulse critical" />
          <span style={{ color: '#ffffff', fontWeight: 700 }}>{t('offline.localDataCached', 'CELLULAR READY')}</span>
        </div>
      </div>

      {/* Emergency Hotlines Large-Button Grid */}
      <div className="grid-cols-4">
        {[
          { name: 'National Emergency', num: '112', icon: '🚨', color: 'var(--crimson)', desc: 'Police, Ambulance & Fire' },
          { name: 'Fire & Rescue Brigade', num: '101', icon: '🚒', color: 'var(--amber)', desc: 'Fire Hazard & Extrication' },
          { name: 'Ambulance / Trauma', num: '108', icon: '🚑', color: 'var(--cyan)', desc: 'Emergency Medical Service' },
          { name: 'NDRF Disaster Force', num: '1078', icon: '🏛️', color: 'var(--mint)', desc: 'National Disaster Triage' },
        ].map((line) => (
          <div
            key={line.num}
            className="spatial-panel"
            style={{
              textAlign: 'center',
              padding: '1.5rem',
              background: 'rgba(11, 17, 30, 0.88)',
              borderTop: `3px solid ${line.color}`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: '2.25rem', marginBottom: '0.35rem' }}>{line.icon}</div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#ffffff' }}>{line.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>{line.desc}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '2rem', color: line.color, marginBottom: '1rem' }}>
                {line.num}
              </div>
            </div>

            <a
              href={`tel:${line.num}`}
              className="btn btn-emergency"
              style={{ width: '100%', fontSize: '0.85rem', padding: '0.55rem' }}
            >
              📞 Direct Call {line.num}
            </a>
          </div>
        ))}
      </div>

      {/* SMS Cellular Generator & Survival Protocols */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Left: SMS Emergency Dispatch Generator */}
        <div className="spatial-panel" style={{ padding: '1.75rem', background: 'rgba(11, 17, 30, 0.88)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
            <span className="badge badge-info">CELLULAR SMS</span>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>
              Standardized SMS Distress Generator
            </h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '1.25rem' }}>
            When 4G/5G data is severed, standard GSM SMS can pass through high network congestion.
          </p>

          <div className="form-group">
            <label className="form-label">Recipient Hotline Number</label>
            <input
              type="text"
              className="form-input"
              value={smsData.recipient}
              onChange={(e) => setSmsData({ ...smsData, recipient: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Emergency Category</label>
            <select
              className="form-select"
              value={smsData.messageType}
              onChange={(e) => setSmsData({ ...smsData, messageType: e.target.value })}
            >
              <option value="Medical Assistance">Medical Assistance / Trauma</option>
              <option value="Trapped in Collapse">Trapped in Collapse / Structure</option>
              <option value="Fire Hazard">Fire Hazard / Smoke</option>
              <option value="Rising Flood Water">Rising Flood Water</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Last Known Location / Floor</label>
            <input
              type="text"
              className="form-input"
              value={smsData.location}
              onChange={(e) => setSmsData({ ...smsData, location: e.target.value })}
              placeholder="e.g. Science Complex 3rd floor room 304"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Critical Situation Summary</label>
            <textarea
              rows={2}
              className="form-textarea"
              value={smsData.details}
              onChange={(e) => setSmsData({ ...smsData, details: e.target.value })}
            />
          </div>

          <div
            style={{
              background: 'rgba(5, 8, 14, 0.85)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-xs)',
              padding: '0.75rem',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              color: 'var(--cyan)',
              marginBottom: '1rem',
              wordBreak: 'break-word',
            }}
          >
            {fullSmsBody}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={handleCopySms}
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem' }}
            >
              {copiedSms ? '✓ Copied' : '📋 Copy Text Payload'}
            </button>

            <a
              href={`sms:${smsData.recipient}?body=${encodeURIComponent(fullSmsBody)}`}
              className="btn btn-primary"
              style={{ fontSize: '0.8rem', textAlign: 'center' }}
            >
              ✉️ Open Native SMS App
            </a>
          </div>
        </div>

        {/* Right: Instant Air-Gap Safety Rules */}
        <div className="spatial-panel" style={{ padding: '1.75rem', background: 'rgba(11, 17, 30, 0.88)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
            <span className="badge badge-warning">OFFLINE PROTOCOLS</span>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>
              Essential Survival Directives
            </h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '1.25rem' }}>
            Critical instructions that remain active even if all telecommunications fail.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {[
              {
                title: 'Conserve Mobile Battery Power',
                text: 'Enable Battery Saver / Low Power Mode, set brightness to minimum, disable Bluetooth and GPS background scanning when not acquiring coordinates.',
              },
              {
                title: 'Emergency Sound Signalling',
                text: 'Use a whistle (3 short blasts indicates SOS) or rhythmically bang on metal pipes/beams. Shouting drains oxygen and can inhale dangerous toxic particulates.',
              },
              {
                title: 'Water Purification & Rationing',
                text: 'Boil water for at least 1 full minute if power is available. Store potable drinking water in sealed containers; avoid tap water if flood inundation occurs.',
              },
              {
                title: 'Check Structural Gas & Electrical Lines',
                text: 'If you smell sulfur/gas, DO NOT operate light switches or match flames. Shut off main gas valves and evacuate immediately into open air.',
              },
            ].map((rule, idx) => (
              <div
                key={idx}
                style={{
                  padding: '0.85rem 1rem',
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#ffffff', marginBottom: '0.2rem' }}>
                  {idx + 1}. {rule.title}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {rule.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 960px) {
          div[style*="gridTemplateColumns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default OfflineEmergencyPage;
