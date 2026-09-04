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

// Supported Indian Regional Languages + English
const SUPPORTED_LANGUAGES = {
  en: 'English',
  hi: 'Hindi',
  bn: 'Bengali',
  te: 'Telugu',
  mr: 'Marathi',
  ta: 'Tamil',
  gu: 'Gujarati',
  kn: 'Kannada',
  ml: 'Malayalam',
  pa: 'Punjabi',
  or: 'Odia',
  as: 'Assamese',
  ur: 'Urdu',
  sa: 'Sanskrit',
  ne: 'Nepali',
  kok: 'Konkani',
  ks: 'Kashmiri',
  mai: 'Maithili',
  sd: 'Sindhi',
  mni: 'Manipuri',
};

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
  'crushed',
  'rubble',
  'chest pain',
  'severe hemorrhage',
  'hypothermia',
  'suffocating',
  'gas leak',
  'amputation',
  'in immediate danger',
  'water rising fast',
  // Indian regional life-threat keywords
  'मदद', 'बचाओ', 'सहायता', 'বাঁচাও', 'உதவி', 'காப்பாற்றுங்கள்',
  'సహాయం', 'కాపాడండి', 'मदत', 'વાંચવો', 'ಸಹಾಯ', 'രക്ഷിക്കൂ',
  'ਮਦਦ', 'ସାହାଯ୍ୟ', 'সহায়', 'مدد', 'रक्षतु', 'मद्दत', 'بچاؤ'
];

// Off-topic keywords to politely deflect back to disaster management
const OFF_TOPIC_KEYWORDS = [
  'joke',
  'jokes',
  'riddle',
  'poem',
  'poetry',
  'sing a song',
  'write a story',
  'recipe',
  'cooking recipe',
  'who won the match',
  'football score',
  'cricket score',
  'crypto',
  'bitcoin',
  'stock market',
  'dating advice',
  'movie review',
  'video game',
  'write code in python',
  'do my homework',
];

