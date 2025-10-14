import { normalizeSeed, mulberry32 } from '../utils/random.js';
import {
  generateGateOptions,
  applyGate,
  formatGateLabel,
  getGateColor,
} from '../game/gate.js';
import { simulateSkirmish } from '../game/skirmish.js';
import { computeReverseTick, rollNextTargetLane } from '../game/reverse.js';
import { createRenderEngine } from '../render/engine.js';

export class GameApp {
  constructor({
    elements,
    persistenceKey = 'math-marauders-progress-v1',
    seed = Date.now(),
  }) {
    if (!elements) {
      throw new Error('GameApp requires DOM element references.');
    }
    this.elements = elements;
    this.persistenceKey = persistenceKey;
    this.formatScore = new Intl.NumberFormat('en', { notation: 'compact' });
    this.state = {
      phase: 'idle',
      wave: 1,
      seed: null,
      rng: mulberry32(normalizeSeed(seed)),
      playerUnits: 0,
      score: 0,
      timerSeconds: 120,
      timerHandle: null,
      forwardChoices: [],
      gateIndex: 0,
      currentGates: [],
      enemyCount: 0,
      reverseGateQueue: [],
      reverseElapsed: 0,
      reverseDuration: 20,
      sliderPosition: 0.5,
      targetLane: 0.5,
      targetCountdown: 2,
      reverseAnimationId: null,
      paused: false,
      muted: false,
      lastFrameTime: null,
      persistence: {
        highScore: 0,
        bestStars: 0,
        lastSeed: null,
      },
    };

    this.renderBridge = null;
    this.stepReverse = this.stepReverse.bind(this);
  }

  init() {
    this.loadPersistence();
    this.elements.start.disabled = false;
    this.updateHud();
    this.setupRenderBridge();
    this.setupEventListeners();
  }

  setupRenderBridge() {
    if (!this.elements.sceneRoot) {
      console.warn('Scene root missing; three.js renderer not initialised.');
      return;
    }

    this.renderBridge = createRenderEngine({
      container: this.elements.sceneRoot,
    });

    this.renderBridge.setPhase('idle');
    this.renderBridge.setPlayerUnits(this.state.playerUnits);
    this.renderBridge.setEnemyUnits(0);
  }

  loadPersistence() {
    try {
      const stored = localStorage.getItem(this.persistenceKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.state.persistence = { ...this.state.persistence, ...parsed };
      }
    } catch (error) {
      console.warn('Persistence read failed', error);
    }
  }

  savePersistence() {
    try {
      localStorage.setItem(
        this.persistenceKey,
        JSON.stringify(this.state.persistence)
      );
    } catch (error) {
      console.warn('Persistence write failed', error);
    }
  }

  addLogEntry(message) {
    const stripped = message.replace(/<[^>]*>/g, '');
    console.log(`[Math Marauders] ${stripped}`);
  }

  updateHud() {
    this.elements.score.textContent = this.formatScore.format(
      Math.round(this.state.score)
    );
    this.elements.timer.textContent = `${this.state.timerSeconds.toFixed(1)}s`;
    this.elements.units.textContent = this.state.playerUnits;
  }

  updateStage(label) {
    this.elements.stageLabel.textContent = label;
  }

  setPhase(newPhase) {
    this.state.phase = newPhase;
    this.elements.gatePanel.classList.toggle('hidden', newPhase !== 'forward');
    this.elements.skirmishPanel.classList.toggle(
      'hidden',
      newPhase !== 'skirmish'
    );
    this.elements.reversePanel.classList.toggle(
      'hidden',
      !newPhase.startsWith('reverse')
    );
  }

  resolveSeedFromUrl() {
    const params = new URLSearchParams(window.location.search);
    if (params.has('seed')) {
      return normalizeSeed(params.get('seed'));
    }
    return normalizeSeed(this.state.persistence.lastSeed ?? Date.now());
  }

