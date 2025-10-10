import {
  BASE_PLAYER_ARMY,
  RETREAT_ARROW_INTERVAL_MS,
  STAR_THRESHOLDS,
  TELEMETRY_EVENTS,
} from './constants.js';
import {calculateStarRating} from './BattleSystem.js';

/**
 * Coordinates the main game loop.
 */
export class GameController {
  /**
   * @param {object} deps
   * @param {import('./WaveGenerator.js').WaveGenerator} deps.generator
   * @param {import('./GateSystem.js').GateSystem} deps.gates
   * @param {import('./BattleSystem.js').BattleSystem} deps.battles
   * @param {import('./FlockSystem.js').FlockSystem} deps.flocks
   * @param {import('../ui/UIManager.js').UIManager} deps.ui
   * @param {import('./PersistenceManager.js').PersistenceManager} deps.persistence
   * @param {import('./Telemetry.js').Telemetry} deps.telemetry
   */
  constructor({generator, gates, battles, flocks, ui, persistence, telemetry}) {
    this.generator = generator;
    this.gates = gates;
    this.battles = battles;
    this.flocks = flocks;
    this.ui = ui;
    this.persistence = persistence;
    this.telemetry = telemetry;

    this.phase = 'idle';
    this.currentWave = 1;
    this.waveData = null;
    this.forwardIndex = 0;
    this.retreatIndex = 0;
    this.currentArmy = BASE_PLAYER_ARMY;
    this.arrowTimer = null;
    this.stars = {};
  }

  /**
   * Sets up listeners and initial UI.
   */
  initialize() {
    this.stars = this.persistence.loadStars();
    this.ui.initialize({
      onPlay: () => this.startWave(this.currentWave),
      onGateCommit: (choice) => this.handleGate(choice),
    });
    this.flocks.subscribe((state) => this.ui.updateFlocks(state));
    this.ui.showThresholds();
    this.#refreshStarPreview();
  }

  startWave(waveNumber) {
    this.#clearArrowLoop();
    this.currentWave = waveNumber;
    this.waveData = this.generator.generate(waveNumber, BASE_PLAYER_ARMY);
    this.phase = 'forward';
    this.forwardIndex = 0;
    this.retreatIndex = 0;
    this.currentArmy = this.waveData.startingArmy;
    this.flocks.setPlayer(this.currentArmy);
    this.flocks.setEnemy(0);
    this.ui.setWave(waveNumber);
    this.ui.setPhase('Forward Run');
    this.ui.setStatus('Lead your soldiers through the math gates.');
    this.#refreshStarPreview();
    this.telemetry.trackEvent(TELEMETRY_EVENTS.WAVE_START, {wave: waveNumber});
    this.#presentForwardGate();
  }

  handleGate(choice) {
    if (this.phase === 'forward') {
      this.#resolveForwardGate(choice);
    } else if (this.phase === 'retreat') {
      this.#resolveRetreatGate(choice);
    }
  }

