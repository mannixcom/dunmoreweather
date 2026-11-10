
Dunmore East Sea Scouts — Marine Weather Dashboard Architecture Spec

File ID: MARINE_DASHBOARD_SPEC.md
Target Environment: Single Page Application (SPA) / Static Web App
Primary Objective: Provide automated, real-time safety go/no-go indicators for Dunmore East Sea Scout kayaking operations by mapping live meteorological data streams against local group proficiency matrices.

1. System Topology & Infrastructure

The application operates entirely as a client-side architecture. It requires no persistent databases or authenticated backend servers, enabling deployment to free edge tiers.
+───────────────────────────+

|      Client Browser       |
| (Vite + React Core Engine)|
+─────────────┬─────────────+
              │
              ├─(Concurrent Fetch)─► [Open-Meteo Weather API] -> Wind, Gusts, Temp
              ├─(Concurrent Fetch)─► [Open-Meteo Marine API]  -> Waves, Swell, Sea Temp
              └─(Concurrent Fetch)─► [Open Waters Tides API]  -> High / Low Tidal Nodes
• Hosting Compatibility: AWS Amplify, Vercel, Netlify, or GitHub Pages.
• Version Control: Repository configured with automated CI/CD pipelines deploying directly on git push events to the main branch.

2. The Core Technical Stack

The selected technology baseline balances rapid modification velocity with clean component design.
• Runtime & Scaffold: Vite + React (JavaScript SPA variant).
• Styling Engine: Tailwind CSS framework utilizing inline utility flags.
• Vector Asset Packs: Lucide React (Wind, Waves, Compass, ShieldAlert, ShieldCheck, Anchor, CheckSquare, ListCollapse).
• Geospatial Layer: Leaflet v1.9 + React-Leaflet v4.x (fully open-source mapping engine requiring zero API tracking keys).

3. Data Dictionary & Unified Schema

The client aggregates data streams from three public endpoints into a single immutable state engine object named MarineTelemetry.

Telemetry Mapping Rules

• Anchor Coordinates: Latitude: 52.152 | Longitude: -6.994 (Dunmore East Slipway Hub).
• Telemetry Schema Definition:
typescript
interface MarineTelemetry {
  airTemp: number;       // From Open-Meteo Weather current.temperature_2m (°C)
  precipitation: number; // From Open-Meteo Weather current.precipitation (mm)
  windSpeed: number;     // From Open-Meteo Weather current.wind_speed_10m (Knots)
  windGust: number;      // From Open-Meteo Weather current.wind_gusts_10m (Knots)
  windDirection: number; // From Open-Meteo Weather current.wind_direction_10m (Degrees)
  waveHeight: number;    // From Open-Meteo Marine current.wave_height (Meters)
  wavePeriod: number;    // From Open-Meteo Marine current.wave_period (Seconds)
  swellHeight: number;   // From Open-Meteo Marine current.swell_wave_height (Meters)
  highTideTime: string;  // From Open Waters Tides parsed next instance (HH:MM)
  highTideHeight: text;  // Parsed localized tide table metric (e.g. "3.7m")
}
Use code with caution.

4. Safety Logic & Risk Matrix Specifications

The conditional alerting engine maps live metrics against thresholds derived from the operational criteria card.

Matrix Bounds Definition Matrix

javascript
const RISK_THRESHOLDS = {
  advanced:     { maxWind: 16, maxGust: 21, maxWave: 1.5,  label: "Advanced" },
  intermediate: { maxWind: 10, maxGust: 16, maxWave: 1.2,  label: "Intermediate" },
  junior:       { maxWind: 6,  maxGust: 10, maxWave: 1.0,  label: "Junior" },
  beginner:     { maxWind: 3,  maxGust: 6,  maxWave: 0.75, label: "Beginner" }
};
Use code with caution.

Evaluation Rules Logic

1. State Flags Calculation: For any given active group selection G:
	• isWindViolated = (telemetry.windSpeed > RISK_THRESHOLDS[G].maxWind) || (telemetry.windGust > RISK_THRESHOLDS[G].maxGust)
	• isWaveViolated = (telemetry.waveHeight > RISK_THRESHOLDS[G].maxWave)
	• isLaunchApproved = !isWindViolated && !isWaveViolated
2. UI Representation:
	• If isLaunchApproved is true: Render background using class blocks bg-emerald-950/40 border-emerald-500 accompanied by the ShieldCheck status indicator asset.
	• If isLaunchApproved is false: Break execution down instantly to flag red via class blocks bg-rose-950/40 border-rose-500 accompanied by the ShieldAlert safety block asset.

5. UI Layout Blueprint

The interface uses a mobile-first, three-panel dashboard layout built with standard Tailwind primitives:
+───────────────────────────────────────────────────────────────────────────+

|  [⚓ Dunmore East Sea Scouts]                   [Cubs] [Scouts] [Ventures] |
+───────────────────────────────────────────────────────────────────────────+

|  PANEL A: Live Action Launch Box    │ PANEL C: Active Boundary Map Frame  |
|  Status: [ LAUNCH APPROVED / HOLD ] │ +─────────────────────────────────+ |
|                                     │ |                                 | |
|  PANEL B: Real-Time Weather Matrix  │ |         [ Leaflet Engine ]      | |
|  - Wind Speed: XX kts (Gust: XX)    │ |                                 | |
|  - Sea State: XX m                  │ |   (Displays Active Polygon)     | |
|  - Direction: XX°                   │ |                                 | |
|                                     │ +─────────────────────────────────+ |
+─────────────────────────────────────┴─────────────────────────────────────+

|  PANEL D: Mandatory Gear Verification List & Critical Operation Notes     |
+───────────────────────────────────────────────────────────────────────────+
• Panel A (Safety Action Block): Changes theme and layout treatment dynamically based on group selection and real-time threshold calculations.
• Panel B (Telemetry Grid): High-contrast grid blocks optimizing visibility on water-slicked screens under direct outdoor sun exposure.
• Panel C (Spatial Overlay): Interactive mapping window drawing localized containment corridors (innerHarborPolygon vs outerBayPolygon) dynamically pinned to coordinate boundaries.
• Panel D (Equipment Audit Checklist): Persistent checklist module requiring scout logs to check off mandatory equipment (PFDs, bungs, airbags, whistles) prior to setting foot on the slipway.

6. Caching & Edge Failure Mitigations

To prevent cascading request failures when multi-device teams activate the application using shared cellular backhaul assets on the waterfront, the dashboard handles calls via a resilient lifecycle layer:
• Volatility Gate: Saves successful responses inside localStorage along with an epoch timestamp (de_scout_weather_time).
• Lifecycle Check: On app initialization, checks if a cached response exists and is less than 15 minutes old. If valid, it returns the cached data immediately rather than firing an unnecessary external network call.
• Network Failure Failover: If an external API call fails due to weak harbor coverage, the engine retrieves the last successfully cached payload from disk and renders an asynchronous warning banner: "Displaying Cached Data — Connection Unstable".
Would you like me to output the complete initialization shell files (index.html, tailwind.config.js, and basic directory configurations) so you can copy and paste this structure directly into your OpenCode directory?
