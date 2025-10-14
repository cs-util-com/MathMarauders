import { createHud } from './hud.js';

describe('HUD rendering', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('score, timer and delta update with fade-out', () => {
    // why this test matters: HUD reactions need to be crisp for arcade pacing.
    const scoreValueEl = document.createElement('span');
    const timerValueEl = document.createElement('span');
    const deltaEl = document.createElement('div');
    const hud = createHud({ scoreValueEl, timerValueEl, deltaEl });

    hud.updateScore(1280);
    hud.updateTimer(1530);
    hud.updateDelta(-5);

    expect(scoreValueEl.textContent).toBe('1.3K');
    expect(timerValueEl.textContent).toBe('1.5s');
    expect(deltaEl.textContent).toBe('-5');
    expect(deltaEl.classList.contains('is-visible')).toBe(true);

    jest.advanceTimersByTime(260);
    expect(deltaEl.classList.contains('is-visible')).toBe(false);
  });
});
