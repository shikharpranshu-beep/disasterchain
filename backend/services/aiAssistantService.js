/**
 * DisasterChain AI Emergency Assistant Service
 *
 * Core intelligence engine providing role-aware emergency guidance, live context synthesis,
 * Smart Shelter routing, Risk Heatmap explanation, and verified disaster preparedness.
 *
 * Supports real LLM APIs via AI_API_KEY with graceful, zero-downtime ASSISTANT LIMITED MODE fallback.
 */

const mongoose = require('mongoose');
const Shelter = require('../models/Shelter');
const Alert = require('../models/Alert');
const Incident = require('../models/Incident');
const AffectedArea = require('../models/AffectedArea');
const SosRequest = require('../models/SosRequest');
const Resource = require('../models/Resource');
const memoryStore = require('../config/memoryStore');

const {
  recommendBestShelter,
  sanitizeShelterForRole,
} = require('./shelterRecommendationService');
const {
  buildRiskHeatmap,
  sanitizeRiskZoneForRole,
} = require('./riskHeatmapService');
const {
  evaluateEmergencyPriority,
  calculateDistanceKm,
} = require('./crisisIntelligenceService');

const isDbConnected = () => mongoose.connection.readyState === 1;

// Emergency Life-Threat Keywords
const EMERGENCY_KEYWORDS = [
  'help me',
  'trapped',
  'bleeding',
  'fire',
  'burning',
  'drowning',
  'can\'t breathe',
  'cannot breathe',
  'heart attack',
  'collapsed',
  'dying',
  'save me',
  'sos',
  'injured',
  'unconscious',
  'smoke inhalation',
  'electrocution',
];

// Verified Fallback Preparedness Guides
const PREPAREDNESS_GUIDES = {
  earthquake: {
    title: 'Earthquake Safety & Structural Collapse Protocols',
    immediate: 'DROP, COVER, and HOLD ON immediately under a sturdy desk or interior wall.',
    dos: [
      'Drop to hands and knees.',
      'Cover head and neck with arms or sturdy furniture.',
      'Hold on until shaking completely stops.',
      'Use stairs only when evacuating buildings.',
    ],
    donts: [
      'Do NOT use elevators during or after earthquakes.',
      'Do NOT run outside while ground shaking is active.',
      'Do NOT light matches or candles if gas leaks are suspected.',
    ],
    kit: ['Water (3L/person/day)', 'Battery-powered AM/FM radio', 'High-intensity LED flashlight', 'Emergency whistle', 'First aid kit'],
  },
  flood: {
    title: 'Flood & Rapid Waterlogging Response Protocols',
    immediate: 'Move immediately to higher floors or high ground. Turn off electricity mains.',
    dos: [
      'Move to higher ground or upper building levels.',
      'Shut off main electrical breakers before water enters.',
      'Boil all drinking water or use purification tablets.',
      'Follow official evacuation alerts promptly.',
    ],
    donts: [
      'Do NOT walk through moving water currents (6 inches can knock an adult down).',
      'Do NOT drive into waterlogged roads or underpasses.',
      'Do NOT touch submerged electronic equipment or fallen wires.',
    ],
    kit: ['Waterproof pouch for ID and cash', 'Chlorine water purification tablets', 'Non-perishable food rations', 'Portable mobile power bank'],
  },
  fire: {
    title: 'Fire Safety & Smoke Evacuation Protocols',
    immediate: 'CRAWL LOW under smoke toward the nearest fire exit. Feel door handles before opening.',
    dos: [
      'Crawl low under smoke where breathable air remains.',
      'Feel door handles with the back of your hand before opening.',
      'If clothes catch fire: STOP, DROP to ground, and ROLL.',
      'Evacuate immediately via stairwells.',
    ],
    donts: [
      'Do NOT use elevators during a fire evacuation.',
      'Do NOT open doors that feel warm to the touch.',
      'Do NOT re-enter a burning building for any belongings.',
    ],
    kit: ['Emergency smoke escape hoods / N95 masks', 'ABC dry chemical extinguisher', 'Fire blanket', 'Sterile burn gel dressings'],
  },
  cyclone: {
    title: 'Cyclone & Severe Windstorm Protocols',
    immediate: 'Remain indoors in an interior windowless room (bathroom or central corridor).',
    dos: [
      'Stay in central windowless interior rooms.',
      'Keep mobile phones in power-saving mode.',
      'Stockpile 5 days of non-perishable food and potable water.',
    ],
    donts: [
      'Do NOT venture outside during the calm "eye" of the storm.',
      'Do NOT stand near large glass windows or skylights.',
    ],
    kit: ['Transistor radio with extra batteries', 'Heavy-duty tarpaulin & rope', 'Prescription medicines for 7 days'],
  },
  landslide: {
    title: 'Landslide & Mudflow Safety Protocols',
    immediate: 'If movement is heard or observed, evacuate immediately to stable high ground.',
    dos: [
      'Evacuate immediately if slope rumbling or ground cracking occurs.',
      'Curl into a tight protective ball if caught indoors.',
    ],
    donts: [
      'Do NOT cross fresh mudflow paths.',
      'Do NOT remain near steep riverbanks during torrential rain.',
    ],
    kit: ['Sturdy hiking boots', 'Emergency high-vis signaling vest', 'Whistle and emergency beacon'],
  },
  heatwave: {
    title: 'Extreme Heatwave & Dehydration Prevention',
    immediate: 'Stay in shaded/air-conditioned indoor areas. Hydrate frequently with electrolytes.',
    dos: [
      'Drink plenty of water and ORS electrolytes.',
      'Wear lightweight, loose-fitting light-colored cotton clothing.',
      'Sponge skin with cool water if feeling dizziness or nausea.',
    ],
    donts: [
      'Do NOT leave children or pets inside parked vehicles.',
      'Do NOT engage in strenuous outdoor activity between 11 AM and 4 PM.',
    ],
    kit: ['ORS electrolyte sachets', 'Insulated cold-water bottle', 'Broad-spectrum SPF 50 sunscreen'],
  },
};

