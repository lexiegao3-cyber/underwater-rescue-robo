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
    this.currentState = JSON.parse(JSON.stringify(this.initialState)); // Deep copy
  }

  /**
   * Create initial mission state from configuration
   */
  private createInitialMissionState(config: MissionConfig): MissionState {
    const startTime = new Date().toISOString();
    
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
      missionId: crypto.randomUUID(),
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
    return JSON.parse(JSON.stringify(this.currentState));
  }

  /**
   * Reset mission to initial state
   */
  reset(): void {
    this.currentState = JSON.parse(JSON.stringify(this.initialState));
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
    const velocityX = forwardVelocity * Math.cos(newPose.heading) + this.currentState.waterCurrent.x;
    const velocityY = forwardVelocity * Math.sin(newPose.heading) + this.currentState.waterCurrent.y;
    
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
