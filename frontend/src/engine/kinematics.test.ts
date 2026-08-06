/**
 * Unit tests for 2D kinematic motion model
 */

import { describe, it, expect } from 'vitest';
import {
  updateUUVKinematics,
  computeVelocity,
  normalizeAngle,
  type UUVPose,
} from './kinematics';

describe('updateUUVKinematics', () => {
  describe('Forward motion at heading 0 (East)', () => {
    it('should move forward along X axis', () => {
      const pose: UUVPose = {
        position: { x: 0, y: 0 },
        heading: 0, // 0 radians = East
      };
      
      const newPose = updateUUVKinematics({
        pose,
        forwardVelocity: 1.0,  // 1 m/s forward
        angularVelocity: 0,
        current: { x: 0, y: 0 },
        dt: 0.1,  // 0.1 second
      });
      
      expect(newPose.position.x).toBeCloseTo(0.1, 6);
      expect(newPose.position.y).toBeCloseTo(0, 6);
      expect(newPose.heading).toBeCloseTo(0, 6);
    });

    it('should accumulate position over multiple steps', () => {
      let pose: UUVPose = {
        position: { x: 0, y: 0 },
        heading: 0,
      };
      
      // Simulate 10 steps of 0.1 seconds each
      for (let i = 0; i < 10; i++) {
        pose = updateUUVKinematics({
          pose,
          forwardVelocity: 1.0,
          angularVelocity: 0,
          current: { x: 0, y: 0 },
          dt: 0.1,
        });
      }
      
      expect(pose.position.x).toBeCloseTo(1.0, 6);
      expect(pose.position.y).toBeCloseTo(0, 6);
    });

    it('should not mutate the input pose', () => {
      const pose: UUVPose = {
        position: { x: 0, y: 0 },
        heading: 0,
      };
      
      const originalX = pose.position.x;
      const originalY = pose.position.y;
      const originalHeading = pose.heading;
      
      updateUUVKinematics({
        pose,
        forwardVelocity: 1.0,
        angularVelocity: 0,
        current: { x: 0, y: 0 },
        dt: 0.1,
      });
      
      // Original pose should be unchanged
      expect(pose.position.x).toBe(originalX);
      expect(pose.position.y).toBe(originalY);
      expect(pose.heading).toBe(originalHeading);
    });
  });

  describe('Forward motion at heading π/2 (North)', () => {
    it('should move forward along Y axis', () => {
      const pose: UUVPose = {
        position: { x: 0, y: 0 },
        heading: Math.PI / 2, // π/2 radians = North
      };
      
      const newPose = updateUUVKinematics({
        pose,
        forwardVelocity: 1.0,
        angularVelocity: 0,
        current: { x: 0, y: 0 },
        dt: 0.1,
      });
      
      expect(newPose.position.x).toBeCloseTo(0, 6);
      expect(newPose.position.y).toBeCloseTo(0.1, 6);
      expect(newPose.heading).toBeCloseTo(Math.PI / 2, 6);
    });

    it('should move at 45 degrees (π/4)', () => {
      const pose: UUVPose = {
        position: { x: 0, y: 0 },
        heading: Math.PI / 4, // 45 degrees
      };
      
      const newPose = updateUUVKinematics({
        pose,
        forwardVelocity: 1.0,
        angularVelocity: 0,
        current: { x: 0, y: 0 },
        dt: 0.1,
      });
      
      // At 45 degrees, x and y components should be equal
      const expected = 0.1 * Math.cos(Math.PI / 4);
      expect(newPose.position.x).toBeCloseTo(expected, 6);
      expect(newPose.position.y).toBeCloseTo(expected, 6);
    });

    it('should move backward along Y axis at heading π/2 with negative velocity', () => {
      const pose: UUVPose = {
        position: { x: 0, y: 0 },
        heading: Math.PI / 2,
      };
      
      const newPose = updateUUVKinematics({
        pose,
        forwardVelocity: -1.0, // Backward
        angularVelocity: 0,
        current: { x: 0, y: 0 },
        dt: 0.1,
      });
      
      expect(newPose.position.x).toBeCloseTo(0, 6);
      expect(newPose.position.y).toBeCloseTo(-0.1, 6);
    });
  });

  describe('Water current disturbance', () => {
    it('should apply constant current in X direction', () => {
      const pose: UUVPose = {
        position: { x: 0, y: 0 },
        heading: 0,
      };
      
      const newPose = updateUUVKinematics({
        pose,
        forwardVelocity: 1.0,
        angularVelocity: 0,
        current: { x: 0.5, y: 0 }, // 0.5 m/s current in X
        dt: 0.1,
      });
      
      // Total velocity = 1.0 + 0.5 = 1.5 m/s
      expect(newPose.position.x).toBeCloseTo(0.15, 6);
      expect(newPose.position.y).toBeCloseTo(0, 6);
    });

    it('should apply constant current in Y direction', () => {
      const pose: UUVPose = {
        position: { x: 0, y: 0 },
        heading: 0,
      };
      
      const newPose = updateUUVKinematics({
        pose,
        forwardVelocity: 1.0,
        angularVelocity: 0,
        current: { x: 0, y: 0.5 }, // 0.5 m/s current in Y
        dt: 0.1,
      });
      
      expect(newPose.position.x).toBeCloseTo(0.1, 6);
      expect(newPose.position.y).toBeCloseTo(0.05, 6); // Current effect
    });

    it('should apply current in both X and Y directions', () => {
      const pose: UUVPose = {
        position: { x: 0, y: 0 },
        heading: 0,
      };
      
      const newPose = updateUUVKinematics({
        pose,
        forwardVelocity: 1.0,
        angularVelocity: 0,
        current: { x: 0.2, y: 0.3 },
        dt: 0.1,
      });
      
      expect(newPose.position.x).toBeCloseTo(0.12, 6); // 1.0 + 0.2
      expect(newPose.position.y).toBeCloseTo(0.03, 6); // 0 + 0.3
    });

    it('should drift with current when velocity is zero', () => {
      const pose: UUVPose = {
        position: { x: 0, y: 0 },
        heading: 0,
      };
      
      const newPose = updateUUVKinematics({
        pose,
        forwardVelocity: 0, // No forward velocity
        angularVelocity: 0,
        current: { x: 1.0, y: 0.5 },
        dt: 0.1,
      });
      
      expect(newPose.position.x).toBeCloseTo(0.1, 6);
      expect(newPose.position.y).toBeCloseTo(0.05, 6);
    });

    it('should handle negative current (opposing motion)', () => {
      const pose: UUVPose = {
        position: { x: 0, y: 0 },
        heading: 0,
      };
      
      const newPose = updateUUVKinematics({
        pose,
        forwardVelocity: 1.0,
        angularVelocity: 0,
        current: { x: -0.5, y: 0 }, // Current opposing motion
        dt: 0.1,
      });
      
      // Net velocity = 1.0 - 0.5 = 0.5 m/s
      expect(newPose.position.x).toBeCloseTo(0.05, 6);
      expect(newPose.position.y).toBeCloseTo(0, 6);
    });
  });

  describe('Angular rotation', () => {
    it('should rotate heading with positive angular velocity', () => {
      const pose: UUVPose = {
        position: { x: 0, y: 0 },
        heading: 0,
      };
      
      const newPose = updateUUVKinematics({
        pose,
        forwardVelocity: 0,
        angularVelocity: 1.0, // 1 rad/s
        current: { x: 0, y: 0 },
        dt: 0.1,
      });
      
      expect(newPose.heading).toBeCloseTo(0.1, 6);
      expect(newPose.position.x).toBeCloseTo(0, 6);
      expect(newPose.position.y).toBeCloseTo(0, 6);
    });

    it('should rotate heading with negative angular velocity', () => {
      const pose: UUVPose = {
        position: { x: 0, y: 0 },
        heading: 0,
      };
      
      const newPose = updateUUVKinematics({
        pose,
        forwardVelocity: 0,
        angularVelocity: -1.0, // -1 rad/s
        current: { x: 0, y: 0 },
        dt: 0.1,
      });
      
      expect(newPose.heading).toBeCloseTo(-0.1, 6);
    });

    it('should rotate 90 degrees (π/2) over time', () => {
      let pose: UUVPose = {
        position: { x: 0, y: 0 },
        heading: 0,
      };
      
      const angularVelocity = Math.PI / 2; // π/2 rad/s
      const dt = 0.1;
      const steps = 10; // 1 second total
      
      for (let i = 0; i < steps; i++) {
        pose = updateUUVKinematics({
          pose,
          forwardVelocity: 0,
          angularVelocity,
          current: { x: 0, y: 0 },
          dt,
        });
      }
      
      expect(pose.heading).toBeCloseTo(Math.PI / 2, 6);
    });

    it('should combine forward motion with rotation', () => {
      const pose: UUVPose = {
        position: { x: 0, y: 0 },
        heading: 0,
      };
      
      const newPose = updateUUVKinematics({
        pose,
        forwardVelocity: 1.0,
        angularVelocity: 0.5,
        current: { x: 0, y: 0 },
        dt: 0.1,
      });
      
      // Should move forward and rotate
      expect(newPose.position.x).toBeCloseTo(0.1, 6);
      expect(newPose.position.y).toBeCloseTo(0, 6);
      expect(newPose.heading).toBeCloseTo(0.05, 6);
    });
  });

  describe('Zero velocity (stationary)', () => {
    it('should remain stationary with zero velocities and no current', () => {
      const pose: UUVPose = {
        position: { x: 5, y: 10 },
        heading: Math.PI / 4,
      };
      
      const newPose = updateUUVKinematics({
        pose,
        forwardVelocity: 0,
        angularVelocity: 0,
        current: { x: 0, y: 0 },
        dt: 0.1,
      });
      
      expect(newPose.position.x).toBeCloseTo(5, 6);
      expect(newPose.position.y).toBeCloseTo(10, 6);
      expect(newPose.heading).toBeCloseTo(Math.PI / 4, 6);
    });

    it('should only drift with current when velocities are zero', () => {
      const pose: UUVPose = {
        position: { x: 0, y: 0 },
        heading: Math.PI / 2,
      };
      
      const newPose = updateUUVKinematics({
        pose,
        forwardVelocity: 0,
        angularVelocity: 0,
        current: { x: 0.5, y: 0.5 },
        dt: 0.1,
      });
      
      expect(newPose.position.x).toBeCloseTo(0.05, 6);
      expect(newPose.position.y).toBeCloseTo(0.05, 6);
      expect(newPose.heading).toBeCloseTo(Math.PI / 2, 6);
    });
  });

  describe('Edge cases', () => {
    it('should handle very small timestep', () => {
      const pose: UUVPose = {
        position: { x: 0, y: 0 },
        heading: 0,
      };
      
      const newPose = updateUUVKinematics({
        pose,
        forwardVelocity: 1.0,
        angularVelocity: 0,
        current: { x: 0, y: 0 },
        dt: 0.001, // 1 millisecond
      });
      
      expect(newPose.position.x).toBeCloseTo(0.001, 6);
    });

    it('should handle large timestep', () => {
      const pose: UUVPose = {
        position: { x: 0, y: 0 },
        heading: 0,
      };
      
      const newPose = updateUUVKinematics({
        pose,
        forwardVelocity: 1.0,
        angularVelocity: 0,
        current: { x: 0, y: 0 },
        dt: 1.0, // 1 second
      });
      
      expect(newPose.position.x).toBeCloseTo(1.0, 6);
    });

    it('should handle heading at π (West)', () => {
      const pose: UUVPose = {
        position: { x: 0, y: 0 },
        heading: Math.PI,
      };
      
      const newPose = updateUUVKinematics({
        pose,
        forwardVelocity: 1.0,
        angularVelocity: 0,
        current: { x: 0, y: 0 },
        dt: 0.1,
      });
      
      expect(newPose.position.x).toBeCloseTo(-0.1, 6);
      expect(newPose.position.y).toBeCloseTo(0, 6);
    });

    it('should handle heading at -π/2 (South)', () => {
      const pose: UUVPose = {
        position: { x: 0, y: 0 },
        heading: -Math.PI / 2,
      };
      
      const newPose = updateUUVKinematics({
        pose,
        forwardVelocity: 1.0,
        angularVelocity: 0,
        current: { x: 0, y: 0 },
        dt: 0.1,
      });
      
      expect(newPose.position.x).toBeCloseTo(0, 6);
      expect(newPose.position.y).toBeCloseTo(-0.1, 6);
    });
  });
});

