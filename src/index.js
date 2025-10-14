import { applyGate, createGateOptions } from './core/mathGates.js';
import {
  simulateSkirmish,
  resolveReverseChase,
  calculateStarRating,
} from './core/combatSimulator.js';
import { PerformanceGuards } from './core/performanceGuards.js';
import {
  formatGateSymbol,
  formatGateValue,
  formatTimer,
} from './ui/formatting.js';

const RUN_DURATION_MS = 90000;
const FORWARD_WINDOW_MS = 12000;
const SKIRMISH_DELAY_MS = 1600;
const REVERSE_DELAY_MS = 2000;

const INITIAL_STATE = (seed) => ({
  phase: 'idle',
  playerCount: 12,
  enemyCount: 10,
  chaseStrength: 8,
  score: 0,
  scoreDelta: 0,
  wave: 1,
  gateOptions: [],
  selectedGateId: null,
  timerMs: RUN_DURATION_MS,
  startedAt: null,
  isPaused: false,
  starRating: 0,
  seed,
  lastUpdateTimestamp: null,
});

const nextSeedFromUrl = readSeedFromUrl();
let nextSeed = nextSeedFromUrl ?? createSeed();
let state = INITIAL_STATE(nextSeed);
let timerInterval = null;
let pendingTimeouts = [];
let pausedCallbacks = [];

const elements = {};

document.addEventListener('DOMContentLoaded', () => {
  cacheDom();
  attachEvents();
  render();
  startPerformanceGuards();
});

function cacheDom() {
  elements.score = document.querySelector('[data-hud="score"]');
  elements.timer = document.querySelector('[data-hud="timer"]');
  elements.delta = document.querySelector('[data-hud="delta"]');
  elements.phase = document.querySelector('[data-panel="phase"]');
  elements.playerCount = document.querySelector('[data-panel="player-count"]');
  elements.enemyCount = document.querySelector('[data-panel="enemy-count"]');
  elements.starRating = document.querySelector('[data-panel="stars"]');
  elements.gateContainer = document.querySelector('[data-panel="gates"]');
  elements.startButton = document.querySelector('[data-action="start"]');
  elements.pauseButton = document.querySelector('[data-action="pause"]');
  elements.pauseOverlay = document.querySelector(
    '[data-panel="pause-overlay"]'
  );
  elements.steeringSlider = document.querySelector('[data-control="steering"]');
}

function attachEvents() {
  elements.startButton.addEventListener('click', () => {
    beginRun();
  });

  elements.pauseButton.addEventListener('click', () => {
    togglePause();
  });

  elements.pauseOverlay
    .querySelector('[data-action="resume"]')
    .addEventListener('click', () => togglePause(false));
  elements.pauseOverlay
    .querySelector('[data-action="restart"]')
    .addEventListener('click', () => {
      const currentSeed = state.seed;
      togglePause(false);
      beginRun({ seed: currentSeed, preserveSeed: true });
    });
  elements.pauseOverlay
    .querySelector('[data-action="mute"]')
    .addEventListener('click', () => {
      toggleMuteOverlay();
    });

  elements.steeringSlider.addEventListener('pointerdown', () => {
    elements.steeringSlider.classList.add('is-active');
  });
  elements.steeringSlider.addEventListener('pointerup', () => {
    elements.steeringSlider.classList.remove('is-active');
  });
  elements.steeringSlider.addEventListener('touchend', () => {
    elements.steeringSlider.classList.remove('is-active');
  });
}

function beginRun({ seed, preserveSeed = false } = {}) {
  clearPendingTimers();
  const runSeed = seed ?? nextSeed ?? createSeed();
  state = INITIAL_STATE(runSeed);
  state.phase = 'forward';
  state.startedAt = Date.now();
  state.gateOptions = createGateOptions(runSeed, { wave: state.wave });
  state.timerMs = RUN_DURATION_MS;
  state.lastUpdateTimestamp = Date.now();
  updateUrlSeed(runSeed);
  nextSeed = preserveSeed ? runSeed : createSeed();
  startTimer();
  render();
}

