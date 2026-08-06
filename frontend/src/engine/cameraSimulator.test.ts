import { describe, it, expect, beforeEach } from 'vitest';
import { CameraSimulator, type CameraConfig } from './cameraSimulator';
import type {
  ScenarioConfig,
  UUVState,
  ObstacleConfig,
  TargetConfig,
} from '../types';

/**
 * Helper function to create test scenario config
 */
function createTestScenario(
  visibility: number = 1.0,
  seed: number = 42
): ScenarioConfig {
  return {
    scenarioName: 'normal',
    difficulty: 'standard',
    seed,
    visibility,
    waterCurrent: { magnitude: 0.0, direction: 0.0 },
    missionBoundary: {
      minX: -10,
      maxX: 10,
      minY: -10,
      maxY: 10,
    },
    startingPosition: { x: 0, y: 0 },
    targetPosition: { x: 5, y: 5 },
    obstacles: [],
    targets: [],
    vehicleConfig: {
      initialPose: { position: { x: 0, y: 0 }, heading: 0 },
      radius: 0.5,
      maxVelocity: 1.0,
      maxAngularVelocity: Math.PI / 4,
    },
    initialBattery: 100,
    initialOxygen: 100,
    timestep: 0.1,
  };
}

/**
 * Helper function to create test UUV state
 */
function createTestUUVState(
  x: number = 0,
  y: number = 0,
  heading: number = 0
): UUVState {
  return {
    position: { x, y },
    heading,
    velocity: { vx: 0, vy: 0 },
    forwardVelocity: 0,
    angularVelocity: 0,
  };
}

