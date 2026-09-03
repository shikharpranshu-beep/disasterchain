/**
 * Crisis Intelligence Priority Engine Service
 *
 * Core algorithmic engine for DisasterChain emergency triage.
 * Transparent, explainable rule-based scoring model that synthesizes:
 * - Event severity
 * - Status urgency
 * - People affected count
 * - Hazard / emergency type life-threat risk
 * - Spatial proximity to active affected disaster areas
 * - Shelter capacity pressures
 * - Proximity and availability of emergency response resources
 */

// Earth's radius in kilometers for Haversine distance
const EARTH_RADIUS_KM = 6371;

const {
  recommendBestShelter,
  sanitizeShelterForRole,
} = require('./shelterRecommendationService');
const {
  getRiskContextForCoordinates,
} = require('./riskHeatmapService');

/**
 * Calculates Haversine distance in kilometers between two geo-coordinates
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {number} distance in kilometers (rounded to 2 decimal places)
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
  const distance = EARTH_RADIUS_KM * c;
  return Math.round(distance * 100) / 100;
}

/**
 * Normalizes latitude and longitude with fallback to campus center
 */
function getValidCoordinates(entity) {
  const defaultLat = 28.6139;
  const defaultLng = 77.2090;

  const lat = typeof entity.latitude === 'number' && !isNaN(entity.latitude)
    ? entity.latitude
    : defaultLat;
  const lng = typeof entity.longitude === 'number' && !isNaN(entity.longitude)
    ? entity.longitude
    : defaultLng;

  return { latitude: lat, longitude: lng };
}

/**
 * Evaluates priority score, priority level, explainability reasons, and actionable recommendations
 * for an emergency entity (SOS Request or Incident) against environmental context.
 *
 * @param {Object} entity - The SOS request or Incident document
 * @param {string} entityType - 'sos' or 'incident'
 * @param {Object} context - Environmental context { shelters, resources, affectedAreas }
 * @returns {Object} { priorityScore, priorityLevel, reasons, recommendedActions, spatialContext }
 */
