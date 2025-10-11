import { calculateStars } from "./Scoring.js";

/**
 * Coordinates the overall flow of a wave from start to finish.
 */
export class GameController {
  constructor({
    waveGenerator,
    gateSystem,
    battleSystem,
    flockSystem,
    uiManager,
    persistence,
    telemetry,
  }) {
    this.waveGenerator = waveGenerator;
    this.gateSystem = gateSystem;
    this.battleSystem = battleSystem;
    this.flockSystem = flockSystem;
    this.uiManager = uiManager;
    this.persistence = persistence;
    this.telemetry = telemetry;
    this.waveNumber = 1;
    this.isRunning = false;
    this.currentWave = null;
    this.bestStars = this.persistence.load("bestStars", {});
  }

  async start() {
    this.uiManager.setPrimaryAction("Play", () => this.beginWave(), {
      disabled: false,
    });
    this.uiManager.onPopupNext(() => this.advanceWave());
    this.uiManager.onPopupRetry(() => this.retryWave());
    this.flockSystem.setPlayerCount(0);
    this.flockSystem.setEnemyCount(0);
  }

  beginWave() {
    if (this.isRunning) {
      return;
    }
    this.isRunning = true;
    this.uiManager.setPrimaryAction("Running", null, { disabled: true });
    this.runWave(this.waveNumber).catch((error) => {
      console.error(error);
      this.isRunning = false;
    });
  }

  async runWave(waveNumber) {
    this.uiManager.setWave(waveNumber);
    this.uiManager.logEvent(`Wave ${waveNumber} begins.`);
    this.telemetry.trackEvent("wave:start", { waveNumber });
    this.currentWave = this.waveGenerator.generateWave(waveNumber);
    const initialArmy = this.currentWave.initialArmy;
    this.flockSystem.setPlayerCount(initialArmy);

    const forwardResult = await this.processForwardPhase();
    if (forwardResult.finalCount <= 0) {
      this.completeWave({ success: false, survivors: 0 });
      return;
    }

    const showdownEnemy = Math.max(
      this.currentWave.optimal.forward.final,
      this.currentWave.optimal.retreat.final,
      initialArmy,
    );
    this.battleSystem.startFinalShowdown(Math.round(showdownEnemy * 1.2));
    this.battleSystem.startRetreatVolleys();

    const retreatResult = await this.processRetreatPhase(
      forwardResult.finalCount,
    );
    this.battleSystem.concludeRetreat();

    this.completeWave({
      success: retreatResult.finalCount > 0,
      survivors: retreatResult.finalCount,
    });
  }

  async processForwardPhase() {
    this.uiManager.setPhase("forward");
    const skirmishByGate = new Map(
      this.currentWave.skirmishes.map((skirmish) => [
        skirmish.gateId,
        skirmish.enemySize,
      ]),
    );
    const result = await this.gateSystem.processGates(
      this.currentWave.forward.map((gate) => ({
        ...gate,
        total: this.currentWave.forward.length,
      })),
      this.currentWave.initialArmy,
      "forward",
    );

    result.history.forEach((entry) => {
      const enemy = skirmishByGate.get(entry.gateId) ?? 0;
      this.battleSystem.resolveSkirmish(enemy);
    });
    return { ...result };
  }

  async processRetreatPhase(initialArmy) {
    this.uiManager.setPhase("retreat");
    this.flockSystem.setPlayerCount(initialArmy);
    this.flockSystem.setEnemyCount(
      Math.round(this.currentWave.optimal.retreat.final * 1.1),
    );
    const result = await this.gateSystem.processGates(
      this.currentWave.retreat.map((gate) => ({
        ...gate,
        total: this.currentWave.retreat.length,
      })),
      initialArmy,
      "retreat",
    );

    result.history.forEach((entry) => {
      this.battleSystem.triggerSurge(entry.gateId);
    });

    return { ...result };
  }

  completeWave({ success, survivors }) {
    this.isRunning = false;
    const optimalFinal = this.currentWave.optimal.retreat.final;
    const stars = success ? calculateStars(survivors, optimalFinal) : 0;
    const best = this.bestStars[this.waveNumber] ?? 0;
    if (stars > best) {
      this.bestStars[this.waveNumber] = stars;
      this.persistence.save("bestStars", this.bestStars);
    }
    const canAdvance = success;
    this.uiManager.showPopup({
      title: success
        ? `Wave ${this.waveNumber} Complete`
        : `Wave ${this.waveNumber} Failed`,
      stars: success ? stars : 0,
      summary: success
        ? `${survivors.toLocaleString()} survivors vs optimal ${optimalFinal.toLocaleString()}.`
        : "Your army was overwhelmed.",
      canAdvance,
    });
    this.uiManager.setPrimaryAction("Play", () => this.beginWave(), {
      disabled: false,
    });
    this.telemetry.trackEvent("wave:complete", {
      waveNumber: this.waveNumber,
      success,
      survivors,
      stars,
    });
  }

  advanceWave() {
    if (!this.currentWave) {
      return;
    }
    this.uiManager.hidePopup();
    if (this.bestStars[this.waveNumber] > 0) {
      this.waveNumber += 1;
    }
    this.beginWave();
  }

  retryWave() {
    this.uiManager.hidePopup();
    this.beginWave();
  }
}