// Verified Fallback Preparedness Guides covering 15+ Disaster Types and Preparedness Topics
const PREPAREDNESS_GUIDES = {
  earthquake: {
    title: 'Earthquake Safety & Structural Collapse Protocols',
    immediate: 'DROP, COVER, and HOLD ON immediately under a sturdy desk or interior wall.',
    dos: [
      'Drop to hands and knees.',
      'Cover head and neck with arms or sturdy furniture.',
      'Hold on until shaking completely stops.',
      'Use stairs only when evacuating buildings.',
      'Expect and prepare for strong aftershocks.',
    ],
    donts: [
      'Do NOT use elevators during or after earthquakes.',
      'Do NOT run outside while ground shaking is active.',
      'Do NOT light matches or candles if gas leaks are suspected.',
      'Do NOT stand under glass windows, mirrors, or heavy lighting fixtures.',
    ],
    kit: [
      'Water (3L/person/day for 3 days)',
      'Battery-powered AM/FM radio with extra cells',
      'High-intensity LED flashlight & work gloves',
      'Emergency whistle for acoustic signaling',
      'Comprehensive first aid kit with tourniquets',
    ],
  },
  flood: {
    title: 'Flood & Rapid Waterlogging Response Protocols',
    immediate: 'Move immediately to higher floors or high ground. Turn off electricity mains.',
    dos: [
      'Move to higher ground or upper building levels.',
      'Shut off main electrical breakers and gas before water enters.',
      'Boil all drinking water or use chlorine purification tablets.',
      'Follow official evacuation alerts and designated safe corridors promptly.',
    ],
    donts: [
      'Do NOT walk through moving water currents (6 inches can knock an adult down).',
      'Do NOT drive into waterlogged roads, flooded dips, or underpasses ("Turn Around, Don\'t Drown").',
      'Do NOT touch submerged electronic equipment or fallen wires.',
      'Do NOT consume tap water until municipal safety is confirmed.',
    ],
    kit: [
      'Waterproof floating pouch for government ID, deeds & cash',
      'Chlorine water purification tablets or portable filter straw',
      'Non-perishable high-calorie food rations',
      'Portable mobile power bank with sealed waterproof cable',
      'High-visibility reflective life vest or floatation aid',
    ],
  },
  fire: {
    title: 'Fire Safety & Smoke Evacuation Protocols',
    immediate: 'CRAWL LOW under smoke toward the nearest fire exit. Feel door handles before opening.',
    dos: [
      'Crawl low under smoke where breathable oxygen remains.',
      'Feel door handles with the back of your hand before opening; if hot, keep closed.',
      'If clothes catch fire: STOP, DROP to the ground, and ROLL repeatedly.',
      'Evacuate immediately via designated fire exit stairwells.',
      'Close doors behind you to slow flame and smoke progression.',
    ],
    donts: [
      'Do NOT use elevators during a fire evacuation.',
      'Do NOT open doors that feel warm to the touch.',
      'Do NOT re-enter a burning building for any pets or belongings.',
      'Do NOT attempt to fight raging structural fires with basic domestic equipment.',
    ],
    kit: [
      'Emergency smoke escape hoods / certified N95 or P100 masks',
      'ABC dry chemical fire extinguisher',
      'Flame-retardant fiberglass fire blanket',
      'Sterile burn gel dressings and non-adherent bandages',
      'Heavy-duty leather work gloves',
    ],
  },
  cyclone: {
    title: 'Cyclone, Hurricane & Severe Windstorm Protocols',
    immediate: 'Remain indoors in an interior windowless room (bathroom or central corridor).',
    dos: [
      'Stay in central windowless interior rooms on lowest non-flooding level.',
      'Keep mobile phones in extreme battery-saving mode.',
      'Stockpile 5 to 7 days of non-perishable food and potable water.',
      'Secure loose outdoor objects, shutters, and roof sheets beforehand.',
      'Disconnect electrical appliances to avoid storm power surge damage.',
    ],
    donts: [
      'Do NOT venture outside during the calm "eye" of the storm (destructive reverse winds follow).',
      'Do NOT stand near large glass windows, french doors, or skylights.',
      'Do NOT park vehicles under large trees, utility towers, or metal hoardings.',
    ],
    kit: [
      'Transistor radio with extra batteries',
      'Heavy-duty waterproof tarpaulin & nylon cordage',
      'Prescription medicines for at least 7 to 14 days',
      'Multi-tool with wrench and pliers for emergency valve shutoff',
    ],
  },
  tsunami: {
    title: 'Tsunami & Coastal Surge Safety Protocols',
    immediate: 'If you feel strong coastal shaking or see sudden ocean recession, flee immediately to high ground (at least 30m above sea level or 3km inland).',
    dos: [
      'Immediately evacuate on foot to high ground or inland if near the coast.',
      'Seek vertical evacuation in upper floors of reinforced multi-story concrete buildings if high ground is unreachable.',
      'Stay inland until civil defense authorities declare the all-clear (tsunamis arrive in series of waves hours apart).',
    ],
    donts: [
      'Do NOT go to the shore or beach to watch waves or receding water.',
      'Do NOT return to low-lying coastal areas after the first wave.',
      'Do NOT use private cars if roads are bottlenecked; evacuate on foot.',
    ],
    kit: [
      'Compact emergency bug-out bag with water and rations',
      'Emergency thermal space blankets',
      'Waterproof whistle and strobe signaling light',
    ],
  },
  landslide: {
    title: 'Landslide & Mudflow Safety Protocols',
    immediate: 'If slope movement or loud rumbling is heard, evacuate immediately perpendicular to the slide path.',
    dos: [
      'Evacuate immediately if slope rumbling, cracking trees, or sudden muddy runoff occurs.',
      'Move sideways away from the path of the flow, seeking stable rock outcroppings or ridgelines.',
      'Curl into a tight protective ball and protect your head if caught indoors.',
    ],
    donts: [
      'Do NOT cross fresh mudflow channels or swollen mountain ravines.',
      'Do NOT remain near steep cliffs or unstable riverbanks during torrential rain.',
      'Do NOT build or stay in low-lying alluvial fans or debris drainage gullies.',
    ],
    kit: [
      'Sturdy hiking boots with ankle support',
      'Emergency high-visibility signaling vest',
      'Acoustic distress whistle and personal emergency beacon',
    ],
  },
  heatwave: {
    title: 'Extreme Heatwave & Hyperthermia Prevention Protocols',
    immediate: 'Stay in shaded or air-conditioned indoor areas. Hydrate frequently with oral rehydration salts.',
    dos: [
      'Drink plenty of cool water and ORS electrolytes even before feeling thirsty.',
      'Wear lightweight, loose-fitting, light-colored breathable cotton clothing.',
      'Sponge skin with cool wet towels if experiencing dizziness, headaches, or nausea.',
      'Keep curtains and shades closed during peak daytime hours to block solar radiation.',
    ],
    donts: [
      'Do NOT leave children, elderly persons, or pets inside parked vehicles for ANY amount of time.',
      'Do NOT engage in strenuous outdoor labor or exercise between 11 AM and 4 PM.',
      'Do NOT consume excessive alcohol, caffeinated energy drinks, or heavily sugary beverages.',
    ],
    kit: [
      'Oral Rehydration Salt (ORS) sachets and electrolyte powders',
      'Insulated double-walled cold-water container',
      'Broad-spectrum SPF 50+ sunscreen and wide-brimmed hat',
      'Digital medical thermometer and instant cold packs',
    ],
  },
  extreme_cold: {
    title: 'Extreme Cold, Blizzard & Hypothermia Protocols',
    immediate: 'Seek warm insulated shelter immediately. Layer clothing and protect extremities from frostbite.',
    dos: [
      'Dress in multiple loose, warm, moisture-wicking layers topped with a windproof outer shell.',
      'Cover head, face, neck, and hands (mittens are warmer than gloves).',
      'Keep indoor heating ventilated to prevent lethal carbon monoxide poisoning.',
      'Recognize early hypothermia symptoms: shivering, slurred speech, confusion, drowsiness.',
    ],
    donts: [
      'Do NOT use outdoor fuel generators or charcoal grills inside enclosed rooms or tents.',
      'Do NOT rub frostbitten skin or apply direct intense heat (use gentle warm water bath instead).',
      'Do NOT venture outside into whiteout conditions where orientation is lost within meters.',
    ],
    kit: [
      'Mylar thermal space blankets and zero-degree rated sleeping bags',
      'Hand and foot chemical thermal warmers',
      'Battery-powered carbon monoxide detector',
      'High-calorie energy bars and thermos flask',
    ],
  },
  storm: {
    title: 'Severe Thunderstorm & Gale Protocols',
    immediate: 'Take shelter inside a substantial building or fully enclosed metal vehicle immediately.',
    dos: [
      'Seek shelter in a solid enclosed structure away from windows.',
      'Unplug sensitive electronic devices and home entertainment systems.',
      'Secure patio furniture, trash bins, and sheet metal outside.',
    ],
    donts: [
      'Do NOT seek shelter under isolated trees, metal pavilions, or carports.',
      'Do NOT walk or drive through flooded roads or under passes.',
      'Do NOT use corded landline phones or touch plumbing fixtures during electrical storms.',
    ],
    kit: [
      'Emergency hand-crank emergency radio',
      'Sturdy wind-resistant umbrellas and rain ponchos',
      'Heavy-duty work gloves and flashlights',
    ],
  },
  lightning: {
    title: 'Lightning Strike & High-Voltage Surge Protocols',
    immediate: 'When thunder roars, go indoors! Seek an enclosed building or hard-topped vehicle immediately.',
    dos: [
      'Remember the 30/30 rule: go indoors if thunder occurs within 30 seconds of lightning; stay in for 30 minutes after last sound.',
      'If trapped outdoors in an open field: crouch low on the balls of your feet with heels together and head tucked ("lightning crouch").',
      'Administer immediate CPR to lightning strike victims (they do not carry electrical charge and are safe to touch).',
    ],
    donts: [
      'Do NOT lie flat on the ground (this increases ground current surface area).',
      'Do NOT hold tall metal poles, golf clubs, fishing rods, or metal umbrellas.',
      'Do NOT touch wired electronics, showers, or water faucets during active strikes.',
    ],
    kit: [
      'Battery-powered portable radio',
      'Emergency medical kit with CPR face shield',
      'Rubber-soled boots and non-conductive safety gear',
    ],
  },
  building_collapse: {
    title: 'Building Collapse & Structural Void Survival Protocols',
    immediate: 'If trapped under structural rubble: cover nose/mouth with cloth, conserve oxygen, tap rhythmically on pipes/walls.',
    dos: [
      'Protect your airway with clothing or handkerchief to avoid suffocating on pulverized concrete dust.',
      'Tap in rhythmic bursts of 3 on metal pipes, beams, or solid masonry to alert acoustic search sensors.',
      'Listen for rescue dog barks or responder hailing calls before shouting.',
      'Conserve flashlight batteries and body hydration.',
    ],
    donts: [
      'Do NOT light matches or lighters (gas leaks are widespread in structural collapse).',
      'Do NOT shout continuously (shouting exhausts oxygen and causes severe dust inhalation).',
      'Do NOT make erratic, violent movements that could trigger secondary collapse shifts.',
    ],
    kit: [
      'High-decibel rescue whistle',
      'Dust-filtering particulate mask (N95/KN95/P100)',
      'Miniature tactical penlight with strobe mode',
    ],
  },
  industrial_accident: {
    title: 'Industrial Plant Hazard & Vapor Cloud Protocols',
    immediate: 'Evacuate UPWIND and UPHILL from industrial facilities, or shelter-in-place sealing all doors/windows with tape.',
    dos: [
      'Determine wind direction and immediately evacuate upwind and crosswind of any visible vapor plume.',
      'If instructed to shelter-in-place: close all external windows, doors, and fireplace dampers; turn off HVAC and air intakes.',
      'Seal gaps around windows and doors with plastic sheeting and duct tape.',
    ],
    donts: [
      'Do NOT approach industrial factory perimeters or overturned chemical tank trucks.',
      'Do NOT touch unknown liquid puddles, vapor clouds, or residue.',
      'Do NOT inhale unknown vapors (cover face with a wet dense cloth if caught outdoors).',
    ],
    kit: [
      'Duct tape and heavy 4-mil plastic sheeting',
      'Activated carbon respirators or P100 chemical vapor masks',
      'Battery-operated emergency weather radio',
    ],
  },
  chemical_emergency: {
    title: 'Hazardous Chemical Leak & HAZMAT Inhalation Protocols',
    immediate: 'Immediately move crosswind and uphill away from chemical clouds. Remove contaminated clothing and rinse eyes.',
    dos: [
      'Move upwind and uphill away from the chemical source.',
      'If contaminated: cut off clothing rather than pulling over your head; flush skin/eyes with copious cool running water for 15 minutes.',
      'Cover airways with damp cloth or rated organic vapor filter.',
      'Report chemical release location to emergency dispatch (112/101/911).',
    ],
    donts: [
      'Do NOT walk into low-lying basins, basements, or ditches where heavy toxic gases pool.',
      'Do NOT rub contaminated eyes or open chemical-exposed skin violently.',
      'Do NOT reuse contaminated personal garments until cleared by HAZMAT decontamination.',
    ],
    kit: [
      'Emergency eye wash sterile saline solution (500ml x 2)',
      'Sealed chemical-resistant nitrile gloves',
      'Full-seal splash goggles and chemical protective apron',
    ],
  },
  road_accident: {
    title: 'Mass Casualty Traffic Collision & Extrication Protocols',
    immediate: 'Park your vehicle safely, turn on hazard blinkers, place warning triangles 50m behind, and call 112/911.',
    dos: [
      'Secure scene safety before approaching: turn off vehicle ignitions to prevent fuel tank ignition.',
      'Call emergency dispatch (112/101/911) with exact highway kilometer marker, direction of travel, and victim count.',
      'Check Airway, Breathing, and Circulation (ABC); apply direct firm pressure to severe bleeding.',
      'Keep injured persons warm and immobilize their cervical spine/neck.',
    ],
    donts: [
      'Do NOT move injured victims unless there is an imminent threat of vehicle fire or explosion.',
      'Do NOT remove a motorcyclist\'s crash helmet unless breathing is obstructed.',
      'Do NOT smoke or use open flames anywhere near vehicle accident scenes.',
    ],
    kit: [
      'Reflective breakdown warning triangles (pair)',
      'High-visibility safety vests for all vehicle occupants',
      'Automotive trauma first aid kit with shears and pressure dressings',
      'Seatbelt cutter and tempered glass window punch tool',
    ],
  },
  crowd_emergency: {
    title: 'Stampede & High-Density Crowd Crush Protocols',
    immediate: 'Keep on your feet! Adopt a boxer\'s stance with arms held across your chest to preserve breathing space.',
    dos: [
      'Keep your footing at all costs; if shoes come off, keep moving.',
      'Hold arms up in front of your chest like a boxer with elbows tucked to protect your rib cage and diaphragm from compressive asphyxiation.',
      'Move diagonally with the crowd flow toward the periphery rather than pushing straight ahead or resisting.',
      'If you fall down: curl into a fetal ball on your left side, tuck knees to chest, and wrap hands around your head and neck.',
    ],
    donts: [
      'Do NOT fight directly against the direction of surging crowd momentum.',
      'Do NOT stop to pick up dropped phones, wallets, or luggage.',
      'Do NOT scream or shout unnecessarily (preserves vital oxygen).',
    ],
    kit: [
      'Emergency acoustic whistle pinned to clothing collar',
      'Hands-free crossbody bag (avoid bulky backpacks that trap limbs in dense crowds)',
      'Physical identity card with emergency ICE phone contacts',
    ],
  },
  emergency_kit: {
    title: '72-Hour Disaster Survival & Bug-Out Bag Checklist',
    immediate: 'Keep one grab-and-go bag per person near your main exit door, refreshed every 6 months.',
    dos: [
      'Pack 3 liters of water per person per day for at least 3 days (9L minimum per person).',
      'Include ready-to-eat non-perishable high-protein foods (nuts, dried fruit, granola bars, MREs).',
      'Store digital copies of passports, land deeds, insurance policies, and IDs on an encrypted flash drive in a waterproof pouch.',
      'Include a 14-day supply of essential daily prescription medications and copies of medical prescriptions.',
    ],
    donts: [
      'Do NOT overpack heavy luxury items that make the bag impossible to carry on foot for 10 kilometers.',
      'Do NOT store expired foods or leaking alkaline batteries inside your go-bag.',
    ],
    kit: [
      'Water purification tablets & stainless steel canteen',
      'Multi-band NOAA weather radio with solar crank charging',
      'Tactical LED headlamp with extra lithium batteries',
      'Class 2 trauma first aid kit with clotting gauze',
      'Emergency Mylar bivvy sleeping bag',
      'Multi-tool, duct tape, and 550 military-spec paracord (15m)',
    ],
  },
  evacuation: {
    title: 'Evacuation Planning, Corridors & Assembly Zones',
    immediate: 'Follow civil defense evacuation orders immediately. Take your go-bag, lock your home, and take primary designated routes.',
    dos: [
      'Know at least two distinct evacuation routes out of your neighborhood.',
      'Designate an inland/out-of-zone assembly point where all family members agree to meet.',
      'Unplug home appliances and turn off main water and gas shutoff valves before leaving.',
      'Leave a note on your door stating the time and destination of your evacuation for emergency responders.',
    ],
    donts: [
      'Do NOT delay evacuation until floodwaters or wildfire flames are visible at your doorstep.',
      'Do NOT take hazardous shortcuts through unknown flooded dirt roads or forested trails.',
    ],
    kit: [
      'Physical laminated road map of your county/district (GPS towers fail in major disasters)',
      'Comfortable broken-in walking shoes',
      'Cash in small denominations ($1, $5, $10 / ₹50, ₹100, ₹500 bills)',
    ],
  },
  communication: {
    title: 'Emergency Family Communications & Contact Plans',
    immediate: 'Use text messages (SMS) instead of voice calls during disaster grid overload. Keep calls under 10 seconds.',
    dos: [
      'Designate an out-of-state/out-of-district contact person that all family members text during an emergency.',
      'Send SMS rather than voice calls; text packets slip through congested cellular towers when voice circuits are busy.',
      'Conserve phone battery: switch to extreme battery saver, dim screen, disable Bluetooth/Wi-Fi scanning.',
    ],
    donts: [
      'Do NOT tie up emergency phone lines (112/911) with routine questions about power outages or weather updates.',
      'Do NOT spread unverified rumors or social media claims that create panic.',
    ],
    kit: [
      'Heavy-duty 20,000mAh external battery power bank',
      'Paper card with important phone numbers written in waterproof ink',
      'Analog emergency AM/FM receiver',
    ],
  },
  first_aid: {
    title: 'Critical Emergency First Aid & Trauma Management',
    immediate: 'For severe bleeding: apply direct, firm, uninterrupted pressure with clean cloth or apply a commercial tourniquet 2-3 inches above wound.',
    dos: [
      'Direct pressure stops 90% of bleeding: press hard directly on the wound without lifting dressing to peek.',
      'For unresponsive victim not breathing normally: start chest compressions immediately (100-120 beats/min to the beat of "Stayin\' Alive").',
      'For burns: cool immediately with clean running tap water for 10-20 minutes; cover loosely with sterile cling wrap.',
      'Keep trauma victims warm with blankets to prevent lethal hypothermic shock.',
    ],
    donts: [
      'Do NOT apply butter, toothpaste, grease, or ice directly to burn wounds.',
      'Do NOT remove an impaled object (knife, rebar, glass) from a wound; stabilize it in place with bulky bandages.',
      'Do NOT give food or drink to an unconscious or severely bleeding trauma patient awaiting surgery.',
    ],
    kit: [
      'Combat Application Tourniquet (CAT)',
      'Hemostatic clotting gauze dressings (QuikClot / Celox)',
      'Elastic pressure bandages (Israeli bandage)',
      'Sterile burn dressings and hydrogel',
      'CPR face mask with one-way valve',
    ],
  },
  power_outage: {
    title: 'Extended Power Outage & Utility Shutoff Protocols',
    immediate: 'Keep refrigerator/freezer doors closed. Disconnect sensitive electronics to prevent power surge fires.',
    dos: [
      'Keep refrigerator closed (food stays cold for 4 hours; full freezer for 48 hours if unopened).',
      'If you smell rotten eggs (mercaptan) indicating gas: evacuate immediately on foot without touching light switches, and turn off external gas valve.',
      'Operate portable fuel generators exclusively OUTDOORS at least 20 feet away from windows, doors, and vents.',
      'Know the exact location of your main water shutoff valve and electrical breaker panel.',
    ],
    donts: [
      'Do NOT run generators inside garages, basements, or enclosed porches (carbon monoxide is colorless and odorless).',
      'Do NOT use gas stoves, ovens, or open fire pits to heat interior rooms.',
      'Do NOT leave candles unattended; use battery LED lanterns instead.',
    ],
    kit: [
      'Battery LED lanterns and magnetic work lights',
      'Crescent wrench for manual gas/water meter valve shutoff',
      'Battery-powered carbon monoxide detector with digital PPM display',
    ],
  },
  vulnerable_care: {
    title: 'Vulnerable Population & Pet Disaster Preparedness',
    immediate: 'Maintain a 14-day supply of specialty medicines, medical device backup batteries, and secure pet carriers.',
    dos: [
      'Create a neighborhood buddy network to assist elderly residents and those with limited mobility during evacuations.',
      'Prepare portable battery power backups for oxygen concentrators, CPAP machines, and dialysis monitors.',
      'Ensure pets have microchips, secure carriers, leashes, and 7 days of canned food/water.',
      'Pack comfort items and familiar sensory soothing toys for young children and neurodivergent family members.',
    ],
    donts: [
      'Do NOT leave companion animals chained or caged indoors during an evacuation.',
      'Do NOT forget specialty infant formula, diapers, or pediatric fever medications in go-bags.',
    ],
    kit: [
      'Collapsible pet travel crates, harnesses & vaccination records',
      'Heavy-duty battery power station for medical devices',
      '14-day supply of pediatric and geriatric maintenance medicines',
      'Manual wheelchair tire pump and emergency repair patch kit',
    ],
  },
};

