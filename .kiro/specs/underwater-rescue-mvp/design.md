# Underwater Rescue MVP — Design

## 1. Design principles

1. Build the smallest complete mission loop before adding research complexity.
2. Keep perception, simulation, navigation, safety, UI, and data export behind stable interfaces.
3. Make uncertain detections visible and require human confirmation.
4. Treat oxygen as a simulated resource budget labeled "Resource Simulation", not a medical or hardware claim.
5. Keep the public repository free of confidential source data and unverifiable results.
6. Make the MVP CPU-runnable; make GPU training a later replaceable service.
7. Use 2D top-down visualization and static obstacles to keep the MVP achievable within a two-day development window.
8. Use an MFI-inspired scripted deterministic policy (potential-field navigation) for the MVP; reserve learned TD3 models for research phases.
9. Select language at mission setup; do not support dynamic language switching during live missions.
10. Enforce command priority: pause > manual takeover > return > autonomous.

## 2. Recommended implementation stack

### Frontend

- React
- TypeScript
- Vite
- HTML5 Canvas or SVG for the 2D top-down occupancy map visualization
- Lightweight charting library for metrics and time series
- Browser WebSocket client for live mission updates

### Backend

- Python
- FastAPI
- WebSocket endpoint for mission state streaming
- Pydantic models for configuration, observations, actions, events, and results
- Deterministic seeded simulator

### Data and model layer

- JSON/CSV for scenario configuration and mission results
- PNG or WebP for synthetic camera and sonar-like frames
- NumPy arrays for occupancy maps and sensor tensors
- A `PerceptionAdapter` interface with a deterministic demo implementation
- A `ScriptedPolicyAdapter` using an MFI-inspired potential-field navigation baseline for the MVP
- A `PolicyAdapter` interface reserved for TD3 in later research phases

### Deployment

- Docker Compose for local development
- One browser UI service
- One simulation API service
- Optional reverse proxy for cloud deployment
- Static hosting deployment (Vercel, Netlify, or GitHub Pages) for the MVP demo
- No GPU requirement for the MVP path

## 3. High-level architecture

```text
Browser UI
  ├── Mission Setup (Language Selection)
  ├── Live Mission View (2D Top-Down Map)
  ├── Target Confirmation Queue
  ├── Manual Control with Command Priority
  ├── Event Log
  └── Results Summary with JSON Export
          │ WebSocket / REST
          ▼
Mission API
  ├── Mission Manager
  ├── Scenario Loader
  ├── Sensor Simulator (Raycast Sonar)
  ├── Perception Adapter
  ├── Local 2D Occupancy Map Builder
  ├── Scripted Policy (Potential-Field Navigation)
  ├── Safety Layer (Active During Manual Control)
  ├── UUV 2D Kinematic Model
  ├── Resource Model (Battery and Oxygen Simulation)
  ├── Command Priority System
  ├── Return Path Planner with Failure Handling
  └── Results Exporter (JSON with Max 100 Points)
          │
          ▼
Synthetic Scenario Assets and Reproducible Mission Logs
```

## 4. Mission state model

The mission state should include:

- `mission_id`
- `seed`
- `timestamp`
- `phase`: setup, searching, vehicle_found, target_pending, target_confirmed, approaching, holding, manual, returning, return_failed, completed, aborted
- `selected_language`: en or zh-CN (set at mission setup, immutable during live mission)
- UUV 2D pose (X, Y, heading), velocity, and control action
- battery state and consumption rate
- oxygen reserve and consumption rate (labeled as "Resource Simulation")
- nearest obstacle distance
- water-current disturbance vector (constant or sinusoidal)
- perception detections
- local 2D occupancy map reference
- scripted policy action (potential-field based)
- safety-adjusted final action
- target confirmation queue (sequential processing)
- rejected target list
- command priority state (pause > manual > return > autonomous)
- event list

## 4a. Physics and motion model

### 2D kinematic motion

The MVP uses a simplified 2D kinematic model for UUV motion:

- **State**: X position (meters), Y position (meters), heading (radians)
- **Control input**: forward velocity command, angular velocity command
- **Update rule**:
  - `x_new = x + (v_cmd * cos(heading) + current_x) * dt`
  - `y_new = y + (v_cmd * sin(heading) + current_y) * dt`
  - `heading_new = heading + omega_cmd * dt`

The model does NOT simulate 3D dynamics, drag forces, buoyancy, or thruster-level control. These are reserved for later research phases.

### Water current disturbance

Water current is modeled as a 2D vector field applied to vehicle motion:

- **Constant current**: `current = (current_x, current_y)` fixed throughout the mission
- **Sinusoidal current**: `current_x = A_x * sin(omega_x * t + phase_x)`, `current_y = A_y * sin(omega_y * t + phase_y)`

Current disturbance is added to the vehicle velocity before position update. The scripted policy should compensate for current to maintain desired trajectory.

### Collision detection

Collision detection uses simple 2D geometric checks:

