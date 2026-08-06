import { describe, expect, it } from 'vitest';
import { PerceptionDetector } from './perceptionDetector';
import { CameraSimulator } from './cameraSimulator';
import { SonarSimulator } from './sonarSimulator';
import type { ScenarioConfig, TargetConfig, UUVState } from '../types';

const uuv: UUVState = {
  position: { x: 10, y: 10 },
  heading: 0,
  velocity: { vx: 0, vy: 0 },
  forwardVelocity: 0,
  angularVelocity: 0,
};

const scenario: ScenarioConfig = {
  scenarioName: 'normal',
  difficulty: 'standard',
  seed: 42,
  visibility: 1,
  waterCurrent: { magnitude: 0, direction: 0 },
  missionBoundary: { minX: 0, maxX: 100, minY: 0, maxY: 100 },
  startingPosition: { x: 10, y: 10 },
  targetPosition: { x: 14, y: 10 },
  obstacles: [],
  targets: [],
  vehicleConfig: {
    initialPose: { position: { x: 10, y: 10 }, heading: 0 },
    radius: 0.5,
    maxVelocity: 2,
    maxAngularVelocity: Math.PI / 2,
  },
  initialBattery: 100,
  initialOxygen: 100,
  timestep: 0.1,
};

describe('PerceptionDetector', () => {
  it('converts camera objects into world-positioned detections', () => {
    const camera = new CameraSimulator({}, 42);
    const sonar = new SonarSimulator({ beamCount: 1 });
    const detector = new PerceptionDetector();
    const frame = camera.generateFrame(1, uuv, scenario, [
      { id: 'rock-1', type: 'rock', position: { x: 12, y: 10 }, radius: 0.5 },
    ], []);
    const result = detector.detect(frame, sonar.generateFrame(1, uuv, [], []), uuv);

    expect(result.detections).toHaveLength(1);
    expect(result.detections[0].type).toBe('rock');
    expect(result.detections[0].modality).toBe('camera');
    expect(result.detections[0].position).toEqual({ x: 12, y: 10 });
  });

  it('preserves internal-victim marker modality from sonar', () => {
    const camera = new CameraSimulator({}, 42);
    const sonar = new SonarSimulator({ beamCount: 1 });
    const target: TargetConfig = {
      id: 'internal-1',
      type: 'internal_victim',
      position: { x: 13, y: 10 },
      confidence: 0.5,
      modality: 'marker',
    };
    const detector = new PerceptionDetector();
    const result = detector.detect(
      camera.generateFrame(0, uuv, scenario, [], []),
      sonar.generateFrame(0, uuv, [], [target]),
      uuv,
    );

    expect(result.detections[0]).toMatchObject({
      id: 'internal-1',
      type: 'internal_victim',
      modality: 'marker',
    });
  });

  it('adds a pre-placed marker when sonar has not reached it yet', () => {
    const detector = new PerceptionDetector();
    const camera = new CameraSimulator({}, 42);
    const sonar = new SonarSimulator({ beamCount: 1 });
    const target: TargetConfig = {
      id: 'internal-marker',
      type: 'internal_victim',
      position: { x: 50, y: 50 },
      confidence: 0.5,
      modality: 'marker',
    };

    const result = detector.detect(
      camera.generateFrame(0, uuv, scenario, [], []),
      sonar.generateFrame(0, uuv, [], []),
      uuv,
      [target],
    );

    expect(result.detections).toHaveLength(1);
    expect(result.detections[0].modality).toBe('marker');
  });

  it('keeps detections reproducible for identical frames', () => {
    const camera1 = new CameraSimulator({}, 42);
    const camera2 = new CameraSimulator({}, 42);
    const sonar1 = new SonarSimulator({ beamCount: 5 });
    const sonar2 = new SonarSimulator({ beamCount: 5 });
    const detector = new PerceptionDetector();
    const obstacles = [
      { id: 'rock-1', type: 'rock' as const, position: { x: 12, y: 10 }, radius: 0.5 },
    ];

    const first = detector.detect(
      camera1.generateFrame(0, uuv, scenario, obstacles, []),
      sonar1.generateFrame(0, uuv, obstacles, []),
      uuv,
    );
    const second = detector.detect(
      camera2.generateFrame(0, uuv, scenario, obstacles, []),
      sonar2.generateFrame(0, uuv, obstacles, []),
      uuv,
    );

    expect(second).toEqual(first);
  });
});
