import fc from 'fast-check';
import { scoreRun, simulateReverseChase, simulateSkirmish } from './combat.js';

describe('combat simulations', () => {
  test('simulateSkirmish produces deterministic losses', () => {
    // why this test matters: rendering volley summaries must match logic outputs exactly.
    const resultA = simulateSkirmish({
      players: 48,
      enemyPower: 32,
      aggression: 0.6,
      gateQuality: 18,
    });
    const resultB = simulateSkirmish({
      players: 48,
      enemyPower: 32,
      aggression: 0.6,
      gateQuality: 18,
    });
    expect(resultA).toEqual(resultB);
    expect(resultA.remainingPlayers).toBeLessThanOrEqual(48);
    expect(resultA.remainingEnemies).toBeGreaterThanOrEqual(0);
    expect(resultA.volleyLog.length).toBeGreaterThan(0);
  });

  test('simulateReverseChase accounts for aggression and pressure', () => {
    // why this test matters: restart pacing depends on consistent chase outcomes.
    const calm = simulateReverseChase({
      players: 30,
      chasePressure: 5,
      aggression: 0.8,
    });
    const panic = simulateReverseChase({
      players: 30,
      chasePressure: 80,
      aggression: 0.2,
    });
    expect(calm.success).toBe(true);
    expect(panic.success).toBe(false);
    expect(calm.remainingPlayers).toBeGreaterThan(panic.remainingPlayers);
  });

  test('scoreRun awards stars based on survival ratio', () => {
    // why this test matters: end card feedback sets the replay motivation loop.
    const high = scoreRun({
      initialPlayers: 40,
      playersSurvived: 34,
      timeSeconds: 32,
      gateQuality: 18,
      success: true,
    });
    const mid = scoreRun({
      initialPlayers: 40,
      playersSurvived: 20,
      timeSeconds: 45,
      gateQuality: 12,
      success: true,
    });
    const low = scoreRun({
      initialPlayers: 40,
      playersSurvived: 8,
      timeSeconds: 50,
      gateQuality: 5,
      success: false,
    });
    expect(high.stars).toBe(3);
    expect(mid.stars).toBe(2);
    expect(low.stars).toBe(1);
  });

  test('property: skirmish never yields negative squads or enemies', () => {
    // why this test matters: protects against subtle math regressions during tuning changes.
    fc.assert(
      fc.property(
        fc.integer({ min: 10, max: 80 }),
        fc.integer({ min: 5, max: 90 }),
        fc.float({ min: 0, max: 1, noNaN: true }),
        fc.float({ min: 0, max: 30, noNaN: true }),
        (players, enemies, aggression, quality) => {
          const result = simulateSkirmish({
            players,
            enemyPower: enemies,
            aggression,
            gateQuality: quality,
          });
          expect(result.remainingPlayers).toBeGreaterThanOrEqual(0);
          expect(result.remainingEnemies).toBeGreaterThanOrEqual(0);
          expect(result.remainingPlayers).toBeLessThanOrEqual(players);
        }
      )
    );
  });
});
