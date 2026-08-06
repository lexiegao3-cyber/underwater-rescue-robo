/**
 * TypeScript type definitions
 * Contains types for mission state, scenarios, UUV state, and configurations
 */

// ============================================================================
// Mission Phase
// ============================================================================

/**
 * Mission phase enum
 * Represents the current phase of the mission workflow
 */
export type MissionPhase =
  | 'setup'                 // Initial configuration before mission start
  | 'searching'             // Actively searching for targets
  | 'vehicle_found'         // Submerged vehicle detected
  | 'target_pending'        // Target detected, awaiting human confirmation
  | 'target_confirmed'      // Target confirmed by operator
  | 'approaching'           // Navigating toward confirmed target
  | 'holding'               // Holding position near target
  | 'manual'                // Manual control mode active
  | 'returning'             // Returning to start position
  | 'return_failed'         // Return path computation failed
  | 'completed'             // Mission completed successfully
  | 'aborted';              // Mission aborted by operator or system

// ============================================================================
// Language and UI
// ============================================================================

/**
 * Supported languages
 */
export type Language = 'en' | 'zh-CN';

/**
 * Event severity levels
 */
export type EventSeverity = 'info' | 'warning' | 'critical';

/**
 * Command mode priority
 * pause > manual > return > autonomous
 */
export type CommandMode = 'pause' | 'manual' | 'return' | 'autonomous';

// ============================================================================
// UUV State
// ============================================================================

/**
 * 2D position (meters)
 */
export interface Position2D {
  x: number;  // X position in meters
  y: number;  // Y position in meters
}

/**
 * 2D velocity (meters/second)
 */
export interface Velocity2D {
  vx: number;  // X velocity in m/s
  vy: number;  // Y velocity in m/s
}

/**
 * UUV kinematic state
 * Simplified 2D motion model (X, Y, heading)
 */
export interface UUVState {
  position: Position2D;        // Current position (meters)
  heading: number;             // Heading angle (radians, 0 = East, π/2 = North)
  velocity: Velocity2D;        // Current velocity (m/s)
  forwardVelocity: number;     // Forward velocity command (m/s)
  angularVelocity: number;     // Angular velocity command (rad/s)
}

// ============================================================================
// Battery State
// ============================================================================

/**
 * Battery state and consumption tracking
 */
export interface BatteryState {
  current: number;              // Current battery level (percent, 0-100)
  initial: number;              // Initial battery level (percent)
  consumptionRate: number;      // Current consumption rate (percent/second)
  warningThreshold: number;     // Warning threshold (percent)
  criticalThreshold: number;    // Critical threshold (percent)
  minimumForReturn: number;     // Minimum reserve for return (percent, default 30)
}

// ============================================================================
// Oxygen State
// ============================================================================

/**
 * Oxygen resource simulation state
 * VIRTUAL RESOURCE SIMULATION ONLY - not real oxygen delivery
 */
export interface OxygenState {
  current: number;              // Current oxygen level (units)
  initial: number;              // Initial oxygen level (units)
  consumptionRate: number;      // Current consumption rate (units/second)
  baseRate: number;             // Base consumption rate (units/second)
  motionRate: number;           // Motion-dependent rate (units/second per m/s)
  warningThreshold: number;     // Warning threshold (percent of initial, default 20%)
  criticalThreshold: number;    // Critical threshold (percent of initial, default 0%)
  minimumForReturn: number;     // Minimum reserve for return (percent, default 30%)
  minimumReached: number;       // Minimum level reached during mission (units)
}

// ============================================================================
// Control Action
// ============================================================================

/**
 * Control action for UUV motion
 */
export interface ControlAction {
  forwardVelocity: number;      // Forward velocity command (m/s)
  angularVelocity: number;      // Angular velocity command (rad/s)
  timestamp: number;            // Action timestamp (seconds)
}

/**
 * Action pair for transparency
 * Shows proposed action and final safety-validated action
 */
export interface ActionPair {
  proposed: ControlAction;      // Proposed action from policy or manual control
  final: ControlAction;         // Final action after safety layer validation
  rejected: boolean;            // True if action was rejected/modified by safety layer
  rejectionReason?: string;     // Reason for rejection (if any)
}

// ============================================================================
// Target Detection
// ============================================================================

/**
 * Detected object types
 */
export type ObjectType =
  | 'submerged_vehicle'
  | 'external_victim'
  | 'internal_victim'
  | 'rock'
  | 'pipe'
  | 'unknown_obstacle';

/**
 * Sensor modality source
 */
export type SensorModality = 'camera' | 'sonar' | 'marker';

/**
 * Target or obstacle detection
 */
