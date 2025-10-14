import {
  applyGate,
  evaluateGateQuality,
  generateGateDeck,
} from '../logic/gates.js';
import {
  scoreRun,
  simulateReverseChase,
  simulateSkirmish,
} from '../logic/combat.js';
import { normalizeSeed } from '../utils/random.js';

const INITIAL_PLAYERS = 36;

function createEmitter() {
  const listeners = new Map();
  return {
    on(event, callback) {
      if (!listeners.has(event)) {
        listeners.set(event, new Set());
      }
      listeners.get(event).add(callback);
      return () => listeners.get(event)?.delete(callback);
    },
    emit(event, payload) {
      if (!listeners.has(event)) {
        return;
      }
      for (const callback of listeners.get(event)) {
        callback(payload);
      }
    },
    clear() {
      listeners.clear();
    },
  };
}

function createSnapshot(state) {
  return {
    phase: state.phase,
    stageIndex: state.stageIndex,
    gateOptions: state.gateDeck[state.stageIndex]?.options ?? [],
    chosenGates: state.chosenGates.slice(),
    playerCount: state.playerCount,
    delta: state.delta,
    score: state.score,
    elapsedMs: state.elapsedMs,
    skirmishLog: state.skirmishLog.slice(),
    reverse: state.reverse ? { ...state.reverse } : null,
    results: state.results ? { ...state.results } : null,
    steering: state.steering,
    isPaused: state.isPaused,
    isMuted: state.isMuted,
    vfxMode: state.vfxMode,
    seed: state.seed,
  };
}

export function createGameState({ stageCount = 3 } = {}) {
  const emitter = createEmitter();
  const state = {
    phase: 'idle',
    stageIndex: 0,
    gateDeck: [],
    chosenGates: [],
    playerCount: INITIAL_PLAYERS,
    delta: 0,
    score: 0,
    elapsedMs: 0,
    skirmishLog: [],
    reverse: null,
    results: null,
    steering: 50,
    isPaused: false,
    isMuted: false,
    vfxMode: 'ultra',
    seed: null,
  };

  function emitUpdate() {
    emitter.emit('update', createSnapshot(state));
  }

  function resetRun(seedInput) {
    state.stageIndex = 0;
    state.gateDeck = generateGateDeck({ stages: stageCount, seed: seedInput });
    state.chosenGates = [];
    state.playerCount = INITIAL_PLAYERS;
    state.delta = 0;
    state.score = 0;
    state.elapsedMs = 0;
    state.skirmishLog = [];
    state.reverse = null;
    state.results = null;
  }

  return {
    on: emitter.on,
    getSnapshot() {
      return createSnapshot(state);
    },
    startRun({ seed, steering } = {}) {
      state.seed = normalizeSeed(seed ?? Date.now().toString());
      resetRun(state.seed);
      if (typeof steering === 'number') {
        state.steering = Math.min(100, Math.max(0, steering));
      }
      state.phase = 'forward';
      state.isPaused = false;
      emitUpdate();
    },
    chooseGate(gateId) {
      if (state.phase !== 'forward') {
        return;
      }
      const stage = state.gateDeck[state.stageIndex];
      if (!stage) {
        return;
      }

      const gate = stage.options.find((option) => option.id === gateId);
      if (!gate) {
        return;
      }

      const previousCount = state.playerCount;
      state.playerCount = applyGate(state.playerCount, gate);
      const postGateCount = state.playerCount;
      state.delta = state.playerCount - previousCount;
      state.chosenGates.push(gate);

      if (state.stageIndex < stageCount - 1) {
        state.stageIndex += 1;
        emitUpdate();
        return;
      }

      const aggression = state.steering / 100;
      state.phase = 'skirmish';
      const gateQuality = evaluateGateQuality(state.chosenGates);
      const skirmish = simulateSkirmish({
        players: state.playerCount,
        enemyPower: INITIAL_PLAYERS * 0.75,
        aggression,
        gateQuality,
      });
      state.playerCount = skirmish.remainingPlayers;
      state.delta = state.playerCount - postGateCount;
      state.skirmishLog = skirmish.volleyLog;
      emitUpdate();

      state.phase = 'reverse';
      const reverse = simulateReverseChase({
        players: state.playerCount,
        chasePressure: skirmish.remainingEnemies,
        aggression,
      });
      state.playerCount = reverse.remainingPlayers;
      state.delta = 0;
      state.reverse = reverse;
      emitUpdate();

      state.phase = 'complete';
      const results = scoreRun({
        initialPlayers: INITIAL_PLAYERS,
        playersSurvived: state.playerCount,
        timeSeconds: reverse.timeSeconds,
        gateQuality,
        success: reverse.success,
      });
      state.score = results.score;
      state.results = results;
      emitUpdate();
    },
    updateElapsed(deltaMs) {
      if (state.phase === 'idle' || state.isPaused) {
        return;
      }
      state.elapsedMs = Math.min(180000, state.elapsedMs + deltaMs);
      emitUpdate();
    },
    updateSteering(value) {
      state.steering = Math.min(100, Math.max(0, value));
      emitUpdate();
    },
    togglePause() {
      state.isPaused = !state.isPaused;
      emitter.emit('pause', state.isPaused);
      emitUpdate();
    },
    setMuted(muted) {
      state.isMuted = Boolean(muted);
      emitUpdate();
    },
    setVfxMode(mode) {
      state.vfxMode = mode;
      emitUpdate();
    },
    reset() {
      resetRun(state.seed ?? Date.now().toString());
      state.phase = 'forward';
      state.isPaused = false;
      emitUpdate();
    },
  };
}
