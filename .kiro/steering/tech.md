---
inclusion: always
---

# Tech Stack: Underwater Rescue MVP

## Application type

This repository contains a browser-based simulation application plus Kiro specifications and steering files. The original AI-DLC Lite rules are retained as legacy workflow documentation under `.kiro/aws-aidlc-lite-rule-details/` and `.kiro/legacy-steering/`.

## MVP stack

- Frontend: React, TypeScript, Vite, Three.js
- Backend: Python, FastAPI, WebSocket
- Data: JSON, CSV, PNG/WebP, NumPy-compatible arrays
- Packaging: Docker and Docker Compose
- Runtime: CPU-compatible deterministic demo; GPU training is a later extension

## Architecture rules

- Keep the UI independent of the perception and policy implementations.
- Use adapter interfaces for perception and policy.
- Use seeded deterministic simulation for reproducible demo scenarios.
- Keep mission state and result schemas explicit and versioned.
- Do not add real hardware control APIs in the MVP.

## Research extension

The later research branch may add CNN encoders, trained TD3, GPU workers, replay buffers, curriculum learning, and sim-to-real experiments without changing the browser-facing mission schema.
