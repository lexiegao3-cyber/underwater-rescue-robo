# Underwater Rescue MVP — Tasks

## Execution guidance

- Complete P0 tasks first for the two-day browser prototype.
- Do not start full CNN-TD3 training during the P0 window.
- Keep each task small enough to review independently.
- Mark a task complete only after its acceptance criteria are verified.
- P1 and P2 tasks are for the follow-up paper and research branch.

## P0 — Two-day interactive prototype

- [ ] 1. Create the repository structure and project README.
  - [ ] Add license and data-use policy placeholders.
  - [ ] Add a clear simulation-only disclaimer.
  - [ ] Add setup and run instructions.

- [ ] 2. Define shared schemas for mission configuration, sensor observations, detections, actions, events, and mission results.
  - [ ] Add validation for required fields and numeric ranges.
  - [ ] Add bilingual display-label mappings.

- [ ] 3. Implement seeded scenario generation.
  - [ ] Generate submerged vehicle.
  - [ ] Generate internal and external suspected victim proxies.
  - [ ] Generate rocks, pipes, and unknown obstacles.
  - [ ] Generate visibility, water-current, battery, and oxygen parameters.
  - [ ] Save scenario configuration for replay.

- [ ] 4. Implement the four-thruster UUV simulator.
  - [ ] Implement position, heading, velocity, and action updates.
  - [ ] Implement current disturbance.
  - [ ] Implement battery consumption.
  - [ ] Implement virtual oxygen consumption.
  - [ ] Implement mission state transitions.

- [ ] 5. Implement the synthetic sensor adapters.
  - [ ] Generate camera-like scene frames.
  - [ ] Generate sonar-like grayscale or polar frames.
  - [ ] Generate local occupancy and risk maps.
  - [ ] Generate structured UUV state.
  - [ ] Generate detection labels and confidence values.

- [ ] 6. Implement the deterministic perception baseline.
  - [ ] Detect vehicle, external suspected victim, internal suspected victim, rock, pipe, and unknown obstacle from scenario truth with configurable noise.
  - [ ] Preserve the distinction between camera-derived and sonar-derived detections.
  - [ ] Expose confidence and source modality.

- [ ] 7. Implement the MVP navigation loop.
  - [ ] Implement MFI prior action.
  - [ ] Implement four-channel policy adapter placeholder.
  - [ ] Implement gate value.
  - [ ] Implement mixed action.
  - [ ] Implement safety layer and fallback actions.
  - [ ] Record MFI, policy, mixed, and final actions.

- [ ] 8. Implement human-in-the-loop controls.
  - [ ] Confirm target.
  - [ ] Reject target.
  - [ ] Pause and resume.
  - [ ] Manual takeover.
  - [ ] Return.
  - [ ] Abort mission.

- [ ] 9. Implement the browser UI.
  - [ ] Add bilingual language switch.
  - [ ] Add mission setup view.
  - [ ] Add live mission view.
  - [ ] Add camera and sonar panels.
  - [ ] Add 3D scene and trajectory.
  - [ ] Add target confirmation card.
  - [ ] Add battery, oxygen, and safety cards.
  - [ ] Add operator control buttons.
  - [ ] Add event timeline.
  - [ ] Add result summary.

- [ ] 10. Connect the browser UI to the simulation service.
  - [ ] Add mission start endpoint.
  - [ ] Add WebSocket state stream.
  - [ ] Add operator-command endpoint.
  - [ ] Add mission-result endpoint.
  - [ ] Handle disconnected or failed simulation service visibly.

- [ ] 11. Add result export and replay.
  - [ ] Export mission metadata as JSON.
  - [ ] Export summary metrics as CSV.
  - [ ] Replay a seeded scenario.
  - [ ] Show a clear simulation timestamp and seed.

- [ ] 12. Add P0 verification scenarios.
  - [ ] Normal visibility and sufficient resources.
  - [ ] Low visibility and noisy sensor scenario.
  - [ ] Low oxygen scenario with return recommendation.
  - [ ] Obstacle encounter with visible safety intervention.
  - [ ] Target rejection and continued search.
  - [ ] Manual takeover and return.

- [ ] 13. Package the browser demo.
  - [ ] Add Docker configuration.
  - [ ] Add environment-variable documentation.
  - [ ] Add cloud deployment instructions.
  - [ ] Record a short demo video or GIF.

## P1 — Public data and research-ready perception

- [ ] 14. Add a public-dataset attribution registry.
  - [ ] Record dataset URL, version, license, citation, and permitted use.
  - [ ] Do not commit raw third-party data unless redistribution is permitted.

- [ ] 15. Add synthetic data generation and label export.
  - [ ] Export camera labels.
  - [ ] Export sonar labels.
  - [ ] Export occupancy labels.
  - [ ] Export train/validation/test manifests.

- [ ] 16. Add the perception adapter interface for CNN models.
  - [ ] Define image and tensor input contracts.
  - [ ] Define detection and segmentation output contracts.
  - [ ] Add a CPU-friendly inference mode.

- [ ] 17. Prepare public-data baselines.
  - [ ] Underwater segmentation baseline.
  - [ ] Sonar suspected-victim segmentation baseline.
  - [ ] Obstacle and submerged-vehicle detection baseline.
  - [ ] Document dataset-domain mismatch.

## P2 — Paper-grade reinforcement learning experiments

- [ ] 18. Reproduce the low-dimensional TD3-IMP baseline.
- [ ] 19. Add CNN encoders and structured-state MLP encoders.
- [ ] 20. Add trained MFI prior-guided TD3 policy.
- [ ] 21. Add prioritized, high-return, safety-critical, and recent replay buffers.
- [ ] 22. Add curriculum learning and domain randomization.
- [ ] 23. Add GPU training configuration and checkpoint management.
- [ ] 24. Add ablation experiments for MFI, CNN, gate, resources, safety layer, replay, and smoothness.
- [ ] 25. Add multiple random seeds, confidence intervals, and reproducible evaluation scripts.
- [ ] 26. Add paper figures, tables, and result export.

## Definition of done for P0

- A browser user can run the complete search-to-approach flow.
- The UI visibly distinguishes camera, sonar, map, MFI, policy, and safety outputs.
- The user can confirm a target, pause, take over, return, and abort.
- Oxygen and battery values change during the mission and produce warnings.
- At least three seeded scenarios can be replayed.
- Results can be exported.
- The README contains the simulation-only disclaimer and public-data policy.
