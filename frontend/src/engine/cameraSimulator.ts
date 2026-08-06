/**
 * Synthetic Camera Simulator
 * Generates deterministic camera-like frames from synthetic scene objects
 */

import type {
  ScenarioConfig,
  UUVState,
  ObstacleConfig,
  TargetConfig,
  Position2D,
} from '../types';
import { SeededRNG } from '../utils/rng';

/**
 * Camera view configuration
 */
export interface CameraConfig {
  fieldOfView: number;        // Field of view in radians
  maxRange: number;           // Maximum detection range in meters
  resolutionX: number;        // Virtual resolution width
  resolutionY: number;        // Virtual resolution height
}

/**
 * Camera frame object representation
 */
export interface CameraObject {
  type: 'submerged_vehicle' | 'external_victim' | 'rock' | 'pipe' | 'unknown';
  relativePosition: Position2D;  // Position relative to camera (meters)
  size: number;                   // Apparent size in screen units
  color: string;                 // RGB color string (e.g., '#FF0000')
  opacity: number;               // Opacity (0.0-1.0)
  visible: boolean;              // Whether object is visible
}

/**
 * Synthetic camera frame
 */
export interface CameraFrame {
  timestamp: number;           // Frame timestamp (seconds)
  objects: CameraObject[];     // Visible objects
  visibility: number;          // Visibility factor (0.0-1.0)
  contrast: number;            // Contrast reduction factor (0.0-1.0)
  noiseLevel: number;         // Synthetic noise level (0.0-1.0)
}

/**
 * Default camera configuration
 */
const DEFAULT_CAMERA_CONFIG: CameraConfig = {
  fieldOfView: Math.PI / 3,    // 60 degrees field of view
  maxRange: 4.0,               // 4 meter detection range (from requirements R13)
  resolutionX: 800,
  resolutionY: 600,
};

/**
 * Color mappings for object types
 */
const OBJECT_COLORS: Record<string, string> = {
  submerged_vehicle: '#4682B4', // Steel blue
  external_victim: '#FF6347',   // Tomato red
  internal_victim: '#8B0000',   // Dark red (not visible)
  rock: '#696969',              // Dim gray
  pipe: '#A0522D',              // Sienna brown
  unknown: '#808080',           // Gray
};

/**
 * Size multipliers for object types
 */
const OBJECT_SIZE_MULTIPLIERS: Record<string, number> = {
  submerged_vehicle: 1.0,
  external_victim: 0.3,
  internal_victim: 0.0,         // Not visible
  rock: 0.5,
  pipe: 0.4,
  unknown: 0.3,
};

/**
 * Camera Simulator
 * Generates deterministic synthetic camera frames
 */
export class CameraSimulator {
  private config: CameraConfig;
  private seed: number;

  constructor(
    config: Partial<CameraConfig> = {},
    seed: number = 42
  ) {
    this.config = { ...DEFAULT_CAMERA_CONFIG, ...config };
    this.seed = seed;
  }

  /**
   * Generate camera frame from current scene state
   */
  generateFrame(
    timestamp: number,
    uuvState: UUVState,
    scenarioConfig: ScenarioConfig,
    obstacles: ObstacleConfig[],
    targets: TargetConfig[]
  ): CameraFrame {
    const { visibility } = scenarioConfig;
    const frameRng = new SeededRNG(this.seed);
    
    // Collect all visible scene objects
    const visibleObjects = this.collectVisibleObjects(
      uuvState,
      scenarioConfig,
      obstacles,
      targets,
      frameRng,
    );
    
    // Apply visibility effects
    const { objects, contrast, noiseLevel } = this.applyVisibilityEffects(
      visibleObjects,
      visibility
    );
    
    return {
      timestamp,
      objects,
      visibility,
      contrast,
      noiseLevel,
    };
  }