/**
 * Safe internal accessors for DisasterChain live telemetry
 */
async function getActiveSOS(userRole = 'citizen') {
  let raw = [];
  if (isDbConnected()) {
    raw = await SosRequest.find({ status: { $nin: ['Resolved', 'Cancelled'] } }).sort({ createdAt: -1 }).limit(20).lean();
  } else {
    raw = (memoryStore.sosRequests || []).filter((s) => s.status !== 'Resolved' && s.status !== 'Cancelled').slice(0, 20);
  }

  return raw.map((s) => ({
    id: s._id || s.id,
    emergencyType: s.emergencyType,
    severity: s.severity,
    location: s.location,
    status: s.status,
    peopleAffected: s.peopleAffected,
    createdAt: s.createdAt,
    contact: userRole === 'citizen' ? undefined : s.contact,
    reporterName: userRole === 'citizen' ? undefined : s.name,
  }));
}

async function getShelters(coordinates = null, userRole = 'citizen') {
  let raw = [];
  if (isDbConnected()) {
    raw = await Shelter.find({}).lean();
  } else {
    raw = memoryStore.shelters || [];
  }

  const queryLat = coordinates?.latitude ?? (coordinates?.lat != null ? Number(coordinates.lat) : 28.6139);
  const queryLon = coordinates?.longitude ?? (coordinates?.lng != null ? Number(coordinates.lng) : 77.2090);

  const best = recommendBestShelter(queryLat, queryLon, raw);
  const sanitizedBest = best ? sanitizeShelterForRole(best, userRole) : null;

  const sanitizedList = raw.map((sh) => sanitizeShelterForRole(sh, userRole));

  return {
    best: sanitizedBest,
    all: sanitizedList,
    totalCount: raw.length,
  };
}

