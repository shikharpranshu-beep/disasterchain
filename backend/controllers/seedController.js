const User = require('../models/User');
const SosRequest = require('../models/SosRequest');
const Shelter = require('../models/Shelter');
const AffectedArea = require('../models/AffectedArea');
const Alert = require('../models/Alert');
const Incident = require('../models/Incident');
const Resource = require('../models/Resource');
const Donation = require('../models/Donation');
const Distribution = require('../models/Distribution');
const Preparedness = require('../models/Preparedness');
const BlockchainRecord = require('../models/BlockchainRecord');
const { createBlockchainRecord } = require('../services/blockchainService');

exports.seedDatabase = async (req, res) => {
  try {
    // 1. Clear existing data
    await User.deleteMany({});
    await SosRequest.deleteMany({});
    await Shelter.deleteMany({});
    await AffectedArea.deleteMany({});
    await Alert.deleteMany({});
    await Incident.deleteMany({});
    await Resource.deleteMany({});
    await Donation.deleteMany({});
    await Distribution.deleteMany({});
    await Preparedness.deleteMany({});
    await BlockchainRecord.deleteMany({});

    // 2. Create Users
    const studentUser = await User.create({
      name: 'Shikhar (Student)',
      email: 'student@disasterchain.org',
      password: 'student123',
      role: 'student',
    });

    const adminUser = await User.create({
      name: 'Chief Disaster Officer',
      email: 'admin@disasterchain.org',
      password: 'admin123',
      role: 'admin',
    });

    // 3. Create SOS Requests
    const sosData = [
      {
        requestId: 'SOS-1042',
        name: 'Aarav Sharma',
        emergencyType: 'Medical Emergency',
        description: 'Elderly person suffering severe asthma attack due to fire smoke inhalation. Needs oxygen support.',
        location: 'Block C, Sector 14, North Campus',
        peopleAffected: 2,
        severity: 'Critical',
        contact: '+91 98765 43210',
        status: 'In Progress',
        reportedBy: studentUser._id,
      },
      {
        requestId: 'SOS-1043',
        name: 'Pooja Verma',
        emergencyType: 'Flood',
        description: 'Ground floor submerged in 4 feet water. 5 students trapped on terrace with no drinking water.',
        location: 'Girls Hostel 3, River View Road',
        peopleAffected: 5,
        severity: 'High',
        contact: '+91 98111 22334',
        status: 'Assigned',
        reportedBy: studentUser._id,
      },
      {
        requestId: 'SOS-1044',
        name: 'Rohan Gupta',
        emergencyType: 'Building Damage',
        description: 'Cracks appeared on staircase wall after tremor; emergency exit door jammed.',
        location: 'Main Science Complex, Wing B',
        peopleAffected: 12,
        severity: 'High',
        contact: '+91 98222 33445',
        status: 'Pending',
        reportedBy: studentUser._id,
      },
      {
        requestId: 'SOS-1045',
        name: 'Sunita Patel',
        emergencyType: 'Fire',
        description: 'Short circuit fire spreading in chemistry lab corridor on 2nd floor.',
        location: 'Academic Block 4, South Campus',
        peopleAffected: 8,
        severity: 'Critical',
        contact: '+91 98333 44556',
        status: 'In Progress',
      },
      {
        requestId: 'SOS-1046',
        name: 'Kunal Sen',
        emergencyType: 'Trapped Person',
        description: 'Elevator stopped between 3rd and 4th floors due to power outage.',
        location: 'Central Library Tower',
        peopleAffected: 3,
        severity: 'Medium',
        contact: '+91 98444 55667',
        status: 'Resolved',
      },
    ];
    await SosRequest.insertMany(sosData);

    // 4. Create Shelters
    const shelterData = [
      {
        name: 'Central University Indoor Stadium Shelter',
        address: 'Sports Complex, University Campus',
        latitude: 28.6139,
        longitude: 77.2090,
        capacity: 600,
        occupancy: 380,
        facilities: ['Food', 'Drinking Water', 'Medical Support', 'Electricity', 'Sleeping Area', 'Toilets'],
        status: 'Open',
        phone: '+91 11 2345 6780',
      },
      {
        name: 'Community Relief Center Sector 9',
        address: 'Opposite Civil Hospital, Sector 9',
        latitude: 28.6250,
        longitude: 77.2180,
        capacity: 400,
        occupancy: 400,
        facilities: ['Food', 'Drinking Water', 'Medical Support', 'Electricity', 'Toilets'],
        status: 'Full',
        phone: '+91 11 2345 6781',
      },
      {
        name: 'Government Model Senior School Shelter',
        address: 'Ring Road, North Campus Extension',
        latitude: 28.6350,
        longitude: 77.2010,
        capacity: 350,
        occupancy: 120,
        facilities: ['Food', 'Drinking Water', 'Electricity', 'Sleeping Area', 'Toilets'],
        status: 'Open',
        phone: '+91 11 2345 6782',
      },
      {
        name: 'Red Cross Emergency Transit Shelter',
        address: 'Near Railway Station Gate 2',
        latitude: 28.6050,
        longitude: 77.2150,
        capacity: 250,
        occupancy: 85,
        facilities: ['Drinking Water', 'Medical Support', 'Internet', 'Toilets'],
        status: 'Open',
        phone: '+91 11 2345 6783',
      },
      {
        name: 'City Youth Center Emergency Camp',
        address: 'Green Park, Block B',
        latitude: 28.5950,
        longitude: 77.2250,
        capacity: 500,
        occupancy: 210,
        facilities: ['Food', 'Drinking Water', 'Medical Support', 'Electricity', 'Sleeping Area'],
        status: 'Open',
        phone: '+91 11 2345 6784',
      },
    ];
    await Shelter.insertMany(shelterData);

    // 5. Create Affected Areas
    const affectedAreaData = [
      {
        name: 'North Riverfront Zone',
        disasterType: 'Flood / Water Inundation',
        severity: 'Critical',
        description: 'Water level exceeded danger mark by 1.8m. Low-lying residential hostels and roads submerged.',
        affectedPeople: 2400,
        activeSOS: 14,
        latitude: 28.6400,
        longitude: 77.2200,
        status: 'Active',
      },
      {
        name: 'Old Campus Science Enclave',
        disasterType: 'Structural Hazard',
        severity: 'High',
        description: 'Mild seismic tremors caused wall fractures; power lines disconnected as precautionary measure.',
        affectedPeople: 850,
        activeSOS: 6,
        latitude: 28.6200,
        longitude: 77.2100,
        status: 'Active',
      },
      {
        name: 'Industrial Sector 5',
        disasterType: 'Chemical / Smoke Hazard',
        severity: 'Moderate',
        description: 'Localized warehouse fire emitting dense smoke. Air quality index at hazardous levels.',
        affectedPeople: 1200,
        activeSOS: 3,
        latitude: 28.5800,
        longitude: 77.2400,
        status: 'Controlled',
      },
      {
        name: 'Eastern Hill Slope',
        disasterType: 'Landslide Risk',
        severity: 'High',
        description: 'Heavy rain triggered soil erosion near university perimeter wall. Road traffic diverted.',
        affectedPeople: 450,
        activeSOS: 2,
        latitude: 28.6500,
        longitude: 77.1900,
        status: 'Active',
      },
      {
        name: 'Central Marketplace',
        disasterType: 'Urban Waterlogging',
        severity: 'Low',
        description: 'Storm drain overflow cleared; municipal pumps operational. Traffic moving slowly.',
        affectedPeople: 300,
        activeSOS: 0,
        latitude: 28.6100,
        longitude: 77.2300,
        status: 'Recovering',
      },
    ];
    await AffectedArea.insertMany(affectedAreaData);

    // 6. Create Alerts
    const alertData = [
      {
        title: 'CRITICAL: Severe Flood Warning for North Riverfront',
        message: 'River levels rising rapidly due to upstream dam release. Evacuate ground floor quarters immediately to Central Indoor Stadium Shelter.',
        type: 'Flood',
        severity: 'Critical',
        location: 'North Campus & Riverfront Zone',
        active: true,
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      },
      {
        title: 'DANGER: Fire Safety Advisory — Academic Block 4',
        message: 'Firefighting teams actively extinguishing corridor blaze. Avoid Academic Block 4 and keep access roads clear for emergency fire tenders.',
        type: 'Fire',
        severity: 'Danger',
        location: 'Academic Block 4, South Campus',
        active: true,
        expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
      },
      {
        title: 'WARNING: Heavy Thunderstorm & High Winds Forecast',
        message: 'Meteorological department predicts wind gusts up to 75 km/h. Stay indoors and do not stand under weak trees or high-tension electrical poles.',
        type: 'Thunderstorm',
        severity: 'Warning',
        location: 'Entire Campus Region',
        active: true,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
      {
        title: 'INFO: Safe Drinking Water Distribution Station Open',
        message: 'Clean potable drinking water packets and purification tablets available at Student Center Helpdesk.',
        type: 'General',
        severity: 'Information',
        location: 'Student Activity Center',
        active: true,
        expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
      },
    ];
    await Alert.insertMany(alertData);

    // 7. Create Incidents
    const incidentData = [
      {
        incidentId: 'INC-2041',
        title: 'Emergency Exit Door Jammed with Debris',
        type: 'Blocked emergency exit',
        description: 'Construction wooden planks and discarded furniture blocking the rear emergency fire escape door in hostel 2.',
        severity: 'High',
        location: 'Hostel 2, Ground Floor Rear Exit',
        reporterName: 'Shikhar (Student)',
        reportedBy: studentUser._id,
        status: 'Under Review',
      },
      {
        incidentId: 'INC-2042',
        title: 'Sparking Exposed Electrical Transformer',
        type: 'Damaged electrical equipment',
        description: 'Water dripping onto main step-down transformer next to cafeteria creating sparking and smoke.',
        severity: 'Critical',
        location: 'Cafeteria Junction Substation',
        reporterName: 'Ananya Roy',
        status: 'Pending',
      },
      {
        incidentId: 'INC-2043',
        title: 'Large Banyan Tree Branch Fallen on Access Road',
        type: 'Fallen tree',
        description: 'Heavy wind snapped 15-meter branch blocking ambulance route toward University Health Center.',
        severity: 'Medium',
        location: 'Health Center Roadway',
        reporterName: 'Ravi Teja',
        status: 'Resolved',
      },
    ];
    await Incident.insertMany(incidentData);

    // 8. Create Emergency Resources (10 resources)
    const resourceData = [
      {
        name: 'Apex Civil Hospital & Trauma Center',
        type: 'Hospital',
        address: 'Plot 12, Medical Square, Civil Lines',
        phone: '+91 11 2233 4455',
        description: '24/7 Emergency trauma care, burn ICU, blood bank, and 6 ambulance units.',
        latitude: 28.6150,
        longitude: 77.2100,
        status: 'Operational',
      },
      {
        name: 'University Health & First Aid Clinic',
        type: 'Medical Center',
        address: 'Student Amenities Block, Gate 1',
        phone: '+91 11 2345 6701',
        description: 'Campus emergency doctors, triage beds, first aid supplies, and oxygen concentrators.',
        latitude: 28.6220,
        longitude: 77.2080,
        status: 'Operational',
      },
      {
        name: 'City Fire Station No. 4',
        type: 'Fire Station',
        address: 'Ring Road By-pass, Near North Gate',
        phone: '+91 11 101',
        description: 'Equipped with 4 hydraulic fire tenders, rescue cutters, and HAZMAT teams.',
        latitude: 28.6280,
        longitude: 77.2150,
        status: 'Operational',
      },
      {
        name: 'Campus Police Station & PCR Control',
        type: 'Police Station',
        address: 'Main Administrative Circle',
        phone: '+91 11 112',
        description: 'Disaster response coordination, law enforcement, crowd control, and patrol vans.',
        latitude: 28.6180,
        longitude: 77.2050,
        status: 'Operational',
      },
      {
        name: 'District Disaster Management Authority (DDMA)',
        type: 'Disaster Management Office',
        address: 'Collectorate Complex, Block B',
        phone: '+91 11 2392 3456',
        description: 'Government apex coordination unit for disaster alerts, NDRF deployment, and logistics.',
        latitude: 28.6310,
        longitude: 77.2250,
        status: 'Operational',
      },
      {
        name: 'Red Cross Relief Warehouse',
        type: 'Relief Center',
        address: 'Sector 15 Logistics Hub',
        phone: '+91 11 2371 6441',
        description: 'Central stockpile of emergency ration kits, blankets, hygiene packs, and tarpaulins.',
        latitude: 28.6010,
        longitude: 77.2350,
        status: 'Operational',
      },
      {
        name: 'Community Food Kitchen & Water Tanker Base',
        type: 'Food Distribution Center',
        address: 'Community Hall, Sector 8',
        phone: '+91 11 2345 8899',
        description: 'Distributes 3,000 cooked meal packets daily and operates 4 potable water tankers.',
        latitude: 28.6090,
        longitude: 77.2200,
        status: 'Operational',
      },
      {
        name: 'St. John Ambulance Rapid Response Squad',
        type: 'Medical Center',
        address: 'Near Metro Station Gate 3',
        phone: '+91 11 2345 7766',
        description: 'Mobile paramedical vans with trained student volunteers and stretcher teams.',
        latitude: 28.6250,
        longitude: 77.2300,
        status: 'Operational',
      },
      {
        name: 'Central University Indoor Stadium Shelter',
        type: 'Emergency Shelter',
        address: 'Sports Complex, University Campus',
        phone: '+91 11 2345 6780',
        description: 'Large ventilated emergency shelter with beds, toilets, and food mess.',
        latitude: 28.6139,
        longitude: 77.2090,
        status: 'Operational',
      },
      {
        name: 'State Disaster Response Force (SDRF) Post',
        type: 'Disaster Management Office',
        address: 'Boat Club, Riverfront East',
        phone: '+91 11 2345 9900',
        description: 'Equipped with motorized inflatable rescue boats and flood scuba divers.',
        latitude: 28.6420,
        longitude: 77.2280,
        status: 'Operational',
      },
    ];
    await Resource.insertMany(resourceData);

    // 9. Create Donations
    const donationData = [
      {
        donationId: 'DON-3011',
        donor: 'Tata Relief Trust & Alumni Network',
        type: 'Medical Supplies',
        resourceName: 'Emergency First-Aid Kits & Antibiotics',
        quantity: 1200,
        unit: 'kits',
        destination: 'Central University Indoor Stadium Shelter',
        status: 'Fully Distributed',
        blockchainTransactionId: 'TXN-881204',
      },
      {
        donationId: 'DON-3012',
        donor: 'Rotary Club City Chapter',
        type: 'Food',
        resourceName: 'Ready-to-Eat Emergency Food Packets',
        quantity: 3500,
        unit: 'meals',
        destination: 'Community Food Kitchen Sector 8',
        status: 'Partially Distributed',
        blockchainTransactionId: 'TXN-881205',
      },
      {
        donationId: 'DON-3013',
        donor: 'Care India Foundation',
        type: 'Water',
        resourceName: 'Packaged Drinking Water Liters',
        quantity: 5000,
        unit: 'bottles',
        destination: 'North Riverfront Zone Shelter',
        status: 'Received',
        blockchainTransactionId: 'TXN-881206',
      },
      {
        donationId: 'DON-3014',
        donor: 'Student Union Relief Drive',
        type: 'Blankets',
        resourceName: 'Thermal Woolen Blankets',
        quantity: 800,
        unit: 'blankets',
        destination: 'Government Model Senior School Shelter',
        status: 'Verified',
        blockchainTransactionId: 'TXN-881207',
      },
      {
        donationId: 'DON-3015',
        donor: 'Tech Innovators NGO',
        type: 'Emergency Kits',
        resourceName: 'Solar Rechargeable LED Flashlights & Power Banks',
        quantity: 450,
        unit: 'units',
        destination: 'Red Cross Emergency Transit Shelter',
        status: 'Registered',
        blockchainTransactionId: 'TXN-881208',
      },
    ];
    await Donation.insertMany(donationData);

    // 10. Create Distributions
    const distributionData = [
      {
        distributionId: 'DIS-4011',
        resourceName: 'Emergency First-Aid Kits',
        quantity: 500,
        unit: 'kits',
        source: 'Red Cross Relief Warehouse',
        destination: 'Central University Indoor Stadium Shelter',
        responsibleOrganization: 'St. John Ambulance Squad',
        status: 'Distributed',
        blockchainTransactionId: 'TXN-881204',
      },
      {
        distributionId: 'DIS-4012',
        resourceName: 'Ready-to-Eat Food Packets',
        quantity: 1500,
        unit: 'meals',
        source: 'Community Food Kitchen Sector 8',
        destination: 'North Riverfront Zone Evacuees',
        responsibleOrganization: 'National Cadet Corps (NCC) Unit',
        status: 'Delivered',
        blockchainTransactionId: 'TXN-881205',
      },
      {
        distributionId: 'DIS-4013',
        resourceName: 'Packaged Drinking Water Bottles',
        quantity: 2000,
        unit: 'bottles',
        source: 'Red Cross Relief Warehouse',
        destination: 'Girls Hostel 3 Flood Point',
        responsibleOrganization: 'SDRF Flood Team',
        status: 'In Transit',
        blockchainTransactionId: 'TXN-881206',
      },
      {
        distributionId: 'DIS-4014',
        resourceName: 'Thermal Woolen Blankets',
        quantity: 400,
        unit: 'blankets',
        source: 'Student Union Relief Drive',
        destination: 'City Youth Center Emergency Camp',
        responsibleOrganization: 'Volunteer Corps',
        status: 'Delivered',
        blockchainTransactionId: 'TXN-881207',
      },
      {
        distributionId: 'DIS-4015',
        resourceName: 'Solar Flashlights & Power Banks',
        quantity: 200,
        unit: 'units',
        source: 'Tech Innovators NGO Depot',
        destination: 'Government Model Senior School Shelter',
        responsibleOrganization: 'Campus Volunteer Taskforce',
        status: 'Planned',
        blockchainTransactionId: 'TXN-881208',
      },
    ];
    await Distribution.insertMany(distributionData);

    // 11. Create Preparedness Guides (6 full categories)
    const preparednessData = [
      {
        disasterType: 'Earthquake',
        title: 'Earthquake Safety & Preparedness Guide',
        description: 'Comprehensive protocols for seismic tremors, structural collapse mitigation, and evacuation.',
        icon: '🏚️',
        before: [
          'Identify safe spots in each room: under sturdy desks, tables, or against interior walls.',
          'Secure heavy items, bookshelves, and laboratory chemicals to walls with brackets.',
          'Keep your DisasterReady emergency kit accessible near your exit door.',
          'Practice Drop, Cover, and Hold On drills regularly with roommates and family.',
        ],
        during: [
          'DROP to your hands and knees to prevent being knocked over.',
          'COVER your head and neck under a sturdy table or desk.',
          'HOLD ON to your shelter until shaking stops.',
          'If outdoors, move away from buildings, streetlights, and electrical wires.',
          'DO NOT use elevators under any circumstances.',
        ],
        after: [
          'Check yourself and others for injuries and administer first aid.',
          'Inspect for gas leaks, damaged electrical wiring, and cracked water pipes.',
          'Evacuate calmly using stairwells once shaking ceases.',
          'Expect aftershocks and stay tuned to DisasterChain emergency broadcasts.',
        ],
        dos: [
          'Drop, Cover, and Hold on immediately when shaking begins.',
          'Protect your head with your arms, pillows, or a heavy backpack.',
          'Turn off main electrical breaker and gas valve if safe to do so.',
        ],
        donts: [
          'Do NOT rush toward exterior doors or windows during shaking.',
          'Do NOT use matches, lighters, or open flames due to potential gas leaks.',
          'Do NOT spread unverified rumors on social media.',
        ],
        emergencyKit: [
          { item: 'Drinking Water (3 Liters per person)', description: '3-day emergency supply', essential: true },
          { item: 'First-Aid Kit & Prescription Medicines', description: 'Bandages, antiseptic, painkillers', essential: true },
          { item: 'High-Power LED Flashlight', description: 'With extra batteries', essential: true },
          { item: 'Multi-Tool & Whistle', description: 'To signal rescue workers if trapped', essential: true },
          { item: 'Charged Power Bank & Cable', description: 'For emergency mobile communication', essential: true },
          { item: 'Emergency Mylar Blanket', description: 'Retains 90% body heat', essential: false },
        ],
      },
      {
        disasterType: 'Flood',
        title: 'Flood Safety & Water Inundation Protocols',
        description: 'Preparation, survival tactics, and waterborne disease mitigation during flash floods and rising rivers.',
        icon: '🌊',
        before: [
          'Elevate electrical appliances and valuable academic documents to upper floors.',
          'Know the designated high-ground evacuation routes on campus.',
          'Store clean drinking water in sealed containers (water mains may become contaminated).',
        ],
        during: [
          'Move immediately to higher ground or upper floor of a reinforced concrete building.',
          'NEVER walk, swim, or drive through moving flood water (just 6 inches can knock you down).',
          'Disconnect electrical power at main fuse box if water begins entering the building.',
        ],
        after: [
          'Avoid floodwaters as they may be contaminated with sewage or carry electrical charge.',
          'Boil all water before drinking or use chlorine purification tablets.',
          'Report structural cracks or undermined foundations through the Incident Reporting tool.',
        ],
        dos: [
          'Turn off electricity and gas supply before evacuating.',
          'Keep your mobile phone in a waterproof pouch.',
          'Listen to DisasterChain official alert updates.',
        ],
        donts: [
          'Do NOT touch electrical equipment if you are wet or standing in water.',
          'Do NOT drink tap water until authorities confirm it is uncontaminated.',
          'Do NOT drive across flooded bridges or causeways.',
        ],
        emergencyKit: [
          { item: 'Water Purification Tablets', description: 'Chlorine-based safe water purifier', essential: true },
          { item: 'Waterproof Document Pouch', description: 'For ID cards, certificates, and cash', essential: true },
          { item: 'Emergency Rations (Canned/Dry)', description: '3-day non-perishable food', essential: true },
          { item: 'Rubber Boots & Heavy Gloves', description: 'Protects from debris and sharp objects', essential: false },
        ],
      },
      {
        disasterType: 'Fire',
        title: 'Fire Safety & Campus Evacuation Guide',
        description: 'Fire hazard prevention, extinguisher operation (PASS method), and rapid building evacuation.',
        icon: '🔥',
        before: [
          'Learn the location of all fire extinguishers, alarms, and emergency exits in your building.',
          'Ensure emergency exit stairwells are never blocked by furniture or boxes.',
          'Avoid overloading electrical extension strips in hostel dormitories.',
        ],
        during: [
          'Pull the nearest fire alarm and shout to alert neighbors.',
          'CRAWL LOW under smoke where the air is coolest and cleanest.',
          'Feel doors with the back of your hand before opening; if hot, do NOT open.',
          'Use the P.A.S.S. method for extinguishers: Pull pin, Aim nozzle, Squeeze handle, Sweep side-to-side.',
        ],
        after: [
          'Assemble at the designated campus emergency evacuation point.',
          'Report missing students to rescue coordinators immediately.',
          'Do NOT re-enter the building until fire marshals declare it safe.',
        ],
        dos: [
          'Stay low to the floor to avoid inhaling toxic smoke and carbon monoxide.',
          'Close doors behind you to slow the spread of fire.',
          'Call 101 or submit an emergency SOS on DisasterChain immediately.',
        ],
        donts: [
          'Do NOT use elevators during a building fire.',
          'Do NOT stop to collect personal belongings.',
          'Do NOT open doors that feel warm to the touch.',
        ],
        emergencyKit: [
          { item: 'Smoke Escape Mask / N95 Respirator', description: 'Filters smoke particles', essential: true },
          { item: 'Fire Blanket', description: 'To extinguish clothing fires', essential: true },
          { item: 'Emergency Glow Sticks', description: 'Visual beacon in smoke-filled rooms', essential: false },
        ],
      },
      {
        disasterType: 'Cyclone',
        title: 'Cyclone & Extreme Storm Safety Protocols',
        description: 'Preparation for tropical cyclones, high wind speeds, and falling debris protection.',
        icon: '🌀',
        before: [
          'Secure loose rooftop items, tin sheds, and outdoor furniture.',
          'Board up or tape large glass windows to prevent shattering from flying debris.',
          'Fully charge power banks, laptops, and emergency lamps.',
        ],
        during: [
          'Remain indoors in the central-most room of the ground floor with few or no windows.',
          'Do NOT be fooled by the calm "eye" of the storm; winds will resume suddenly from the opposite direction.',
          'Stay away from windows and glass facades.',
        ],
        after: [
          'Watch out for dangling electrical wires and report them immediately.',
          'Beware of weakened branches or loose structures that may fall.',
        ],
        dos: [
          'Keep your DisasterReady emergency kit beside you.',
          'Monitor real-time alerts on the DisasterChain dashboard.',
        ],
        donts: [
          'Do NOT venture outside to take photographs or videos during high winds.',
          'Do NOT park vehicles under tall trees or near billboards.',
        ],
        emergencyKit: [
          { item: 'Battery-Powered FM/AM Radio', description: 'For emergency broadcast broadcasts', essential: true },
          { item: 'Heavy-Duty Waterproof Tarpaulin', description: 'Temporary roof/window patch', essential: false },
        ],
      },
      {
        disasterType: 'Landslide',
        title: 'Landslide & Slope Failure Preparedness',
        description: 'Warning signs detection and emergency response in hilly or sloping terrain.',
        icon: '⛰️',
        before: [
          'Observe slope changes: tilting trees, new cracks in soil, or sudden water seepage.',
          'Identify escape routes away from the path of potential debris flow.',
        ],
        during: [
          'Quickly move out of the path of debris or mudflow to stable higher ground.',
          'If escape is impossible, curl into a tight ball and protect your head.',
        ],
        after: [
          'Stay away from the slide area as additional slides may occur.',
          'Check for damaged utility lines and report them to authorities.',
        ],
        dos: [
          'Evacuate immediately if you hear a rumbling sound or see trees cracking.',
          'Help neighbors who may need special assistance.',
        ],
        donts: [
          'Do NOT cross bridges if high-velocity mud flow is passing beneath.',
        ],
        emergencyKit: [
          { item: 'Emergency Whistle & Sturdy Boots', description: 'For navigation and rescue alerting', essential: true },
        ],
      },
      {
        disasterType: 'Heatwave',
        title: 'Severe Heatwave & Hyperthermia Prevention',
        description: 'Protection strategies against extreme ambient temperatures and heat stroke.',
        icon: '☀️',
        before: [
          'Stock up on Oral Rehydration Salts (ORS), electrolyte drinks, and clean water.',
          'Cover east and west facing windows with curtains or reflective sheets.',
        ],
        during: [
          'Drink water frequently even if you do not feel thirsty.',
          'Wear loose, light-colored, lightweight cotton clothing.',
          'Avoid going outside during peak heat hours (12:00 PM to 4:00 PM).',
          'If feeling dizzy or nausea, move to a cool shaded place and apply cold damp cloth.',
        ],
        after: [
          'Continue hydration and monitor pulse rate of vulnerable individuals.',
        ],
        dos: [
          'Carry an umbrella, hat, and cold water bottle whenever traveling outdoors.',
          'Consume fresh buttermilk, lemon water, and ORS solution.',
        ],
        donts: [
          'Do NOT leave children, seniors, or pets inside parked vehicles.',
          'Do NOT consume excessive caffeine or sugary carbonated drinks.',
        ],
        emergencyKit: [
          { item: 'ORS Sachets & Electrolyte Powder', description: 'Instant hydration replenish', essential: true },
          { item: 'Digital Thermometer & Ice Packs', description: 'Monitor body temperature', essential: true },
        ],
      },
    ];
    await Preparedness.insertMany(preparednessData);

    // 12. Create Blockchain Ledger Records (Linked to seed donations & distributions)
    const blockchainRecords = [
      {
        transactionId: 'TXN-881204',
        entityType: 'Donation',
        entityId: 'DON-3011',
        donorOrSource: 'Tata Relief Trust & Alumni Network',
        destination: 'Central University Indoor Stadium Shelter',
        resourceName: 'Emergency First-Aid Kits & Antibiotics',
        quantity: 1200,
        unit: 'kits',
        status: 'Verified',
        blockNumber: 1001,
        blockHash: '0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
        previousBlockHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
        signature: '0xa41c7b89d6e4f3a2b1c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6',
        verificationNote: 'Cryptographically verified relief donation registered on DisasterChain transparency ledger.',
      },
      {
        transactionId: 'TXN-881205',
        entityType: 'Donation',
        entityId: 'DON-3012',
        donorOrSource: 'Rotary Club City Chapter',
        destination: 'Community Food Kitchen Sector 8',
        resourceName: 'Ready-to-Eat Emergency Food Packets',
        quantity: 3500,
        unit: 'meals',
        status: 'Verified',
        blockNumber: 1002,
        blockHash: '0x9b4c6e82f1a3d5e7c9b0a2f4d6e8f0a2b4c6e8f0a2b4c6e8f0a2b4c6e8f0a2b4',
        previousBlockHash: '0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
        signature: '0xb23d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d',
        verificationNote: 'Cryptographically verified relief donation registered on DisasterChain transparency ledger.',
      },
      {
        transactionId: 'TXN-881206',
        entityType: 'Distribution',
        entityId: 'DIS-4013',
        donorOrSource: 'Red Cross Relief Warehouse',
        destination: 'Girls Hostel 3 Flood Point',
        resourceName: 'Packaged Drinking Water Bottles',
        quantity: 2000,
        unit: 'bottles',
        status: 'In Transit',
        blockNumber: 1003,
        blockHash: '0x3c5e7f9a1b3d5e7f9a1b3d5e7f9a1b3d5e7f9a1b3d5e7f9a1b3d5e7f9a1b3d5e',
        previousBlockHash: '0x9b4c6e82f1a3d5e7c9b0a2f4d6e8f0a2b4c6e8f0a2b4c6e8f0a2b4c6e8f0a2b4',
        signature: '0xc34e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e',
        verificationNote: 'Cryptographically verified relief distribution registered on DisasterChain transparency ledger.',
      },
      {
        transactionId: 'TXN-881207',
        entityType: 'Distribution',
        entityId: 'DIS-4014',
        donorOrSource: 'Student Union Relief Drive',
        destination: 'City Youth Center Emergency Camp',
        resourceName: 'Thermal Woolen Blankets',
        quantity: 400,
        unit: 'blankets',
        status: 'Delivered',
        blockNumber: 1004,
        blockHash: '0x4d6f8a0b2c4e6f8a0b2c4e6f8a0b2c4e6f8a0b2c4e6f8a0b2c4e6f8a0b2c4e6f',
        previousBlockHash: '0x3c5e7f9a1b3d5e7f9a1b3d5e7f9a1b3d5e7f9a1b3d5e7f9a1b3d5e7f9a1b3d5e',
        signature: '0xd45f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f',
        verificationNote: 'Cryptographically verified relief distribution registered on DisasterChain transparency ledger.',
      },
    ];
    await BlockchainRecord.insertMany(blockchainRecords);

    res.json({
      success: true,
      message: '✅ DisasterChain database seeded successfully with comprehensive demo data!',
      credentials: {
        student: { email: 'student@disasterchain.org', password: 'student123' },
        admin: { email: 'admin@disasterchain.org', password: 'admin123' },
      },
      seededCounts: {
        users: 2,
        sosRequests: sosData.length,
        shelters: shelterData.length,
        affectedAreas: affectedAreaData.length,
        alerts: alertData.length,
        incidents: incidentData.length,
        resources: resourceData.length,
        donations: donationData.length,
        distributions: distributionData.length,
        preparednessGuides: preparednessData.length,
        blockchainRecords: blockchainRecords.length,
      },
    });
  } catch (error) {
    console.error('Database Seed Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Error seeding database' });
  }
};
