# Underwater Rescue MVP — Requirements

## 1. Product definition

The product is a bilingual browser-based proof-of-concept for a human-in-the-loop underwater search-and-rescue assistant.

The simulated four-thruster UUV shall search for a submerged vehicle, identify suspected victims inside and outside the vehicle, avoid rocks and pipes, plan a safe approach, and hand the final target decision to a human rescuer.

The MVP is a simulation and decision-support demonstration. It is not a certified rescue device, medical device, life-sign detector, oxygen-delivery controller, or autonomous rescue system.

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
- Make the MFI prior, TD3 action candidate, safety layer, and human approval visible.
- Provide a credible product-shaped interface for future paper experiments and cloud deployment.
- Run without a local NVIDIA GPU by using deterministic simulation and lightweight inference in the MVP.
- Keep all confidential or non-public source data out of the public repository.

## 4. Non-goals

- Real hardware control
- Real medical life-sign detection
- Real oxygen delivery
- Autonomous final rescue decisions
- Claims of real-world rescue readiness
- Uploading confidential data to a public cloud service
- Reporting unverified scientific improvements as completed results

## 5. Functional requirements

### R1. Mission setup

WHEN an operator opens the application
THE SYSTEM SHALL provide a mission setup screen with scenario, difficulty, seed, starting position, target position, battery reserve, and oxygen reserve fields.

WHEN the operator starts a mission
THE SYSTEM SHALL create a reproducible simulated underwater scene containing a submerged vehicle, suspected victim targets, rocks, pipes, water-current disturbance, visibility degradation, and optional dynamic obstacles.

### R2. Simulated UUV and environment

WHEN a mission is running
THE SYSTEM SHALL simulate a generic four-thruster UUV with position, orientation, velocity, battery, oxygen reserve, and mission state.

WHEN the simulator advances one time step
THE SYSTEM SHALL update vehicle motion, current disturbance, battery consumption, and oxygen consumption using deterministic seeded parameters.

WHEN an obstacle is within the configured safety margin
THE SYSTEM SHALL expose the obstacle distance and risk level to the navigation layer.

### R3. Multimodal sensor simulation

WHEN a mission is running
THE SYSTEM SHALL produce synchronized synthetic sensor outputs for camera, forward-looking sonar, depth/range, local occupancy map, and structured vehicle state.

WHEN the scene visibility is degraded
THE SYSTEM SHALL reduce camera quality and preserve a separate sonar-like obstacle representation so the UI demonstrates sensor complementarity.

WHEN a target or obstacle is visible to a sensor
THE SYSTEM SHALL expose a confidence score, class label, approximate position, and source modality.

### R4. Perception outputs

WHEN perception is executed
THE SYSTEM SHALL classify at least these object types: submerged vehicle, external suspected victim, internal suspected victim, rock, pipe, and unknown obstacle.

WHEN an internal suspected victim is shown
THE SYSTEM SHALL represent it as a hidden or sonar-derived target and SHALL NOT claim that an optical camera can see through the vehicle.

WHEN a detection is uncertain
THE SYSTEM SHALL label it as a suspected target and require human confirmation before the mission enters the confirmed-target state.

### R5. Local map and navigation

WHEN the simulator receives sensor observations
THE SYSTEM SHALL update a local occupancy and risk map around the UUV.

WHEN a goal is available
THE SYSTEM SHALL generate an MFI prior action that moves toward the goal while repelling or routing around nearby obstacles.

WHEN a policy action is available
THE SYSTEM SHALL generate a TD3-compatible continuous action candidate for the four control channels.

WHEN both actions are available
THE SYSTEM SHALL expose the prior action, policy action, gate value, and final action separately.

### R6. Safety layer

WHEN the mixed action violates an obstacle-distance, actuator, action-rate, battery, oxygen, or mission-boundary constraint
THE SYSTEM SHALL modify or reject the action before execution.

WHEN the UUV enters a critical safety state
THE SYSTEM SHALL select a safe fallback state: slow mode, hold position, manual takeover, or return-to-start.

WHEN a collision occurs in simulation
THE SYSTEM SHALL record the event and display it in the mission event log.

