/**
 * Creates a deterministic pseudo random number generator.
 * @param {number} seed
 * @returns {() => number}
 */
export function createSeededRandom(seed) {
  let state = Math.abs(Math.floor(seed)) + 1;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}
