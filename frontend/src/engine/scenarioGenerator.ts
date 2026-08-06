/**
 * Seeded Scenario Generator
 * Generates deterministic, reproducible scenario configurations
 */

import type {
  ScenarioConfig,
  ScenarioName,
  Difficulty,
  ObstacleConfig,
  TargetConfig,
  VehicleConfig,
  MissionBoundary,
  Position2D,
} from '../types';
import { SeededRNG } from '../utils/rng';

/**
 * Scenario template parameters
 * Define base parameters for each scenario type
 */
interface ScenarioTemplate {
  visibility: number;
  initialOxygen: number;
  waterCurrentMagnitude: number;
  obstacleDensityMultiplier: number;
}

/**
 * Difficulty parameters
 * Define modifiers for each difficulty level
 */
interface DifficultyParams {
  obstacleDensity: number;      // Multiplier for obstacle count
  targetDistance: number;        // Multiplier for target distance from start
  currentMultiplier: number;     // Multiplier for water current magnitude
}

/**
 * Get scenario template parameters
 */
function getScenarioTemplate(scenarioName: ScenarioName): ScenarioTemplate {
  const templates: Record<ScenarioName, ScenarioTemplate> = {
    normal: {
      visibility: 1.0,
      initialOxygen: 100,
      waterCurrentMagnitude: 0.0,
      obstacleDensityMultiplier: 1.0,
    },
    low_visibility: {
      visibility: 0.35,
      initialOxygen: 100,
      waterCurrentMagnitude: 0.1,
      obstacleDensityMultiplier: 1.3,
    },
    low_oxygen: {
      visibility: 1.0,
      initialOxygen: 25,
      waterCurrentMagnitude: 0.1,
      obstacleDensityMultiplier: 1.0,
    },
  };

  return templates[scenarioName];
}

/**
 * Get difficulty parameters
 */
function getDifficultyParams(difficulty: Difficulty): DifficultyParams {
  const params: Record<Difficulty, DifficultyParams> = {
    easy: {
      obstacleDensity: 0.7,
      targetDistance: 0.7,
      currentMultiplier: 0.5,
    },
    standard: {
      obstacleDensity: 1.0,
      targetDistance: 1.0,
      currentMultiplier: 1.0,
    },
    hard: {
      obstacleDensity: 1.3,
      targetDistance: 1.3,
      currentMultiplier: 1.5,
    },
  };

  return params[difficulty];
}

/**
 * Generate mission boundary
 */
function generateMissionBoundary(): MissionBoundary {
  // Standard 100m x 100m boundary for MVP
  return {
    minX: 0,
    maxX: 100,
    minY: 0,
    maxY: 100,
  };
}

/**
 * Generate starting position
 */
function generateStartingPosition(
  rng: SeededRNG,
  boundary: MissionBoundary
): Position2D {
  // Start in lower-left quadrant for consistency
  const x = rng.nextFloat(boundary.minX + 5, boundary.maxX * 0.3);
  const y = rng.nextFloat(boundary.minY + 5, boundary.maxY * 0.3);
  
  return { x, y };
}

/**
 * Generate target position
 */
function generateTargetPosition(
  rng: SeededRNG,
  startPosition: Position2D,
  boundary: MissionBoundary,
  distanceMultiplier: number
): Position2D {
  // Base distance range (20-40 meters from start)
  const baseMinDistance = 20;
  const baseMaxDistance = 40;
  
  const minDistance = baseMinDistance * distanceMultiplier;
  const maxDistance = baseMaxDistance * distanceMultiplier;
  
  // Generate angle and distance
  const angle = rng.nextFloat(0, 2 * Math.PI);
  const distance = rng.nextFloat(minDistance, maxDistance);
  
  // Calculate target position
  let x = startPosition.x + distance * Math.cos(angle);
  let y = startPosition.y + distance * Math.sin(angle);
  
  // Clamp to boundary with margin
  x = Math.max(boundary.minX + 5, Math.min(boundary.maxX - 5, x));
  y = Math.max(boundary.minY + 5, Math.min(boundary.maxY - 5, y));
  
  return { x, y };
}

