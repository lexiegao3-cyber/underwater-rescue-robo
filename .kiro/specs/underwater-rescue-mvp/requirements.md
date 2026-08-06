# Underwater Rescue MVP — Requirements

## 1. Product definition

The product is a bilingual browser-based proof-of-concept for a human-in-the-loop underwater search-and-rescue assistant.

The simulated UUV shall search for a submerged vehicle, identify suspected victims inside and outside the vehicle, avoid rocks and pipes, plan a safe approach using an MFI-inspired scripted deterministic policy, and hand the final target decision to a human rescuer.

The MVP is a simulation and decision-support demonstration. It is not a certified rescue device, medical device, life-sign detector, oxygen-delivery controller, or autonomous rescue system. All navigation is performed by an MFI-inspired deterministic scripted policy for the MVP; learned policy models are reserved for later research phases.

## 2. Primary users and audience

### Primary users

- Fire and rescue departments
- Maritime and underwater engineering companies
- Professional diving rescue teams
- Underwater robotics companies

### Primary audience

- Academic supervisors and paper reviewers
- Potential investors and technology partners

## 3. MVP goals

- Demonstrate a complete search-to-approach mission loop.
- Make the MFI-inspired scripted policy navigation, safety layer, and human approval visible in the UI.
- Provide a credible product-shaped interface for future paper experiments and cloud deployment.
- Run without a local NVIDIA GPU by using deterministic simulation and a scripted policy in the MVP.
- Keep all confidential or non-public source data out of the public repository.
- Use static obstacles and a 2D top-down map to keep the MVP achievable within a two-day development window.

## 4. Non-goals

- Real hardware control
- Real medical life-sign detection
- Real oxygen delivery
- Autonomous final rescue decisions
- Claims of real-world rescue readiness
- Uploading confidential data to a public cloud service
- Reporting unverified scientific improvements as completed results
- Learned policy models (TD3, CNN encoders, or RL training) in the MVP
- Dynamic obstacles in the MVP
- 3D visualization or trajectory rendering in the MVP
- Real-time language switching during live missions

## 5. Functional requirements

### R1. Mission setup

WHEN an operator opens the application
THE SYSTEM SHALL provide a mission setup screen with language selection (English or Simplified Chinese), scenario, difficulty, seed, starting position, target position, battery reserve, and oxygen reserve fields.

WHEN the operator selects a language
THE SYSTEM SHALL use the selected language for all UI labels, controls, warnings, mission states, and metric names throughout the mission. The language SHALL NOT change dynamically during a live mission.

WHEN the operator starts a mission
THE SYSTEM SHALL create a reproducible simulated underwater scene containing a submerged vehicle, suspected victim targets, static rocks, static pipes, and optional water-current disturbance and visibility degradation. Dynamic obstacles are excluded from the MVP.

### R2. Simulated UUV and environment

WHEN a mission is running
THE SYSTEM SHALL simulate a UUV with 2D kinematic motion (X position, Y position, heading), velocity, battery level, oxygen reserve, and mission state.

WHEN the simulator advances one time step
THE SYSTEM SHALL update vehicle position, heading, velocity, battery consumption, and oxygen consumption using deterministic seeded parameters. Water-current disturbance SHALL be modeled as a constant or sinusoidal vector field applied to vehicle motion.

WHEN an obstacle is within the configured safety margin
THE SYSTEM SHALL expose the obstacle distance and risk level to the navigation layer. Risk level SHALL be computed as a distance-based heuristic (e.g., inversely proportional to distance).

### R3. Multimodal sensor simulation

WHEN a mission is running
THE SYSTEM SHALL produce synchronized synthetic sensor outputs for camera view, forward-looking sonar range data, depth sensor, local 2D occupancy map, and structured vehicle state.

WHEN the scene visibility is degraded
THE SYSTEM SHALL reduce camera quality (increase noise, reduce contrast) and preserve a separate sonar-based range detection so the UI demonstrates sensor complementarity. Sonar simulation SHALL use simple raycast-based range detection without multipath or advanced signal processing.

WHEN a target or obstacle is visible to a sensor
THE SYSTEM SHALL expose a confidence score (0.0 to 1.0), class label, approximate position (X, Y), and source modality (camera, sonar, or pre-placed marker).

