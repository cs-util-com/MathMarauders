import { createRenderer } from './render.js';

function setupDom() {
  document.body.innerHTML = `
    <div>
      <span data-score-value></span>
      <span data-timer-value></span>
      <span data-units-value></span>
      <span data-units-delta></span>
      <span data-effects-value></span>
      <span data-pause-status></span>
      <span data-phase-value></span>
      <span data-wave-value></span>
      <span data-mute-indicator></span>
      <div data-gate-container></div>
      <p data-forward-hint></p>
      <ol data-log-list></ol>
      <div data-end-card></div>
      <div data-star-list></div>
      <p data-run-summary></p>
      <button data-action="start"></button>
      <div data-pause-menu></div>
      <button data-action="pause"></button>
      <input data-steering />
      <button data-action="resume"></button>
      <button data-action="restart"></button>
      <button data-action="toggle-mute"></button>
      <button data-action="toggle-effects"></button>
      <span data-seed-value></span>
      <span data-chase-status></span>
    </div>
  `;
}

function createElements() {
  return {
    scoreboard: {
      scoreValue: document.querySelector('[data-score-value]'),
      timeValue: document.querySelector('[data-timer-value]'),
      unitsValue: document.querySelector('[data-units-value]'),
      unitsDelta: document.querySelector('[data-units-delta]'),
      effectsValue: document.querySelector('[data-effects-value]'),
      pauseStatus: document.querySelector('[data-pause-status]'),
    },
    hud: {
      phaseValue: document.querySelector('[data-phase-value]'),
      waveValue: document.querySelector('[data-wave-value]'),
      muteBadge: document.querySelector('[data-mute-indicator]'),
    },
    forward: {
      gateContainer: document.querySelector('[data-gate-container]'),
      forwardHint: document.querySelector('[data-forward-hint]'),
    },
    logList: document.querySelector('[data-log-list]'),
    end: {
      endCard: document.querySelector('[data-end-card]'),
      starList: document.querySelector('[data-star-list]'),
      summary: document.querySelector('[data-run-summary]'),
      restartCta: document.querySelector('[data-action="start"]'),
    },
    pauseMenu: {
      container: document.querySelector('[data-pause-menu]'),
      resumeButton: document.querySelector('[data-action="resume"]'),
      restartButton: document.querySelector('[data-action="restart"]'),
      muteButton: document.querySelector('[data-action="toggle-mute"]'),
      effectsButton: document.querySelector('[data-action="toggle-effects"]'),
    },
    controls: {
      pauseButton: document.querySelector('[data-action="pause"]'),
      steeringSlider: document.querySelector('[data-steering]'),
    },
    meta: {
      seedValue: document.querySelector('[data-seed-value]'),
      chaseStatus: document.querySelector('[data-chase-status]'),
      steeringValue: document.createElement('span'),
    },
  };
}

function buildState(overrides = {}) {
  return {
    phase: 'forward',
    wave: 1,
    seed: 'alpha',
    isPaused: false,
    muted: false,
    effectsMode: 'ultra',
    forward: {
      decisionIndex: 0,
      totalDecisions: 3,
      current: {
        id: 'gate-1',
        options: [
          {
            id: 'opt-1',
            label: '+10',
            description: 'add 10',
            dominantTone: 'positive',
          },
          {
            id: 'opt-2',
            label: '×1.5',
            description: 'multiply by 1.5',
            dominantTone: 'boost',
          },
        ],
      },
    },
    units: { initial: 24, current: 24 },
    logs: ['Run started.'],
    score: null,
    stars: { stars: 0, thresholds: [] },
    reverse: null,
    ...overrides,
  };
}

// why this test matters: HUD updates and gate rendering are core to gameplay legibility.
test('renderer updates scoreboard, gates, and logs', () => {
  jest.useFakeTimers();
  setupDom();
  const elements = createElements();
  const render = createRenderer(elements);
  const baseState = buildState();
  render(baseState);
  expect(elements.forward.gateContainer.querySelectorAll('button').length).toBe(
    2
  );
  expect(elements.scoreboard.pauseStatus.textContent).toBe('Live');
  expect(elements.logList.children.length).toBe(1);

  const boostedState = buildState({
    units: { initial: 24, current: 30 },
  });
  render(boostedState);
  expect(elements.scoreboard.unitsDelta.textContent).toBe('+6');
  expect(elements.scoreboard.unitsDelta.dataset.deltaTone).toBe('positive');
  expect(elements.hud.phaseValue.textContent).toBe('Forward Run');
  const reverseState = buildState({
    phase: 'reverse',
    muted: true,
    reverse: { outcome: 'caught', timeElapsed: 12 },
  });
  render(reverseState);
  expect(elements.hud.phaseValue.textContent).toBe('Reverse Chase');
  expect(elements.hud.muteBadge.hidden).toBe(false);
  const pausedState = buildState({ isPaused: true });
  render(pausedState);
  expect(elements.hud.phaseValue.textContent).toBe('Paused');
  jest.runAllTimers();
  expect(
    elements.scoreboard.unitsDelta.classList.contains('delta--active')
  ).toBe(false);
});

// why this test matters: the end card and pause controls deliver the final feedback loop.
test('renderer populates end card and pause controls', () => {
  setupDom();
  const elements = createElements();
  const render = createRenderer(elements);
  const endState = buildState({
    phase: 'end',
    score: { total: 420, breakdown: {} },
    stars: { stars: 2, thresholds: [180, 320, 460] },
    reverse: { outcome: 'escape', timeElapsed: 12.4 },
  });
  render(endState);
  expect(elements.end.endCard.hidden).toBe(false);
  expect(elements.end.starList.querySelectorAll('.star').length).toBe(3);
  expect(elements.end.restartCta.textContent).toBe('Restart');
  expect(elements.controls.pauseButton.textContent).toBe('Pause');
  expect(elements.pauseMenu.effectsButton.textContent).toContain('Low');
  expect(elements.meta.seedValue.textContent).toBe('alpha');
  expect(elements.meta.chaseStatus.textContent).toContain('Escape');
});
