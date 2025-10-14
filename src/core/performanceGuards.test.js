import {
  PerformanceGuards,
  evaluatePerformanceWindow,
} from './performanceGuards.js';

// why this test matters: FPS safeguards gate visual downgrades for stability.
describe('evaluatePerformanceWindow', () => {
  it('signals degrade when fps stays under threshold', () => {
    const samples = [40, 42, 41, 39];
    expect(
      evaluatePerformanceWindow({
        samples,
        degradeThreshold: 50,
        restoreThreshold: 58,
      })
    ).toEqual({ degrade: true, restore: false });
  });

  it('signals restore when fps recovers above threshold', () => {
    const samples = [60, 61, 59, 60];
    expect(
      evaluatePerformanceWindow({
        samples,
        degradeThreshold: 50,
        restoreThreshold: 58,
      })
    ).toEqual({ degrade: false, restore: true });
  });

  it('does nothing when fps is stable in the safe band', () => {
    const samples = [55, 56, 54, 55];
    expect(
      evaluatePerformanceWindow({
        samples,
        degradeThreshold: 50,
        restoreThreshold: 58,
      })
    ).toEqual({ degrade: false, restore: false });
  });

  it('returns neutral result when no samples are collected', () => {
    expect(
      evaluatePerformanceWindow({
        samples: [],
        degradeThreshold: 50,
        restoreThreshold: 58,
      })
    ).toEqual({ degrade: false, restore: false });
  });
});

// why this test matters: guards must trigger degrade/restore callbacks deterministically.
describe('PerformanceGuards', () => {
  let originalNow;

  beforeEach(() => {
    originalNow = global.performance.now;
    global.performance.now = () => Date.now();
  });

  afterEach(() => {
    global.performance.now = originalNow;
  });

  it('invokes onDegrade when average fps drops below threshold', () => {
    const degrade = jest.fn();
    const guard = new PerformanceGuards({
      degradeThreshold: 50,
      restoreThreshold: 58,
      onDegrade: degrade,
    });
    guard.samples = [
      { time: 0, fps: 40 },
      { time: 16, fps: 45 },
    ];
    guard._evaluate();
    expect(degrade).toHaveBeenCalled();
  });

  it('invokes onRestore when fps recovers and state is degraded', () => {
    const restore = jest.fn();
    const guard = new PerformanceGuards({
      degradeThreshold: 50,
      restoreThreshold: 58,
      onRestore: restore,
    });
    guard.isDegraded = true;
    guard.samples = [
      { time: 0, fps: 60 },
      { time: 16, fps: 62 },
    ];
    guard._evaluate();
    expect(restore).toHaveBeenCalled();
  });
  it('skips starting the loop when requestAnimationFrame is unavailable', () => {
    const guard = new PerformanceGuards();
    const originalRaf = global.requestAnimationFrame;
    delete global.requestAnimationFrame;
    guard.start();
    expect(guard._rafId).toBeNull();
    global.requestAnimationFrame = originalRaf;
  });

  it('clears internal timers when stop is called without a loop', () => {
    const guard = new PerformanceGuards();
    guard.samples = [{ time: 0, fps: 55 }];
    const originalCancel = global.cancelAnimationFrame;
    global.cancelAnimationFrame = jest.fn();
    guard._rafId = 42;
    guard.stop();
    expect(global.cancelAnimationFrame).toHaveBeenCalledWith(42);
    expect(guard.samples).toEqual([]);
    global.cancelAnimationFrame = originalCancel;
  });
});
