/**
 * AI-Assisted Explainable Crisis Risk Engine & Geographic Heatmap Service
 *
 * Deterministically evaluates live operational records from MongoDB:
 * - Active SOS signals
 * - Reported Incidents
 * - Affected Hazard Areas
 * - Broadcast Emergency Alerts
 * - Shelter Capacity Strain
 *
 * Clusters events geographically and produces normalized 0–100 risk zones
 * with transparent scoring and actionable operational recommendations.
 */

const EARTH_RADIUS_KM = 6371;

/**
 * Calculates Haversine distance in kilometers between two coordinates
 */
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
    return null;
  }
  const toRad = (angle) => (angle * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_RADIUS_KM * c * 100) / 100;
}

/**
 * Standardizes event coordinates and urgency weights for clustering
 */
function normalizeEventItem(item, type) {
  const lat = Number(item.latitude);
  const lon = Number(item.longitude);

  if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return null;
  }

  let weight = 1;
  let severity = (item.severity || 'Medium').toLowerCase();
  let hazardType = (item.emergencyType || item.type || item.disasterType || 'General Hazard').toUpperCase();

  if (type === 'sos') {
    weight = severity === 'critical' ? 4 : severity === 'high' ? 3 : 2;
  } else if (type === 'incident') {
    weight = severity === 'critical' ? 3.5 : severity === 'high' ? 2.5 : 1.5;
  } else if (type === 'affectedArea') {
    weight = severity === 'critical' ? 3 : severity === 'high' ? 2 : 1;
  } else if (type === 'alert') {
    weight = 1.5;
  }

  return {
    id: item.requestId || item.incidentId || item._id?.toString() || `${type}-${Math.random().toString(36).substr(2, 6)}`,
    type,
    latitude: lat,
    longitude: lon,
    weight,
    severity,
    hazardType,
    peopleAffected: Number(item.peopleAffected || item.affectedPeople || 1),
    status: item.status || 'Active',
    raw: item,
  };
}

/**
 * Clusters geographically close events into operational risk zones (deterministic greedy centroid clustering)
 * @param {Array} events - Normalized event items
 * @param {number} maxClusterDistanceKm - Distance threshold in km (default 4.0 km)
 * @returns {Array} Array of raw clusters
 */
function clusterEvents(events, maxClusterDistanceKm = 4.0) {
  if (!Array.isArray(events) || events.length === 0) {
    return [];
  }

  // Sort events so highest-weight / highest-urgency events seed cluster centers first
  const unassigned = [...events].sort((a, b) => b.weight - a.weight);
  const clusters = [];

  while (unassigned.length > 0) {
    const seed = unassigned.shift();
    const memberEvents = [seed];

    // Find all unassigned events within threshold distance of seed
    let i = 0;
    while (i < unassigned.length) {
      const candidate = unassigned[i];
      const dist = calculateDistanceKm(seed.latitude, seed.longitude, candidate.latitude, candidate.longitude);
      if (dist != null && dist <= maxClusterDistanceKm) {
        memberEvents.push(candidate);
        unassigned.splice(i, 1);
      } else {
        i++;
      }
    }

    // Compute weighted centroid coordinates
    let totalWeight = 0;
    let sumLat = 0;
    let sumLon = 0;

    for (const m of memberEvents) {
      totalWeight += m.weight;
      sumLat += m.latitude * m.weight;
      sumLon += m.longitude * m.weight;
    }

    const centerLat = Math.round((sumLat / totalWeight) * 10000) / 10000;
    const centerLon = Math.round((sumLon / totalWeight) * 10000) / 10000;

    // Compute cluster radius (maximum distance from centroid + baseline buffer)
    let maxDist = 0;
    for (const m of memberEvents) {
      const d = calculateDistanceKm(centerLat, centerLon, m.latitude, m.longitude);
      if (d != null && d > maxDist) {
        maxDist = d;
      }
    }

    // Minimum visual radius is 1.2 km; maximum bounded for reasonable zone representation
    const radiusKm = Math.max(1.2, Math.round((maxDist + 0.6) * 10) / 10);

    clusters.push({
      centerLat,
      centerLon,
      radiusKm,
      members: memberEvents,
    });
  }

  return clusters;
}

/**
 * Calculates deterministic explainable 0–100 risk score and zone telemetry
 */
