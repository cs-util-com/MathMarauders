import { runReverseChase } from './reverse.js';

// why this test matters: the chase outcome drives failure/win messaging and must cover all branches.
test('reverse chase can result in escape', () => {
  const result = runReverseChase({
    playerCount: 30,
    gateCount: 0,
    seed: 'escape',
  });
  expect(result.outcome).toBe('escape');
  expect(result.playersRemaining).toBeGreaterThan(0);
});

test('reverse chase can result in elimination', () => {
  const result = runReverseChase({
    playerCount: 2,
    gateCount: 1,
    seed: 'elim',
  });
  expect(result.outcome).toBe('eliminated');
  expect(result.playersRemaining).toBe(0);
});

test('reverse chase can result in being caught', () => {
  const result = runReverseChase({
    playerCount: 40,
    gateCount: 2,
    seed: 'caught',
  });
  expect(result.outcome).toBe('caught');
  expect(result.playersRemaining).toBeGreaterThanOrEqual(0);
});