function togglePause(forceState) {
  if (state.phase === 'idle' || state.phase === 'end') return;
  const nextPauseState =
    typeof forceState === 'boolean' ? forceState : !state.isPaused;
  state.isPaused = nextPauseState;
  elements.pauseOverlay.hidden = !state.isPaused;
  if (state.isPaused) {
    clearInterval(timerInterval);
  } else {
    state.lastUpdateTimestamp = Date.now();
    startTimer();
    const callbacks = [...pausedCallbacks];
    pausedCallbacks = [];
    callbacks.forEach((cb) => cb());
  }
  render();
}

function startTimer() {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (state.isPaused || state.phase === 'idle') return;
    const now = Date.now();
    const delta = now - state.lastUpdateTimestamp;
    state.lastUpdateTimestamp = now;
    state.timerMs = Math.max(0, state.timerMs - delta);
    if (state.timerMs === 0) {
      concludeRun();
      clearInterval(timerInterval);
    }
    updateHud();
  }, 100);
}

function render() {
  updateHud();
  updatePhasePanel();
  updateGateOptions();
  updateStars();
  updateButtons();
}

function updateHud() {
  elements.score.textContent = state.score.toLocaleString('en-US');
  elements.timer.textContent = formatTimer(state.timerMs);
  if (state.scoreDelta !== 0) {
    elements.delta.textContent = `${state.scoreDelta > 0 ? '+' : ''}${state.scoreDelta}`;
    elements.delta.dataset.state = state.scoreDelta > 0 ? 'gain' : 'loss';
    elements.delta.hidden = false;
  } else {
    elements.delta.hidden = true;
  }
}

function updatePhasePanel() {
  const phaseCopy = {
    idle: 'Ready to deploy',
    forward: 'Forward run: pick your gate!',
    skirmish: 'Skirmish: volleys in flight…',
    reverse: 'Reverse chase: stay ahead!',
    end: 'Run complete. Tap restart to dive back in.',
  };
  elements.phase.textContent = phaseCopy[state.phase] ?? '';
  elements.playerCount.textContent = `${state.playerCount}`;
  elements.enemyCount.textContent = `${state.enemyCount}`;
}

function updateGateOptions() {
  elements.gateContainer.innerHTML = '';
  if (state.phase !== 'forward') {
    elements.gateContainer.dataset.state = 'hidden';
    return;
  }
  elements.gateContainer.dataset.state = 'active';
  state.gateOptions.forEach((gate) => {
    const button = document.createElement('button');
    button.className = `gate-card gate-card--${gate.op}`;
    button.innerHTML = `
      <span class="gate-card__symbol">${formatGateSymbol(gate)}</span>
      <span class="gate-card__value">${formatGateValue(gate)}</span>
    `;
    button.addEventListener('click', () => {
      if (state.phase !== 'forward' || state.isPaused) return;
      state.selectedGateId = gate.id;
      applySelectedGate(gate);
    });
    elements.gateContainer.appendChild(button);
  });
}

function updateStars() {
  const stars = Array.from({ length: 3 }, (_, index) =>
    index < state.starRating ? '★' : '☆'
  ).join(' ');
  elements.starRating.textContent = stars;
}

function updateButtons() {
  elements.startButton.textContent =
    state.phase === 'idle' ? 'Start Run' : 'Restart';
}

function applySelectedGate(gate) {
  state.playerCount = applyGate(state.playerCount, gate);
  flashScoreDelta(0);
  elements.gateContainer.dataset.state = 'locked';
  transitionToSkirmish();
}

function transitionToSkirmish() {
  state.phase = 'skirmish';
  render();
  queueTimeout(() => {
    const result = simulateSkirmish({
      playerCount: state.playerCount,
      enemyCount: state.enemyCount,
      volleyDurationMs: Math.min(FORWARD_WINDOW_MS, 3000),
    });
    state.playerCount = result.playerRemaining;
    state.enemyCount = result.enemyRemaining;
    commitScore(result.scoreDelta);
    transitionToReverse();
  }, SKIRMISH_DELAY_MS);
}

