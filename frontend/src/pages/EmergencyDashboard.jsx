import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StatCard from '../components/StatCard';
import EmergencyAlertBanner from '../components/EmergencyAlertBanner';
import ResourceJourneyModal from '../components/ResourceJourneyModal';
import BlockchainReceiptModal from '../components/BlockchainReceiptModal';
import {
  fetchSosRequests,
  fetchShelters,
  fetchAffectedAreas,
  fetchAlerts,
  fetchDonations,
  fetchDistributions,
  fetchBlockchainTransactions,
} from '../services/api';

const EmergencyDashboard = ({ onOpenSos, onOpenIncident }) => {
  const [sosList, setSosList] = useState([]);
  const [shelters, setShelters] = useState([]);
  const [affectedAreas, setAffectedAreas] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [donations, setDonations] = useState([]);
  const [distributions, setDistributions] = useState([]);
  const [blockchainRecords, setBlockchainRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected item for modals
  const [selectedJourney, setSelectedJourney] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const [sos, sh, areas, alt, don, dist, bc] = await Promise.all([
          fetchSosRequests(),
          fetchShelters(),
          fetchAffectedAreas(),
          fetchAlerts(),
          fetchDonations(),
          fetchDistributions(),
          fetchBlockchainTransactions({ limit: 4 }),
        ]);

        setSosList(sos);
        setShelters(sh);
        setAffectedAreas(areas);
        setAlerts(alt);
        setDonations(don);
        setDistributions(dist);
        setBlockchainRecords(bc);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // Compute key metrics
  const criticalSosCount = sosList.filter((s) => s.severity === 'Critical' && s.status !== 'Resolved').length;
  const activeSosCount = sosList.filter((s) => s.status !== 'Resolved').length;
  const totalShelterCapacity = shelters.reduce((acc, s) => acc + (s.capacity || 0), 0);
  const totalShelterOccupancy = shelters.reduce((acc, s) => acc + (s.occupancy || 0), 0);
  const availableBeds = Math.max(0, totalShelterCapacity - totalShelterOccupancy);
  const activeAlertsCount = alerts.filter((a) => a.active).length;

  return (
    <div>
      {/* Top Critical Alert Ticker */}
      <EmergencyAlertBanner alerts={alerts} />

      {/* Header with Quick Actions */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.75rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Emergency Response Dashboard
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Live situation overview, casualty signals & verified resource distribution
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button onClick={onOpenSos} className="btn btn-sos">
            🚨 Broadcast SOS
          </button>
          <button onClick={onOpenIncident} className="btn btn-secondary">
            ⚠️ Report Hazard
          </button>
          <Link to="/offline" className="btn btn-outline">
            📡 Offline Mode
          </Link>
        </div>
      </div>

      {/* Top 4 Key Metric StatCards */}
      <div className="grid-cols-4" style={{ marginBottom: '1.75rem' }}>
        <StatCard
          title="Active SOS Requests"
          value={activeSosCount}
          subtitle={`${criticalSosCount} Critical Emergencies`}
          icon="🚨"
          color="red"
          badge={criticalSosCount > 0 ? `${criticalSosCount} CRITICAL` : 'STABLE'}
        />

        <StatCard
          title="Available Shelter Beds"
          value={availableBeds}
          subtitle={`${totalShelterOccupancy} / ${totalShelterCapacity} Occupied (${shelters.length} Shelters)`}
          icon="🏠"
          color="cyan"
          badge="SAFE ZONES"
        />

        <StatCard
          title="Affected Impact Zones"
          value={affectedAreas.length}
          subtitle="Monitored Campus Sectors"
          icon="🗺️"
          color="amber"
          badge="ACTIVE"
        />

        <StatCard
          title="Blockchain Verified Aid"
          value={donations.length + distributions.length}
          subtitle="Cryptographically Logged Transactions"
          icon="⛓️"
          color="indigo"
          badge="LEDGER ON"
        />
      </div>

      {/* Main Grid: Interactive Map & Live SOS Stream */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.4fr 1fr',
          gap: '1.5rem',
          marginBottom: '1.75rem',
        }}
      >
        {/* Affected Area Visualizer Map */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800 }}>
                🗺️ Affected Areas & Severity Zones
              </h2>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Visual geographic impact grid & casualty density
              </div>
            </div>
            <Link to="/affected-areas" style={{ fontSize: '0.82rem', color: 'var(--accent-indigo)', fontWeight: 600 }}>
              Full Map View →
            </Link>
          </div>

          {/* Interactive Visual Map Representation */}
          <div
            style={{
              background: '#090d16',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              minHeight: '260px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
              {affectedAreas.slice(0, 6).map((area) => {
                const isCritical = area.severity === 'Critical';
                const isHigh = area.severity === 'High';
                const isModerate = area.severity === 'Moderate';

                const borderCol = isCritical
                  ? '#ef4444'
                  : isHigh
                  ? '#f97316'
                  : isModerate
                  ? '#f59e0b'
                  : '#10b981';

                const bgCol = isCritical
                  ? 'rgba(239, 68, 68, 0.12)'
                  : isHigh
                  ? 'rgba(249, 115, 22, 0.12)'
                  : 'rgba(245, 158, 11, 0.12)';

                return (
                  <div
                    key={area._id}
                    style={{
                      background: bgCol,
                      border: `1px solid ${borderCol}`,
                      borderRadius: 'var(--radius-md)',
                      padding: '0.75rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <strong style={{ fontSize: '0.85rem' }}>{area.name}</strong>
                      <span className={`badge badge-${area.severity?.toLowerCase()}`} style={{ fontSize: '0.65rem' }}>
                        {area.severity}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                      {area.disasterType}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      <span>👥 {area.affectedPeople} affected</span>
                      <span style={{ color: '#f87171', fontWeight: 600 }}>🚨 {area.activeSOS} SOS</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              style={{
                marginTop: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                borderTop: '1px solid var(--border-subtle)',
                paddingTop: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', gap: '1rem' }}>
                <span>🟢 Safe</span>
                <span>🟡 Moderate</span>
                <span>🟠 High Impact</span>
                <span>🔴 Critical Zone</span>
              </div>
              <div><em>Prototype Geolocation Grid</em></div>
            </div>
          </div>
        </div>

        {/* Live SOS Emergency Stream */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f87171' }}>
                🚨 Priority SOS Distress Queue
              </h2>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Latest requests awaiting response
              </div>
            </div>
            <Link to="/sos" style={{ fontSize: '0.82rem', color: 'var(--accent-indigo)', fontWeight: 600 }}>
              All ({sosList.length}) →
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', overflowY: 'auto', maxHeight: '300px' }}>
            {sosList.slice(0, 4).map((sos) => (
              <div
                key={sos._id}
                style={{
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem 1rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{sos.requestId} &bull; {sos.emergencyType}</span>
                  <span className={`badge badge-${sos.severity?.toLowerCase()}`}>{sos.severity}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {sos.description}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span>📍 {sos.location}</span>
                  <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>{sos.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lower Section: Shelters & Blockchain Transparency Activity */}
      <div className="grid-cols-2" style={{ marginBottom: '1.75rem' }}>
        {/* Shelter Occupancy Meters */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800 }}>
                🏠 Shelter Capacity & Safe Havens
              </h2>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Real-time bed availability & amenities
              </div>
            </div>
            <Link to="/shelters" style={{ fontSize: '0.82rem', color: 'var(--accent-indigo)', fontWeight: 600 }}>
              View All Shelters →
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {shelters.slice(0, 3).map((shelter) => {
              const percent = Math.min(100, Math.round(((shelter.occupancy || 0) / (shelter.capacity || 1)) * 100));
              const isFull = percent >= 100;

              return (
                <div key={shelter._id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{shelter.name}</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: isFull ? '#f87171' : '#34d399' }}>
                      {shelter.occupancy} / {shelter.capacity} ({percent}%)
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ width: '100%', height: '8px', background: '#334155', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${percent}%`,
                        height: '100%',
                        background: isFull
                          ? '#ef4444'
                          : percent > 75
                          ? '#f59e0b'
                          : 'linear-gradient(90deg, #10b981, #06b6d4)',
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.35rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>📍 {shelter.address}</span>
                    <span style={{ color: isFull ? '#f87171' : '#38bdf8' }}>
                      {isFull ? 'FULL' : `${shelter.capacity - shelter.occupancy} beds available`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Blockchain Transparency Feed */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <span className="badge badge-blockchain" style={{ marginBottom: '0.25rem' }}>
                ⛓️ PROTOTYPE TESTNET
              </span>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800 }}>
                Blockchain Relief Ledger
              </h2>
            </div>
            <Link to="/transparency" style={{ fontSize: '0.82rem', color: 'var(--accent-indigo)', fontWeight: 600 }}>
              Full Ledger →
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {blockchainRecords.slice(0, 3).map((rec) => (
              <div
                key={rec._id}
                style={{
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#818cf8', fontWeight: 700 }}>
                      {rec.transactionId}
                    </span>
                    <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>{rec.status}</span>
                  </div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                    {rec.quantity} {rec.unit || 'units'} &bull; {rec.resourceName}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Destination: {rec.destination}
                  </div>
                </div>

                <button
                  onClick={() => setSelectedReceipt(rec)}
                  className="btn btn-outline"
                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem', borderColor: 'rgba(99, 102, 241, 0.4)' }}
                >
                  Verify 🔍
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      <ResourceJourneyModal
        isOpen={!!selectedJourney}
        onClose={() => setSelectedJourney(null)}
        resourceData={selectedJourney}
      />

      <BlockchainReceiptModal
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        record={selectedReceipt}
      />
    </div>
  );
};

export default EmergencyDashboard;
