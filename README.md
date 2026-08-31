# DisasterChain 🚨⛓️

> **"Respond Faster. Recover Smarter. Track Transparently."**

DisasterChain is a full-stack disaster management and emergency response web platform designed for students, educational institutions, volunteers, and emergency administrators.

It uniquely combines:
1. **Centralized Disaster Response & Emergency Command** (SOS distress signaling, shelter capacity tracking, geographic hazard heat maps, emergency alerts, preparedness checklists, and campus incident reporting).
2. **Blockchain-Based Transparency & Relief Audit** (Cryptographic SHA-256 block receipts, immutable donation tracking, and end-to-end **Resource Journey** timelines ensuring zero diversion of humanitarian aid).
3. **Low-Connectivity Emergency Workflow** (Offline cached safety guides, direct emergency hotlines, and SMS dispatch generation for network blackout scenarios).

---

## 🛠️ Technology Stack

- **Frontend**: React, React Router, Axios, HTML5, Vanilla CSS3 (Stitch AI inspired modern dark/light emergency theme)
- **Backend**: Node.js, Express.js, CORS, dotenv
- **Database**: MongoDB & Mongoose
- **Authentication**: JWT (JSON Web Tokens) & bcryptjs password hashing
- **Blockchain Infrastructure**: Prototype cryptographic testnet ledger (SHA-256 block hashing, digital signatures, block linking) + Solidity smart contract (`DisasterLedger.sol`)

---

## 📁 Project Structure

```text
disasterchain/
├── PRD.md                           # Product Requirements Document
├── README.md                        # Project documentation and setup guide
├── .gitignore                       # Git ignore rules
│
├── frontend/                        # Client-side React Application
│   ├── public/                      # Static assets & index.html
│   ├── src/
│   │   ├── components/              # Reusable UI components
│   │   │   ├── Navbar.jsx           # Global header with live pulse & quick SOS
│   │   │   ├── Sidebar.jsx          # Collapsible navigation drawer
│   │   │   ├── StatCard.jsx         # Analytics metric display card
│   │   │   ├── EmergencyAlertBanner.jsx # Critical alert broadcast ticker
│   │   │   ├── SosModal.jsx         # Emergency SOS submission with GPS simulation
│   │   │   ├── IncidentModal.jsx    # Campus hazard reporting modal
│   │   │   ├── ResourceJourneyModal.jsx # 5-step visual supply chain tracker
│   │   │   └── BlockchainReceiptModal.jsx # Cryptographic block proof dialog
│   │   ├── context/
│   │   │   └── AuthContext.jsx      # Authentication & instant 1-click Demo logins
│   │   ├── pages/                   # Full application page views
│   │   │   ├── LandingPage.jsx      # Hero, features & "Where does relief go?" flow
│   │   │   ├── LoginPage.jsx        # Login with Demo shortcuts
│   │   │   ├── RegisterPage.jsx     # Student registration
│   │   │   ├── EmergencyDashboard.jsx # Central command center & live map
│   │   │   ├── SosPage.jsx          # SOS distress queue with severity filter
│   │   │   ├── SheltersPage.jsx     # Shelter directory & occupancy meters
│   │   │   ├── AffectedAreasPage.jsx # Geographic hazard zone visualizer
│   │   │   ├── AlertsPage.jsx       # Official emergency broadcast list
│   │   │   ├── DisasterGuidesPage.jsx # 6 disaster guides & interactive kit checklist
│   │   │   ├── IncidentReportsPage.jsx # Crowdsourced hazard reports
│   │   │   ├── MyReportsPage.jsx    # Personal tracking for submitted SOS & reports
│   │   │   ├── EmergencyResourcesPage.jsx # Hospital, police & fire directory
│   │   │   ├── DonationsPage.jsx    # Transparent relief donations ledger
│   │   │   ├── ResourceTrackingPage.jsx # Logistics flow & journey timeline
│   │   │   ├── TransparencyLedgerPage.jsx # Searchable blockchain transaction explorer
│   │   │   ├── OfflineEmergencyPage.jsx # Low-connectivity mode & SMS generator
│   │   │   └── AdminDashboard.jsx   # Admin management & analytics charts
│   │   ├── services/
│   │   │   └── api.js               # Axios API client with resilient demo fallback
│   │   ├── App.js                   # Application routing and global modal wrapper
│   │   ├── index.js                 # React entry point
│   │   └── index.css                # Stitch design system & CSS variables
│   └── package.json                 # Frontend dependencies
│
├── backend/                         # Server-side Node.js & Express API
│   ├── config/                      # Database configuration (Mongoose connect)
│   │   └── db.js
│   ├── controllers/                 # Business logic & request handlers
│   │   ├── authController.js        # Registration, login & profile
│   │   ├── sosController.js         # SOS broadcasting & status updates
│   │   ├── shelterController.js     # Shelter capacity & CRUD
│   │   ├── affectedAreaController.js # Impact zone management
│   │   ├── alertController.js       # Emergency broadcast creation
│   │   ├── incidentController.js    # Hazard ticket management
│   │   ├── resourceController.js    # Directory management
│   │   ├── donationController.js    # Donation logging + blockchain minting
│   │   ├── distributionController.js # Distribution logging + blockchain minting
│   │   ├── preparednessController.js # Disaster guides data
│   │   ├── blockchainController.js  # Ledger exploration & verification
│   │   └── seedController.js        # Comprehensive demo database populator
│   ├── middleware/
│   │   └── auth.js                  # JWT verification & admin guard
│   ├── models/                      # MongoDB Mongoose Schemas (11 models)
│   │   ├── User.js
│   │   ├── SosRequest.js
│   │   ├── Shelter.js
│   │   ├── AffectedArea.js
│   │   ├── Alert.js
│   │   ├── Incident.js
│   │   ├── Resource.js
│   │   ├── Donation.js
│   │   ├── Distribution.js
│   │   ├── Preparedness.js
│   │   └── BlockchainRecord.js
│   ├── routes/                      # Express route endpoints
│   ├── services/
│   │   └── blockchainService.js     # SHA-256 block hashing & ledger verification
│   ├── .env.example                 # Environment variable template
│   ├── server.js                    # Express app entry point
│   └── package.json                 # Backend dependencies
│
└── blockchain/                      # Smart Contract Architecture
    ├── contracts/
    │   └── DisasterLedger.sol       # Solidity smart contract for immutable tracking
    └── README.md                    # Blockchain architecture documentation
```

