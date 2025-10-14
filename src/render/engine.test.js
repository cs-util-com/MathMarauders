import { createRenderEngine } from './engine.js';

beforeEach(() => {
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

// why this test matters: the renderer must gracefully fall back when WebGL is unavailable (e.g., in tests).
test('createRenderEngine returns no-op bridge without WebGL', () => {
  const container = document.createElement('div');
  const bridge = createRenderEngine({ container });
  expect(typeof bridge.setPhase).toBe('function');
  expect(() => bridge.setPhase('forward')).not.toThrow();
  expect(container.querySelector('canvas')).toBeNull();
});

// why this test matters: the engine initialises a canvas and exposes bridge APIs when WebGL is available.
test('createRenderEngine initialises canvas and bridge methods', () => {
  const originalGetContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = jest.fn(() => ({}));

  const container = document.createElement('div');
  Object.defineProperty(container, 'clientWidth', {
    value: 640,
    configurable: true,
  });
  Object.defineProperty(container, 'clientHeight', {
    value: 360,
    configurable: true,
  });

  const rafCallbacks = [];
  const originalRaf = global.requestAnimationFrame;
  const originalCancelRaf = global.cancelAnimationFrame;
  global.requestAnimationFrame = (cb) => {
    rafCallbacks.push(cb);
    return rafCallbacks.length;
  };
  global.cancelAnimationFrame = jest.fn();

  const bridge = createRenderEngine({ container });
  const canvas = container.querySelector('canvas');
  expect(canvas).not.toBeNull();

  bridge.setPhase('forward');
  bridge.setPlayerUnits(24);
  bridge.setEnemyUnits(12);
  bridge.showForwardGates({
    index: 0,
    gates: [
      { type: 'add', value: 5, color: '#33d6a6', label: '+5' },
      { type: 'multiply', value: 1.5, color: '#ffd166', label: '×1.5' },
    ],
    playerCount: 24,
    projections: [29, 36],
  });
  bridge.resolveForwardGate({ index: 0, choiceIndex: 1, resultingCount: 36 });
  bridge.setReverseProgress(0.4);
  bridge.setReverseTargetLane(0.7);
  bridge.setSteerPosition(0.2);
  bridge.showReverseGate({
    options: [{ type: 'add', value: 3, color: '#33d6a6', label: '+3' }],
  });
  bridge.hideReverseGate();
  bridge.resetGates();

  // run a pending frame if scheduled
  rafCallbacks.forEach((cb) => cb(16));

  bridge.dispose();

  HTMLCanvasElement.prototype.getContext = originalGetContext;
  global.requestAnimationFrame = originalRaf;
  global.cancelAnimationFrame = originalCancelRaf || (() => {});
});

// why this test matters: missing container should surface a clear developer error.
test('createRenderEngine throws when container is missing', () => {
  expect(() => createRenderEngine({ container: null })).toThrow(
    'createRenderEngine requires a container element.'
  );
});
