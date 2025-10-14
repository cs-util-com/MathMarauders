import { createPerformanceGuard } from './performance.js';

describe('performance guard', () => {
  let originalRaf;
  let originalCancel;
  let callbacks;

  beforeEach(() => {
    callbacks = [];
    originalRaf = window.requestAnimationFrame;
    originalCancel = window.cancelAnimationFrame;
    window.requestAnimationFrame = (cb) => {
      callbacks.push(cb);
      return callbacks.length;
    };
    window.cancelAnimationFrame = jest.fn();
  });

  afterEach(() => {
    window.requestAnimationFrame = originalRaf;
    window.cancelAnimationFrame = originalCancel;
  });

  test('detects degrade and recovery based on frame pacing', () => {
    // why this test matters: automatic VFX downgrades keep the experience responsive on low-end devices.
    const onDegrade = jest.fn();
    const onRecover = jest.fn();
    const guard = createPerformanceGuard({ onDegrade, onRecover });
    guard.start();

    let index = 0;
    let timestamp = 0;
    const step = (delta) => {
      const cb = callbacks[index];
      expect(cb).toBeDefined();
      timestamp += delta;
      cb(timestamp);
      index += 1;
    };

    step(16);
    for (let i = 0; i < 25; i += 1) {
      step(42);
    }
    expect(onDegrade).toHaveBeenCalled();

    for (let i = 0; i < 140; i += 1) {
      step(16);
    }
    expect(onRecover).toHaveBeenCalled();

    guard.forceLowMode(true);
    expect(onDegrade).toHaveBeenCalledWith(
      expect.objectContaining({ forced: true })
    );

    guard.forceLowMode(false);
    expect(onRecover).toHaveBeenLastCalledWith(
      expect.objectContaining({ forced: false })
    );

    guard.stop();
    expect(window.cancelAnimationFrame).toHaveBeenCalled();
  });
});
