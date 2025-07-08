import WaveGenerator from './WaveGenerator.js';
import GateSystem from './GateSystem.js';
import FlockSystem from './FlockSystem.js';
import BattleSystem from './BattleSystem.js';

/**
 * Main game orchestrator.
 */
export default class GameController {
  constructor(ui, persistence, telemetry) {
    this.ui = ui;
    this.persistence = persistence;
    this.telemetry = telemetry;
    this.waveGen = new WaveGenerator();
    this.battle = new BattleSystem();
    this.currentWave = 1;
    this.ui.onStart(() => this.startWave());
    this.ui.onLeft(() => this.handleChoice(0));
    this.ui.onRight(() => this.handleChoice(1));
    this.ui.onNext(() => this.nextWave());
    this.ui.onRetry(() => this.retryWave());
  }

  startWave() {
    this.ui.hidePopup();
    this.player = new FlockSystem(10);
    const data = this.waveGen.generate(this.currentWave);
    this.gateSystem = new GateSystem(data.gates);
    this.optimalSize = this.player.size;
    this.calculateOptimalPath();
    this.ui.updateCounts(this.player.size);
    this.showCurrentGate();
    this.telemetry.trackEvent('wave_start', { wave: this.currentWave });
  }

  calculateOptimalPath() {
    let size = this.player.size;
    for (const gate of this.gateSystem.gates) {
      const resA = gate[0].fn(size);
      const resB = gate[1].fn(size);
      size = Math.max(resA, resB);
      size = Math.max(0, Math.floor(size));
      const enemy = Math.floor(size * WaveGenerator.SKIRMISH_FACTOR);
      size = Math.max(0, size - enemy);
    }
    this.optimalSize = size;
  }

  showCurrentGate() {
    if (!this.gateSystem.hasMore()) {
      return this.endWave();
    }
    const gate = this.gateSystem.currentGate();
    this.ui.updateGateLabels(gate[0].label, gate[1].label);
  }

  handleChoice(index) {
    if (!this.gateSystem.hasMore()) return;
    const optimal = this.gateSystem.optimalOutcome(this.player.size);
    const newSize = this.gateSystem.applyChoice(index, this.player.size);
    this.player.set(newSize);
    const { enemy, result } = this.battle.resolveSkirmish(this.player.size, optimal);
    this.player.set(result);
    this.ui.updateCounts(this.player.size, enemy);
    this.showCurrentGate();
  }

  endWave() {
    const stars = this.computeStars();
    if (stars > this.persistence.getStarRating(this.currentWave)) {
      this.persistence.setStarRating(this.currentWave, stars);
    }
    this.ui.showPopup(`Wave ${this.currentWave} Complete`, stars);
    this.telemetry.trackEvent('wave_complete', { wave: this.currentWave, stars });
  }

  computeStars() {
    const ratio = this.optimalSize === 0 ? 0 : this.player.size / this.optimalSize;
    if (ratio <= 0.4) return 1;
    if (ratio <= 0.6) return 2;
    if (ratio <= 0.75) return 3;
    if (ratio <= 0.9) return 4;
    return 5;
  }

  nextWave() {
    this.currentWave += 1;
    this.startWave();
  }

  retryWave() {
    this.startWave();
  }
}
