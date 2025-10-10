import {
  RETREAT_ARROW_RATIO,
  TELEMETRY_EVENTS,
  SHOWDOWN_ENEMY_RATIO,
} from './constants.js';

/**
 * Manages arithmetic combat resolution.
 */
export class BattleSystem {
  /**
   * @param {object} deps
   * @param {import('./FlockSystem.js').FlockSystem} deps.flocks
   * @param {import('./Telemetry.js').Telemetry} deps.telemetry
   */
  constructor({flocks, telemetry}) {
    this.flocks = flocks;
    this.telemetry = telemetry;
  }

  /**
   * Resolves a skirmish by subtracting the enemy from the player's army.
   * @param {number} playerArmy
   * @param {number} enemyArmy
   * @returns {number} Player survivors
   */
  resolveSkirmish(playerArmy, enemyArmy) {
    const survivors = Math.max(0, playerArmy - enemyArmy);
    this.telemetry.trackEvent(TELEMETRY_EVENTS.SKIRMISH, {
      playerArmy,
      enemyArmy,
      survivors,
    });
    this.flocks.setPlayer(survivors);
    return survivors;
  }

  /**
   * Calculates the volley size when arrows are fired.
   * @param {number} playerArmy
   * @returns {number}
   */
  calculateArrowVolley(playerArmy) {
    return Math.max(0, Math.floor(playerArmy * RETREAT_ARROW_RATIO));
  }

  /**
   * Applies a volley to the pursuing enemy.
   * @param {number} volleySize
   * @returns {number} Remaining enemy count
   */
  applyArrowVolley(volleySize) {
    this.flocks.removeEnemy(volleySize);
    return this.flocks.enemy;
  }

  /**
   * Calculates the initial showdown enemy size.
   * @param {number} playerArmy
   * @returns {number}
   */
  calculateShowdownEnemy(playerArmy) {
    return Math.max(0, Math.ceil(playerArmy * SHOWDOWN_ENEMY_RATIO));
  }
}

/**
 * Determines the star rating from the final survivors and optimal path.
 * @param {number} survivors - Player survivors.
 * @param {number} optimal - Optimal survivors according to generator.
 * @param {number[]} thresholds - Fractional thresholds ascending.
 * @returns {number}
 */
export function calculateStarRating(survivors, optimal, thresholds) {
  if (survivors <= 0) {
    return 0;
  }
  if (optimal <= 0) {
    return thresholds.length + 1;
  }
  const ratio = survivors / optimal;
  let stars = 1;
  thresholds.forEach((threshold, index) => {
    if (ratio > threshold) {
      stars = index + 2;
    }
  });
  return Math.min(thresholds.length + 1, stars);
}
