import {
  ARROW_VOLLEY_INTERVAL_MS,
  ARROW_VOLLEY_RATIO,
  ENEMY_BASE_SPEED,
  ENEMY_SURGE_SPEED,
  SURGE_DURATION_MS,
} from "../constants.js";

/**
 * Resolves enemy encounters and arrow volleys during the showdown chase.
 */
export class BattleSystem {
  constructor({ flockSystem, uiManager, telemetry }) {
    this.flockSystem = flockSystem;
    this.uiManager = uiManager;
    this.telemetry = telemetry;
    this.volleyTimer = null;
  }

  /**
   * Straight subtraction skirmish – immediately removes the enemy and player
   * counts based on the gate's outcome.
   */
  resolveSkirmish(enemyCount) {
    const player = this.flockSystem.playerCount;
    const survivors = Math.max(0, player - enemyCount);
    const losses = player - survivors;
    this.flockSystem.setEnemyCount(enemyCount);
    this.flockSystem.applyEnemyLosses(enemyCount);
    this.flockSystem.applyPlayerLosses(losses);
    this.uiManager.logEvent(
      `Skirmish resolved. Enemy strength ${enemyCount.toLocaleString()} removed ${losses.toLocaleString()} soldiers.`,
    );
    this.telemetry.trackEvent("battle:skirmish", { enemyCount, losses });
    return survivors;
  }

  startFinalShowdown(initialEnemy) {
    this.flockSystem.setEnemyCount(initialEnemy);
    this.uiManager.logEvent(
      `Final showdown begins! Enemy horde of ${initialEnemy.toLocaleString()} soldiers enters the field.`,
    );
    this.telemetry.trackEvent("battle:showdown", { initialEnemy });
  }

  startRetreatVolleys() {
    this.stopRetreatVolleys();
    if (typeof window === "undefined") {
      return;
    }
    this.volleyTimer = window.setInterval(() => {
      const volleyCasualties = Math.max(
        1,
        Math.floor(this.flockSystem.playerCount * ARROW_VOLLEY_RATIO),
      );
      this.flockSystem.applyEnemyLosses(volleyCasualties);
      this.uiManager.logEvent(
        `Arrow volley hits for ${volleyCasualties.toLocaleString()}! Remaining enemy: ${this.flockSystem.enemyCount.toLocaleString()}.`,
      );
      this.telemetry.trackEvent("battle:volley", { volleyCasualties });
      if (this.flockSystem.enemyCount <= 0) {
        this.stopRetreatVolleys();
      }
    }, ARROW_VOLLEY_INTERVAL_MS);
  }

  stopRetreatVolleys() {
    if (this.volleyTimer && typeof window !== "undefined") {
      window.clearInterval(this.volleyTimer);
      this.volleyTimer = null;
    }
  }

  triggerSurge(gateId) {
    this.uiManager.logEvent(
      `Enemy surge after ${gateId}! Speed boosts to ${ENEMY_SURGE_SPEED} m/s for ${(SURGE_DURATION_MS / 1000).toFixed(1)} s.`,
    );
    this.telemetry.trackEvent("battle:surge", {
      gateId,
      speed: ENEMY_SURGE_SPEED,
    });
  }

  concludeRetreat() {
    this.stopRetreatVolleys();
    this.uiManager.logEvent(
      `Retreat concluded at base speed ${ENEMY_BASE_SPEED} m/s. Remaining enemy: ${this.flockSystem.enemyCount.toLocaleString()}.`,
    );
  }
}
