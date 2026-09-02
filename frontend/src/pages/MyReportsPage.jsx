import React, { useState, useEffect } from 'react';
import { fetchSosRequests, fetchIncidents } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/Icons';

const MyReportsPage = () => {
  const { user } = useAuth();
  const [sosList, setSosList] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('sos'); // 'sos' | 'incidents'

  const loadMyData = async () => {
    setLoading(true);
    setError('');
    try {
      const [allSos, allInc] = await Promise.all([fetchSosRequests(), fetchIncidents()]);

      // Filter by user name if user is logged in
      const userName = user?.name?.toLowerCase().trim();
      let mySos = allSos || [];
      let myInc = allInc || [];

      if (userName) {
        const userSos = mySos.filter((s) => s.name?.toLowerCase().trim() === userName);
        if (userSos.length > 0) mySos = userSos;

        const userInc = myInc.filter((i) => i.reporterName?.toLowerCase().trim() === userName);
        if (userInc.length > 0) myInc = userInc;
      }

      setSosList(mySos);
      setIncidents(myInc);
    } catch (err) {
      console.error('Error loading my reports:', err);
      setError('Unable to load your reports from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyData();
  }, [user]);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="badge badge-indigo" style={{ marginBottom: '0.4rem' }}>
            <Icon name="user" size={13} color="#818cf8" />
            <span>MY EMERGENCY TICKETS &bull; {user?.name || 'CITIZEN LOG'}</span>
          </div>
          <h1 className="page-header-title">
            <Icon name="report" size={26} color="var(--accent-indigo)" />
            <span>My Submitted Reports & SOS Signals</span>
          </h1>
          <p className="page-header-subtitle">
            Track real-time status and response updates for your emergency requests and hazard tickets
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          borderBottom: '1px solid var(--border-subtle)',
          marginBottom: '1.75rem',
        }}
      >
        <button
          onClick={() => setActiveTab('sos')}
          className={`btn ${activeTab === 'sos' ? 'btn-danger' : 'btn-secondary'}`}
          style={{
            fontSize: '0.88rem',
            padding: '0.6rem 1.15rem',
          }}
        >
          <Icon name="sos" size={16} />
          <span>My SOS Signals ({sosList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('incidents')}
          className={`btn ${activeTab === 'incidents' ? 'btn-primary' : 'btn-secondary'}`}
          style={{
            fontSize: '0.88rem',
            padding: '0.6rem 1.15rem',
          }}
        >
          <Icon name="warning" size={16} />
          <span>My Hazard Tickets ({incidents.length})</span>
        </button>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: '3px solid rgba(99, 102, 241, 0.2)',
              borderTopColor: '#818cf8',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem',
            }}
          />
          <div>Loading your reports...</div>
        </div>
      )}

      {error && !loading && (
        <div style={{ background: 'rgba(255, 51, 75, 0.15)', color: '#ff6b7e', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
          ⚠️ {error}
        </div>
      )}

      {/* SOS Tab */}
      {!loading && !error && activeTab === 'sos' && (
        <div>
          {sosList.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🚨</div>
              <h3 style={{ color: '#ffffff', fontWeight: 700 }}>No SOS Signals Broadcasted</h3>
              <p style={{ fontSize: '0.85rem' }}>You have not submitted any emergency SOS signals.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {sosList.map((sos) => (
                <div key={sos._id} className="glass-card glass-card-hoverable">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                        {sos.requestId}
                      </span>
                      <span className={`badge badge-${sos.severity?.toLowerCase()}`}>{sos.severity}</span>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>&bull; {sos.emergencyType}</span>
                    </div>
                    <span className="badge badge-warning" style={{ fontSize: '0.78rem' }}>
                      Status: {sos.status}
                    </span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '0.75rem', lineHeight: 1.5 }}>
                    {sos.description}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Icon name="map-pin" size={13} color="#818cf8" />
                      <span>Location: <strong style={{ color: 'var(--text-primary)' }}>{sos.location}</strong></span>
                    </span>
                    <span>Contact: {sos.contact}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Incidents Tab */}
      {!loading && !error && activeTab === 'incidents' && (
        <div>
          {incidents.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚡</div>
              <h3 style={{ color: '#ffffff', fontWeight: 700 }}>No Hazard Tickets Reported</h3>
              <p style={{ fontSize: '0.85rem' }}>You have not reported any campus hazard incidents yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {incidents.map((inc) => (
                <div key={inc._id} className="glass-card glass-card-hoverable">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                        {inc.incidentId}
                      </span>
                      <span className={`badge badge-${inc.severity?.toLowerCase()}`}>{inc.severity}</span>
                    </div>
                    <span className="badge badge-info" style={{ fontSize: '0.78rem' }}>
                      Status: {inc.status}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0.25rem 0', color: '#ffffff' }}>{inc.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '0.75rem', lineHeight: 1.5 }}>
                    {inc.description}
                  </p>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Icon name="map-pin" size={13} color="#818cf8" />
                    <span>Location: <strong style={{ color: 'var(--text-primary)' }}>{inc.location}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MyReportsPage;