function evaluateClusterRisk(cluster, shelters = []) {
  const { centerLat, centerLon, radiusKm, members } = cluster;

  const reasons = [];
  const recommendedActions = [];
  let score = 0;

  // Event Category Breakdown
  const sosEvents = members.filter((m) => m.type === 'sos');
  const incidentEvents = members.filter((m) => m.type === 'incident');
  const areaEvents = members.filter((m) => m.type === 'affectedArea');
  const alertEvents = members.filter((m) => m.type === 'alert');

  // Dominant Hazard Detection
  const hazardCounts = {};
  for (const m of members) {
    const h = m.hazardType || 'GENERAL';
    hazardCounts[h] = (hazardCounts[h] || 0) + 1;
  }
  let dominantHazard = 'GENERAL HAZARD';
  let maxHazardCount = 0;
  for (const [hz, cnt] of Object.entries(hazardCounts)) {
    if (cnt > maxHazardCount) {
      maxHazardCount = cnt;
      dominantHazard = hz;
    }
  }

  // -------------------------------------------------------------
  // Factor 1: Life-Safety & SOS Urgency (Max 40 pts)
  // -------------------------------------------------------------
  let sosScore = 0;
  let criticalSosCount = 0;
  let highSosCount = 0;

  for (const s of sosEvents) {
    if (s.severity === 'critical') {
      sosScore += 20;
      criticalSosCount++;
    } else if (s.severity === 'high') {
      sosScore += 15;
      highSosCount++;
    } else {
      sosScore += 8;
    }
  }

  sosScore = Math.min(40, sosScore);
  score += sosScore;

  if (criticalSosCount > 0) {
    reasons.push(`${criticalSosCount} Critical active SOS distress signal(s) in zone (+${Math.min(40, criticalSosCount * 20)} pts)`);
  } else if (highSosCount > 0) {
    reasons.push(`${highSosCount} High-urgency SOS distress call(s) active (+${Math.min(30, highSosCount * 15)} pts)`);
  } else if (sosEvents.length > 0) {
    reasons.push(`${sosEvents.length} active SOS emergency request(s) recorded in perimeter (+${sosScore} pts)`);
  }

  // -------------------------------------------------------------
  // Factor 2: Incident Severity & Operational Hazard (Max 30 pts)
  // -------------------------------------------------------------
  let incidentScore = 0;
  let criticalIncidents = 0;
  let highIncidents = 0;

  for (const inc of incidentEvents) {
    if (inc.severity === 'critical') {
      incidentScore += 20;
      criticalIncidents++;
    } else if (inc.severity === 'high') {
      incidentScore += 15;
      highIncidents++;
    } else {
      incidentScore += 8;
    }
  }

  incidentScore = Math.min(30, incidentScore);
  score += incidentScore;

  if (criticalIncidents > 0) {
    reasons.push(`${criticalIncidents} Critical incident hazard(s) confirmed (+${Math.min(30, criticalIncidents * 20)} pts)`);
  } else if (highIncidents > 0) {
    reasons.push(`${highIncidents} High-severity operational incident(s) reported (+${Math.min(20, highIncidents * 15)} pts)`);
  } else if (incidentEvents.length > 0) {
    reasons.push(`${incidentEvents.length} active incident report(s) within zone (+${incidentScore} pts)`);
  }

  // -------------------------------------------------------------
  // Factor 3: Affected Area Severity & Population Impact (Max 25 pts)
  // -------------------------------------------------------------
  let areaScore = 0;
  let totalPeopleInPerimeter = 0;

  for (const m of members) {
    totalPeopleInPerimeter += m.peopleAffected || 0;
  }

  if (areaEvents.length > 0) {
    const hasCriticalArea = areaEvents.some((a) => a.severity === 'critical');
    const hasHighArea = areaEvents.some((a) => a.severity === 'high');

    if (hasCriticalArea) {
      areaScore += 15;
      reasons.push('Coincides with declared Critical disaster impact zone (+15 pts)');
    } else if (hasHighArea) {
      areaScore += 10;
      reasons.push('Coincides with High-risk hazard affected area (+10 pts)');
    } else {
      areaScore += 5;
      reasons.push('Encompasses monitored affected area perimeter (+5 pts)');
    }
  }

  if (totalPeopleInPerimeter >= 500) {
    areaScore += 10;
    reasons.push(`Dense civilian exposure: ~${totalPeopleInPerimeter} people in risk radius (+10 pts)`);
  } else if (totalPeopleInPerimeter > 10) {
    areaScore += 5;
    reasons.push(`Civilian exposure: ${totalPeopleInPerimeter} people affected (+5 pts)`);
  }

  areaScore = Math.min(25, areaScore);
  score += areaScore;

  // -------------------------------------------------------------
  // Factor 4: Broadcast Emergency Alerts in Zone (Max 15 pts)
  // -------------------------------------------------------------
  if (alertEvents.length > 0) {
    const hasUrgentAlert = alertEvents.some(
      (alt) =>
        alt.raw?.severity === 'Danger' ||
        alt.raw?.severity === 'Emergency' ||
        alt.raw?.type === 'Evacuation'
    );

    if (hasUrgentAlert) {
      score += 15;
      reasons.push('Active Emergency / Evacuation broadcast active in sector (+15 pts)');
    } else {
      score += 8;
      reasons.push(`${alertEvents.length} civil defense advisory alert(s) in sector (+8 pts)`);
    }
  }

  // -------------------------------------------------------------
  // Factor 5: Geographic Emergency Density (Max 20 pts)
  // -------------------------------------------------------------
  let densityScore = 0;
  if (members.length >= 10) {
    densityScore = 20;
    reasons.push(`Extreme emergency density: ${members.length} incidents in perimeter (+20 pts)`);
  } else if (members.length >= 5) {
    densityScore = 15;
    reasons.push(`High incident clustering: ${members.length} events converging in zone (+15 pts)`);
  } else if (members.length >= 3) {
    densityScore = 10;
    reasons.push(`Multi-event convergence: ${members.length} emergency signals (+10 pts)`);
  } else if (members.length >= 2) {
    densityScore = 5;
    reasons.push(`Compound hazard: ${members.length} events co-located in perimeter (+5 pts)`);
  }
  score += densityScore;

  // -------------------------------------------------------------
  // Factor 6: Regional Shelter Pressure / Strain (Max 15 pts)
  // -------------------------------------------------------------
  let shelterStrain = 'Nominal';
  let nearestShelterData = null;
  let minShelterDist = Infinity;

  for (const sh of shelters) {
    const d = calculateDistanceKm(centerLat, centerLon, sh.latitude, sh.longitude);
    if (d != null && d < minShelterDist) {
      minShelterDist = d;
      nearestShelterData = {
        name: sh.name,
        distanceKm: d,
        capacity: sh.capacity || 0,
        occupancy: sh.occupancy || 0,
        availableCapacity: Math.max(0, (sh.capacity || 0) - (sh.occupancy || 0)),
        status: sh.status || 'Open',
      };
    }
  }

  if (nearestShelterData) {
    const occRate =
      nearestShelterData.capacity > 0
        ? Math.round((nearestShelterData.occupancy / nearestShelterData.capacity) * 100)
        : 100;

    const isFullOrClosed =
      nearestShelterData.status === 'Full' ||
      nearestShelterData.status === 'Temporarily Closed' ||
      nearestShelterData.availableCapacity <= 0;

    if (isFullOrClosed || occRate >= 85) {
      shelterStrain = 'High';
      score += 15;
      reasons.push(
        `Nearby shelter "${nearestShelterData.name}" is under high strain (${occRate}% full) (+15 pts)`
      );
      recommendedActions.push(
        `Reroute evacuees to secondary safe havens; ${nearestShelterData.name} has exhausted bed headroom`
      );
    } else if (occRate >= 65) {
      shelterStrain = 'Moderate';
      score += 8;
      reasons.push(
        `Nearby shelter "${nearestShelterData.name}" has moderate occupancy load (${occRate}%) (+8 pts)`
      );
    } else {
      shelterStrain = 'Nominal';
      reasons.push(
        `Nearby shelter "${nearestShelterData.name}" has open intake capacity (${nearestShelterData.availableCapacity} beds)`
      );
    }
  }

  // Score Normalization: 0–100
  const riskScore = Math.min(100, Math.max(0, Math.round(score)));

  // Risk Level Classification
  let riskLevel = 'LOW';
  if (
    riskScore >= 80 ||
    criticalSosCount >= 2 ||
    (criticalSosCount >= 1 && (criticalIncidents >= 1 || areaEvents.length > 0 || totalPeopleInPerimeter >= 500))
  ) {
    riskLevel = 'CRITICAL';
  } else if (riskScore >= 60 || highSosCount >= 2 || (highSosCount >= 1 && incidentEvents.length > 0)) {
    riskLevel = 'HIGH';
  } else if (riskScore >= 40) {
    riskLevel = 'MEDIUM';
  } else {
    riskLevel = 'LOW';
  }

  // Formulate Rule-Based Smart Action Recommendations
  if (riskLevel === 'CRITICAL') {
    recommendedActions.unshift('Prioritize life-safety rescue teams and verify all critical SOS distress coordinates immediately');
    recommendedActions.push(`Establish sector isolation boundary within ${radiusKm} km radius around ${centerLat}, ${centerLon}`);
  } else if (riskLevel === 'HIGH') {
    recommendedActions.unshift(`Dispatch specialized ${dominantHazard} mitigation teams and inspect adjacent public corridors`);
    recommendedActions.push('Alert nearby medical outposts and prepare emergency intake bays');
  } else if (riskLevel === 'MEDIUM') {
    recommendedActions.unshift('Monitor hazard perimeter and deploy field volunteer survey teams');
  } else {
    recommendedActions.unshift('Maintain standard sector observation; no immediate containment required');
  }

  const zoneId = `ZONE-${centerLat.toFixed(3).replace('.', '')}-${centerLon.toFixed(3).replace('.', '')}`;

  return {
    id: zoneId,
    latitude: centerLat,
    longitude: centerLon,
    radiusKm,
    riskScore,
    riskLevel,
    dominantHazard,
    eventCount: members.length,
    activeSOSCount: sosEvents.length,
    activeIncidentCount: incidentEvents.length,
    affectedAreaCount: areaEvents.length,
    alertCount: alertEvents.length,
    totalPeopleAffected: totalPeopleInPerimeter,
    nearbyShelterStrain: shelterStrain,
    nearestShelter: nearestShelterData,
    reasons,
    recommendedActions,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Builds the complete deterministic Risk Heatmap using live MongoDB data
 *
 * @param {Object} data - Live operational datasets
 * @param {Array} data.sosRequests
 * @param {Array} data.incidents
 * @param {Array} data.affectedAreas
 * @param {Array} data.alerts
 * @param {Array} data.shelters
 * @param {Object} filters - Query filtering options
 * @returns {Array} List of evaluated risk zones sorted descending by riskScore
 */
function buildRiskHeatmap(data = {}, filters = {}) {
  const {
    sosRequests = [],
    incidents = [],
    affectedAreas = [],
    alerts = [],
    shelters = [],
  } = data;

  const rawEvents = [];

  // 1. Ingest active SOS signals
  for (const s of sosRequests) {
    if (s.status !== 'Resolved' && s.status !== 'Cancelled') {
      const norm = normalizeEventItem(s, 'sos');
      if (norm) rawEvents.push(norm);
    }
  }

  // 2. Ingest active Incidents
  for (const inc of incidents) {
    if (inc.status !== 'Resolved' && inc.status !== 'Rejected') {
      const norm = normalizeEventItem(inc, 'incident');
      if (norm) rawEvents.push(norm);
    }
  }

  // 3. Ingest Affected Areas
  for (const area of affectedAreas) {
    const norm = normalizeEventItem(area, 'affectedArea');
    if (norm) rawEvents.push(norm);
  }

  // 4. Ingest Alerts
  for (const alt of alerts) {
    if (alt.status !== 'Expired') {
      const norm = normalizeEventItem(alt, 'alert');
      if (norm) rawEvents.push(norm);
    }
  }

  if (rawEvents.length === 0) {
    return [];
  }

  // Cluster events geographically
  const clusters = clusterEvents(rawEvents, 4.0);

  // Evaluate risk per cluster
  const evaluatedZones = clusters.map((c) => evaluateClusterRisk(c, shelters));

  // Apply filters
  let filtered = evaluatedZones;

  if (filters.riskLevel) {
    const targetLevel = filters.riskLevel.toUpperCase();
    filtered = filtered.filter((z) => z.riskLevel === targetLevel);
  }

  if (filters.minScore != null && !isNaN(Number(filters.minScore))) {
    const minS = Number(filters.minScore);
    filtered = filtered.filter((z) => z.riskScore >= minS);
  }

  if (filters.latitude != null && filters.longitude != null) {
    const qLat = parseFloat(filters.latitude);
    const qLon = parseFloat(filters.longitude);
    const qRad = parseFloat(filters.radiusKm || 50);

    if (!isNaN(qLat) && !isNaN(qLon) && !isNaN(qRad)) {
      filtered = filtered.filter((z) => {
        const d = calculateDistanceKm(qLat, qLon, z.latitude, z.longitude);
        return d != null && d <= qRad;
      });
    }
  }

  // Sort descending by riskScore (highest risk first), then by event count
  filtered.sort((a, b) => {
    if (b.riskScore !== a.riskScore) {
      return b.riskScore - a.riskScore;
    }
    return b.eventCount - a.eventCount;
  });

  if (filters.limit && !isNaN(parseInt(filters.limit, 10))) {
    const lim = Math.max(1, parseInt(filters.limit, 10));
    filtered = filtered.slice(0, lim);
  }

  return filtered;
}

/**
 * Finds the nearest risk zone to a coordinate and returns riskContext
 */
function getRiskContextForCoordinates(latitude, longitude, riskZones = []) {
  if (latitude == null || longitude == null || !Array.isArray(riskZones) || riskZones.length === 0) {
    return null;
  }

  let nearestZone = null;
  let minDistance = Infinity;

  for (const zone of riskZones) {
    const d = calculateDistanceKm(latitude, longitude, zone.latitude, zone.longitude);
    if (d != null && d < minDistance) {
      minDistance = d;
      nearestZone = zone;
    }
  }

  if (!nearestZone) {
    return null;
  }

  return {
    riskZoneId: nearestZone.id,
    riskScore: nearestZone.riskScore,
    riskLevel: nearestZone.riskLevel,
    dominantHazard: nearestZone.dominantHazard,
    distanceToRiskZoneKm: minDistance,
    isInZonePerimeter: minDistance <= nearestZone.radiusKm,
  };
}

/**
 * Sanitizes risk zone data based on user role (RBAC)
 */
function sanitizeRiskZoneForRole(zone, role = 'citizen') {
  if (!zone) return null;

  const isPrivileged = role === 'admin' || role === 'responder';
  const isVolunteer = role === 'volunteer' || role === 'ngo';

  if (isPrivileged) {
    return {
      ...zone,
      accessTier: 'OPERATIONAL_FULL',
    };
  }

  if (isVolunteer) {
    return {
      ...zone,
      accessTier: 'OPERATIONAL_VOLUNTEER',
    };
  }

  // Citizen Public-Safe View:
  // Exposes geographic coordinates, radius, riskScore, riskLevel, dominantHazard, event counts, reasons, and actions.
  // Strips internal dispatch notes and responder identities.
  return {
    id: zone.id,
    latitude: zone.latitude,
    longitude: zone.longitude,
    radiusKm: zone.radiusKm,
    riskScore: zone.riskScore,
    riskLevel: zone.riskLevel,
    dominantHazard: zone.dominantHazard,
    eventCount: zone.eventCount,
    activeSOSCount: zone.activeSOSCount,
    activeIncidentCount: zone.activeIncidentCount,
    affectedAreaCount: zone.affectedAreaCount,
    alertCount: zone.alertCount,
    nearbyShelterStrain: zone.nearbyShelterStrain,
    nearestShelter: zone.nearestShelter
      ? {
          name: zone.nearestShelter.name,
          distanceKm: zone.nearestShelter.distanceKm,
          availableCapacity: zone.nearestShelter.availableCapacity,
        }
      : null,
    reasons: zone.reasons,
    recommendedActions: zone.recommendedActions,
    generatedAt: zone.generatedAt,
    accessTier: 'PUBLIC_SAFETY',
  };
}

module.exports = {
  calculateDistanceKm,
  normalizeEventItem,
  clusterEvents,
  evaluateClusterRisk,
  buildRiskHeatmap,
  getRiskContextForCoordinates,
  sanitizeRiskZoneForRole,
};
