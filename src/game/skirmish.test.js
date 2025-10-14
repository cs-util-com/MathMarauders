import { simulateSkirmish } from './skirmish.js';

// why this test matters: skirmish math drives difficulty pacing; regressions make combat unpredictable.
test('simulateSkirmish resolves casualties symmetrically until one side loses', () => {
  const result = simulateSkirmish({
    playerCount: 20,
    enemyCount: 16,
    rng: () => 0.1,
  });
  expect(result.ticks.length).toBeGreaterThan(0);
  expect(result.playerRemaining).toBeGreaterThan(0);
  expect(result.enemyRemaining).toBe(0);
  expect(result.ticks[result.ticks.length - 1].enemyLoss).toBeGreaterThan(0);
});

// why this test matters: edge cases with small squads must still resolve quickly to keep runs snappy.
test('simulateSkirmish handles small armies without infinite loops', () => {
  const result = simulateSkirmish({
    playerCount: 3,
    enemyCount: 3,
    rng: () => 0.2,
  });
  expect(result.ticks.length).toBeLessThanOrEqual(6);
  expect(result.playerRemaining >= 0).toBe(true);
});
