# Underwater Rescue Robo

Bilingual browser-based simulation and decision-support prototype for human-in-the-loop underwater search and rescue.

## Project Purpose

This is a **browser-only MVP demonstration** of a human-in-the-loop underwater search-and-rescue assistant concept. The project aims to:

- Demonstrate a complete search-to-approach mission loop in a reproducible simulation
- Make the scripted navigation policy, safety layer, and human approval visible in the UI
- Provide a credible product-shaped interface for future research experiments
- Run entirely in the browser without requiring GPU hardware

## ⚠️ CRITICAL DISCLAIMERS

**THIS IS A SIMULATION USING A SCRIPTED POLICY AND DOES NOT PROVIDE MEDICAL OR REAL RESCUE GUARANTEES.**

This system is:
- ❌ **NOT** a certified rescue device
- ❌ **NOT** a medical device
- ❌ **NOT** a life-sign detector
- ❌ **NOT** an oxygen-delivery controller
- ❌ **NOT** an autonomous rescue system
- ❌ **NOT** suitable for real-world rescue operations

**Oxygen Resource Simulation:**
- The oxygen feature is **VIRTUAL RESOURCE SIMULATION ONLY**
- It does NOT control, measure, or deliver real oxygen
- It does NOT provide medical life-support capabilities
- It is purely a simulated resource constraint for demonstration purposes

**Navigation Policy:**
- The MVP uses a **deterministic scripted potential-field navigation policy**
- It does NOT use learned AI models (TD3, reinforcement learning, or neural networks)
- Learned policy models are reserved for later research phases

## MVP Scope

### What the MVP Includes

✅ **Browser-only simulation** - Runs entirely client-side in React + TypeScript  
✅ **2D kinematic motion** - Simplified 2D navigation (X, Y, heading)  
✅ **Static obstacles** - Rocks, pipes, submerged vehicle at fixed positions  
✅ **Scripted potential-field navigation** - Classical robotics obstacle avoidance  
✅ **Safety layer** - Active constraint checking (remains active during manual control)  
✅ **Human-in-the-loop controls** - Target confirmation, pause, manual takeover, return, abort  
✅ **Target confirmation queue** - Sequential processing of suspected targets  
✅ **Bilingual UI** - English and Simplified Chinese main labels and controls  
✅ **Virtual resource simulation** - Battery and oxygen consumption models  
✅ **2D top-down map** - Occupancy grid visualization  
✅ **Schematic sensor views** - Simplified camera and sonar displays  
✅ **Command priority system** - Pause > Manual > Return > Autonomous  
✅ **JSON export** - Mission results with max 100 trajectory points  
✅ **Deterministic replay** - Reproducible scenarios with fixed seeds  

### MVP Limitations

The MVP intentionally excludes these features to remain achievable within a two-day development window:

❌ **No backend services** - No FastAPI, WebSocket, Docker, or Python server  
❌ **No 3D visualization** - Uses 2D top-down map only (no Three.js)  
❌ **No dynamic obstacles** - All obstacles are static (no moving debris or fish)  
❌ **No learned AI models** - No TD3, CNN encoders, or GPU training  
❌ **No real-time language switching** - Language selected at mission setup only  
❌ **No advanced physics** - No 6-DOF dynamics, drag, buoyancy, or thruster-level control  
❌ **No photorealistic rendering** - Uses schematic colored shapes  
❌ **No physics-based sonar** - Simple raycast detection (no multipath propagation)  
❌ **No CSV export** - JSON export only  
❌ **Partial bilingual coverage** - ~30 main UI strings only (not error messages or logs)  

## Status

The project is currently in the **MVP implementation stage**.

Three scenarios are provided:
- **normal** - Standard visibility, sufficient resources, moderate obstacle density
- **low_visibility** - Degraded camera view, sonar-preferred detection
- **low_oxygen** - Resource constraints requiring careful planning

## Later Research Features

The following features are explicitly reserved for future research phases and are **NOT included in the MVP**:

### Backend Services
- Replace browser-only simulation with Python FastAPI backend
- Add WebSocket streaming for real-time mission state updates
- Add Docker Compose configuration for containerized deployment
- Deploy to server-capable hosting (Heroku, Railway, Render, AWS)

