import { describe, expect, it } from 'vitest';
import { OccupancyGrid } from './occupancyGrid';
import { SonarSimulator } from './sonarSimulator';
import type { ObstacleConfig, UUVState } from '../types';

const uuv: UUVState = {
  position: { x: 1, y: 1 },
  heading: 0,
  velocity: { vx: 0, vy: 0 },
  forwardVelocity: 0,
  angularVelocity: 0,
};

describe('OccupancyGrid', () => {
  it('starts with unknown cells', () => {
    const grid = new OccupancyGrid({ width: 4, height: 3, resolution: 1, origin: { x: 0, y: 0 } });

    expect(grid.getCell(0, 0)).toBe('unknown');
    expect(grid.toCells()).toHaveLength(12);
  });

  it('converts world coordinates to grid cells and back to cell centers', () => {
    const grid = new OccupancyGrid({ width: 4, height: 4, resolution: 1, origin: { x: 0, y: 0 } });

    expect(grid.worldToGrid({ x: 1.2, y: 2.8 })).toEqual({ x: 1, y: 2 });
    expect(grid.gridToWorld(1, 2)).toEqual({ x: 1.5, y: 2.5 });
    expect(grid.worldToGrid({ x: 10, y: 10 })).toBeNull();
  });

  it('preserves occupied evidence over later free evidence', () => {
    const grid = new OccupancyGrid({ width: 4, height: 4 });

    grid.setCell(1, 1, 'occupied');
    grid.setCell(1, 1, 'free');
    expect(grid.getCell(1, 1)).toBe('occupied');
  });

  it('marks free ray cells and the hit cell as occupied', () => {
    const grid = new OccupancyGrid({ width: 12, height: 4, resolution: 1, origin: { x: 0, y: 0 } });
    const sonar = new SonarSimulator({ beamCount: 1, maxRange: 8 });
    const obstacle: ObstacleConfig = {
      id: 'rock-1',
      type: 'rock',
      position: { x: 5, y: 1 },
      radius: 0.5,
    };
    const frame = sonar.generateFrame(0, uuv, [obstacle], []);

    grid.updateFromSonar(uuv.position, frame);

    expect(grid.getCell(1, 1)).toBe('free');
    expect(grid.getCell(3, 1)).toBe('free');
    expect(grid.getCell(4, 1)).toBe('occupied');
    expect(grid.getCell(1, 3)).toBe('unknown');
  });

  it('marks a no-hit beam as free through its measured range', () => {
    const grid = new OccupancyGrid({ width: 12, height: 4, resolution: 1, origin: { x: 0, y: 0 } });
    const sonar = new SonarSimulator({ beamCount: 1, maxRange: 8 });
    const frame = sonar.generateFrame(0, uuv, [], []);

    grid.updateFromSonar(uuv.position, frame);

    expect(grid.getCell(1, 1)).toBe('free');
    expect(grid.getCell(7, 1)).toBe('free');
    expect(grid.getCell(10, 1)).toBe('unknown');
  });

  it('can be reset to an unexplored state', () => {
    const grid = new OccupancyGrid({ width: 3, height: 3 });
    grid.setCell(1, 1, 'occupied');
    grid.reset();
    expect(grid.getCell(1, 1)).toBe('unknown');
  });
});