function transitionToReverse() {
  state.phase = 'reverse';
  render();
  queueTimeout(() => {
    const outcome = resolveReverseChase({
      survivors: state.playerCount,
      chaseStrength: state.chaseStrength,
    });
    state.playerCount = Math.max(0, state.playerCount - outcome.casualties);
    commitScore(outcome.bonusScore);
    state.phase = 'end';
    state.starRating = calculateStarRating(state.score);
    render();
  }, REVERSE_DELAY_MS);
}

function commitScore(delta) {
  state.score = Math.max(0, state.score + delta);
  flashScoreDelta(delta);
}

function flashScoreDelta(delta) {
  state.scoreDelta = delta;
  updateHud();
  if (delta === 0) return;
  queueTimeout(() => {
    state.scoreDelta = 0;
    updateHud();
  }, 250);
}

function concludeRun() {
  if (state.phase === 'end') return;
  state.phase = 'end';
  state.starRating = calculateStarRating(state.score);
  render();
}

function queueTimeout(callback, delay) {
  const id = setTimeout(() => {
    pendingTimeouts = pendingTimeouts.filter((entry) => entry !== id);
    if (!state.isPaused) {
      callback();
    } else {
      pausedCallbacks.push(callback);
    }
  }, delay);
  pendingTimeouts.push(id);
}

function clearPendingTimers() {
  pendingTimeouts.forEach((timeoutId) => clearTimeout(timeoutId));
  pendingTimeouts = [];
  pausedCallbacks = [];
  clearInterval(timerInterval);
}

function startPerformanceGuards() {
  const guards = new PerformanceGuards({
    onDegrade: () => document.body.classList.add('is-degraded'),
    onRestore: () => document.body.classList.remove('is-degraded'),
  });
  guards.start();
}

function createSeed() {
  const now = Date.now();
  const random = Math.floor(Math.random() * 100000);
  return `seed-${now}-${random}`;
}

function readSeedFromUrl() {
  try {
    const params = new URLSearchParams(globalThis.location.search);
    const seed = params.get('seed');
    if (!seed) return null;
    const trimmed = seed.trim();
    return trimmed.length > 0 ? trimmed : null;
  } catch {
    return null;
  }
}

function updateUrlSeed(seed) {
  const historyApi = globalThis.history;
  if (!historyApi || typeof historyApi.replaceState !== 'function') {
    return;
  }
  try {
    const url = new URL(globalThis.location.href);
    const sanitized = String(seed).trim();
    url.searchParams.set('seed', sanitized);
    historyApi.replaceState({}, '', url.toString());
  } catch {
    // ignore URL parsing issues in unsupported environments
  }
}

if (typeof window !== 'undefined' && window.__MARAUDERS_ENABLE_TEST_HOOKS__) {
  window.__MARAUDERS_TEST_HOOKS__ = {
    beginRun: (options) => beginRun(options),
    togglePause,
    toggleMute: () => toggleMuteOverlay(),
    setPhase: (phase) => {
      state.phase = phase;
    },
    setTimer: (value) => {
      state.timerMs = value;
    },
    clearOverlay: () => {
      elements.pauseOverlay = null;
    },
    setPaused: (value) => {
      state.isPaused = value;
    },
    getState: () => ({ ...state }),
    getNextSeed: () => nextSeed,
    setScoreDelta: (value) => {
      state.scoreDelta = value;
      updateHud();
    },
    forceRender: () => {
      render();
    },
  };
}

function toggleMuteOverlay() {
  if (!elements.pauseOverlay) return false;
  elements.pauseOverlay.classList.toggle('is-muted');
  return elements.pauseOverlay.classList.contains('is-muted');
}
