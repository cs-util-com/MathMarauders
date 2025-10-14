import { createSeededRng, normalizeSeed, pick } from './random.js';

describe('random utilities', () => {
  test('normalizeSeed coerces different inputs to string seeds', () => {
    // why this test matters: consistent seeds keep shared runs aligned across devices.
    expect(normalizeSeed(42)).toBe('42');
    expect(normalizeSeed(' mission ')).toBe('mission');
  });

  test('createSeededRng produces deterministic sequences', () => {
    // why this test matters: deterministic PRNG powers reproducible gate layouts.
    const rngA = createSeededRng('deck');
    const rngB = createSeededRng('deck');
    const samplesA = Array.from({ length: 5 }, () => rngA());
    const samplesB = Array.from({ length: 5 }, () => rngB());
    expect(samplesA).toEqual(samplesB);
  });

  test('pick selects from array and rejects empty arrays', () => {
    // why this test matters: prevents silent failures when generating encounter tables.
    const rng = () => 0.75;
    expect(pick(['a', 'b', 'c'], rng)).toBe('c');
    expect(() => pick([], rng)).toThrow('non-empty array');
  });
});
