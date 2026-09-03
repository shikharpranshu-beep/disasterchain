# DISASTERCHAIN AI EMERGENCY ASSISTANT

## 1. Overview & Architecture

**DisasterChain AI Assistant** (*"Emergency Intelligence & Safety Assistant"*) is an operational intelligence system integrated into the DisasterChain emergency management platform. It combines live geospatial telemetry, active broadcast alerts, Smart Shelter recommendations, and verified civil defense preparedness standards into a unified, conversational command interface.

```
+-----------------------------------------------------------------------------------+
|                           CLIENT (Frontend React Application)                     |
|                                                                                   |
|   +--------------------------+              +---------------------------------+   |
|   |  AIAssistant Launcher    |              |  EmergencyDashboard             |   |
|   |  (Floating Action Button)|              |  (AI Situation Brief Button)    |   |
|   +------------+-------------+              +----------------+----------------+   |
|                |                                             |                    |
|                v                                             v                    |
|   +---------------------------------------------------------------------------+   |
|   |  AIAssistant Drawer (Warm Crisis Command theme, Quick Actions, Streaming) |   |
|   +-------------------------------------+-------------------------------------+   |
+-----------------------------------------|-----------------------------------------+
                                          | POST /api/ai/chat
                                          | (Bearer JWT Token, GPS Coords, Message)
                                          v
+-----------------------------------------------------------------------------------+
|                           BACKEND (Node.js & Express REST API)                    |
|                                                                                   |
|   +-----------------------+     +------------------------+                        |
|   |  auth.protect (JWT)   | --> |  aiLimiter (RateLimit) |                        |
|   +-----------------------+     +-----------+------------+                        |
|                                             |                                     |
|                                             v                                     |
|   +---------------------------------------------------------------------------+   |
|   |  aiAssistantController: Input validation (length <= 1000), verified role  |   |
|   +-------------------------------------+-------------------------------------+   |
|                                         |                                         |
|                                         v                                         |
|   +---------------------------------------------------------------------------+   |
|   |  aiAssistantService.js                                                    |   |
|   |  - Intent Recognition (Shelter, Risk, Alert, Incident, Prep, Situation)   |   |
|   |  - Life-Threat Emergency Detection                                        |   |
|   |  - Role-Aware Context Aggregator                                          |   |
|   +-----+-------------------------------+-------------------------------+-----+   |
|         |                               |                               |         |
|         v                               v                               v         |
|   +-----------+                   +-----------+                   +-----------+   |
|   | Smart     |                   | Risk      |                   | Crisis    |   |
|   | Shelter   |                   | Heatmap   |                   | Intel     |   |
|   | Service   |                   | Engine    |                   | Service   |   |
|   +-----------+                   +-----------+                   +-----------+   |
|         |                               |                               |         |
|         +-------------------------------+-------------------------------+         |
|                                         |                                         |
|                                         v                                         |
|                +-------------------------------------------------+                |
|                | Is AI_API_KEY set & Upstream LLM responding?    |                |
|                +------------------------+------------------------+                |
|                             |                             |                       |
|                       YES   v                       NO    v                       |
|               +------------------+         +----------------------------+         |
|               | External LLM API |         | ASSISTANT LIMITED MODE     |         |
|               | (OpenAI/Gemini)  |         | (Safe, Deterministic Engine|         |
|               | Mode: "LIVE"     |         | Mode: "LIMITED")           |         |
|               +------------------+         +----------------------------+         |
+-----------------------------------------------------------------------------------+
```

---

## 2. Provider Configuration & Zero-Downtime Fallback

### Configuration
The backend reads the following environment variable:
- `AI_API_KEY`: External AI provider secret. **Never exposed to the frontend.**
- `AI_API_ENDPOINT` (Optional): Upstream completions URL (defaults to standard OpenAI-compatible `/chat/completions`).
- `AI_MODEL_NAME` (Optional): LLM model identifier (defaults to `gpt-4o-mini`).

### Assistant Limited Mode (Deterministic Fallback)
If `AI_API_KEY` is not present, or if the upstream provider times out (>8s) or returns an error:
1. The assistant **never crashes** and **never exposes provider error messages**.
2. It transitions seamlessly into `ASSISTANT LIMITED MODE`.
3. It generates deterministic responses powered directly by DisasterChain's live MongoDB / memoryStore collections:
   - **Shelter queries**: Evaluated via `recommendBestShelter()`.
   - **Hazard/Risk queries**: Evaluated via `buildRiskHeatmap()`.
   - **Alert queries**: Evaluated against active broadcast advisories.
   - **Preparedness queries**: Evaluated against verified structural safety protocols.
   - **Life-Threat Emergency**: Immediate instructions to call 112/911, safe action guidance, and a direct `TRIGGER_SOS` action.