/**
 * Generate vehicle configuration
 */
function generateVehicleConfig(
  rng: SeededRNG,
  startPosition: Position2D
): VehicleConfig {
  // Generate initial heading (slightly randomized from East)
  const headingVariation = rng.nextFloat(-Math.PI / 6, Math.PI / 6);
  
  return {
    initialPose: {
      position: { ...startPosition },
      heading: headingVariation, // Approximately East with variation
    },
    radius: 0.5, // 0.5 meter radius for collision detection
    maxVelocity: 2.0, // 2 m/s maximum forward velocity
    maxAngularVelocity: Math.PI / 2, // π/2 rad/s maximum angular velocity (90 deg/s)
  };
}

/**
 * Generate obstacles based on density
 */
function generateObstacles(
  rng: SeededRNG,
  boundary: MissionBoundary,
  startPosition: Position2D,
  targetPosition: Position2D,
  densityMultiplier: number
): ObstacleConfig[] {
  const obstacles: ObstacleConfig[] = [];
  
  // Base obstacle count
  const baseRockCount = 4;
  const basePipeCount = 2;
  
  const rockCount = Math.floor(baseRockCount * densityMultiplier);
  const pipeCount = Math.floor(basePipeCount * densityMultiplier);
  
  // Generate rocks (circular obstacles)
  for (let i = 0; i < rockCount; i++) {
    const position = generateSafeObstaclePosition(
      rng,
      boundary,
      startPosition,
      targetPosition,
      obstacles,
      5.0 // Minimum distance from start/target
    );
    
    obstacles.push({
      id: `rock-${i}`,
      type: 'rock',
      position,
      radius: rng.nextFloat(0.5, 2.0), // 0.5-2.0 meter radius
    });
  }
  
  // Generate pipes (rectangular obstacles)
  for (let i = 0; i < pipeCount; i++) {
    const position = generateSafeObstaclePosition(
      rng,
      boundary,
      startPosition,
      targetPosition,
      obstacles,
      5.0
    );
    
    obstacles.push({
      id: `pipe-${i}`,
      type: 'pipe',
      position,
      width: rng.nextFloat(0.3, 0.6), // 0.3-0.6 meter width
      height: rng.nextFloat(2.0, 5.0), // 2.0-5.0 meter height
      rotation: rng.nextFloat(0, 2 * Math.PI), // Random rotation
    });
  }
  
  return obstacles;
}

/**
 * Generate safe obstacle position
 * Avoids placing obstacles too close to start, target, or other obstacles
 */
function generateSafeObstaclePosition(
  rng: SeededRNG,
  boundary: MissionBoundary,
  startPosition: Position2D,
  targetPosition: Position2D,
  existingObstacles: ObstacleConfig[],
  minDistance: number
): Position2D {
  const maxAttempts = 50;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const x = rng.nextFloat(boundary.minX + 5, boundary.maxX - 5);
    const y = rng.nextFloat(boundary.minY + 5, boundary.maxY - 5);
    const position = { x, y };
    
    // Check distance from start
    const distToStart = distance(position, startPosition);
    if (distToStart < minDistance) continue;
    
    // Check distance from target
    const distToTarget = distance(position, targetPosition);
    if (distToTarget < minDistance) continue;
    
    // Check distance from other obstacles
    let tooClose = false;
    for (const obstacle of existingObstacles) {
      const dist = distance(position, obstacle.position);
      if (dist < 3.0) { // Minimum 3 meters between obstacles
        tooClose = true;
        break;
      }
    }
    
    if (!tooClose) {
      return position;
    }
  }
  
  // Fallback: return position even if not ideal
  return {
    x: rng.nextFloat(boundary.minX + 10, boundary.maxX - 10),
    y: rng.nextFloat(boundary.minY + 10, boundary.maxY - 10),
  };
}