### R4. Perception outputs

WHEN perception is executed
THE SYSTEM SHALL classify at least these object types: submerged vehicle, external suspected victim, internal suspected victim, rock, pipe, and unknown obstacle.

WHEN an internal suspected victim is shown
THE SYSTEM SHALL represent it as a pre-placed marker visible to sonar simulation and SHALL NOT claim that an optical camera can see through the vehicle.

WHEN a detection is uncertain
THE SYSTEM SHALL label it as a suspected target and require human confirmation before the mission enters the confirmed-target state.

WHEN multiple suspected targets are detected
THE SYSTEM SHALL queue target confirmations and present them to the operator sequentially. The operator SHALL confirm or reject each target one at a time.

### R5. Local map and navigation

WHEN the simulator receives sensor observations
THE SYSTEM SHALL update a local 2D occupancy and risk map around the UUV. The map SHALL represent free space, occupied space, and unknown space in a 2D grid.

WHEN a goal is available and the mission is in autonomous mode
THE SYSTEM SHALL generate an MFI-inspired scripted policy action using a potential-field or gradient-based navigation method that moves toward the goal while repelling from or routing around nearby obstacles.

WHEN the scripted policy generates an action
THE SYSTEM SHALL pass the action to the safety layer for validation before execution. The system SHALL expose the proposed action and the final validated action separately in the UI for transparency.

### R6. Safety layer

WHEN the proposed action violates an obstacle-distance, actuator limit, action-rate limit, battery reserve, oxygen reserve, or mission-boundary constraint
THE SYSTEM SHALL modify or reject the action before execution.

WHEN the UUV enters a critical safety state (collision imminent, battery critical, oxygen critical, or boundary violation)
THE SYSTEM SHALL select a safe fallback state: slow mode, hold position, manual takeover prompt, or return-to-start.

WHEN a collision occurs in simulation
THE SYSTEM SHALL record the event and display it in the mission event log.

WHEN the operator is in manual control mode
THE SYSTEM SHALL keep the safety layer active and override unsafe manual commands to prevent collisions and constraint violations.

### R7. Human-in-the-loop controls

WHEN a suspected vehicle or victim target is detected
THE SYSTEM SHALL allow the operator to confirm or reject the target. If multiple targets are detected, they SHALL be queued and presented sequentially.

WHEN the operator rejects a target
THE SYSTEM SHALL discard the target from the mission state, return to the searching state, and continue the mission.

WHEN the operator selects manual takeover
THE SYSTEM SHALL stop autonomous navigation and expose manual directional controls (forward, backward, rotate left, rotate right). Manual takeover SHALL take priority over autonomous mode and return mode, but the safety layer SHALL remain active.

WHEN the operator selects pause
THE SYSTEM SHALL freeze mission progression while preserving the current state. Pause SHALL take priority over all other modes including manual control.

WHEN the operator selects return
THE SYSTEM SHALL attempt to generate a return path that respects the current battery, oxygen, and obstacle constraints. Return mode SHALL take priority over autonomous mode but SHALL be overridden by pause and manual takeover.

WHEN the return path computation fails (no feasible path exists due to obstacles or insufficient resources)
THE SYSTEM SHALL display an error message to the operator and offer an "Abort Mission" action.

The command priority order SHALL be: pause > manual takeover > return > autonomous mode.

### R8. Oxygen-resource simulation

WHEN the mission advances
THE SYSTEM SHALL decrease the virtual oxygen reserve according to elapsed time, motion demand (velocity magnitude), and configured mission consumption rate.

WHEN oxygen reserve falls below the warning threshold (e.g., 20% remaining)
THE SYSTEM SHALL display a bilingual warning in the selected language and recommend return, hold, or mission abort according to the configured policy.

WHEN oxygen reserve reaches zero before the mission ends
THE SYSTEM SHALL trigger a mission-critical state and force mission termination or return-to-start, similar to battery depletion.

WHEN the mission ends
THE SYSTEM SHALL report initial oxygen, final oxygen, consumption rate, minimum reserve reached during the mission, and whether the mission remained resource-feasible.

The oxygen module SHALL be labeled clearly as "Resource Simulation" in the UI and SHALL NOT imply real oxygen delivery or medical life-support capabilities.

