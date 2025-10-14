import { applyGate, generateGateSet } from './gates.js';
import { createSeededRng } from './random.js';
import { runSkirmish } from './skirmish.js';
import { runReverseChase } from './reverse.js';
import { computeScore, computeStarRating } from './scoring.js';
import { createFpsMonitor } from './performance.js';

const INITIAL_UNITS = 24;
const FORWARD_DECISIONS = 3;
const ENEMY_RATIO = 0.8;

export class GameEngine {
  constructor({ onChange, monitorPerformance = true } = {}) {
    this.state = createInitialState();
    this.subscribers = new Set();
    if (onChange) {
      this.subscribe(onChange);
    }
    this.rng = createSeededRng(this.state.seed);
    this.timer = null;
    this.pendingPhaseTimeout = null;
    this.fpsMonitor = monitorPerformance
      ? createFpsMonitor({
          degrade: ({ averageFps }) => {
            if (this.state.effectsMode !== 'low') {
              this.setEffectsMode('low', 'auto', averageFps);
            }
          },
          upgrade: ({ averageFps }) => {
            if (
              this.state.effectsMode !== 'ultra' &&
              this.state.effectsSource === 'auto'
            ) {
              this.setEffectsMode('ultra', 'auto', averageFps);
            }
          },
        })
      : {
          stop() {},
          getAverageFps() {
            return 60;
          },
        };
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    callback(this.getState());
    return () => {
      this.subscribers.delete(callback);
    };
  }

  getState() {
    return { ...this.state };
  }

  start(seed = Date.now().toString()) {
    this.resetTimers();
    this.rng = createSeededRng(seed);
    this.state = {
      ...createInitialState(),
      seed,
      phase: 'forward',
      forward: {
        decisionIndex: 0,
        totalDecisions: FORWARD_DECISIONS,
        current: generateGateSet({
          wave: 1,
          baseCount: INITIAL_UNITS,
          seed: this.rng,
        }),
      },
      logs: ['Run started. Scout ahead!'],
    };
    this.startTimer();
    this.notify();
  }

  chooseGate(optionId) {
    const currentSet = this.state.forward.current;
    const gate = currentSet?.options.find((option) => option.id === optionId);
    if (
      this.state.phase !== 'forward' ||
      this.state.isPaused ||
      !currentSet ||
      !gate
    ) {
      return;
    }

    const { newCount, delta } = applyGate(this.state.units.current, gate);
    const chosen = {
      gateId: currentSet.id,
      label: gate.label,
      delta,
      tone: gate.dominantTone,
    };

    this.state = {
      ...this.state,
      units: {
        ...this.state.units,
        current: newCount,
      },
      forward: {
        ...this.state.forward,
        decisionIndex: this.state.forward.decisionIndex + 1,
        current:
          this.state.forward.decisionIndex + 1 <
          this.state.forward.totalDecisions
            ? generateGateSet({
                wave: this.state.wave,
                baseCount: newCount,
                seed: this.rng,
              })
            : null,
      },
      gatesTaken: [...this.state.gatesTaken, chosen],
      logs: [
        ...this.state.logs,
        `Gate picked: ${gate.label} (${delta >= 0 ? '+' : ''}${delta} units)`,
      ],
    };

    this.notify();

    if (this.state.forward.decisionIndex >= this.state.forward.totalDecisions) {
      this.queueSkirmish();
    }
  }

  queueSkirmish() {
    this.state = {
      ...this.state,
      phase: 'skirmish',
      logs: [...this.state.logs, 'Skirmish engaged!'],
    };
    this.notify();

    this.pendingPhaseTimeout = setTimeout(() => {
      this.runSkirmishPhase();
    }, 350);
  }

  runSkirmishPhase() {
    const enemyCount = Math.max(
      6,
      Math.round(this.state.units.current / ENEMY_RATIO)
    );
    const result = runSkirmish({
      playerCount: this.state.units.current,
      enemyCount,
      seed: this.rng,
    });

    this.state = {
      ...this.state,
      units: {
        ...this.state.units,
        current: result.playersRemaining,
      },
      skirmish: result,
      logs: [
        ...this.state.logs,
        `Volley count: ${result.volleys}. ${result.playersRemaining} units press onward.`,
      ],
    };
    this.notify();

    this.pendingPhaseTimeout = setTimeout(() => {
      this.runReversePhase();
    }, 400);
  }

