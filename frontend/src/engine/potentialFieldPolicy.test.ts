import { describe, expect, it } from 'vitest';
import { PotentialFieldPolicy } from './potentialFieldPolicy';
import type { ObstacleConfig } from '../types';

const rock = (x: number, y: number): ObstacleConfig => ({
  id: 'rock-1',
  type: 'rock',
  position: { x, y },
  radius: 0.5,
});

describe('PotentialFieldPolicy', () => {
  it('attracts toward a target', () => {
    const policy = new PotentialFieldPolicy({ attractionGain: 1 });
    expect(policy.calculateAttraction({ x: 0, y: 0 }, { x: 3, y: 2 })).toEqual({ x: 3, y: 2 });
  });

  it('returns zero attraction when no target is confirmed', () => {
    const policy = new PotentialFieldPolicy();
    expect(policy.calculateAttraction({ x: 0, y: 0 }, null)).toEqual({ x: 0, y: 0 });
  });

  it('repels away from a nearby obstacle', () => {
    const policy = new PotentialFieldPolicy({ repulsionGain: 1, obstacleInfluenceDistance: 4 });
    const repulsion = policy.calculateRepulsion({ x: 0, y: 0 }, [rock(1, 0)]);

    expect(repulsion.x).toBeLessThan(0);
    expect(Math.abs(repulsion.y)).toBeCloseTo(0, 8);
  });

  it('ignores obstacles outside the influence distance', () => {
    const policy = new PotentialFieldPolicy({ obstacleInfluenceDistance: 2 });
    expect(policy.calculateRepulsion({ x: 0, y: 0 }, [rock(5, 0)])).toEqual({ x: 0, y: 0 });
  });

  it('compensates for water current', () => {
    const policy = new PotentialFieldPolicy({ attractionGain: 1, currentCompensationGain: 1 });
    const desired = policy.calculateDesiredVelocity({
      position: { x: 0, y: 0 },
      heading: 0,
      targetPosition: { x: 3, y: 0 },
      obstacles: [],
      current: { x: 1, y: 0.5 },
      timestamp: 0,
    });

    expect(desired).toEqual({ x: 2, y: -0.5 });
  });

  it('generates a forward action toward a target', () => {
    const policy = new PotentialFieldPolicy({ maxVelocity: 2 });
    const action = policy.getAction({
      position: { x: 0, y: 0 },
      heading: 0,
      targetPosition: { x: 5, y: 0 },
      obstacles: [],
      current: { x: 0, y: 0 },
      timestamp: 1.5,
    });

    expect(action.forwardVelocity).toBe(2);
    expect(action.angularVelocity).toBe(0);
    expect(action.timestamp).toBe(1.5);
  });

  it('clips velocity and angular velocity to configured limits', () => {
    const policy = new PotentialFieldPolicy({ maxVelocity: 1, maxAngularVelocity: 0.5 });
    const action = policy.getAction({
      position: { x: 0, y: 0 },
      heading: 0,
      targetPosition: { x: 0, y: 100 },
      obstacles: [],
      current: { x: 0, y: 0 },
      timestamp: 0,
    });

    expect(Math.abs(action.forwardVelocity)).toBeLessThanOrEqual(1);
    expect(Math.abs(action.angularVelocity)).toBeLessThanOrEqual(0.5);
  });

  it('returns a zero action without a confirmed target', () => {
    const policy = new PotentialFieldPolicy();
    expect(policy.getAction({
      position: { x: 0, y: 0 },
      heading: 0,
      targetPosition: null,
      obstacles: [],
      current: { x: 0, y: 0 },
      timestamp: 2,
    })).toEqual({ forwardVelocity: 0, angularVelocity: 0, timestamp: 2 });
  });
});
