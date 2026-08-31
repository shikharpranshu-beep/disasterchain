# DisasterChain — Product Requirements Document

## 1. Project Name

DisasterChain

## 2. Project Tagline

"Respond Faster. Recover Smarter. Track Transparently."

---

# 3. Project Overview

DisasterChain is a full-stack disaster management and emergency response platform designed primarily for students, educational institutions, volunteers, and administrators.

The platform combines two important areas:

1. Disaster Management
2. Blockchain-based transparency for donations and resource distribution

The goal is to provide a centralized dashboard where users can report emergencies, view SOS requests, find available shelters, see affected areas, access disaster preparedness information, receive alerts, and track disaster resources.

The blockchain component provides a transparent and tamper-resistant record of important donation and resource-distribution transactions.

---

# 4. Problem Statement

Student Innovation — Disaster Management includes ideas related to risk mitigation, planning, and management before, after, or during a disaster.

During disasters, several problems can occur:

- People may not know where nearby shelters are located.
- Emergency requests may be difficult to organize.
- Disaster-affected areas may be difficult to monitor.
- Important emergency information may be scattered across different sources.
- Donations and relief resources can become difficult to track.
- People may not know whether donated resources reached their intended destination.
- Areas with poor internet connectivity may have difficulty accessing online emergency services.

DisasterChain aims to address these problems through a centralized disaster management dashboard combined with transparent blockchain-based resource tracking.

---

# 5. Main Objectives

The application should:

- Provide a centralized disaster response dashboard.
- Allow users to submit SOS/emergency requests.
- Display available shelters.
- Display affected areas.
- Provide emergency alerts.
- Provide disaster preparedness guides.
- Allow users to report hazards and incidents.
- Track emergency resources.
- Track donations.
- Track resource distribution.
- Maintain a transparent blockchain ledger for important donation/resource transactions.
- Provide an emergency workflow designed for low-connectivity situations.
- Provide an administrator dashboard for monitoring and managing disaster response.

---

# 6. Target Users

## 6.1 Student / Citizen

Users should be able to:

- Register.
- Login.
- View the disaster dashboard.
- Submit SOS requests.
- Report incidents.
- View nearby/available shelters.
- View affected areas.
- View emergency alerts.
- View disaster safety guides.
- View emergency resources.
- View their submitted SOS requests.
- View their submitted incident reports.
- View transparent donation/resource records.

## 6.2 Administrator

Administrators should be able to:

- Login securely.
- View the disaster response dashboard.
- View SOS requests.
- Manage SOS request status.
- View incident reports.
- Manage incident reports.
- Add and manage shelters.
- Add and manage affected areas.
- Create and manage emergency alerts.
- Manage emergency resources.
- Record donations.
- Record resource transfers.
- View blockchain transaction records.
- View system statistics.

---

# 7. Core Modules

The application should contain the following major modules:

1. Emergency Dashboard
2. SOS Requests
3. Shelters
4. Affected Areas
5. Emergency Alerts
6. Incident Reporting
7. Disaster Preparedness
8. Emergency Resources
9. Donations
10. Resource Distribution
11. Blockchain Transparency Ledger
12. Low-Connectivity Emergency Workflow
13. Admin Dashboard

---

# 8. Emergency Dashboard

The main dashboard should provide a quick overview of the current disaster situation.

Display statistics such as:

- Active SOS requests
- Critical SOS requests
- Available shelters
- Number of affected areas
- Active emergency alerts
- Available resources
- Total donations
- Resources distributed

The dashboard should contain:

- Emergency status
- Active alerts
- SOS summary
- Shelter summary
- Affected area map/visualization
- Resource statistics
- Recent activity
- Blockchain transparency summary

The most important emergency information should be visible immediately.

---

# 9. SOS Requests

Users should be able to submit emergency/SOS requests.

SOS form fields:

- Name
- Emergency type
- Description
- Location
- Number of people affected
- Severity
- Contact information

Emergency types:

- Medical Emergency
- Fire
- Flood
- Building Damage
- Trapped Person
- Missing Person
- Accident
- Other