### Learned Policy Models
- Replace scripted potential-field policy with learned TD3 or TD3-IMP policy
- Add trainable MFI (Maximum Fisher Information) prior with action gating networks
- Train multimodal CNN encoders for camera and sonar fusion
- Add GPU-based training and inference

### Advanced Simulation
- Add dynamic obstacles (moving debris, fish, time-varying currents)
- Add sinusoidal water current with amplitude, frequency, phase parameters
- Add 6-DOF UUV dynamics (3D motion, drag, buoyancy, thruster-level control)
- Add physics-based sonar simulation (multipath propagation, acoustic reflections)
- Add photorealistic camera rendering with turbidity and lighting effects

### Advanced Features
- Add 3D visualization with Three.js (underwater scene, trajectory rendering)
- Add real-time language switching during live missions
- Add full bilingual coverage (error messages, tooltips, logs)
- Add CSV export format with flattened data tables
- Add public underwater dataset integration with license-compliant pipelines

### Research Experiments
- Run ablation studies (MFI prior, CNN encoders, gating networks, safety configurations)
- Report results across multiple seeds with confidence intervals
- Validate sim-to-real assumptions in controlled tank environment
- Add curriculum learning and domain randomization
- Add prioritized replay buffers and advanced training strategies

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Copyright (c) 2026 Underwater Rescue Robo Contributors

## Data-Use Policy

**This project is for research demonstration purposes only.**

### What MAY Be Committed to the Public Repository

✅ **Synthetic data** - Algorithmically generated scenarios, obstacles, and trajectories  
✅ **Permitted derived artifacts** - Aggregated statistics, anonymized mission logs, summary metrics  
✅ **Public dataset references** - Attribution files, download instructions, and license notes for public datasets  
✅ **Simulation parameters** - Configuration files for reproducible scenarios  
✅ **Code and documentation** - All source code, specifications, and README files  

### What MUST NOT Be Committed to the Public Repository

❌ **Confidential rescue data** - Real rescue mission data, emergency response information  
❌ **Military or defense data** - Classified or sensitive defense-related information  
❌ **Company proprietary data** - Confidential company sensor data, robot parameters, or trade secrets  
❌ **Personal data** - Any personally identifiable information (PII) or personal images  
❌ **Mission locations** - Real-world coordinates of rescue operations or sensitive sites  
❌ **Credentials and secrets** - API keys, passwords, access tokens, or authentication data  
❌ **Restricted third-party datasets** - Raw data from datasets that prohibit redistribution  
❌ **Confidential sonar or camera data** - Real underwater imagery or sonar scans from non-public sources  

### Public Dataset Integration Requirements

When integrating public datasets in future research phases:

1. **Attribution** - Include clear attribution to original dataset authors and institutions
2. **License compliance** - Verify dataset license permits research use and document any restrictions
3. **No redistribution** - Store only dataset download URLs and processing scripts, not raw data files
4. **Citation** - Add proper academic citations to any published papers associated with the dataset
5. **Version tracking** - Record dataset version and download date for reproducibility

### Data Organization

```
data/
  synthetic/          # Generated scenarios (✅ may commit)
    scenarios/
    camera/
    sonar/
    occupancy/
  public_sources/     # Dataset attribution only (✅ may commit)
    README.md
    dataset_urls.txt
  generated_logs/     # Anonymized mission logs (✅ may commit)
  schemas/            # Data format specifications (✅ may commit)
  
# DO NOT CREATE these directories in public repository:
  confidential/       # ❌ NEVER commit
  real_missions/      # ❌ NEVER commit
  proprietary/        # ❌ NEVER commit
```

### Violation Consequences

Violating this data-use policy may result in:
- Removal of confidential data from repository history (requires force-push)
- Legal liability under data protection regulations (GDPR, CCPA, etc.)
- Breach of non-disclosure agreements with data providers
- Ethical violations in research conduct
- Damage to project reputation and credibility

**When in doubt, do NOT commit the data.** Store it locally or in a secure private repository instead.

## Kiro Project Files

- `.kiro/specs/underwater-rescue-mvp/requirements.md` — behavior and acceptance criteria
- `.kiro/specs/underwater-rescue-mvp/design.md` — architecture and interfaces
- `.kiro/specs/underwater-rescue-mvp/tasks.md` — implementation task list
- `.kiro/steering/` — persistent product, technology, structure, and data-safety rules
