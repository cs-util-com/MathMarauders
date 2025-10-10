/**
 * Deterministic pseudo-random number generation helpers.
 * The game uses seeded randomness so that a wave can be replayed
 * consistently for testing and persistence.
 *
 * @module utils/random
 */

/**
 * Mulberry32 pseudo random generator.
 * @param {number} seed - Seed value.
 * @returns {() => number} Generator that yields values in [0, 1).
 */
export function createRng(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Selects a random integer in the provided range (inclusive).
 * @param {() => number} rng - Random number generator.
 * @param {number} min - Minimum value inclusive.
 * @param {number} max - Maximum value inclusive.
 * @returns {number}
 */
export function randomInt(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}
