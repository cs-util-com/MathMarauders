import { jest } from '@jest/globals';

const mockStart = jest.fn();
const mockRestart = jest.fn();
const mockChooseGate = jest.fn();
const mockTogglePause = jest.fn();
const mockSetMute = jest.fn();
const mockSetEffects = jest.fn();
const baseState = {
  phase: 'idle',
  wave: 1,
  seed: 'seed-test',
  isPaused: false,
  muted: false,
  effectsMode: 'ultra',
  forward: { decisionIndex: 0, totalDecisions: 3, current: null },
  units: { initial: 24, current: 24 },
  logs: [],
  score: null,
  stars: { stars: 0, thresholds: [] },
  reverse: null,
};

jest.mock('./game/gameEngine.js', () => ({
  GameEngine: jest.fn(({ onChange }) => {
    const state = { ...baseState };
    onChange?.(state);
    return {
      getState: () => state,
      start: jest.fn(() => {
        state.phase = 'forward';
        onChange?.(state);
        mockStart();
      }),
      restart: jest.fn(() => {
        state.phase = 'forward';
        onChange?.(state);
        mockRestart();
      }),
      chooseGate: jest.fn((id) => {
        mockChooseGate(id);
      }),
      togglePause: jest.fn(() => {
        state.isPaused = !state.isPaused;
        onChange?.(state);
        mockTogglePause();
      }),
      setMute: jest.fn((muted) => {
        state.muted = muted;
        onChange?.(state);
        mockSetMute(muted);
      }),
      setEffectsMode: jest.fn((mode) => {
        state.effectsMode = mode;
        onChange?.(state);
        mockSetEffects(mode);
      }),
    };
  }),
}));

beforeEach(() => {
  jest.resetModules();
  mockStart.mockReset();
  mockRestart.mockReset();
  mockChooseGate.mockReset();
  mockTogglePause.mockReset();
  mockSetMute.mockReset();
  mockSetEffects.mockReset();
});

function mountDom({ includeSlider = true } = {}) {
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
      <div data-pause-menu>
        <button data-action="resume"></button>
        <button data-action="restart"></button>
        <button data-action="toggle-mute"></button>
        <button data-action="toggle-effects"></button>
      </div>
      <button data-action="pause"></button>
      ${includeSlider ? '<input data-steering />' : ''}
      <span data-seed-value></span>
      <span data-chase-status></span>
      <span data-steering-value>0%</span>
    </div>
  `;
}

// why this test matters: wiring the entrypoint ensures controls invoke the engine hooks.
test('index wiring binds UI controls to the game engine', async () => {
  mountDom();
  await import('./index.js');
  const { GameEngine } = await import('./game/gameEngine.js');
  const engine = GameEngine.mock.results[0].value;

  const startButton = document.querySelector('[data-action="start"]');
  startButton.click();
  expect(mockStart).toHaveBeenCalled();

  engine.getState().phase = 'end';
  startButton.click();
  expect(mockRestart).toHaveBeenCalledTimes(1);
  engine.getState().phase = 'forward';
  startButton.click();
  expect(mockRestart).toHaveBeenCalledTimes(2);

  const gateContainer = document.querySelector('[data-gate-container]');
  gateContainer.dispatchEvent(new Event('click', { bubbles: true }));
  const gateButton = document.createElement('button');
  gateButton.dataset.optionId = 'option-1';
  gateContainer.appendChild(gateButton);
  gateButton.click();
  expect(mockChooseGate).toHaveBeenCalledWith('option-1');

  const pauseButton = document.querySelector('[data-action="pause"]');
  pauseButton.click();
  expect(mockTogglePause).toHaveBeenCalledTimes(1);
  const resumeButton = document.querySelector('[data-action="resume"]');
  resumeButton.click();
  expect(mockTogglePause).toHaveBeenCalledTimes(2);
  pauseButton.click();
  expect(mockTogglePause).toHaveBeenCalledTimes(3);
  pauseButton.click();
  expect(mockTogglePause).toHaveBeenCalledTimes(4);
  resumeButton.click();
  expect(mockTogglePause).toHaveBeenCalledTimes(4);

  const muteButton = document.querySelector('[data-action="toggle-mute"]');
  muteButton.click();
  expect(mockSetMute).toHaveBeenCalledWith(true);

  const fxButton = document.querySelector('[data-action="toggle-effects"]');
  fxButton.click();
  fxButton.click();
  expect(mockSetEffects).toHaveBeenCalledTimes(2);

  const restartButton = document.querySelector('[data-action="restart"]');
  restartButton.click();
  expect(mockRestart).toHaveBeenCalledTimes(3);

  const slider = document.querySelector('[data-steering]');
  slider.value = '25';
  slider.dispatchEvent(new Event('input'));
  expect(document.querySelector('[data-steering-value]').textContent).toBe(
    '25%'
  );
});

// why this test matters: steering binding should be resilient when the slider is omitted.
test('index bootstraps when steering slider is missing', async () => {
  mountDom({ includeSlider: false });
  await import('./index.js');
  expect(document.querySelector('[data-steering]')).toBeNull();
});