describe('computeVelocity', () => {
  it('should compute velocity components at heading 0', () => {
    const pose: UUVPose = {
      position: { x: 0, y: 0 },
      heading: 0,
    };
    
    const velocity = computeVelocity(pose, 1.0, { x: 0, y: 0 });
    
    expect(velocity.vx).toBeCloseTo(1.0, 6);
    expect(velocity.vy).toBeCloseTo(0, 6);
  });

  it('should compute velocity components at heading π/2', () => {
    const pose: UUVPose = {
      position: { x: 0, y: 0 },
      heading: Math.PI / 2,
    };
    
    const velocity = computeVelocity(pose, 1.0, { x: 0, y: 0 });
    
    expect(velocity.vx).toBeCloseTo(0, 6);
    expect(velocity.vy).toBeCloseTo(1.0, 6);
  });

  it('should include water current in velocity', () => {
    const pose: UUVPose = {
      position: { x: 0, y: 0 },
      heading: 0,
    };
    
    const velocity = computeVelocity(pose, 1.0, { x: 0.5, y: 0.3 });
    
    expect(velocity.vx).toBeCloseTo(1.5, 6);
    expect(velocity.vy).toBeCloseTo(0.3, 6);
  });
});

describe('normalizeAngle', () => {
  it('should keep angles in range [-π, π]', () => {
    expect(normalizeAngle(0)).toBeCloseTo(0, 6);
    expect(normalizeAngle(Math.PI)).toBeCloseTo(Math.PI, 6);
    expect(normalizeAngle(-Math.PI)).toBeCloseTo(-Math.PI, 6);
  });

  it('should normalize angles greater than π', () => {
    expect(normalizeAngle(1.5 * Math.PI)).toBeCloseTo(-0.5 * Math.PI, 6);
    expect(normalizeAngle(2 * Math.PI)).toBeCloseTo(0, 6);
  });

  it('should normalize angles less than -π', () => {
    expect(normalizeAngle(-1.5 * Math.PI)).toBeCloseTo(0.5 * Math.PI, 6);
    expect(normalizeAngle(-2 * Math.PI)).toBeCloseTo(0, 6);
  });

  it('should handle multiple rotations', () => {
    expect(normalizeAngle(3 * Math.PI)).toBeCloseTo(Math.PI, 6);
    expect(normalizeAngle(-3 * Math.PI)).toBeCloseTo(-Math.PI, 6);
    expect(normalizeAngle(4 * Math.PI)).toBeCloseTo(0, 6);
  });
});