  #presentForwardGate() {
    if (!this.waveData) {
      return;
    }
    if (this.forwardIndex >= this.waveData.forwardGates.length) {
      this.#startShowdown();
      return;
    }
    const gate = this.waveData.forwardGates[this.forwardIndex];
    this.ui.showGate(this.forwardIndex, this.waveData.forwardGates.length, gate);
  }

  #resolveForwardGate(choice) {
    const gate = this.waveData.forwardGates[this.forwardIndex];
    const optimalInfo = this.waveData.optimal.forward.checkpoints[this.forwardIndex];
    const result = this.gates.resolve({gate, choice, army: this.currentArmy});
    this.currentArmy = result.value;
    this.flocks.setPlayer(this.currentArmy);
    const enemy = optimalInfo.enemy;
    this.flocks.setEnemy(enemy);
    const survivors = this.battles.resolveSkirmish(this.currentArmy, enemy);
    this.currentArmy = survivors;
    this.flocks.setEnemy(0);
    const choiceSummary = result.isOptimal ? 'Optimal choice!' : 'Suboptimal choice.';
    this.ui.setStatus(
      `${choiceSummary} Gate yielded ${result.value} (best ${result.best}). Skirmish enemy ${enemy}, survivors ${survivors}.`
    );
    if (this.currentArmy <= 0) {
      this.#handleDefeat('Your army fell during the forward run.');
      return;
    }
    this.forwardIndex += 1;
    this.#presentForwardGate();
  }

  #startShowdown() {
    this.phase = 'showdown';
    this.ui.setPhase('Showdown');
    const enemy = this.battles.calculateShowdownEnemy(this.currentArmy);
    this.flocks.setEnemy(enemy);
    this.ui.setStatus('The enemy charges! Begin the retreat.');
    this.telemetry.trackEvent(TELEMETRY_EVENTS.SHOWDOWN_START, {wave: this.currentWave, enemy});
    this.#startRetreat();
  }

  #startRetreat() {
    this.phase = 'retreat';
    this.retreatIndex = 0;
    this.ui.setPhase('Retreat Chase');
    this.ui.setStatus('Slide toward the safest exits while arrows fire automatically.');
    this.#startArrowLoop();
    this.#presentRetreatGate();
  }

  #presentRetreatGate() {
    if (this.retreatIndex >= this.waveData.retreatGates.length) {
      this.#completeWave();
      return;
    }
    const gate = this.waveData.retreatGates[this.retreatIndex];
    this.ui.showGate(this.retreatIndex, this.waveData.retreatGates.length, gate);
  }

  #resolveRetreatGate(choice) {
    const gate = this.waveData.retreatGates[this.retreatIndex];
    const result = this.gates.resolve({gate, choice, army: this.currentArmy});
    this.currentArmy = result.value;
    this.flocks.setPlayer(this.currentArmy);
    const volley = this.battles.calculateArrowVolley(this.currentArmy);
    let message = `Retreat gate cleared. ${this.currentArmy} soldiers remain.`;
    if (volley > 0) {
      const remaining = this.battles.applyArrowVolley(volley);
      message += ` Volley hits for ${volley}. Enemy remaining ${remaining}.`;
    }
    this.ui.setStatus(message);
    if (this.currentArmy <= 0) {
      this.#handleDefeat('Your forces disbanded during the retreat.');
      return;
    }
    this.retreatIndex += 1;
    if (this.retreatIndex >= this.waveData.retreatGates.length) {
      this.#completeWave();
    } else {
      this.telemetry.trackEvent(TELEMETRY_EVENTS.RETREAT_GATE, {
        wave: this.currentWave,
        gate: this.retreatIndex,
      });
      this.#presentRetreatGate();
    }
  }

  #completeWave() {
    this.#clearArrowLoop();
    this.phase = 'completed';
    this.flocks.setEnemy(0);
    const optimal = this.waveData.optimal.retreat.finalArmy;
    const stars = calculateStarRating(this.currentArmy, optimal, STAR_THRESHOLDS);
    this.telemetry.trackEvent(TELEMETRY_EVENTS.WAVE_COMPLETE, {
      wave: this.currentWave,
      survivors: this.currentArmy,
      optimal,
      stars,
    });
    this.stars = this.persistence.updateStars(this.currentWave, stars);
    this.ui.setStarPreview(stars);
    const completedWave = this.currentWave;
    const nextWave = completedWave + 1;
    this.ui.showPopup({
      title: `Wave ${completedWave} Complete`,
      stars,
      message: `Survivors: ${this.currentArmy}. Optimal survivors: ${optimal}.`,
      onNext: () => this.startWave(nextWave),
      onRetry: () => this.startWave(completedWave),
    });
    this.currentWave = nextWave;
    this.#refreshStarPreview();
  }

  #handleDefeat(reason) {
    this.#clearArrowLoop();
    this.phase = 'failed';
    this.telemetry.trackEvent(TELEMETRY_EVENTS.WAVE_FAILED, {
      wave: this.currentWave,
      reason,
    });
    this.ui.showPopup({
      title: 'Wave Failed',
      stars: 0,
      message: `${reason} Restarting from wave 1 will restore your momentum.`,
      onNext: () => this.startWave(1),
      onRetry: () => this.startWave(1),
      nextLabel: 'Restart',
      retryLabel: 'Retry Wave 1',
    });
    this.currentWave = 1;
    this.#refreshStarPreview();
  }

  #startArrowLoop() {
    this.#clearArrowLoop();
    this.arrowTimer = setInterval(() => {
      if (this.phase !== 'retreat') {
        return;
      }
      const volley = this.battles.calculateArrowVolley(this.currentArmy);
      if (volley <= 0) {
        return;
      }
      const remaining = this.battles.applyArrowVolley(volley);
      this.ui.setStatus(`Arrow volley strikes ${volley} enemies. ${remaining} remain in pursuit.`);
      if (remaining <= 0) {
        this.#clearArrowLoop();
      }
    }, RETREAT_ARROW_INTERVAL_MS);
  }

  #clearArrowLoop() {
    if (this.arrowTimer) {
      clearInterval(this.arrowTimer);
      this.arrowTimer = null;
    }
  }

  #refreshStarPreview() {
    const best = this.stars[this.currentWave] ?? 0;
    this.ui.setStarPreview(best);
  }
}