- **Circle-circle**: for UUV and circular obstacles
- **Circle-rectangle**: for UUV and rectangular obstacles
- **Raycast**: for sonar range queries

No physics-based contact forces or elastic collisions are simulated. Collisions are logged as events and trigger safety layer responses (hold, abort, or manual takeover prompt).

## 5. Sensor simulation

### Camera simulator

Produces a scene image with synthetic overlays or rendered objects for:

- submerged vehicle
- external suspected victim
- static rocks
- static pipes
- low-visibility degradation

Dynamic obstacles are excluded from the MVP.

### Sonar simulator

Produces a grayscale range-like image or polar occupancy representation using simple raycast-based range detection. The sonar simulator does NOT use physics-based multipath propagation or advanced signal processing in the MVP.

The sonar simulator provides range data for:

- vehicle boundary
- internal suspected victim proxy
- static obstacle geometry
- low-contrast target conditions

The internal target must be represented as sonar-derived or hidden-object data, not as a camera image that sees through the vehicle.

### Occupancy and risk map

Produces a local 2D grid with:

- occupied cells (static obstacles: rocks, pipes, vehicle)
- unknown cells (unexplored space)
- free cells (navigable space)
- target cost (attraction field)
- obstacle-risk cost (repulsion field)
- return-path cost

## 6. Navigation design

### MFI-inspired scripted deterministic policy (MVP)

The MVP navigation uses an MFI-inspired potential-field or gradient-based navigation method that:

- Attracts the UUV toward confirmed targets or search waypoints
- Repels the UUV from static obstacles (rocks, pipes, vehicle boundaries)
- Compensates for water-current disturbance (constant or sinusoidal vector field)
- Respects depth and boundary safety constraints
- Clips actions to actuator limits

The policy is deterministic and reproducible given the same seed and scenario configuration. It is a simplified, non-learned baseline that preserves the paper's prior-guided navigation idea for the MVP; the trainable MFI prior, CNN encoder, and TD3/TD3-IMP policy remain research extensions.

### Safety layer

The safety layer shall check every proposed action (from scripted policy or manual control) and verify:

1. action range (within actuator limits);
2. action-rate change (smooth transitions);
3. predicted obstacle distance (collision avoidance);
4. battery feasibility (sufficient reserve for return);
5. oxygen feasibility (sufficient reserve for return);
6. mission boundary (geofence);
7. command priority state (pause > manual > return > autonomous).

The safety layer SHALL remain active during manual control and override unsafe commands.

### Command priority system

The system enforces the following priority order:

1. **Pause** (highest priority): freezes all motion
2. **Manual takeover**: operator directional controls
3. **Return**: automatic return-to-start path
4. **Autonomous**: scripted policy navigation

When a higher-priority command is active, lower-priority commands are suppressed. For example, if the operator selects manual takeover, autonomous navigation stops, but if the operator then selects pause, manual control is suspended until pause is released.

### Return path planning with failure handling

When return mode is activated:

- The system SHALL compute a return path respecting battery, oxygen, and obstacle constraints
- If a feasible path exists, the UUV SHALL follow the path with safety layer active
- If no feasible path exists (blocked by obstacles or insufficient resources), the system SHALL:
  - Display an error message in the selected language
  - Offer an "Abort Mission" action to the operator
  - Log the failure event in the mission event log

## 7. Human-in-the-loop flow

```text
Suspected target detected
        │
        ├── Add to confirmation queue
        │
        └── Present to operator (sequential)
                │
                ├── Reject → remove from queue → return to searching
                │
                └── Confirm → safe approach
                             │
                             ├── Pause (highest priority)
                             ├── Manual takeover (overrides autonomous)
                             ├── Return (overrides autonomous, fallback on failure)
                             └── Hold near target (autonomous mode)
```

The system shall never transition from an uncertain detection to a claimed rescue success without human confirmation.

When multiple targets are detected, they shall be queued and presented to the operator one at a time. The operator confirms or rejects each target sequentially.

When a target is rejected, the system shall discard it and return to the searching state.

## 8. Oxygen-resource model

The MVP uses a virtual budget model labeled clearly in the UI as "Resource Simulation":

`oxygen_remaining = max(0, initial_oxygen - base_rate*time - motion_rate*mission_effort)`

The model should expose parameters rather than hard-code them. It should support:

- normal search consumption;
- higher consumption during aggressive motion;
- additional consumption during target approach/hold;
- warning threshold (e.g., 20% remaining);
- critical threshold (e.g., 0% remaining triggers mission abort);
- return feasibility estimate.

The oxygen module SHALL NOT imply real oxygen delivery or medical life-support capabilities. It is purely a simulated resource constraint for demonstration purposes.

## 9. UI layout

### Header

- product name
- mission ID
- language indicator (English or Simplified Chinese, selected at setup)
- connection status

### Left column

- camera view
- sonar view (raycast-based range display)
- detection legend

### Center canvas

