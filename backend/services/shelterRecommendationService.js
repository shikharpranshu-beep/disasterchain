/**
 * Smart Shelter Recommendation Service
 *
 * Algorithmically evaluates real-time shelter records against an emergency coordinate.
 * Produces an explainable 0–100 match score based on:
 * 1. Geographic distance (Haversine formula in km)
 * 2. Available bed headroom (capacity - occupancy)
 * 3. Facility occupancy percentage / load strain
 * 4. On-site medical capability
 * 5. Life-support amenities (food, water, power, sanitation)
 */

const EARTH_RADIUS_KM = 6371;

/**
 * Calculates Haversine distance in kilometers between two geo-coordinates
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {number|null} distance in km rounded to 2 decimal places
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
 * Evaluates a single shelter's suitability and match score for an emergency location
 *
 * @param {Object} shelter - Shelter document
 * @param {number} originLat - Emergency latitude
 * @param {number} originLon - Emergency longitude
 * @param {Object} preferences - Optional constraints { requiredBeds, needMedical }
 * @returns {Object} Evaluation report including matchScore, reasons, and spatial metrics
 */
function evaluateShelterMatch(shelter, originLat, originLon, preferences = {}) {
  const reasons = [];
  let score = 0;

  const capacity = Number(shelter.capacity) || 0;
  const occupancy = Number(shelter.occupancy) || 0;
  const availableCapacity = Math.max(0, capacity - occupancy);
  const occupancyPercent = capacity > 0 ? Math.min(100, Math.round((occupancy / capacity) * 100)) : 100;

  const distanceKm = calculateDistanceKm(
    originLat,
    originLon,
    shelter.latitude,
    shelter.longitude
  );

  // Status Check: Exclude or heavily penalize closed / full shelters
  const status = (shelter.status || 'Open').toLowerCase();
  const isTemporarilyClosed = status.includes('closed');
  const isFull = status === 'full' || availableCapacity <= 0;

  if (isTemporarilyClosed) {
    return {
      eligible: false,
      disqualificationReason: 'Facility is temporarily closed',
      matchScore: 0,
      reasons: ['Facility is temporarily closed (+0 pts)'],
    };
  }

  if (isFull) {
    return {
      eligible: false,
      disqualificationReason: 'Facility is at 100% full capacity',
      matchScore: 0,
      reasons: ['Facility is at 100% capacity (0 available beds) (+0 pts)'],
    };
  }

  // -------------------------------------------------------------
  // Factor 1: Proximity / Haversine Distance (Max 35 pts)
  // -------------------------------------------------------------
  if (distanceKm != null) {
    if (distanceKm <= 1.0) {
      score += 35;
      reasons.push(`Immediate safe proximity (${distanceKm} km away) (+35 pts)`);
    } else if (distanceKm <= 2.5) {
      score += 25;
      reasons.push(`Close transit proximity (${distanceKm} km away) (+25 pts)`);
    } else if (distanceKm <= 5.0) {
      score += 15;
      reasons.push(`Moderate transit distance (${distanceKm} km away) (+15 pts)`);
    } else {
      score += 5;
      reasons.push(`Extended distance from emergency (${distanceKm} km away) (+5 pts)`);
    }
  }

  // -------------------------------------------------------------
  // Factor 2: Available Capacity & Bed Headroom (Max 30 pts)
  // -------------------------------------------------------------
  if (availableCapacity >= 150) {
    score += 30;
    reasons.push(`Substantial bed availability (${availableCapacity} beds open) (+30 pts)`);
  } else if (availableCapacity >= 50) {
    score += 20;
    reasons.push(`Ample bed availability (${availableCapacity} beds open) (+20 pts)`);
  } else if (availableCapacity >= 10) {
    score += 10;
    reasons.push(`Moderate bed availability (${availableCapacity} beds open) (+10 pts)`);
  } else {
    score += 5;
    reasons.push(`Limited capacity headroom (${availableCapacity} beds open) (+5 pts)`);
  }

  // -------------------------------------------------------------
  // Factor 3: Occupancy Load Ratio (Max 15 pts)
  // -------------------------------------------------------------
  if (occupancyPercent <= 60) {
    score += 15;
    reasons.push(`Low facility congestion (${occupancyPercent}% occupied) (+15 pts)`);
  } else if (occupancyPercent <= 85) {
    score += 10;
    reasons.push(`Moderate facility load (${occupancyPercent}% occupied) (+10 pts)`);
  } else {
    score += 5;
    reasons.push(`High facility load (${occupancyPercent}% occupied) (+5 pts)`);
  }

  // -------------------------------------------------------------
  // Factor 4: Medical Support Capability (Max 10 pts)
  // -------------------------------------------------------------
  const facilities = Array.isArray(shelter.facilities) ? shelter.facilities : [];
  const hasMedical = facilities.some((f) =>
    f.toLowerCase().includes('medical')
  );

  if (hasMedical) {
    score += 10;
    reasons.push('On-site emergency medical support available (+10 pts)');
  }

  // -------------------------------------------------------------
  // Factor 5: Essential Life-Support Amenities (Max 10 pts)
  // -------------------------------------------------------------
  let amenityPoints = 0;
  const matchedAmenities = [];

  const checkAmenity = (keyword, label) => {
    if (facilities.some((f) => f.toLowerCase().includes(keyword))) {
      amenityPoints += 2.5;
      matchedAmenities.push(label);
    }
  };

  checkAmenity('food', 'Food Provision');
  checkAmenity('water', 'Potable Water');
  checkAmenity('electric', 'Power/Electricity');
  checkAmenity('toilet', 'Sanitation/Toilets');

  if (amenityPoints > 0) {
    score += Math.min(10, amenityPoints);
    reasons.push(`Essential amenities: ${matchedAmenities.join(', ')} (+${Math.min(10, amenityPoints)} pts)`);
  }

  // Score Normalization
  const matchScore = Math.min(100, Math.max(0, Math.round(score)));

  // Generate Navigation URL using Google Maps directions with real coordinates
  const directionsUrl =
    originLat != null && originLon != null && shelter.latitude != null && shelter.longitude != null
      ? `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLon}&destination=${shelter.latitude},${shelter.longitude}`
      : null;

  return {
    eligible: true,
    shelterId: shelter._id || shelter.id,
    name: shelter.name,
    address: shelter.address,
    distanceKm: distanceKm || 0,
    capacity,
    occupied: occupancy,
    availableCapacity,
    occupancyPercent,
    status: shelter.status || 'Open',
    matchScore,
    reasons,
    amenities: facilities,
    phone: shelter.phone,
    coordinates: {
      latitude: shelter.latitude,
      longitude: shelter.longitude,
    },
    directionsUrl,
  };
}

