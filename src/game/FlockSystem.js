import { STRAGGLER_TIMEOUT_MS } from "../constants.js";

/**
 * Simplified numeric representation of the player/enemy flocks.
 * The real game would pipe values into a GPU boids simulation; here we expose
 * hooks for the UI and systems that care about army sizes.
 */
export class FlockSystem {
  constructor({ uiManager }) {
    this.uiManager = uiManager;
    this.playerCount = 0;
    this.enemyCount = 0;
    this.lastUpdate =
      typeof performance !== "undefined" ? performance.now() : Date.now();
  }

  setPlayerCount(count) {
    this.playerCount = Math.max(0, Math.round(count));
    this.lastUpdate =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    this.uiManager.updatePlayerCount(this.playerCount);
  }

  setEnemyCount(count) {
    this.enemyCount = Math.max(0, Math.round(count));
    this.uiManager.updateEnemyCount(this.enemyCount);
  }

  applyPlayerLosses(losses) {
    this.setPlayerCount(this.playerCount - losses);
  }

  applyEnemyLosses(losses) {
    this.setEnemyCount(this.enemyCount - losses);
  }

  removeStragglers() {
    const now =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    if (now - this.lastUpdate > STRAGGLER_TIMEOUT_MS && this.playerCount > 0) {
      this.applyPlayerLosses(1);
    }
  }
}