  /**
   * Collect objects visible to the camera
   */
  private collectVisibleObjects(
    uuvState: UUVState,
    scenarioConfig: ScenarioConfig,
    obstacles: ObstacleConfig[],
    targets: TargetConfig[],
    rng: SeededRNG,
  ): CameraObject[] {
    const { fieldOfView, maxRange } = this.config;
    const { visibility } = scenarioConfig;
    const cameraObjects: CameraObject[] = [];
    
    // Helper function to check if object is within FOV
    const isWithinFOV = (relativeX: number, relativeY: number, heading: number): boolean => {
      // Calculate distance and angle
      const distance = Math.sqrt(relativeX * relativeX + relativeY * relativeY);
      if (distance > maxRange || distance === 0) return false;

      // Transform the world-space delta into the UUV's forward/side frame.
      // The camera points along the UUV heading, not always along world +X.
      const forward = relativeX * Math.cos(heading) + relativeY * Math.sin(heading);
      const lateral = -relativeX * Math.sin(heading) + relativeY * Math.cos(heading);
      const angle = Math.atan2(lateral, forward);
      const halfFOV = fieldOfView / 2;
      
      // Check if angle is within field of view
      return Math.abs(angle) <= halfFOV;
    };
    
    // Process obstacles
    for (const obstacle of obstacles) {
      const relativeX = obstacle.position.x - uuvState.position.x;
      const relativeY = obstacle.position.y - uuvState.position.y;
      
      if (isWithinFOV(relativeX, relativeY, uuvState.heading)) {
        // Rock objects
        if (obstacle.type === 'rock') {
          const distance = Math.sqrt(relativeX * relativeX + relativeY * relativeY);
          const size = this.calculateObjectSize('rock', distance, rng);
          
          cameraObjects.push({
            type: 'rock',
            relativePosition: { x: relativeX, y: relativeY },
            size,
            color: OBJECT_COLORS.rock,
            opacity: 1.0,
            visible: visibility >= 0.35, // From requirements R13
          });
        }
        // Pipe objects
        else if (obstacle.type === 'pipe') {
          const distance = Math.sqrt(relativeX * relativeX + relativeY * relativeY);
          const size = this.calculateObjectSize('pipe', distance, rng);
          
          cameraObjects.push({
            type: 'pipe',
            relativePosition: { x: relativeX, y: relativeY },
            size,
            color: OBJECT_COLORS.pipe,
            opacity: Math.min(1.0, visibility),
            visible: visibility >= 0.35,
          });
        }
      }
    }
    
    // Process targets
    for (const target of targets) {
      const relativeX = target.position.x - uuvState.position.x;
      const relativeY = target.position.y - uuvState.position.y;
      
      if (isWithinFOV(relativeX, relativeY, uuvState.heading)) {
        const distance = Math.sqrt(relativeX * relativeX + relativeY * relativeY);
        
        // Handle different target types
        switch (target.type) {
          case 'vehicle':
            if (target.modality === 'camera' || target.modality === 'sonar') {
              const size = this.calculateObjectSize('submerged_vehicle', distance, rng);
              
              cameraObjects.push({
                type: 'submerged_vehicle',
                relativePosition: { x: relativeX, y: relativeY },
                size,
                color: OBJECT_COLORS.submerged_vehicle,
                opacity: Math.min(target.confidence, visibility),
                visible: visibility >= 0.35,
              });
            }
            break;
            
          case 'external_victim':
            if (target.modality === 'camera') {
              const size = this.calculateObjectSize('external_victim', distance, rng);
              
              cameraObjects.push({
                type: 'external_victim',
                relativePosition: { x: relativeX, y: relativeY },
                size,
                color: OBJECT_COLORS.external_victim,
                opacity: Math.min(target.confidence, visibility),
                visible: visibility >= 0.35,
              });
            }
            break;
            
          case 'internal_victim':
            // Internal victims are NOT visible through vehicle (from requirements R4)
            // They appear only as markers with zero opacity
            cameraObjects.push({
              type: 'unknown',
              relativePosition: { x: relativeX, y: relativeY },
              size: 0,
              color: OBJECT_COLORS.internal_victim,
              opacity: 0,
              visible: false,
            });
            break;
        }
      }
    }
    
    return cameraObjects;
  }

  /**
   * Calculate object size based on distance and type
   */
  private calculateObjectSize(
    baseType: string,
    distance: number,
    rng: SeededRNG,
  ): number {
    const baseSize = OBJECT_SIZE_MULTIPLIERS[baseType] || 0.3;
    const distanceFactor = Math.max(0.1, 1.0 / Math.max(distance, 0.1));
    
    // Add slight randomness for natural variation
    const randomVariation = rng.nextFloat(0.8, 1.2);
    
    return baseSize * distanceFactor * randomVariation;
  }

  /**
   * Apply visibility degradation effects
   */
  private applyVisibilityEffects(
    objects: CameraObject[],
    visibility: number
  ): {
    objects: CameraObject[];
    contrast: number;
    noiseLevel: number;
  } {
    const contrast = this.calculateContrast(visibility);
    const noiseLevel = this.calculateNoiseLevel(visibility);
    
    // Apply effects to each object
    const processedObjects = objects.map(obj => ({
      ...obj,
      opacity: obj.opacity * contrast,
      visible: obj.visible && visibility >= 0.35,
    }));
    
    return {
      objects: processedObjects,
      contrast,
      noiseLevel,
    };
  }

  /**
   * Calculate contrast reduction based on visibility
   */
  private calculateContrast(visibility: number): number {
    // Linear reduction: visibility 1.0 = full contrast, 0.0 = no contrast
    return Math.max(0.0, Math.min(1.0, visibility));
  }

  /**
   * Calculate synthetic noise level based on visibility
   */
  private calculateNoiseLevel(visibility: number): number {
    // Inverse relationship: lower visibility = higher noise
    return Math.max(0.0, Math.min(1.0, 1.0 - visibility));
  }

  /**
   * Get camera configuration
   */
  getConfig(): CameraConfig {
    return { ...this.config };
  }

  /**
   * Set camera configuration
   */
  setConfig(config: Partial<CameraConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get RNG seed for deterministic behavior
   */
  getSeed(): number {
    return this.seed;
  }
}
