import { createFpsMonitor } from './performance.js';

// why this test matters: automatic FX downgrades protect frame-rate stability on low-end devices.
test('fps monitor degrades and upgrades based on rolling average', () => {
  const callbacks = [];
  const fakeWindow = {
    requestAnimationFrame: (cb) => {
      callbacks.push(cb);
      return callbacks.length;
    },
    cancelAnimationFrame: jest.fn(),
  };
  const events = [];
  const originalNow = performance.now;
  performance.now = () => 0;
  const monitor = createFpsMonitor({
    degrade: ({ averageFps }) => events.push({ type: 'degrade', averageFps }),
    upgrade: ({ averageFps }) => events.push({ type: 'upgrade', averageFps }),
    degradeThreshold: 55,
    upgradeThreshold: 60,
    windowRef: fakeWindow,
  });
  expect(callbacks).toHaveLength(1);
  const loop = callbacks[0];
  loop(40); // ~25 FPS => degrade
  loop(80);
  expect(events.some((event) => event.type === 'degrade')).toBe(true);
  for (let i = 0; i < 6; i += 1) {
    loop(96 + i * 8); // fast frames push average above upgrade threshold
  }
  expect(events.some((event) => event.type === 'upgrade')).toBe(true);
  monitor.stop();
  expect(fakeWindow.cancelAnimationFrame).toHaveBeenCalled();
  performance.now = originalNow;
});

// why this test matters: environments without rAF should fall back gracefully to a no-op monitor.
test('fps monitor falls back when window reference is missing', () => {
  const monitor = createFpsMonitor({
    degrade: jest.fn(),
    upgrade: jest.fn(),
    windowRef: undefined,
  });
  expect(monitor.getAverageFps()).toBe(60);
  expect(() => monitor.stop()).not.toThrow();
});
