import { initApp } from './app.js';

describe('app integration', () => {
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

    document.body.innerHTML = `
      <div class="app" id="app">
        <header class="hud">
          <div class="hud__score"><span class="hud__score-value">0</span></div>
          <div data-testid="hud-delta" class="hud__delta"></div>
          <div class="hud__timer"><span class="hud__timer-value">0</span></div>
          <button data-testid="pause-button" type="button">Pause</button>
        </header>
        <section>
          <div data-testid="gate-grid"></div>
          <div data-testid="skirmish-log"></div>
          <div data-testid="reverse-status"><span class="reverse-status__value"></span></div>
          <article data-testid="results-card">
            <div data-testid="results-stars"></div>
            <p data-testid="results-summary"></p>
          </article>
        </section>
        <section>
          <span data-testid="steering-value">50%</span>
          <input data-testid="steering-slider" type="range" min="0" max="100" value="50" />
        </section>
      </div>
      <button data-testid="start-button">Start Run</button>
      <div data-testid="pause-overlay">
        <button data-testid="resume-button">Resume</button>
        <button data-testid="restart-button">Restart</button>
        <label><input data-testid="mute-toggle" type="checkbox" /></label>
        <label><input data-testid="low-mode-toggle" type="checkbox" /></label>
      </div>
    `;
  });

  afterEach(() => {
    window.requestAnimationFrame = originalRaf;
    window.cancelAnimationFrame = originalCancel;
  });

  test('wires primary game loop interactions', () => {
    // why this test matters: verifies DOM wiring for the forward/skirmish/reverse loop at a high level.
    const { game, performanceGuard } = initApp();
    const startButton = document.querySelector('[data-testid="start-button"]');
    const gateGrid = document.querySelector('[data-testid="gate-grid"]');
    const pauseOverlay = document.querySelector(
      '[data-testid="pause-overlay"]'
    );
    const pauseButton = document.querySelector('[data-testid="pause-button"]');
    const resumeButton = document.querySelector(
      '[data-testid="resume-button"]'
    );
    const slider = document.querySelector('[data-testid="steering-slider"]');
    const muteToggle = document.querySelector('[data-testid="mute-toggle"]');
    const lowModeToggle = document.querySelector(
      '[data-testid="low-mode-toggle"]'
    );
    const appRoot = document.getElementById('app');

    expect(startButton.textContent).toBe('Start Run');
    slider.value = '70';
    slider.dispatchEvent(new Event('input'));
    startButton.click();

    expect(gateGrid.querySelectorAll('button').length).toBe(4);
    for (let stage = 0; stage < 3; stage += 1) {
      const button = gateGrid.querySelector('button');
      button.click();
    }

    const resultsCard = document.querySelector('[data-testid="results-card"]');
    expect(resultsCard.classList.contains('is-visible')).toBe(true);
    expect(game.getSnapshot().phase).toBe('complete');

    muteToggle.checked = true;
    muteToggle.dispatchEvent(new Event('change'));
    expect(game.getSnapshot().isMuted).toBe(true);

    lowModeToggle.checked = true;
    lowModeToggle.dispatchEvent(new Event('change'));
    expect(appRoot.classList.contains('degraded')).toBe(true);
    expect(performanceGuard.isDegraded()).toBe(true);

    lowModeToggle.checked = false;
    lowModeToggle.dispatchEvent(new Event('change'));
    expect(appRoot.classList.contains('degraded')).toBe(false);

    pauseButton.click();
    expect(pauseOverlay.classList.contains('is-visible')).toBe(true);
    const restartButton = document.querySelector(
      '[data-testid="restart-button"]'
    );
    restartButton.click();
    expect(game.getSnapshot().phase).toBe('forward');
    pauseButton.click();
    resumeButton.click();
    expect(pauseOverlay.classList.contains('is-visible')).toBe(false);
    resumeButton.click();

    const updateElapsedSpy = jest.spyOn(game, 'updateElapsed');
    expect(callbacks.length).toBeGreaterThan(1);
    const tickCallback = callbacks[1];
    tickCallback(1000);
    const nextTick = callbacks.at(-1);
    nextTick(1100);
    expect(updateElapsedSpy).toHaveBeenCalled();
  });
});