/**
 * Recommends the optimal shelter for an emergency coordinate among an array of shelter documents
 *
 * @param {number} latitude - Origin latitude
 * @param {number} longitude - Origin longitude
 * @param {Array} shelters - Array of shelter records from MongoDB
 * @param {Object} options - Optional parameters
 * @returns {Object|null} Top recommended shelter or null if no suitable candidate
 */
function recommendBestShelter(latitude, longitude, shelters = [], options = {}) {
  if (latitude == null || longitude == null || !Array.isArray(shelters) || shelters.length === 0) {
    return null;
  }

  const evaluated = [];

  for (const s of shelters) {
    // Validate shelter coordinates
    if (typeof s.latitude !== 'number' || typeof s.longitude !== 'number' || isNaN(s.latitude) || isNaN(s.longitude)) {
      continue;
    }

    const report = evaluateShelterMatch(s, latitude, longitude, options);
    if (report.eligible) {
      evaluated.push(report);
    }
  }

  if (evaluated.length === 0) {
    return null;
  }

  // Sort candidates: highest matchScore first, then closest distance
  evaluated.sort((a, b) => {
    if (b.matchScore !== a.matchScore) {
      return b.matchScore - a.matchScore;
    }
    return a.distanceKm - b.distanceKm;
  });

  return evaluated[0];
}

/**
 * Sanitizes shelter recommendation based on user role (RBAC)
 *
 * @param {Object} recommendation - Shelter recommendation
 * @param {string} role - 'admin', 'responder', 'volunteer', 'ngo', 'citizen'
 * @returns {Object} Sanitized recommendation
 */
function sanitizeShelterForRole(recommendation, role = 'citizen') {
  if (!recommendation) return null;

  const isPrivileged = role === 'admin' || role === 'responder';

  if (isPrivileged) {
    return {
      ...recommendation,
      accessTier: 'OPERATIONAL_FULL',
    };
  }

  // Public-Safe Citizen & Volunteer View:
  // Exposes complete navigation, matchScore, reasons, available beds, and amenities.
  // Strips any internal responder-only dispatch notes.
  return {
    shelterId: recommendation.shelterId,
    name: recommendation.name,
    address: recommendation.address,
    distanceKm: recommendation.distanceKm,
    capacity: recommendation.capacity,
    occupied: recommendation.occupied,
    availableCapacity: recommendation.availableCapacity,
    occupancyPercent: recommendation.occupancyPercent,
    matchScore: recommendation.matchScore,
    status: recommendation.status,
    reasons: recommendation.reasons,
    amenities: recommendation.amenities,
    coordinates: recommendation.coordinates,
    directionsUrl: recommendation.directionsUrl,
    accessTier: 'PUBLIC_SAFETY',
  };
}

module.exports = {
  calculateDistanceKm,
  evaluateShelterMatch,
  recommendBestShelter,
  sanitizeShelterForRole,
};
