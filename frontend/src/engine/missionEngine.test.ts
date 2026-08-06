/**
 * Unit tests for MissionEngine
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MissionEngine, type MissionConfig } from './missionEngine';
import type { ControlAction } from '../types';

describe('MissionEngine', () => {
  let config: MissionConfig;

  beforeEach(() => {
    config = {
      scenarioName: 'test',
      seed: 42,
      language: 'en',
      timestep: 0.1,
      initialPosition: { x: 0, y: 0 },
      initialHeading: 0,
      waterCurrent: {
        x: 0,
        y: 0,
        magnitude: 0,
        type: 'constant',
      },
      visibility: 1.0,
      initialBattery: 100,
      initialOxygen: 100,
    };
  });

  describe('Initialization', () => {
    it('should create initial mission state', () => {
      const engine = new MissionEngine(config);
      const state = engine.getState();

      expect(state.scenarioName).toBe('test');
      expect(state.seed).toBe(42);
      expect(state.language).toBe('en');
      expect(state.elapsedTime).toBe(0);
      expect(state.uuv.position.x).toBe(0);
      expect(state.uuv.position.y).toBe(0);
      expect(state.uuv.heading).toBe(0);
      expect(state.phase).toBe('setup');
    });

    it('should initialize trajectory with starting point', () => {
      const engine = new MissionEngine(config);
      const state = engine.getState();

      expect(state.trajectory).toHaveLength(1);
      expect(state.trajectory[0]).toEqual({
        timestamp: 0,
        x: 0,
        y: 0,
        heading: 0,
      });
    });

    it('should initialize battery and oxygen states', () => {
      const engine = new MissionEngine(config);
      const state = engine.getState();

      expect(state.battery.current).toBe(100);
      expect(state.battery.initial).toBe(100);
      expect(state.oxygen.current).toBe(100);
      expect(state.oxygen.initial).toBe(100);
    });

    it('should use provided water current', () => {
      const configWithCurrent = {
        ...config,
        waterCurrent: {
          x: 0.5,
          y: 0.3,
          magnitude: 0.583,
          type: 'constant' as const,
        },
      };

      const engine = new MissionEngine(configWithCurrent);
      const state = engine.getState();

      expect(state.waterCurrent.x).toBe(0.5);
      expect(state.waterCurrent.y).toBe(0.3);
    });
  });

  describe('step() - Time advancement', () => {
    it('should advance time by one timestep', () => {
      const engine = new MissionEngine(config);
      
      engine.step();
      const state = engine.getState();

      expect(state.elapsedTime).toBeCloseTo(0.1, 6);
    });

    it('should advance time by multiple timesteps', () => {
      const engine = new MissionEngine(config);
      
      for (let i = 0; i < 10; i++) {
        engine.step();
      }
      
      const state = engine.getState();
      expect(state.elapsedTime).toBeCloseTo(1.0, 6);
    });

    it('should use configured timestep', () => {
      const customConfig = { ...config, timestep: 0.05 };
      const engine = new MissionEngine(customConfig);
      
      engine.step();
      const state = engine.getState();

      expect(state.elapsedTime).toBeCloseTo(0.05, 6);
    });
  });

  describe('step() - Pose updates according to kinematic model', () => {
    it('should update position with forward velocity', () => {
      const engine = new MissionEngine(config);
      
      const action: ControlAction = {
        forwardVelocity: 1.0,
        angularVelocity: 0,
        timestamp: 0,
      };
      
      engine.step(action);
      const state = engine.getState();

      expect(state.uuv.position.x).toBeCloseTo(0.1, 6);
      expect(state.uuv.position.y).toBeCloseTo(0, 6);
      expect(state.uuv.heading).toBeCloseTo(0, 6);
    });

    it('should update heading with angular velocity', () => {
      const engine = new MissionEngine(config);
      
      const action: ControlAction = {
        forwardVelocity: 0,
        angularVelocity: 1.0,
        timestamp: 0,
      };
      
      engine.step(action);
      const state = engine.getState();

      expect(state.uuv.position.x).toBeCloseTo(0, 6);
      expect(state.uuv.position.y).toBeCloseTo(0, 6);
      expect(state.uuv.heading).toBeCloseTo(0.1, 6);
    });

    it('should apply water current to motion', () => {
      const configWithCurrent = {
        ...config,
        waterCurrent: {
          x: 0.5,
          y: 0,
          magnitude: 0.5,
          type: 'constant' as const,
        },
      };

      const engine = new MissionEngine(configWithCurrent);
      
      const action: ControlAction = {
        forwardVelocity: 1.0,
        angularVelocity: 0,
        timestamp: 0,
      };
      
      engine.step(action);
      const state = engine.getState();

      // Total velocity = 1.0 + 0.5 = 1.5 m/s
      expect(state.uuv.position.x).toBeCloseTo(0.15, 6);
    });

    it('should handle motion at different headings', () => {
      const configWithHeading = {
        ...config,
        initialHeading: Math.PI / 2, // North
      };

      const engine = new MissionEngine(configWithHeading);
      
      const action: ControlAction = {
        forwardVelocity: 1.0,
        angularVelocity: 0,
        timestamp: 0,
      };
      
      engine.step(action);
      const state = engine.getState();

      expect(state.uuv.position.x).toBeCloseTo(0, 6);
      expect(state.uuv.position.y).toBeCloseTo(0.1, 6);
    });

    it('should default to zero velocities when no action provided', () => {
      const engine = new MissionEngine(config);
      
      engine.step(); // No action
      const state = engine.getState();

      expect(state.uuv.position.x).toBeCloseTo(0, 6);
      expect(state.uuv.position.y).toBeCloseTo(0, 6);
      expect(state.uuv.heading).toBeCloseTo(0, 6);
    });
  });

  describe('step() - Deterministic behavior', () => {
    it('should produce identical results with same initial state and actions', () => {
      const engine1 = new MissionEngine(config);
      const engine2 = new MissionEngine(config);

      const action: ControlAction = {
        forwardVelocity: 1.0,
        angularVelocity: 0.5,
        timestamp: 0,
      };

      // Apply same actions to both engines
      for (let i = 0; i < 5; i++) {
        engine1.step(action);
        engine2.step(action);
      }

      const state1 = engine1.getState();
      const state2 = engine2.getState();

      expect(state1.elapsedTime).toBeCloseTo(state2.elapsedTime, 10);
      expect(state1.uuv.position.x).toBeCloseTo(state2.uuv.position.x, 10);
      expect(state1.uuv.position.y).toBeCloseTo(state2.uuv.position.y, 10);
      expect(state1.uuv.heading).toBeCloseTo(state2.uuv.heading, 10);
    });

    it('should produce same trajectory with same actions', () => {
      const engine1 = new MissionEngine(config);
      const engine2 = new MissionEngine(config);

      const action: ControlAction = {
        forwardVelocity: 1.0,
        angularVelocity: 0,
        timestamp: 0,
      };

      for (let i = 0; i < 10; i++) {
        engine1.step(action);
        engine2.step(action);
      }

      const state1 = engine1.getState();
      const state2 = engine2.getState();

      expect(state1.trajectory).toHaveLength(state2.trajectory.length);
      
      for (let i = 0; i < state1.trajectory.length; i++) {
        expect(state1.trajectory[i].timestamp).toBeCloseTo(state2.trajectory[i].timestamp, 10);
        expect(state1.trajectory[i].x).toBeCloseTo(state2.trajectory[i].x, 10);
        expect(state1.trajectory[i].y).toBeCloseTo(state2.trajectory[i].y, 10);
        expect(state1.trajectory[i].heading).toBeCloseTo(state2.trajectory[i].heading, 10);
      }
    });

    it('should not mutate previous state', () => {
      const engine = new MissionEngine(config);
      
      const stateBefore = engine.getState();
      const positionBefore = stateBefore.uuv.position.x;

      const action: ControlAction = {
        forwardVelocity: 1.0,
        angularVelocity: 0,
        timestamp: 0,
      };

      engine.step(action);

      // Check that the returned state before step is not mutated
      expect(stateBefore.uuv.position.x).toBe(positionBefore);
    });

    it('should preserve determinism with different action sequences', () => {
      const actions: ControlAction[] = [
        { forwardVelocity: 1.0, angularVelocity: 0, timestamp: 0 },
        { forwardVelocity: 0.5, angularVelocity: 0.5, timestamp: 0 },
        { forwardVelocity: 0, angularVelocity: 1.0, timestamp: 0 },
        { forwardVelocity: 1.0, angularVelocity: -0.5, timestamp: 0 },
      ];

      // First run
      const engine1 = new MissionEngine(config);
      for (const action of actions) {
        engine1.step(action);
      }
      const state1 = engine1.getState();

      // Second run with same actions
      const engine2 = new MissionEngine(config);
      for (const action of actions) {
        engine2.step(action);
      }
      const state2 = engine2.getState();

      expect(state1.uuv.position.x).toBeCloseTo(state2.uuv.position.x, 10);
      expect(state1.uuv.position.y).toBeCloseTo(state2.uuv.position.y, 10);
      expect(state1.uuv.heading).toBeCloseTo(state2.uuv.heading, 10);
    });
  });

  describe('reset()', () => {
    it('should restore initial state', () => {
      const engine = new MissionEngine(config);
      
      const initialState = engine.getState();

      // Make changes
      const action: ControlAction = {
        forwardVelocity: 1.0,
        angularVelocity: 0.5,
        timestamp: 0,
      };

      for (let i = 0; i < 10; i++) {
        engine.step(action);
      }

      // Reset
      engine.reset();
      const resetState = engine.getState();

      expect(resetState.elapsedTime).toBe(initialState.elapsedTime);
      expect(resetState.uuv.position.x).toBeCloseTo(initialState.uuv.position.x, 10);
      expect(resetState.uuv.position.y).toBeCloseTo(initialState.uuv.position.y, 10);
      expect(resetState.uuv.heading).toBeCloseTo(initialState.uuv.heading, 10);
      expect(resetState.trajectory).toHaveLength(1);
    });

    it('should allow re-running mission after reset', () => {
      const engine = new MissionEngine(config);

      const action: ControlAction = {
        forwardVelocity: 1.0,
        angularVelocity: 0,
        timestamp: 0,
      };

      // First run
      for (let i = 0; i < 5; i++) {
        engine.step(action);
      }
      const firstRunState = engine.getState();

      // Reset and second run
      engine.reset();
      for (let i = 0; i < 5; i++) {
        engine.step(action);
      }
      const secondRunState = engine.getState();

      expect(firstRunState.uuv.position.x).toBeCloseTo(secondRunState.uuv.position.x, 10);
      expect(firstRunState.uuv.position.y).toBeCloseTo(secondRunState.uuv.position.y, 10);
      expect(firstRunState.uuv.heading).toBeCloseTo(secondRunState.uuv.heading, 10);
    });

    it('should restore path length to zero', () => {
      const engine = new MissionEngine(config);

      const action: ControlAction = {
        forwardVelocity: 1.0,
        angularVelocity: 0,
        timestamp: 0,
      };

      engine.step(action);
      expect(engine.getState().pathLength).toBeGreaterThan(0);

      engine.reset();
      expect(engine.getState().pathLength).toBe(0);
    });
  });

  describe('Trajectory recording', () => {
    it('should append trajectory point on each step', () => {
      const engine = new MissionEngine(config);

      expect(engine.getState().trajectory).toHaveLength(1);

      engine.step();
      expect(engine.getState().trajectory).toHaveLength(2);

      engine.step();
      expect(engine.getState().trajectory).toHaveLength(3);
    });

    it('should record correct trajectory data', () => {
      const engine = new MissionEngine(config);

      const action: ControlAction = {
        forwardVelocity: 1.0,
        angularVelocity: 0,
        timestamp: 0,
      };

      engine.step(action);
      const state = engine.getState();
      const lastPoint = state.trajectory[state.trajectory.length - 1];

      expect(lastPoint.timestamp).toBeCloseTo(0.1, 6);
      expect(lastPoint.x).toBeCloseTo(0.1, 6);
      expect(lastPoint.y).toBeCloseTo(0, 6);
      expect(lastPoint.heading).toBeCloseTo(0, 6);
    });
  });

  describe('Path length calculation', () => {
    it('should calculate path length for straight motion', () => {
      const engine = new MissionEngine(config);

      const action: ControlAction = {
        forwardVelocity: 1.0,
        angularVelocity: 0,
        timestamp: 0,
      };

      for (let i = 0; i < 10; i++) {
        engine.step(action);
      }

      const state = engine.getState();
      expect(state.pathLength).toBeCloseTo(1.0, 5); // 10 steps * 0.1s * 1.0 m/s
    });

    it('should calculate path length with rotation', () => {
      const engine = new MissionEngine(config);

      const action: ControlAction = {
        forwardVelocity: 1.0,
        angularVelocity: 0.5,
        timestamp: 0,
      };

      engine.step(action);
      const state = engine.getState();

      expect(state.pathLength).toBeGreaterThan(0);
      expect(state.pathLength).toBeCloseTo(0.1, 5);
    });

    it('should accumulate path length over multiple steps', () => {
      const engine = new MissionEngine(config);

      const action: ControlAction = {
        forwardVelocity: 1.0,
        angularVelocity: 0,
        timestamp: 0,
      };

      engine.step(action);
      const pathAfterStep1 = engine.getState().pathLength;

      engine.step(action);
      const pathAfterStep2 = engine.getState().pathLength;

      expect(pathAfterStep2).toBeGreaterThan(pathAfterStep1);
      expect(pathAfterStep2).toBeCloseTo(0.2, 5);
    });
  });

  describe('getState()', () => {
    it('should return a readonly copy', () => {
      const engine = new MissionEngine(config);
      const state = engine.getState();

      // Verify we can read the state
      const originalX = state.uuv.position.x;
      expect(originalX).toBe(0);

      // Get fresh state to verify independence
      const freshState = engine.getState();
      expect(freshState.uuv.position.x).toBe(originalX);
    });
  });

  describe('getConfig()', () => {
    it('should return mission configuration', () => {
      const engine = new MissionEngine(config);
      const returnedConfig = engine.getConfig();

      expect(returnedConfig.scenarioName).toBe('test');
      expect(returnedConfig.seed).toBe(42);
      expect(returnedConfig.timestep).toBe(0.1);
    });
  });
});