Severity:

- Low
- Medium
- High
- Critical

SOS status:

- Pending
- Assigned
- In Progress
- Resolved
- Cancelled

Each SOS request should have a unique ID.

Example:

SOS-1042

The administrator should be able to update the status.

---

# 10. SOS Dashboard

The administrator should have an SOS management dashboard.

Display:

- Total SOS requests
- Critical requests
- Pending requests
- Requests in progress
- Resolved requests

Provide filtering by:

- Severity
- Disaster type
- Status
- Location

Critical SOS requests should be visually prominent.

---

# 11. Shelters

Create a shelter management system.

Each shelter should contain:

- Shelter name
- Address
- Location
- Total capacity
- Current occupancy
- Available capacity
- Contact number
- Facilities
- Status

Facilities can include:

- Food
- Drinking Water
- Medical Support
- Electricity
- Toilets
- Sleeping Area
- Internet

Shelter status:

- Open
- Full
- Temporarily Closed

The user interface should clearly display available capacity.

Example:

Shelter A

Capacity: 500

Occupied: 320

Available: 180

Status: Open

---

# 12. Affected Areas

Create an affected-area monitoring module.

Each affected area should contain:

- Area name
- Disaster type
- Severity
- Description
- Number of affected people
- Number of active SOS requests
- Location
- Date/time
- Status

Severity:

- Low
- Moderate
- High
- Critical

Display affected areas using a map-style interface or visual geographic representation.

Use visual indicators:

- Green — Safe/Controlled
- Yellow — Low impact
- Orange — Moderate impact
- Red — High/Critical impact

For the initial project version, affected-area information may use manually entered or demo data.

The system must not claim that demo information is real-time government disaster information.

---

# 13. Emergency Alerts

Create an emergency alert system.

Each alert should contain:

- Title
- Message
- Disaster type
- Severity
- Location
- Created date
- Expiry date
- Active status

Severity:

- Information
- Warning
- Danger
- Critical

Administrators can:

- Create alerts.
- Edit alerts.
- Delete alerts.
- Activate alerts.
- Deactivate alerts.

Students can view active alerts.

Critical alerts should be displayed prominently.

---

# 14. Incident Reporting

Users should be able to report hazards and incidents.

Form fields:

- Incident title
- Disaster type
- Description
- Severity
- Location
- Optional image
- Date/time

Example incidents:

- Blocked emergency exit
- Fire hazard
- Flooding
- Damaged building
- Damaged electrical equipment
- Fallen tree
- Unsafe construction area
- Other

Incident status:

- Pending
- Under Review
- Resolved
- Rejected

Incidents must be stored in MongoDB.

---

# 15. Disaster Preparedness

Create a Disaster Preparedness section.

Disaster categories:

- Earthquake
- Flood
- Fire
- Cyclone
- Landslide
- Thunderstorm
- Heatwave
- Building Emergency

Each disaster guide should contain:

## Before the Disaster

Safety preparation steps.

## During the Disaster

Immediate safety actions.

## After the Disaster

Recovery and safety actions.

## Do's

Recommended actions.

## Don'ts

Actions to avoid.

## Emergency Kit

Recommended emergency supplies.

Use interactive checkboxes for preparedness tasks.

---

# 16. Emergency Resources

Create an emergency resources section.

Resource types:

- Hospital
- Fire Station
- Police Station
- Emergency Shelter
- Disaster Management Office
- Relief Center
- Food Distribution Center
- Medical Center

Each resource should contain:

- Name
- Type
- Address
- Phone
- Description
- Latitude
- Longitude
- Availability/status

Provide buttons where appropriate:

- Call
- View Location
- Get Directions

For the first version, resources can be manually stored in MongoDB.

---

# 17. Donations

Create a donation tracking module.

Donations may include:

- Money
- Food
- Water
- Blankets
- Clothes
- Medical Supplies
- Emergency Kits
- Other resources

Each donation should contain:

- Donation ID
- Donor name/organization
- Donation type
- Resource name
- Quantity
- Unit
- Destination
- Donation date
- Status
- Blockchain transaction ID

