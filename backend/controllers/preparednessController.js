const mongoose = require('mongoose');
const Preparedness = require('../models/Preparedness');

const defaultPreparedness = [
  {
    disasterType: 'Earthquake',
    title: 'Earthquake Safety & Structural Collapse Protocols',
    description: 'Vital actions for tremors, structural shocks, evacuation safety, and aftershocks.',
    icon: '🏚️',
    before: [
      'Fasten heavy furniture, cupboards, and water heaters securely to wall studs.',
      'Identify safe spots in each room: under sturdy desks, tables, or against interior walls.',
      'Keep an emergency go-bag accessible with flashlight, first aid, water, and emergency whistle.',
      'Practice "Drop, Cover, and Hold On" drills with family and roommates.',
    ],
    during: [
      'DROP down onto your hands and knees immediately.',
      'COVER your head and neck under a sturdy table or desk.',
      'HOLD ON to your shelter until shaking completely stops.',
      'If outdoors, move to a clear area away from buildings, power lines, and trees.',
      'If in a high-rise building, stay away from windows and do NOT use elevators.',
    ],
    after: [
      'Check yourself and companions for injuries; administer basic first aid.',
      'Inspect for gas leaks and electrical short circuits; shut off main valves if smelling gas.',
      'Evacuate carefully using stairs; stay alert for falling debris and aftershocks.',
      'Tune in to emergency radio broadcasts or DisasterChain alerts for official updates.',
    ],
    dos: [
      'Drop, Cover, and Hold On under sturdy furniture.',
      'Protect head and neck with arms or pillows.',
      'Keep away from glass windows and heavy hanging mirrors.',
      'Use stairs only when evacuating building.',
    ],
    donts: [
      'Do NOT rush outside during active ground shaking.',
      'Do NOT use elevators during or immediately after earthquakes.',
      'Do NOT light matches or candles if gas leakage is suspected.',
      'Do NOT enter visibly fractured or leaning buildings.',
    ],
    emergencyKit: [
      { item: 'Battery-powered or hand-crank AM/FM radio', essential: true, description: 'To receive official broadcast advisories' },
      { item: 'High-intensity LED flashlight & extra batteries', essential: true, description: 'For navigation during blackout' },
      { item: 'First aid kit with sterile bandages & antiseptic', essential: true, description: 'For immediate wound dressing' },
      { item: 'High-decibel emergency whistle', essential: true, description: 'To signal location if trapped in rubble' },
      { item: 'Sealed bottled water (3 liters per person per day)', essential: true, description: 'Minimum 3 days supply' },
      { item: 'Non-perishable energy bars and dry rations', essential: true, description: 'Compact nutrition' },
    ],
  },
  {
    disasterType: 'Flood',
    title: 'Flood & Urban Waterlogging Response Protocol',
    description: 'Safety guidelines for heavy monsoons, rapid inundation, and river overflow.',
    icon: '🌊',
    before: [
      'Elevate essential electrical appliances and furnace units above projected flood levels.',
      'Keep clean drinking water containers filled and sealed.',
      'Store important academic and identification documents in watertight waterproof pouches.',
      'Know your local evacuation routes and location of highest ground/shelters.',
    ],
    during: [
      'Move immediately to higher floors or designated rooftop evacuation points.',
      'Turn off the main electrical circuit breaker and LPG cylinders before water enters.',
      'Do NOT attempt to walk, swim, or drive through flowing floodwaters (6 inches can knock you down).',
      'Avoid touching electrical wires or submerged electronic equipment.',
    ],
    after: [
      'Do not consume tap water until declared safe by health authorities; boil all drinking water.',
      'Beware of snakes, insects, and sharp debris carried by flood waters.',
      'Take photos of damage for insurance/university relief records before cleaning.',
      'Discard food items that came into contact with floodwater.',
    ],
    dos: [
      'Move to higher ground immediately when flash flood warning is issued.',
      'Disconnect electrical mains before water enters premises.',
      'Boil drinking water or use water purification tablets.',
      'Follow official evacuation instructions promptly.',
    ],
    donts: [
      'Do NOT walk through moving water currents.',
      'Do NOT drive into waterlogged underpasses or flooded streets.',
      'Do NOT touch fallen power lines or damp electrical switches.',
      'Do NOT consume uncovered food that contacted floodwater.',
    ],
    emergencyKit: [
      { item: 'Waterproof pouch with ID cards & emergency cash', essential: true, description: 'Protects critical documents' },
      { item: 'Water purification chlorine tablets', essential: true, description: 'Makes emergency water potable' },
      { item: 'Rubber boots & thick waterproof work gloves', essential: false, description: 'Protects from contaminated water' },
      { item: 'Sealed ready-to-eat food packets', essential: true, description: 'No-cooking required meals' },
      { item: 'Portable power bank for mobile phone', essential: true, description: 'Maintains communication' },
    ],
  },
  {
    disasterType: 'Fire',
    title: 'Fire Safety & Smoke Evacuation Guidelines',
    description: 'Emergency response for structural fires, chemical hazards, and smoke inhalation.',
    icon: '🔥',
    before: [
      'Install smoke alarms and test them regularly.',
      'Keep fire extinguishers charged and easily accessible.',
      'Know two ways out of every room in your residence/campus.',
      'Keep stairwells and emergency exits clear of clutter and furniture.',
    ],
    during: [
      'CRAWL LOW under smoke where clean, breathable air is concentrated near the floor.',
      'Feel closed doors with the back of your hand before opening; do NOT open hot doors.',
      'If clothes catch fire: STOP, DROP to ground, and ROLL until flames are smothered.',
      'Use the nearest emergency exit stairs; never use elevators.',
    ],
    after: [
      'Once outside, stay outside; NEVER re-enter a burning building.',
      'Call emergency hotlines (101 or 112) immediately.',
      'Get medical treatment for burns and smoke inhalation symptoms.',
      'Await official clearance from fire department before re-entering building.',
    ],
    dos: [
      'Crawl low under smoke toward nearest exit.',
      'Feel door handles with the back of hand before opening.',
      'Activate nearest manual fire alarm pull station.',
      'Assemble at designated campus evacuation muster point.',
    ],
    donts: [
      'Do NOT use elevators during a fire evacuation.',
      'Do NOT waste time collecting personal belongings.',
      'Do NOT open doors that feel warm to the touch.',
      'Do NOT re-enter a burning building for any reason.',
    ],
    emergencyKit: [
      { item: 'Emergency smoke escape hood / N95 masks', essential: true, description: 'Filters toxic smoke particles' },
      { item: 'Small ABC dry chemical fire extinguisher', essential: true, description: 'For small incipient fires' },
      { item: 'Heavy-duty fire blanket', essential: true, description: 'To wrap person or smother kitchen flames' },
      { item: 'Burn dressing gel & sterile non-stick pads', essential: true, description: 'Immediate first aid for thermal burns' },
    ],
  },
  {
    disasterType: 'Cyclone',
    title: 'Cyclone, Hurricane & Severe Storm Protocols',
    description: 'Safety guidelines for destructive winds, storm surges, and flying debris.',
    icon: '🌀',
    before: [
      'Secure loose outdoor objects (tin roofs, signboards, furniture).',
      'Board up glass windows or tape large window panes diagonally.',
      'Stockpile sufficient non-perishable food and potable water for 5 days.',
    ],
    during: [
      'Stay in the safest interior room (bathroom or corridor) without windows.',
      'Do not be misled by the calm "eye of the cyclone"; intense opposite winds will follow.',
      'Keep battery-powered radio tuned for updates.',
    ],
    after: [
      'Beware of loose hanging electrical wires; report snapped cables to authorities.',
      'Drive cautiously; roads may have fallen trees and structural hazards.',
      'Clear standing water around premises to prevent mosquito breeding.',
    ],
    dos: [
      'Stay indoors in windowless central rooms.',
      'Keep mobile phones fully charged and in power-saving mode.',
      'Unplug non-essential electronic appliances.',
    ],
    donts: [
      'Do NOT venture outside during the eye of the storm.',
      'Do NOT stand near large glass windows or skylights.',
      'Do NOT spread unverified rumors on social media.',
    ],
    emergencyKit: [
      { item: 'Transistor radio with extra dry batteries', essential: true, description: 'Weather advisories' },
      { item: 'Heavy tarpaulin & nylon rope', essential: false, description: 'Emergency roof protection' },
      { item: 'Prescription medicines for 7 days', essential: true, description: 'Critical personal health needs' },
    ],
  },
  {
    disasterType: 'Landslide',
    title: 'Landslide & Mudflow Safety Protocol',
    description: 'Response protocols for unstable mountain slopes and debris flows.',
    icon: '⛰️',
    before: [
      'Learn about previous landslide history in your locality.',
      'Watch for warning signs: leaning trees, new cracks in ground, tilting fences.',
    ],
    during: [
      'If indoors, curl into a tight ball and protect your head under heavy furniture.',
      'If outdoors, run to the nearest high, stable ground away from the path of debris.',
    ],
    after: [
      'Stay away from the slide area; additional slides may follow.',
      'Check for injured or trapped persons without entering direct hazard zone.',
    ],
    dos: [
      'Evacuate immediately if slope movement is heard or observed.',
      'Listen for unusual sounds like trees cracking or boulders knocking.',
    ],
    donts: [
      'Do NOT cross fresh mudflow paths.',
      'Do NOT build or stay near steep slopes during torrential rains.',
    ],
    emergencyKit: [
      { item: 'Sturdy hiking boots with ankle support', essential: true, description: 'For rough terrain' },
      { item: 'Emergency signaling flares / high-vis vest', essential: false, description: 'For rescue teams' },
    ],
  },
  {
    disasterType: 'Heatwave',
    title: 'Extreme Heatwave & Hyperthermia Prevention',
    description: 'Guidelines to protect against heat stroke, severe dehydration, and sunstroke.',
    icon: '☀️',
    before: [
      'Check weather forecasts for heat wave alerts (temperatures > 42°C).',
      'Prepare homemade ORS (Oral Rehydration Salts) solutions and lemon water.',
    ],
    during: [
      'Drink plenty of water even if not thirsty; avoid caffeinated and sugary beverages.',
      'Wear lightweight, loose-fitting, light-colored cotton clothing and wide-brimmed hats.',
      'Stay in shaded or air-conditioned indoor spaces during peak sun hours (11 AM to 4 PM).',
    ],
    after: [
      'If experiencing dizziness, headache, or nausea: sponge body with cool water.',
      'Seek urgent medical help for suspected heatstroke (high body temperature without sweating).',
    ],
    dos: [
      'Hydrate regularly with water, buttermilk, and electrolytes.',
      'Keep animals and pets in shaded areas with ample water.',
    ],
    donts: [
      'Do NOT leave children or pets inside parked vehicles.',
      'Do NOT engage in strenuous outdoor sports during midday peak heat.',
    ],
    emergencyKit: [
      { item: 'Electrolyte ORS sachets (glucose-electrolyte mix)', essential: true, description: 'Immediate rehydration' },
      { item: 'Insulated thermal water bottle', essential: true, description: 'Keeps water cool' },
      { item: 'Broad-spectrum SPF 50 sunscreen', essential: false, description: 'Skin UV protection' },
    ],
  },
];