  resetState() {
    this.cancelReverseAnimation();
    this.clearRunTimer();
    const seed = this.resolveSeedFromUrl();
    this.state.seed = seed;
    this.state.persistence.lastSeed = seed;
    this.state.rng = mulberry32(seed);
    this.state.playerUnits = 24;
    this.state.score = 0;
    this.state.timerSeconds = 120;
    this.state.forwardChoices = [];
    this.state.gateIndex = 0;
    this.state.currentGates = [];
    this.state.enemyCount = 0;
    this.state.reverseGateQueue = [];
    this.state.reverseElapsed = 0;
    this.state.reverseDuration = 20;
    this.state.sliderPosition = 0.5;
    this.state.targetLane = 0.5;
    this.state.targetCountdown = 2.4;
    this.state.paused = false;
    this.state.lastFrameTime = null;
    this.elements.reverseGates.innerHTML = '';
    this.elements.reverseProgress.style.width = '0%';
    this.elements.steerInput.value = '50';
    this.updateTargetIndicator();
    this.updateHud();
    this.addLogEntry(
      `Run seed <strong>${seed}</strong> locked in. Forward march!`
    );
    this.savePersistence();
    if (this.renderBridge) {
      this.renderBridge.setPlayerUnits(this.state.playerUnits);
      this.renderBridge.setEnemyUnits(0);
      this.renderBridge.resetGates();
      this.renderBridge.setPhase('forward');
      this.renderBridge.setReverseProgress(0);
      this.renderBridge.setReverseTargetLane(this.state.targetLane);
    }
  }

  startTimer() {
    if (this.state.timerHandle) {
      clearInterval(this.state.timerHandle);
    }
    this.state.timerHandle = setInterval(() => {
      if (this.state.paused || this.state.phase === 'idle') {
        return;
      }
      this.state.timerSeconds = Math.max(0, this.state.timerSeconds - 0.1);
      this.updateHud();
      if (this.state.timerSeconds <= 0) {
        this.finishRun(false, 'Out of time!');
      }
    }, 100);
  }

  clearRunTimer() {
    if (this.state.timerHandle) {
      clearInterval(this.state.timerHandle);
      this.state.timerHandle = null;
    }
  }

  renderGateOptions() {
    this.state.currentGates = generateGateOptions({
      rng: this.state.rng,
      wave: this.state.wave,
      currentCount: this.state.playerUnits,
    });
    this.elements.gateOptions.innerHTML = '';
    this.state.currentGates.forEach((gate, gateIndex) => {
      const button = document.createElement('button');
      button.className = 'gate-card';
      button.style.background = getGateColor(gate);
      button.innerHTML = `<div>${formatGateLabel(gate)}</div><span>Projected: ${applyGate(
        this.state.playerUnits,
        gate
      )} troops</span>`;
      button.addEventListener('click', () => this.handleGateChoice(gateIndex));
      this.elements.gateOptions.appendChild(button);
    });
    if (this.renderBridge) {
      const projections = this.state.currentGates.map((gate) =>
        applyGate(this.state.playerUnits, gate)
      );
      this.renderBridge.showForwardGates({
        index: this.state.gateIndex,
        gates: this.state.currentGates,
        playerCount: this.state.playerUnits,
        projections,
      });
    }
  }

  handleGateChoice(index) {
    if (this.state.phase !== 'forward') return;
    const gate = this.state.currentGates[index];
    const before = this.state.playerUnits;
    const after = applyGate(before, gate);
    this.state.playerUnits = after;
    const delta = after - before;
    this.state.score += Math.max(0, delta) * 12 + Math.max(0, before) * 0.5;
    this.state.forwardChoices.push({ gate, before, after });
    this.addLogEntry(
      `Gate chosen: <strong>${formatGateLabel(gate)}</strong> → ${after} troops`
    );
    this.state.gateIndex += 1;
    this.updateHud();
    if (this.renderBridge) {
      this.renderBridge.setPlayerUnits(this.state.playerUnits);
      this.renderBridge.resolveForwardGate({
        index: this.state.gateIndex - 1,
        choiceIndex: index,
        resultingCount: after,
      });
    }
    if (this.state.gateIndex >= 3) {
      this.enterSkirmish();
    } else {
      this.renderGateOptions();
    }
  }

