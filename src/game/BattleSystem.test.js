import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import { BattleSystem } from "./BattleSystem.js";

describe("BattleSystem", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(0);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("resolveSkirmish subtracts enemies and clears enemy count", () => {
    const battle = new BattleSystem();
    const result = battle.resolveSkirmish(100, 48);
    expect(result.player).toBe(52);
    expect(result.enemy).toBe(48);
    expect(battle.enemyCount).toBe(0);
  });

  test("spawnFinalEnemy doubles optimal survivors", () => {
    const battle = new BattleSystem();
    expect(battle.spawnFinalEnemy(50)).toBe(100);
  });

  test("applyRetreatGate triggers a surge window", () => {
    const battle = new BattleSystem();
    battle.spawnFinalEnemy(10);
    const { enemy, volleyDamage } = battle.applyRetreatGate(40);
    expect(volleyDamage).toBe(4);
    expect(enemy).toBe(16);
    expect(battle.getEnemySpeed()).toBeGreaterThan(6);
    jest.advanceTimersByTime(1500);
    expect(battle.getEnemySpeed()).toBe(6);
  });
});
