# Underwater Rescue MVP — Design

## 1. Design principles

1. Build the smallest complete mission loop before adding research complexity.
2. Keep perception, simulation, navigation, safety, UI, and data export behind stable interfaces.
3. Make uncertain detections visible and require human confirmation.
4. Treat oxygen as a simulated resource budget, not a medical or hardware claim.
5. Keep the public repository free of confidential source data and unverifiable results.
6. Make the MVP CPU-runnable; make GPU training a later replaceable service.

## 2. Recommended implementation stack

### Frontend

- React
- TypeScript
- Vite
- Three.js for the 3D underwater scene
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
- A `PolicyAdapter` interface with an MFI-plus-safety baseline implementation
- A TD3-compatible adapter interface reserved for later training

### Deployment

- Docker Compose for local development
- One browser UI service
- One simulation API service
- Optional reverse proxy for cloud deployment
- No GPU requirement for the MVP path

## 3. High-level architecture

```text
Browser UI
  ├── Mission Setup
  ├── Live Mission View
  ├── Target Confirmation
  ├── Manual Control
  ├── Event Log
  └── Results Summary
          │ WebSocket / REST
          ▼
Mission API
  ├── Mission Manager
  ├── Scenario Loader
  ├── Sensor Simulator
  ├── Perception Adapter
  ├── Local Map Builder
  ├── MFI Prior Planner
  ├── Policy Adapter
  ├── Gate and Safety Layer
  ├── UUV Dynamics and Resource Model
  └── Results Exporter
          │
          ▼
Synthetic Scenario Assets and Reproducible Mission Logs
```

## 4. Mission state model

The mission state should include:

- `mission_id`
- `seed`
- `timestamp`
- `phase`: setup, searching, vehicle_found, target_pending, target_confirmed, approaching, holding, manual, returning, completed, aborted
- UUV pose, velocity, heading, and control action
- battery state and consumption rate
- oxygen reserve and consumption rate
- nearest obstacle distance
- current disturbance vector
- perception detections
- local occupancy/risk map reference
- MFI action
- policy action
- gate value
- mixed action
- safety-adjusted final action
- event list

## 5. Sensor simulation

### Camera simulator

Produces a scene image with synthetic overlays or rendered objects for:

- submerged vehicle
- external suspected victim
- rocks
- pipes
- low-visibility degradation

### Sonar simulator

Produces a grayscale range-like image or polar occupancy representation for:

- vehicle boundary
- internal suspected victim proxy
- obstacle geometry
- low-contrast target conditions

The internal target must be represented as sonar-derived or hidden-object data, not as a camera image that sees through the vehicle.

### Occupancy and risk map

Produces a local 2D or 2.5D grid with:

- occupied cells
- unknown cells
- free cells
- target cost
- obstacle-risk cost
- return-path cost

## 6. Navigation design

### MFI prior

The MVP MFI planner shall combine:

- target attraction
- obstacle repulsion or boundary-following tendency
- current compensation
- vertical/depth safety
- action clipping

### Policy adapter

The MVP policy adapter shall expose the same four-channel continuous action interface expected by TD3, even if the two-day demo uses a deterministic baseline rather than a trained neural policy.

### Gate

The gate shall increase prior influence when:

- obstacle distance is small;
- localization confidence is low;
- visibility is degraded;
- oxygen or battery reserve is low.

The gate shall decrease prior influence in open space when policy optimization is allowed.

### Safety layer

The safety layer shall check:

1. action range;
2. action-rate change;
3. predicted obstacle distance;
4. battery feasibility;
5. oxygen feasibility;
6. mission boundary;
7. manual takeover and return state.

## 7. Human-in-the-loop flow

```text
Suspected target detected
        │
        ├── Reject → continue search
        │
        └── Confirm → safe approach
                         │
                         ├── Pause
                         ├── Manual takeover
                         ├── Return
                         └── Hold near target
```

The system shall never transition from an uncertain detection to a claimed rescue success without human confirmation.

## 8. Oxygen-resource model

The MVP uses a virtual budget model:

`oxygen_remaining = max(0, initial_oxygen - base_rate*time - motion_rate*mission_effort)`

The model should expose parameters rather than hard-code them. It should support:

- normal search consumption;
- higher consumption during aggressive motion;
- additional consumption during target approach/hold;
- warning threshold;
- critical threshold;
- return feasibility estimate.

## 9. UI layout

### Header

- product name
- mission ID
- language switch
- connection status

### Left column

- camera view
- sonar view
- detection legend

### Center canvas

- 3D scene
- UUV
- submerged vehicle
- target markers
- obstacle markers
- planned path
- executed path

### Right column

- target confirmation card
- mission state
- battery and oxygen cards
- safety margin
- MFI / policy / final action values
- operator controls

### Bottom area

- event timeline
- current metrics
- result summary after mission completion

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

## 11. Testing strategy

### Unit tests

- seeded scenario generation
- oxygen update
- battery update
- obstacle-distance calculation
- action clipping
- gate calculation
- mission-state transitions
- bilingual label lookup

### Integration tests

- start mission and receive WebSocket updates
- confirm target and transition to approach
- pause and resume
- manual takeover and return
- low oxygen warning and fallback
- export mission results

### Demo acceptance test

Run one normal scenario, one low-visibility scenario, and one low-oxygen scenario from the browser. Capture screenshots or video and verify that all three scenarios produce understandable operator feedback.

## 12. Research extension boundary

The later research implementation may replace `PerceptionAdapter` with CNN encoders and `PolicyAdapter` with trained TD3, but the UI and mission API should remain stable.

The later research branch shall report real experimental values only after fixed seeds, defined splits, repeated runs, and documented evaluation procedures are available.