### R7. Human-in-the-loop controls

WHEN a suspected vehicle or victim target is detected
THE SYSTEM SHALL allow the operator to confirm or reject the target.

WHEN the operator selects manual takeover
THE SYSTEM SHALL stop autonomous target-seeking actions and expose manual directional controls.

WHEN the operator selects pause
THE SYSTEM SHALL freeze mission progression while preserving the current state.

WHEN the operator selects return
THE SYSTEM SHALL generate a return path that respects the current battery, oxygen, and obstacle constraints.

### R8. Oxygen-resource simulation

WHEN the mission advances
THE SYSTEM SHALL decrease the virtual oxygen reserve according to elapsed time, motion demand, and configured mission consumption.

WHEN oxygen reserve falls below the warning threshold
THE SYSTEM SHALL display a bilingual warning and recommend return, hold, or mission abort according to the configured policy.

WHEN the mission ends
THE SYSTEM SHALL report initial oxygen, final oxygen, consumption rate, minimum reserve, and whether the mission remained resource-feasible.

The oxygen module SHALL be labeled as resource simulation and SHALL NOT imply real oxygen delivery.

### R9. Bilingual interactive interface

WHEN the operator switches language
THE SYSTEM SHALL update all primary labels, controls, warnings, mission states, and metric names between English and Simplified Chinese.

THE SYSTEM SHALL provide at least these views: mission setup, live mission, target confirmation, manual takeover, event log, and results summary.

THE SYSTEM SHALL show camera, sonar, local map, 3D trajectory, target detections, action fusion, battery, oxygen, safety margin, and mission status in the live mission view.

### R10. Mission results and reproducibility

WHEN a mission ends
THE SYSTEM SHALL display success/failure, target-confirmation status, collision count, minimum obstacle distance, path length, mission time, battery consumption, oxygen consumption, and manual interventions.

WHEN the same scenario seed and configuration are used
THE SYSTEM SHALL reproduce the same simulated environment and baseline mission outcome within the documented numerical tolerance.

THE SYSTEM SHALL allow mission metadata and results to be exported as JSON or CSV.

### R11. Data and model transparency

THE SYSTEM SHALL distinguish among synthetic data, public data, and confidential data.

THE SYSTEM SHALL store only synthetic data and permitted derived artifacts in the public repository.

THE SYSTEM SHALL include dataset attribution and license notes for every public dataset used.

THE SYSTEM SHALL label demo perception and navigation results as simulation results unless they are supported by reproducible experiments.

### R12. Browser deployment

WHEN the application is deployed to a supported cloud environment
THE SYSTEM SHALL provide a browser-accessible demo without requiring an NVIDIA GPU on the user's local machine.

THE SYSTEM SHALL provide a CPU-compatible demo mode with a deterministic baseline.

THE SYSTEM SHALL keep the simulation service and UI interfaces documented so a later GPU-backed training service can replace the baseline without redesigning the UI.

## 6. MVP acceptance criteria

- An operator can start a seeded mission from the browser.
- The scene contains a submerged vehicle, internal and external suspected victims, rocks, and pipes.
- The UUV reaches a confirmed target or enters a documented safe fallback state.
- At least one obstacle-avoidance event is visible in the UI.
- The operator can confirm a target, pause, take manual control, and request return.
- Oxygen decreases during the mission and triggers a visible warning in a low-resource scenario.
- The interface works in Simplified Chinese and English.
- A mission result can be exported.
- The README clearly states that the MVP is a simulation and does not provide medical or real rescue guarantees.

## 7. Later research requirements

- Reproduce the low-dimensional TD3-IMP baseline.
- Add real underwater perception pretraining.
- Add public sonar and underwater image datasets with license-compliant pipelines.
- Train multimodal CNN encoders.
- Train and evaluate the prior-guided TD3 policy on GPU.
- Run ablation studies for MFI, CNN, gate, resources, safety layer, replay strategy, and smoothness.
- Report results across multiple seeds with confidence intervals.
- Validate sim-to-real assumptions in a controlled tank environment.
