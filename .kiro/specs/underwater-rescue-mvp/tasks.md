# Underwater Rescue MVP — Tasks

## Execution guidance

- Complete MVP tasks first for the two-day browser-only prototype.
- Each task should take 15-60 minutes to complete.
- Keep each task small enough to review independently.
- Mark a task complete only after its acceptance criteria are verified.
- Later tasks are for follow-up research and paper experiments.
- Do not implement any task in the Later section during the MVP sprint.
- Use the numeric thresholds and scenario definitions in `requirements.md` as the source of truth.

## MVP — Two-day browser-only prototype

### 1. React + TypeScript + Vite project setup

- [x] 1.1 Initialize Vite + React + TypeScript project
  - **Acceptance**: `npm create vite@latest` runs successfully, TypeScript strict mode enabled
  - **Time**: 15 min

- [x] 1.2 Add project structure and base configuration
  - **Acceptance**: Folders created: `src/engine`, `src/components`, `src/types`, `src/i18n`, `src/utils`
  - **Time**: 10 min

- [x] 1.3 Add README with simulation disclaimer
  - **Acceptance**: README states "This is a simulation using a scripted policy and does not provide medical or real rescue guarantees"
  - **Time**: 15 min

- [x] 1.4 Add MIT license and data-use policy
  - **Acceptance**: LICENSE file created, data policy placeholder in README
  - **Time**: 10 min

### 2. Browser-based deterministic mission engine

- [x] 2.1 Define TypeScript types for mission state
  - **Acceptance**: Types defined for: MissionState, UUVState, BatteryState, OxygenState, MissionPhase
  - **Time**: 20 min

- [x] 2.2 Define TypeScript types for scenario configuration
  - **Acceptance**: Types defined for: ScenarioConfig, ObstacleConfig, TargetConfig, VehicleConfig
  - **Time**: 20 min

- [x] 2.3 Implement seeded random number generator
  - **Acceptance**: Seeded RNG produces identical sequences for same seed, unit test passes
  - **Time**: 30 min

- [x] 2.4 Implement 2D kinematic UUV motion model
  - **Acceptance**: UUV updates X, Y, heading based on velocity commands, unit test for position update passes
  - **Time**: 45 min

- [x] 2.5 Implement deterministic mission state update loop
  - **Acceptance**: `missionEngine.step()` advances mission by one timestep deterministically
  - **Time**: 60 min

### 3. Three scenarios: normal, low_visibility, low_oxygen

- [x] 3.1 Implement seeded scenario generator
  - **Acceptance**: `generateScenario(seed, scenarioName)` returns reproducible scenario config
  - **Time**: 45 min

- [x] 3.2 Create "normal" scenario template
  - **Acceptance**: Normal scenario has 4-6 static obstacles, 1 vehicle, 2-3 victims, visibility=1.0, current magnitude=0.0 m/s, battery=100%, and oxygen=100 units
  - **Time**: 30 min

- [x] 3.3 Create "low_visibility" scenario template
  - **Acceptance**: Low visibility scenario has visibility=0.35, current magnitude=0.1 m/s, increased obstacle density, and sonar range behavior remains available
  - **Time**: 30 min

- [x] 3.4 Create "low_oxygen" scenario template
  - **Acceptance**: Low oxygen scenario has initial oxygen=25 units, current magnitude=0.1 m/s, and produces the 20-percent warning during a sufficiently long mission
  - **Time**: 30 min

- [x] 3.5 Implement difficulty parameters
  - **Acceptance**: `easy`, `standard`, and `hard` change only documented obstacle density, target distance, and current magnitude; safety thresholds remain unchanged
  - **Time**: 30 min

### 4. Static obstacles and synthetic camera/sonar-like outputs

- [x] 4.1 Implement static obstacle placement
  - **Acceptance**: Scenario contains rocks (circles) and pipes (rectangles) at fixed positions
  - **Time**: 30 min

- [x] 4.2 Implement 2D collision detection (circle-circle, circle-rectangle)
  - **Acceptance**: `checkCollision(uuv, obstacles)` returns true for overlaps, unit test passes
  - **Time**: 45 min

- [x] 4.3 Implement schematic camera view generator
  - **Acceptance**: Camera view renders colored shapes for vehicle, victims, obstacles on Canvas with visibility degradation
  - **Time**: 60 min