async function getIncidents(userRole = 'citizen') {
  let raw = [];
  if (isDbConnected()) {
    raw = await Incident.find({ status: { $nin: ['Resolved', 'Rejected'] } }).sort({ createdAt: -1 }).limit(10).lean();
  } else {
    raw = (memoryStore.incidents || []).filter((i) => i.status !== 'Resolved' && i.status !== 'Rejected').slice(0, 10);
  }

  return raw.map((i) => ({
    id: i._id || i.id,
    title: i.title,
    severity: i.severity,
    type: i.type,
    location: i.location,
    status: i.status,
    reporterName: userRole === 'citizen' ? undefined : i.reporterName,
  }));
}

async function getAffectedAreas() {
  if (isDbConnected()) {
    return await AffectedArea.find({}).lean();
  }
  return memoryStore.affectedAreas || [];
}

async function getRiskHeatmap(userRole = 'citizen') {
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

  const summary = {
    totalZones: sanitizedZones.length,
    criticalZones: sanitizedZones.filter((z) => z.riskLevel === 'CRITICAL').length,
    highZones: sanitizedZones.filter((z) => z.riskLevel === 'HIGH').length,
    mediumZones: sanitizedZones.filter((z) => z.riskLevel === 'MEDIUM').length,
    lowZones: sanitizedZones.filter((z) => z.riskLevel === 'LOW').length,
    highestRiskScore: sanitizedZones.length > 0 ? Math.max(...sanitizedZones.map((z) => z.riskScore || 0)) : 0,
  };

  return {
    summary,
    zones: sanitizedZones,
    activeSosCount: rawSos.length,
  };
}

