import { describe, expect, it } from 'vitest';
import { SafetyLayer, resolveCommandPriority } from './safetyLayer';
import type { BatteryState, ControlAction, OxygenState } from '../types';

const boundary = { minX: 0, maxX: 20, minY: 0, maxY: 20 };
const battery: BatteryState = {
  current: 100,
  initial: 100,
  consumptionRate: 0,
  warningThreshold: 20,
  criticalThreshold: 10,
  minimumForReturn: 30,
};
const oxygen: OxygenState = {
  current: 100,
  initial: 100,
  consumptionRate: 0,
  baseRate: 0.1,
  motionRate: 0.05,
  warningThreshold: 20,
  criticalThreshold: 0,
  minimumForReturn: 30,
  minimumReached: 100,
};
const action: ControlAction = { forwardVelocity: 1, angularVelocity: 0, timestamp: 1 };

function input(overrides: Partial<Parameters<SafetyLayer['validate']>[0]> = {}) {
  return {
    position: { x: 5, y: 5 },
    heading: 0,
    proposedAction: action,
    previousAction: null,
    obstacles: [],
    current: { x: 0, y: 0 },
    battery,
    oxygen,
    startPosition: { x: 1, y: 1 },
    missionBoundary: boundary,
    activeCommands: ['autonomous' as const],
    timestep: 0.1,
    ...overrides,
  };
}

describe('command priority', () => {
  it('resolves pause > manual > return > autonomous', () => {
    expect(resolveCommandPriority(['autonomous', 'return'])).toBe('return');
    expect(resolveCommandPriority(['return', 'manual'])).toBe('manual');
    expect(resolveCommandPriority(['manual', 'pause'])).toBe('pause');
  });
});

describe('SafetyLayer', () => {
  it('clips actuator limits and action-rate changes', () => {
    const safety = new SafetyLayer({ maxVelocity: 2, maxAngularVelocity: 1, maxVelocityRate: 1, maxAngularVelocityRate: 2 });
    const result = safety.validate(input({
      proposedAction: { forwardVelocity: 10, angularVelocity: 10, timestamp: 1 },
      previousAction: { forwardVelocity: 0, angularVelocity: 0, timestamp: 0 },
    }));

    expect(result.finalAction.forwardVelocity).toBeCloseTo(0.1);
    expect(result.finalAction.angularVelocity).toBeCloseTo(0.2);
    expect(result.rejected).toBe(true);
  });

  it('holds before a critical obstacle distance', () => {
    const safety = new SafetyLayer();
    const result = safety.validate(input({
      obstacles: [{ id: 'rock-1', type: 'rock', position: { x: 6, y: 5 }, radius: 0.5 }],
    }));

    expect(result.finalAction.forwardVelocity).toBe(0);
    expect(result.fallback).toBe('hold');
    expect(result.warnings).toContain('critical_obstacle_distance');
  });

  it('warns and slows inside the safe obstacle margin', () => {
    const safety = new SafetyLayer({ maxVelocityRate: 20 });
    const result = safety.validate(input({
      obstacles: [{ id: 'rock-1', type: 'rock', position: { x: 7.1, y: 5 }, radius: 0.5 }],
    }));

    expect(result.nearestObstacleDistance).toBeCloseTo(1.1);
    expect(result.finalAction.forwardVelocity).toBeCloseTo(0.5);
    expect(result.fallback).toBe('slow_mode');
  });

  it('holds when the predicted position leaves the geofence', () => {
    const safety = new SafetyLayer({ maxVelocityRate: 20 });
    const result = safety.validate(input({
      position: { x: 19.9, y: 5 },
      proposedAction: { forwardVelocity: 2, angularVelocity: 0, timestamp: 1 },
    }));

    expect(result.finalAction.forwardVelocity).toBe(0);
    expect(result.warnings).toContain('mission_boundary_violation');
  });

  it('requests manual prompt when resources are below return reserve', () => {
    const safety = new SafetyLayer({ maxVelocityRate: 20 });
    const result = safety.validate(input({
      battery: { ...battery, current: 20 },
      oxygen: { ...oxygen, current: 20 },
    }));

    expect(result.warnings).toContain('battery_return_reserve');
    expect(result.warnings).toContain('oxygen_return_reserve');
    expect(result.fallback).toBe('manual_prompt');
  });

  it('returns when a resource reaches its critical threshold', () => {
    const safety = new SafetyLayer({ maxVelocityRate: 20 });
    const result = safety.validate(input({
      battery: { ...battery, current: 10 },
    }));

    expect(result.fallback).toBe('return');
    expect(result.finalAction.forwardVelocity).toBe(0);
    expect(result.warnings).toContain('critical_resource');
  });

  it('pauses all commands at highest priority', () => {
    const safety = new SafetyLayer();
    const result = safety.validate(input({ activeCommands: ['autonomous', 'manual', 'pause'] }));

    expect(result.commandMode).toBe('pause');
    expect(result.finalAction.forwardVelocity).toBe(0);
    expect(result.finalAction.angularVelocity).toBe(0);
  });

  it('keeps the safety layer active for manual control', () => {
    const safety = new SafetyLayer({ maxVelocityRate: 20 });
    const result = safety.validate(input({
      activeCommands: ['manual'],
      obstacles: [{ id: 'rock-1', type: 'rock', position: { x: 6, y: 5 }, radius: 0.5 }],
    }));

    expect(result.commandMode).toBe('manual');
    expect(result.finalAction.forwardVelocity).toBe(0);
    expect(result.rejected).toBe(true);
  });
});

