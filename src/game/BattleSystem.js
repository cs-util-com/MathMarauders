import {
  ARROW_VOLLEY_RATIO,
  ENEMY_BASE_SPEED,
  ENEMY_SURGE_DURATION_MS,
  ENEMY_SURGE_SPEED
} from "../core/constants.js";

/**
 * Handles combat resolution including skirmishes and retreat chases.
 */
export class BattleSystem {
  constructor() {
    this.enemyCount = 0;
    this.lastSurgeTime = 0;
  }

  /**
   * Resolves an immediate skirmish after a forward gate.
   * @param {number} playerCount
   * @param {number} optimalAfter
   * @returns {{player: number, enemy: number}}
   */
  resolveSkirmish(playerCount, enemySize) {
    const enemy = Math.max(0, Math.round(enemySize));
    const survivors = Math.max(0, playerCount - enemy);
    this.enemyCount = 0;
    return { player: survivors, enemy };
  }

  /**
   * Spawns the showdown enemy army based on the optimal path.
   * @param {number} optimalSurvivors
   * @returns {number}
   */
  spawnFinalEnemy(optimalSurvivors) {
    this.enemyCount = Math.max(optimalSurvivors * 2, 1);
    return this.enemyCount;
  }

  /**
   * Applies the retreat gate outcome and arrow volley damage.
   * @param {number} playerCount
   * @returns {{player: number, enemy: number, volleyDamage: number}}
   */
  applyRetreatGate(playerCount) {
    const volleyDamage = Math.round(playerCount * ARROW_VOLLEY_RATIO);
    this.enemyCount = Math.max(0, this.enemyCount - volleyDamage);
    this.lastSurgeTime = performance.now();
    return {
      player: playerCount,
      enemy: this.enemyCount,
      volleyDamage
    };
  }

  /**
   * Applies enemy pursuit damage if they catch up.
   * @param {number} playerCount
   * @param {number} deltaTime
   * @returns {number}
   */
  applyChasePressure(playerCount, deltaTime) {
    const speed = this.getEnemySpeed();
    const damage = (speed / ENEMY_BASE_SPEED) * (deltaTime / 1200);
    const casualties = Math.floor(damage * Math.max(1, playerCount * 0.05));
    const survivors = Math.max(0, playerCount - casualties);
    return survivors;
  }

  /**
   * Returns the current enemy speed, considering temporary surges.
   * @returns {number}
   */
  getEnemySpeed() {
    if (performance.now() - this.lastSurgeTime < ENEMY_SURGE_DURATION_MS) {
      return ENEMY_SURGE_SPEED;
    }
    return ENEMY_BASE_SPEED;
  }
}