- [x] 4.4 Implement raycast-based sonar range detector
  - **Acceptance**: Sonar emits N beams, returns range values for each beam, detects obstacles and targets
  - **Time**: 60 min

- [x] 4.5 Implement 2D occupancy grid map
  - **Acceptance**: Occupancy map updates with free/occupied/unknown cells from sensor data
  - **Time**: 60 min

- [x] 4.6 Implement perception detector with confidence scores
  - **Acceptance**: Detector returns objects with type, position, confidence (0-1), source modality (camera/sonar/marker)
  - **Time**: 45 min

### 5. MFI-inspired potential-field scripted policy

- [x] 5.1 Implement potential-field attraction to target
  - **Acceptance**: Attraction force increases as UUV approaches target, unit test passes
  - **Time**: 30 min

- [x] 5.2 Implement potential-field repulsion from obstacles
  - **Acceptance**: Repulsion force increases near obstacles, unit test passes
  - **Time**: 30 min

- [x] 5.3 Implement constant water current compensation
  - **Acceptance**: Policy adds current vector (constant) to motion commands
  - **Time**: 20 min

- [x] 5.4 Implement scripted policy action generator
  - **Acceptance**: `scriptedPolicy.getAction(state)` returns velocity and angular velocity commands
  - **Time**: 45 min

- [x] 5.5 Add action clipping to actuator limits
  - **Acceptance**: Actions clamped to max velocity and max angular velocity
  - **Time**: 15 min

### 6. Safety layer and command priority

- [x] 6.1 Implement obstacle-distance safety check
  - **Acceptance**: Safety layer warns inside the 1.5m safe margin and rejects or falls back before predicted distance reaches the 0.8m critical threshold
  - **Time**: 30 min

- [x] 6.2 Implement actuator limit and action-rate limit checks
  - **Acceptance**: Safety layer clips actions exceeding velocity, angular velocity, or rate-of-change limits
  - **Time**: 30 min

- [x] 6.3 Implement battery and oxygen feasibility checks
  - **Acceptance**: Safety layer triggers warning when resources insufficient for return, unit test passes
  - **Time**: 45 min

- [x] 6.4 Implement mission boundary (geofence) check
  - **Acceptance**: Safety layer prevents UUV from leaving mission area boundaries
  - **Time**: 20 min

- [x] 6.5 Implement command priority system (pause > manual > return > autonomous)
  - **Acceptance**: Command priority enforced, higher priority commands suppress lower priority
  - **Time**: 45 min

- [x] 6.6 Implement safe fallback states (hold, slow mode, manual prompt)
  - **Acceptance**: When collision imminent or resources critical, system enters fallback state
  - **Time**: 30 min

- [x] 6.7 Add safety layer override for manual control
  - **Acceptance**: Manual commands pass through safety layer, unsafe commands rejected, event logged
  - **Time**: 30 min

### 7. Target confirmation queue

- [x] 7.1 Implement target detection event
  - **Acceptance**: Camera-like detection requires target distance <=4m and visibility >=0.35; sonar-like detection requires distance <=8m; confidence >=0.45 enters the queue
  - **Time**: 20 min

- [x] 7.2 Implement target confirmation queue (FIFO)
  - **Acceptance**: Multiple detections added to queue, presented sequentially
  - **Time**: 30 min

- [x] 7.3 Implement target confirmation handler
  - **Acceptance**: Operator confirms target, mission state transitions to "target_confirmed", target added to confirmed list
  - **Time**: 30 min

- [x] 7.4 Implement target rejection handler
  - **Acceptance**: Operator rejects target, system discards target, returns to "searching" state
  - **Time**: 30 min

- [x] 7.5 Add internal victim marker (sonar-only detection)
  - **Acceptance**: Internal victim represented as pre-placed marker visible only to sonar, not camera
  - **Time**: 20 min

### 8. Manual keyboard controls

- [ ] 8.1 Implement keyboard event listeners
  - **Acceptance**: Arrow keys, WASD, spacebar, Escape registered as control inputs
  - **Time**: 30 min

- [ ] 8.2 Map keyboard to manual directional controls
  - **Acceptance**: Up/W=forward, Down/S=backward, Left/A=rotate left, Right/D=rotate right
  - **Time**: 20 min

