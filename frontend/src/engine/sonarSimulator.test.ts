import { describe, expect, it } from 'vitest';
import { SonarSimulator } from './sonarSimulator';
import type { ObstacleConfig, TargetConfig, UUVState } from '../types';

function uuv(heading = 0): UUVState {
  return {
    position: { x: 0, y: 0 },
    heading,
    velocity: { vx: 0, vy: 0 },
    forwardVelocity: 0,
    angularVelocity: 0,
  };
}

function rock(id: string, x: number, y: number): ObstacleConfig {
  return { id, type: 'rock', position: { x, y }, radius: 0.5 };
}

function victim(id: string, x: number, y: number): TargetConfig {
  return {
    id,
    type: 'external_victim',
    position: { x, y },
    confidence: 0.8,
    modality: 'sonar',
  };
}

describe('SonarSimulator', () => {
  it('creates the configured number of beams with max-range misses', () => {
    const sonar = new SonarSimulator({ beamCount: 5, maxRange: 8 });
    const frame = sonar.generateFrame(1, uuv(), [], []);

    expect(frame.beams).toHaveLength(5);
    expect(frame.detections).toEqual([]);
    expect(frame.beams.every((beam) => beam.range === 8 && beam.hit === null)).toBe(true);
  });

  it('detects a circular obstacle directly ahead', () => {
    const sonar = new SonarSimulator({ beamCount: 3, fieldOfView: Math.PI / 2, maxRange: 8 });
    const frame = sonar.generateFrame(0, uuv(), [rock('rock-1', 4, 0)], []);
    const centerBeam = frame.beams[1];

    expect(centerBeam.hit?.id).toBe('rock-1');
    expect(centerBeam.range).toBeCloseTo(3.5, 6);
    expect(frame.detections[0].type).toBe('rock');
  });

  it('detects an internal victim through sonar only', () => {
    const sonar = new SonarSimulator({ beamCount: 1, maxRange: 8 });
    const target: TargetConfig = {
      id: 'internal-1',
      type: 'internal_victim',
      position: { x: 3, y: 0 },
      confidence: 0.5,
      modality: 'marker',
    };
    const frame = sonar.generateFrame(0, uuv(), [], [target]);

    expect(frame.detections).toHaveLength(1);
    expect(frame.detections[0].type).toBe('internal_victim');
    expect(frame.detections[0].source).toBe('target');
  });

  it('rotates the forward ray with the UUV heading', () => {
    const sonar = new SonarSimulator({ beamCount: 1, maxRange: 8 });
    const frame = sonar.generateFrame(Math.PI / 2, uuv(Math.PI / 2), [rock('north-rock', 0, 4)], []);

    expect(frame.beams[0].hit?.id).toBe('north-rock');
  });

  it('does not detect objects behind the UUV', () => {
    const sonar = new SonarSimulator({ beamCount: 5, maxRange: 8 });
    const frame = sonar.generateFrame(0, uuv(), [rock('behind', -2, 0)], []);

    expect(frame.detections).toEqual([]);
  });

  it('returns the nearest hit when an obstacle occludes a target', () => {
    const sonar = new SonarSimulator({ beamCount: 1, maxRange: 8 });
    const frame = sonar.generateFrame(
      0,
      uuv(),
      [rock('front-rock', 2, 0)],
      [victim('behind-victim', 4, 0)],
    );

    expect(frame.beams[0].hit?.id).toBe('front-rock');
    expect(frame.detections.map((detection) => detection.id)).toEqual(['front-rock']);
  });

  it('is deterministic for identical inputs', () => {
    const sonar = new SonarSimulator({ beamCount: 9 });
    const obstacles = [rock('rock-1', 3, 0.2)];
    const targets = [victim('victim-1', 5, -0.4)];

    const first = sonar.generateFrame(2, uuv(), obstacles, targets);
    const second = sonar.generateFrame(2, uuv(), obstacles, targets);

    expect(second).toEqual(first);
  });
});