async function getActiveIntelligence() {
  const [sos, incidents, areas] = await Promise.all([
    getActiveSOS('responder'),
    getIncidents('responder'),
    getAffectedAreas(),
  ]);

  return {
    activeSosCount: sos.length,
    activeIncidentsCount: incidents.length,
    monitoredAreasCount: areas.length,
    systemStatus: 'ACTIVE_SURVEILLANCE',
  };
}

async function getResources(userRole = 'citizen') {
  let raw = [];
  if (isDbConnected()) {
    raw = await Resource.find({}).limit(10).lean();
  } else {
    raw = (memoryStore.resources || []).slice(0, 10);
  }

  return raw.map((r) => ({
    name: r.name,
    type: r.type,
    status: r.status,
    address: r.address,
    phone: userRole === 'citizen' ? undefined : r.phone,
  }));
}

async function getAlerts() {
  let raw = [];
  if (isDbConnected()) {
    raw = await Alert.find({ status: { $ne: 'Expired' } }).sort({ createdAt: -1 }).limit(10).lean();
  } else {
    raw = (memoryStore.alerts || []).filter((a) => a.status !== 'Expired').slice(0, 10);
  }

  return raw.map((a) => ({
    id: a._id || a.id,
    title: a.title,
    severity: a.severity,
    location: a.location,
    type: a.type,
  }));
}

function getPreparednessGuides() {
  return PREPAREDNESS_GUIDES;
}

/**
 * Detects user intent and category from incoming message string
 */