describe('CameraSimulator', () => {
  describe('Construction and configuration', () => {
    it('should create with default configuration', () => {
      const camera = new CameraSimulator();
      const config = camera.getConfig();
      
      expect(config.fieldOfView).toBeCloseTo(Math.PI / 3); // 60 degrees
      expect(config.maxRange).toBe(4.0); // From requirements R13
      expect(config.resolutionX).toBe(800);
      expect(config.resolutionY).toBe(600);
    });

    it('should allow custom configuration', () => {
      const customConfig: Partial<CameraConfig> = {
        fieldOfView: Math.PI / 2, // 90 degrees
        maxRange: 6.0,
        resolutionX: 1024,
        resolutionY: 768,
      };
      
      const camera = new CameraSimulator(customConfig);
      const config = camera.getConfig();
      
      expect(config.fieldOfView).toBe(Math.PI / 2);
      expect(config.maxRange).toBe(6.0);
      expect(config.resolutionX).toBe(1024);
      expect(config.resolutionY).toBe(768);
    });

    it('should use provided seed for deterministic behavior', () => {
      const camera1 = new CameraSimulator({}, 42);
      const camera2 = new CameraSimulator({}, 42);
      const camera3 = new CameraSimulator({}, 43);
      
      // Same seed should produce same "random" seed state
      expect(camera1.getSeed()).toBe(camera2.getSeed());
      // Different seed may produce different values
      expect(camera1.getSeed()).not.toBe(camera3.getSeed());
    });
  });

  describe('generateFrame - basic functionality', () => {
    let camera: CameraSimulator;
    let scenario: ScenarioConfig;
    let uuvState: UUVState;

    beforeEach(() => {
      camera = new CameraSimulator({}, 42);
      scenario = createTestScenario();
      uuvState = createTestUUVState();
    });

    it('should generate frame with timestamp', () => {
      const timestamp = 123.45;
      const frame = camera.generateFrame(timestamp, uuvState, scenario, [], []);
      
      expect(frame.timestamp).toBe(timestamp);
      expect(frame.visibility).toBe(scenario.visibility);
      expect(frame.objects).toEqual([]);
    });

    it('should generate deterministic frames with same inputs', () => {
      const obstacles: ObstacleConfig[] = [
        {
          id: 'rock1',
          type: 'rock',
          position: { x: 2, y: 0 },
          radius: 0.5,
        },
      ];
      
      const frame1 = camera.generateFrame(0, uuvState, scenario, obstacles, []);
      const frame2 = camera.generateFrame(0, uuvState, scenario, obstacles, []);
      
      // Same inputs should produce identical frames
      expect(frame1).toEqual(frame2);
    });

    it('should reflect scenario visibility in frame', () => {
      const normalScenario = createTestScenario(1.0);
      const lowVisibilityScenario = createTestScenario(0.35);
      
      const normalFrame = camera.generateFrame(0, uuvState, normalScenario, [], []);
      const lowVisibilityFrame = camera.generateFrame(0, uuvState, lowVisibilityScenario, [], []);
      
      expect(normalFrame.visibility).toBe(1.0);
      expect(lowVisibilityFrame.visibility).toBe(0.35);
    });
  });

  describe('Object visibility and FOV', () => {
    let camera: CameraSimulator;
    let scenario: ScenarioConfig;

    beforeEach(() => {
      camera = new CameraSimulator({}, 42);
      scenario = createTestScenario();
    });

    it('should detect objects within field of view', () => {
      // UUV facing East (heading = 0)
      const uuvState = createTestUUVState(0, 0, 0);
      
      // Obstacle directly ahead (within FOV)
      const obstacles: ObstacleConfig[] = [
        {
          id: 'rock1',
          type: 'rock',
          position: { x: 2, y: 0 }, // 2 meters ahead on X axis
          radius: 0.5,
        },
      ];
      
      const frame = camera.generateFrame(0, uuvState, scenario, obstacles, []);
      
      expect(frame.objects).toHaveLength(1);
      expect(frame.objects[0].type).toBe('rock');
      expect(frame.objects[0].visible).toBe(true);
      expect(frame.objects[0].relativePosition.x).toBeCloseTo(2);
      expect(frame.objects[0].relativePosition.y).toBeCloseTo(0);
    });

    it('should not detect objects outside field of view', () => {
      // UUV facing East (heading = 0)
      const uuvState = createTestUUVState(0, 0, 0);
      
      // Obstacle behind UUV (outside FOV)
      const obstacles: ObstacleConfig[] = [
        {
          id: 'rock1',
          type: 'rock',
          position: { x: -2, y: 0 }, // 2 meters behind
          radius: 0.5,
        },
      ];
      
      const frame = camera.generateFrame(0, uuvState, scenario, obstacles, []);
      
      expect(frame.objects).toHaveLength(0);
    });

    it('should not detect objects beyond maximum range', () => {
      // UUV facing East (heading = 0)
      const uuvState = createTestUUVState(0, 0, 0);
      
      // Obstacle beyond 4 meter range (from requirements R13)
      const obstacles: ObstacleConfig[] = [
        {
          id: 'rock1',
          type: 'rock',
          position: { x: 5, y: 0 }, // 5 meters ahead (> 4m max range)
          radius: 0.5,
        },
      ];
      
      const frame = camera.generateFrame(0, uuvState, scenario, obstacles, []);
      
      expect(frame.objects).toHaveLength(0);
    });

    it('should detect objects within 4 meter range (R13 requirement)', () => {
      // UUV facing East (heading = 0)
      const uuvState = createTestUUVState(0, 0, 0);
      
      // Obstacle exactly at 4 meter range
      const obstacles: ObstacleConfig[] = [
        {
          id: 'rock1',
          type: 'rock',
          position: { x: 4, y: 0 }, // Exactly 4 meters
          radius: 0.5,
        },
      ];
      
      const frame = camera.generateFrame(0, uuvState, scenario, obstacles, []);
      
      expect(frame.objects).toHaveLength(1);
      expect(frame.objects[0].type).toBe('rock');
    });

    it('should handle rotated UUV field of view', () => {
      // UUV facing North (heading = π/2)
      const uuvState = createTestUUVState(0, 0, Math.PI / 2);
      
      const obstacles: ObstacleConfig[] = [
        {
          id: 'rock1',
          type: 'rock',
          position: { x: 0, y: 2 }, // 2 meters North (now within FOV)
          radius: 0.5,
        },
        {
          id: 'rock2',
          type: 'rock',
          position: { x: 2, y: 0 }, // 2 meters East (now outside FOV)
          radius: 0.5,
        },
      ];
      
      const frame = camera.generateFrame(0, uuvState, scenario, obstacles, []);
      
      expect(frame.objects).toHaveLength(1);
      expect(frame.objects[0].type).toBe('rock');
      expect(frame.objects[0].relativePosition.x).toBeCloseTo(0);
      expect(frame.objects[0].relativePosition.y).toBeCloseTo(2);
    });
  });

  describe('Object types and rendering', () => {
    let camera: CameraSimulator;
    let scenario: ScenarioConfig;
    let uuvState: UUVState;

    beforeEach(() => {
      camera = new CameraSimulator({}, 42);
      scenario = createTestScenario();
      uuvState = createTestUUVState(0, 0, 0);
    });

    it('should render rock obstacles correctly', () => {
      const obstacles: ObstacleConfig[] = [
        {
          id: 'rock1',
          type: 'rock',
          position: { x: 2, y: 0 },
          radius: 0.5,
        },
      ];
      
      const frame = camera.generateFrame(0, uuvState, scenario, obstacles, []);
      
      expect(frame.objects[0].type).toBe('rock');
      expect(frame.objects[0].color).toBe('#696969'); // Dim gray
      expect(frame.objects[0].visible).toBe(true);
      expect(frame.objects[0].size).toBeGreaterThan(0);
      expect(frame.objects[0].opacity).toBeCloseTo(1.0); // Full visibility
    });

    it('should render pipe obstacles correctly', () => {
      const obstacles: ObstacleConfig[] = [
        {
          id: 'pipe1',
          type: 'pipe',
          position: { x: 2, y: 0 },
          width: 1.0,
          height: 0.5,
          rotation: 0,
        },
      ];
      
      const frame = camera.generateFrame(0, uuvState, scenario, obstacles, []);
      
      expect(frame.objects[0].type).toBe('pipe');
      expect(frame.objects[0].color).toBe('#A0522D'); // Sienna brown
      expect(frame.objects[0].visible).toBe(true);
    });

    it('should render vehicle targets correctly', () => {
      const targets: TargetConfig[] = [
        {
          id: 'vehicle1',
          type: 'vehicle',
          position: { x: 2, y: 0 },
          confidence: 0.8,
          modality: 'camera',
        },
      ];
      
      const frame = camera.generateFrame(0, uuvState, scenario, [], targets);
      
      expect(frame.objects[0].type).toBe('submerged_vehicle');
      expect(frame.objects[0].color).toBe('#4682B4'); // Steel blue
      expect(frame.objects[0].opacity).toBeCloseTo(0.8); // Confidence-based
    });

    it('should render external victim targets correctly', () => {
      const targets: TargetConfig[] = [
        {
          id: 'victim1',
          type: 'external_victim',
          position: { x: 2, y: 0 },
          confidence: 0.7,
          modality: 'camera',
        },
      ];
      
      const frame = camera.generateFrame(0, uuvState, scenario, [], targets);
      
      expect(frame.objects[0].type).toBe('external_victim');
      expect(frame.objects[0].color).toBe('#FF6347'); // Tomato red
      expect(frame.objects[0].opacity).toBeCloseTo(0.7); // Confidence-based
    });

    it('should NOT render internal victims through camera (R4 requirement)', () => {
      const targets: TargetConfig[] = [
        {
          id: 'internal1',
          type: 'internal_victim',
          position: { x: 2, y: 0 },
          confidence: 0.9,
          modality: 'sonar', // Camera should not see internal victims
        },
      ];
      
      const frame = camera.generateFrame(0, uuvState, scenario, [], targets);
      
      // Internal victims should appear as unknown type with zero opacity
      expect(frame.objects).toHaveLength(1);
      expect(frame.objects[0].type).toBe('unknown');
      expect(frame.objects[0].color).toBe('#8B0000'); // Dark red
      expect(frame.objects[0].opacity).toBe(0); // Not visible
      expect(frame.objects[0].visible).toBe(false);
    });

    it('should not detect camera-only targets with sonar modality', () => {
      const targets: TargetConfig[] = [
        {
          id: 'victim1',
          type: 'external_victim',
          position: { x: 2, y: 0 },
          confidence: 0.7,
          modality: 'sonar', // Wrong modality for camera
        },
      ];
      
      const frame = camera.generateFrame(0, uuvState, scenario, [], targets);
      
      expect(frame.objects).toHaveLength(0); // Should not detect sonar targets
    });
  });

  describe('Visibility degradation effects', () => {
    let camera: CameraSimulator;
    let uuvState: UUVState;

    beforeEach(() => {
      camera = new CameraSimulator({}, 42);
      uuvState = createTestUUVState(0, 0, 0);
    });

    it('should apply visibility threshold (0.35 from R13)', () => {
      const normalScenario = createTestScenario(1.0);
      const lowVisibilityScenario = createTestScenario(0.35);
      const belowThresholdScenario = createTestScenario(0.2);
      
      const obstacles: ObstacleConfig[] = [
        {
          id: 'rock1',
          type: 'rock',
          position: { x: 2, y: 0 },
          radius: 0.5,
        },
      ];
      
      const normalFrame = camera.generateFrame(0, uuvState, normalScenario, obstacles, []);
      const lowVisibilityFrame = camera.generateFrame(0, uuvState, lowVisibilityScenario, obstacles, []);
      const belowThresholdFrame = camera.generateFrame(0, uuvState, belowThresholdScenario, obstacles, []);
      
      // Normal visibility: object visible
      expect(normalFrame.objects[0].visible).toBe(true);
      expect(normalFrame.objects[0].opacity).toBeCloseTo(1.0);
      
      // Low visibility (0.35): object visible but with reduced opacity
      expect(lowVisibilityFrame.objects[0].visible).toBe(true);
      expect(lowVisibilityFrame.objects[0].opacity).toBeCloseTo(0.35);
      
      // Below threshold (<0.35): object not visible (from R13)
      expect(belowThresholdFrame.objects[0].visible).toBe(false);
    });

    it('should calculate contrast reduction based on visibility', () => {
      const fullVisibilityScenario = createTestScenario(1.0);
      const halfVisibilityScenario = createTestScenario(0.5);
      const lowVisibilityScenario = createTestScenario(0.35);
      
      const obstacles: ObstacleConfig[] = [
        {
          id: 'rock1',
          type: 'rock',
          position: { x: 2, y: 0 },
          radius: 0.5,
        },
      ];
      
      const fullFrame = camera.generateFrame(0, uuvState, fullVisibilityScenario, obstacles, []);
      const halfFrame = camera.generateFrame(0, uuvState, halfVisibilityScenario, obstacles, []);
      const lowFrame = camera.generateFrame(0, uuvState, lowVisibilityScenario, obstacles, []);
      
      // Contrast should decrease with visibility
      expect(fullFrame.contrast).toBe(1.0);
      expect(halfFrame.contrast).toBe(0.5);
      expect(lowFrame.contrast).toBe(0.35);
    });

    it('should calculate noise level inversely to visibility', () => {
      const fullVisibilityScenario = createTestScenario(1.0);
      const halfVisibilityScenario = createTestScenario(0.5);
      const lowVisibilityScenario = createTestScenario(0.35);
      
      const obstacles: ObstacleConfig[] = [
        {
          id: 'rock1',
          type: 'rock',
          position: { x: 2, y: 0 },
          radius: 0.5,
        },
      ];
      
      const fullFrame = camera.generateFrame(0, uuvState, fullVisibilityScenario, obstacles, []);
      const halfFrame = camera.generateFrame(0, uuvState, halfVisibilityScenario, obstacles, []);
      const lowFrame = camera.generateFrame(0, uuvState, lowVisibilityScenario, obstacles, []);
      
      // Noise should increase as visibility decreases
      expect(fullFrame.noiseLevel).toBe(0.0); // 1.0 - 1.0 = 0.0
      expect(halfFrame.noiseLevel).toBe(0.5); // 1.0 - 0.5 = 0.5
      expect(lowFrame.noiseLevel).toBe(0.65); // 1.0 - 0.35 = 0.65
    });

    it('should reduce object opacity based on visibility and confidence', () => {
      const halfVisibilityScenario = createTestScenario(0.5);
      
      const targets: TargetConfig[] = [
        {
          id: 'vehicle1',
          type: 'vehicle',
          position: { x: 2, y: 0 },
          confidence: 0.8,
          modality: 'camera',
        },
      ];
      
      const frame = camera.generateFrame(0, uuvState, halfVisibilityScenario, [], targets);
      
      // Opacity = min(confidence, visibility) * contrast
      // confidence = 0.8, visibility = 0.5, contrast = 0.5
      // expected = min(0.8, 0.5) * 0.5 = 0.5 * 0.5 = 0.25
      expect(frame.objects[0].opacity).toBeCloseTo(0.25);
    });
  });

  describe('Object size calculation', () => {
    let camera: CameraSimulator;
    let scenario: ScenarioConfig;
    let uuvState: UUVState;

    beforeEach(() => {
      camera = new CameraSimulator({}, 42);
      scenario = createTestScenario();
      uuvState = createTestUUVState(0, 0, 0);
    });

    it('should calculate smaller size for more distant objects', () => {
      const obstacles: ObstacleConfig[] = [
        {
          id: 'rock1',
          type: 'rock',
          position: { x: 1, y: 0 }, // Close (1m)
          radius: 0.5,
        },
        {
          id: 'rock2',
          type: 'rock',
          position: { x: 3, y: 0 }, // Far (3m)
          radius: 0.5,
        },
      ];
      
      const frame = camera.generateFrame(0, uuvState, scenario, obstacles, []);
      
      expect(frame.objects).toHaveLength(2);
      // Closer object should appear larger
      expect(frame.objects[0].size).toBeGreaterThan(frame.objects[1].size);
    });

    it('should apply deterministic random variation', () => {
      // Two cameras with same seed should produce identical object sizes
      const camera1 = new CameraSimulator({}, 42);
      const camera2 = new CameraSimulator({}, 42);
      const camera3 = new CameraSimulator({}, 43); // Different seed
      
      const obstacles: ObstacleConfig[] = [
        {
          id: 'rock1',
          type: 'rock',
          position: { x: 2, y: 0 },
          radius: 0.5,
        },
      ];
      
      const frame1 = camera1.generateFrame(0, uuvState, scenario, obstacles, []);
      const frame2 = camera2.generateFrame(0, uuvState, scenario, obstacles, []);
      const frame3 = camera3.generateFrame(0, uuvState, scenario, obstacles, []);
      
      expect(frame1.objects[0].size).toBe(frame2.objects[0].size);
      // Different seed may produce different sizes
      expect(frame1.objects[0].size).not.toBe(frame3.objects[0].size);
    });
  });

  describe('Scenario-specific tests', () => {
    it('should handle normal scenario (visibility=1.0)', () => {
      const camera = new CameraSimulator({}, 42);
      const normalScenario = createTestScenario(1.0);
      const uuvState = createTestUUVState(0, 0, 0);
      
      const obstacles: ObstacleConfig[] = [
        {
          id: 'rock1',
          type: 'rock',
          position: { x: 2, y: 0 },
          radius: 0.5,
        },
      ];
      
      const frame = camera.generateFrame(0, uuvState, normalScenario, obstacles, []);
      
      expect(frame.visibility).toBe(1.0);
      expect(frame.contrast).toBe(1.0);
      expect(frame.noiseLevel).toBe(0.0);
      expect(frame.objects[0].opacity).toBeCloseTo(1.0);
      expect(frame.objects[0].visible).toBe(true);
    });

    it('should handle low_visibility scenario (visibility=0.35)', () => {
      const camera = new CameraSimulator({}, 42);
      const lowVisibilityScenario = createTestScenario(0.35);
      const uuvState = createTestUUVState(0, 0, 0);
      
      const obstacles: ObstacleConfig[] = [
        {
          id: 'rock1',
          type: 'rock',
          position: { x: 2, y: 0 },
          radius: 0.5,
        },
      ];
      
      const frame = camera.generateFrame(0, uuvState, lowVisibilityScenario, obstacles, []);
      
      expect(frame.visibility).toBe(0.35);
      expect(frame.contrast).toBe(0.35);
      expect(frame.noiseLevel).toBe(0.65);
      expect(frame.objects[0].opacity).toBeCloseTo(0.35);
      expect(frame.objects[0].visible).toBe(true); // Exactly at threshold
    });

    it('should respect 0.35 visibility threshold for object visibility', () => {
      const camera = new CameraSimulator({}, 42);
      const belowThresholdScenario = createTestScenario(0.34); // Just below threshold
      const uuvState = createTestUUVState(0, 0, 0);
      
      const obstacles: ObstacleConfig[] = [
        {
          id: 'rock1',
          type: 'rock',
          position: { x: 2, y: 0 },
          radius: 0.5,
        },
      ];
      
      const frame = camera.generateFrame(0, uuvState, belowThresholdScenario, obstacles, []);
      
      // Objects should not be visible when visibility < 0.35 (from R13)
      expect(frame.objects[0].visible).toBe(false);
    });
  });

  describe('Performance and edge cases', () => {
    it('should handle empty scene gracefully', () => {
      const camera = new CameraSimulator({}, 42);
      const scenario = createTestScenario();
      const uuvState = createTestUUVState();
      
      const frame = camera.generateFrame(0, uuvState, scenario, [], []);
      
      expect(frame.objects).toEqual([]);
      expect(frame.timestamp).toBe(0);
      expect(frame.visibility).toBe(scenario.visibility);
    });

    it('should handle many objects efficiently', () => {
      const camera = new CameraSimulator({}, 42);
      const scenario = createTestScenario();
      const uuvState = createTestUUVState();
      
      // Create many obstacles within FOV
      const obstacles: ObstacleConfig[] = [];
      for (let i = 0; i < 20; i++) {
        obstacles.push({
          id: `rock${i}`,
          type: 'rock',
          position: { x: 1 + i * 0.1, y: 0 },
          radius: 0.5,
        });
      }
      
      const frame = camera.generateFrame(0, uuvState, scenario, obstacles, []);
      
      // All should be detected
      expect(frame.objects).toHaveLength(20);
    });

    it('should maintain object ordering consistency', () => {
      const camera = new CameraSimulator({}, 42);
      const scenario = createTestScenario();
      const uuvState = createTestUUVState();
      
      const obstacles: ObstacleConfig[] = [
        { id: 'rock1', type: 'rock', position: { x: 2, y: 0 }, radius: 0.5 },
        { id: 'rock2', type: 'rock', position: { x: 2.5, y: 0 }, radius: 0.5 },
        { id: 'pipe1', type: 'pipe', position: { x: 1.5, y: 0 }, width: 1.0, height: 0.5, rotation: 0 },
      ];
      
      const targets: TargetConfig[] = [
        { id: 'vehicle1', type: 'vehicle', position: { x: 3, y: 0 }, confidence: 0.8, modality: 'camera' },
      ];
      
      const frame1 = camera.generateFrame(0, uuvState, scenario, obstacles, targets);
      const frame2 = camera.generateFrame(0, uuvState, scenario, obstacles, targets);
      
      // Should produce identical frames
      expect(frame1).toEqual(frame2);
    });
  });
});
