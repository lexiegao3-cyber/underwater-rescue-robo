/**
 * Seeded Random Number Generator
 * Uses the mulberry32 algorithm for deterministic pseudo-random number generation
 * 
 * The same seed will always produce the same sequence of numbers,
 * ensuring reproducible scenario generation for mission replay.
 */

/**
 * Seeded RNG class using mulberry32 algorithm
 * 
 * @example
 * const rng = new SeededRNG(12345);
 * const randomValue = rng.next();  // Returns value in [0, 1)
 * const randomInt = rng.nextInt(1, 10);  // Returns integer in [1, 10]
 * const randomItem = rng.pick(['a', 'b', 'c']);  // Returns random item
 */
export class SeededRNG {
  private state: number;

  /**
   * Create a new seeded RNG
   * @param seed - Integer seed value
   */
  constructor(seed: number) {
    // Ensure seed is a 32-bit unsigned integer
    this.state = Math.floor(seed) >>> 0;
  }

  /**
   * Generate next random number using mulberry32 algorithm
   * @returns Random number in the range [0, 1)
   */
  next(): number {
    // Mulberry32 algorithm
    // https://github.com/bryc/code/blob/master/jshash/PRNGs.md
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    const result = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    return result;
  }

  /**
   * Generate random integer in inclusive range [min, max]
   * @param min - Minimum value (inclusive)
   * @param max - Maximum value (inclusive)
   * @returns Random integer in [min, max]
   */
  nextInt(min: number, max: number): number {
    if (min > max) {
      throw new Error(`Invalid range: min (${min}) must be <= max (${max})`);
    }
    const range = max - min + 1;
    return Math.floor(this.next() * range) + min;
  }

  /**
   * Pick a random item from an array
   * @param items - Array of items to pick from
   * @returns Random item from the array
   * @throws Error if array is empty
   */
  pick<T>(items: T[]): T {
    if (items.length === 0) {
      throw new Error('Cannot pick from empty array');
    }
    const index = this.nextInt(0, items.length - 1);
    return items[index];
  }

  /**
   * Generate random float in range [min, max)
   * @param min - Minimum value (inclusive)
   * @param max - Maximum value (exclusive)
   * @returns Random float in [min, max)
   */
  nextFloat(min: number, max: number): number {
    if (min >= max) {
      throw new Error(`Invalid range: min (${min}) must be < max (${max})`);
    }
    return this.next() * (max - min) + min;
  }

  /**
   * Generate random boolean with given probability
   * @param probability - Probability of returning true (default 0.5)
   * @returns Random boolean
   */
  nextBoolean(probability: number = 0.5): boolean {
    return this.next() < probability;
  }
}
