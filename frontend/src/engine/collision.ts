/**
 * 2D collision and clearance helpers for the browser simulator.
 *
 * The UUV is modeled as a circle. Rocks and vehicles are circular; pipes are
 * represented as rotated rectangles. The functions are pure and deterministic.
 */

import type { ObstacleConfig, Position2D } from '../types';

export interface CircleBody {
  position: Position2D;
  radius: number;
}

export interface RectangleBody {
  position: Position2D;
  width: number;
  height: number;
  rotation: number;
}

function squaredDistance(a: Position2D, b: Position2D): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

/** Check overlap between two circular bodies, including touching contact. */
export function checkCircleCircleCollision(a: CircleBody, b: CircleBody): boolean {
  const radius = a.radius + b.radius;
  return squaredDistance(a.position, b.position) <= radius * radius;
}

/** Rotate a world-space point into a rectangle's local coordinate frame. */
function toRectangleLocal(point: Position2D, rectangle: RectangleBody): Position2D {
  const dx = point.x - rectangle.position.x;
  const dy = point.y - rectangle.position.y;
  const cos = Math.cos(rectangle.rotation);
  const sin = Math.sin(rectangle.rotation);

  return {
    x: dx * cos + dy * sin,
    y: -dx * sin + dy * cos,
  };
}

/** Check overlap between a circle and a possibly rotated rectangle. */
export function checkCircleRectangleCollision(
  circle: CircleBody,
  rectangle: RectangleBody,
): boolean {
  const local = toRectangleLocal(circle.position, rectangle);
  const halfWidth = rectangle.width / 2;
  const halfHeight = rectangle.height / 2;
  const closestX = Math.max(-halfWidth, Math.min(local.x, halfWidth));
  const closestY = Math.max(-halfHeight, Math.min(local.y, halfHeight));
  const dx = local.x - closestX;
  const dy = local.y - closestY;

  return dx * dx + dy * dy <= circle.radius * circle.radius;
}

/** Dispatch collision detection based on the configured obstacle shape. */
export function checkCollision(uuv: CircleBody, obstacle: ObstacleConfig): boolean {
  if (obstacle.type === 'pipe') {
    return checkCircleRectangleCollision(uuv, {
      position: obstacle.position,
      width: obstacle.width,
      height: obstacle.height,
      rotation: obstacle.rotation,
    });
  }

  return checkCircleCircleCollision(uuv, {
    position: obstacle.position,
    radius: obstacle.radius,
  });
}

/** Return the signed clearance between two circles; negative means overlap. */
export function circleCircleClearance(a: CircleBody, b: CircleBody): number {
  return Math.sqrt(squaredDistance(a.position, b.position)) - a.radius - b.radius;
}

