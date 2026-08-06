---
inclusion: always
---

# Product: Underwater Rescue MVP

This repository contains a bilingual browser-based simulation and decision-support prototype for human-in-the-loop underwater search and rescue.

## Primary mission

The simulated four-thruster UUV searches for a submerged vehicle and suspected victims, avoids rocks and pipes, plans a safe approach, and lets a human rescuer confirm the target and control the mission outcome.

## Users and audience

- Fire and rescue departments
- Maritime and underwater engineering companies
- Professional diving rescue teams
- Underwater robotics companies
- Academic supervisors, paper reviewers, investors, and technology partners

## Product boundaries

- This is a simulation and decision-support prototype, not a certified rescue device.
- The prototype does not detect real life signs or deliver oxygen.
- Oxygen is a virtual resource-consumption module for mission planning.
- Uncertain detections must be called suspected targets until a human confirms them.
- The human operator remains responsible for target confirmation and rescue decisions.

## MVP priorities

1. Complete search-to-approach mission loop
2. Understandable bilingual interactive interface
3. Visible MFI, policy, gate, and safety behavior
4. Human confirmation, pause, manual takeover, and return controls
5. Reproducible seeded scenarios
6. Clear simulation disclaimer