function analyzeIntent(message) {
  const text = (message || '').toLowerCase();

  const isEmergency = EMERGENCY_KEYWORDS.some((kw) => text.includes(kw));

  // Check for explicit confirmation of SOS creation
  const isSosConfirmation = /\b(yes,? create sos|create sos|yes,? please create sos|send help now|trigger sos|broadcast sos|confirm sos)\b/i.test(text);

  let primaryIntent = 'general';
  let dataCategory = 'GUIDANCE';

  if (/\b(brief|situation|summary|overview|status report|sitrep)\b|स्थिति|সারাংশ|சுருக்கம்|పరిస్థితి|अहवाल|સંક્ષિપ્ત/i.test(text)) {
    primaryIntent = 'situation_brief';
    dataCategory = 'LIVE_DATA';
  } else if (/\b(shelters?|beds?|safe havens?|refuges?|evac centers?|where to sleep)\b|आश्रय|আশ্রয়|புகலிடம்|ఆశ్రయం|निवारा|આશ્રય|ಆಶ್ರಯ|അഭയകേന്ദ്രം|ਆਸਰਾ|ଆଶ୍ରୟ|پناہ گاہ/i.test(text)) {
    primaryIntent = 'shelter';
    dataCategory = 'LIVE_DATA';
  } else if (/\b(risks?|hazards?|dangers?|threats?|heat maps?|vulnerab)\b|जोखिम|বিপদ|ஆபத்து|ప్రమాదం|धोका|જોખમ|ಅಪಾಯ|അപകടം|ਖ਼ਤਰਾ|ବିପଦ|خطرہ/i.test(text)) {
    primaryIntent = 'risk';
    dataCategory = 'LIVE_DATA';
  } else if (/\b(alerts?|warnings?|advisories|advisory|sirens?|evacuations?)\b|चेतावनी|সতর্কতা|எச்சரிக்கை|హెచ్చరిక|इशारा|ચેતવણી|ಎಚ್ಚರಿಕೆ|മുന്നറിയിപ്പ്|ਚੇਤਾਵਨੀ|ଚେତାବନୀ|وارننگ/i.test(text)) {
    primaryIntent = 'alert';
    dataCategory = 'LIVE_DATA';
  } else if (/\b(incidents?|reports?|fires?|floods?|accidents?|collapsed|leaks?)\b/i.test(text) && !/what should|how to|क्या करना/i.test(text)) {
    primaryIntent = 'incident';
    dataCategory = 'LIVE_DATA';
  } else if (/\b(resources?|supplies|supply|water|food|medical kit|rations?|blankets?)\b/i.test(text) && !/what should|how to|emergency kit/i.test(text)) {
    primaryIntent = 'resource';
    dataCategory = 'LIVE_DATA';
  } else if (/\b(what should|how do|how to|prepare|emergency kit|protocol|safety tip|checklist|first aid|cpr|evacuat|guideline|dos and donts)\b|क्या करना|কী করা|என்ன செய்ய|ఏమి చేయాలి|काय करावे|શું કરવું|ಏನು ಮಾಡಬೇಕು|എന്ത് ചെയ്യണം|ਕੀ ਕਰਨਾ|କଣ କରିବା|কি কৰা|کیا کرنا/i.test(text)) {
    primaryIntent = 'preparedness';
    dataCategory = 'GUIDANCE';
  }

  // Detect specific disaster type or topic for preparedness
  let disasterType = null;
  if (/earthquake|tremor|quake|भूकंप|ഭൂകമ്പ|நிலநடுக்க|భూకంప|ভূমিকম্প|ધરતીકંપ|ಭೂಕಂಪ|زلزلہ|ভূঁইকঁপ|भुकम्प/i.test(text)) disasterType = 'earthquake';
  else if (/tsunami|coastal surge|सुनामी|சுனாமி|సునామీ|સુનામી|ਤਸੁਨਾਮੀ/i.test(text)) disasterType = 'tsunami';
  else if (/flood|waterlog|drown|rising water|बाढ़|বন্যা|வெள்ளம்|వరద|पूर|પૂર|ಪ್ರವಾಹ|വെള്ളപ്പൊക്കം|ਹੜ੍ਹ|ବନ୍ୟା|বানপানী|سیلاب/i.test(text)) disasterType = 'flood';
  else if (/wildfire|forest fire|flame|smoke|fire|आग|আগুন|தீ|మంటలు|આગ|ಬೆಂಕಿ|തീ|ਅੱਗ|ନିଆଁ|জুই|آگ|अग्नि/i.test(text)) disasterType = 'fire';
  else if (/cyclone|hurricane|storm|typhoon|gale|चक्रवात|ঘূর্ণিঝড়|புயல்|తుఫాను|वादळ|વાવાઝોડું|ಚಂಡಮಾರುತ|ചുഴലിക്കാറ്റ്|ਤੂਫ਼ਾਨ|ବାତ୍ୟା|طوفان/i.test(text)) disasterType = 'cyclone';
  else if (/landslide|mudslide|mudflow|भूस्खलन|ভূমিধস|நிலச்சரிவு|కొండచరియలు|ધરતીધસારો|ಭೂಕುସಿತ/i.test(text)) disasterType = 'landslide';
  else if (/heatwave|heat stroke|hyperthermia|hot weather|लू|উষ্ণপ্রবাহ|வெப்ப அலை|వడగాల్పులు|उष्णतेची लाट/i.test(text)) disasterType = 'heatwave';
  else if (/cold|blizzard|frostbite|hypothermia|winter storm|snow|शीतलहर|ठंड/i.test(text)) disasterType = 'extreme_cold';
  else if (/lightning|thunder|आकाशीय बिजली|বজ্রপাত|மின்னல்|పిడుగు|વીજળી/i.test(text)) disasterType = 'lightning';
  else if (/collapse|rubble|structural failure|building collapse|इमारत गिरना|ভাঙন/i.test(text)) disasterType = 'building_collapse';
  else if (/industrial|chemical|toxic|hazmat|gas leak|vapor cloud|गैस रिसाव|গ্যাস লিক/i.test(text)) disasterType = 'chemical_emergency';
  else if (/traffic|car crash|pileup|road accident|collision|दुर्घटना|দুর্ঘটনা|விபத்து|ప్రమాదం/i.test(text)) disasterType = 'road_accident';
  else if (/stampede|crowd crush|crush|crowd|भगदड़|পদদলিত/i.test(text)) disasterType = 'crowd_emergency';
  else if (/kit|bag|supplies|72 hour|go bag/i.test(text)) disasterType = 'emergency_kit';
  else if (/evacuat|निकासी|উদ্ধার|வெளியேற்றம்|తరలింపు/i.test(text)) disasterType = 'evacuation';
  else if (/first aid|cpr|bleeding|tourniquet|bandage|प्राथमिक उपचार|প্রাথমিক চিকিৎসা|முதலுதவி|ప్రథమ చికిత్స/i.test(text)) disasterType = 'first_aid';
  else if (/power outage|blackout|gas shutoff|electricity shutoff/i.test(text)) disasterType = 'power_outage';
  else if (/\b(elderly|infant|infants|baby|babies|pets? evacuation|pet care|service animals?|disabled|wheelchairs?)\b/i.test(text)) disasterType = 'vulnerable_care';

  if (disasterType && primaryIntent === 'general') {
    primaryIntent = 'preparedness';
    dataCategory = 'GUIDANCE';
  }

  // Detect completely off-topic queries (jokes, poems, games, chit-chat)
  const hasOffTopicKeyword = OFF_TOPIC_KEYWORDS.some((kw) => text.includes(kw));
  if (hasOffTopicKeyword && !isEmergency) {
    primaryIntent = 'off_topic';
    dataCategory = 'GUIDANCE';
    disasterType = null;
  }

  if (isEmergency) {
    dataCategory = 'EMERGENCY';
  }

  return {
    isEmergency,
    isSosConfirmation,
    primaryIntent,
    disasterType,
    dataCategory,
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
        id: a._id || a.id,
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
      const riskData = await getRiskHeatmap(userRole);
      context.activeSosCount = riskData.activeSosCount;
      context.riskSummary = riskData.summary;
      context.riskZones = riskData.zones.slice(0, 3);
      context.sources.push('Risk Intelligence Heatmap');
    }

    // 4. Fetch Incidents if needed
    if (intentInfo.primaryIntent === 'incident' || intentInfo.primaryIntent === 'situation_brief') {
      context.activeIncidents = await getIncidents(userRole);
      context.sources.push('Field Incident Logs');
    }

    // 5. Fetch Resources if needed
    if (intentInfo.primaryIntent === 'resource') {
      context.resources = await getResources(userRole);
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

const REGIONAL_EMERGENCY_HEADINGS = {
  hi: '⚠️ **तत्काल खतरा पहचाना गया — स्थानीय आपातकालीन सेवाएँ (112 / 101) डायल करें।**',
  bn: '⚠️ **জরুরী বিপদ শনাক্ত হয়েছে — জরুরী পরিষেবা (112 / 101) ডায়াল করুন।**',
  te: '⚠️ **తక్షణ ప్రమాదం గుర్తించబడింది — అత్యవసర సేవలను (112 / 101) డయల్ చేయండి.**',
  mr: '⚠️ **तात्काळ धोका आढळला — स्थानिक आपत्कालीन सेवांना (112 / 101) कॉल करा.**',
  ta: '⚠️ **உடனடி ஆபத்து கண்டறியப்பட்டது — அவசர சேவைகளை (112 / 101) அழைக்கவும்.**',
  gu: '⚠️ **ત્વરિત જોખમ જણાયું — સ્થાનિક ઈમરજન્સી સેવાઓને (112 / 101) કૉલ કરો.**',
  kn: '⚠️ **ತಕ್ಷಣದ ಅಪಾಯ ಪತ್ತೆಯಾಗಿದೆ — ತುರ್ತು ಸೇವೆಗಳಿಗೆ (112 / 101) ಕರೆ ಮಾಡಿ.**',
  ml: '⚠️ **അടിയന്തിര അപകടം കണ്ടെത്തി — അടിയന്തിര സേവനങ്ങളിലേക്ക് (112 / 101) വിളിക്കുക.**',
  pa: '⚠️ **ਤੁਰੰਤ ਖ਼ਤਰਾ ਪਛਾਣਿਆ ਗਿਆ — ਐਮਰਜੈਂਸੀ ਸੇਵਾਵਾਂ (112 / 101) ਨੂੰ ਕਾਲ ਕਰੋ।**',
  or: '⚠️ **ତୁରନ୍ତ ବିପଦ ଚିହ୍ନଟ ହୋଇଛି — ଜରୁରୀକାଳୀନ ସେବା (112 / 101) କଲ୍ କରନ୍ତୁ।**',
  as: '⚠️ **তাৎক্ষণিক বিপদ ধৰা পৰিছে — জৰুৰীকালীন সেৱা (112 / 101) লৈ কল কৰক।**',
  ur: '⚠️ **فوری خطرہ محسوس کیا گیا — ایمرجنسی سروسز (112 / 101) پر کال کریں۔**',
  sa: '⚠️ **आसन्नसंकटः ज्ञातः — आपातकालीनसेवायै (112 / 101) सम्पर्कं कुर्वन्तु।**',
  ne: '⚠️ **तत्काल खतरा पहिचान गरियो — आपतकालीन सेवाहरू (112 / 101) कल गर्नुहोस्।**',
  kok: '⚠️ **तात्काळ धोको मेळ्ळो — आपत्कालीन सेवांक (112 / 101) फोन करात.**',
  ks: '⚠️ **فوری خطرٕ آو لبنہٕ — ایمرجنسی سروسز (112 / 101) رابطہ کٔریو۔**',
  mai: '⚠️ **तत्काल खतरा पहचानल गेल — आपातकालीन सेवा (112 / 101) केँ फोन करू।**',
  sd: '⚠️ **فوري خطرو درپيش آهي — هنگامي خدمتن (112 / 101) کي ڪال ڪريو۔**',
  mni: '⚠️ **খুদোইথিবা থেংনরে — ইমার্জেন্সী সর্ভিসেসশিংদা (112 / 101) কোল তৌবিয়ু।**',
};

const REGIONAL_SHELTER_HEADINGS = {
  hi: '🏛️ **निकटतम सुरक्षित आश्रय अनुशंसा**',
  bn: '🏛️ **নিকটবর্তী নিরাপদ আশ্রয় সুপারিশ**',
  te: '🏛️ **సమీప సురక్షిత ఆశ్రయ సిఫార్సు**',
  mr: '🏛️ **जवळचे सुरक्षित निवारा शिफारस**',
  ta: '🏛️ **அருகிலுள்ள பாதுகாப்பான புகலிட பரிந்துரை**',
  gu: '🏛️ **નજીકના સુરક્ષિત આશ્રયની ભલામણ**',
  kn: '🏛️ **ಹತ್ತಿರದ ಸುರಕ್ಷಿತ ಆಶ್ರಯ ಶಿಫಾರಸು**',
  ml: '🏛️ **അടുത്തുള്ള സുരക്ഷിത അഭയകേന്ദ്ര ശുപാർശ**',
  pa: '🏛️ **ਨੇੜਲੇ ਸੁਰੱਖਿਅਤ ਆਸਰੇ ਦੀ ਸਿਫ਼ਾਰਸ਼**',
  or: '🏛️ **ନିକଟବର୍ତ୍ତୀ ସୁରକ୍ଷିତ ଆଶ୍ରୟ ସୁପାରିଶ**',
  as: '🏛️ **নিকটৱৰ্তী সুৰক্ষিত আশ্ৰয় পৰামৰ্শ**',
  ur: '🏛️ **قریبی محفوظ پناہ گاہ کی تجویز**',
  sa: '🏛️ **निकटस्थं सुरक्षितम् आश्रयम्**',
  ne: '🏛️ **नजिकको सुरक्षित आश्रय सिफारिस**',
  kok: '🏛️ **लागचो सुरक्षीत निवारा शिफारस**',
  ks: '🏛️ **نزدیٖک مَحفوظ پناہ گاہ**',
  mai: '🏛️ **नजदीकी सुरक्षित आश्रय सिफारिश**',
  sd: '🏛️ **ويجهي محفوظ پناهه گاهه جي سفارش**',
  mni: '🏛️ **নাকনবা শেফ শেল্টার রিকমেন্দেসন**',
};

/**
 * Builds safe deterministic response in ASSISTANT LIMITED MODE
 */
function generateDeterministicReply(message, intentInfo, context, userRole, language = 'en') {
  const actions = [];
  let reply = '';
  const lang = (language || 'en').toLowerCase();
  const emergencyHeading = REGIONAL_EMERGENCY_HEADINGS[lang];
  const shelterHeading = REGIONAL_SHELTER_HEADINGS[lang];

  // 1. Immediate Life-Threatening Situation
  if (intentInfo.isEmergency) {
    const regionalBanner = emergencyHeading ? `${emergencyHeading}\n\n` : '';
    reply = `${regionalBanner}⚠️ **IMMEDIATE DANGER DETECTED**\n\n` +
      `**1. Call Local Emergency Services Immediately (Dial 112 / 101 / 911).**\n` +
      `**2. If trapped or requiring rapid extraction, trigger your DisasterChain Emergency SOS Beacon below.**\n\n` +
      `**Essential Immediate Actions:**\n` +
      `• Protect your airway from smoke or floodwaters.\n` +
      `• Do not attempt to cross moving currents or re-enter structurally compromised buildings.\n` +
      `• Keep your mobile device in battery-saver mode with GPS enabled.\n\n` +
      `*Do you want me to create an SOS distress signal with your current location for regional emergency responders?*`;

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

    return { reply, actions, isEmergency: true, dataCategory: 'EMERGENCY' };
  }

  // 1b. SOS Confirmation Handling
  if (intentInfo.isSosConfirmation) {
    reply = `🚨 **EMERGENCY SOS SIGNAL CONFIRMED**\n\n` +
      `Your emergency distress request has been registered for transmission to the DisasterChain Responder Network.\n\n` +
      `**Immediate Safety Instructions:**\n` +
      `1. Dial **112 / 911** on your phone if reachable.\n` +
      `2. Stay in a protected location, elevate your position above rising water, or protect against smoke.\n` +
      `3. Keep your phone screen low to save power and keep GPS enabled.`;

    actions.push({
      type: 'TRIGGER_SOS',
      label: '🚨 OPEN SOS DISPATCH BEACON',
    });

    return { reply, actions, isEmergency: true, dataCategory: 'EMERGENCY' };
  }

  // 2. Off-Topic Query Deflection
  if (intentInfo.primaryIntent === 'off_topic') {
    reply = `🛡️ **DisasterChain Emergency Intelligence Assistant**\n\n` +
      `I am dedicated strictly to **disaster response, operational intelligence, and human life safety protocols**.\n\n` +
      `To ensure crisis availability, I cannot assist with entertainment, casual chat, or unrelated tasks.\n\n` +
      `**I can immediately assist you with:**\n` +
      `• 🏛️ Finding nearby shelters with live bed capacities\n` +
      `• 📢 Checking active civil defense alerts and weather advisories\n` +
      `• 🔥 Analyzing regional hazard scores and risk zones\n` +
      `• 📦 72-Hour emergency supply checklists & evacuation protocols\n` +
      `• 🚨 Emergency first aid and SOS distress broadcasting`;

    actions.push({
      type: 'QUICK_QUERY',
      label: 'FIND SHELTER',
      query: 'Where is the nearest safe shelter?',
    });
    actions.push({
      type: 'QUICK_QUERY',
      label: 'ACTIVE ALERTS',
      query: 'What are the active emergency alerts?',
    });

    return { reply, actions, isEmergency: false, dataCategory: 'GUIDANCE' };
  }

  // 3. Shelter Intent
  if (intentInfo.primaryIntent === 'shelter') {
    if (context.recommendedShelter) {
      const sh = context.recommendedShelter;
      const regionalBanner = shelterHeading ? `${shelterHeading}\n\n` : '';
      reply = `${regionalBanner}🏛️ **Optimal Safe Haven Recommendation**\n\n` +
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
    return { reply, actions, isEmergency: false, dataCategory: 'LIVE_DATA' };
  }

  // 4. Risk / Hazard Intent
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

    return { reply, actions, isEmergency: false, dataCategory: 'LIVE_DATA' };
  }

  // 5. Alert Intent
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

    return { reply, actions, isEmergency: false, dataCategory: 'LIVE_DATA' };
  }

  // 6. Incident Intent
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

    return { reply, actions, isEmergency: false, dataCategory: 'LIVE_DATA' };
  }

  // 7. Situation Brief for Responders / Admins
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

    return { reply, actions, isEmergency: false, dataCategory: 'LIVE_DATA' };
  }

  // 8. Preparedness Intent
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

    return { reply, actions, isEmergency: false, dataCategory: 'GUIDANCE' };
  }

  // 9. General / Fallback
  reply = `Greetings. I am the **DisasterChain AI Emergency Assistant**.\n\n` +
    `I provide real-time situational awareness and verified safety guidance directly from the DisasterChain network.\n\n` +
    `**How I can assist you right now:**\n` +
    `• 🏛️ **"Find nearest shelter"** — Locates optimal safe havens with live bed counts\n` +
    `• 📢 **"Current alerts"** — Summarizes active civil defense and weather advisories\n` +
    `• 🔥 **"Explain my risk"** — Analyzes regional hazard scores and risk zones\n` +
    `• 🛡️ **"What should I do during an earthquake/flood?"** — Step-by-step life safety guides\n` +
    `• 📦 **"Emergency kit checklist"** — 72-hour survival supplies & family planning\n` +
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

  return { reply, actions, isEmergency: false, dataCategory: 'GUIDANCE' };
}