Donation statuses:

- Registered
- Verified
- Received
- Partially Distributed
- Fully Distributed

The system should not process real financial payments in the initial version.

The project should demonstrate donation/resource transparency rather than act as a real payment platform.

---

# 18. Resource Distribution

Administrators should be able to record the movement of resources.

Example:

1000 food kits donated.

Then:

500 → Shelter A

300 → Shelter B

200 → Shelter C

The system should record each distribution.

Distribution fields:

- Distribution ID
- Resource
- Quantity
- Source
- Destination
- Date
- Responsible organization
- Status
- Blockchain transaction ID

Statuses:

- Planned
- In Transit
- Delivered
- Distributed

---

# 19. Blockchain Transparency

Blockchain should be used to create transparent records of important donations and resource distributions.

The blockchain component should record information such as:

- Transaction ID
- Resource/donation ID
- Resource type
- Quantity
- Source
- Destination
- Timestamp
- Transaction status

Example:

Donation:

1000 Food Kits

Source:

ABC Foundation

Destination:

Relief Center A

Blockchain Transaction:

0x8a72...91fd

Status:

Distributed

The blockchain should provide a tamper-resistant verification record.

---

# 20. Blockchain Approach

For the academic prototype:

- Use a blockchain test/development environment.
- Do not use real cryptocurrency.
- Do not process real money.
- Use blockchain only for transparency and verification.
- Store the blockchain transaction reference in MongoDB.

MongoDB stores the application data.

Blockchain stores/verifies important transparency transactions.

Architecture:

User/Admin

↓

Frontend

↓

Backend API

↓

MongoDB

+

Blockchain Network

MongoDB is responsible for normal application data.

Blockchain is responsible for transparency records.

---

# 21. Transparency Ledger

Create a page called:

"Transparency Ledger"

It should display:

- Transaction ID
- Resource
- Quantity
- Donor/source
- Destination
- Date
- Status

Users should be able to click:

"View Blockchain Record"

This should display the blockchain transaction reference.

The interface should explain in simple language why the transaction is recorded.

Example:

"This record provides a transparent verification reference for this resource transaction."

---

# 22. Resource Journey

For each important resource, show its journey.

Example:

Donated

↓

Verified

↓

Received

↓

Warehouse

↓

Shelter

↓

Distributed

Display this as a visual timeline.

---

# 23. Low-Connectivity Emergency Workflow

Disaster situations may involve poor or unavailable internet connectivity.

The system should include a low-connectivity emergency workflow.

The interface should provide:

- Emergency contact information.
- Emergency numbers.
- Preparedness guides that can be accessed from cached/local application data where possible.
- SMS emergency workflow interface.

If a real SMS provider is configured, the backend may send emergency messages through the provider.

For the academic prototype, do not falsely claim that an SMS has been delivered unless a real SMS service confirms delivery.

If no SMS service is configured, clearly display:

"SMS gateway is not configured in this prototype."

The architecture should be designed so an SMS gateway can be integrated later.

---

# 24. Authentication

Implement secure authentication.

Features:

- Student registration
- Student login
- Admin login
- Logout
- JWT authentication
- Password hashing using bcrypt
- Role-based authorization

Roles:

- student
- admin

Passwords must never be stored in plain text.

---

# 25. MongoDB

MongoDB must be used as the main application database.

Use Mongoose for database interaction.

Collections/models:

## users

Fields:

- _id
- name
- email
- password
- role
- createdAt

## sosRequests

Fields:

- _id
- requestId
- name
- emergencyType
- description
- location
- peopleAffected
- severity
- contact
- status
- createdAt
- updatedAt

## incidents

Fields:

- _id
- title
- type
- description
- severity
- location
- imageUrl
- reportedBy
- status
- createdAt
- updatedAt

## shelters

Fields:

- _id
- name
- address
- latitude
- longitude
- capacity
- occupancy
- facilities
- status
- phone
- createdAt

## affectedAreas

Fields:

- _id
- name
- disasterType
- severity
- description
- affectedPeople
- activeSOS
- latitude
- longitude
- status
- createdAt

## alerts

Fields:

- _id
- title
- message
- type
- severity
- location
- active
- expiresAt
- createdAt

## resources

Fields:

- _id
- name
- type
- address
- phone
- description
- latitude
- longitude
- status
- createdAt

## donations

Fields:

- _id
- donationId
- donor
- type
- resourceName
- quantity
- unit
- destination
- status
- blockchainTransactionId
- createdAt

## distributions

Fields:

- _id
- distributionId
- resourceName
- quantity
- source
- destination
- responsibleOrganization
- status
- blockchainTransactionId
- createdAt

## preparedness

Fields:

- _id
- disasterType
- before
- during
- after
- dos
- donts
- emergencyKit

---

# 26. Backend Technology

Use:

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- bcrypt
- dotenv
- CORS

Use a beginner-friendly REST API architecture.

---

# 27. Backend API

## Authentication

POST /api/auth/register

POST /api/auth/login

GET /api/auth/me

## SOS

POST /api/sos

GET /api/sos

GET /api/sos/:id

PUT /api/sos/:id/status

## Incidents

POST /api/incidents

GET /api/incidents

GET /api/incidents/:id

PUT /api/incidents/:id/status

DELETE /api/incidents/:id

## Shelters

GET /api/shelters

POST /api/shelters

PUT /api/shelters/:id

DELETE /api/shelters/:id

## Affected Areas

GET /api/affected-areas

POST /api/affected-areas

PUT /api/affected-areas/:id

DELETE /api/affected-areas/:id

## Alerts

GET /api/alerts

POST /api/alerts

PUT /api/alerts/:id

DELETE /api/alerts/:id

## Resources

GET /api/resources

POST /api/resources

PUT /api/resources/:id

DELETE /api/resources/:id

## Donations

GET /api/donations

POST /api/donations

GET /api/donations/:id

## Distributions

GET /api/distributions

POST /api/distributions

## Preparedness

GET /api/preparedness

GET /api/preparedness/:type

## Blockchain

GET /api/blockchain/transactions

GET /api/blockchain/transactions/:id

POST /api/blockchain/record

---

# 28. Frontend Technology

Use:

- React
- JavaScript
- HTML
- CSS
- React Router
- Axios

The frontend should communicate with the backend through REST APIs.

---

# 29. Main Frontend Pages

## Public

1. Landing Page
2. Login
3. Register

## User

4. Emergency Dashboard
5. SOS
6. Shelters
7. Affected Areas
8. Alerts
9. Disaster Guides
10. Preparedness
11. Report Incident
12. My Reports
13. Emergency Resources
14. Donations/Resources
15. Transparency Ledger

## Admin

16. Admin Dashboard
17. SOS Management
18. Incident Management
19. Shelter Management
20. Affected Area Management
21. Alert Management
22. Resource Management
23. Donation Management
24. Distribution Management
25. Blockchain Ledger

---

# 30. UI Design

The UI should be designed using Stitch AI.

The design should be:

- Modern
- Professional
- Clean
- Responsive
- Student-friendly
- Safety-focused
- Accessible
- Easy to understand

Use:

- Dashboard cards
- Tables
- Charts
- Maps
- Status badges
- Emergency buttons
- Forms
- Modals
- Notifications
- Timelines
- Progress indicators

The design should look like a real disaster response platform.

---

# 31. Dashboard Visual Design

The main dashboard should contain:

Top statistics:

- SOS Requests
- Critical Emergencies
- Available Shelters
- Affected Areas
- Active Alerts
- Resources

Main area:

- Affected area map
- SOS request list
- Active alerts

Lower section:

- Resource distribution
- Donation transparency
- Recent activity

---

# 32. Navigation

Student navigation:

- Dashboard
- SOS
- Shelters
- Affected Areas
- Alerts
- Disaster Guides
- Resources
- My Reports
- Transparency
- Logout

Admin navigation:

- Dashboard
- SOS Requests
- Incidents
- Shelters
- Affected Areas
- Alerts
- Resources
- Donations
- Distributions
- Blockchain Ledger
- Logout

---

# 33. Landing Page

Hero:

"Respond Faster. Recover Smarter. Track Transparently."

Description:

"DisasterChain connects emergency response, disaster preparedness, shelters, SOS requests, and transparent resource tracking in one platform."

Buttons:

- Get Started
- Explore Disaster Guides

Feature cards:

- Emergency SOS
- Live Affected Areas
- Available Shelters
- Emergency Alerts
- Resource Tracking
- Blockchain Transparency

Include a section explaining:

"Where does the relief go?"

Show:

Donation

↓

Verification

↓

Distribution

↓

Blockchain Record

↓

Transparent Tracking

---

# 34. Charts and Statistics

Admin dashboard should contain simple charts for:

- SOS requests by severity
- Incidents by type
- Shelter occupancy
- Resources distributed
- Donations by type

Charts should use real data from MongoDB.

---

# 35. Security

The application must:

- Hash passwords with bcrypt.
- Use JWT authentication.
- Protect admin APIs.
- Validate input.
- Prevent unauthorized access.
- Store secrets in environment variables.
- Never expose MongoDB credentials to frontend.
- Never commit .env to Git.
- Use CORS appropriately.

---

# 36. Environment Variables

Use a backend .env file.

Example:

PORT=5000

MONGODB_URI=your_mongodb_connection_string

JWT_SECRET=your_secret_key

BLOCKCHAIN_RPC_URL=your_blockchain_rpc_url

BLOCKCHAIN_PRIVATE_KEY=your_private_key_if_required

Never hard-code secrets.

Never expose private blockchain keys to the frontend.

---

# 37. Demo Data

Create sample data for development.

Include:

### SOS

At least 5 demo SOS requests.

### Shelters

At least 5 demo shelters.

### Affected Areas

At least 5 demo affected areas.

### Alerts

At least 3 demo alerts.

### Resources

At least 10 demo emergency resources.

### Donations

At least 5 demo donations.

### Distributions

At least 5 demo resource distributions.

### Disaster Guides

At least 6 disaster categories.

---

# 38. Important Safety Rule

The application must never falsely claim:

- That police have been contacted.
- That an ambulance has been dispatched.
- That a fire department has been contacted.
- That an SMS was delivered.
- That a disaster is currently occurring.
- That affected-area data is officially real-time.

If external services are not connected, clearly label information as:

- Demo
- Sample
- Prototype
- Manually entered

---

# 39. Development Strategy

Build the application incrementally.

Do not build the entire application at once.

## Phase 1 — Project Setup

Create:

- frontend
- backend
- README
- environment configuration

## Phase 2 — Stitch UI

Design the main pages using Stitch AI.

## Phase 3 — Frontend

Implement the Stitch design in React.

## Phase 4 — Backend

Create Express server and REST APIs.

## Phase 5 — MongoDB

Connect MongoDB and create Mongoose models.

## Phase 6 — Authentication

Implement student/admin login.

## Phase 7 — Disaster Features

Implement:

- SOS
- Shelters
- Affected Areas
- Alerts
- Disaster Guides
- Incident Reports

## Phase 8 — Resource Management

Implement:

- Resources
- Donations
- Distributions

## Phase 9 — Blockchain

Implement blockchain transaction recording and verification.

## Phase 10 — Admin Dashboard

Connect all admin features.

## Phase 11 — Integration

Connect frontend to backend.

## Phase 12 — Testing

Test every major feature.

## Phase 13 — Documentation

Complete README and project documentation.

---

# 40. Project Structure

Use a clear structure:

disasterchain/

    frontend/

        src/

            components/

            pages/

            services/

            context/

            assets/

            App.jsx

            main.jsx

            index.css

        package.json

    backend/

        config/

        controllers/

        middleware/

        models/

        routes/

        services/

        server.js

        package.json

    blockchain/

        contracts/

        scripts/

    PRD.md

    README.md

    .gitignore

---

# 41. AI Coding Assistant Instructions