function evaluateEmergencyPriority(entity, entityType, context = {}) {
  const { shelters = [], resources = [], affectedAreas = [] } = context;
  const reasons = [];
  const recommendedActions = [];

  let score = 0;
  const coords = getValidCoordinates(entity);

  // -------------------------------------------------------------
  // Factor 1: Severity Baseline (Major Weight: up to 40 pts)
  // -------------------------------------------------------------
  const severity = (entity.severity || 'Medium').toLowerCase();
  if (severity === 'critical') {
    score += 40;
    reasons.push('Critical severity classification (+40 pts)');
  } else if (severity === 'high') {
    score += 25;
    reasons.push('High severity classification (+25 pts)');
  } else if (severity === 'medium' || severity === 'moderate') {
    score += 15;
    reasons.push('Medium/Moderate severity classification (+15 pts)');
  } else {
    score += 5;
    reasons.push('Low severity classification (+5 pts)');
  }

  // -------------------------------------------------------------
  // Factor 2: Operational Status Urgency (Major Weight: up to 25 pts)
  // -------------------------------------------------------------
  const status = (entity.status || 'Pending').toLowerCase();
  if (entityType === 'sos') {
    if (status === 'pending') {
      score += 25;
      reasons.push('Unassigned pending SOS dispatch requiring immediate action (+25 pts)');
    } else if (status === 'in progress') {
      score += 15;
      reasons.push('Active SOS response in progress (+15 pts)');
    } else if (status === 'assigned') {
      score += 10;
      reasons.push('Responder unit assigned, en route (+10 pts)');
    } else {
      score += 0;
      reasons.push(`SOS status is ${entity.status} (+0 pts)`);
    }
  } else {
    // Incident
    if (status === 'pending') {
      score += 20;
      reasons.push('Pending unreviewed hazard report (+20 pts)');
    } else if (status === 'under review') {
      score += 10;
      reasons.push('Hazard report actively under assessment (+10 pts)');
    } else {
      score += 0;
      reasons.push(`Incident status is ${entity.status} (+0 pts)`);
    }
  }

  // -------------------------------------------------------------
  // Factor 3: Impact Scale / People Affected (Up to 20 pts)
  // -------------------------------------------------------------
  const people = Number(entity.peopleAffected || entity.affectedPeople || 1);
  if (people >= 10) {
    score += 20;
    reasons.push(`Mass casualty/impact risk: ${people} individuals affected (+20 pts)`);
  } else if (people >= 5) {
    score += 15;
    reasons.push(`Significant group affected: ${people} individuals (+15 pts)`);
  } else if (people >= 2) {
    score += 10;
    reasons.push(`Multiple individuals affected: ${people} individuals (+10 pts)`);
  } else {
    score += 5;
    reasons.push(`Single individual reported affected (+5 pts)`);
  }

  // -------------------------------------------------------------
  // Factor 4: Hazard / Emergency Type Life-Threat Risk (Up to 15 pts)
  // -------------------------------------------------------------
  const hazardType = (entity.emergencyType || entity.type || '').toLowerCase();
  const highRiskKeywords = [
    'fire',
    'medical',
    'trapped',
    'flood',
    'electrical',
    'gas leak',
    'earthquake',
    'building damage',
    'blocked emergency exit',
  ];

  const isHighRiskType = highRiskKeywords.some((keyword) =>
    hazardType.includes(keyword)
  );

  if (isHighRiskType) {
    score += 15;
    reasons.push(`Direct life-safety emergency category: "${entity.emergencyType || entity.type}" (+15 pts)`);
  } else {
    score += 5;
    reasons.push(`Hazard category: "${entity.emergencyType || entity.type}" (+5 pts)`);
  }

  // -------------------------------------------------------------
  // Factor 5: Proximity to Active Disaster / Affected Areas (Up to 15 pts)
  // -------------------------------------------------------------
  let nearestArea = null;
  let minAreaDist = Infinity;

  for (const area of affectedAreas) {
    if (area.status && area.status.toLowerCase() === 'controlled' && area.severity?.toLowerCase() === 'low') {
      continue;
    }
    const dist = calculateDistanceKm(
      coords.latitude,
      coords.longitude,
      area.latitude,
      area.longitude
    );
    if (dist != null && dist < minAreaDist) {
      minAreaDist = dist;
      nearestArea = { ...area, distanceKm: dist };
    }
  }

  if (nearestArea && minAreaDist <= 3.5) {
    const areaSev = (nearestArea.severity || 'Moderate').toLowerCase();
    if (areaSev === 'critical') {
      score += 15;
      reasons.push(
        `Within ${minAreaDist} km of Critical disaster zone "${nearestArea.name}" (+15 pts)`
      );
    } else if (areaSev === 'high') {
      score += 10;
      reasons.push(
        `Within ${minAreaDist} km of High-risk disaster zone "${nearestArea.name}" (+10 pts)`
      );
    } else {
      score += 5;
      reasons.push(
        `Located in proximity (${minAreaDist} km) to active affected area "${nearestArea.name}" (+5 pts)`
      );
    }
  }

  // -------------------------------------------------------------
  // Factor 6: Nearby Shelter Availability & Capacity (Up to 10 pts)
  // -------------------------------------------------------------
  let nearestShelter = null;
  let minShelterDist = Infinity;

  for (const shelter of shelters) {
    const dist = calculateDistanceKm(
      coords.latitude,
      coords.longitude,
      shelter.latitude,
      shelter.longitude
    );
    if (dist != null && dist < minShelterDist) {
      minShelterDist = dist;
      nearestShelter = {
        name: shelter.name,
        address: shelter.address,
        distanceKm: dist,
        status: shelter.status,
        capacity: shelter.capacity,
        occupancy: shelter.occupancy,
        availableCapacity: Math.max(0, (shelter.capacity || 0) - (shelter.occupancy || 0)),
        phone: shelter.phone,
      };
    }
  }

  if (nearestShelter) {
    const isShelterFull =
      nearestShelter.status === 'Full' ||
      (nearestShelter.capacity && nearestShelter.occupancy >= nearestShelter.capacity);

    if (isShelterFull && minShelterDist <= 5) {
      score += 10;
      reasons.push(
        `Nearest shelter "${nearestShelter.name}" (${minShelterDist} km) is at full capacity (+10 pts)`
      );
      recommendedActions.push(
        `Reroute evacuees away from ${nearestShelter.name} (full capacity); dispatch transit to next nearest open facility`
      );
    } else if (nearestShelter.availableCapacity > 0) {
      recommendedActions.push(
        `Designate "${nearestShelter.name}" (${minShelterDist} km away, ${nearestShelter.availableCapacity} slots available) as primary evacuation point`
      );
    }
  }

  // -------------------------------------------------------------
  // Factor 7: Nearby Emergency Resources & Distance (Up to 5 pts)
  // -------------------------------------------------------------
  let nearestMedical = null;
  let nearestFire = null;
  let nearestPolice = null;
  let minMedicalDist = Infinity;
  let minFireDist = Infinity;
  let minPoliceDist = Infinity;

  for (const res of resources) {
    const dist = calculateDistanceKm(
      coords.latitude,
      coords.longitude,
      res.latitude,
      res.longitude
    );
    if (dist == null) continue;

    const resType = (res.type || '').toLowerCase();
    if (resType.includes('hospital') || resType.includes('medical')) {
      if (dist < minMedicalDist) {
        minMedicalDist = dist;
        nearestMedical = {
          name: res.name,
          type: res.type,
          distanceKm: dist,
          phone: res.phone,
          status: res.status,
        };
      }
    } else if (resType.includes('fire')) {
      if (dist < minFireDist) {
        minFireDist = dist;
        nearestFire = {
          name: res.name,
          type: res.type,
          distanceKm: dist,
          phone: res.phone,
          status: res.status,
        };
      }
    } else if (resType.includes('police')) {
      if (dist < minPoliceDist) {
        minPoliceDist = dist;
        nearestPolice = {
          name: res.name,
          type: res.type,
          distanceKm: dist,
          phone: res.phone,
          status: res.status,
        };
      }
    }
  }

  // Medical distance scoring factor
  if (nearestMedical) {
    if (minMedicalDist > 5.0) {
      score += 5;
      reasons.push(
        `Extended distance to nearest medical trauma center (${minMedicalDist} km) (+5 pts)`
      );
    }
  }

  // -------------------------------------------------------------
  // Dynamic Response Recommendations Formulation
  // -------------------------------------------------------------
  if (hazardType.includes('medical') || hazardType.includes('trapped')) {
    if (nearestMedical) {
      recommendedActions.unshift(
        `Deploy emergency medical dispatch from ${nearestMedical.name} (${nearestMedical.distanceKm} km away, Ph: ${nearestMedical.phone})`
      );
    } else {
      recommendedActions.unshift('Alert campus emergency first-aid squad for on-site triage stabilization');
    }
  }

  if (hazardType.includes('fire') || hazardType.includes('electrical') || hazardType.includes('gas leak')) {
    if (nearestFire) {
      recommendedActions.unshift(
        `Dispatch fire tender and HAZMAT isolation team from ${nearestFire.name} (${nearestFire.distanceKm} km away)`
      );
    } else {
      recommendedActions.unshift('Deploy local fire suppression unit and cordon off perimeter immediately');
    }
  }

  if (hazardType.includes('flood') || hazardType.includes('building damage') || hazardType.includes('exit')) {
    if (nearestPolice) {
      recommendedActions.push(
        `Coordinate perimeter safety & crowd control with ${nearestPolice.name} (${nearestPolice.distanceKm} km away)`
      );
    }
    recommendedActions.push('Establish clear ingress corridor for rescue vehicles and equipment');
  }

  if (recommendedActions.length === 0) {
    recommendedActions.push('Dispatch field assessment unit to verify hazard stability and ensure public safety');
  }

  // -------------------------------------------------------------
  // Score Normalization & Priority Level Assignment
  // -------------------------------------------------------------
  // Clamp score strictly to [0, 100]
  const priorityScore = Math.min(100, Math.max(0, score));

  let priorityLevel = 'LOW';
  if (priorityScore >= 80 || (severity === 'critical' && isHighRiskType)) {
    priorityLevel = 'CRITICAL';
  } else if (priorityScore >= 60) {
    priorityLevel = 'HIGH';
  } else if (priorityScore >= 40) {
    priorityLevel = 'MEDIUM';
  } else {
    priorityLevel = 'LOW';
  }

  // Calculate Optimal Safe Haven Recommendation
  const recommendedShelter = recommendBestShelter(
    coords.latitude,
    coords.longitude,
    shelters
  );

  // Calculate Nearby Geographic Risk Context
  const riskContext = getRiskContextForCoordinates(
    coords.latitude,
    coords.longitude,
    context.riskZones || []
  );

  return {
    priorityScore,
    priorityLevel,
    reasons,
    recommendedActions,
    recommendedShelter,
    riskContext: riskContext || null,
    spatialContext: {
      nearestShelter: nearestShelter || null,
      nearestMedical: nearestMedical || null,
      nearestFireStation: nearestFire || null,
      nearestPoliceStation: nearestPolice || null,
      nearestAffectedArea: nearestArea
        ? {
            name: nearestArea.name,
            severity: nearestArea.severity,
            distanceKm: nearestArea.distanceKm,
          }
        : null,
    },
  };
}

