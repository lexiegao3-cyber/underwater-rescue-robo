/**
 * Safety validation for autonomous and manual actions.
 *
 * Every command goes through this layer. It is intentionally deterministic and
 * conservative for the MVP; it does not replace a certified controller.
 */

import type {
  BatteryState,
  CommandMode,
  ControlAction,
  MissionBoundary,
  ObstacleConfig,
  OxygenState,
  Position2D,
} from '../types';
import { checkCollision } from './collision';
import type { Vector2D } from './potentialFieldPolicy';

export type SafetyFallback = 'none' | 'hold' | 'slow_mode' | 'manual_prompt' | 'return';

export interface SafetyLayerConfig {
  uuvRadius: number;
  safeObstacleMargin: number;
  criticalObstacleDistance: number;
  minimumBatteryReserve: number;
  minimumOxygenReserve: number;
  maxVelocity: number;
  maxAngularVelocity: number;
  maxVelocityRate: number;
  maxAngularVelocityRate: number;
}

export const DEFAULT_SAFETY_LAYER_CONFIG: SafetyLayerConfig = {
  uuvRadius: 0.5,
  safeObstacleMargin: 1.5,
  criticalObstacleDistance: 0.8,
  minimumBatteryReserve: 30,
  minimumOxygenReserve: 30,
  maxVelocity: 2,
  maxAngularVelocity: Math.PI / 2,
  maxVelocityRate: 2,
  maxAngularVelocityRate: Math.PI,
};

export interface SafetyInput {
  position: Position2D;
  heading: number;
  proposedAction: ControlAction;
  previousAction: ControlAction | null;
  obstacles: ObstacleConfig[];
  current: Vector2D;
  battery: BatteryState;
  oxygen: OxygenState;
  startPosition: Position2D;
  missionBoundary: MissionBoundary;
  activeCommands: CommandMode[];
  timestep: number;
}

export interface SafetyResult {
  proposedAction: ControlAction;
  finalAction: ControlAction;
  commandMode: CommandMode;
  rejected: boolean;
  warnings: string[];
  fallback: SafetyFallback;
  nearestObstacleDistance: number;
}

const COMMAND_PRIORITY: Record<CommandMode, number> = {
  autonomous: 0,
  return: 1,
  manual: 2,
  pause: 3,
};

