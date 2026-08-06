/**
 * MFI-inspired, deterministic potential-field navigation baseline.
 *
 * This is a transparent scripted policy for the MVP. It is not the learned
 * MFI-PP-CNN-TD3/TD3-IMP research model.
 */

import type { ControlAction, ObstacleConfig, Position2D } from '../types';

export interface Vector2D {
  x: number;
  y: number;
}

export interface PotentialFieldConfig {
  attractionGain: number;
  repulsionGain: number;
  obstacleInfluenceDistance: number;
  currentCompensationGain: number;
  maxVelocity: number;
  maxAngularVelocity: number;
  turnGain: number;
}

export interface PolicyInput {
  position: Position2D;
  heading: number;
  targetPosition: Position2D | null;
  obstacles: ObstacleConfig[];
  current: Vector2D;
  timestamp: number;
}

export const DEFAULT_POTENTIAL_FIELD_CONFIG: PotentialFieldConfig = {
  attractionGain: 1,
  repulsionGain: 4,
  obstacleInfluenceDistance: 4,
  currentCompensationGain: 1,
  maxVelocity: 2,
  maxAngularVelocity: Math.PI / 2,
  turnGain: 2,
};

function magnitude(vector: Vector2D): number {
  return Math.hypot(vector.x, vector.y);
}

function normalize(vector: Vector2D): Vector2D {
  const length = magnitude(vector);
  return length < 1e-12 ? { x: 0, y: 0 } : { x: vector.x / length, y: vector.y / length };
}

function subtract(a: Position2D, b: Position2D): Vector2D {
  return { x: a.x - b.x, y: a.y - b.y };
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

function wrapAngle(angle: number): number {
  let result = angle % (2 * Math.PI);
  if (result > Math.PI) result -= 2 * Math.PI;
  if (result < -Math.PI) result += 2 * Math.PI;
  return result;
}

function obstacleRadius(obstacle: ObstacleConfig): number {
  if (obstacle.type === 'pipe') return Math.hypot(obstacle.width / 2, obstacle.height / 2);
  return obstacle.radius;
}

export class PotentialFieldPolicy {
  private readonly config: PotentialFieldConfig;

  constructor(config: Partial<PotentialFieldConfig> = {}) {
    this.config = { ...DEFAULT_POTENTIAL_FIELD_CONFIG, ...config };
  }

  calculateAttraction(position: Position2D, targetPosition: Position2D | null): Vector2D {
    if (!targetPosition) return { x: 0, y: 0 };
    const direction = subtract(targetPosition, position);
    return {
      x: direction.x * this.config.attractionGain,
      y: direction.y * this.config.attractionGain,
    };
  }

  calculateRepulsion(position: Position2D, obstacles: ObstacleConfig[]): Vector2D {
    return obstacles.reduce<Vector2D>((total, obstacle) => {
      const offset = subtract(position, obstacle.position);
      const centerDistance = magnitude(offset);
      const clearance = centerDistance - obstacleRadius(obstacle);

      if (clearance >= this.config.obstacleInfluenceDistance) return total;

      const safeDistance = Math.max(clearance, 0.05);
      const direction = normalize(offset);
      const strength = this.config.repulsionGain
        * (1 / safeDistance - 1 / this.config.obstacleInfluenceDistance)
        / (safeDistance * safeDistance);

      return {
        x: total.x + direction.x * strength,
        y: total.y + direction.y * strength,
      };
    }, { x: 0, y: 0 });
  }

  calculateDesiredVelocity(input: PolicyInput): Vector2D {
    const attraction = this.calculateAttraction(input.position, input.targetPosition);
    const repulsion = this.calculateRepulsion(input.position, input.obstacles);

    return {
      x: attraction.x + repulsion.x - input.current.x * this.config.currentCompensationGain,
      y: attraction.y + repulsion.y - input.current.y * this.config.currentCompensationGain,
    };
  }

  getAction(input: PolicyInput): ControlAction {
    const desired = this.calculateDesiredVelocity(input);
    const speed = magnitude(desired);
    if (speed < 1e-12) {
      return { forwardVelocity: 0, angularVelocity: 0, timestamp: input.timestamp };
    }

    const desiredHeading = Math.atan2(desired.y, desired.x);
    const headingError = wrapAngle(desiredHeading - input.heading);
    const forwardVelocity = clamp(
      speed * Math.cos(headingError),
      -this.config.maxVelocity,
      this.config.maxVelocity,
    );
    const angularVelocity = clamp(
      headingError * this.config.turnGain,
      -this.config.maxAngularVelocity,
      this.config.maxAngularVelocity,
    );

    return { forwardVelocity, angularVelocity, timestamp: input.timestamp };
  }

  getConfig(): PotentialFieldConfig {
    return { ...this.config };
  }
}

