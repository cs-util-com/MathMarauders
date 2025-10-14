export function createFpsMonitor({
  degrade,
  upgrade,
  degradeThreshold = 50,
  upgradeThreshold = 58,
  windowRef = typeof window !== 'undefined' ? window : undefined,
}) {
  if (!windowRef || typeof windowRef.requestAnimationFrame !== 'function') {
    return {
      stop() {},
      getAverageFps() {
        return 60;
      },
    };
  }

  let frameId;
  let running = true;
  const samples = [];
  let lastTime = performance.now();

  function loop(now) {
    if (!running) {
      return;
    }
    const delta = now - lastTime;
    lastTime = now;
    if (delta > 0) {
      const fps = 1000 / delta;
      samples.push(fps);
      if (samples.length > 120) {
        samples.shift();
      }
      const average =
        samples.reduce((sum, value) => sum + value, 0) / samples.length;
      if (average < degradeThreshold) {
        degrade({ averageFps: average });
      } else if (average > upgradeThreshold) {
        upgrade({ averageFps: average });
      }
    }
    frameId = windowRef.requestAnimationFrame(loop);
  }

  frameId = windowRef.requestAnimationFrame(loop);

  return {
    stop() {
      running = false;
      if (frameId) {
        windowRef.cancelAnimationFrame(frameId);
      }
    },
    getAverageFps() {
      if (samples.length === 0) {
        return 60;
      }
      return samples.reduce((sum, value) => sum + value, 0) / samples.length;
    },
  };
}