/**
 * Formats and sanitizes emergency intelligence record based on user role (RBAC & Privacy)
 *
 * @param {Object} entity - Original document
 * @param {string} entityType - 'sos' or 'incident'
 * @param {Object} intelligence - Calculated scoring and recommendations
 * @param {string} role - 'admin', 'responder', 'volunteer', 'ngo', 'citizen'
 * @returns {Object} Sanitized intelligence record
 */
function sanitizeIntelligenceForRole(entity, entityType, intelligence, role) {
  const isPrivilegedResponder = role === 'admin' || role === 'responder';
  const isFieldVolunteer = role === 'volunteer' || role === 'ngo';

  const baseRecord = {
    id: entity.requestId || entity.incidentId || entity._id,
    mongoId: entity._id,
    entityType,
    title:
      entityType === 'sos'
        ? `SOS: ${entity.emergencyType} (${entity.severity})`
        : entity.title,
    emergencyType: entity.emergencyType || entity.type,
    severity: entity.severity,
    status: entity.status,
    peopleAffected: Number(entity.peopleAffected || entity.affectedPeople || 1),
    priorityScore: intelligence.priorityScore,
    priorityLevel: intelligence.priorityLevel,
    reasons: intelligence.reasons,
    recommendedActions: intelligence.recommendedActions,
    recommendedShelter: sanitizeShelterForRole(intelligence.recommendedShelter, role),
    riskContext: intelligence.riskContext || null,
    location: entity.location,
    coordinates: getValidCoordinates(entity),
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };

  if (isPrivilegedResponder) {
    // Full operational intelligence for Admins and Responders
    return {
      ...baseRecord,
      contact: entity.contact || null,
      reporterName: entity.name || entity.reporterName || 'Anonymous',
      reportedBy: entity.reportedBy || null,
      description: entity.description,
      spatialContext: intelligence.spatialContext,
      accessTier: 'OPERATIONAL_FULL',
    };
  }

  if (isFieldVolunteer) {
    // Redacted contact for Volunteers and NGOs (protect caller phone)
    const rawContact = entity.contact || '';
    const maskedContact =
      rawContact.length > 4
        ? `${rawContact.slice(0, 3)}****${rawContact.slice(-3)}`
        : 'Confidential';

    return {
      ...baseRecord,
      contact: maskedContact,
      reporterName: entity.name || entity.reporterName || 'Anonymous',
      description: entity.description,
      accessTier: 'OPERATIONAL_VOLUNTEER',
    };
  }

  // Citizen Public Safety View:
  // Strip personal identifying data, phone numbers, and raw reporter identities
  return {
    id: baseRecord.id,
    entityType: baseRecord.entityType,
    title: baseRecord.title,
    emergencyType: baseRecord.emergencyType,
    severity: baseRecord.severity,
    status: baseRecord.status,
    priorityScore: baseRecord.priorityScore,
    priorityLevel: baseRecord.priorityLevel,
    reasons: baseRecord.reasons,
    // Public safe instructions
    recommendedActions: baseRecord.recommendedActions.filter(
      (action) => !action.includes('Ph:') && !action.includes('HAZMAT isolation team')
    ),
    location: baseRecord.location,
    coordinates: baseRecord.coordinates,
    createdAt: baseRecord.createdAt,
    accessTier: 'PUBLIC_SAFETY',
  };
}

module.exports = {
  calculateDistanceKm,
  getValidCoordinates,
  evaluateEmergencyPriority,
  sanitizeIntelligenceForRole,
};