/**
 * Detects user intent from incoming message string
 */
function analyzeIntent(message) {
  const text = (message || '').toLowerCase();

  const isEmergency = EMERGENCY_KEYWORDS.some((kw) => text.includes(kw));

  let primaryIntent = 'general';
  if (/\b(brief|situation|summary|overview|status report|sitrep)\b/i.test(text)) {
    primaryIntent = 'situation_brief';
  } else if (/\b(shelters?|beds?|safe havens?|refuges?|evac centers?|where to sleep)\b/i.test(text)) {
    primaryIntent = 'shelter';
  } else if (/\b(risks?|hazards?|dangers?|threats?|heat maps?|vulnerab)/i.test(text)) {
    primaryIntent = 'risk';
  } else if (/\b(alerts?|warnings?|advisories|advisory|sirens?|evacuations?)\b/i.test(text)) {
    primaryIntent = 'alert';
  } else if (/\b(incidents?|reports?|fires?|floods?|accidents?|collapsed|leaks?)\b/i.test(text) && !/what should|how to/i.test(text)) {
    primaryIntent = 'incident';
  } else if (/\b(resources?|supplies|supply|water|food|medical kit|rations?|blankets?)\b/i.test(text)) {
    primaryIntent = 'resource';
  } else if (/\b(what should|how do|how to|prepare|emergency kit|protocol|safety tip|earthquake|cyclone|landslide|heatwave)\b/i.test(text)) {
    primaryIntent = 'preparedness';
  }

  // Detect specific disaster type for preparedness
  let disasterType = null;
  if (/earthquake|tremor|quake/i.test(text)) disasterType = 'earthquake';
  else if (/flood|waterlog|tsunami|drown/i.test(text)) disasterType = 'flood';
  else if (/fire|smoke|burn/i.test(text)) disasterType = 'fire';
  else if (/cyclone|hurricane|storm|typhoon/i.test(text)) disasterType = 'cyclone';
  else if (/landslide|mudslide|mudflow/i.test(text)) disasterType = 'landslide';
  else if (/heatwave|heat stroke|hyperthermia|hot/i.test(text)) disasterType = 'heatwave';

  return {
    isEmergency,
    primaryIntent,
    disasterType,
  };
}

/**
 * Retrieves compact, role-filtered live DisasterChain context
 */