  enterForwardPhase() {
    this.updateStage('Forward Run');
    this.setPhase('forward');
    this.renderGateOptions();
    if (this.renderBridge) {
      this.renderBridge.setPhase('forward');
    }
  }

  renderSkirmishTimeline(result) {
    this.elements.skirmishTicks.textContent = result.ticks.length;
    this.elements.skirmishDuration.textContent = `${result.durationMs}ms`;
    this.elements.skirmishSurvivors.textContent = Math.max(
      0,
      result.playerRemaining
    );
    this.elements.skirmishEnemy.textContent = this.state.enemyCount;
  }

  enterSkirmish() {
    this.updateStage('Skirmish');
    this.setPhase('skirmish');
    const enemy = Math.max(6, Math.round(this.state.playerUnits * 0.8 + 6));
    this.state.enemyCount = enemy;
    this.addLogEntry(
      `Enemy squad spotted: <strong>${enemy}</strong> marauders.`
    );
    const result = simulateSkirmish({
      playerCount: this.state.playerUnits,
      enemyCount: enemy,
      rng: this.state.rng,
    });
    this.renderSkirmishTimeline(result);
    this.state.playerUnits = Math.max(0, result.playerRemaining);
    this.state.score +=
      Math.max(0, result.playerRemaining) * 18 + (1000 - result.durationMs);
    this.updateHud();
    if (this.renderBridge) {
      this.renderBridge.setPhase('skirmish');
      this.renderBridge.setPlayerUnits(this.state.playerUnits);
      this.renderBridge.setEnemyUnits(result.enemyRemaining ?? 0);
    }
    if (this.state.playerUnits <= 0) {
      this.finishRun(false, 'Formation wiped during skirmish.');
    }
  }

  prepareReverseGates() {
    this.state.reverseGateQueue = [
      {
        threshold: 0.35,
        resolved: false,
        options: generateGateOptions({
          rng: this.state.rng,
          wave: this.state.wave,
          currentCount: this.state.playerUnits,
        }),
      },
      {
        threshold: 0.75,
        resolved: false,
        options: generateGateOptions({
          rng: this.state.rng,
          wave: this.state.wave + 1,
          currentCount: this.state.playerUnits,
        }),
      },
    ];
  }

  updateTargetIndicator() {
    const percent = this.state.targetLane * 100;
    this.elements.targetIndicator.style.left = `${percent}%`;
    if (this.renderBridge) {
      this.renderBridge.setReverseTargetLane(this.state.targetLane);
    }
  }

  renderReverseGate(gateEntry) {
    this.elements.reverseGates.innerHTML = '';
    gateEntry.options.forEach((gate) => {
      const button = document.createElement('button');
      button.className = 'gate-card';
      button.style.background = getGateColor(gate);
      button.innerHTML = `<div>${formatGateLabel(gate)}</div><span>Stabilise to ${applyGate(
        this.state.playerUnits,
        gate
      )} troops</span>`;
      button.addEventListener('click', () => {
        this.elements.reverseGates.innerHTML = '';
        this.state.playerUnits = applyGate(this.state.playerUnits, gate);
        this.state.score += Math.max(0, this.state.playerUnits) * 10;
        gateEntry.resolved = true;
        this.addLogEntry(
          `Reverse gate: <strong>${formatGateLabel(gate)}</strong> stabilised formation.`
        );
        this.updateHud();
        this.state.phase = 'reverse';
        this.state.targetLane = rollNextTargetLane(this.state.rng);
        this.state.targetCountdown = 1.6 + this.state.rng() * 1.2;
        this.elements.reverseUnits.textContent = this.state.playerUnits;
        this.updateTargetIndicator();
        if (this.renderBridge) {
          this.renderBridge.setPlayerUnits(this.state.playerUnits);
          this.renderBridge.hideReverseGate();
          this.renderBridge.setReverseTargetLane(this.state.targetLane);
        }
      });
      this.elements.reverseGates.appendChild(button);
    });
    if (this.renderBridge) {
      this.renderBridge.showReverseGate({ options: gateEntry.options });
    }
  }

