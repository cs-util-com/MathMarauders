import {
  simulateSkirmish,
  resolveReverseChase,
  calculateStarRating,
} from './combatSimulator.js';

// why this test matters: skirmish math drives mid-run attrition clarity.
describe('simulateSkirmish', () => {
  it('applies volley exchange deterministically', () => {
    const result = simulateSkirmish({
      playerCount: 20,
      enemyCount: 15,
      volleyDurationMs: 3000,
    });
    expect(result.playerRemaining).toBe(14);
    expect(result.enemyRemaining).toBe(9);
    expect(result.scoreDelta).toBe(6);
  });
});

// why this test matters: chase outcome determines fail/win loop.
describe('resolveReverseChase', () => {
  it('detects failure when horde overwhelms survivors', () => {
    const outcome = resolveReverseChase({
      survivors: 4,
      chaseStrength: 6,
    });
    expect(outcome.success).toBe(false);
    expect(outcome.casualties).toBe(4);
  });

  it('awards bonus when survivors outrun chase', () => {
    const outcome = resolveReverseChase({
      survivors: 12,
      chaseStrength: 6,
    });
    expect(outcome.success).toBe(true);
    expect(outcome.casualties).toBe(2);
    expect(outcome.bonusScore).toBe(10);
  });
});

// why this test matters: star ratings communicate run mastery at a glance.
describe('calculateStarRating', () => {
  it('maps score bands to 1-3 star scale', () => {
    expect(calculateStarRating(30)).toBe(1);
    expect(calculateStarRating(65)).toBe(2);
    expect(calculateStarRating(120)).toBe(3);
  });
});
