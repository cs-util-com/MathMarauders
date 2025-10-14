import { runSkirmish } from './skirmish.js';

// why this test matters: combat pacing must end within a few volleys to match the arcade loop.
test('skirmish resolves within volley envelope', () => {
  const result = runSkirmish({ playerCount: 24, enemyCount: 18, seed: 'loop' });
  expect(result.volleys).toBeGreaterThanOrEqual(1);
  expect(result.volleys).toBeLessThanOrEqual(6);
  expect(result.playersRemaining).toBeGreaterThanOrEqual(0);
  expect(result.enemiesRemaining).toBeGreaterThanOrEqual(0);
});

// why this test matters: seeded runs must be deterministic so scoreboards stay comparable.
test('skirmish output is deterministic for the same seed', () => {
  const first = runSkirmish({
    playerCount: 30,
    enemyCount: 20,
    seed: 'seed-a',
  });
  const second = runSkirmish({
    playerCount: 30,
    enemyCount: 20,
    seed: 'seed-a',
  });
  expect(second).toEqual(first);
});