- [ ] 8.3 Implement manual takeover mode
  - **Acceptance**: Operator presses 'M', system enters manual mode, autonomous navigation stops
  - **Time**: 30 min

- [ ] 8.4 Implement pause mode
  - **Acceptance**: Operator presses spacebar, mission freezes, press again to resume
  - **Time**: 20 min

- [ ] 8.5 Implement return mode
  - **Acceptance**: Operator presses 'R', UUV uses scripted policy to navigate toward start position
  - **Time**: 45 min

- [ ] 8.6 Implement return path failure handling
  - **Acceptance**: If resources insufficient for return, display error "Return not feasible" and offer "Abort Mission" button
  - **Time**: 30 min

- [ ] 8.7 Implement abort mission action
  - **Acceptance**: Operator clicks "Abort Mission", mission state set to "aborted", mission ends
  - **Time**: 15 min

### 9. Oxygen resource simulation

- [ ] 9.1 Implement oxygen consumption model
  - **Acceptance**: Oxygen decreases based on: base_rate * time + motion_rate * velocity_magnitude
  - **Time**: 30 min

- [ ] 9.2 Add oxygen warning threshold (20%)
  - **Acceptance**: When oxygen < 20%, display warning message in selected language
  - **Time**: 20 min

- [ ] 9.3 Add oxygen critical threshold (0%)
  - **Acceptance**: When oxygen reaches 0%, force mission termination or return-to-start
  - **Time**: 20 min

- [ ] 9.4 Add "Resource Simulation" label to oxygen UI
  - **Acceptance**: Oxygen display clearly labeled "Resource Simulation" in both languages
  - **Time**: 10 min

- [ ] 9.5 Implement battery consumption model
  - **Acceptance**: Battery decreases based on time and motion demand, similar to oxygen
  - **Time**: 30 min

### 10. Chinese/English interface

- [ ] 10.1 Create i18n configuration with English and Simplified Chinese
  - **Acceptance**: i18n files created: `en.json`, `zh-CN.json` with translation keys
  - **Time**: 30 min

- [ ] 10.2 Add language selection to mission setup screen
  - **Acceptance**: Language dropdown with "English" and "简体中文" options
  - **Time**: 20 min

- [ ] 10.3 Translate main UI labels (setup, controls, warnings)
  - **Acceptance**: At least 30 main UI strings translated: screen titles, button labels, warnings
  - **Time**: 45 min

- [ ] 10.4 Add language context provider
  - **Acceptance**: Selected language stored in React context, accessible to all components
  - **Time**: 30 min

- [ ] 10.5 Lock language during live mission
  - **Acceptance**: Language selection disabled once mission starts, enabled in setup and results screens only
  - **Time**: 15 min

### 11. 2D map and mission dashboard

- [ ] 11.1 Create mission setup screen layout
  - **Acceptance**: Setup screen displays: language selector, scenario dropdown, seed input, start position, battery/oxygen inputs
  - **Time**: 45 min

- [ ] 11.2 Create 2D top-down occupancy map Canvas renderer
  - **Acceptance**: Canvas displays UUV position, heading, obstacles, targets, occupancy grid
  - **Time**: 60 min

- [ ] 11.3 Create schematic camera view panel
  - **Acceptance**: Camera view shows colored geometric shapes for objects, visibility degradation applied
  - **Time**: 45 min

- [ ] 11.4 Create sonar range bar chart panel
  - **Acceptance**: Sonar panel shows N beams as vertical bars with range values, color-coded by object type
  - **Time**: 45 min

- [ ] 11.5 Create target confirmation dialog
  - **Acceptance**: Dialog displays target type, position, confidence, "Confirm" and "Reject" buttons
  - **Time**: 30 min

- [ ] 11.6 Create battery and oxygen status cards
  - **Acceptance**: Cards display current percentage, consumption rate, warning indicators
  - **Time**: 30 min

- [ ] 11.7 Create safety margin indicator
  - **Acceptance**: Display nearest obstacle distance and color-coded risk level (green/yellow/red)
  - **Time**: 20 min

- [ ] 11.8 Create mission status panel
  - **Acceptance**: Display current mission phase, elapsed time, command mode (autonomous/manual/paused/returning)
  - **Time**: 30 min

- [ ] 11.9 Create operator control panel
  - **Acceptance**: Buttons for: Pause, Manual Takeover, Return, Abort Mission, keyboard shortcut hints
  - **Time**: 30 min

