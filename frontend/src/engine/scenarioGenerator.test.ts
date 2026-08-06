/**
 * Unit tests for scenario generator
 */

import { describe, it, expect } from 'vitest';
import { generateScenario } from './scenarioGenerator';
import type { ScenarioName, Difficulty } from '../types';

describe('generateScenario', () => {
  describe('Reproducibility', () => {
    it('should produce identical output for same seed and parameters', () => {
      const seed = 42;
      const scenarioName: ScenarioName = 'normal';
      const difficulty: Difficulty = 'standard';

      const scenario1 = generateScenario(seed, scenarioName, difficulty);
      const scenario2 = generateScenario(seed, scenarioName, difficulty);

      expect(scenario1).toEqual(scenario2);
    });

    it('should produce identical obstacle positions for same seed', () => {
      const seed = 12345;
      
      const scenario1 = generateScenario(seed, 'normal', 'standard');
      const scenario2 = generateScenario(seed, 'normal', 'standard');

      expect(scenario1.obstacles).toHaveLength(scenario2.obstacles.length);
      
      for (let i = 0; i < scenario1.obstacles.length; i++) {
        expect(scenario1.obstacles[i].position.x).toBe(scenario2.obstacles[i].position.x);
        expect(scenario1.obstacles[i].position.y).toBe(scenario2.obstacles[i].position.y);
      }
    });

    it('should produce identical target positions for same seed', () => {
      const seed = 99;
      
      const scenario1 = generateScenario(seed, 'normal', 'standard');
      const scenario2 = generateScenario(seed, 'normal', 'standard');

      expect(scenario1.targets).toHaveLength(scenario2.targets.length);
      
      for (let i = 0; i < scenario1.targets.length; i++) {
        expect(scenario1.targets[i].position.x).toBe(scenario2.targets[i].position.x);
        expect(scenario1.targets[i].position.y).toBe(scenario2.targets[i].position.y);
      }
    });

    it('should produce identical vehicle config for same seed', () => {
      const seed = 777;
      
      const scenario1 = generateScenario(seed, 'normal', 'standard');
      const scenario2 = generateScenario(seed, 'normal', 'standard');

      expect(scenario1.vehicleConfig.initialPose.position.x)
        .toBe(scenario2.vehicleConfig.initialPose.position.x);
      expect(scenario1.vehicleConfig.initialPose.position.y)
        .toBe(scenario2.vehicleConfig.initialPose.position.y);
      expect(scenario1.vehicleConfig.initialPose.heading)
        .toBe(scenario2.vehicleConfig.initialPose.heading);
    });

    it('should produce identical water current for same seed', () => {
      const seed = 555;
      
      const scenario1 = generateScenario(seed, 'low_visibility', 'standard');
      const scenario2 = generateScenario(seed, 'low_visibility', 'standard');

      expect(scenario1.waterCurrent.magnitude).toBe(scenario2.waterCurrent.magnitude);
      expect(scenario1.waterCurrent.direction).toBe(scenario2.waterCurrent.direction);
    });
  });

  describe('Different seeds', () => {
    it('should produce different starting positions for different seeds', () => {
      const scenario1 = generateScenario(1, 'normal', 'standard');
      const scenario2 = generateScenario(2, 'normal', 'standard');

      expect(scenario1.startingPosition).not.toEqual(scenario2.startingPosition);
    });

    it('should produce different obstacle configurations for different seeds', () => {
      const scenario1 = generateScenario(100, 'normal', 'standard');
      const scenario2 = generateScenario(200, 'normal', 'standard');

      // Should have same count but different positions
      expect(scenario1.obstacles).toHaveLength(scenario2.obstacles.length);
      
      let differentPositions = false;
      for (let i = 0; i < scenario1.obstacles.length; i++) {
        if (
          scenario1.obstacles[i].position.x !== scenario2.obstacles[i].position.x ||
          scenario1.obstacles[i].position.y !== scenario2.obstacles[i].position.y
        ) {
          differentPositions = true;
          break;
        }
      }
      
      expect(differentPositions).toBe(true);
    });

    it('should produce different target positions for different seeds', () => {
      const scenario1 = generateScenario(42, 'normal', 'standard');
      const scenario2 = generateScenario(43, 'normal', 'standard');

      expect(scenario1.targetPosition).not.toEqual(scenario2.targetPosition);
    });
  });

  describe('Scenario templates - normal', () => {
    it('should have correct normal scenario parameters', () => {
      const scenario = generateScenario(42, 'normal', 'standard');

      expect(scenario.scenarioName).toBe('normal');
      expect(scenario.visibility).toBe(1.0);
      expect(scenario.initialOxygen).toBe(100);
      expect(scenario.waterCurrent.magnitude).toBe(0);
    });

    it('should generate obstacles for normal scenario', () => {
      const scenario = generateScenario(42, 'normal', 'standard');

      expect(scenario.obstacles.length).toBeGreaterThanOrEqual(4);
      expect(scenario.obstacles.length).toBeLessThanOrEqual(6);
      
      // Should have rocks and pipes
      const rocks = scenario.obstacles.filter(o => o.type === 'rock');
      const pipes = scenario.obstacles.filter(o => o.type === 'pipe');
      
      expect(rocks.length).toBeGreaterThan(0);
      expect(pipes.length).toBeGreaterThan(0);
    });

    it('should increase obstacle density for low visibility', () => {
      const normal = generateScenario(42, 'normal', 'standard');
      const lowVisibility = generateScenario(42, 'low_visibility', 'standard');

      expect(lowVisibility.obstacles.length).toBeGreaterThan(normal.obstacles.length);
    });

    it('should generate targets for normal scenario', () => {
      const scenario = generateScenario(42, 'normal', 'standard');

      expect(scenario.targets.length).toBeGreaterThan(0);
      
      // Should have vehicle, external victim, and internal victim
      const vehicle = scenario.targets.find(t => t.type === 'vehicle');
      const externalVictims = scenario.targets.filter(t => t.type === 'external_victim');
      const internalVictims = scenario.targets.filter(t => t.type === 'internal_victim');
      
      expect(vehicle).toBeDefined();
      expect(externalVictims.length).toBeGreaterThan(0);
      expect(internalVictims.length).toBeGreaterThan(0);
    });
  });

  describe('Scenario templates - low_visibility', () => {
    it('should have correct low_visibility scenario parameters', () => {
      const scenario = generateScenario(42, 'low_visibility', 'standard');

      expect(scenario.scenarioName).toBe('low_visibility');
      expect(scenario.visibility).toBe(0.35);
      expect(scenario.initialOxygen).toBe(100);
      expect(scenario.waterCurrent.magnitude).toBe(0.1);
    });
  });

  describe('Scenario templates - low_oxygen', () => {
    it('should have correct low_oxygen scenario parameters', () => {
      const scenario = generateScenario(42, 'low_oxygen', 'standard');

      expect(scenario.scenarioName).toBe('low_oxygen');
      expect(scenario.visibility).toBe(1.0);
      expect(scenario.initialOxygen).toBe(25);
      expect(scenario.waterCurrent.magnitude).toBe(0.1);
    });
  });

  describe('Difficulty levels', () => {
    it('should generate fewer obstacles for easy difficulty', () => {
      const easy = generateScenario(42, 'normal', 'easy');
      const standard = generateScenario(42, 'normal', 'standard');

      expect(easy.obstacles.length).toBeLessThan(standard.obstacles.length);
    });

    it('should generate more obstacles for hard difficulty', () => {
      const standard = generateScenario(42, 'normal', 'standard');
      const hard = generateScenario(42, 'normal', 'hard');

      expect(hard.obstacles.length).toBeGreaterThan(standard.obstacles.length);
    });

    it('should have consistent obstacle counts for same difficulty', () => {
      const scenario1 = generateScenario(1, 'normal', 'standard');
      const scenario2 = generateScenario(2, 'normal', 'standard');
      const scenario3 = generateScenario(3, 'normal', 'standard');

      // All should have same count (deterministic based on difficulty)
      expect(scenario1.obstacles.length).toBe(scenario2.obstacles.length);
      expect(scenario2.obstacles.length).toBe(scenario3.obstacles.length);
    });

    it('should affect water current magnitude with difficulty', () => {
      const easy = generateScenario(42, 'low_visibility', 'easy');
      const standard = generateScenario(42, 'low_visibility', 'standard');
      const hard = generateScenario(42, 'low_visibility', 'hard');

      expect(easy.waterCurrent.magnitude).toBeLessThan(standard.waterCurrent.magnitude);
      expect(hard.waterCurrent.magnitude).toBeGreaterThan(standard.waterCurrent.magnitude);
    });
  });

  describe('Mission boundary', () => {
    it('should generate standard 100x100 boundary', () => {
      const scenario = generateScenario(42, 'normal', 'standard');

      expect(scenario.missionBoundary.minX).toBe(0);
      expect(scenario.missionBoundary.maxX).toBe(100);
      expect(scenario.missionBoundary.minY).toBe(0);
      expect(scenario.missionBoundary.maxY).toBe(100);
    });

    it('should keep starting position within boundary', () => {
      const scenario = generateScenario(42, 'normal', 'standard');

      expect(scenario.startingPosition.x).toBeGreaterThanOrEqual(scenario.missionBoundary.minX);
      expect(scenario.startingPosition.x).toBeLessThanOrEqual(scenario.missionBoundary.maxX);
      expect(scenario.startingPosition.y).toBeGreaterThanOrEqual(scenario.missionBoundary.minY);
      expect(scenario.startingPosition.y).toBeLessThanOrEqual(scenario.missionBoundary.maxY);
    });

    it('should keep target position within boundary', () => {
      const scenario = generateScenario(42, 'normal', 'standard');

      expect(scenario.targetPosition.x).toBeGreaterThanOrEqual(scenario.missionBoundary.minX);
      expect(scenario.targetPosition.x).toBeLessThanOrEqual(scenario.missionBoundary.maxX);
      expect(scenario.targetPosition.y).toBeGreaterThanOrEqual(scenario.missionBoundary.minY);
      expect(scenario.targetPosition.y).toBeLessThanOrEqual(scenario.missionBoundary.maxY);
    });

    it('should keep all obstacles within boundary', () => {
      const scenario = generateScenario(42, 'normal', 'standard');

      for (const obstacle of scenario.obstacles) {
        expect(obstacle.position.x).toBeGreaterThanOrEqual(scenario.missionBoundary.minX);
        expect(obstacle.position.x).toBeLessThanOrEqual(scenario.missionBoundary.maxX);
        expect(obstacle.position.y).toBeGreaterThanOrEqual(scenario.missionBoundary.minY);
        expect(obstacle.position.y).toBeLessThanOrEqual(scenario.missionBoundary.maxY);
      }
    });
  });

  describe('Vehicle configuration', () => {
    it('should have valid vehicle radius', () => {
      const scenario = generateScenario(42, 'normal', 'standard');

      expect(scenario.vehicleConfig.radius).toBeGreaterThan(0);
    });

    it('should have valid max velocities', () => {
      const scenario = generateScenario(42, 'normal', 'standard');

      expect(scenario.vehicleConfig.maxVelocity).toBeGreaterThan(0);
      expect(scenario.vehicleConfig.maxAngularVelocity).toBeGreaterThan(0);
    });

    it('should have initial pose at starting position', () => {
      const scenario = generateScenario(42, 'normal', 'standard');

      expect(scenario.vehicleConfig.initialPose.position.x).toBe(scenario.startingPosition.x);
      expect(scenario.vehicleConfig.initialPose.position.y).toBe(scenario.startingPosition.y);
    });
  });

  describe('Obstacle types', () => {
    it('should generate rocks with radius', () => {
      const scenario = generateScenario(42, 'normal', 'standard');
      const rocks = scenario.obstacles.filter(o => o.type === 'rock');

      for (const rock of rocks) {
        expect(rock.type).toBe('rock');
        expect('radius' in rock).toBe(true);
        if ('radius' in rock) {
          expect(rock.radius).toBeGreaterThan(0);
        }
      }
    });

    it('should generate pipes with width, height, and rotation', () => {
      const scenario = generateScenario(42, 'normal', 'standard');
      const pipes = scenario.obstacles.filter(o => o.type === 'pipe');

      for (const pipe of pipes) {
        expect(pipe.type).toBe('pipe');
        expect('width' in pipe).toBe(true);
        expect('height' in pipe).toBe(true);
        expect('rotation' in pipe).toBe(true);
        
        if ('width' in pipe && 'height' in pipe) {
          expect(pipe.width).toBeGreaterThan(0);
          expect(pipe.height).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('Target types and modalities', () => {
    it('should have vehicle target with sonar modality', () => {
      const scenario = generateScenario(42, 'normal', 'standard');
      const vehicle = scenario.targets.find(t => t.type === 'vehicle');

      expect(vehicle).toBeDefined();
      expect(vehicle?.modality).toBe('sonar');
    });

    it('should have internal victim with marker modality', () => {
      const scenario = generateScenario(42, 'normal', 'standard');
      const internalVictim = scenario.targets.find(t => t.type === 'internal_victim');

      expect(internalVictim).toBeDefined();
      expect(internalVictim?.modality).toBe('marker');
    });

    it('should have external victims near vehicle', () => {
      const scenario = generateScenario(42, 'normal', 'standard');
      const vehicle = scenario.targets.find(t => t.type === 'vehicle');
      const externalVictims = scenario.targets.filter(t => t.type === 'external_victim');

      expect(vehicle).toBeDefined();
      expect(externalVictims.length).toBeGreaterThan(0);

      // External victims should be within 5 meters of vehicle
      for (const victim of externalVictims) {
        const dx = victim.position.x - vehicle!.position.x;
        const dy = victim.position.y - vehicle!.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        expect(distance).toBeLessThan(5);
      }
    });

    it('should have internal victim at same position as vehicle', () => {
      const scenario = generateScenario(42, 'normal', 'standard');
      const vehicle = scenario.targets.find(t => t.type === 'vehicle');
      const internalVictim = scenario.targets.find(t => t.type === 'internal_victim');

      expect(vehicle).toBeDefined();
      expect(internalVictim).toBeDefined();
      expect(internalVictim?.position.x).toBe(vehicle?.position.x);
      expect(internalVictim?.position.y).toBe(vehicle?.position.y);
    });
  });

  describe('Configuration metadata', () => {
    it('should set correct seed', () => {
      const scenario = generateScenario(12345, 'normal', 'standard');
      expect(scenario.seed).toBe(12345);
    });

    it('should set correct scenario name', () => {
      const scenario = generateScenario(42, 'low_oxygen', 'standard');
      expect(scenario.scenarioName).toBe('low_oxygen');
    });

    it('should set correct difficulty', () => {
      const scenario = generateScenario(42, 'normal', 'hard');
      expect(scenario.difficulty).toBe('hard');
    });

    it('should always start with full battery', () => {
      const scenario1 = generateScenario(1, 'normal', 'standard');
      const scenario2 = generateScenario(2, 'low_visibility', 'hard');
      const scenario3 = generateScenario(3, 'low_oxygen', 'easy');

      expect(scenario1.initialBattery).toBe(100);
      expect(scenario2.initialBattery).toBe(100);
      expect(scenario3.initialBattery).toBe(100);
    });

    it('should set timestep to 0.1 seconds', () => {
      const scenario = generateScenario(42, 'normal', 'standard');
      expect(scenario.timestep).toBe(0.1);
    });
  });

  describe('No Math.random() usage', () => {
    it('should be deterministic without Math.random()', () => {
      // This test verifies determinism by running twice
      // If Math.random() were used, results would differ
      const scenario1 = generateScenario(999, 'normal', 'standard');
      const scenario2 = generateScenario(999, 'normal', 'standard');

      expect(JSON.stringify(scenario1)).toBe(JSON.stringify(scenario2));
    });
  });
});
