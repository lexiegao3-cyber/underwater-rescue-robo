/**
 * 2D Kinematic Motion Model for UUV
 * Implements simplified 2D motion without 3D dynamics, drag, or buoyancy
 */

import type { Position2D, Velocity2D } from '../types';

/**
 * UUV pose (position + heading)
 */
export interface UUVPose {
  position: Position2D;     // Position (meters)
  heading: number;          // Heading angle (radians, 0 = East, π/2 = North)
}

/**
 * Water current vector
 */
export interface CurrentVector {
  x: number;                // X component (m/s)
  y: number;                // Y component (m/s)
}

/**
 * Motion update parameters
 */
export interface MotionUpdateParams {
  pose: UUVPose;                    // Current pose
  forwardVelocity: number;          // Forward velocity command (m/s)
  angularVelocity: number;          // Angular velocity command (rad/s)
  current: CurrentVector;           // Water current disturbance
  dt: number;                       // Timestep (seconds)
}

/**
 * Update UUV pose using 2D kinematic motion model
 * 
 * Equations from design.md section 4a:
 * - x_new = x + (v_cmd * cos(heading) + current_x) * dt
 * - y_new = y + (v_cmd * sin(heading) + current_y) * dt
 * - heading_new = heading + omega_cmd * dt
 * 
 * @param params - Motion update parameters
 * @returns New UUV pose (does not mutate input)
 * 
 * @example
 * const newPose = updateUUVKinematics({
 *   pose: { position: { x: 0, y: 0 }, heading: 0 },
 *   forwardVelocity: 1.0,
 *   angularVelocity: 0,
 *   current: { x: 0, y: 0 },
 *   dt: 0.1
 * });
 * // Result: { position: { x: 0.1, y: 0 }, heading: 0 }
 */
export function updateUUVKinematics(params: MotionUpdateParams): UUVPose {
  const { pose, forwardVelocity, angularVelocity, current, dt } = params;
  
  // Decompose forward velocity into X and Y components based on heading
  const velocityX = forwardVelocity * Math.cos(pose.heading);
  const velocityY = forwardVelocity * Math.sin(pose.heading);
  
  // Add water current disturbance
  const totalVelocityX = velocityX + current.x;
  const totalVelocityY = velocityY + current.y;
  
  // Update position
  const newX = pose.position.x + totalVelocityX * dt;
  const newY = pose.position.y + totalVelocityY * dt;
  
  // Update heading
  const newHeading = pose.heading + angularVelocity * dt;
  
  // Return new pose (pure function - no mutation)
  return {
    position: {
      x: newX,
      y: newY,
    },
    heading: newHeading,
  };
}

/**
 * Compute velocity components from pose and commands
 * 
 * @param pose - Current UUV pose
 * @param forwardVelocity - Forward velocity command (m/s)
 * @param current - Water current disturbance
 * @returns Velocity components in world frame
 */
export function computeVelocity(
  pose: UUVPose,
  forwardVelocity: number,
  current: CurrentVector
): Velocity2D {
  const velocityX = forwardVelocity * Math.cos(pose.heading) + current.x;
  const velocityY = forwardVelocity * Math.sin(pose.heading) + current.y;
  
  return {
    vx: velocityX,
    vy: velocityY,
  };
}

/**
 * Normalize angle to range [-π, π]
 * 
 * @param angle - Angle in radians
 * @returns Normalized angle in [-π, π]
 */
export function normalizeAngle(angle: number): number {
  let normalized = angle % (2 * Math.PI);
  
  if (normalized > Math.PI) {
    normalized -= 2 * Math.PI;
  } else if (normalized < -Math.PI) {
    normalized += 2 * Math.PI;
  }
  
  return normalized;
}
