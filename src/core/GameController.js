import { BattleSystem } from "../game/BattleSystem.js";
import { FlockSystem } from "../game/FlockSystem.js";
import { GateSystem } from "../game/GateSystem.js";
import { WaveGenerator } from "../game/WaveGenerator.js";
import { UIManager } from "../ui/UIManager.js";
import { PersistenceManager } from "./PersistenceManager.js";
import { ConsoleTelemetry } from "./Telemetry.js";
import { calculateStars } from "../utils/scoring.js";

const PHASES = {
  idle: "Idle",
  forward: "Forward Run",
  retreat: "Retreat Chase"
};

/**
 * Coordinates game systems and state transitions.
 */
export class GameController {
  constructor({
    canvas,
    telemetry = new ConsoleTelemetry(),
    persistence = new PersistenceManager()
  }) {
    this.waveNumber = 1;
    this.phase = PHASES.idle;
    this.playerCount = 0;
    this.enemyCount = 0;
    this.optimalFinal = 0;
    this.actualFinal = 0;
    this.waveGenerator = new WaveGenerator();
    this.battleSystem = new BattleSystem();
    this.ui = new UIManager();
    this.persistence = persistence;
    this.telemetry = telemetry;
    this.flock = new FlockSystem(canvas);
    this.forwardGates = null;
    this.retreatGates = null;
    this.lastUpdateTime = performance.now();
    this.animationFrame = null;
    this.setupUi();
    this.refreshHud();
  }

  setupUi() {
    this.ui.registerHandlers({
      onAdvance: () => this.advanceGate(),
      onPlay: () => this.startWave(),
      onSummaryPrimary: () => this.handleSummaryPrimary(),
      onSummarySecondary: () => this.handleSummarySecondary()
    });
    this.ui.setAdvanceDisabled(true);
  }

  updateLoop() {
    const now = performance.now();
    const delta = now - this.lastUpdateTime;
    this.lastUpdateTime = now;
    if (this.phase === PHASES.retreat && this.playerCount > 0 && this.enemyCount > 0) {
      this.playerCount = this.battleSystem.applyChasePressure(this.playerCount, delta);
      if (this.playerCount === 0) {
        this.finishWave(false);
      }
    }
    this.refreshHud();
    this.animationFrame = requestAnimationFrame(() => this.updateLoop());
  }

  refreshHud() {
    this.ui.updateHud({
      wave: this.waveNumber,
      phase: this.phase,
      player: this.playerCount,
      enemy: this.enemyCount
    });
    this.flock.setLaneBias(this.ui.getSliderBias());
    this.flock.setPlayerCount(this.playerCount);
    this.flock.setEnemyCount(this.enemyCount);
  }

  startWave() {
    if (this.phase !== PHASES.idle) {
      return;
    }
    const config = this.waveGenerator.generateWave(this.waveNumber);
    this.forwardGates = new GateSystem(config.forward);
    this.retreatGates = new GateSystem(config.retreat);
    this.playerCount = config.initialArmy;
    this.phase = PHASES.forward;
    this.optimalFinal = config.forward.at(-1)?.optimalAfter ?? this.playerCount;
    this.actualFinal = 0;
    this.enemyCount = 0;
    this.flock.setDirection(1);
    this.ui.setAdvanceDisabled(false);
    this.nextGate();
    if (!this.animationFrame) {
      this.updateLoop();
    }
    this.telemetry.trackEvent("wave_started", { wave: this.waveNumber });
    this.ui.log(`Wave ${this.waveNumber} begins with ${this.playerCount} soldiers.`);
  }

  nextGate() {
    let gateSystem = this.forwardGates;
    if (this.phase === PHASES.retreat) {
      gateSystem = this.retreatGates;
    }
    const gateInfo = gateSystem?.nextGate();
    if (!gateInfo || !gateInfo.gate) {
      if (this.phase === PHASES.forward) {
        this.startShowdown();
      } else {
        this.finishWave(true);
      }
      return;
    }
    const total = gateSystem?.gates.length ?? 0;
    this.ui.showGate({
      index: gateInfo.index,
      total,
      options: gateInfo.gate.operations.map((op) => op.label)
    });
  }

  advanceGate() {
    let gateSystem = this.forwardGates;
    if (this.phase === PHASES.retreat) {
      gateSystem = this.retreatGates;
    }
    if (!gateSystem) {
      return;
    }
    const choice = this.ui.getSliderBias() < 0 ? 0 : 1;
    const { playerAfterGate, enemySize } = gateSystem.resolveGate(
      this.playerCount,
      choice
    );
    this.playerCount = playerAfterGate;
    this.ui.resetSlider();
    this.ui.log(`Gate resolved → Army ${this.playerCount}`);

    if (this.phase === PHASES.forward) {
      const { player, enemy } = this.battleSystem.resolveSkirmish(this.playerCount, enemySize);
      this.playerCount = player;
      this.enemyCount = enemy;
      this.ui.log(`Skirmish! Enemy ${enemy}, survivors ${this.playerCount}.`);
      if (this.playerCount === 0) {
        this.finishWave(false);
        return;
      }
      this.enemyCount = 0;
    } else if (this.phase === PHASES.retreat) {
      const result = this.battleSystem.applyRetreatGate(this.playerCount);
      this.enemyCount = result.enemy;
      this.ui.log(`Arrow volley hit ${result.volleyDamage}. Enemy ${this.enemyCount}.`);
    }

    this.nextGate();
  }

  startShowdown() {
    this.phase = PHASES.retreat;
    this.actualFinal = this.playerCount;
    this.enemyCount = this.battleSystem.spawnFinalEnemy(this.optimalFinal);
    this.flock.setDirection(-1);
    this.ui.log("Showdown! Retreat back to the start!");
    this.telemetry.trackEvent("showdown_started", {
      wave: this.waveNumber,
      survivors: this.playerCount,
      enemy: this.enemyCount
    });
    this.nextGate();
  }

  finishWave(victory) {
    this.phase = PHASES.idle;
    cancelAnimationFrame(this.animationFrame);
    this.animationFrame = null;
    const optimal = Math.max(1, this.optimalFinal);
    const { stars, ratio } = calculateStars(this.playerCount, optimal);
    if (victory) {
      this.persistence.recordStars(this.waveNumber, stars);
    }
    this.telemetry.trackEvent("wave_finished", {
      wave: this.waveNumber,
      victory,
      survivors: this.playerCount,
      optimal,
      stars
    });
    this.ui.showSummary({
      title: victory ? `Wave ${this.waveNumber} Complete` : `Wave ${this.waveNumber} Failed`,
      stars,
      body: victory
        ? `You preserved ${this.playerCount} soldiers (${Math.round(ratio * 100)}% of optimal).`
        : "Your army was wiped out during the retreat.",
      primaryLabel: victory ? "Next" : "Retry",
      secondaryLabel: "Close"
    });
    this.ui.setAdvanceDisabled(true);
  }

  handleSummaryPrimary() {
    const victory = this.playerCount > 0;
    this.ui.hideSummary();
    if (victory) {
      this.waveNumber += 1;
    }
    this.resetForNextAttempt();
  }

  handleSummarySecondary() {
    this.ui.hideSummary();
    this.resetForNextAttempt();
  }

  resetForNextAttempt() {
    this.phase = PHASES.idle;
    this.playerCount = 0;
    this.enemyCount = 0;
    this.ui.showGate(null);
    this.refreshHud();
    this.telemetry.trackEvent("wave_ready", { wave: this.waveNumber });
  }
}
