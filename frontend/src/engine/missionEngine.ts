/**
 * Mission Engine
 * Deterministic mission state update loop
 */

import type {
  MissionState,
  MissionPhase,
  CommandMode,
  Language,
  UUVState,
  BatteryState,
  OxygenState,
  ControlAction,
  WaterCurrent,
} from '../types';
import { updateUUVKinematics, type UUVPose } from './kinematics';

/**
 * Minimal mission configuration for initialization
 */
export interface MissionConfig {
  scenarioName: string;
  seed: number;
  language: Language;
  timestep: number;
  initialPosition: { x: number; y: number };
  initialHeading: number;
  waterCurrent: WaterCurrent;
  visibility: number;
  initialBattery: number;
  initialOxygen: number;
  /** Optional values for reproducible replay or a real UI session. */
  missionId?: string;
  startTime?: string;
}

/** Create a stable UUID-shaped identifier for deterministic replay. */
function createDeterministicMissionId(scenarioName: string, seed: number): string {
  let hash = 2166136261;
  const input = `${scenarioName}:${seed}`;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  const hex = (value: number) => (value >>> 0).toString(16).padStart(8, '0');
  const first = hex(hash);
  const second = hex(Math.imul(hash ^ 0x9e3779b9, 0x45d9f3b));
  const third = `4${hex(Math.imul(hash ^ 0x85ebca6b, 0xc2b2ae35)).slice(1)}`;
  const fourth = `8${hex(Math.imul(hash ^ 0x27d4eb2f, 0x165667b1)).slice(1)}`;
  const fifth = `${hex(Math.imul(hash ^ 0x94d049bb, 0x27d4eb2d))}${hex(hash ^ 0x7f4a7c15)}`;

  return `${first}-${second.slice(0, 4)}-${third}-${fourth}-${fifth}`;
}

function cloneMissionState(state: MissionState): MissionState {
  return structuredClone(state);
}

/**
 * Mission Engine
 * Manages deterministic mission state updates
 */
export class MissionEngine {
  private currentState: MissionState;
  private initialState: MissionState;
  private config: MissionConfig;

  constructor(config: MissionConfig) {
    this.config = config;
    this.initialState = this.createInitialMissionState(config);
    this.currentState = cloneMissionState(this.initialState);
  }

  /**
   * Create initial mission state from configuration
   */
  private createInitialMissionState(config: MissionConfig): MissionState {
    const startTime = config.startTime ?? '1970-01-01T00:00:00.000Z';
    
    // Initialize UUV state
    const uuvState: UUVState = {
      position: { ...config.initialPosition },
      heading: config.initialHeading,
      velocity: { vx: 0, vy: 0 },
      forwardVelocity: 0,
      angularVelocity: 0,
    };

    // Initialize battery state
    const batteryState: BatteryState = {
      current: config.initialBattery,
      initial: config.initialBattery,
      consumptionRate: 0,
      warningThreshold: 20,
      criticalThreshold: 10,
      minimumForReturn: 30,
    };

    // Initialize oxygen state
    const oxygenState: OxygenState = {
      current: config.initialOxygen,
      initial: config.initialOxygen,
      consumptionRate: 0,
      baseRate: 0.1,
      motionRate: 0.05,
      warningThreshold: 20,
      criticalThreshold: 0,
      minimumForReturn: 30,
      minimumReached: config.initialOxygen,
    };

    return {
      missionId: config.missionId ?? createDeterministicMissionId(config.scenarioName, config.seed),
      scenarioName: config.scenarioName,
      seed: config.seed,
      language: config.language,
      startTime,
      elapsedTime: 0,
      
      phase: 'setup' as MissionPhase,
      commandMode: 'autonomous' as CommandMode,
      
      uuv: uuvState,
      
      battery: batteryState,
      oxygen: oxygenState,
      
      waterCurrent: { ...config.waterCurrent },
      visibility: config.visibility,
      
      safetyMargin: {
        nearestObstacleDistance: Infinity,
        minObstacleDistance: Infinity,
        safeMargin: 1.5,
        criticalDistance: 0.8,
        riskLevel: 'safe',
      },
      collisionCount: 0,
      
      currentAction: null,
      
      detections: [],
      confirmationQueue: [],
      confirmedTargets: [],
      rejectedTargets: [],
      
      events: [],
      
      trajectory: [{
        timestamp: 0,
        x: config.initialPosition.x,
        y: config.initialPosition.y,
        heading: config.initialHeading,
      }],
      
      pathLength: 0,
      manualInterventions: 0,
    };
  }

  /**
   * Get current mission state (read-only copy)
   */
  getState(): Readonly<MissionState> {
    return cloneMissionState(this.currentState);
  }

  /**
   * Reset mission to initial state
   */
  reset(): void {
    this.currentState = cloneMissionState(this.initialState);
  }

  /**
   * Step the mission forward by one timestep
   * 
   * @param action - Control action to apply (optional, defaults to zero)
   */
  step(action?: ControlAction): void {
    const dt = this.config.timestep;
    
    // Get control action (default to zero if not provided)
    const forwardVelocity = action?.forwardVelocity ?? 0;
    const angularVelocity = action?.angularVelocity ?? 0;
    
    // Update UUV pose using kinematic model
    const currentPose: UUVPose = {
      position: { ...this.currentState.uuv.position },
      heading: this.currentState.uuv.heading,
    };
    
    const newPose = updateUUVKinematics({
      pose: currentPose,
      forwardVelocity,
      angularVelocity,
      current: {
        x: this.currentState.waterCurrent.x,
        y: this.currentState.waterCurrent.y,
      },
      dt,
    });
    
    // Compute velocity for state
    // Position was integrated using the pre-step heading, so report the same
    // world-frame velocity that produced this displacement.
    const velocityX = forwardVelocity * Math.cos(currentPose.heading) + this.currentState.waterCurrent.x;
    const velocityY = forwardVelocity * Math.sin(currentPose.heading) + this.currentState.waterCurrent.y;
    
    // Calculate path length increment
    const dx = newPose.position.x - this.currentState.uuv.position.x;
    const dy = newPose.position.y - this.currentState.uuv.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Create new state (immutable update)
    const newElapsedTime = this.currentState.elapsedTime + dt;
    
    this.currentState = {
      ...this.currentState,
      elapsedTime: newElapsedTime,
      
      uuv: {
        position: { ...newPose.position },
        heading: newPose.heading,
        velocity: { vx: velocityX, vy: velocityY },
        forwardVelocity,
        angularVelocity,
      },
      
      currentAction: action ? {
        proposed: { ...action, timestamp: newElapsedTime },
        final: { ...action, timestamp: newElapsedTime },
        rejected: false,
      } : null,
      
      trajectory: [
        ...this.currentState.trajectory,
        {
          timestamp: newElapsedTime,
          x: newPose.position.x,
          y: newPose.position.y,
          heading: newPose.heading,
        },
      ],
      
      pathLength: this.currentState.pathLength + distance,
    };
  }

  /**
   * Get mission configuration
   */
  getConfig(): Readonly<MissionConfig> {
    return { ...this.config };
  }

  /**
   * Get current timestep
   */
  getTimestep(): number {
    return this.config.timestep;
  }
}