The developer is a first-year B.Tech CSE student with zero coding knowledge.

Therefore:

1. Keep code beginner-friendly.
2. Avoid unnecessary complexity.
3. Build one feature at a time.
4. Explain important changes.
5. Do not delete working features.
6. Inspect existing code before making changes.
7. Reuse components.
8. Avoid unnecessary dependencies.
9. Test each feature.
10. Use MongoDB for application data.
11. Use blockchain only where transparency adds value.
12. Never replace the database with fake frontend data.
13. Never expose secrets.
14. Keep environment variables secure.
15. Maintain a clean folder structure.
16. Update README when setup changes.
17. Do not claim external services are working when they are not configured.
18. Do not implement real-money donation processing.
19. Use test/development blockchain infrastructure.
20. Keep the final project understandable enough for a first-year student to explain.

---

# 42. Final Demonstration Flow

The final demonstration should follow this sequence:

1. Open DisasterChain landing page.
2. Explain the problem.
3. Login as student.
4. Open emergency dashboard.
5. Show SOS requests.
6. Submit an SOS request.
7. Show available shelters.
8. Show affected areas.
9. Open disaster preparedness guide.
10. Show emergency alerts.
11. Submit an incident report.
12. Open My Reports.
13. Show emergency resources.
14. Open Transparency Ledger.
15. Show donation/resource transaction.
16. Show blockchain transaction reference.
17. Explain resource journey.
18. Logout.
19. Login as admin.
20. Open admin dashboard.
21. Show SOS requests.
22. Update an SOS status.
23. Show incident reports.
24. Manage shelters.
25. Manage affected areas.
26. Create an emergency alert.
27. Add a donation.
28. Record resource distribution.
29. Show blockchain record.
30. Show MongoDB data.

---

# 43. Academic Value

The project demonstrates knowledge of:

- Frontend development
- Backend development
- REST APIs
- React
- Node.js
- Express
- MongoDB
- Mongoose
- Authentication
- JWT
- CRUD operations
- Role-based authorization
- Disaster management
- Emergency response
- Data visualization
- Blockchain
- Smart-contract concepts
- Resource transparency
- Responsive UI design

---

# 44. Future Scope

Future versions may include:

- Real government disaster APIs.
- Real-time disaster maps.
- GPS-based emergency response.
- Real SMS gateway.
- Push notifications.
- IoT disaster sensors.
- AI-based disaster prediction.
- AI incident classification.
- Computer vision for damage detection.
- Multilingual support.
- Offline-first Progressive Web App.
- Real blockchain smart contracts.
- NGO integration.
- Government agency integration.
- Volunteer coordination.
- Real-time resource tracking.

These features are not required for the first working version.

---

# 45. Definition of Done

The project is complete when:

- Frontend works.
- Backend works.
- MongoDB connects.
- Student registration works.
- Student login works.
- Admin login works.
- JWT authentication works.
- SOS requests work.
- Shelters work.
- Affected areas work.
- Alerts work.
- Incident reporting works.
- Disaster guides work.
- Emergency resources work.
- Donations can be recorded.
- Resource distributions can be recorded.
- Blockchain transparency records work in the prototype.
- Transparency Ledger works.
- Admin dashboard works.
- Frontend and backend communicate correctly.
- Responsive design works.
- Error handling works.
- Demo data exists.
- README exists.
- The entire project can be demonstrated.

---

# 46. Final Goal

Build a complete beginner-friendly full-stack disaster management platform called:

# DisasterChain

with the tagline:

# "Respond Faster. Recover Smarter. Track Transparently."

The project must combine:

Disaster Management

+

Emergency Response

+

Resource Tracking

+

Blockchain Transparency

using:

Antigravity IDE

+

Stitch AI

+

React

+

Node.js

+

Express.js

+

MongoDB

+

Mongoose

+

JWT

+

bcrypt

+

Blockchain test/development infrastructure.

The project should be functional, visually polished, secure, responsive, and simple enough for a first-year B.Tech CSE student to understand and explain during a project evaluation.