---

## 3. Role-Based Access Control & Privacy Redaction

The assistant uses verified server-side claims from the user's JWT (`req.user.role`). It never trusts client-supplied roles.

| Role | Access Tier | Permitted Context | Redacted Data |
| :--- | :--- | :--- | :--- |
| **Citizen** | `PUBLIC_SAFETY` | Public alerts, safe shelter locations & bed counts, general hazard levels, safety protocols | Personal phone numbers, caller identities, reporter names, responder dispatch notes |
| **Volunteer** | `OPERATIONAL_VOLUNTEER` | Public safety, volunteer assignments, emergency supply locations | Unmasked private contact numbers |
| **NGO** | `OPERATIONAL_VOLUNTEER` | Disaster relief distribution, shelter capacity, medical supplies | Unmasked personal victim identifiers |
| **Responder** | `OPERATIONAL_FULL` | Full incident logs, unmasked caller contacts, GIS telemetry, dispatch recommendations | None |
| **Admin** | `OPERATIONAL_FULL` | Unrestricted operational intelligence, audit logs, full system oversight | None |

---

## 4. Live Data Integrations

### Smart Shelter Integration
- When the user asks for shelters (e.g. *"Where is the nearest shelter?"*):
- The service executes `recommendBestShelter(userLat, userLon, liveShelters)`.
- It reports the shelter name, proximity in kilometers, real-time available bed count, occupancy percentage, and match score reasons.
- Generates interactive buttons: `[ VIEW SHELTER ]` and `[ GET DIRECTIONS ]`.

### Risk Heatmap Integration
- When the user asks about threats or hazards (e.g. *"Why is this area high risk?"*):
- The service calls `buildRiskHeatmap()` to evaluate cluster density across SOS signals, field incidents, affected hazard perimeters, and shelter strain.
- Explains dominant hazards, critical hotspots, and provides `[ VIEW RISK HEATMAP ]` and `[ VIEW 3D GLOBE ]` navigation actions.

### Crisis Operations Situation Brief
- For responders and administrators, the HUD header bar in `EmergencyDashboard.jsx` includes a dedicated **"AI SITUATION BRIEF"** button.
- Clicking the button instantly triggers an operational summary of:
  - Active distress signals (SOS count)
  - Critical/High hazard hotspots
  - Unresolved field incidents
  - Primary recommended safe haven and capacity strain
  - Clear label: *"AI-generated operational summary"*

---

## 5. Security & Rate Limiting

- **Zero Secret Leakage**: A complete static analysis of `frontend/build` confirms that no API keys (`AI_API_KEY`, `OPENAI_API_KEY`, `sk-`, etc.) are included in the bundle.
- **Dedicated Rate Limiter**: `aiLimiter` restricts client IPs to a maximum of 30 requests per minute to prevent automated abuse.
- **Input Sanitization**: Messages must be non-empty strings capped at 1,000 characters.
- **Conversation Context Limiting**: Only the 4 most recent messages are included in upstream context to control costs and latency.
- **Safe Rendering**: A custom React parser renders formatted bolding, bullet points, and numbered lists without `dangerouslySetInnerHTML`.

---

## 6. Verification & Test Coverage

All automated test suites pass with 100% success rate:

```bash
node backend/test_ai_assistant_suite.js     # 50 / 50 PASSED (100%)
node backend/test_risk_heatmap_suite.js     # 41 / 41 PASSED (100%)
node backend/test_offline_sync_suite.js     # 23 / 23 PASSED (100%)
node backend/test_intelligence_suite.js     # 46 / 46 PASSED (100%)
node backend/test_shelter_suite.js          # 40 / 40 PASSED (100%)
node backend/test_auth_suite.js             # 17 / 17 PASSED (100%)
```

**Total Tests:** 217 / 217 Passed (0 Failed).
**Production Build:** 0 Errors, 0 Warnings (`react-scripts build`).

---

## 7. Known Limitations & Next Steps

1. **Voice / Audio Input**: Future iterations can incorporate Web Speech API for voice-driven hands-free emergency queries in field conditions.
2. **Multilingual Localization**: Future releases can support real-time translation for multilingual disaster relief zones.