async function retrieveLiveContext(intentInfo, userRole, coordinates = null) {
  const userLat = coordinates?.latitude ?? (coordinates?.lat != null ? Number(coordinates.lat) : null);
  const userLon = coordinates?.longitude ?? (coordinates?.lng != null ? Number(coordinates.lng) : null);

  const context = {
    role: userRole,
    sources: [],
    recommendedShelter: null,
    activeAlerts: [],
    riskSummary: null,
    riskZones: [],
    activeIncidents: [],
    resources: [],
    preparedness: null,
    activeSosCount: 0,
  };

  try {
    // 1. Fetch Shelters if needed
    if (intentInfo.primaryIntent === 'shelter' || intentInfo.primaryIntent === 'situation_brief' || intentInfo.isEmergency) {
      let rawShelters = [];
      if (isDbConnected()) {
        rawShelters = await Shelter.find({}).lean();
      } else {
        rawShelters = memoryStore.shelters || [];
      }

      const queryLat = userLat ?? 28.6139;
      const queryLon = userLon ?? 77.2090;

      const recommendation = recommendBestShelter(queryLat, queryLon, rawShelters);
      if (recommendation) {
        context.recommendedShelter = sanitizeShelterForRole(recommendation, userRole);
        context.sources.push('Live Shelter Registry');
      }
    }

    // 2. Fetch Alerts if needed
    if (intentInfo.primaryIntent === 'alert' || intentInfo.primaryIntent === 'situation_brief' || intentInfo.isEmergency || intentInfo.primaryIntent === 'general') {
      let rawAlerts = [];
      if (isDbConnected()) {
        rawAlerts = await Alert.find({ status: { $ne: 'Expired' } }).sort({ createdAt: -1 }).limit(4).lean();
      } else {
        rawAlerts = (memoryStore.alerts || []).filter((a) => a.status !== 'Expired').slice(0, 4);
      }

      context.activeAlerts = rawAlerts.map((a) => ({
        id: a._id,
        title: a.title,
        severity: a.severity,
        location: a.location,
        type: a.type,
      }));
      if (context.activeAlerts.length > 0) {
        context.sources.push('Emergency Broadcast Alerts');
      }
    }

    // 3. Fetch Risk Heatmap if needed
    if (intentInfo.primaryIntent === 'risk' || intentInfo.primaryIntent === 'situation_brief' || intentInfo.isEmergency) {
      let rawSos = [];
      let rawIncidents = [];
      let rawAreas = [];
      let rawShelters = [];

      if (isDbConnected()) {
        [rawSos, rawIncidents, rawAreas, rawShelters] = await Promise.all([
          SosRequest.find({ status: { $nin: ['Resolved', 'Cancelled'] } }).lean(),
          Incident.find({ status: { $nin: ['Resolved', 'Rejected'] } }).lean(),
          AffectedArea.find({}).lean(),
          Shelter.find({}).lean(),
        ]);
      } else {
        rawSos = (memoryStore.sosRequests || []).filter((s) => s.status !== 'Resolved' && s.status !== 'Cancelled');
        rawIncidents = (memoryStore.incidents || []).filter((i) => i.status !== 'Resolved' && i.status !== 'Rejected');
        rawAreas = memoryStore.affectedAreas || [];
        rawShelters = memoryStore.shelters || [];
      }

      context.activeSosCount = rawSos.length;

      const zones = buildRiskHeatmap(
        {
          sosRequests: rawSos,
          incidents: rawIncidents,
          affectedAreas: rawAreas,
          alerts: [],
          shelters: rawShelters,
        },
        { limit: 10 }
      ) || [];

      const sanitizedZones = (zones || []).map((z) => sanitizeRiskZoneForRole(z, userRole));

      context.riskSummary = {
        totalZones: sanitizedZones.length,
        criticalZones: sanitizedZones.filter((z) => z.riskLevel === 'CRITICAL').length,
        highZones: sanitizedZones.filter((z) => z.riskLevel === 'HIGH').length,
        mediumZones: sanitizedZones.filter((z) => z.riskLevel === 'MEDIUM').length,
        lowZones: sanitizedZones.filter((z) => z.riskLevel === 'LOW').length,
        highestRiskScore: sanitizedZones.length > 0 ? Math.max(...sanitizedZones.map((z) => z.riskScore || 0)) : 0,
      };
      context.riskZones = sanitizedZones.slice(0, 3);
      context.sources.push('Risk Intelligence Heatmap');
    }

    // 4. Fetch Incidents if needed
    if (intentInfo.primaryIntent === 'incident' || intentInfo.primaryIntent === 'situation_brief') {
      let rawIncidents = [];
      if (isDbConnected()) {
        rawIncidents = await Incident.find({ status: { $nin: ['Resolved', 'Rejected'] } }).sort({ createdAt: -1 }).limit(4).lean();
      } else {
        rawIncidents = (memoryStore.incidents || []).filter((i) => i.status !== 'Resolved' && i.status !== 'Rejected').slice(0, 4);
      }

      context.activeIncidents = rawIncidents.map((i) => ({
        id: i._id,
        title: i.title,
        severity: i.severity,
        type: i.type,
        location: i.location,
        status: i.status,
        reporterName: userRole === 'citizen' ? undefined : i.reporterName,
      }));
      context.sources.push('Field Incident Logs');
    }

    // 5. Fetch Resources if needed
    if (intentInfo.primaryIntent === 'resource') {
      let rawResources = [];
      if (isDbConnected()) {
        rawResources = await Resource.find({}).limit(4).lean();
      } else {
        rawResources = (memoryStore.resources || []).slice(0, 4);
      }

      context.resources = rawResources.map((r) => ({
        name: r.name,
        type: r.type,
        status: r.status,
        address: r.address,
        phone: userRole === 'citizen' ? undefined : r.phone,
      }));
      context.sources.push('Disaster Resource Directory');
    }

    // 6. Attach Preparedness Guide
    if (intentInfo.primaryIntent === 'preparedness' || intentInfo.disasterType) {
      const guideKey = intentInfo.disasterType || 'flood';
      context.preparedness = PREPAREDNESS_GUIDES[guideKey] || PREPAREDNESS_GUIDES.flood;
      context.sources.push('DisasterChain Preparedness Standards');
    }
  } catch (err) {
    console.error('Error retrieving live DisasterChain context for AI assistant:', err);
  }

  return context;
}

