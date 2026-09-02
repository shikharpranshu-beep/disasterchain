import React from 'react';
import Icon from './Icons';

const ResourceJourneyModal = ({ isOpen, onClose, resourceData }) => {
  if (!isOpen || !resourceData) return null;

  const steps = [
    { title: '1. Donated & Registered', desc: `Donated by ${resourceData.donor || 'Relief Donor'}`, date: 'Day 1 - 09:00 AM', status: 'completed' },
    { title: '2. Cryptographic Block Verification', desc: `Block Hash: ${resourceData.blockchainTransactionId || 'TXN-881204'}`, date: 'Day 1 - 09:15 AM', status: 'completed' },
    { title: '3. Received at Central Warehouse', desc: 'Inspection & inventory intake at Logistics Hub', date: 'Day 1 - 02:30 PM', status: 'completed' },
    { title: '4. Dispatched to Shelter / Relief Zone', desc: `In-transit to ${resourceData.destination || 'Campus Shelter'}`, date: 'Day 2 - 08:00 AM', status: resourceData.status === 'In Transit' || resourceData.status === 'Delivered' || resourceData.status === 'Fully Distributed' ? 'completed' : 'active' },
    { title: '5. Distributed to Victims', desc: `Verified handover of ${resourceData.quantity || '500'} ${resourceData.unit || 'units'}`, date: 'Day 2 - 04:00 PM', status: resourceData.status === 'Fully Distributed' || resourceData.status === 'Distributed' ? 'completed' : 'pending' },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <span className="badge badge-blockchain" style={{ marginBottom: '0.4rem' }}>
              ⛓️ RESOURCE JOURNEY TRACKER
            </span>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>
              {resourceData.resourceName || 'Relief Supplies'}
            </h2>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Tracking ID: <strong style={{ fontFamily: 'var(--font-mono)' }}>{resourceData.donationId || resourceData.distributionId || 'REL-1042'}</strong>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost"
            style={{ padding: '0.4rem', color: 'var(--text-muted)' }}
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        {/* Journey Timeline */}
        <div style={{ position: 'relative', paddingLeft: '1.75rem', marginTop: '1.5rem', marginBottom: '1.5rem' }}>
          {/* Vertical Track Line */}
          <div
            style={{
              position: 'absolute',
              left: '7px',
              top: '12px',
              bottom: '12px',
              width: '2px',
              background: 'linear-gradient(to bottom, #10b981, #6366f1, #334155)',
            }}
          />

          {steps.map((step, idx) => {
            const isCompleted = step.status === 'completed';
            const isActive = step.status === 'active';

            return (
              <div key={idx} style={{ marginBottom: '1.25rem', position: 'relative' }}>
                {/* Node dot */}
                <div
                  style={{
                    position: 'absolute',
                    left: '-1.75rem',
                    top: '3px',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: isCompleted ? '#10b981' : isActive ? '#6366f1' : '#334155',
                    border: '3px solid #0d172e',
                    boxShadow: isActive ? '0 0 10px #6366f1' : isCompleted ? '0 0 8px rgba(16, 185, 129, 0.4)' : 'none',
                  }}
                />

                <div
                  style={{
                    background: 'rgba(15, 24, 44, 0.75)',
                    border: `1px solid ${isActive ? 'rgba(99, 102, 241, 0.45)' : 'var(--border-subtle)'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '0.85rem 1.1rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <strong style={{ fontSize: '0.92rem', color: isCompleted ? '#34d399' : isActive ? '#818cf8' : 'var(--text-secondary)' }}>
                      {step.title}
                    </strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{step.date}</span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    {step.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Cryptographic Verification Proof */}
        <div
          style={{
            background: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem 1rem',
            fontSize: '0.82rem',
            color: 'var(--text-secondary)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ color: '#818cf8', fontWeight: 700 }}>⛓️ Immutable Verification Proof:</span>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#c7d2fe', wordBreak: 'break-all' }}>
            {resourceData.blockchainTransactionId || '0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069'}
          </div>
        </div>

        <button onClick={onClose} className="btn btn-primary" style={{ width: '100%', marginTop: '1.25rem' }}>
          Close Journey View
        </button>
      </div>
    </div>
  );
};

export default ResourceJourneyModal;
