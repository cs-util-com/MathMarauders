import { normalizeSeed, mulberry32 } from './random.js';

// why this test matters: deterministic seeds ensure shared runs behave identically across devices.
test('normalizeSeed hashes strings and preserves numbers', () => {
  expect(normalizeSeed(1234)).toBe(normalizeSeed(1234));
  expect(normalizeSeed('alpha')).toBe(normalizeSeed('alpha'));
  expect(normalizeSeed('alpha')).not.toBe(normalizeSeed('beta'));
});

// why this test matters: the RNG must be repeatable so seeded gates and skirmishes stay in sync.
test('mulberry32 generates a repeatable sequence', () => {
  const rngA = mulberry32(42);
  const rngB = mulberry32(42);
  const sequenceA = Array.from({ length: 5 }, () => rngA());
  const sequenceB = Array.from({ length: 5 }, () => rngB());
  expect(sequenceA).toEqual(sequenceB);
  expect(sequenceA.every((value) => value >= 0 && value < 1)).toBe(true);
});
