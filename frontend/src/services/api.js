import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add JWT Auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('disasterchain_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ================= DEMO FALLBACK DATA =================
export const fallbackData = {
  sosRequests: [
    {
      _id: 'sos-1',
      requestId: 'SOS-1042',
      name: 'Aarav Sharma',
      emergencyType: 'Medical Emergency',
      description: 'Elderly person suffering severe asthma attack due to fire smoke inhalation. Needs oxygen support.',
      location: 'Block C, Sector 14, North Campus',
      peopleAffected: 2,
      severity: 'Critical',
      contact: '+91 98765 43210',
      status: 'In Progress',
      createdAt: new Date().toISOString(),
    },
    {
      _id: 'sos-2',
      requestId: 'SOS-1043',
      name: 'Pooja Verma',
      emergencyType: 'Flood',
      description: 'Ground floor submerged in 4 feet water. 5 students trapped on terrace with no drinking water.',
      location: 'Girls Hostel 3, River View Road',
      peopleAffected: 5,
      severity: 'High',
      contact: '+91 98111 22334',
      status: 'Assigned',
      createdAt: new Date().toISOString(),
    },
    {
      _id: 'sos-3',
      requestId: 'SOS-1044',
      name: 'Rohan Gupta',
      emergencyType: 'Building Damage',
      description: 'Cracks appeared on staircase wall after tremor; emergency exit door jammed.',
      location: 'Main Science Complex, Wing B',
      peopleAffected: 12,
      severity: 'High',
      contact: '+91 98222 33445',
      status: 'Pending',
      createdAt: new Date().toISOString(),
    },
    {
      _id: 'sos-4',
      requestId: 'SOS-1045',
      name: 'Sunita Patel',
      emergencyType: 'Fire',
      description: 'Short circuit fire spreading in chemistry lab corridor on 2nd floor.',
      location: 'Academic Block 4, South Campus',
      peopleAffected: 8,
      severity: 'Critical',
      contact: '+91 98333 44556',
      status: 'In Progress',
      createdAt: new Date().toISOString(),
    },
    {
      _id: 'sos-5',
      requestId: 'SOS-1046',
      name: 'Kunal Sen',
      emergencyType: 'Trapped Person',
      description: 'Elevator stopped between 3rd and 4th floors due to power outage.',
      location: 'Central Library Tower',
      peopleAffected: 3,
      severity: 'Medium',
      contact: '+91 98444 55667',
      status: 'Resolved',
      createdAt: new Date().toISOString(),
    },
  ],
  shelters: [
    {
      _id: 'sh-1',
      name: 'Central University Indoor Stadium Shelter',
      address: 'Sports Complex, University Campus',
      latitude: 28.6139,
      longitude: 77.2090,
      capacity: 600,
      occupancy: 380,
      availableCapacity: 220,
      facilities: ['Food', 'Drinking Water', 'Medical Support', 'Electricity', 'Sleeping Area', 'Toilets'],
      status: 'Open',
      phone: '+91 11 2345 6780',
    },
    {
      _id: 'sh-2',
      name: 'Community Relief Center Sector 9',
      address: 'Opposite Civil Hospital, Sector 9',
      latitude: 28.6250,
      longitude: 77.2180,
      capacity: 400,
      occupancy: 400,
      availableCapacity: 0,
      facilities: ['Food', 'Drinking Water', 'Medical Support', 'Electricity', 'Toilets'],
      status: 'Full',
      phone: '+91 11 2345 6781',
    },
    {
      _id: 'sh-3',
      name: 'Government Model Senior School Shelter',
      address: 'Ring Road, North Campus Extension',
      latitude: 28.6350,
      longitude: 77.2010,
      capacity: 350,
      occupancy: 120,
      availableCapacity: 230,
      facilities: ['Food', 'Drinking Water', 'Electricity', 'Sleeping Area', 'Toilets'],
      status: 'Open',
      phone: '+91 11 2345 6782',
    },
    {
      _id: 'sh-4',
      name: 'Red Cross Emergency Transit Shelter',
      address: 'Near Railway Station Gate 2',
      latitude: 28.6050,
      longitude: 77.2150,
      capacity: 250,
      occupancy: 85,
      availableCapacity: 165,
      facilities: ['Drinking Water', 'Medical Support', 'Internet', 'Toilets'],
      status: 'Open',
      phone: '+91 11 2345 6783',
    },
    {
      _id: 'sh-5',
      name: 'City Youth Center Emergency Camp',
      address: 'Green Park, Block B',
      latitude: 28.5950,
      longitude: 77.2250,
      capacity: 500,
      occupancy: 210,
      availableCapacity: 290,
      facilities: ['Food', 'Drinking Water', 'Medical Support', 'Electricity', 'Sleeping Area'],
      status: 'Open',
      phone: '+91 11 2345 6784',
    },
  ],
  affectedAreas: [
    {
      _id: 'area-1',
      name: 'North Riverfront Zone',
      disasterType: 'Flood / Inundation',
      severity: 'Critical',
      description: 'Water level exceeded danger mark by 1.8m. Low-lying hostels submerged.',
      affectedPeople: 2400,
      activeSOS: 14,
      latitude: 28.6400,
      longitude: 77.2200,
      status: 'Active',
    },
    {
      _id: 'area-2',
      name: 'Old Campus Science Enclave',
      disasterType: 'Structural Hazard',
      severity: 'High',
      description: 'Tremors caused wall fractures; electrical power disconnected.',
      affectedPeople: 850,
      activeSOS: 6,
      latitude: 28.6200,
      longitude: 77.2100,
      status: 'Active',
    },
    {
      _id: 'area-3',
      name: 'Industrial Sector 5',
      disasterType: 'Chemical / Smoke Hazard',
      severity: 'Moderate',
      description: 'Localized warehouse fire emitting dense smoke. Air quality index hazardous.',
      affectedPeople: 1200,
      activeSOS: 3,
      latitude: 28.5800,
      longitude: 77.2400,
      status: 'Controlled',
    },
    {
      _id: 'area-4',
      name: 'Eastern Hill Slope',
      disasterType: 'Landslide Risk',
      severity: 'High',
      description: 'Heavy rain triggered soil erosion near university perimeter wall.',
      affectedPeople: 450,
      activeSOS: 2,
      latitude: 28.6500,
      longitude: 77.1900,
      status: 'Active',
    },
    {
      _id: 'area-5',
      name: 'Central Marketplace',
      disasterType: 'Urban Waterlogging',
      severity: 'Low',
      description: 'Storm drain overflow cleared; municipal pumps operational.',
      affectedPeople: 300,
      activeSOS: 0,
      latitude: 28.6100,
      longitude: 77.2300,
      status: 'Recovering',
    },
  ],
  alerts: [
    {
      _id: 'alt-1',
      title: 'CRITICAL: Severe Flood Warning for North Riverfront',
      message: 'River levels rising rapidly. Evacuate ground floor quarters immediately to Central Indoor Stadium Shelter.',
      type: 'Flood',
      severity: 'Critical',
      location: 'North Campus & Riverfront Zone',
      active: true,
      createdAt: new Date().toISOString(),
    },
    {
      _id: 'alt-2',
      title: 'DANGER: Fire Safety Advisory — Academic Block 4',
      message: 'Firefighting teams actively extinguishing corridor blaze. Avoid Block 4 and keep access roads clear.',
      type: 'Fire',
      severity: 'Danger',
      location: 'Academic Block 4, South Campus',
      active: true,
      createdAt: new Date().toISOString(),
    },
    {
      _id: 'alt-3',
      title: 'WARNING: Heavy Thunderstorm & High Winds Forecast',
      message: 'Wind gusts up to 75 km/h expected. Stay indoors and avoid standing near weak trees or electrical poles.',
      type: 'Thunderstorm',
      severity: 'Warning',
      location: 'Entire Campus Region',
      active: true,
      createdAt: new Date().toISOString(),
    },
    {
      _id: 'alt-4',
      title: 'INFO: Safe Drinking Water Distribution Station Open',
      message: 'Clean potable drinking water packets available at Student Center Helpdesk.',
      type: 'General',
      severity: 'Information',
      location: 'Student Activity Center',
      active: true,
      createdAt: new Date().toISOString(),
    },
  ],
  incidents: [
    {
      _id: 'inc-1',
      incidentId: 'INC-2041',
      title: 'Emergency Exit Door Jammed with Debris',
      type: 'Blocked emergency exit',
      description: 'Construction wooden planks and discarded furniture blocking the rear emergency fire escape door in hostel 2.',
      severity: 'High',
      location: 'Hostel 2, Ground Floor Rear Exit',
      reporterName: 'Shikhar (Student)',
      status: 'Under Review',
      createdAt: new Date().toISOString(),
    },
    {
      _id: 'inc-2',
      incidentId: 'INC-2042',
      title: 'Sparking Exposed Electrical Transformer',
      type: 'Damaged electrical equipment',
      description: 'Water dripping onto main step-down transformer next to cafeteria creating sparking and smoke.',
      severity: 'Critical',
      location: 'Cafeteria Junction Substation',
      reporterName: 'Ananya Roy',
      status: 'Pending',
      createdAt: new Date().toISOString(),
    },
    {
      _id: 'inc-3',
      incidentId: 'INC-2043',
      title: 'Large Banyan Tree Branch Fallen on Access Road',
      type: 'Fallen tree',
      description: 'Heavy wind snapped 15-meter branch blocking ambulance route toward University Health Center.',
      severity: 'Medium',
      location: 'Health Center Roadway',
      reporterName: 'Ravi Teja',
      status: 'Resolved',
      createdAt: new Date().toISOString(),
    },
  ],
  resources: [
    {
      _id: 'res-1',
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
      _id: 'res-2',
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
      _id: 'res-3',
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
      _id: 'res-4',
      name: 'Campus Police Station & PCR Control',
      type: 'Police Station',
      address: 'Main Administrative Circle',
      phone: '+91 11 112',
      description: 'Disaster response coordination, law enforcement, crowd control, and patrol vans.',
      latitude: 28.6080,
      longitude: 77.2120,
      status: 'Operational',
    },
    {
      _id: 'res-5',
      name: 'District Disaster Management Authority (DDMA)',
      type: 'Disaster Management Office',
      address: 'Collectorate Complex, Block B',
      phone: '+91 11 2392 3456',
      description: 'Government apex coordination unit for disaster alerts and NDRF deployment.',
      latitude: 28.6300,
      longitude: 77.2300,
      status: 'Operational',
    },
    {
      _id: 'res-6',
      name: 'Red Cross Relief Warehouse',
      type: 'Relief Center',
      address: 'Sector 15 Logistics Hub',
      phone: '+91 11 2371 6441',
      description: 'Central stockpile of emergency ration kits, blankets, hygiene packs, and tarpaulins.',
      latitude: 28.5900,
      longitude: 77.2180,
      status: 'Operational',
    },
    {
      _id: 'res-7',
      name: 'Community Food Kitchen & Water Base',
      type: 'Food Distribution Center',
      address: 'Community Hall, Sector 8',
      phone: '+91 11 2345 8899',
      description: 'Distributes 3,000 cooked meal packets daily and operates 4 potable water tankers.',
      latitude: 28.6020,
      longitude: 77.2050,
      status: 'Operational',
    },
    {
      _id: 'res-8',
      name: 'St. John Ambulance Rapid Response Squad',
      type: 'Medical Center',
      address: 'Near Metro Station Gate 3',
      phone: '+91 11 2345 7766',
      description: 'Mobile paramedical vans with trained student volunteers and stretcher teams.',
      latitude: 28.6180,
      longitude: 77.2250,
      status: 'Operational',
    },
    {
      _id: 'res-9',
      name: 'Central University Indoor Stadium Shelter Desk',
      type: 'Emergency Shelter',
      address: 'Sports Complex, University Campus',
      phone: '+91 11 2345 6780',
      description: 'Large ventilated emergency shelter with beds, toilets, and food mess.',
      latitude: 28.6139,
      longitude: 77.2090,
      status: 'Operational',
    },
    {
      _id: 'res-10',
      name: 'State Disaster Response Force (SDRF) Post',
      type: 'Disaster Management Office',
      address: 'Boat Club, Riverfront East',
      phone: '+91 11 2345 9900',
      description: 'Equipped with motorized inflatable rescue boats and flood scuba divers.',
      latitude: 28.6380,
      longitude: 77.2240,
      status: 'Operational',
    },
  ],
  donations: [
    {
      _id: 'don-1',
      donationId: 'DON-3011',
      donor: 'Tata Relief Trust & Alumni Network',
      type: 'Medical Supplies',
      resourceName: 'Emergency First-Aid Kits & Antibiotics',
      quantity: 1200,
      unit: 'kits',
      destination: 'Central University Indoor Stadium Shelter',
      status: 'Fully Distributed',
      blockchainTransactionId: 'TXN-881204',
      createdAt: new Date().toISOString(),
    },
    {
      _id: 'don-2',
      donationId: 'DON-3012',
      donor: 'Rotary Club City Chapter',
      type: 'Food',
      resourceName: 'Ready-to-Eat Emergency Food Packets',
      quantity: 3500,
      unit: 'meals',
      destination: 'Community Food Kitchen Sector 8',
      status: 'Partially Distributed',
      blockchainTransactionId: 'TXN-881205',
      createdAt: new Date().toISOString(),
    },
    {
      _id: 'don-3',
      donationId: 'DON-3013',
      donor: 'Care India Foundation',
      type: 'Water',
      resourceName: 'Packaged Drinking Water Liters',
      quantity: 5000,
      unit: 'bottles',
      destination: 'North Riverfront Zone Shelter',
      status: 'Received',
      blockchainTransactionId: 'TXN-881206',
      createdAt: new Date().toISOString(),
    },
    {
      _id: 'don-4',
      donationId: 'DON-3014',
      donor: 'Student Union Relief Drive',
      type: 'Blankets',
      resourceName: 'Thermal Woolen Blankets',
      quantity: 800,
      unit: 'blankets',
      destination: 'Government Model Senior School Shelter',
      status: 'Verified',
      blockchainTransactionId: 'TXN-881207',
      createdAt: new Date().toISOString(),
    },
    {
      _id: 'don-5',
      donationId: 'DON-3015',
      donor: 'Tech Innovators NGO',
      type: 'Emergency Kits',
      resourceName: 'Solar Rechargeable Flashlights & Power Banks',
      quantity: 450,
      unit: 'units',
      destination: 'Red Cross Emergency Transit Shelter',
      status: 'Registered',
      blockchainTransactionId: 'TXN-881208',
      createdAt: new Date().toISOString(),
    },
  ],
  distributions: [
    {
      _id: 'dis-1',
      distributionId: 'DIS-4011',
      resourceName: 'Emergency First-Aid Kits',
      quantity: 500,
      unit: 'kits',
      source: 'Red Cross Relief Warehouse',
      destination: 'Central University Indoor Stadium Shelter',
      responsibleOrganization: 'St. John Ambulance Squad',
      status: 'Distributed',
      blockchainTransactionId: 'TXN-881204',
      createdAt: new Date().toISOString(),
    },
    {
      _id: 'dis-2',
      distributionId: 'DIS-4012',
      resourceName: 'Ready-to-Eat Food Packets',
      quantity: 1500,
      unit: 'meals',
      source: 'Community Food Kitchen Sector 8',
      destination: 'North Riverfront Zone Evacuees',
      responsibleOrganization: 'NCC Relief Squad',
      status: 'Delivered',
      blockchainTransactionId: 'TXN-881205',
      createdAt: new Date().toISOString(),
    },
    {
      _id: 'dis-3',
      distributionId: 'DIS-4013',
      resourceName: 'Packaged Drinking Water Bottles',
      quantity: 2000,
      unit: 'bottles',
      source: 'Red Cross Relief Warehouse',
      destination: 'Girls Hostel 3 Flood Point',
      responsibleOrganization: 'SDRF Flood Team',
      status: 'In Transit',
      blockchainTransactionId: 'TXN-881206',
      createdAt: new Date().toISOString(),
    },
    {
      _id: 'dis-4',
      distributionId: 'DIS-4014',
      resourceName: 'Thermal Woolen Blankets',
      quantity: 400,
      unit: 'blankets',
      source: 'Student Union Relief Drive',
      destination: 'City Youth Center Emergency Camp',
      responsibleOrganization: 'Volunteer Corps',
      status: 'Delivered',
      blockchainTransactionId: 'TXN-881207',
      createdAt: new Date().toISOString(),
    },
    {
      _id: 'dis-5',
      distributionId: 'DIS-4015',
      resourceName: 'Solar Flashlights & Power Banks',
      quantity: 200,
      unit: 'units',
      source: 'Tech Innovators NGO Depot',
      destination: 'Government Model Senior School Shelter',
      responsibleOrganization: 'Campus Taskforce',
      status: 'Planned',
      blockchainTransactionId: 'TXN-881208',
      createdAt: new Date().toISOString(),
    },
  ],
  blockchainRecords: [
    {
      _id: 'bc-1',
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
      timestamp: new Date().toISOString(),
      verificationNote: 'Cryptographically verified relief donation registered on DisasterChain transparency ledger.',
    },
    {
      _id: 'bc-2',
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
      timestamp: new Date().toISOString(),
      verificationNote: 'Cryptographically verified relief donation registered on DisasterChain transparency ledger.',
    },
    {
      _id: 'bc-3',
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
      timestamp: new Date().toISOString(),
      verificationNote: 'Cryptographically verified relief distribution registered on DisasterChain transparency ledger.',
    },
    {
      _id: 'bc-4',
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
      timestamp: new Date().toISOString(),
      verificationNote: 'Cryptographically verified relief distribution registered on DisasterChain transparency ledger.',
    },
  ],
  preparednessGuides: [
    {
      disasterType: 'Earthquake',
      title: 'Earthquake Safety & Preparedness Guide',
      description: 'Comprehensive protocols for seismic tremors, structural collapse mitigation, and evacuation.',
      icon: '🏚️',
      before: [
        'Identify safe spots in each room: under sturdy desks, tables, or interior walls.',
        'Secure heavy items, bookshelves, and laboratory chemicals to walls with brackets.',
        'Keep your DisasterReady emergency kit accessible near your exit door.',
        'Practice Drop, Cover, and Hold On drills regularly.',
      ],
      during: [
        'DROP to your hands and knees to prevent being knocked over.',
        'COVER your head and neck under a sturdy table or desk.',
        'HOLD ON to your shelter until shaking stops.',
        'If outdoors, move away from buildings, streetlights, and power cables.',
        'DO NOT use elevators under any circumstances.',
      ],
      after: [
        'Check yourself and others for injuries and administer first aid.',
        'Inspect for gas leaks, damaged wiring, and cracked water pipes.',
        'Evacuate calmly using stairwells once shaking ceases.',
        'Expect aftershocks and stay tuned to DisasterChain broadcasts.',
      ],
      dos: [
        'Drop, Cover, and Hold on immediately when shaking begins.',
        'Protect your head with your arms or heavy backpack.',
        'Turn off main electrical breaker and gas valve if safe.',
      ],
      donts: [
        'Do NOT rush toward exterior doors or windows during shaking.',
        'Do NOT use matches or open flames due to potential gas leaks.',
        'Do NOT spread unverified rumors on social media.',
      ],
      emergencyKit: [
        { item: 'Drinking Water (3 Liters per person)', description: '3-day emergency supply', essential: true },
        { item: 'First-Aid Kit & Prescription Medicines', description: 'Bandages, antiseptic, painkillers', essential: true },
        { item: 'High-Power LED Flashlight', description: 'With extra batteries', essential: true },
        { item: 'Multi-Tool & Whistle', description: 'To signal rescue workers if trapped', essential: true },
        { item: 'Charged Power Bank & Cable', description: 'For emergency mobile communication', essential: true },
      ],
    },
    {
      disasterType: 'Flood',
      title: 'Flood Safety & Water Inundation Protocols',
      description: 'Preparation, survival tactics, and waterborne disease mitigation during flash floods and rising rivers.',
      icon: '🌊',
      before: [
        'Elevate electrical appliances and academic documents to upper floors.',
        'Know the designated high-ground evacuation routes on campus.',
        'Store clean drinking water in sealed containers.',
      ],
      during: [
        'Move immediately to higher ground or upper floors.',
        'NEVER walk, swim, or drive through moving flood water.',
        'Disconnect electricity at main fuse box if water enters building.',
      ],
      after: [
        'Avoid floodwaters as they may carry electrical charge or contamination.',
        'Boil all water before drinking or use purification tablets.',
        'Report structural cracks through Incident Reporting.',
      ],
      dos: [
        'Turn off electricity and gas supply before evacuating.',
        'Keep mobile phone in a waterproof pouch.',
        'Listen to official DisasterChain alerts.',
      ],
      donts: [
        'Do NOT touch electrical equipment if standing in water.',
        'Do NOT drink tap water until declared safe.',
      ],
      emergencyKit: [
        { item: 'Water Purification Tablets', description: 'Chlorine-based safe water purifier', essential: true },
        { item: 'Waterproof Document Pouch', description: 'For ID cards, certificates, and cash', essential: true },
        { item: 'Emergency Rations (Canned/Dry)', description: '3-day non-perishable food', essential: true },
      ],
    },
    {
      disasterType: 'Fire',
      title: 'Fire Safety & Campus Evacuation Guide',
      description: 'Fire hazard prevention, extinguisher operation (PASS method), and rapid building evacuation.',
      icon: '🔥',
      before: [
        'Learn location of all fire extinguishers and emergency exits in your building.',
        'Ensure emergency stairwells are never blocked.',
        'Avoid overloading electrical extension strips.',
      ],
      during: [
        'Pull nearest fire alarm and shout to alert others.',
        'CRAWL LOW under smoke where air is coolest and cleanest.',
        'Feel doors before opening; if warm, do NOT open.',
        'Use P.A.S.S. method for extinguishers (Pull, Aim, Squeeze, Sweep).',
      ],
      after: [
        'Assemble at designated campus evacuation point.',
        'Report missing persons to rescue coordinators.',
        'Do NOT re-enter building until declared safe.',
      ],
      dos: [
        'Stay low to floor to avoid toxic fumes.',
        'Close doors behind you to slow fire spread.',
        'Submit emergency SOS on DisasterChain immediately.',
      ],
      donts: [
        'Do NOT use elevators during a fire.',
        'Do NOT stop to collect personal belongings.',
      ],
      emergencyKit: [
        { item: 'Smoke Escape Mask / N95 Respirator', description: 'Filters smoke particles', essential: true },
        { item: 'Fire Blanket', description: 'To extinguish clothing fires', essential: true },
      ],
    },
    {
      disasterType: 'Cyclone',
      title: 'Cyclone & Extreme Storm Protocols',
      description: 'Preparation for tropical cyclones, high wind speeds, and falling debris protection.',
      icon: '🌀',
      before: [
        'Secure loose rooftop items and outdoor furniture.',
        'Tape large glass windows to prevent shattering.',
        'Fully charge power banks and emergency lamps.',
      ],
      during: [
        'Remain indoors in central ground floor room away from windows.',
        'Beware of the calm eye of the storm.',
      ],
      after: [
        'Watch out for dangling electrical cables and report them.',
      ],
      dos: ['Stay indoors until all clear is sounded.'],
      donts: ['Do NOT venture outside to take videos during high winds.'],
      emergencyKit: [
        { item: 'Battery-Powered Radio', description: 'For emergency announcements', essential: true },
      ],
    },
    {
      disasterType: 'Landslide',
      title: 'Landslide & Slope Failure Preparedness',
      description: 'Warning signs detection and emergency response in hilly or sloping terrain.',
      icon: '⛰️',
      before: ['Observe slope changes: tilting trees or soil cracks.'],
      during: ['Quickly move out of the path of debris flow.'],
      after: ['Stay away from slide area as secondary slides may occur.'],
      dos: ['Evacuate immediately upon hearing rumbling sounds.'],
      donts: ['Do NOT cross bridges if high-velocity mud flow is active.'],
      emergencyKit: [
        { item: 'Emergency Whistle & Heavy Boots', description: 'For navigation', essential: true },
      ],
    },
    {
      disasterType: 'Heatwave',
      title: 'Severe Heatwave & Hyperthermia Prevention',
      description: 'Protection strategies against extreme ambient temperatures and heat stroke.',
      icon: '☀️',
      before: ['Stock up on ORS, electrolytes, and clean water.'],
      during: ['Drink water frequently and stay in cool shaded areas.'],
      after: ['Continue hydration and monitor pulse rate.'],
      dos: ['Carry umbrella, hat, and cold water when outdoors.'],
      donts: ['Do NOT leave children or pets inside parked vehicles.'],
      emergencyKit: [
        { item: 'ORS Sachets & Electrolyte Powder', description: 'Instant hydration', essential: true },
      ],
    },
  ],
};

// Helper API functions that return real API data or fallback seamlessly
export const fetchSosRequests = async (params = {}) => {
  try {
    const res = await api.get('/sos', { params });
    return res.data.data;
  } catch (err) {
    return fallbackData.sosRequests;
  }
};

export const fetchShelters = async (params = {}) => {
  try {
    const res = await api.get('/shelters', { params });
    return res.data.data;
  } catch (err) {
    return fallbackData.shelters;
  }
};

export const fetchAffectedAreas = async () => {
  try {
    const res = await api.get('/affected-areas');
    return res.data.data;
  } catch (err) {
    return fallbackData.affectedAreas;
  }
};

export const fetchAlerts = async (params = {}) => {
  try {
    const res = await api.get('/alerts', { params });
    return res.data.data;
  } catch (err) {
    return fallbackData.alerts;
  }
};

export const fetchIncidents = async () => {
  try {
    const res = await api.get('/incidents');
    return res.data.data;
  } catch (err) {
    return fallbackData.incidents;
  }
};

export const fetchResources = async (params = {}) => {
  try {
    const res = await api.get('/resources', { params });
    return res.data.data;
  } catch (err) {
    return fallbackData.resources;
  }
};

export const fetchDonations = async () => {
  try {
    const res = await api.get('/donations');
    return res.data.data;
  } catch (err) {
    return fallbackData.donations;
  }
};

export const fetchDistributions = async () => {
  try {
    const res = await api.get('/distributions');
    return res.data.data;
  } catch (err) {
    return fallbackData.distributions;
  }
};

export const fetchBlockchainTransactions = async (params = {}) => {
  try {
    const res = await api.get('/blockchain/transactions', { params });
    return res.data.data;
  } catch (err) {
    return fallbackData.blockchainRecords;
  }
};

export const fetchPreparednessGuides = async () => {
  try {
    const res = await api.get('/preparedness');
    return res.data.data;
  } catch (err) {
    return fallbackData.preparednessGuides;
  }
};

// ================= AUTHENTICATION & USER PROFILE API =================
export const registerUser = async ({ name, email, password, confirmPassword, role }) => {
  return await api.post('/auth/register', { name, email, password, confirmPassword, role });
};

export const loginUser = async ({ email, password }) => {
  return await api.post('/auth/login', { email, password });
};

export const verifyEmail = async (token) => {
  return await api.post('/auth/verify-email', { token });
};

export const resendVerification = async (email) => {
  return await api.post('/auth/resend-verification', { email });
};

export const forgotPassword = async (email) => {
  return await api.post('/auth/forgot-password', { email });
};

export const resetPassword = async ({ token, password, confirmPassword }) => {
  return await api.post('/auth/reset-password', { token, password, confirmPassword });
};

export const fetchUserProfile = async () => {
  const res = await api.get('/auth/me');
  return res.data.data;
};

export const updateUserProfile = async (name) => {
  const res = await api.put('/auth/updatedetails', { name });
  return res.data.data;
};

export const logoutUser = async () => {
  try {
    await api.post('/auth/logout');
  } catch (err) {
    // Ignore offline errors on logout
  }
};

export default api;