/**
 * Builds safe deterministic response in ASSISTANT LIMITED MODE
 */
function generateDeterministicReply(message, intentInfo, context, userRole) {
  const actions = [];
  let reply = '';

  // 1. Immediate Life-Threatening Situation
  if (intentInfo.isEmergency) {
    reply = `⚠️ **IMMEDIATE DANGER DETECTED**\n\n` +
      `**1. Call Local Emergency Services Immediately (Dial 112 / 101 / 911).**\n` +
      `**2. If trapped or requiring rapid extraction, trigger your DisasterChain Emergency SOS Beacon below.**\n\n` +
      `**Essential Immediate Actions:**\n` +
      `• Protect your airway from smoke or floodwaters.\n` +
      `• Do not attempt to cross moving currents or re-enter structurally compromised buildings.\n` +
      `• Keep your mobile device in battery-saver mode with GPS enabled.`;

    if (context.recommendedShelter) {
      reply += `\n\n**Nearest Safe Haven Available:**\n` +
        `• **${context.recommendedShelter.name}** (${context.recommendedShelter.distanceKm} km away)\n` +
        `• Status: **${context.recommendedShelter.availableCapacity} available beds**\n` +
        `• Address: ${context.recommendedShelter.address || 'Central Relief Zone'}`;

      actions.push({
        type: 'VIEW_SHELTER',
        label: 'VIEW NEAREST SHELTER',
        payload: context.recommendedShelter,
      });

      if (context.recommendedShelter.directionsUrl) {
        actions.push({
          type: 'GET_DIRECTIONS',
          label: 'GET DIRECTIONS ↗',
          url: context.recommendedShelter.directionsUrl,
        });
      }
    }

    actions.unshift({
      type: 'TRIGGER_SOS',
      label: '🚨 BROADCAST EMERGENCY SOS',
    });

    return { reply, actions, isEmergency: true };
  }

  // 2. Shelter Intent
  if (intentInfo.primaryIntent === 'shelter') {
    if (context.recommendedShelter) {
      const sh = context.recommendedShelter;
      reply = `🏛️ **Optimal Safe Haven Recommendation**\n\n` +
        `Based on live spatial telemetry and capacity load, the top candidate is:\n\n` +
        `• **Name:** ${sh.name}\n` +
        `• **Distance:** ~${sh.distanceKm} km from operational coordinates\n` +
        `• **Available Capacity:** ${sh.availableCapacity} open beds (${sh.occupancyRate}% loaded)\n` +
        `• **Location:** ${sh.address || 'Campus Disaster Relief Center'}\n` +
        `• **Match Score:** ${sh.matchScore}/100\n\n` +
        `**Key Recommendation Factors:**\n` +
        (sh.reasons && sh.reasons.length > 0 ? sh.reasons.map((r) => `• ${r}`).join('\n') : '• Designated verified safe haven zone');

      actions.push({
        type: 'VIEW_SHELTER',
        label: 'VIEW SHELTER DETAILS',
        payload: sh,
      });

      if (sh.directionsUrl) {
        actions.push({
          type: 'GET_DIRECTIONS',
          label: 'GET DIRECTIONS ↗',
          url: sh.directionsUrl,
        });
      }
    } else {
      reply = `All monitored shelters in this sector are currently operating at peak capacity or undergoing intake triage. Please monitor live alerts for newly opened municipal relief centers.`;
      actions.push({
        type: 'NAVIGATE',
        label: 'OPEN ALL SHELTERS',
        route: '/shelters',
      });
    }
    return { reply, actions, isEmergency: false };
  }

  // 3. Risk / Hazard Intent
  if (intentInfo.primaryIntent === 'risk') {
    const summary = context.riskSummary || {};
    reply = `🔥 **Live Risk Intelligence Assessment**\n\n` +
      `Current telemetry monitors **${summary.totalZones || 0} active hazard zones** across the regional grid:\n\n` +
      `• **Critical Threat Hotspots:** ${summary.criticalZones || 0}\n` +
      `• **High Threat Zones:** ${summary.highZones || 0}\n` +
      `• **Moderate Threat Zones:** ${summary.mediumZones || 0}\n` +
      `• **Peak Risk Score:** ${summary.highestRiskScore || 0}/100\n\n`;

    if (context.riskZones && context.riskZones.length > 0) {
      reply += `**Top Monitored Priority Zones:**\n`;
      context.riskZones.forEach((z, idx) => {
        reply += `${idx + 1}. **${z.dominantHazard || 'Hazard Sector'}** [${z.riskLevel}] — Risk Index: **${z.riskScore}/100** (~${z.radiusKm || 1.5} km perimeter)\n`;
      });
    }

    actions.push({
      type: 'VIEW_MAP',
      label: 'VIEW RISK HEATMAP',
      route: '/dashboard',
    });
    actions.push({
      type: 'VIEW_GLOBE',
      label: 'VIEW 3D GLOBE',
      route: '/dashboard',
    });

    return { reply, actions, isEmergency: false };
  }

  // 4. Alert Intent
  if (intentInfo.primaryIntent === 'alert') {
    if (context.activeAlerts && context.activeAlerts.length > 0) {
      reply = `📢 **Active Emergency Advisories & Broadcasts**\n\n` +
        `There are currently **${context.activeAlerts.length} live safety broadcasts**:\n\n`;
      context.activeAlerts.forEach((a, idx) => {
        reply += `${idx + 1}. **[${a.severity}] ${a.title}**\n` +
          `   • Sector: ${a.location}\n` +
          `   • Hazard Category: ${a.type}\n\n`;
      });
      reply += `Follow all evacuation and civil defense instructions immediately.`;
    } else {
      reply = `🟢 **No Critical Emergency Alerts Active**\n\nAll regional sectors are currently reporting nominal baseline parameters. Maintain vigilance and check back during inclement weather.`;
    }

    actions.push({
      type: 'NAVIGATE',
      label: 'VIEW ALL ALERTS',
      route: '/alerts',
    });

    return { reply, actions, isEmergency: false };
  }

  // 5. Incident Intent
  if (intentInfo.primaryIntent === 'incident') {
    if (context.activeIncidents && context.activeIncidents.length > 0) {
      reply = `📋 **Active Field Incident Reports**\n\n` +
        `Currently monitoring **${context.activeIncidents.length} verified unresolved field reports**:\n\n`;
      context.activeIncidents.forEach((i, idx) => {
        reply += `${idx + 1}. **${i.title}** (${i.severity} • ${i.type})\n` +
          `   • Location: ${i.location}\n` +
          `   • Status: ${i.status}\n\n`;
      });
    } else {
      reply = `No critical unresolved incidents are currently logged in this sector.`;
    }

    actions.push({
      type: 'NAVIGATE',
      label: 'VIEW INCIDENT REPORTS',
      route: '/incidents',
    });

    return { reply, actions, isEmergency: false };
  }

  // 6. Situation Brief for Responders / Admins
  if (intentInfo.primaryIntent === 'situation_brief') {
    const summary = context.riskSummary || {};
    reply = `🛡️ **DisasterChain Operational Situation Briefing**\n\n` +
      `**Authority Level:** ${userRole.toUpperCase()}\n` +
      `**System Status:** ACTIVE SURVEILLANCE\n\n` +
      `• **Active Distress Signals (SOS):** ${context.activeSosCount}\n` +
      `• **High/Critical Hazard Hotspots:** ${(summary.criticalZones || 0) + (summary.highZones || 0)}\n` +
      `• **Unresolved Field Incidents:** ${context.activeIncidents?.length || 0}\n` +
      `• **Broadcast Advisories:** ${context.activeAlerts?.length || 0}\n\n`;

    if (context.recommendedShelter) {
      reply += `**Primary Recommended Safe Haven:**\n` +
        `• ${context.recommendedShelter.name} (${context.recommendedShelter.availableCapacity} beds open)\n\n`;
    }

    reply += `*Operational Recommendation:* Maintain priority response dispatch toward critical tier incidents and enforce perimeter isolation around active high-risk flood/fire zones.`;

    actions.push({
      type: 'NAVIGATE',
      label: 'MISSION CONTROL DASHBOARD',
      route: '/dashboard',
    });

    return { reply, actions, isEmergency: false };
  }

  // 7. Preparedness Intent
  if (intentInfo.primaryIntent === 'preparedness') {
    const guide = context.preparedness || PREPAREDNESS_GUIDES.flood;
    reply = `🛡️ **${guide.title}**\n\n` +
      `**Immediate Priority:**\n${guide.immediate}\n\n` +
      `**Crucial DOs:**\n` +
      guide.dos.map((d) => `• ${d}`).join('\n') + `\n\n` +
      `**Crucial DON'Ts:**\n` +
      guide.donts.map((d) => `• ${d}`).join('\n') + `\n\n` +
      `**Recommended Emergency Kit Items:**\n` +
      guide.kit.map((k) => `• ${k}`).join('\n');

    actions.push({
      type: 'NAVIGATE',
      label: 'VIEW DISASTER GUIDES',
      route: '/guides',
    });

    return { reply, actions, isEmergency: false };
  }

  // 8. General / Fallback
  reply = `Greetings. I am the **DisasterChain AI Emergency Assistant**.\n\n` +
    `I provide real-time situational awareness and verified safety guidance directly from the DisasterChain network.\n\n` +
    `**How I can assist you right now:**\n` +
    `• 🏛️ **"Find nearest shelter"** — Locates optimal safe havens with live bed counts\n` +
    `• 📢 **"Current alerts"** — Summarizes active civil defense and weather advisories\n` +
    `• 🔥 **"Explain my risk"** — Analyzes regional hazard scores and risk zones\n` +
    `• 🛡️ **"What should I do during an earthquake/flood?"** — Step-by-step life safety guides\n` +
    `• 🚨 **"Help me"** — Instant safety protocols and emergency extraction guidance`;

  actions.push({
    type: 'QUICK_QUERY',
    label: 'FIND NEAREST SHELTER',
    query: 'Where is the nearest safe shelter?',
  });
  actions.push({
    type: 'QUICK_QUERY',
    label: 'CURRENT ALERTS',
    query: 'What are the current emergency alerts?',
  });
  actions.push({
    type: 'QUICK_QUERY',
    label: 'SAFETY CHECKLIST',
    query: 'What should I keep in an emergency kit?',
  });

  return { reply, actions, isEmergency: false };
}