/**
 * Calculate Euclidean distance between two positions
 */
function distance(p1: Position2D, p2: Position2D): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Generate targets (vehicle and victims)
 */
function generateTargets(
  rng: SeededRNG,
  targetPosition: Position2D
): TargetConfig[] {
  const targets: TargetConfig[] = [];
  
  // Generate submerged vehicle at target position
  targets.push({
    id: 'vehicle-0',
    type: 'vehicle',
    position: { ...targetPosition },
    confidence: 0.8,
    modality: 'sonar',
  });
  
  // Generate 1-2 external victims near vehicle
  const externalVictimCount = rng.nextInt(1, 2);
  for (let i = 0; i < externalVictimCount; i++) {
    const offset = {
      x: rng.nextFloat(-3, 3),
      y: rng.nextFloat(-3, 3),
    };
    
    targets.push({
      id: `external-victim-${i}`,
      type: 'external_victim',
      position: {
        x: targetPosition.x + offset.x,
        y: targetPosition.y + offset.y,
      },
      confidence: rng.nextFloat(0.6, 0.9),
      modality: rng.nextBoolean(0.7) ? 'camera' : 'sonar',
    });
  }
  
  // Generate 1 internal victim (inside vehicle, sonar/marker only)
  targets.push({
    id: 'internal-victim-0',
    type: 'internal_victim',
    position: { ...targetPosition }, // Same position as vehicle
    confidence: 0.5,
    modality: 'marker', // Internal victims detected via marker
  });
  
  return targets;
}

/**
 * Generate deterministic scenario configuration
 * 
 * @param seed - Random seed for reproducibility
 * @param scenarioName - Scenario name (normal, low_visibility, low_oxygen)
 * @param difficulty - Difficulty level (easy, standard, hard)
 * @returns Complete scenario configuration
 */
export function generateScenario(
  seed: number,
  scenarioName: ScenarioName,
  difficulty: Difficulty
): ScenarioConfig {
  // Create seeded RNG
  const rng = new SeededRNG(seed);
  
  // Get template and difficulty parameters
  const template = getScenarioTemplate(scenarioName);
  const difficultyParams = getDifficultyParams(difficulty);
  
  // Generate mission boundary
  const missionBoundary = generateMissionBoundary();
  
  // Generate starting position
  const startingPosition = generateStartingPosition(rng, missionBoundary);
  
  // Generate target position
  const targetPosition = generateTargetPosition(
    rng,
    startingPosition,
    missionBoundary,
    difficultyParams.targetDistance
  );
  
  // Generate obstacles
  const obstacles = generateObstacles(
    rng,
    missionBoundary,
    startingPosition,
    targetPosition,
    template.obstacleDensityMultiplier * difficultyParams.obstacleDensity
  );
  
  // Generate targets
  const targets = generateTargets(rng, targetPosition);
  
  // Generate vehicle configuration
  const vehicleConfig = generateVehicleConfig(rng, startingPosition);
  
  // Calculate water current direction and magnitude
  const currentDirection = rng.nextFloat(0, 2 * Math.PI);
  const currentMagnitude =
    template.waterCurrentMagnitude * difficultyParams.currentMultiplier;
  
  // Return complete scenario configuration
  return {
    scenarioName,
    difficulty,
    seed,
    
    visibility: template.visibility,
    
    waterCurrent: {
      magnitude: currentMagnitude,
      direction: currentDirection,
    },
    
    missionBoundary,
    startingPosition,
    targetPosition,
    
    obstacles,
    targets,
    
    vehicleConfig,
    
    initialBattery: 100, // Always start with full battery
    initialOxygen: template.initialOxygen,
    
    timestep: 0.1, // 100ms timestep for simulation
  };
}
