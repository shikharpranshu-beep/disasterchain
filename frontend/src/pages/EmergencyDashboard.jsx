import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import DisasterCommandMap from '../components/DisasterCommandMap';
import ResourceJourneyModal from '../components/ResourceJourneyModal';
import BlockchainReceiptModal from '../components/BlockchainReceiptModal';
import CrisisIntelligenceModal from '../components/CrisisIntelligenceModal';
import ShelterDetailModal from '../components/ShelterDetailModal';
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
  fetchCrisisIntelligence,
  fetchRiskHeatmap,
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/i18n';

const EmergencyDashboard = ({ onOpenSos, onOpenIncident, refreshKey }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isResponderOrAdmin = user?.role === 'admin' || user?.role === 'responder';
  const [dashboardMode, setDashboardMode] = useState('STANDARD'); // 'STANDARD' | 'MISSION_CONTROL'

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

  // Crisis Intelligence Live Priority State
  const [intelligenceList, setIntelligenceList] = useState([]);
  const [intelligenceSummary, setIntelligenceSummary] = useState({
    totalActive: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  });
  const [intelligenceLoading, setIntelligenceLoading] = useState(true);
  const [intelligenceError, setIntelligenceError] = useState(null);
  const [selectedIntelligence, setSelectedIntelligence] = useState(null);
  const [mapFocusTarget, setMapFocusTarget] = useState(null);
  const [activePriorityFilter, setActivePriorityFilter] = useState('ALL');

  // AI-Assisted Risk Heatmap State
  const [riskZones, setRiskZones] = useState([]);
  const [riskSummary, setRiskSummary] = useState({
    totalZones: 0,
    criticalZones: 0,
    highZones: 0,
    mediumZones: 0,
    lowZones: 0,
    highestRiskScore: 0,
  });
  const [selectedRiskZone, setSelectedRiskZone] = useState(null);

  // Modals
  const [selectedJourney, setSelectedJourney] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [selectedShelter, setSelectedShelter] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadDashboardData = async (silent = false) => {
      if (!silent) {
        setLoading(true);
        setIntelligenceLoading(true);
      }
      try {
        const [sos, sh, areas, alt, inc, res, don, dist, bc, intelRes, heatmapRes] = await Promise.all([
          fetchSosRequests(),
          fetchShelters(),
          fetchAffectedAreas(),
          fetchAlerts(),
          fetchIncidents(),
          fetchResources(),
          fetchDonations(),
          fetchDistributions(),
          fetchBlockchainTransactions({ limit: 6 }),
          fetchCrisisIntelligence().catch((err) => {
            if (process.env.NODE_ENV === 'development') {
              console.warn('[CRISIS_INTELLIGENCE_FETCH]', err.response?.status, err.message);
            }
            if (err.response?.status === 401) {
              return { success: false, unauthenticated: true };
            }
            return null;
          }),
          fetchRiskHeatmap().catch((err) => {
            if (process.env.NODE_ENV === 'development') {
              console.warn('[RISK_HEATMAP_FETCH]', err.response?.status, err.message);
            }
            return null;
          }),
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

          if (intelRes && intelRes.success) {
            setIntelligenceList(intelRes.data || []);
            if (intelRes.summary) {
              setIntelligenceSummary(intelRes.summary);
            }
            setIntelligenceError(null);
          } else if (intelRes?.unauthenticated) {
            setIntelligenceError('Sign in to activate prioritized Crisis Intelligence feed.');
          } else if (intelRes === null) {
            setIntelligenceError('Crisis intelligence temporarily unavailable.');
          }

          if (heatmapRes && heatmapRes.success) {
            setRiskZones(heatmapRes.data?.zones || []);
            if (heatmapRes.summary) {
              setRiskSummary(heatmapRes.summary);
            }
          }
        }
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[DASHBOARD_DATA_FETCH]', err.message);
        }
      } finally {
        if (isMounted && !silent) {
          setLoading(false);
          setIntelligenceLoading(false);
        }
      }
    };

    loadDashboardData();

    // Auto-refresh interval (every 30s)
    const interval = setInterval(() => {
      loadDashboardData(true);
    }, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [refreshKey, user]);

  // Sort: CRITICAL -> HIGH -> MEDIUM -> LOW, then highest score first
  const sortedIntelligence = useMemo(() => {
    const priorityWeight = {
      CRITICAL: 4,
      HIGH: 3,
      MEDIUM: 2,
      LOW: 1,
    };

    let items = [...intelligenceList];
    if (activePriorityFilter !== 'ALL') {
      items = items.filter((i) => i.priorityLevel === activePriorityFilter);
    }

    return items.sort((a, b) => {
      const weightA = priorityWeight[a.priorityLevel] || 0;
      const weightB = priorityWeight[b.priorityLevel] || 0;
      if (weightB !== weightA) {
        return weightB - weightA;
      }
      return (b.priorityScore || 0) - (a.priorityScore || 0);
    });
  }, [intelligenceList, activePriorityFilter]);

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
  const threatTier = criticalSosCount > 3 ? t('dashboard.tier1Critical') : criticalSosCount > 0 ? t('dashboard.tier2Elevated') : t('dashboard.tier3Nominal');
  const threatColor = criticalSosCount > 3 ? 'var(--crimson)' : criticalSosCount > 0 ? 'var(--amber)' : 'var(--mint)';

  const handleViewOnMap = (item) => {
    if (!item) return;
    const lat = item.coordinates?.latitude ?? item.latitude;
    const lon = item.coordinates?.longitude ?? item.longitude;
    if (lat == null || lon == null) return;
    setMapFocusTarget({
      latitude: Number(lat),
      longitude: Number(lon),
      id: item.id || item.shelterId || item._id,
      timestamp: Date.now(),
    });
    window.scrollTo({ top: 180, behavior: 'smooth' });
  };

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
              {t('dashboard.crisisOpsCenter')}
            </div>
            <div className="micro-label" style={{ color: threatColor }}>
              {threatTier} • {activeSosCount} {t('dashboard.activeDistressSignals')}
            </div>
          </div>
        </div>

        {/* Tactical Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {isResponderOrAdmin && (
            <div
              style={{
                display: 'inline-flex',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: 'var(--radius-xs)',
                overflow: 'hidden',
                marginRight: '0.5rem',
              }}
            >
              <button
                type="button"
                onClick={() => setDashboardMode('STANDARD')}
                style={{
                  padding: '5px 12px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  background: dashboardMode === 'STANDARD' ? 'var(--cyan)' : 'transparent',
                  color: dashboardMode === 'STANDARD' ? '#040812' : 'var(--text-secondary)',
                }}
              >
                {t('dashboard.tacticalView')}
              </button>
              <button
                type="button"
                onClick={() => setDashboardMode('MISSION_CONTROL')}
                style={{
                  padding: '5px 12px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  border: 'none',
                  cursor: 'pointer',
                  background: dashboardMode === 'MISSION_CONTROL' ? '#ef4444' : 'transparent',
                  color: dashboardMode === 'MISSION_CONTROL' ? '#ffffff' : '#f87171',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>🛡️ {t('dashboard.missionControl')}</span>
              </button>
            </div>
          )}

          {isResponderOrAdmin && (
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(
                  new CustomEvent('disasterchain:ai-assistant-open', {
                    detail: { query: 'Give me an operational situation brief' },
                  })
                );
              }}
              className="btn btn-secondary btn-sm"
              style={{
                borderColor: 'var(--orange-primary)',
                color: 'var(--orange-primary)',
                background: 'rgba(255, 107, 44, 0.1)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 800,
                fontSize: '0.75rem',
                marginRight: '0.5rem',
              }}
              title="Generate AI operational situation briefing"
            >
              <Icon name="bot" size={15} color="var(--orange-primary)" />
              <span>{t('dashboard.operationalBriefing')}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenIncident}
            className="btn btn-secondary btn-sm"
          >
            <Icon name="warning" size={15} color="var(--amber)" />
            <span>{t('dashboard.reportHazard')}</span>
          </button>

          <button
            type="button"
            onClick={onOpenSos}
            className="btn btn-emergency btn-sm"
          >
            <Icon name="alert-circle" size={15} color="#ffffff" />
            <span>{t('dashboard.activeDistressSignals')}</span>
          </button>
        </div>
      </div>

      {/* CENTER WORKSPACE: TACTICAL VIEW OR MISSION CONTROL */}
      {dashboardMode === 'STANDARD' ? (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '400px 1fr 340px',
          gap: '1.25rem',
          alignItems: 'stretch',
        }}
      >
        {/* LEFT RAIL: High-Priority Operational Crisis Intelligence Panel */}
        <div
          className="spatial-panel"
          style={{
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '560px',
            background: 'rgba(10, 15, 26, 0.94)',
            border: '1px solid var(--border-medium)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
            <div>
              <div className="micro-label" style={{ color: 'var(--cyan)' }}>
                {t('dashboard.realTimeCrisisTriage')}
              </div>
              <div style={{ fontWeight: 800, fontSize: '0.98rem', color: '#ffffff' }}>
                {t('dashboard.crisisIntelligenceBrief')} ({intelligenceList.length})
              </div>
            </div>
            <span className="live-beacon-pulse critical" title="Live priority calculations from MongoDB Atlas" />
          </div>

          {/* Compact Live Telemetry Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.4rem 0.65rem',
              background: 'rgba(5, 10, 20, 0.85)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-xs)',
              marginBottom: '0.65rem',
              fontSize: '0.72rem',
              fontWeight: 800,
            }}
          >
            <span style={{ color: '#E53935', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span className="live-beacon-pulse critical" style={{ width: 6, height: 6 }} />
              {t('common.critical').toUpperCase()}: {intelligenceSummary.critical}
            </span>
            <span style={{ color: '#F97316' }}>{t('common.high').toUpperCase()}: {intelligenceSummary.high}</span>
            <span style={{ color: '#F59E0B' }}>{t('common.medium').toUpperCase()}: {intelligenceSummary.medium}</span>
            <span style={{ color: '#FFD166' }}>{t('common.low').toUpperCase()}: {intelligenceSummary.low}</span>
          </div>

          {/* Priority Level Filter Chips */}
          <div
            style={{
              display: 'flex',
              gap: '0.3rem',
              marginBottom: '0.65rem',
              overflowX: 'auto',
              paddingBottom: '2px',
            }}
          >
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((filter) => {
              const isActive = activePriorityFilter === filter;
              const filterLabel = filter === 'ALL'
                ? t('common.all').toUpperCase()
                : filter === 'CRITICAL'
                ? t('common.critical').toUpperCase()
                : filter === 'HIGH'
                ? t('common.high').toUpperCase()
                : filter === 'MEDIUM'
                ? t('common.medium').toUpperCase()
                : t('common.low').toUpperCase();

              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActivePriorityFilter(filter)}
                  style={{
                    padding: '2px 7px',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    borderRadius: '4px',
                    border: '1px solid',
                    borderColor: isActive ? 'var(--cyan)' : 'var(--border-subtle)',
                    background: isActive ? 'rgba(0, 240, 255, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                    color: isActive ? 'var(--cyan)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {filterLabel}
                </button>
              );
            })}
          </div>

          {/* Scrollable Operational Feed */}
          <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '2px' }}>
            {/* Loading State */}
            {intelligenceLoading && (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--cyan)' }}>
                <div className="radar-spinner" style={{ margin: '0 auto 0.75rem auto' }} />
                <div style={{ fontWeight: 700, fontSize: '0.82rem', letterSpacing: '0.08em' }}>
                  ANALYZING LIVE EMERGENCY DATA...
                </div>
              </div>
            )}

            {/* Error State */}
            {intelligenceError && !intelligenceLoading && (
              <div style={{ textAlign: 'center', padding: '1.75rem 1rem', color: 'var(--amber)' }}>
                <Icon name="warning" size={24} color="var(--amber)" />
                <div style={{ fontWeight: 700, fontSize: '0.84rem', marginTop: '0.5rem', color: '#ffffff' }}>
                  {intelligenceError}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  Live emergency services and tactical maps remain operational.
                </div>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="btn btn-secondary btn-sm"
                  style={{ marginTop: '0.65rem', fontSize: '0.72rem', borderColor: 'var(--amber)', color: 'var(--amber)' }}
                >
                  Retry Analysis
                </button>
              </div>
            )}

            {/* Empty State */}
            {!intelligenceLoading && !intelligenceError && sortedIntelligence.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '1.75rem', marginBottom: '0.4rem' }}>🛡️</div>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#ffffff' }}>
                  NO ACTIVE CRISIS INTELLIGENCE
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  All monitored incidents are currently within normal operational thresholds.
                </div>
              </div>
            )}

            {/* Operational Intelligence Cards */}
            {!intelligenceLoading && !intelligenceError && sortedIntelligence.map((item) => {
              const isCritical = item.priorityLevel === 'CRITICAL';
              const isHigh = item.priorityLevel === 'HIGH';
              const isMed = item.priorityLevel === 'MEDIUM';

              const accentBorder = isCritical ? '#E53935' : isHigh ? '#F97316' : isMed ? '#F59E0B' : '#FFD166';
              const accentBg = isCritical
                ? 'rgba(229, 57, 53, 0.1)'
                : isHigh
                ? 'rgba(249, 115, 22, 0.1)'
                : isMed
                ? 'rgba(245, 158, 11, 0.08)'
                : 'rgba(38, 21, 15, 0.85)';

              return (
                <div
                  key={item.id}
                  style={{
                    padding: '0.8rem',
                    background: accentBg,
                    border: `1px solid ${accentBorder}40`,
                    borderLeft: `4px solid ${accentBorder}`,
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.45rem',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {/* Top Header Line */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="micro-label" style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                      CRISIS INTELLIGENCE
                    </span>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        padding: '1px 6px',
                        borderRadius: '3px',
                        background: accentBorder,
                        color: '#000000',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                    >
                      {isCritical && <span className="live-beacon-pulse critical" style={{ width: 5, height: 5 }} />}
                      [{item.priorityLevel}]
                    </span>
                  </div>

                  {/* Title & Location */}
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#ffffff', lineHeight: 1.25 }}>
                      {item.entityType === 'sos' ? `SOS: ${item.emergencyType}` : item.title}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                      📍 {item.location} {item.peopleAffected ? `• 👥 ${item.peopleAffected} affected` : ''}
                    </div>
                  </div>

                  {/* Priority Score Bar */}
                  <div style={{ background: 'rgba(5, 10, 20, 0.7)', padding: '0.35rem 0.5rem', borderRadius: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '0.7rem' }}>
                      <span style={{ color: accentBorder, fontWeight: 700 }}>PRIORITY SCORE</span>
                      <strong style={{ color: '#ffffff' }}>{item.priorityScore} / 100</strong>
                    </div>
                    <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', marginTop: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${item.priorityScore}%`, height: '100%', background: accentBorder }} />
                    </div>
                  </div>

                  {/* WHY: Reasons */}
                  {item.reasons && item.reasons.length > 0 && (
                    <div style={{ fontSize: '0.72rem', color: '#cbd5e1', lineHeight: 1.35 }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.65rem', marginBottom: '2px' }}>
                        WHY:
                      </div>
                      {item.reasons.slice(0, 3).map((r, rIdx) => (
                        <div key={rIdx} style={{ display: 'flex', gap: '4px' }}>
                          <span style={{ color: accentBorder }}>•</span>
                          <span>{r}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* RECOMMENDED ACTION */}
                  {item.recommendedActions && item.recommendedActions.length > 0 && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--cyan)', lineHeight: 1.35, background: 'rgba(0, 240, 255, 0.05)', padding: '0.35rem 0.5rem', borderRadius: '3px' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.65rem', color: 'var(--cyan)', marginBottom: '2px' }}>
                        RECOMMENDED ACTION:
                      </div>
                      <div style={{ color: '#f1f5f9' }}>
                        → {item.recommendedActions[0]}
                      </div>
                    </div>
                  )}

                  {/* RECOMMENDED SAFE HAVEN BADGE */}
                  {item.recommendedShelter && (
                    <div
                      onClick={() => {
                        const shelterMatch = shelters.find(s => s._id === item.recommendedShelter.shelterId || s.name === item.recommendedShelter.name) || item.recommendedShelter;
                        setSelectedShelter(shelterMatch);
                      }}
                      style={{
                        fontSize: '0.72rem',
                        color: 'var(--safe)',
                        background: 'rgba(132, 204, 22, 0.08)',
                        border: '1px solid rgba(132, 204, 22, 0.25)',
                        padding: '0.35rem 0.5rem',
                        borderRadius: '3px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                      }}
                      title="Click to view shelter details"
                    >
                      <span style={{ fontWeight: 700 }}>
                        🏛️ Safe Haven: {item.recommendedShelter.name && item.recommendedShelter.name.length > 20 ? item.recommendedShelter.name.slice(0, 20) + '…' : item.recommendedShelter.name}
                      </span>
                      <span style={{ fontSize: '0.68rem', color: '#A3E635' }}>
                        {item.recommendedShelter.distanceKm}km ({item.recommendedShelter.availableCapacity} beds)
                      </span>
                    </div>
                  )}

                  {/* Operational Buttons */}
                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.2rem' }}>
                    <button
                      type="button"
                      onClick={() => handleViewOnMap(item)}
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1, padding: '3px 6px', fontSize: '0.68rem', justifyContent: 'center' }}
                    >
                      <Icon name="map-pin" size={12} color="var(--orange-primary)" />
                      <span>VIEW ON MAP</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedIntelligence(item)}
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1, padding: '3px 6px', fontSize: '0.68rem', justifyContent: 'center' }}
                    >
                      <span>VIEW DETAILS</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CENTER VISUAL CENTERPIECE: 2D Disaster Command Map */}
        <div style={{ minHeight: '560px', display: 'flex', flexDirection: 'column' }}>
          <DisasterCommandMap
            sosRequests={sosList}
            affectedAreas={affectedAreas}
            shelters={shelters}
            incidents={incidents}
            riskZones={riskZones}
            intelligenceList={intelligenceList}
            focusTarget={mapFocusTarget}
            isLoading={loading}
            onOpenSos={onOpenSos}
            onOpenIncident={onOpenIncident}
            onOpenShelter={(sh) => setSelectedShelter(sh)}
          />
        </div>

        {/* RIGHT RAIL: Situation Intelligence & Priority Alerts */}
        <div
          className="spatial-panel"
          style={{
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '560px',
            background: 'rgba(10, 15, 26, 0.94)',
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
      ) : (
        /* ========================================================================= */
        /* PHASE 8: MISSION CONTROL — RESPONDER COMMAND CENTER                     */
        /* ========================================================================= */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Mission Control Header Banner */}
          <div
            style={{
              padding: '1rem 1.25rem',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span className="live-beacon-pulse critical" />
              <div>
                <strong style={{ color: '#ffffff', fontSize: '1rem', letterSpacing: '0.04em' }}>
                  OPERATIONAL MISSION CONTROL ACTIVE
                </strong>
                <div style={{ fontSize: '0.75rem', color: '#fca5a5' }}>
                  Restricted to authorized responders & incident commanders ({user?.role?.toUpperCase()})
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
              <span className="badge badge-critical">Active SOS: {sosList.filter((s) => s.status !== 'Resolved').length}</span>
              <span className="badge badge-warning">Incidents: {incidents.filter((i) => i.status !== 'Resolved').length}</span>
              <span className="badge badge-info">Risk Zones: {riskZones.length}</span>
            </div>
          </div>

          {/* 8 Operational Panels Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
            {/* 1. CRITICAL PRIORITIES */}
            <div className="spatial-panel" style={{ background: 'rgba(10, 16, 28, 0.96)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <strong style={{ color: '#ff4d6d', fontSize: '0.88rem' }}>1. CRITICAL PRIORITIES (TRIAGE)</strong>
                <span className="badge badge-critical" style={{ fontSize: '0.65rem' }}>{intelligenceSummary.critical} Critical</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '280px', overflowY: 'auto' }}>
                {intelligenceList.filter((i) => i.priorityLevel === 'CRITICAL' || i.priorityLevel === 'HIGH').slice(0, 5).map((item) => (
                  <div key={item.id} style={{ background: 'rgba(239, 68, 68, 0.08)', padding: '0.5rem', borderRadius: 4, borderLeft: '3px solid #ff0044' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                      <strong style={{ color: '#fff' }}>{item.title}</strong>
                      <span style={{ color: '#ff0044', fontWeight: 800 }}>[{item.priorityScore}]</span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>📍 {item.location}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. ACTIVE SOS DISPATCH */}
            <div className="spatial-panel" style={{ background: 'rgba(10, 16, 28, 0.96)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <strong style={{ color: '#ff4d6d', fontSize: '0.88rem' }}>2. ACTIVE SOS DISTRESS CALLS</strong>
                <Link to="/sos" style={{ fontSize: '0.72rem', color: 'var(--cyan)' }}>Full Feed →</Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '280px', overflowY: 'auto' }}>
                {sosList.filter((s) => s.status !== 'Resolved').slice(0, 5).map((sos) => (
                  <div key={sos._id} style={{ background: 'rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: 4, borderLeft: '3px solid #ef4444' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                      <strong style={{ color: '#fff' }}>{sos.name} ({sos.emergencyType})</strong>
                      <span className="badge badge-critical" style={{ fontSize: '0.62rem' }}>{sos.status}</span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>📍 {sos.location} • 📞 {sos.contact || 'Direct Dispatch'}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. TOP RISK ZONES */}
            <div className="spatial-panel" style={{ background: 'rgba(10, 16, 28, 0.96)', border: '1px solid rgba(249, 115, 22, 0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <strong style={{ color: '#f97316', fontSize: '0.88rem' }}>3. HIGH-RISK CONVERGENCE ZONES</strong>
                <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>{riskZones.length} Zones</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '280px', overflowY: 'auto' }}>
                {riskZones.slice(0, 5).map((zone) => (
                  <div key={zone.id} style={{ background: 'rgba(249, 115, 22, 0.08)', padding: '0.5rem', borderRadius: 4, borderLeft: '3px solid #f97316' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                      <strong style={{ color: '#fff' }}>{zone.dominantHazard}</strong>
                      <span style={{ color: '#f97316', fontWeight: 800 }}>{zone.riskLevel} ({zone.riskScore})</span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Centroid: {zone.latitude.toFixed(2)}, {zone.longitude.toFixed(2)} • {zone.eventCount} events</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. SHELTER CAPACITY PRESSURE */}
            <div className="spatial-panel" style={{ background: 'rgba(28, 17, 13, 0.96)', border: '1px solid rgba(132, 204, 22, 0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <strong style={{ color: 'var(--safe)', fontSize: '0.88rem' }}>4. SHELTER CAPACITY LOAD</strong>
                <Link to="/shelters" style={{ fontSize: '0.72rem', color: 'var(--primary)' }}>Manage →</Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '280px', overflowY: 'auto' }}>
                {shelters.slice(0, 5).map((sh) => {
                  const occ = sh.capacity > 0 ? Math.round(((sh.occupancy || 0) / sh.capacity) * 100) : 0;
                  const isStrained = occ >= 80 || sh.status === 'Full';
                  return (
                    <div
                      key={sh._id}
                      onClick={() => setSelectedShelter(sh)}
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        padding: '0.5rem',
                        borderRadius: 4,
                        borderLeft: `3px solid ${isStrained ? '#E53935' : '#84CC16'}`,
                        cursor: 'pointer',
                        transition: 'background 0.2s ease',
                      }}
                      title="Click to view shelter details"
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                        <strong style={{ color: '#fff' }}>{sh.name}</strong>
                        <span style={{ color: isStrained ? '#E53935' : '#84CC16', fontWeight: 700 }}>{occ}% ({sh.capacity - (sh.occupancy || 0)} open)</span>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>📍 {sh.address}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 5. ACTIVE INCIDENTS */}
            <div className="spatial-panel" style={{ background: 'rgba(28, 17, 13, 0.96)', border: '1px solid var(--border-medium)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <strong style={{ color: '#ffffff', fontSize: '0.88rem' }}>5. UNRESOLVED INCIDENTS</strong>
                <span className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>{incidents.filter((i) => i.status !== 'Resolved').length} Active</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '280px', overflowY: 'auto' }}>
                {incidents.filter((i) => i.status !== 'Resolved').slice(0, 5).map((inc) => (
                  <div key={inc._id} style={{ background: 'rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                      <strong style={{ color: '#fff' }}>{inc.title}</strong>
                      <span className="badge badge-warning" style={{ fontSize: '0.62rem' }}>{inc.severity}</span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>📍 {inc.location} • Status: {inc.status}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 6. BROADCAST ALERTS */}
            <div className="spatial-panel" style={{ background: 'rgba(10, 16, 28, 0.96)', border: '1px solid var(--border-medium)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <strong style={{ color: '#ffffff', fontSize: '0.88rem' }}>6. BROADCAST BULLETINS</strong>
                <Link to="/alerts" style={{ fontSize: '0.72rem', color: 'var(--cyan)' }}>All Alerts →</Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '280px', overflowY: 'auto' }}>
                {alerts.slice(0, 5).map((alt) => (
                  <div key={alt._id} style={{ background: 'rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: 4, borderLeft: '3px solid var(--amber)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                      <strong style={{ color: '#fff' }}>{alt.title}</strong>
                      <span className="micro-label">{alt.type}</span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{alt.message?.slice(0, 70)}...</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 7. AVAILABLE RESOURCES */}
            <div className="spatial-panel" style={{ background: 'rgba(10, 16, 28, 0.96)', border: '1px solid var(--border-medium)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <strong style={{ color: '#10b981', fontSize: '0.88rem' }}>7. FIELD RESOURCES & STOCKPILES</strong>
                <Link to="/resources" style={{ fontSize: '0.72rem', color: 'var(--cyan)' }}>Stockpiles →</Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '280px', overflowY: 'auto' }}>
                {resources.slice(0, 5).map((res) => (
                  <div key={res._id} style={{ background: 'rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                      <strong style={{ color: '#fff' }}>{res.name}</strong>
                      <span style={{ color: '#10b981', fontWeight: 700 }}>{res.quantity} {res.unit}</span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Category: {res.category} • {res.location}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 8. RECENT OPERATIONAL CHANGES */}
            <div className="spatial-panel" style={{ background: 'rgba(10, 16, 28, 0.96)', border: '1px solid var(--border-medium)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <strong style={{ color: '#ffffff', fontSize: '0.88rem' }}>8. AUDIT & DISPATCH TELEMETRY</strong>
                <Link to="/transparency" style={{ fontSize: '0.72rem', color: 'var(--cyan)' }}>Ledger →</Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '280px', overflowY: 'auto' }}>
                {blockchainRecords.slice(0, 5).map((bc) => (
                  <div key={bc._id} style={{ background: 'rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: 4, fontFamily: 'var(--font-mono)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                      <span style={{ color: 'var(--cyan)' }}>BLOCK #{bc.blockIndex || bc._id?.slice(-4)}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>{new Date(bc.timestamp || Date.now()).toLocaleTimeString()}</span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{bc.action || 'Operational State Attested'}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PHASE 7: LIVE RISK INTELLIGENCE & HEATMAP SECTORS                        */}
      {/* ========================================================================= */}
      <div
        className="spatial-panel"
        style={{
          marginTop: '1.5rem',
          background: 'rgba(8, 13, 24, 0.94)',
          border: '1px solid var(--border-medium)',
          padding: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div className="micro-label" style={{ color: '#ff0044', fontWeight: 800 }}>
              AI-ASSISTED RISK INTELLIGENCE
            </div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
              OPERATIONAL RISK HEATMAP SECTORS ({riskZones.length} Active Zones)
            </h3>
          </div>

          {/* Telemetry Summary Counters */}
          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
            <div style={{ background: 'rgba(255, 0, 68, 0.15)', border: '1px solid rgba(255, 0, 68, 0.35)', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>
              <span style={{ color: '#ff0044', fontWeight: 800 }}>CRITICAL: </span>
              <strong style={{ color: '#ffffff' }}>{riskSummary.criticalZones}</strong>
            </div>
            <div style={{ background: 'rgba(249, 115, 22, 0.15)', border: '1px solid rgba(249, 115, 22, 0.35)', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>
              <span style={{ color: '#f97316', fontWeight: 800 }}>HIGH: </span>
              <strong style={{ color: '#ffffff' }}>{riskSummary.highZones}</strong>
            </div>
            <div style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.35)', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>
              <span style={{ color: '#F59E0B', fontWeight: 800 }}>MEDIUM: </span>
              <strong style={{ color: '#ffffff' }}>{riskSummary.mediumZones}</strong>
            </div>
            <div style={{ background: 'rgba(255, 209, 102, 0.15)', border: '1px solid rgba(255, 209, 102, 0.35)', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>
              <span style={{ color: '#FFD166', fontWeight: 800 }}>LOW: </span>
              <strong style={{ color: '#ffffff' }}>{riskSummary.lowZones}</strong>
            </div>
          </div>
        </div>

        {/* Top Risk Zones Grid */}
        {riskZones.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No active emergency convergence zones detected. All monitored sectors nominal.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
            {riskZones.slice(0, 6).map((zone) => {
              const isCrit = zone.riskLevel === 'CRITICAL';
              const isHi = zone.riskLevel === 'HIGH';
              const color = isCrit ? '#E53935' : isHi ? '#F97316' : zone.riskLevel === 'MEDIUM' ? '#F59E0B' : '#FFD166';

              return (
                <div
                  key={zone.id}
                  style={{
                    background: 'rgba(28, 17, 13, 0.92)',
                    border: `1px solid ${color}44`,
                    borderLeft: `4px solid ${color}`,
                    borderRadius: 'var(--radius-sm)',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.65rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: `${color}22`,
                        color: color,
                        border: `1px solid ${color}`,
                      }}
                    >
                      ⚡ {zone.riskLevel} [{zone.riskScore}/100]
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      ~{zone.radiusKm} km radius
                    </span>
                  </div>

                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.96rem', color: '#ffffff' }}>
                      {zone.dominantHazard} CONVERGENCE SECTOR
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                      📍 Centroid: {zone.latitude.toFixed(3)}, {zone.longitude.toFixed(3)}
                    </div>
                  </div>

                  {/* Micro Metric Badges */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.35rem', textAlign: 'center' }}>
                    <div style={{ background: 'rgba(229, 57, 53, 0.1)', padding: '0.3rem', borderRadius: 4 }}>
                      <div style={{ color: '#FF4D45', fontWeight: 800, fontSize: '0.85rem' }}>{zone.activeSOSCount}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>ACTIVE SOS</div>
                    </div>
                    <div style={{ background: 'rgba(249, 115, 22, 0.1)', padding: '0.3rem', borderRadius: 4 }}>
                      <div style={{ color: '#F97316', fontWeight: 800, fontSize: '0.85rem' }}>{zone.activeIncidentCount}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>INCIDENTS</div>
                    </div>
                    <div style={{ background: 'rgba(132, 204, 22, 0.1)', padding: '0.3rem', borderRadius: 4 }}>
                      <div style={{ color: '#84CC16', fontWeight: 800, fontSize: '0.85rem' }}>{zone.nearbyShelterStrain}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>SHELTER LOAD</div>
                    </div>
                  </div>

                  {/* Key Drivers */}
                  {zone.reasons && zone.reasons.length > 0 && (
                    <div style={{ fontSize: '0.73rem', color: '#cbd5e1', lineHeight: 1.35 }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.65rem', marginBottom: '2px' }}>
                        PRIMARY RISK FACTORS:
                      </div>
                      {zone.reasons.slice(0, 2).map((r, rI) => (
                        <div key={rI} style={{ display: 'flex', gap: '4px' }}>
                          <span style={{ color }}>•</span>
                          <span>{r}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Phase 14: Recommended Safe Haven for Risk Zone */}
                  {zone.nearestShelter && (
                    <div
                      style={{
                        background: 'rgba(16, 185, 129, 0.08)',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                        borderRadius: 'var(--radius-xs)',
                        padding: '0.45rem 0.6rem',
                        fontSize: '0.72rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <span style={{ color: '#10b981', fontWeight: 700 }}>🏛️ Recommended Haven: </span>
                        <span style={{ color: '#ffffff' }}>{zone.nearestShelter.name}</span>
                      </div>
                      <span style={{ color: '#6ee7b7', fontWeight: 700 }}>
                        {zone.nearestShelter.availableCapacity} beds open
                      </span>
                    </div>
                  )}

                  {/* Operational Action Buttons */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', marginTop: '0.2rem' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setGlobeFocusTarget({ latitude: zone.latitude, longitude: zone.longitude, id: zone.id });
                        setViewCenterMode('3D');
                        window.scrollTo({ top: 120, behavior: 'smooth' });
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.7rem', padding: '0.35rem', justifyContent: 'center' }}
                    >
                      <Icon name="map-pin" size={13} color="var(--cyan)" />
                      <span>VIEW ON GLOBE</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setViewCenterMode('MAP');
                        window.scrollTo({ top: 120, behavior: 'smooth' });
                      }}
                      className="btn btn-primary btn-sm"
                      style={{ fontSize: '0.7rem', padding: '0.35rem', justifyContent: 'center' }}
                    >
                      <span>VIEW ON MAP</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 1280px) {
          div[style*="gridTemplateColumns: 400px 1fr 340px"],
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
            <span className="micro-label">{t('dashboard.activeDistressSignals')}</span>
            <span className="live-beacon-pulse critical" />
          </div>
          <div className="telemetry-num crimson">
            {activeSosCount}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            <span>{t('common.critical')}: {criticalSosCount}</span>
            <Link to="/sos" style={{ color: 'var(--cyan)' }}>{t('common.viewAll')} →</Link>
          </div>
        </div>

        {/* 2. Shelter Capacity */}
        <div className="telemetry-widget">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <span className="micro-label">{t('dashboard.openBeds').toUpperCase()}</span>
            <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>
              {shelters.length} {t('nav.reliefShelters')}
            </span>
          </div>
          <div className="telemetry-num cyan">
            {availableBeds.toLocaleString()}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            <span>{t('shelters.totalCapacity')}: {totalShelterCapacity.toLocaleString()}</span>
            <Link to="/shelters" style={{ color: 'var(--cyan)' }}>{t('common.viewDetails')} →</Link>
          </div>
        </div>

        {/* 3. Hazard Impact Zones */}
        <div className="telemetry-widget">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <span className="micro-label">{t('affectedAreas.monitoredZones').toUpperCase()}</span>
            <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>
              {affectedAreas.length} {t('common.active')}
            </span>
          </div>
          <div className="telemetry-num amber">
            {totalAffectedPeople.toLocaleString()}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            <span>{t('dashboard.affectedPopulation')}</span>
            <Link to="/affected-areas" style={{ color: 'var(--cyan)' }}>{t('common.viewMap')} →</Link>
          </div>
        </div>

        {/* 4. Cryptographic Blockchain Ledger */}
        <div className="telemetry-widget">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <span className="micro-label">{t('transparency.transparencyTitle').toUpperCase()}</span>
            <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
              {t('common.verified')}
            </span>
          </div>
          <div className="telemetry-num mint">
            {blockchainRecords.length}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            <span>{t('transparency.totalBlocks')}</span>
            <Link to="/transparency" style={{ color: 'var(--cyan)' }}>{t('dashboard.viewFullLedger')} →</Link>
          </div>
        </div>
      </div>

      {/* Modals for Resource Journey, Blockchain Receipt, Crisis Intelligence, and Shelter Detail */}
      {selectedJourney && (
        <ResourceJourneyModal
          isOpen={Boolean(selectedJourney)}
          resourceData={selectedJourney}
          item={selectedJourney}
          onClose={() => setSelectedJourney(null)}
        />
      )}

      {selectedReceipt && (
        <BlockchainReceiptModal
          isOpen={Boolean(selectedReceipt)}
          record={selectedReceipt}
          item={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}

      {selectedIntelligence && (
        <CrisisIntelligenceModal
          isOpen={Boolean(selectedIntelligence)}
          item={selectedIntelligence}
          onClose={() => setSelectedIntelligence(null)}
          onFocusGlobe={handleViewOnGlobe}
        />
      )}

      {selectedShelter && (
        <ShelterDetailModal
          isOpen={Boolean(selectedShelter)}
          shelter={selectedShelter}
          item={selectedShelter}
          onClose={() => setSelectedShelter(null)}
        />
      )}
    </div>
  );
};

export default EmergencyDashboard;
