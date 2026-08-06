import { describe, expect, it } from 'vitest';
import {
  checkCircleCircleCollision,
  checkCircleRectangleCollision,
  checkCollision,
  circleCircleClearance,
} from './collision';

describe('collision geometry', () => {
  const uuv = { position: { x: 0, y: 0 }, radius: 1 };

  it('detects separated, touching, and overlapping circles', () => {
    expect(checkCircleCircleCollision(uuv, { position: { x: 3, y: 0 }, radius: 1 })).toBe(false);
    expect(checkCircleCircleCollision(uuv, { position: { x: 2, y: 0 }, radius: 1 })).toBe(true);
    expect(checkCircleCircleCollision(uuv, { position: { x: 1, y: 0 }, radius: 1 })).toBe(true);
  });

  it('reports signed circle clearance', () => {
    expect(circleCircleClearance(uuv, { position: { x: 4, y: 0 }, radius: 1 })).toBe(2);
    expect(circleCircleClearance(uuv, { position: { x: 1, y: 0 }, radius: 1 })).toBe(-1);
  });

  it('detects an axis-aligned rectangle', () => {
    const rectangle = { position: { x: 1.5, y: 0 }, width: 2, height: 2, rotation: 0 };

    expect(checkCircleRectangleCollision(uuv, rectangle)).toBe(true);
    expect(checkCircleRectangleCollision({ ...uuv, position: { x: 3.6, y: 0 } }, rectangle)).toBe(false);
  });

  it('detects a rotated rectangle', () => {
    const rectangle = {
      position: { x: 0, y: 3 },
      width: 4,
      height: 1,
      rotation: Math.PI / 2,
    };

    expect(checkCircleRectangleCollision(uuv, rectangle)).toBe(true);
    expect(checkCircleRectangleCollision({ ...uuv, position: { x: 3, y: 0 } }, rectangle)).toBe(false);
  });

  it('dispatches configured rock, pipe, and vehicle shapes', () => {
    expect(checkCollision(uuv, {
      id: 'rock-1',
      type: 'rock',
      position: { x: 1.5, y: 0 },
      radius: 0.5,
    })).toBe(true);

    expect(checkCollision(uuv, {
      id: 'pipe-1',
      type: 'pipe',
      position: { x: 1.5, y: 0 },
      width: 2,
      height: 2,
      rotation: 0,
    })).toBe(true);

    expect(checkCollision(uuv, {
      id: 'vehicle-1',
      type: 'vehicle',
      position: { x: 4, y: 0 },
      radius: 1,
    })).toBe(false);
  });
});