---

## ⚡ Quick Start Guide (Beginner Friendly)

### 1. Prerequisites
- Install **Node.js** (v18 or higher recommended) from [nodejs.org](https://nodejs.org/)
- (Optional) **MongoDB** running locally on port 27017 or a MongoDB Atlas URI

### 2. Backend Setup
1. Open a terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the backend server:
   ```bash
   npm run dev
   ```
   *The server starts on `http://localhost:5000`.*

4. **Seed Demo Data** (Populates sample users, SOS requests, shelters, alerts, guides, and blockchain blocks):
   - Open in browser or make a GET request to: `http://localhost:5000/api/seed`

### 3. Frontend Setup
1. Open a second terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the React development server:
   ```bash
   npm start
   ```
   *The frontend starts on `http://localhost:3000`.*

---

## 🔑 Demo Evaluation Credentials

DisasterChain includes 1-click **Demo Login buttons** on the landing and login pages for effortless examination:

| Role | Email | Password | Access Capabilities |
| :--- | :--- | :--- | :--- |
| **🎓 Student** | `student@disasterchain.org` | `student123` | Broadcast SOS, report hazards, view shelters, search guides, track personal reports, view blockchain ledger |
| **🛡️ Admin** | `admin@disasterchain.org` | `admin123` | Admin dashboard, update SOS statuses, review hazards, add shelters, broadcast alerts, record donations & mint blockchain blocks |

---

## 🎯 Step-by-Step Project Demonstration Flow (PRD Section 42)

1. **Open Landing Page**: View the project tagline *"Respond Faster. Recover Smarter. Track Transparently."*, feature cards, and the *"Where does the relief go?"* 5-step flow diagram.
2. **Student Login**: Click **"🎓 Demo Student"** to log in instantly.
3. **Emergency Dashboard**: Inspect the active emergency counter, shelter occupancy meter, visual interactive affected area map, and live emergency alert banner.
4. **Broadcast SOS**: Click **"🚨 SUBMIT SOS"**, select distress type (e.g., Medical Emergency), click **"📍 Auto-Detect GPS"**, and transmit the distress signal.
5. **Explore Shelters**: Open **Available Shelters**, inspect real-time bed capacity meters, filter by medical/food amenities, and test one-tap dialing.
6. **Safety Checklist**: Open **Disaster Guides**, select **Earthquake**, switch between Before/During/After phases, and check off items in the **Emergency Kit Checklist**.
7. **Report Campus Hazard**: Click **"⚠️ Report Hazard"**, submit a blocked fire exit or sparking transformer report, then open **My Submitted Reports** to track its review status.
8. **Blockchain Transparency Ledger**: Open **Transparency Ledger**, search transactions, click **"View Blockchain Record"** to inspect cryptographic SHA-256 block proofs.
9. **Low-Connectivity Mode**: Open **Low-Connectivity Support**, review cached emergency numbers, and inspect the SMS emergency dispatch generator.
10. **Admin Portal**: Logout and log in with **"🛡️ Demo Admin"** -> open **Admin Dashboard** -> update an SOS status to "In Progress" / "Resolved", broadcast a new emergency alert, and log a relief shipment to mint a new block on the ledger.
