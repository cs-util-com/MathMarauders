import { applySteerOffset, computeFormationPositions } from './formation.js';

// why this test matters: formation layouts must scale without collisions so the renderer stays legible.
test('computeFormationPositions returns centered grid without overlap', () => {
  const positions = computeFormationPositions(10, { spacing: 1.1 });
  expect(positions).toHaveLength(10);
  const xs = positions.map((pos) => pos.x);
  expect(Math.max(...xs) - Math.min(...xs)).toBeLessThan(1.1 * 4);
  const zs = positions.map((pos) => pos.z);
  expect(Math.min(...zs)).toBeLessThanOrEqual(0);
  expect(Math.max(...zs)).toBeGreaterThanOrEqual(-1.1 * 3);
});

// why this test matters: steering offsets need to keep formations within the lane bounds.
test('applySteerOffset clamps steering within lane width', () => {
  const base = computeFormationPositions(4, { spacing: 1.2 });
  const steered = applySteerOffset(base, 1.5, 5);
  const xs = steered.map((pos) => pos.x);
  expect(Math.max(...xs)).toBeLessThanOrEqual(5 * 0.6 + 1.2);
});
