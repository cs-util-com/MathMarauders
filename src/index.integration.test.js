const SKIRMISH_DELAY_MS = 1600;
const REVERSE_DELAY_MS = 2000;
const DEFAULT_URL = '/?seed=loop-seed';

let originalPointerEvent;
let originalAddEventListener;
const capturedHandlers = {
  pointerdown: [],
  pointerup: [],
  touchend: [],
};

async function mountApp({ url = DEFAULT_URL, enableHooks = true } = {}) {
  jest.useFakeTimers();
  global.requestAnimationFrame = (callback) =>
    setTimeout(() => callback(Date.now()), 16);
  global.cancelAnimationFrame = (id) => clearTimeout(id);
  originalPointerEvent = global.PointerEvent;
  global.PointerEvent = class PointerEvent extends Event {
    constructor(type, init = {}) {
      super(type, init);
      this.pointerType = init.pointerType ?? 'mouse';
    }
  };
  originalAddEventListener = Element.prototype.addEventListener;
  Element.prototype.addEventListener = function (type, listener, options) {
    if (
      this instanceof Element &&
      this.matches?.('[data-control="steering"]') &&
      capturedHandlers[type]
    ) {
      capturedHandlers[type].push(listener);
    }
    return originalAddEventListener.call(this, type, listener, options);
  };
  Object.keys(capturedHandlers).forEach((key) => {
    capturedHandlers[key] = [];
  });
  if (enableHooks) {
    window.__MARAUDERS_ENABLE_TEST_HOOKS__ = true;
  } else {
    delete window.__MARAUDERS_ENABLE_TEST_HOOKS__;
  }
  window.history.replaceState({}, '', url);

  document.body.innerHTML = `
      <main>
        <header class="hud">
          <span data-hud="timer" class="hud__timer">01:30</span>
          <span data-hud="score">0</span>
          <span data-hud="delta" class="hud__delta" hidden>+0</span>
          <button class="pause-button" data-action="pause">Pause</button>
        </header>
        <section class="arena">
          <article class="phase-panel">
            <div class="phase-panel__title" data-panel="phase">Ready to deploy</div>
            <div class="phase-panel__counts">
              <span class="phase-panel__count" data-panel="player-count" data-faction="player">12</span>
              <span class="phase-panel__count" data-panel="enemy-count" data-faction="enemy">10</span>
            </div>
            <div class="gate-rail" data-panel="gates" data-state="hidden"></div>
            <div class="stars" data-panel="stars">☆ ☆ ☆</div>
          </article>
        </section>
        <footer class="controls">
          <div class="steering">
            <label for="steering">Steering</label>
            <input id="steering" data-control="steering" type="range" min="0" max="100" value="50" />
          </div>
          <button class="start-button" data-action="start">Start Run</button>
        </footer>
      </main>
      <aside class="pause-overlay" data-panel="pause-overlay" hidden>
        <div class="pause-menu">
          <h2>Paused</h2>
          <button data-action="resume">Resume</button>
          <button data-action="restart">Restart</button>
          <button data-action="mute">Toggle Bloom</button>
        </div>
      </aside>
    `;

  jest.resetModules();
  await import('./index.js');
  document.dispatchEvent(new Event('DOMContentLoaded'));
}

function cleanupApp() {
  jest.useRealTimers();
  delete global.requestAnimationFrame;
  delete global.cancelAnimationFrame;
  if (originalPointerEvent) {
    global.PointerEvent = originalPointerEvent;
  } else {
    delete global.PointerEvent;
  }
  Element.prototype.addEventListener = originalAddEventListener;
  Object.keys(capturedHandlers).forEach((key) => {
    capturedHandlers[key] = [];
  });
  delete window.__MARAUDERS_ENABLE_TEST_HOOKS__;
  delete window.__MARAUDERS_TEST_HOOKS__;
  window.history.replaceState({}, '', '/');
}