/**
 * Generates an AI response using an external LLM provider if AI_API_KEY is configured
 */
async function callExternalProvider(message, conversation, context, userRole, language = 'en') {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    return null;
  }

  const langName = SUPPORTED_LANGUAGES[language] || 'English';

  const systemInstruction = `You are DISASTERCHAIN AI ASSISTANT, an emergency operations intelligence & safety assistant for the DisasterChain disaster management platform.
Your visual theme is Warm Crisis Command.
Your top priority is human life safety.
Follow these strict policies:
1. Prioritize human safety above all else. If immediate life threat is detected, immediately instruct calling local emergency services (112, 101, or 911) and ask if they want to create an SOS signal.
2. Never pretend to be human emergency dispatchers or claim you have dispatched responders unless confirmed in system data. Never invent operational data (shelters, bed numbers, incident counts, hazard scores, coordinates).
3. Use the provided LIVE DISASTERCHAIN CONTEXT for all facts, numbers, shelter capacities, and risk levels. If data is not in context, state clearly that it is not in the live registry.
4. Keep emergency guidance concise, clear, and actionable. Use bullet points and bold formatting for critical steps.
5. User role: ${userRole}. Do not expose private contact information, personal victim phone numbers, or reporter identities to unauthorized roles.
6. Clearly distinguish between live system data and general safety guidance.
7. If the user asks an off-topic question (jokes, poems, sports, coding), politely deflect back to disaster preparedness and safety operations.
8. Language Requirement: The user's active UI language is ${langName} (code: "${language}"). Provide your response in ${langName}. However, DO NOT alter, fabricate, or distort critical numeric values, emergency phone numbers (112, 101, 911), coordinates, or capacity figures.`;

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
    activeSosCount: context.activeSosCount,
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
async function processChat({ message, conversation = [], latitude = null, longitude = null, userRole = 'citizen', userId = null, language = 'en' }) {
  const intentInfo = analyzeIntent(message);

  // Retrieve live context from MongoDB/memoryStore
  const context = await retrieveLiveContext(intentInfo, userRole, { latitude, longitude });

  // Check if live AI key exists
  let reply = null;
  let mode = 'LIMITED';

  if (process.env.AI_API_KEY && process.env.AI_API_KEY.trim().length > 0) {
    reply = await callExternalProvider(message, conversation, context, userRole, language);
    if (reply) {
      mode = 'LIVE';
    }
  }

  // Fallback to deterministic limited mode if no key or if external call failed
  const deterministic = generateDeterministicReply(message, intentInfo, context, userRole, language);
  if (!reply) {
    reply = deterministic.reply;
    mode = 'LIMITED';
  }

  // Derive relevant interactive action buttons
  const actions = deterministic.actions || [];

  return {
    reply,
    language: SUPPORTED_LANGUAGES[language] ? language : 'en',
    sources: context.sources.length > 0 ? context.sources : ['DisasterChain Safety Engine'],
    context: {
      mode,
      riskLevel: context.riskZones?.[0]?.riskLevel || 'NOMINAL',
      shelterName: context.recommendedShelter?.name || null,
      shelterDistanceKm: context.recommendedShelter?.distanceKm || null,
      activeAlertsCount: context.activeAlerts?.length || 0,
      activeSosCount: context.activeSosCount || 0,
    },
    actions,
    isEmergency: intentInfo.isEmergency,
    dataCategory: deterministic.dataCategory || intentInfo.dataCategory || 'GUIDANCE',
    liveStats: {
      activeSos: context.activeSosCount || 0,
      activeAlerts: context.activeAlerts?.length || 0,
      activeIncidents: context.activeIncidents?.length || 0,
    },
    actionRequired: intentInfo.isEmergency ? 'SOS_CONFIRMATION' : null,
  };
}

module.exports = {
  processChat,
  analyzeIntent,
  retrieveLiveContext,
  generateDeterministicReply,
  PREPAREDNESS_GUIDES,
  SUPPORTED_LANGUAGES,
  // Safe internal accessors
  getActiveSOS,
  getShelters,
  getIncidents,
  getAffectedAreas,
  getRiskHeatmap,
  getActiveIntelligence,
  getResources,
  getAlerts,
  getPreparednessGuides,
};