### R9. Bilingual interactive interface

WHEN the operator selects a language in the mission setup screen
THE SYSTEM SHALL use the selected language (English or Simplified Chinese) for all primary labels, controls, warnings, mission states, metric names, setup fields, and results screen content. Language selection SHALL occur before the live mission begins and SHALL NOT change dynamically during the live mission.

THE SYSTEM SHALL provide at least these views: mission setup, live mission, target confirmation dialog, manual takeover controls, event log panel, and results summary.

THE SYSTEM SHALL show camera view, sonar range visualization, 2D top-down occupancy map, target detections, proposed and validated actions, battery level, oxygen level, safety margin, and mission status in the live mission view. A 3D trajectory view is excluded from the MVP.

### R10. Mission results and reproducibility

WHEN a mission ends
THE SYSTEM SHALL display success/failure status, target-confirmation status, collision count, minimum obstacle distance, path length, mission time, battery consumption, oxygen consumption, and count of manual interventions.

WHEN the same scenario seed and configuration are used
THE SYSTEM SHALL reproduce the same simulated environment and baseline mission outcome within a numerical tolerance of ±1e-6 for floating-point calculations.

WHEN the operator requests a mission export
THE SYSTEM SHALL export mission metadata and results as JSON or CSV according to the following schema:

**JSON Export Schema:**
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

The trajectory array SHALL contain at most 100 evenly sampled points to keep export file sizes manageable.

### R11. Data and model transparency

THE SYSTEM SHALL distinguish among synthetic data, public data, and confidential data.

THE SYSTEM SHALL store only synthetic data and permitted derived artifacts in the public repository.

THE SYSTEM SHALL include dataset attribution and license notes for every public dataset used.

THE SYSTEM SHALL label demo perception and navigation results as simulation results unless they are supported by reproducible experiments.

### R12. Browser deployment

WHEN the application is deployed to a static hosting service (e.g., Vercel, Netlify, GitHub Pages)
THE SYSTEM SHALL provide a browser-accessible demo without requiring an NVIDIA GPU on the user's local machine.

THE SYSTEM SHALL run entirely on CPU using an MFI-inspired deterministic scripted policy and lightweight simulation.

THE SYSTEM SHALL keep the simulation service and UI interfaces documented so a later GPU-backed learned policy service can replace the scripted baseline without redesigning the UI.

## 6. MVP acceptance criteria

- An operator can select a language (English or Simplified Chinese) and start a seeded mission from the browser.
- The scene contains a submerged vehicle, internal and external suspected victims, rocks, and pipes (all static).
- The UUV navigates toward targets using a scripted deterministic policy and reaches a confirmed target or enters a documented safe fallback state.
- At least one obstacle-avoidance event is visible in the UI.
- The operator can confirm or reject targets (queued sequentially), pause, take manual control, and request return.
- The safety layer remains active during manual control and overrides unsafe commands.
- If return path computation fails, the system displays an error and offers an "Abort Mission" action.
- Oxygen decreases during the mission and triggers a visible warning in a low-resource scenario.
- The interface displays all main labels, controls, warnings, setup fields, and results in the selected language.
- A mission result can be exported as JSON with at most 100 trajectory points.
- The 2D top-down occupancy map is visible in the live mission view.
- The README clearly states that the MVP is a simulation using a scripted policy and does not provide medical or real rescue guarantees.

## 7. Later research requirements

The following features are reserved for future research phases and are explicitly excluded from the MVP:

- Replace the scripted deterministic policy with a learned TD3 or TD3-IMP policy.
- Add real underwater perception pretraining with CNN encoders.
- Add public sonar and underwater image datasets with license-compliant pipelines.
- Train multimodal CNN encoders for camera and sonar fusion.
- Train and evaluate the prior-guided TD3 policy on GPU with action gating networks.
- Add dynamic obstacles (moving debris, fish, currents with time-varying vortices).
- Add 3D visualization and trajectory rendering.
- Run ablation studies for MFI prior, CNN encoders, gating networks, resource consumption models, safety layer configurations, replay strategies, and action smoothness.
- Report results across multiple seeds with confidence intervals.
- Validate sim-to-real assumptions in a controlled tank environment.
- Support real-time language switching during live missions.
