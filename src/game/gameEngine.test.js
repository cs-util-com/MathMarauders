import { GameEngine } from './gameEngine.js';

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

// why this test matters: the forward run must start with player agency through two-gate choices.
test('starting a run seeds forward gate options', () => {
  const engine = new GameEngine({ monitorPerformance: false });
  engine.start('unit-test');
  const state = engine.getState();
  expect(state.phase).toBe('forward');
  expect(state.forward.current?.options.length).toBe(2);
});

// why this test matters: the full loop must resolve to an end card for scoring to appear.
test('resolving a run reaches the end card', () => {
  const engine = new GameEngine({ monitorPerformance: false });
  engine.start('loop-seed');
  let current = engine.getState();
  while (current.phase === 'forward' && current.forward.current) {
    engine.chooseGate(current.forward.current.options[0].id);
    current = engine.getState();
  }
  jest.advanceTimersByTime(2000);
  const finalState = engine.getState();
  expect(finalState.phase).toBe('end');
  expect(finalState.score?.total).toBeGreaterThan(0);
});

// why this test matters: pause/resume must freeze timers for predictable pacing.
test('pausing the run stops the timer', () => {
  const engine = new GameEngine({ monitorPerformance: false });
  engine.start('pause-seed');
  jest.advanceTimersByTime(1000);
  const midState = engine.getState();
  expect(midState.elapsedSeconds).toBeGreaterThan(0);
  engine.togglePause();
  const pausedState = engine.getState();
  expect(pausedState.isPaused).toBe(true);
  jest.advanceTimersByTime(3000);
  expect(engine.getState().elapsedSeconds).toBe(pausedState.elapsedSeconds);
  engine.togglePause();
  jest.advanceTimersByTime(1000);
  expect(engine.getState().elapsedSeconds).toBeGreaterThan(
    pausedState.elapsedSeconds
  );
});

// why this test matters: manual toggles for mute/effects populate HUD messaging and logs.
test('manual toggles update mute and effects state', () => {
  const engine = new GameEngine({ monitorPerformance: false });
  engine.start('toggle-seed');
  engine.setMute(true);
  engine.setEffectsMode('low', 'manual');
  engine.setEffectsMode('low', 'manual');
  engine.setEffectsMode('ultra', 'auto', 58.4);
  const state = engine.getState();
  expect(state.muted).toBe(true);
  expect(state.effectsMode).toBe('ultra');
  expect(state.logs[state.logs.length - 1]).toContain(
    'Auto performance switch'
  );
});

// why this test matters: restarting mid-run should reseed the forward queue for replayability.
test('restart reseeds the run', () => {
  const engine = new GameEngine({ monitorPerformance: false });
  engine.start('seed-a');
  const firstSeed = engine.getState().seed;
  engine.restart();
  const secondSeed = engine.getState().seed;
  expect(secondSeed).not.toEqual(firstSeed);
  expect(engine.getState().forward.current).not.toBeNull();
});

// why this test matters: guards in the forward flow prevent runtime errors when UI events fire unexpectedly.
test('chooseGate ignores clicks outside forward options', () => {
  const engine = new GameEngine({ monitorPerformance: false });
  engine.chooseGate('missing');
  engine.start('forward-guard');
  engine.state.forward.current = null;
  engine.chooseGate('opt');
  expect(engine.getState().gatesTaken).toHaveLength(0);
  engine.state.forward.current = {
    id: 'gate-x',
    options: [
      { id: 'valid', label: '+10', segments: [], dominantTone: 'positive' },
    ],
  };
  engine.chooseGate('invalid');
  expect(engine.getState().gatesTaken).toHaveLength(0);
});

// why this test matters: pause guard should not alter state when inactive.
test('togglePause returns early when idle', () => {
  const engine = new GameEngine({ monitorPerformance: false });
  engine.togglePause();
  expect(engine.getState().isPaused).toBe(false);
});

// why this test matters: restarting from idle should reuse the same seed path.
test('restart from idle starts a fresh run', () => {
  const engine = new GameEngine({ monitorPerformance: false });
  const initialSeed = engine.getState().seed;
  engine.restart();
  const nextState = engine.getState();
  expect(nextState.phase).toBe('forward');
  expect(nextState.seed).toBe(initialSeed);
});