/**
 * Generates an AI response using an external LLM provider if AI_API_KEY is configured
 */
async function callExternalProvider(message, conversation, context, userRole) {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    return null;
  }

  const systemInstruction = `You are DISASTERCHAIN AI ASSISTANT, an emergency operations intelligence & safety assistant for the DisasterChain disaster management platform.
Your visual theme is Warm Crisis Command.
Your top priority is human life safety.
Follow these strict policies:
1. Prioritize human safety above all else. If immediate life threat is detected, immediately instruct calling local emergency services (112 or 911).
2. Never pretend to be human emergency dispatchers or claim you have dispatched responders unless confirmed in system data.
3. Use the provided LIVE DISASTERCHAIN CONTEXT for all facts, numbers, shelter capacities, and risk levels. Never invent shelters, bed counts, or risk scores.
4. Keep emergency guidance concise, clear, and actionable. Use bullet points and bold formatting for critical steps.
5. User role: ${userRole}. Do not expose private contact information, personal victim phone numbers, or reporter identities to unauthorized roles.
6. Clearly distinguish between live system data and general safety guidance.`;

  const compactContextStr = JSON.stringify({
    role: userRole,
    recommendedShelter: context.recommendedShelter ? {
      name: context.recommendedShelter.name,
      distanceKm: context.recommendedShelter.distanceKm,
      availableCapacity: context.recommendedShelter.availableCapacity,
      occupancyRate: context.recommendedShelter.occupancyRate,
      address: context.recommendedShelter.address,
      reasons: context.recommendedShelter.reasons,
    } : null,
    alerts: context.activeAlerts,
    riskHotspots: context.riskZones?.map((z) => ({
      hazard: z.dominantHazard,
      level: z.riskLevel,
      score: z.riskScore,
    })),
    incidents: context.activeIncidents?.map((i) => ({
      title: i.title,
      severity: i.severity,
      location: i.location,
    })),
  });

  const promptMessages = [
    { role: 'system', content: `${systemInstruction}\n\nLIVE DISASTERCHAIN CONTEXT:\n${compactContextStr}` },
  ];

  if (Array.isArray(conversation)) {
    const recent = conversation.slice(-4);
    recent.forEach((m) => {
      if (m.role && m.content) {
        promptMessages.push({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: String(m.content).slice(0, 500),
        });
      }
    });
  }

  promptMessages.push({ role: 'user', content: String(message).slice(0, 1000) });

  // Call standard OpenAI-compatible or Gemini-compatible endpoint
  const endpoint = process.env.AI_API_ENDPOINT || 'https://api.openai.com/v1/chat/completions';
  const modelName = process.env.AI_MODEL_NAME || 'gpt-4o-mini';

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000); // 8 second timeout

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages: promptMessages,
        max_tokens: 600,
        temperature: 0.3,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(`External AI provider returned status ${response.status}`);
      return null;
    }

    const json = await response.json();
    const reply = json?.choices?.[0]?.message?.content;
    if (reply && typeof reply === 'string') {
      return reply.trim();
    }
  } catch (err) {
    clearTimeout(timeout);
    console.warn('External AI call failed or timed out, gracefully falling back to deterministic engine:', err.message);
  }

  return null;
}

