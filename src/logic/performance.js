export function createPerformanceGuard({ onDegrade, onRecover }) {
  let lastTimestamp = null;
  let frameTimes = [];
  let rafId = null;
  let isDegraded = false;
  let forcedLow = false;

  function evaluate() {
    if (frameTimes.length < 20) {
      return;
    }

    const sum = frameTimes.reduce((total, frame) => total + frame, 0);
    const avg = sum / frameTimes.length;
    const fps = 1000 / avg;

    if (!forcedLow && !isDegraded && fps < 50) {
      isDegraded = true;
      onDegrade?.({ fps });
    } else if (!forcedLow && isDegraded && fps >= 58) {
      isDegraded = false;
      onRecover?.({ fps });
    }
  }

  function loop(timestamp) {
    if (lastTimestamp !== null) {
      frameTimes.push(timestamp - lastTimestamp);
      if (frameTimes.length > 120) {
        frameTimes = frameTimes.slice(-120);
      }
      evaluate();
    }
    lastTimestamp = timestamp;
    rafId = window.requestAnimationFrame(loop);
  }

  return {
    start() {
      if (rafId !== null) {
        return;
      }
      rafId = window.requestAnimationFrame(loop);
    },
    stop() {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }
      lastTimestamp = null;
      frameTimes = [];
    },
    forceLowMode(enabled) {
      forcedLow = Boolean(enabled);
      if (forcedLow) {
        if (!isDegraded) {
          isDegraded = true;
          onDegrade?.({ fps: 0, forced: true });
        }
      } else {
        isDegraded = false;
        onRecover?.({ fps: 60, forced: false });
      }
    },
    isDegraded() {
      return isDegraded;
    },
  };
}
