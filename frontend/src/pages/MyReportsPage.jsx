import React, { useState, useEffect } from 'react';
import { fetchSosRequests, fetchIncidents } from '../services/api';
import { useAuth } from '../context/AuthContext';

const MyReportsPage = () => {
  const { user } = useAuth();
  const [sosList, setSosList] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [activeTab, setActiveTab] = useState('sos'); // 'sos' | 'incidents'

  useEffect(() => {
    const loadMyData = async () => {
      const [allSos, allInc] = await Promise.all([fetchSosRequests(), fetchIncidents()]);
      // Filter by current user or show initial demo reports
      setSosList(allSos.slice(0, 3));
      setIncidents(allInc.slice(0, 2));
    };
    loadMyData();
  }, [user]);

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>📝 My Submitted Reports & SOS Requests</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Track real-time status and action updates for your emergency requests and hazard tickets
        </p>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          borderBottom: '1px solid var(--border-subtle)',
          marginBottom: '1.5rem',
        }}
      >
        <button
          onClick={() => setActiveTab('sos')}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'sos' ? '3px solid #ef4444' : '3px solid transparent',
            color: activeTab === 'sos' ? '#ffffff' : 'var(--text-secondary)',
            fontWeight: activeTab === 'sos' ? 700 : 500,
            fontSize: '0.95rem',
            cursor: 'pointer',
          }}
        >
          🚨 My SOS Distress Signals ({sosList.length})
        </button>

        <button
          onClick={() => setActiveTab('incidents')}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'incidents' ? '3px solid var(--accent-indigo)' : '3px solid transparent',
            color: activeTab === 'incidents' ? '#ffffff' : 'var(--text-secondary)',
            fontWeight: activeTab === 'incidents' ? 700 : 500,
            fontSize: '0.95rem',
            cursor: 'pointer',
          }}
        >
          ⚠️ My Hazard Reports ({incidents.length})
        </button>
      </div>

      {activeTab === 'sos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {sosList.map((sos) => (
            <div key={sos._id} className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{sos.requestId}</span>
                  <span className={`badge badge-${sos.severity?.toLowerCase()}`}>{sos.severity}</span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>&bull; {sos.emergencyType}</span>
                </div>
                <span className="badge badge-warning" style={{ fontSize: '0.8rem' }}>
                  Status: {sos.status}
                </span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '0.75rem' }}>
                {sos.description}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <span>📍 Location: <strong>{sos.location}</strong></span>
                <span>Contact: {sos.contact}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'incidents' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {incidents.map((inc) => (
            <div key={inc._id} className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{inc.incidentId}</span>
                  <span className={`badge badge-${inc.severity?.toLowerCase()}`}>{inc.severity}</span>
                </div>
                <span className="badge badge-info" style={{ fontSize: '0.8rem' }}>
                  Status: {inc.status}
                </span>
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.35rem' }}>{inc.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '0.75rem' }}>
                {inc.description}
              </p>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                📍 Location: <strong>{inc.location}</strong>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyReportsPage;