- [ ] 11.10 Create event log timeline
  - **Acceptance**: Scrollable log displays timestamped events: collisions, detections, confirmations, warnings
  - **Time**: 45 min

- [ ] 11.11 Create results summary screen
  - **Acceptance**: Display: success/failure, target confirmations, collisions, path length, mission time, battery/oxygen consumption
  - **Time**: 45 min

- [ ] 11.12 Add action transparency display
  - **Acceptance**: Show "Proposed Action" and "Final Action" side-by-side to demonstrate safety layer
  - **Time**: 30 min

### 12. JSON export with maximum 100 trajectory points

- [ ] 12.1 Implement trajectory recording during mission
  - **Acceptance**: Mission engine records [timestamp, x, y, heading] at each timestep
  - **Time**: 20 min

- [ ] 12.2 Implement trajectory downsampling to 100 points
  - **Acceptance**: If trajectory > 100 points, downsample to exactly 100 evenly spaced points
  - **Time**: 30 min

- [ ] 12.3 Implement JSON export schema
  - **Acceptance**: Export matches exact schema from requirements R10 with all required fields
  - **Time**: 45 min

- [ ] 12.4 Add "Export JSON" button to results screen
  - **Acceptance**: Button triggers file download with filename format: `mission_{missionId}_{timestamp}.json`
  - **Time**: 20 min

- [ ] 12.5 Add mission metadata collection
  - **Acceptance**: Export includes: missionId (UUID), scenarioName, seed, language, timestamps, status
  - **Time**: 30 min

- [ ] 12.6 Add target confirmations array to export
  - **Acceptance**: Export includes array of confirmed/rejected targets with targetId, type, confirmed, timestamp
  - **Time**: 20 min

- [ ] 12.7 Add mission metrics to export
  - **Acceptance**: Export includes: collisionCount, minObstacleDistance, pathLength, duration, battery/oxygen initial/final
  - **Time**: 20 min

### 13. Replay and deterministic tests

- [ ] 13.1 Implement scenario replay from seed
  - **Acceptance**: Same seed + scenario name produces identical obstacle/target positions
  - **Time**: 30 min

- [ ] 13.2 Write deterministic mission test (normal scenario)
  - **Acceptance**: Run mission with seed=42, verify final position within ±1e-6 tolerance
  - **Time**: 45 min

- [ ] 13.3 Write deterministic mission test (low_visibility scenario)
  - **Acceptance**: Run mission with seed=43, verify same detections and events
  - **Time**: 30 min

- [ ] 13.4 Write deterministic mission test (low_oxygen scenario)
  - **Acceptance**: Run mission with seed=44, verify oxygen warning triggers at correct timestep
  - **Time**: 30 min

- [ ] 13.5 Add unit test for collision detection
  - **Acceptance**: Test verifies collision detection for circle-circle and circle-rectangle cases
  - **Time**: 30 min

- [ ] 13.6 Add unit test for safety layer
  - **Acceptance**: Test verifies safety layer rejects unsafe actions, logs events
  - **Time**: 45 min

- [ ] 13.7 Add unit test for command priority
  - **Acceptance**: Test verifies pause > manual > return > autonomous priority enforcement
  - **Time**: 30 min

- [ ] 13.8 Add unit test for target confirmation queue
  - **Acceptance**: Test verifies FIFO queue, sequential presentation, rejection handling
  - **Time**: 30 min

- [ ] 13.9 Add integration test for complete mission flow
  - **Acceptance**: Test runs mission from setup to completion, verifies state transitions
  - **Time**: 60 min

### 14. Browser deployment

- [ ] 14.1 Add build configuration for production
  - **Acceptance**: `npm run build` produces optimized production bundle
  - **Time**: 15 min

- [ ] 14.2 Add deployment instructions for static hosting
  - **Acceptance**: README includes instructions for deploying to GitHub Pages or Netlify
  - **Time**: 20 min

- [ ] 14.3 Test production build locally
  - **Acceptance**: `npm run preview` serves production build, all features work
  - **Time**: 15 min

- [ ] 14.4 Deploy to static hosting service
  - **Acceptance**: Demo accessible at public URL, all three scenarios work, and language can be selected before mission start
  - **Time**: 30 min

