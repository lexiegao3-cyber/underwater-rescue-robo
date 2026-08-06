/**
 * Unit tests for SeededRNG
 */

import { describe, it, expect } from 'vitest';
import { SeededRNG } from './rng';

describe('SeededRNG', () => {
  describe('Reproducibility', () => {
    it('should produce the same sequence for the same seed', () => {
      const rng1 = new SeededRNG(42);
      const rng2 = new SeededRNG(42);

      const sequence1 = Array.from({ length: 10 }, () => rng1.next());
      const sequence2 = Array.from({ length: 10 }, () => rng2.next());

      expect(sequence1).toEqual(sequence2);
    });

    it('should produce different sequences for different seeds', () => {
      const rng1 = new SeededRNG(42);
      const rng2 = new SeededRNG(43);

      const sequence1 = Array.from({ length: 10 }, () => rng1.next());
      const sequence2 = Array.from({ length: 10 }, () => rng2.next());

      expect(sequence1).not.toEqual(sequence2);
    });

    it('should be deterministic across multiple instances', () => {
      const seed = 12345;
      
      const rng1 = new SeededRNG(seed);
      const value1 = rng1.next();
      const value2 = rng1.next();
      
      const rng2 = new SeededRNG(seed);
      const value3 = rng2.next();
      const value4 = rng2.next();
      
      expect(value1).toBe(value3);
      expect(value2).toBe(value4);
    });
  });

  describe('next()', () => {
    it('should return values in range [0, 1)', () => {
      const rng = new SeededRNG(42);
      
      for (let i = 0; i < 1000; i++) {
        const value = rng.next();
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
      }
    });

    it('should produce different values in sequence', () => {
      const rng = new SeededRNG(42);
      const values = Array.from({ length: 100 }, () => rng.next());
      const uniqueValues = new Set(values);
      
      // Should have mostly unique values (at least 90%)
      expect(uniqueValues.size).toBeGreaterThan(90);
    });

    it('should handle seed 0', () => {
      const rng = new SeededRNG(0);
      const value = rng.next();
      
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    });

    it('should handle negative seeds', () => {
      const rng = new SeededRNG(-42);
      const value = rng.next();
      
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    });

    it('should handle large seeds', () => {
      const rng = new SeededRNG(2147483647);
      const value = rng.next();
      
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    });
  });

  describe('nextInt()', () => {
    it('should return integers in inclusive range', () => {
      const rng = new SeededRNG(42);
      const min = 1;
      const max = 10;
      
      for (let i = 0; i < 100; i++) {
        const value = rng.nextInt(min, max);
        expect(value).toBeGreaterThanOrEqual(min);
        expect(value).toBeLessThanOrEqual(max);
        expect(Number.isInteger(value)).toBe(true);
      }
    });

    it('should return min when min equals max', () => {
      const rng = new SeededRNG(42);
      const value = rng.nextInt(5, 5);
      expect(value).toBe(5);
    });

    it('should cover the full range', () => {
      const rng = new SeededRNG(42);
      const values = new Set<number>();
      
      // Generate many values to cover range [1, 5]
      for (let i = 0; i < 1000; i++) {
        values.add(rng.nextInt(1, 5));
      }
      
      // Should have all values in range
      expect(values.has(1)).toBe(true);
      expect(values.has(2)).toBe(true);
      expect(values.has(3)).toBe(true);
      expect(values.has(4)).toBe(true);
      expect(values.has(5)).toBe(true);
    });

    it('should throw error when min > max', () => {
      const rng = new SeededRNG(42);
      expect(() => rng.nextInt(10, 5)).toThrow('Invalid range');
    });

    it('should handle negative ranges', () => {
      const rng = new SeededRNG(42);
      const value = rng.nextInt(-10, -5);
      
      expect(value).toBeGreaterThanOrEqual(-10);
      expect(value).toBeLessThanOrEqual(-5);
    });

    it('should be reproducible', () => {
      const rng1 = new SeededRNG(123);
      const rng2 = new SeededRNG(123);
      
      const values1 = Array.from({ length: 10 }, () => rng1.nextInt(1, 100));
      const values2 = Array.from({ length: 10 }, () => rng2.nextInt(1, 100));
      
      expect(values1).toEqual(values2);
    });
  });

  describe('pick()', () => {
    it('should pick items from array', () => {
      const rng = new SeededRNG(42);
      const items = ['a', 'b', 'c', 'd', 'e'];
      
      for (let i = 0; i < 100; i++) {
        const picked = rng.pick(items);
        expect(items).toContain(picked);
      }
    });

    it('should eventually pick all items', () => {
      const rng = new SeededRNG(42);
      const items = ['a', 'b', 'c'];
      const picked = new Set<string>();
      
      for (let i = 0; i < 100; i++) {
        picked.add(rng.pick(items));
      }
      
      expect(picked.size).toBe(3);
      expect(picked.has('a')).toBe(true);
      expect(picked.has('b')).toBe(true);
      expect(picked.has('c')).toBe(true);
    });

    it('should return the only item for single-item array', () => {
      const rng = new SeededRNG(42);
      const items = ['only'];
      
      expect(rng.pick(items)).toBe('only');
      expect(rng.pick(items)).toBe('only');
    });

    it('should throw error for empty array', () => {
      const rng = new SeededRNG(42);
      expect(() => rng.pick([])).toThrow('Cannot pick from empty array');
    });

    it('should be reproducible', () => {
      const rng1 = new SeededRNG(456);
      const rng2 = new SeededRNG(456);
      const items = [1, 2, 3, 4, 5];
      
      const picks1 = Array.from({ length: 10 }, () => rng1.pick(items));
      const picks2 = Array.from({ length: 10 }, () => rng2.pick(items));
      
      expect(picks1).toEqual(picks2);
    });

    it('should work with different types', () => {
      const rng = new SeededRNG(42);
      
      const numbers = rng.pick([1, 2, 3]);
      expect(typeof numbers).toBe('number');
      
      const objects = rng.pick([{ a: 1 }, { b: 2 }]);
      expect(typeof objects).toBe('object');
    });
  });

  describe('nextFloat()', () => {
    it('should return floats in range [min, max)', () => {
      const rng = new SeededRNG(42);
      const min = 0.0;
      const max = 10.0;
      
      for (let i = 0; i < 100; i++) {
        const value = rng.nextFloat(min, max);
        expect(value).toBeGreaterThanOrEqual(min);
        expect(value).toBeLessThan(max);
      }
    });

    it('should throw error when min >= max', () => {
      const rng = new SeededRNG(42);
      expect(() => rng.nextFloat(10, 5)).toThrow('Invalid range');
      expect(() => rng.nextFloat(5, 5)).toThrow('Invalid range');
    });

    it('should be reproducible', () => {
      const rng1 = new SeededRNG(789);
      const rng2 = new SeededRNG(789);
      
      const values1 = Array.from({ length: 10 }, () => rng1.nextFloat(0, 100));
      const values2 = Array.from({ length: 10 }, () => rng2.nextFloat(0, 100));
      
      expect(values1).toEqual(values2);
    });
  });

  describe('nextBoolean()', () => {
    it('should return boolean values', () => {
      const rng = new SeededRNG(42);
      
      for (let i = 0; i < 100; i++) {
        const value = rng.nextBoolean();
        expect(typeof value).toBe('boolean');
      }
    });

    it('should return both true and false', () => {
      const rng = new SeededRNG(42);
      const values = new Set<boolean>();
      
      for (let i = 0; i < 100; i++) {
        values.add(rng.nextBoolean());
      }
      
      expect(values.size).toBe(2);
      expect(values.has(true)).toBe(true);
      expect(values.has(false)).toBe(true);
    });

    it('should respect probability parameter', () => {
      const rng = new SeededRNG(42);
      
      // With probability 0, should always return false
      const falseCount = Array.from({ length: 100 }, () => rng.nextBoolean(0))
        .filter(v => v === false).length;
      expect(falseCount).toBe(100);
      
      // With probability 1, should always return true
      const rng2 = new SeededRNG(42);
      const trueCount = Array.from({ length: 100 }, () => rng2.nextBoolean(1))
        .filter(v => v === true).length;
      expect(trueCount).toBe(100);
    });

    it('should be reproducible', () => {
      const rng1 = new SeededRNG(999);
      const rng2 = new SeededRNG(999);
      
      const values1 = Array.from({ length: 10 }, () => rng1.nextBoolean());
      const values2 = Array.from({ length: 10 }, () => rng2.nextBoolean());
      
      expect(values1).toEqual(values2);
    });
  });

  describe('Edge cases', () => {
    it('should handle very long sequences', () => {
      const rng = new SeededRNG(42);
      
      // Generate 10000 values without errors
      for (let i = 0; i < 10000; i++) {
        const value = rng.next();
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
      }
    });

    it('should handle fractional seeds by flooring', () => {
      const rng1 = new SeededRNG(42.7);
      const rng2 = new SeededRNG(42);
      
      expect(rng1.next()).toBe(rng2.next());
    });
  });
});
