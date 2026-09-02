import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import CrisisGlobe3D from '../components/CrisisGlobe3D';
import DisasterMap from '../components/DisasterMap';
import ResourceJourneyModal from '../components/ResourceJourneyModal';
import BlockchainReceiptModal from '../components/BlockchainReceiptModal';
import Icon from '../components/Icons';
import {
  fetchSosRequests,
  fetchShelters,
  fetchAffectedAreas,
  fetchAlerts,
  fetchIncidents,
  fetchResources,
  fetchDonations,
  fetchDistributions,
  fetchBlockchainTransactions,
} from '../services/api';

const EmergencyDashboard = ({ onOpenSos, onOpenIncident, refreshKey }) => {
  const [sosList, setSosList] = useState([]);
  const [shelters, setShelters] = useState([]);
  const [affectedAreas, setAffectedAreas] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [resources, setResources] = useState([]);
  const [donations, setDonations] = useState([]);
  const [distributions, setDistributions] = useState([]);
  const [blockchainRecords, setBlockchainRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  // Center display mode: '3D' | 'MAP'
  const [viewCenterMode, setViewCenterMode] = useState('3D');

  // Modals
  const [selectedJourney, setSelectedJourney] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadDashboardData = async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const [sos, sh, areas, alt, inc, res, don, dist, bc] = await Promise.all([
          fetchSosRequests(),
          fetchShelters(),
          fetchAffectedAreas(),
          fetchAlerts(),
          fetchIncidents(),
          fetchResources(),
          fetchDonations(),
          fetchDistributions(),
          fetchBlockchainTransactions({ limit: 6 }),
        ]);

        if (isMounted) {
          setSosList(sos || []);
          setShelters(sh || []);
          setAffectedAreas(areas || []);
          setAlerts(alt || []);
          setIncidents(inc || []);
          setResources(res || []);
          setDonations(don || []);
          setDistributions(dist || []);
          setBlockchainRecords(bc || []);
        }
      } catch (err) {
        console.error('Error loading dashboard data from backend:', err);
      } finally {
        if (isMounted && !silent) {
          setLoading(false);
        }
      }
    };

    loadDashboardData();

    const interval = setInterval(() => {
      loadDashboardData(true);
    }, 25000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [refreshKey]);

  // Telemetry KPIs from live MongoDB collections
  const criticalSosCount = useMemo(() => {
    return sosList.filter((s) => s.severity === 'Critical' && s.status !== 'Resolved' && s.status !== 'Cancelled').length;
  }, [sosList]);

  const activeSosCount = useMemo(() => {
    return sosList.filter((s) => s.status !== 'Resolved' && s.status !== 'Cancelled').length;
  }, [sosList]);

  const totalShelterCapacity = useMemo(() => {
    return shelters.reduce((acc, s) => acc + (Number(s.capacity) || 0), 0);
  }, [shelters]);

  const totalShelterOccupancy = useMemo(() => {
    return shelters.reduce((acc, s) => acc + (Number(s.occupancy) || 0), 0);
  }, [shelters]);

  const availableBeds = Math.max(0, totalShelterCapacity - totalShelterOccupancy);

  const totalAffectedPeople = useMemo(() => {
    return affectedAreas.reduce((acc, a) => acc + (Number(a.affectedPeople) || 0), 0);
  }, [affectedAreas]);

  const activeIncidentsCount = useMemo(() => {
    return incidents.filter((i) => i.status !== 'Resolved' && i.status !== 'Rejected').length;
  }, [incidents]);

  const operationalResourcesCount = useMemo(() => {
    return resources.filter((r) => r.status === 'Operational' || r.status === 'Available').length;
  }, [resources]);

  // Operational threat condition
  const threatTier = criticalSosCount > 3 ? 'TIER 1 — CRITICAL RESPONSE' : criticalSosCount > 0 ? 'TIER 2 — ELEVATED HAZARD' : 'TIER 3 — NOMINAL MONITORING';
  const threatColor = criticalSosCount > 3 ? 'var(--crimson)' : criticalSosCount > 0 ? 'var(--amber)' : 'var(--mint)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* TOP: Mission Control HUD Header Bar */}
      <div
        className="spatial-panel"
        style={{
          padding: '1.15rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          background: 'rgba(9, 14, 25, 0.94)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: threatColor,
              boxShadow: `0 0 14px ${threatColor}`,
            }}
          />
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.25rem', color: '#ffffff' }}>
              CRISIS OPERATIONS CENTER
            </div>
            <div className="micro-label" style={{ color: threatColor }}>
              {threatTier} • {activeSosCount} ACTIVE DISTRESS SIGNALS
            </div>
          </div>
        </div>

        {/* Tactical Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div
            style={{
              display: 'inline-flex',
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-xs)',
              overflow: 'hidden',
              marginRight: '0.5rem',
            }}
          >
            <button
              type="button"
              onClick={() => setViewCenterMode('3D')}
              style={{
                padding: '5px 12px',
                fontSize: '0.75rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: viewCenterMode === '3D' ? 'var(--cyan)' : 'transparent',
                color: viewCenterMode === '3D' ? '#040812' : 'var(--text-secondary)',
              }}
            >
              3D Globe
            </button>
            <button
              type="button"
              onClick={() => setViewCenterMode('MAP')}
              style={{
                padding: '5px 12px',
                fontSize: '0.75rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: viewCenterMode === 'MAP' ? 'var(--cyan)' : 'transparent',
                color: viewCenterMode === 'MAP' ? '#040812' : 'var(--text-secondary)',
              }}
            >
              Tactical Map
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenIncident}
            className="btn btn-secondary btn-sm"
          >
            <Icon name="warning" size={15} color="var(--amber)" />
            <span>Report Hazard</span>
          </button>

          <button
            type="button"
            onClick={onOpenSos}
            className="btn btn-emergency btn-sm"
          >
            <Icon name="alert-circle" size={15} color="#ffffff" />
            <span>Broadcast SOS</span>
          </button>
        </div>
      </div>

      {/* CENTER WORKSPACE WITH DUAL RAILS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '320px 1fr 340px',
          gap: '1.25rem',
          alignItems: 'stretch',
        }}
      >
        {/* LEFT RAIL: Critical Emergency Queue */}
        <div
          className="spatial-panel"
          style={{
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '520px',
            background: 'rgba(10, 15, 26, 0.92)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <div className="micro-label" style={{ color: 'var(--crimson)' }}>
                DISTRESS QUEUE
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#ffffff' }}>
                Active SOS Feed ({sosList.length})
              </div>
            </div>
            <Link to="/sos" className="micro-label" style={{ color: 'var(--cyan)' }}>
              View All →
            </Link>
          </div>

          <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {sosList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>🛡️</div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>No Active SOS Signals</div>
                <div style={{ fontSize: '0.75rem' }}>Emergency queue is currently clear.</div>
              </div>
            ) : (
              sosList.slice(0, 6).map((sos) => (
                <div
                  key={sos._id}
                  style={{
                    padding: '0.75rem',
                    background: sos.severity === 'Critical' ? 'rgba(255, 46, 77, 0.08)' : 'rgba(15, 23, 42, 0.75)',
                    border: `1px solid ${sos.severity === 'Critical' ? 'var(--border-red)' : 'var(--border-subtle)'}`,
                    borderRadius: 'var(--radius-sm)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                    <span className={`badge ${sos.severity === 'Critical' ? 'badge-critical' : 'badge-warning'}`} style={{ fontSize: '0.65rem' }}>
                      {sos.severity}
                    </span>
                    <span className="micro-label" style={{ fontSize: '0.68rem', color: 'var(--cyan)' }}>
                      {sos.status || 'Pending'}
                    </span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#ffffff', marginBottom: '0.2rem' }}>
                    {sos.emergencyType} — {sos.name}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    📍 {sos.location}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* CENTER VISUAL CENTERPIECE: 3D Globe or Leaflet Map */}
        <div style={{ minHeight: '500px', display: 'flex', flexDirection: 'column' }}>
          {viewCenterMode === '3D' ? (
            <CrisisGlobe3D
              sosRequests={sosList}
              affectedAreas={affectedAreas}
              shelters={shelters}
            />
          ) : (
            <DisasterMap
              height="480px"
              showToolbar={true}
              showLegend={false}
              onOpenSos={onOpenSos}
            />
          )}
        </div>

        {/* RIGHT RAIL: Situation Intelligence & Priority Alerts */}
        <div
          className="spatial-panel"
          style={{
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '520px',
            background: 'rgba(10, 15, 26, 0.92)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <div className="micro-label" style={{ color: 'var(--amber)' }}>
                SITUATION INTEL
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#ffffff' }}>
                Crisis Broadcasts ({alerts.length})
              </div>
            </div>
            <Link to="/alerts" className="micro-label" style={{ color: 'var(--cyan)' }}>
              Alerts Feed →
            </Link>
          </div>

          <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {alerts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>📡</div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>No Active Broadcasts</div>
                <div style={{ fontSize: '0.75rem' }}>All monitored sectors are nominal.</div>
              </div>
            ) : (
              alerts.slice(0, 5).map((alt) => (
                <div
                  key={alt._id}
                  style={{
                    padding: '0.75rem',
                    background: 'rgba(15, 23, 42, 0.75)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    borderLeft: `3px solid ${alt.severity === 'Danger' || alt.severity === 'Emergency' ? 'var(--crimson)' : 'var(--amber)'}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <span className="micro-label" style={{ color: 'var(--amber)' }}>
                      {alt.type || 'Advisory'}
                    </span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {new Date(alt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#ffffff', marginBottom: '0.2rem' }}>
                    {alt.title}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', lineHeight: 1.3 }}>
                    {alt.message}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1280px) {
          div[style*="gridTemplateColumns: 320px 1fr 340px"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* BOTTOM: Compact Live Telemetry KPIs Grid */}
      <div className="grid-cols-4">
        {/* 1. SOS Signals */}
        <div className="telemetry-widget">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <span className="micro-label">ACTIVE DISTRESS</span>
            <span className="live-beacon-pulse critical" />
          </div>
          <div className="telemetry-num crimson">
            {activeSosCount}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            <span>Critical: {criticalSosCount}</span>
            <Link to="/sos" style={{ color: 'var(--cyan)' }}>Dispatch Feed →</Link>
          </div>
        </div>

        {/* 2. Shelter Capacity */}
        <div className="telemetry-widget">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <span className="micro-label">AVAILABLE BEDS</span>
            <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>
              {shelters.length} Shelters
            </span>
          </div>
          <div className="telemetry-num cyan">
            {availableBeds.toLocaleString()}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            <span>Total Cap: {totalShelterCapacity.toLocaleString()}</span>
            <Link to="/shelters" style={{ color: 'var(--cyan)' }}>View Facilities →</Link>
          </div>
        </div>

        {/* 3. Hazard Impact Zones */}
        <div className="telemetry-widget">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <span className="micro-label">IMPACT ZONES</span>
            <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>
              {affectedAreas.length} Zones
            </span>
          </div>
          <div className="telemetry-num amber">
            {totalAffectedPeople.toLocaleString()}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            <span>People in Risk Area</span>
            <Link to="/affected-areas" style={{ color: 'var(--cyan)' }}>Hazard Map →</Link>
          </div>
        </div>

        {/* 4. Cryptographic Blockchain Ledger */}
        <div className="telemetry-widget">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <span className="micro-label">TRANSPARENCY LEDGER</span>
            <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
              Verified
            </span>
          </div>
          <div className="telemetry-num mint">
            {blockchainRecords.length}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            <span>Mined Blocks</span>
            <Link to="/transparency" style={{ color: 'var(--cyan)' }}>Audit Trail →</Link>
          </div>
        </div>
      </div>

      {/* Modals for Resource Journey and Blockchain Audit Receipt */}
      {selectedJourney && (
        <ResourceJourneyModal
          item={selectedJourney}
          onClose={() => setSelectedJourney(null)}
        />
      )}

      {selectedReceipt && (
        <BlockchainReceiptModal
          item={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </div>
  );
};

export default EmergencyDashboard;