- [ ] 14.5 Record demo video or GIF
  - **Acceptance**: 1-2 minute video showing: mission setup, navigation, target confirmation, manual control, export
  - **Time**: 30 min

- [ ] 14.6 Add demo link and video to README
  - **Acceptance**: README contains live demo link and embedded demo video/GIF
  - **Time**: 10 min

## Later — Research extensions (NOT in MVP)

### Backend services (FastAPI, WebSocket, Docker)

- [ ] L1. Implement Python FastAPI backend service
  - **Scope**: Move simulation engine to Python backend, add REST API endpoints

- [ ] L2. Add WebSocket streaming for real-time mission state
  - **Scope**: Stream mission state updates at 10-30 Hz

- [ ] L3. Add Docker Compose configuration
  - **Scope**: Containerize frontend and backend services

- [ ] L4. Add server-capable hosting deployment (Heroku, Railway, Render)
  - **Scope**: Deploy backend service to cloud platform with WebSocket support

### CSV export

- [ ] L5. Implement CSV export format
  - **Scope**: Flatten mission data to CSV with separate files for trajectory and target confirmations

### Learned policy models and GPU training

- [ ] L6. Reproduce low-dimensional TD3-IMP baseline
  - **Scope**: Implement TD3 with importance sampling in PyTorch

- [ ] L7. Train MFI prior-guided TD3 policy on GPU
  - **Scope**: Add trainable MFI prior, action gating network, CNN encoders

- [ ] L8. Add CNN encoders for camera and sonar fusion
  - **Scope**: ResNet or EfficientNet encoders for multimodal perception

- [ ] L9. Add public underwater dataset integration
  - **Scope**: License-compliant pipelines for public sonar and underwater image datasets

- [ ] L10. Add ablation studies (MFI, gate, CNN, resources, safety, replay, smoothness)
  - **Scope**: Systematic experiments with multiple seeds and confidence intervals

### Advanced simulation features

- [ ] L11. Add dynamic obstacles (moving debris, fish)
  - **Scope**: Time-varying obstacle motion with collision avoidance

- [ ] L12. Add sinusoidal water current
  - **Scope**: Time-varying current with amplitude, frequency, phase parameters

- [ ] L13. Add 3D visualization (Three.js)
  - **Scope**: Replace 2D map with 3D underwater scene, trajectory rendering

- [ ] L14. Add real-time language switching during live mission
  - **Scope**: Allow language change without restarting mission

- [ ] L15. Add full bilingual coverage (error messages, logs, tooltips)
  - **Scope**: Translate all UI text, not just main labels

### Advanced physics and sensors

- [ ] L16. Add 6-DOF UUV dynamics (3D motion, drag, buoyancy)
  - **Scope**: Replace 2D kinematic model with full thruster-level dynamics

- [ ] L17. Add physics-based sonar simulation (multipath, reflections)
  - **Scope**: Replace raycast with acoustic wave propagation model

- [ ] L18. Add photorealistic camera rendering
  - **Scope**: Replace schematic shapes with rendered underwater imagery

## Definition of done for MVP

- [ ] An operator can select language (English or Simplified Chinese) and start a seeded mission from the browser
- [ ] The scene contains a submerged vehicle, internal and external suspected victims, rocks, and pipes (all static)
- [ ] The UUV navigates toward targets using scripted potential-field policy and reaches a confirmed target
- [ ] At least one obstacle-avoidance event is visible in the UI (safety layer override)
- [ ] The operator can confirm or reject targets (queued sequentially), pause, take manual control, and request return
- [ ] The safety layer remains active during manual control and overrides unsafe commands
- [ ] If return path computation fails, the system displays an error and offers an "Abort Mission" action
- [ ] Oxygen decreases during the mission and triggers a visible warning in the low_oxygen scenario
- [ ] The interface displays all main labels, controls, warnings, setup fields, and results in the selected language
- [ ] A mission result can be exported as JSON with at most 100 trajectory points
- [ ] The 2D top-down occupancy map is visible in the live mission view
- [ ] All three scenarios (normal, low_visibility, low_oxygen) run deterministically with same seed
- [ ] Unit tests pass for: collision detection, safety layer, command priority, target queue
- [ ] Integration test passes for complete mission flow
- [ ] The README clearly states that the MVP is a simulation using a scripted policy and does not provide medical or real rescue guarantees
- [ ] Demo deployed to static hosting and accessible via public URL