  stepReverse(timestamp) {
    if (this.state.phase !== 'reverse' && this.state.phase !== 'reverse-gate') {
      return;
    }
    if (this.state.paused) {
      this.state.lastFrameTime = timestamp;
      this.state.reverseAnimationId = requestAnimationFrame(this.stepReverse);
      return;
    }
    if (this.state.lastFrameTime == null) {
      this.state.lastFrameTime = timestamp;
    }
    const delta = Math.min((timestamp - this.state.lastFrameTime) / 1000, 0.25);
    this.state.lastFrameTime = timestamp;

    if (this.state.phase === 'reverse') {
      this.state.targetCountdown -= delta;
      if (this.state.targetCountdown <= 0) {
        this.state.targetLane = rollNextTargetLane(this.state.rng);
        this.state.targetCountdown = 1.8 + this.state.rng() * 1.6;
        this.updateTargetIndicator();
        this.addLogEntry('Chaser surge! Formation shifts lane.');
      }

      const tick = computeReverseTick({
        units: this.state.playerUnits,
        sliderPosition: this.state.sliderPosition,
        targetLane: this.state.targetLane,
        dt: delta,
      });
      this.state.playerUnits = tick.units;
      this.state.reverseElapsed += delta;
      const progress = Math.min(
        1,
        this.state.reverseElapsed / this.state.reverseDuration
      );
      this.elements.reverseProgress.style.width = `${progress * 100}%`;
      this.elements.reverseUnits.textContent = this.state.playerUnits;
      this.elements.reverseGap.textContent = `${Math.max(
        0,
        Math.round((1 - progress) * 40 + this.state.playerUnits / 2)
      )}m`;
      this.updateHud();
      if (this.renderBridge) {
        this.renderBridge.setPlayerUnits(this.state.playerUnits);
        this.renderBridge.setReverseProgress(progress);
      }

      this.state.reverseGateQueue.forEach((gateEntry) => {
        if (!gateEntry.resolved && progress >= gateEntry.threshold) {
          this.state.phase = 'reverse-gate';
          this.renderReverseGate(gateEntry);
        }
      });

      if (this.state.playerUnits <= 0) {
        this.finishRun(false, 'Chasers overran the squad.');
        return;
      }

      if (progress >= 1) {
        this.finishRun(true, 'Run complete!');
        return;
      }
    }

    this.state.reverseAnimationId = requestAnimationFrame(this.stepReverse);
  }

  enterReverse() {
    if (this.state.playerUnits <= 0) {
      this.finishRun(false, 'No units left for the retreat.');
      return;
    }
    this.updateStage('Reverse Chase');
    this.setPhase('reverse');
    this.state.reverseElapsed = 0;
    this.state.reverseDuration = 18 + this.state.rng() * 4;
    this.state.targetLane = rollNextTargetLane(this.state.rng);
    this.state.targetCountdown = 2 + this.state.rng() * 1.2;
    this.elements.reverseUnits.textContent = this.state.playerUnits;
    this.elements.reverseGap.textContent = '40m';
    this.elements.reverseProgress.style.width = '0%';
    this.prepareReverseGates();
    this.updateTargetIndicator();
    this.addLogEntry('Reverse chase engaged! Keep the lane tight.');
    this.state.lastFrameTime = null;
    this.cancelReverseAnimation();
    this.state.reverseAnimationId = requestAnimationFrame(this.stepReverse);
    if (this.renderBridge) {
      this.renderBridge.setPhase('reverse');
      this.renderBridge.setPlayerUnits(this.state.playerUnits);
      this.renderBridge.setReverseProgress(0);
      this.renderBridge.setReverseTargetLane(this.state.targetLane);
    }
  }

  cancelReverseAnimation() {
    if (this.state.reverseAnimationId) {
      cancelAnimationFrame(this.state.reverseAnimationId);
      this.state.reverseAnimationId = null;
    }
  }

  calculateStars(score) {
    if (score >= 1400) return 3;
    if (score >= 900) return 2;
    if (score >= 450) return 1;
    return 0;
  }

