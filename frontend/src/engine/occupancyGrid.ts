/**
 * Local 2D occupancy grid built from sonar ray observations.
 */

import type { Position2D } from '../types';
import type { SonarFrame } from './sonarSimulator';

export type OccupancyState = 'unknown' | 'free' | 'occupied';

export interface OccupancyGridConfig {
  width: number;
  height: number;
  resolution: number;
  origin: Position2D;
}

export interface OccupancyCell {
  x: number;
  y: number;
  state: OccupancyState;
}

export const DEFAULT_OCCUPANCY_GRID_CONFIG: OccupancyGridConfig = {
  width: 100,
  height: 100,
  resolution: 1,
  origin: { x: 0, y: 0 },
};

const STATE_PRIORITY: Record<OccupancyState, number> = {
  unknown: 0,
  free: 1,
  occupied: 2,
};

function cloneConfig(config: OccupancyGridConfig): OccupancyGridConfig {
  return { ...config, origin: { ...config.origin } };
}

export class OccupancyGrid {
  private readonly config: OccupancyGridConfig;
  private readonly cells: OccupancyState[];

  constructor(config: Partial<OccupancyGridConfig> = {}) {
    this.config = {
      ...DEFAULT_OCCUPANCY_GRID_CONFIG,
      ...config,
      origin: { ...DEFAULT_OCCUPANCY_GRID_CONFIG.origin, ...config.origin },
    };

    if (!Number.isInteger(this.config.width) || this.config.width <= 0) {
      throw new Error('width must be a positive integer');
    }
    if (!Number.isInteger(this.config.height) || this.config.height <= 0) {
      throw new Error('height must be a positive integer');
    }
    if (this.config.resolution <= 0) throw new Error('resolution must be positive');

    this.cells = Array.from(
      { length: this.config.width * this.config.height },
      () => 'unknown' as OccupancyState,
    );
  }

  getConfig(): OccupancyGridConfig {
    return cloneConfig(this.config);
  }

  reset(): void {
    this.cells.fill('unknown');
  }

  worldToGrid(position: Position2D): { x: number; y: number } | null {
    const x = Math.floor((position.x - this.config.origin.x) / this.config.resolution);
    const y = Math.floor((position.y - this.config.origin.y) / this.config.resolution);
    return this.isInBounds(x, y) ? { x, y } : null;
  }

  gridToWorld(x: number, y: number): Position2D {
    return {
      x: this.config.origin.x + (x + 0.5) * this.config.resolution,
      y: this.config.origin.y + (y + 0.5) * this.config.resolution,
    };
  }

  getCell(x: number, y: number): OccupancyState {
    if (!this.isInBounds(x, y)) return 'unknown';
    return this.cells[this.index(x, y)];
  }

  setCell(x: number, y: number, state: OccupancyState): void {
    if (!this.isInBounds(x, y)) return;
    const index = this.index(x, y);
    const current = this.cells[index];
    if (STATE_PRIORITY[state] >= STATE_PRIORITY[current]) this.cells[index] = state;
  }

  /** Update free/occupied cells from all beams in a sonar frame. */
  updateFromSonar(uuvPosition: Position2D, frame: SonarFrame): void {
    for (const beam of frame.beams) {
      const step = Math.max(this.config.resolution / 2, 0.05);
      const freeDistance = beam.hit ? Math.max(0, beam.range - step) : beam.range;

      for (let distance = 0; distance <= freeDistance; distance += step) {
        const position = {
          x: uuvPosition.x + Math.cos(beam.worldAngle) * distance,
          y: uuvPosition.y + Math.sin(beam.worldAngle) * distance,
        };
        const cell = this.worldToGrid(position);
        if (cell) this.setCell(cell.x, cell.y, 'free');
      }

      if (beam.hit) {
        const position = {
          x: uuvPosition.x + Math.cos(beam.worldAngle) * beam.range,
          y: uuvPosition.y + Math.sin(beam.worldAngle) * beam.range,
        };
        const cell = this.worldToGrid(position);
        if (cell) this.setCell(cell.x, cell.y, 'occupied');
      }
    }
  }

  toCells(): OccupancyCell[] {
    const result: OccupancyCell[] = [];
    for (let y = 0; y < this.config.height; y += 1) {
      for (let x = 0; x < this.config.width; x += 1) {
        result.push({ x, y, state: this.getCell(x, y) });
      }
    }
    return result;
  }

  private index(x: number, y: number): number {
    return y * this.config.width + x;
  }

  private isInBounds(x: number, y: number): boolean {
    return x >= 0 && x < this.config.width && y >= 0 && y < this.config.height;
  }
}