- 2D top-down occupancy map
- UUV position and heading
- submerged vehicle
- target markers (confirmed, pending, rejected)
- static obstacle markers (rocks, pipes)
- planned path
- executed path

### Right column

- target confirmation card (sequential queue)
- mission state (searching, target_pending, approaching, manual, returning, return_failed, etc.)
- battery card (percentage and consumption rate)
- oxygen card (labeled "Resource Simulation", percentage and consumption rate)
- safety margin indicator
- scripted policy action and final validated action values
- operator controls (pause, manual takeover, return, abort)

### Bottom area

- event timeline (collisions, warnings, confirmations, rejections)
- current metrics (position, heading, velocity, obstacle distance)
- result summary after mission completion (JSON export available)

## 10. Data organization

```text
data/
  synthetic/
    scenarios/
    camera/
    sonar/
    occupancy/
    labels/
  public_sources/
    README.md
  generated_logs/
  schemas/
```

The repository shall store attribution and download instructions for public datasets rather than redistributing restricted raw files.

## 10a. Mission export schema

When the operator requests a mission export, the system SHALL produce a JSON file following this exact schema:

```json
{
  "missionId": "string (UUID)",
  "scenarioName": "string",
  "seed": "integer",
  "language": "en | zh-CN",
  "startTime": "ISO 8601 timestamp",
  "endTime": "ISO 8601 timestamp",
  "status": "success | failure | aborted",
  "targetConfirmations": [
    {
      "targetId": "string",
      "type": "external_victim | internal_victim | vehicle",
      "confirmed": "boolean",
      "timestamp": "ISO 8601 timestamp"
    }
  ],
  "collisionCount": "integer",
  "minObstacleDistance": "float (meters)",
  "pathLength": "float (meters)",
  "missionDuration": "float (seconds)",
  "batteryInitial": "float (percent)",
  "batteryFinal": "float (percent)",
  "oxygenInitial": "float (units)",
  "oxygenFinal": "float (units)",
  "manualInterventions": "integer",
  "trajectory": [
    {
      "timestamp": "float (seconds)",
      "x": "float (meters)",
      "y": "float (meters)",
      "heading": "float (radians)"
    }
  ]
}
```

**Trajectory sampling**: The trajectory array SHALL contain at most 100 evenly sampled points from the full mission trajectory to keep file sizes manageable. If the mission contains more than 100 timesteps, the exporter SHALL downsample using uniform spacing.

## 11. Testing strategy

### Unit tests

- seeded scenario generation with static obstacles
- oxygen update (resource simulation)
- battery update
- obstacle-distance calculation (2D raycast)
- action clipping (actuator limits)
- safety layer validation (including manual control override)
- command priority enforcement (pause > manual > return > autonomous)
- mission-state transitions (including return_failed state)
- target confirmation queue (sequential processing)
- rejected target handling
- bilingual label lookup (English and Simplified Chinese)
- water-current disturbance (constant and sinusoidal vector fields)
- return path feasibility check
- JSON export schema validation (max 100 trajectory points)

### Integration tests

- start mission and receive WebSocket updates
- confirm target from queue and transition to approach
- reject target and return to searching
- pause, resume, and verify command priority
- manual takeover with safety layer override
- request return and verify path planning
- return path failure handling (error message and abort option)
- low oxygen warning and fallback
- export mission results as JSON with trajectory sampling
- 2D occupancy map rendering

### Demo acceptance test

Run one normal scenario, one low-visibility scenario, and one low-oxygen scenario from the browser. Capture screenshots or video and verify that:

- All three scenarios produce understandable operator feedback in the selected language
- The 2D top-down map displays UUV position, obstacles, and path
- Target confirmation queue handles multiple targets sequentially
- Command priority system works correctly (pause overrides manual, manual overrides autonomous)
- Safety layer remains active during manual control
- Return path failure displays error and abort option
- JSON export contains at most 100 trajectory points and follows the defined schema

## 12. Research extension boundary

The MVP uses an **MFI-inspired scripted deterministic policy** based on potential-field navigation. The later research implementation may replace `ScriptedPolicyAdapter` with a learned TD3 policy and add CNN-based perception encoders, but the UI and mission API should remain stable.

Features reserved for future research phases (explicitly excluded from MVP):

- **Learned policy models**: Replace scripted potential-field navigation with TD3 or TD3-IMP trained on GPU
- **Perception pretraining**: Add CNN encoders for camera and sonar fusion
- **Dynamic obstacles**: Moving debris, fish, time-varying currents
- **3D visualization**: Three.js scene with full trajectory rendering
- **Action gating networks**: MFI prior with trainable gating weights
- **Advanced physics**: 3D dynamics, multipath sonar propagation, turbulence
- **Real-time language switching**: Dynamic UI language change during live missions
- **Ablation studies**: Systematic evaluation of perception encoders, gating networks, resource models, safety configurations
- **Sim-to-real validation**: Tank environment testing

The later research branch shall report real experimental values only after fixed seeds, defined splits, repeated runs, and documented evaluation procedures are available.