/**
 * Main AI Assistant Orchestration Entrypoint
 */
async function processChat({ message, conversation = [], latitude = null, longitude = null, userRole = 'citizen', userId = null }) {
  const intentInfo = analyzeIntent(message);

  // Retrieve live context from MongoDB/memoryStore
  const context = await retrieveLiveContext(intentInfo, userRole, { latitude, longitude });

  // Check if live AI key exists
  let reply = null;
  let mode = 'LIMITED';

  if (process.env.AI_API_KEY && process.env.AI_API_KEY.trim().length > 0) {
    reply = await callExternalProvider(message, conversation, context, userRole);
    if (reply) {
      mode = 'LIVE';
    }
  }

  // Fallback to deterministic limited mode if no key or if external call failed
  const deterministic = generateDeterministicReply(message, intentInfo, context, userRole);
  if (!reply) {
    reply = deterministic.reply;
    mode = 'LIMITED';
  }

  // Derive relevant interactive action buttons
  const actions = deterministic.actions || [];

  return {
    reply,
    sources: context.sources.length > 0 ? context.sources : ['DisasterChain Safety Engine'],
    context: {
      mode,
      riskLevel: context.riskZones?.[0]?.riskLevel || 'NOMINAL',
      shelterName: context.recommendedShelter?.name || null,
      shelterDistanceKm: context.recommendedShelter?.distanceKm || null,
      activeAlertsCount: context.activeAlerts?.length || 0,
    },
    actions,
    isEmergency: intentInfo.isEmergency,
  };
}

module.exports = {
  processChat,
  analyzeIntent,
  retrieveLiveContext,
  generateDeterministicReply,
  PREPAREDNESS_GUIDES,
};