// why this test matters: verifies the full arcade loop wiring so UI matches run state changes.
describe('Math Marauders arcade loop', () => {
  afterEach(() => {
    cleanupApp();
  });

  it('runs through a full start → gate → chase cycle', async () => {
    await mountApp();
    const startButton = document.querySelector('[data-action="start"]');
    const hooks = window.__MARAUDERS_TEST_HOOKS__;
    startButton.click();

    jest.runOnlyPendingTimers();

    const gateRail = document.querySelector('[data-panel="gates"]');
    expect(gateRail.dataset.state).toBe('active');
    expect(gateRail.children.length).toBeGreaterThan(0);

    const firstGate = gateRail.querySelector('button');
    firstGate.click();

    jest.advanceTimersByTime(SKIRMISH_DELAY_MS);
    jest.runOnlyPendingTimers();

    jest.advanceTimersByTime(REVERSE_DELAY_MS);
    jest.runOnlyPendingTimers();

    const phaseText = document.querySelector(
      '[data-panel="phase"]'
    ).textContent;
    expect(phaseText).toContain('Run complete');

    const stars = document.querySelector('[data-panel="stars"]').textContent;
    expect(stars.trim()).not.toEqual('☆ ☆ ☆');

    const snapshot = hooks.getState();
    expect(snapshot.phase).toBe('end');
  });

  it('supports pausing, overlay controls, and steering feedback', async () => {
    await mountApp();
    const startButton = document.querySelector('[data-action="start"]');
    const pauseButton = document.querySelector('[data-action="pause"]');
    const overlay = document.querySelector('[data-panel="pause-overlay"]');

    startButton.click();
    jest.runOnlyPendingTimers();

    const gateRail = document.querySelector('[data-panel="gates"]');
    gateRail.querySelector('button').click();

    pauseButton.click();
    expect(overlay.hidden).toBe(false);

    jest.advanceTimersByTime(SKIRMISH_DELAY_MS);
    jest.runOnlyPendingTimers();

    overlay.querySelector('[data-action="resume"]').click();
    expect(overlay.hidden).toBe(true);

    pauseButton.click();
    expect(overlay.hidden).toBe(false);
    const hooks = window.__MARAUDERS_TEST_HOOKS__;
    expect(hooks.toggleMute()).toBe(true);
    expect(hooks.toggleMute()).toBe(false);

    overlay.querySelector('[data-action="restart"]').click();
    jest.runOnlyPendingTimers();
    expect(overlay.hidden).toBe(true);

    const slider = document.querySelector('[data-control="steering"]');
    capturedHandlers.pointerdown[0]?.(new PointerEvent('pointerdown'));
    expect(slider.classList.contains('is-active')).toBe(true);
    capturedHandlers.pointerup[0]?.(new PointerEvent('pointerup'));
    expect(slider.classList.contains('is-active')).toBe(false);
    capturedHandlers.touchend[0]?.(new Event('touchend'));
    expect(slider.classList.contains('is-active')).toBe(false);

    startButton.click();
    jest.runOnlyPendingTimers();

    const activeRail = document.querySelector('[data-panel="gates"]');
    activeRail.querySelector('button').click();
    jest.advanceTimersByTime(SKIRMISH_DELAY_MS + REVERSE_DELAY_MS);
    jest.runOnlyPendingTimers();

    pauseButton.click();
    expect(overlay.hidden).toBe(false);

    hooks.setTimer(0);
    jest.advanceTimersByTime(150);

    hooks.setPhase('end');
    hooks.togglePause();
  });

  it('concludes the run when the timer expires', async () => {
    await mountApp();
    const hooks = window.__MARAUDERS_TEST_HOOKS__;
    hooks.beginRun();
    hooks.setPaused(true);
    jest.advanceTimersByTime(150);
    hooks.setPaused(false);
    hooks.setTimer(0);
    jest.advanceTimersByTime(200);
    const phaseText = document.querySelector(
      '[data-panel="phase"]'
    ).textContent;
    expect(phaseText).toContain('Run complete');
    hooks.togglePause();
    hooks.clearOverlay();
    expect(hooks.toggleMute()).toBe(false);
  });

  // why this test matters: shareable seeds let designers and QA reproduce exact runs when tuning difficulty.
  it('honours query seed and rotates deterministic run seeds', async () => {
    await mountApp();
    const startButton = document.querySelector('[data-action="start"]');
    startButton.click();
    jest.runOnlyPendingTimers();

    const hooks = window.__MARAUDERS_TEST_HOOKS__;
    const initialState = hooks.getState();
    expect(initialState.seed).toBe('loop-seed');
    expect(window.location.search).toContain('seed=loop-seed');

    const nextSeed = hooks.getNextSeed();
    expect(nextSeed.startsWith('seed-')).toBe(true);

    hooks.beginRun();
    jest.runOnlyPendingTimers();

    const secondState = hooks.getState();
    expect(secondState.seed).toBe(nextSeed);
    expect(window.location.search).toContain(`seed=${nextSeed}`);

    hooks.beginRun({ seed: 'manual-seed', preserveSeed: true });
    jest.runOnlyPendingTimers();

    const manualState = hooks.getState();
    expect(manualState.seed).toBe('manual-seed');
    expect(window.location.search).toContain('seed=manual-seed');
    expect(hooks.getNextSeed()).toBe('manual-seed');

    const originalReplaceState = window.history.replaceState;
    window.history.replaceState = undefined;

    hooks.beginRun({ seed: 'guard-seed', preserveSeed: true });
    jest.runOnlyPendingTimers();

    expect(window.location.search).toContain('seed=manual-seed');
    expect(hooks.getState().seed).toBe('guard-seed');

    window.history.replaceState = originalReplaceState;

    hooks.beginRun();
    jest.runOnlyPendingTimers();

    expect(window.location.search).toContain('seed=guard-seed');
  });

  // why this test matters: fallback seeds guarantee functional runs even without share links.
  it('generates a seed when query string omits one', async () => {
    await mountApp({ url: '/' });
    const hooks = window.__MARAUDERS_TEST_HOOKS__;
    hooks.beginRun();
    jest.runOnlyPendingTimers();

    const runState = hooks.getState();
    expect(runState.seed).toMatch(/^seed-/);
    expect(window.location.search).toContain(`seed=${runState.seed}`);
  });

  // why this test matters: HUD feedback must cover positive/negative deltas and unknown phases gracefully.
  it('renders score delta polarity and phase fallback copy', async () => {
    await mountApp();
    const hooks = window.__MARAUDERS_TEST_HOOKS__;
    hooks.beginRun();
    jest.runOnlyPendingTimers();

    const delta = document.querySelector('[data-hud="delta"]');

    hooks.setScoreDelta(12);
    expect(delta.hidden).toBe(false);
    expect(delta.dataset.state).toBe('gain');
    expect(delta.textContent).toContain('+12');

    hooks.setScoreDelta(-8);
    expect(delta.dataset.state).toBe('loss');
    expect(delta.textContent).toContain('-8');

    hooks.setScoreDelta(0);
    expect(delta.hidden).toBe(true);

    hooks.setPhase('mystery');
    hooks.forceRender();
    const phaseText = document.querySelector(
      '[data-panel="phase"]'
    ).textContent;
    expect(phaseText).toBe('');
  });

  // why this test matters: ensures module loads safely without exposing internal hooks when disabled.
  it('skips test hooks and trims whitespace-only seeds', async () => {
    await mountApp({ url: '/?seed=%20%20', enableHooks: false });
    expect(window.__MARAUDERS_TEST_HOOKS__).toBeUndefined();

    const startButton = document.querySelector('[data-action="start"]');
    startButton.click();
    jest.runOnlyPendingTimers();

    const gateRail = document.querySelector('[data-panel="gates"]');
    expect(gateRail.dataset.state).toBe('active');
    expect(window.location.search).toMatch(/seed=seed-/);
  });
});
