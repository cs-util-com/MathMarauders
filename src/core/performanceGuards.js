export function evaluatePerformanceWindow({
  samples,
  degradeThreshold,
  restoreThreshold,
}) {
  if (!samples.length) {
    return { degrade: false, restore: false };
  }
  const average =
    samples.reduce((sum, value) => sum + value, 0) / samples.length;
  if (average < degradeThreshold) {
    return { degrade: true, restore: false };
  }
  if (average >= restoreThreshold) {
    return { degrade: false, restore: true };
  }
  return { degrade: false, restore: false };
}

export class PerformanceGuards {
  constructor({
    degradeThreshold = 50,
    restoreThreshold = 58,
    sampleWindowMs = 2000,
    onDegrade = () => {},
    onRestore = () => {},
  } = {}) {
    this.degradeThreshold = degradeThreshold;
    this.restoreThreshold = restoreThreshold;
    this.sampleWindowMs = sampleWindowMs;
    this.onDegrade = onDegrade;
    this.onRestore = onRestore;

    this.samples = [];
    this.isDegraded = false;
    this._lastTick = performance.now();
    this._rafId = null;
  }

  start() {
    if (this._rafId !== null) return;
    if (typeof requestAnimationFrame !== 'function') return;
    this._lastTick = performance.now();
    const loop = (timestamp) => {
      const delta = timestamp - this._lastTick;
      this._lastTick = timestamp;
      if (delta > 0) {
        const fps = 1000 / delta;
        this.samples.push({ time: timestamp, fps });
        this._trimSamples(timestamp);
        this._evaluate();
      }
      this._rafId = requestAnimationFrame(loop);
    };
    this._rafId = requestAnimationFrame(loop);
  }

  stop() {
    if (this._rafId !== null && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
    this.samples = [];
  }

  _trimSamples(timestamp) {
    const cutoff = timestamp - this.sampleWindowMs;
    this.samples = this.samples.filter((sample) => sample.time >= cutoff);
  }

  _evaluate() {
    const fpsSamples = this.samples.map((sample) => sample.fps);
    const { degrade, restore } = evaluatePerformanceWindow({
      samples: fpsSamples,
      degradeThreshold: this.degradeThreshold,
      restoreThreshold: this.restoreThreshold,
    });

    if (degrade && !this.isDegraded) {
      this.isDegraded = true;
      this.onDegrade();
    } else if (restore && this.isDegraded) {
      this.isDegraded = false;
      this.onRestore();
    }
  }
}
