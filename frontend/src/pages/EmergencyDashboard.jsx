import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StatCard from '../components/StatCard';
import EmergencyAlertBanner from '../components/EmergencyAlertBanner';
import ResourceJourneyModal from '../components/ResourceJourneyModal';
import BlockchainReceiptModal from '../components/BlockchainReceiptModal';
import DisasterMap from '../components/DisasterMap';
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

  // Selected item for modals
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

    // Auto-refresh emergency dashboard every 25 seconds
    const interval = setInterval(() => {
      loadDashboardData(true);
    }, 25000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [refreshKey]);

  // Compute all statistics dynamically from real MongoDB data
  const criticalSosCount = sosList.filter((s) => s.severity === 'Critical' && s.status !== 'Resolved' && s.status !== 'Cancelled').length;
  const activeSosCount = sosList.filter((s) => s.status !== 'Resolved' && s.status !== 'Cancelled').length;
  const totalShelterCapacity = shelters.reduce((acc, s) => acc + (Number(s.capacity) || 0), 0);
  const totalShelterOccupancy = shelters.reduce((acc, s) => acc + (Number(s.occupancy) || 0), 0);
  const availableBeds = Math.max(0, totalShelterCapacity - totalShelterOccupancy);
  const totalAffectedPeople = affectedAreas.reduce((acc, a) => acc + (Number(a.affectedPeople) || 0), 0);
  const totalReliefQuantity = donations.reduce((acc, d) => acc + (Number(d.quantity) || 0), 0);
  const activeIncidentsCount = incidents.filter((i) => i.status !== 'Resolved' && i.status !== 'Rejected').length;
  const operationalResourcesCount = resources.filter((r) => r.status === 'Operational' || r.status === 'Available').length;

  return (
    <div>
      {/* Top Critical Alert Ticker from real backend Alerts */}
      <EmergencyAlertBanner alerts={alerts} />

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-header-title">
            <Icon name="activity" size={26} color="var(--accent-indigo)" />
            <span>Emergency Response Command Center</span>
          </h1>
          <p className="page-header-subtitle">
            Real-time situation overview, casualty signals, shelter readiness & verified aid distribution
          </p>
        </div>

        <div className="page-header-actions">
          <button onClick={onOpenSos} className="btn btn-sos" id="dashboard-sos-btn">
            <Icon name="sos" size={17} color="#ffffff" />
            <span>Broadcast SOS</span>
          </button>
          <button onClick={onOpenIncident} className="btn btn-secondary" id="dashboard-incident-btn">
            <Icon name="warning" size={16} />
            <span>Report Hazard</span>
          </button>
          <Link to="/offline" className="btn btn-outline">
            <Icon name="wifi-off" size={15} />
            <span>Offline Mode</span>
          </Link>
        </div>
      </div>

      {/* Top 4 Key Metric StatCards - 100% dynamically computed */}
      <div className="grid-cols-4" style={{ marginBottom: '1.75rem' }}>
        <StatCard
          title="Active Distress Signals"
          value={activeSosCount}
          subtitle={`${criticalSosCount} Critical Emergencies \u2022 ${sosList.length} Total`}
          icon="sos"
          color="red"
          badge={criticalSosCount > 0 ? `${criticalSosCount} CRITICAL` : 'STABLE'}
        />

        <StatCard
          title="Available Shelter Beds"
          value={availableBeds}
          subtitle={`${totalShelterOccupancy} / ${totalShelterCapacity} Occupied (${shelters.length} Shelters)`}
          icon="home"
          color="cyan"
          badge="SAFE HAVENS"
        />

        <StatCard
          title="Impact Hazard Zones"
          value={affectedAreas.length}
          subtitle={`${totalAffectedPeople.toLocaleString()} Affected People Monitored`}
          icon="map"
          color="amber"
          badge="MONITORED"
        />

        <StatCard
          title="Blockchain Verified Aid"
          value={blockchainRecords.length}
          subtitle={`${totalReliefQuantity.toLocaleString()} Units Logged on Testnet`}
          icon="blockchain"
          color="indigo"
          badge="LEDGER ON"
        />
      </div>

      {/* Interactive Disaster & Relief Map connected to real backend coordinates */}
      <div style={{ marginBottom: '1.75rem' }}>
        <DisasterMap
          height="480px"
          onOpenSos={onOpenSos}
          showToolbar={true}
          showLegend={true}
        />
      </div>

      {/* Main Grid: Impact Zones Overview & Priority SOS Stream */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1.5rem',
          marginBottom: '1.75rem',
        }}
      >
        {/* Monitored Sector Hazard Cards from real MongoDB affected-areas */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ffffff' }}>
                <Icon name="map" size={18} color="#f59e0b" />
                <span>Monitored Hazard Sectors</span>
              </h2>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Active casualty counts and sector risk levels ({affectedAreas.length} Zones)
              </div>
            </div>
            <Link to="/affected-areas" style={{ fontSize: '0.82rem', color: 'var(--accent-indigo)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span>Full Map</span>
              <Icon name="arrow-right" size={13} />
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', overflowY: 'auto', maxHeight: '300px' }}>
            {affectedAreas.length === 0 ? (
              <div style={{ gridColumn: 'span 2', textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                No active hazard zones reported.
              </div>
            ) : (
              affectedAreas.slice(0, 4).map((area) => {
                const isCritical = area.severity === 'Critical';
                const isHigh = area.severity === 'High';
                const isModerate = area.severity === 'Moderate';

                const borderCol = isCritical
                  ? '#ff334b'
                  : isHigh
                  ? '#f97316'
                  : isModerate
                  ? '#f59e0b'
                  : '#10b981';

                const bgCol = isCritical
                  ? 'rgba(255, 51, 75, 0.12)'
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
                      padding: '0.85rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <strong style={{ fontSize: '0.88rem', color: '#ffffff' }}>{area.name}</strong>
                      <span className={`badge badge-${area.severity?.toLowerCase()}`} style={{ fontSize: '0.65rem' }}>
                        {area.severity}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      {area.disasterType}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      <span>👥 {Number(area.affectedPeople || 0).toLocaleString()}</span>
                      <span style={{ color: '#ff6b7e', fontWeight: 700 }}>🚨 {area.activeSOS || 0} SOS</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Live SOS Emergency Stream from real MongoDB SOS requests */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ff6b7e', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Icon name="sos" size={18} color="#ff334b" />
                <span>Priority SOS Distress Queue</span>
              </h2>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Latest distress broadcasts awaiting dispatch ({sosList.length} Signals)
              </div>
            </div>
            <Link to="/sos" style={{ fontSize: '0.82rem', color: 'var(--accent-indigo)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span>View All ({sosList.length})</span>
              <Icon name="arrow-right" size={13} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', overflowY: 'auto', maxHeight: '300px' }}>
            {sosList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                No active SOS signals at this time.
              </div>
            ) : (
              sosList.slice(0, 4).map((sos) => (
                <div
                  key={sos._id}
                  style={{
                    background: 'rgba(11, 18, 34, 0.75)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.85rem 1rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#ffffff' }}>
                      {sos.requestId || 'SOS'} \u2022 {sos.emergencyType}
                    </span>
                    <span className={`badge badge-${sos.severity?.toLowerCase()}`}>{sos.severity}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {sos.description}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>📍 {sos.location}</span>
                    <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>{sos.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Lower Section: Shelters & Blockchain Relief Feed from real MongoDB collections */}
      <div className="grid-cols-2" style={{ marginBottom: '1.75rem' }}>
        {/* Shelter Occupancy Meters */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ffffff' }}>
                <Icon name="home" size={18} color="#10b981" />
                <span>Shelter Capacity & Safe Havens</span>
              </h2>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Real-time bed availability & amenities ({shelters.length} Shelters)
              </div>
            </div>
            <Link to="/shelters" style={{ fontSize: '0.82rem', color: 'var(--accent-indigo)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span>All Shelters</span>
              <Icon name="arrow-right" size={13} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {shelters.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                No shelter data available.
              </div>
            ) : (
              shelters.slice(0, 3).map((shelter) => {
                const cap = Number(shelter.capacity) || 1;
                const occ = Number(shelter.occupancy) || 0;
                const percent = Math.min(100, Math.round((occ / cap) * 100));
                const isFull = percent >= 100;
                const avail = Math.max(0, cap - occ);

                return (
                  <div key={shelter._id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.88rem', color: '#ffffff' }}>{shelter.name}</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: isFull ? '#ff6b7e' : '#34d399' }}>
                        {occ} / {cap} ({percent}%)
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ width: '100%', height: '8px', background: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${percent}%`,
                          height: '100%',
                          background: isFull
                            ? '#ff334b'
                            : percent > 75
                            ? '#f59e0b'
                            : 'linear-gradient(90deg, #10b981, #06b6d4)',
                          transition: 'width 0.4s ease',
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.35rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span>📍 {shelter.address}</span>
                      <span style={{ color: isFull ? '#ff6b7e' : '#38bdf8' }}>
                        {isFull ? 'FULL' : `${avail} beds available`}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Blockchain Transparency Feed from real MongoDB blockchain records */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <span className="badge badge-blockchain" style={{ marginBottom: '0.25rem' }}>
                \u26D3\uFE0F CRYPTOGRAPHIC AUDIT
              </span>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>
                Blockchain Relief Ledger
              </h2>
            </div>
            <Link to="/transparency" style={{ fontSize: '0.82rem', color: 'var(--accent-indigo)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span>Full Ledger</span>
              <Icon name="arrow-right" size={13} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {blockchainRecords.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                No blockchain transactions recorded yet.
              </div>
            ) : (
              blockchainRecords.slice(0, 3).map((rec) => (
                <div
                  key={rec._id}
                  style={{
                    background: 'rgba(11, 18, 34, 0.75)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.85rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#818cf8', fontWeight: 700 }}>
                        {rec.transactionId}
                      </span>
                      <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>{rec.status}</span>
                    </div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#ffffff' }}>
                      {rec.quantity} {rec.unit || 'units'} \u2022 {rec.resourceName}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Destination: {rec.destination}
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedReceipt(rec)}
                    className="btn btn-outline btn-sm"
                    style={{ borderColor: 'rgba(99, 102, 241, 0.4)', color: '#a5b4fc', whiteSpace: 'nowrap' }}
                  >
                    <Icon name="blockchain" size={13} color="#818cf8" />
                    <span>Verify</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Additional Lower Grid: Hazards & Facilities Summary */}
      <div className="grid-cols-2" style={{ marginBottom: '1.75rem' }}>
        {/* Campus Hazard Reports Quick Summary */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ffffff' }}>
                <Icon name="warning" size={18} color="#f97316" />
                <span>Campus Hazard Reports</span>
              </h2>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {activeIncidentsCount} Active Tickets \u2022 {incidents.length} Total Reported
              </div>
            </div>
            <Link to="/incidents" style={{ fontSize: '0.82rem', color: 'var(--accent-indigo)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span>All Hazards</span>
              <Icon name="arrow-right" size={13} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', overflowY: 'auto', maxHeight: '240px' }}>
            {incidents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                No hazard tickets reported.
              </div>
            ) : (
              incidents.slice(0, 3).map((inc) => (
                <div
                  key={inc._id}
                  style={{
                    background: 'rgba(11, 18, 34, 0.75)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.75rem 0.95rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#ffffff' }}>
                      {inc.incidentId || 'INC'} \u2022 {inc.title}
                    </span>
                    <span className={`badge badge-${inc.severity?.toLowerCase()}`}>{inc.severity}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>📍 {inc.location}</span>
                    <span className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>{inc.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Emergency Resources Directory Quick Summary */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ffffff' }}>
                <Icon name="hospital" size={18} color="#06b6d4" />
                <span>Emergency Directory & Facilities</span>
              </h2>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {operationalResourcesCount} Operational Facilities \u2022 {resources.length} Total
              </div>
            </div>
            <Link to="/resources" style={{ fontSize: '0.82rem', color: 'var(--accent-indigo)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span>Directory</span>
              <Icon name="arrow-right" size={13} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', overflowY: 'auto', maxHeight: '240px' }}>
            {resources.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                No emergency facilities registered.
              </div>
            ) : (
              resources.slice(0, 3).map((res) => (
                <div
                  key={res._id}
                  style={{
                    background: 'rgba(11, 18, 34, 0.75)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.75rem 0.95rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#ffffff' }}>
                      {res.name}
                    </span>
                    <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>{res.type}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>📍 {res.address}</span>
                    <span style={{ color: '#38bdf8', fontWeight: 700 }}>📞 {res.phone}</span>
                  </div>
                </div>
              ))
            )}
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