export function resolveCommandPriority(commands: CommandMode[]): CommandMode {
  if (commands.length === 0) return 'autonomous';
  return [...commands].sort((a, b) => COMMAND_PRIORITY[b] - COMMAND_PRIORITY[a])[0];
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

function distance(a: Position2D, b: Position2D): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function obstacleBoundingRadius(obstacle: ObstacleConfig): number {
  if (obstacle.type === 'pipe') return Math.hypot(obstacle.width / 2, obstacle.height / 2);
  return obstacle.radius;
}

function predictedPosition(input: SafetyInput, action: ControlAction): Position2D {
  return {
    x: input.position.x
      + (action.forwardVelocity * Math.cos(input.heading) + input.current.x) * input.timestep,
    y: input.position.y
      + (action.forwardVelocity * Math.sin(input.heading) + input.current.y) * input.timestep,
  };
}

export class SafetyLayer {
  private readonly config: SafetyLayerConfig;

  constructor(config: Partial<SafetyLayerConfig> = {}) {
    this.config = { ...DEFAULT_SAFETY_LAYER_CONFIG, ...config };
  }

  validate(input: SafetyInput): SafetyResult {
    const proposedAction = { ...input.proposedAction };
    const commandMode = resolveCommandPriority(input.activeCommands);
    const warnings: string[] = [];

    if (commandMode === 'pause') {
      return this.result(proposedAction, this.zeroAction(proposedAction), commandMode, true, warnings, 'hold', input);
    }

    let action = this.applyActionLimits(input.proposedAction, input.previousAction, input.timestep);
    let rejected = action.forwardVelocity !== proposedAction.forwardVelocity
      || action.angularVelocity !== proposedAction.angularVelocity;
    let fallback: SafetyFallback = rejected ? 'slow_mode' : 'none';

    const nearestObstacleDistance = this.nearestObstacleDistance(input.position, input.obstacles);
    const predicted = predictedPosition(input, action);
    const predictedCollision = input.obstacles.some((obstacle) => checkCollision(
      { position: predicted, radius: this.config.uuvRadius },
      obstacle,
    ));

    if (nearestObstacleDistance < this.config.safeObstacleMargin) {
      warnings.push('obstacle_margin_warning');
    }
    if (predictedCollision || nearestObstacleDistance <= this.config.criticalObstacleDistance) {
      warnings.push('critical_obstacle_distance');
      action = this.zeroAction(proposedAction);
      rejected = true;
      fallback = 'hold';
    } else if (nearestObstacleDistance < this.config.safeObstacleMargin) {
      action = {
        ...action,
        forwardVelocity: action.forwardVelocity * 0.5,
      };
      rejected = true;
      fallback = 'slow_mode';
    }

    if (!this.isInsideBoundary(predicted, input.missionBoundary)) {
      warnings.push('mission_boundary_violation');
      action = this.zeroAction(proposedAction);
      rejected = true;
      fallback = 'hold';
    }

    const batteryReserve = (input.battery.current / Math.max(input.battery.initial, 1)) * 100;
    const oxygenReserve = (input.oxygen.current / Math.max(input.oxygen.initial, 1)) * 100;
    if (batteryReserve < this.config.minimumBatteryReserve) warnings.push('battery_return_reserve');
    if (oxygenReserve < this.config.minimumOxygenReserve) warnings.push('oxygen_return_reserve');

    const criticalBattery = batteryReserve <= input.battery.criticalThreshold;
    const criticalOxygen = oxygenReserve <= input.oxygen.criticalThreshold;
    if (criticalBattery || criticalOxygen) {
      warnings.push('critical_resource');
      action = this.zeroAction(proposedAction);
      rejected = true;
      fallback = 'return';
    } else if (batteryReserve < this.config.minimumBatteryReserve
      || oxygenReserve < this.config.minimumOxygenReserve) {
      fallback = fallback === 'none' ? 'manual_prompt' : fallback;
    }

    return this.result(proposedAction, action, commandMode, rejected, warnings, fallback, input, nearestObstacleDistance);
  }

  private applyActionLimits(
    action: ControlAction,
    previous: ControlAction | null,
    timestep: number,
  ): ControlAction {
    const previousForward = previous?.forwardVelocity ?? 0;
    const previousAngular = previous?.angularVelocity ?? 0;
    const maxForwardDelta = this.config.maxVelocityRate * timestep;
    const maxAngularDelta = this.config.maxAngularVelocityRate * timestep;

    const limitedForward = clamp(action.forwardVelocity, -this.config.maxVelocity, this.config.maxVelocity);
    const limitedAngular = clamp(action.angularVelocity, -this.config.maxAngularVelocity, this.config.maxAngularVelocity);

    return {
      ...action,
      forwardVelocity: clamp(limitedForward, previousForward - maxForwardDelta, previousForward + maxForwardDelta),
      angularVelocity: clamp(limitedAngular, previousAngular - maxAngularDelta, previousAngular + maxAngularDelta),
    };
  }

  private nearestObstacleDistance(position: Position2D, obstacles: ObstacleConfig[]): number {
    if (obstacles.length === 0) return Infinity;
    return Math.min(...obstacles.map((obstacle) =>
      distance(position, obstacle.position) - obstacleBoundingRadius(obstacle) - this.config.uuvRadius));
  }

  private isInsideBoundary(position: Position2D, boundary: MissionBoundary): boolean {
    return position.x >= boundary.minX
      && position.x <= boundary.maxX
      && position.y >= boundary.minY
      && position.y <= boundary.maxY;
  }

  private zeroAction(action: ControlAction): ControlAction {
    return { ...action, forwardVelocity: 0, angularVelocity: 0 };
  }

  private result(
    proposedAction: ControlAction,
    finalAction: ControlAction,
    commandMode: CommandMode,
    rejected: boolean,
    warnings: string[],
    fallback: SafetyFallback,
    input: SafetyInput,
    nearestObstacleDistance = this.nearestObstacleDistance(input.position, input.obstacles),
  ): SafetyResult {
    return {
      proposedAction,
      finalAction,
      commandMode,
      rejected,
      warnings,
      fallback,
      nearestObstacleDistance,
    };
  }
}

