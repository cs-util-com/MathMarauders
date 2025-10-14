import { computeScore, computeStarRating } from './scoring.js';

// why this test matters: scoring breakdown communicates player performance; regression would make star bands meaningless.
test('score composition blends gates, survival, and pace', () => {
  const { total, breakdown } = computeScore({
    initialUnits: 24,
    remainingUnits: 18,
    elapsedSeconds: 95,
    gatesTaken: 3,
    skirmishVolleys: 3,
    chaseOutcome: 'escape',
  });
  expect(total).toBeGreaterThan(breakdown.gateBonus);
  expect(breakdown.survivalBonus).toBe(270);
  expect(breakdown.speedBonus).toBeGreaterThan(0);
  expect(breakdown.chasePenalty).toBe(0);
});

// why this test matters: star rating is the final feedback hook; survival and pace modifiers must shift the band predictably.
test('star rating responds to survival and pace', () => {
  const highScore = computeStarRating({
    score: 520,
    survivalRate: 0.9,
    elapsedSeconds: 150,
  });
  expect(highScore.stars).toBe(3);
  const slowRun = computeStarRating({
    score: 520,
    survivalRate: 0.9,
    elapsedSeconds: 240,
  });
  expect(slowRun.stars).toBe(2);
  const fragileRun = computeStarRating({
    score: 520,
    survivalRate: 0.4,
    elapsedSeconds: 150,
  });
  expect(fragileRun.stars).toBe(2);
});