  finishRun(success, reason) {
    if (this.state.phase === 'idle') {
      return;
    }
    this.cancelReverseAnimation();
    this.clearRunTimer();
    this.state.phase = 'idle';
    this.state.paused = false;
    this.hidePauseMenu();
    if (!success && reason) {
      this.addLogEntry(`<strong>Failure:</strong> ${reason}`);
    }
    if (success) {
      this.state.score += Math.round(this.state.playerUnits * 22);
    }
    this.updateHud();
    const finalScore = Math.max(0, Math.round(this.state.score));
    const stars = this.calculateStars(finalScore);
    this.renderEndCard(success, finalScore, stars);
    this.persistRun(finalScore, stars);
    if (this.renderBridge) {
      this.renderBridge.setPhase('idle');
      this.renderBridge.setEnemyUnits(0);
    }
  }

  renderEndCard(success, finalScore, stars) {
    this.elements.endTitle.textContent = success ? 'Victory!' : 'Defeat';
    this.elements.endScore.textContent = `Final Score: ${this.formatScore.format(finalScore)}`;
    this.elements.stars.innerHTML = '';
    for (let i = 0; i < 3; i += 1) {
      const star = document.createElement('span');
      star.textContent = i < stars ? '★' : '☆';
      this.elements.stars.appendChild(star);
    }
    this.elements.overlay.classList.remove('hidden');
    this.elements.start.disabled = false;
  }

  persistRun(finalScore, stars) {
    this.state.persistence.highScore = Math.max(
      this.state.persistence.highScore ?? 0,
      finalScore
    );
    this.state.persistence.bestStars = Math.max(
      this.state.persistence.bestStars ?? 0,
      stars
    );
    this.savePersistence();
  }

  togglePauseMenu() {
    if (this.state.phase === 'idle') {
      return;
    }
    const isOpen = this.elements.pauseMenu.style.display === 'flex';
    this.elements.pauseMenu.style.display = isOpen ? 'none' : 'flex';
    this.elements.pauseButton.setAttribute('aria-expanded', String(!isOpen));
    this.state.paused = !isOpen ? true : false;
    if (!isOpen) {
      this.addLogEntry('Paused. Take a breath.');
    }
  }

  resumePlay() {
    if (this.state.phase === 'idle') {
      return;
    }
    this.hidePauseMenu();
    this.state.paused = false;
    this.addLogEntry('Back in action!');
  }

  toggleMute() {
    this.state.muted = !this.state.muted;
    document.body.dataset.muted = this.state.muted ? 'true' : 'false';
    this.addLogEntry(
      this.state.muted ? 'Mute toggled on.' : 'Mute toggled off.'
    );
  }

  setupEventListeners() {
    this.elements.start.addEventListener('click', () => {
      this.elements.overlay.classList.add('hidden');
      this.elements.start.disabled = true;
      this.resetState();
      this.startTimer();
      this.enterForwardPhase();
    });

    this.elements.overlayRestart.addEventListener('click', () => {
      this.elements.overlay.classList.add('hidden');
      this.elements.start.click();
    });

    this.elements.skirmishNext.addEventListener('click', () => {
      if (this.state.phase === 'skirmish') {
        this.enterReverse();
      }
    });

    this.elements.pauseButton.addEventListener('click', () =>
      this.togglePauseMenu()
    );
    this.elements.resumeButton.addEventListener('click', () =>
      this.resumePlay()
    );
    this.elements.restartButton.addEventListener('click', () => {
      this.hidePauseMenu();
      this.elements.start.click();
    });
    this.elements.muteButton.addEventListener('click', () => this.toggleMute());

    this.elements.steerInput.addEventListener('input', (event) => {
      const value = Number(event.target.value) / 100;
      this.state.sliderPosition = value;
      if (this.renderBridge) {
        this.renderBridge.setSteerPosition(value);
      }
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.state.paused = true;
      }
    });
  }

  hidePauseMenu() {
    this.elements.pauseMenu.style.display = 'none';
    this.elements.pauseButton.setAttribute('aria-expanded', 'false');
  }
}