export interface TargetDetection {
  id: string;                   // Unique detection ID
  type: ObjectType;             // Object type classification
  position: Position2D;         // Approximate position (meters)
  confidence: number;           // Detection confidence (0.0-1.0)
  modality: SensorModality;     // Source sensor modality
  timestamp: number;            // Detection timestamp (seconds)
  confirmed?: boolean;          // True if confirmed by operator
  rejected?: boolean;           // True if rejected by operator
}

/**
 * Target confirmation entry for export
 */
export interface TargetConfirmation {
  targetId: string;
  type: 'external_victim' | 'internal_victim' | 'vehicle';
  confirmed: boolean;
  timestamp: string;            // ISO 8601 timestamp
}

// ============================================================================
// Mission Event
// ============================================================================

/**
 * Mission event for logging
 */
export interface MissionEvent {
  timestamp: number;            // Event timestamp (seconds from mission start)
  type: string;                 // Event type (e.g., 'collision', 'target_detected', 'warning')
  severity: EventSeverity;      // Severity level
  messageKey: string;           // I18n message key for display
  relatedTargetId?: string;     // Related target ID (if applicable)
  relatedObstacleId?: string;   // Related obstacle ID (if applicable)
}

/**
 * Mission event for export (ISO timestamps)
 */
export interface ExportMissionEvent {
  timestamp: number;            // Event timestamp (seconds from mission start)
  type: string;
  severity: EventSeverity;
  messageKey: string;
  relatedTargetId: string | null;
  relatedObstacleId: string | null;
}

// ============================================================================
// Water Current
// ============================================================================

/**
 * Water current disturbance model
 */
export interface WaterCurrent {
  x: number;                    // Current X component (m/s)
  y: number;                    // Current Y component (m/s)
  magnitude: number;            // Current magnitude (m/s)
  type: 'constant' | 'sinusoidal';  // Current type
  // Sinusoidal parameters (if applicable)
  amplitudeX?: number;
  amplitudeY?: number;
  omegaX?: number;              // Angular frequency X (rad/s)
  omegaY?: number;              // Angular frequency Y (rad/s)
  phaseX?: number;              // Phase offset X (radians)
  phaseY?: number;              // Phase offset Y (radians)
}

// ============================================================================
// Safety Margin
// ============================================================================

/**
 * Safety margin and obstacle distance tracking
 */
export interface SafetyMargin {
  nearestObstacleDistance: number;    // Distance to nearest obstacle (meters)
  minObstacleDistance: number;        // Minimum distance reached during mission (meters)
  safeMargin: number;                 // Safe obstacle margin threshold (default 1.5m)
  criticalDistance: number;           // Critical obstacle distance (default 0.8m)
  riskLevel: 'safe' | 'warning' | 'critical';  // Current risk level
}

// ============================================================================
// Mission State
// ============================================================================

/**
 * Complete mission state
 * Represents the full state of a running mission
 */
export interface MissionState {
  // Mission metadata
  missionId: string;                  // UUID
  scenarioName: string;               // Scenario name (normal, low_visibility, low_oxygen)
  seed: number;                       // Random seed for reproducibility
  language: Language;                 // Selected language (immutable during mission)
  startTime: string;                  // ISO 8601 timestamp
  elapsedTime: number;                // Elapsed mission time (seconds)
  
  // Mission phase and command
  phase: MissionPhase;                // Current mission phase
  commandMode: CommandMode;           // Current command mode
  
  // UUV state
  uuv: UUVState;                      // UUV kinematic state
  
  // Resources
  battery: BatteryState;              // Battery state
  oxygen: OxygenState;                // Oxygen simulation state
  
  // Environment
  waterCurrent: WaterCurrent;         // Water current disturbance
  visibility: number;                 // Visibility factor (0.0-1.0)
  
  // Safety
  safetyMargin: SafetyMargin;         // Safety margin and obstacle distance
  collisionCount: number;             // Number of collisions
  
  // Actions
  currentAction: ActionPair | null;   // Current action pair (proposed/final)
  
  // Detections and targets
  detections: TargetDetection[];      // All current detections
  confirmationQueue: TargetDetection[]; // Queue of targets awaiting confirmation
  confirmedTargets: TargetDetection[]; // Confirmed targets
  rejectedTargets: TargetDetection[]; // Rejected targets
  
  // Events
  events: MissionEvent[];             // Mission event log
  
  // Trajectory
  trajectory: Array<{
    timestamp: number;
    x: number;
    y: number;
    heading: number;
  }>;
  
  // Metrics
  pathLength: number;                 // Total path length (meters)
  manualInterventions: number;        // Count of manual interventions
}
