/**
 * Deterministic forward-looking sonar simulator.
 *
 * Each beam is raycast against the static scene. Sonar does not use the
 * camera visibility value, so it remains available in low-visibility scenes.
 */

import type {
  ObstacleConfig,
  Position2D,
  TargetConfig,
  UUVState,
} from '../types';

export interface SonarConfig {
  fieldOfView: number;
  beamCount: number;
  maxRange: number;
}

export type SonarObjectType =
  | 'submerged_vehicle'
  | 'external_victim'
  | 'internal_victim'
  | 'rock'
  | 'pipe'
  | 'unknown_obstacle';

export interface SonarDetection {
  id: string;
  source: 'obstacle' | 'target';
  type: SonarObjectType;
  distance: number;
  position: Position2D;
}

export interface SonarBeam {
  index: number;
  relativeAngle: number;
  worldAngle: number;
  range: number;
  hit: SonarDetection | null;
}

export interface SonarFrame {
  timestamp: number;
  beams: SonarBeam[];
  detections: SonarDetection[];
  maxRange: number;
}

export const DEFAULT_SONAR_CONFIG: SonarConfig = {
  fieldOfView: (2 * Math.PI) / 3,
  beamCount: 32,
  maxRange: 8,
};

interface Ray {
  origin: Position2D;
  direction: Position2D;
}

const TARGET_RADII: Record<TargetConfig['type'], number> = {
  vehicle: 1.5,
  external_victim: 0.35,
  internal_victim: 0.35,
};

function subtract(a: Position2D, b: Position2D): Position2D {
  return { x: a.x - b.x, y: a.y - b.y };
}

function rotate(vector: Position2D, angle: number): Position2D {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: vector.x * cos - vector.y * sin,
    y: vector.x * sin + vector.y * cos,
  };
}

function rayCircleDistance(ray: Ray, center: Position2D, radius: number, maxRange: number): number | null {
  const offset = subtract(ray.origin, center);
  const b = 2 * (ray.direction.x * offset.x + ray.direction.y * offset.y);
  const c = offset.x * offset.x + offset.y * offset.y - radius * radius;
  const discriminant = b * b - 4 * c;

  if (discriminant < 0) return null;

  const root = Math.sqrt(discriminant);
  const first = (-b - root) / 2;
  const second = (-b + root) / 2;
  const distance = first >= 0 ? first : second;

  return distance >= 0 && distance <= maxRange ? distance : null;
}

function rayRectangleDistance(
  ray: Ray,
  center: Position2D,
  width: number,
  height: number,
  rotation: number,
  maxRange: number,
): number | null {
  const localOrigin = rotate(subtract(ray.origin, center), -rotation);
  const localDirection = rotate(ray.direction, -rotation);
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  let minimum = 0;
  let maximum = maxRange;

  const slabs = [
    { origin: localOrigin.x, direction: localDirection.x, minimum: -halfWidth, maximum: halfWidth },
    { origin: localOrigin.y, direction: localDirection.y, minimum: -halfHeight, maximum: halfHeight },
  ];

  for (const slab of slabs) {
    if (Math.abs(slab.direction) < 1e-12) {
      if (slab.origin < slab.minimum || slab.origin > slab.maximum) return null;
      continue;
    }

    let near = (slab.minimum - slab.origin) / slab.direction;
    let far = (slab.maximum - slab.origin) / slab.direction;
    if (near > far) [near, far] = [far, near];
    minimum = Math.max(minimum, near);
    maximum = Math.min(maximum, far);
    if (minimum > maximum) return null;
  }

  return minimum <= maxRange ? minimum : null;
}

function obstacleType(type: ObstacleConfig['type']): SonarObjectType {
  if (type === 'vehicle') return 'submerged_vehicle';
  if (type === 'unknown') return 'unknown_obstacle';
  return type;
}

function targetType(type: TargetConfig['type']): SonarObjectType {
  return type === 'vehicle' ? 'submerged_vehicle' : type;
}

export class SonarSimulator {
  private config: SonarConfig;

  constructor(config: Partial<SonarConfig> = {}) {
    this.config = { ...DEFAULT_SONAR_CONFIG, ...config };
    if (this.config.beamCount < 1 || !Number.isInteger(this.config.beamCount)) {
      throw new Error('beamCount must be a positive integer');
    }
    if (this.config.maxRange <= 0) throw new Error('maxRange must be positive');
    if (this.config.fieldOfView <= 0 || this.config.fieldOfView > 2 * Math.PI) {
      throw new Error('fieldOfView must be in the range (0, 2π]');
    }
  }

  generateFrame(
    timestamp: number,
    uuvState: UUVState,
    obstacles: ObstacleConfig[],
    targets: TargetConfig[],
  ): SonarFrame {
    const halfFov = this.config.fieldOfView / 2;
    const detectionsById = new Map<string, SonarDetection>();
    const beams: SonarBeam[] = [];

    for (let index = 0; index < this.config.beamCount; index += 1) {
      const fraction = this.config.beamCount === 1 ? 0.5 : index / (this.config.beamCount - 1);
      const relativeAngle = -halfFov + fraction * this.config.fieldOfView;
      const worldAngle = uuvState.heading + relativeAngle;
      const ray: Ray = {
        origin: uuvState.position,
        direction: { x: Math.cos(worldAngle), y: Math.sin(worldAngle) },
      };

      const candidates = [
        ...obstacles.map((obstacle) => this.intersectObstacle(ray, obstacle)),
        ...targets.map((target) => this.intersectTarget(ray, target)),
      ].filter((candidate): candidate is SonarDetection => candidate !== null);

      candidates.sort((a, b) => a.distance - b.distance);
      const hit = candidates[0] ?? null;
      if (hit) {
        const previous = detectionsById.get(hit.id);
        if (!previous || hit.distance < previous.distance) detectionsById.set(hit.id, hit);
      }

      beams.push({
        index,
        relativeAngle,
        worldAngle,
        range: hit?.distance ?? this.config.maxRange,
        hit,
      });
    }

    return {
      timestamp,
      beams,
      detections: [...detectionsById.values()].sort((a, b) => a.distance - b.distance),
      maxRange: this.config.maxRange,
    };
  }

  private intersectObstacle(ray: Ray, obstacle: ObstacleConfig): SonarDetection | null {
    const distance = obstacle.type === 'pipe'
      ? rayRectangleDistance(ray, obstacle.position, obstacle.width, obstacle.height, obstacle.rotation, this.config.maxRange)
      : rayCircleDistance(ray, obstacle.position, obstacle.radius, this.config.maxRange);

    return distance === null ? null : {
      id: obstacle.id,
      source: 'obstacle',
      type: obstacleType(obstacle.type),
      distance,
      position: { ...obstacle.position },
    };
  }

  private intersectTarget(ray: Ray, target: TargetConfig): SonarDetection | null {
    const distance = rayCircleDistance(
      ray,
      target.position,
      TARGET_RADII[target.type],
      this.config.maxRange,
    );

    return distance === null ? null : {
      id: target.id,
      source: 'target',
      type: targetType(target.type),
      distance,
      position: { ...target.position },
    };
  }

  getConfig(): SonarConfig {
    return { ...this.config };
  }
}