  runReversePhase() {
    this.state = {
      ...this.state,
      phase: 'reverse',
      logs: [...this.state.logs, 'Reverse chase initiated!'],
    };
    this.notify();

    const result = runReverseChase({
      playerCount: this.state.units.current,
      gateCount: this.state.forward.totalDecisions,
      seed: this.rng,
    });

    this.state = {
      ...this.state,
      units: {
        ...this.state.units,
        current: result.playersRemaining,
      },
      reverse: result,
      logs: [
        ...this.state.logs,
        result.outcome === 'escape'
          ? 'Squad escapes the chase!'
          : 'The horde caught up—regroup!',
      ],
    };
    this.notify();
    this.pendingPhaseTimeout = setTimeout(() => {
      this.finishRun();
    }, 300);
  }

  finishRun() {
    const totalElapsed = this.state.elapsedSeconds;
    const score = computeScore({
      initialUnits: this.state.units.initial,
      remainingUnits: this.state.units.current,
      elapsedSeconds: totalElapsed,
      gatesTaken: this.state.gatesTaken.length,
      skirmishVolleys: this.state.skirmish?.volleys ?? 0,
      chaseOutcome: this.state.reverse?.outcome ?? 'escape',
    });
    const survivalRate =
      this.state.units.initial === 0
        ? 0
        : this.state.units.current / this.state.units.initial;
    const stars = computeStarRating({
      score: score.total,
      survivalRate,
      elapsedSeconds: totalElapsed,
    });

    this.resetTimers();
    this.state = {
      ...this.state,
      phase: 'end',
      score,
      stars,
      logs: [...this.state.logs, `Run complete with score ${score.total}.`],
    };
    this.notify();
  }

  startTimer() {
    this.timer = setInterval(() => {
      if (!this.state.isPaused) {
        this.state = {
          ...this.state,
          elapsedSeconds: this.state.elapsedSeconds + 1,
        };
        this.notify();
      }
    }, 1000);
  }

  resetTimers() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.pendingPhaseTimeout) {
      clearTimeout(this.pendingPhaseTimeout);
      this.pendingPhaseTimeout = null;
    }
  }

  togglePause() {
    if (this.state.phase === 'idle' || this.state.phase === 'end') {
      return;
    }
    const isPaused = !this.state.isPaused;
    if (isPaused) {
      this.resetTimers();
    } else {
      this.startTimer();
    }
    this.state = {
      ...this.state,
      isPaused,
    };
    this.notify();
  }

  setMute(muted) {
    this.state = {
      ...this.state,
      muted,
    };
    this.notify();
  }

  setEffectsMode(mode, source = 'manual', averageFps) {
    if (
      this.state.effectsMode === mode &&
      this.state.effectsSource === source
    ) {
      return;
    }
    const note =
      source === 'auto'
        ? `Auto performance switch → ${mode.toUpperCase()} (${averageFps?.toFixed(1)} fps)`
        : `Effects mode set to ${mode}`;
    this.state = {
      ...this.state,
      effectsMode: mode,
      effectsSource: source,
      logs: [...this.state.logs, note],
    };
    this.notify();
  }

  restart() {
    if (this.state.phase === 'idle') {
      this.start(this.state.seed);
    } else {
      this.start(this.state.seed + '-rerun');
    }
  }

  notify() {
    const snapshot = this.getState();
    this.subscribers.forEach((callback) => callback(snapshot));
  }
}

function createInitialState() {
  return {
    phase: 'idle',
    wave: 1,
    seed: Date.now().toString(),
    elapsedSeconds: 0,
    units: {
      initial: INITIAL_UNITS,
      current: INITIAL_UNITS,
    },
    forward: {
      decisionIndex: 0,
      totalDecisions: FORWARD_DECISIONS,
      current: null,
    },
    skirmish: null,
    reverse: null,
    gatesTaken: [],
    score: null,
    stars: { stars: 0, thresholds: [] },
    logs: [],
    isPaused: false,
    muted: false,
    effectsMode: 'ultra',
    effectsSource: 'manual',
  };
}