const isDbConnected = () => mongoose.connection.readyState === 1;

// @desc    Get all disaster preparedness guides
// @route   GET /api/preparedness
// @access  Public
exports.getAllPreparedness = async (req, res) => {
  try {
    if (isDbConnected()) {
      const guides = await Preparedness.find().sort({ disasterType: 1 });
      if (guides && guides.length > 0) {
        return res.json({ success: true, count: guides.length, data: guides });
      }
    }
    return res.json({ success: true, count: defaultPreparedness.length, data: defaultPreparedness });
  } catch (error) {
    return res.json({ success: true, count: defaultPreparedness.length, data: defaultPreparedness });
  }
};

// @desc    Get disaster preparedness guide by disaster type
// @route   GET /api/preparedness/:type
// @access  Public
exports.getPreparednessByType = async (req, res) => {
  try {
    if (isDbConnected()) {
      const guide = await Preparedness.findOne({
        disasterType: { $regex: new RegExp(`^${req.params.type}$`, 'i') },
      });
      if (guide) return res.json({ success: true, data: guide });
    }

    const guide = defaultPreparedness.find(
      (g) => g.disasterType.toLowerCase() === req.params.type.toLowerCase()
    );

    if (!guide) {
      return res.status(404).json({ success: false, message: `Guide for '${req.params.type}' not found` });
    }

    return res.json({ success: true, data: guide });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
