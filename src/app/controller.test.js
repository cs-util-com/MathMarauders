import { GameApp } from './controller.js';

test('constructor requires DOM elements', () => {
  expect(() => new GameApp({})).toThrow(
    'GameApp requires DOM element references.'
  );
});

function createDom() {
  document.body.innerHTML = `
    <main>
      <header>
        <div data-score>0</div>
        <div data-timer>0</div>
        <div data-units>0</div>
        <button data-pause></button>
        <div data-pause-menu></div>
        <button data-resume></button>
        <button data-restart></button>
        <button data-mute></button>
      </header>
      <section>
        <div data-stage-label></div>
        <div data-log></div>
        <div data-gate-panel></div>
        <div data-gate-options></div>
        <div data-skirmish-panel></div>
        <div data-skirmish-log></div>
        <div data-skirmish-ticks></div>
        <div data-skirmish-duration></div>
        <button data-skirmish-next></button>
        <div data-reverse-panel></div>
        <div data-reverse-units></div>
        <div data-reverse-gap></div>
        <div data-reverse-progress></div>
        <div data-reverse-gates></div>
        <input data-steer-input type="range" />
        <div data-target-indicator></div>
      </section>
      <footer>
        <button data-start></button>
        <button data-overlay-restart></button>
      </footer>
      <div data-overlay class="hidden"></div>
      <div data-end-title></div>
      <div data-end-score></div>
      <div data-stars></div>
    </main>
  `;

  const query = (selector) => document.querySelector(selector);
  return {
    start: query('[data-start]'),
    overlayRestart: query('[data-overlay-restart]'),
    overlay: query('[data-overlay]'),
    endTitle: query('[data-end-title]'),
    endScore: query('[data-end-score]'),
    stars: query('[data-stars]'),
    score: query('[data-score]'),
    timer: query('[data-timer]'),
    units: query('[data-units]'),
    stageLabel: query('[data-stage-label]'),
    log: query('[data-log]'),
    gatePanel: query('[data-gate-panel]'),
    gateOptions: query('[data-gate-options]'),
    skirmishPanel: query('[data-skirmish-panel]'),
    skirmishLog: query('[data-skirmish-log]'),
    skirmishTicks: query('[data-skirmish-ticks]'),
    skirmishDuration: query('[data-skirmish-duration]'),
    skirmishNext: query('[data-skirmish-next]'),
    reversePanel: query('[data-reverse-panel]'),
    reverseUnits: query('[data-reverse-units]'),
    reverseGap: query('[data-reverse-gap]'),
    reverseProgress: query('[data-reverse-progress]'),
    reverseGates: query('[data-reverse-gates]'),
    steerInput: query('[data-steer-input]'),
    targetIndicator: query('[data-target-indicator]'),
    pauseButton: query('[data-pause]'),
    pauseMenu: query('[data-pause-menu]'),
    resumeButton: query('[data-resume]'),
    restartButton: query('[data-restart]'),
    muteButton: query('[data-mute]'),
  };
}

function createApp() {
  const elements = createDom();
  const app = new GameApp({
    elements,
    persistenceKey: 'test-progress',
    seed: 42,
  });
  return { app, elements };
}

// why this test matters: the forward gate loop must populate choices so players can make meaningful decisions.
test('forward phase renders gate options and applies choices', () => {
  const { app, elements } = createApp();
  app.init();
  app.resetState();
  app.enterForwardPhase();
  expect(elements.gateOptions.children.length).toBe(2);
  const before = app.state.playerUnits;
  app.handleGateChoice(0);
  expect(app.state.playerUnits).not.toBe(before);
  expect(elements.log.childElementCount).toBeGreaterThan(0);
});

// why this test matters: the skirmish phase must leave survivors ready for the reverse chase when the player makes good choices.
test('skirmish resolves with surviving units', () => {
  const { app } = createApp();
  app.init();
  app.resetState();
  app.enterForwardPhase();
  app.handleGateChoice(0);
  app.handleGateChoice(0);
  app.handleGateChoice(0);
  app.state.playerUnits = 40;
  app.state.rng = () => 0.1;
  app.enterSkirmish();
  expect(app.state.phase).toBe('skirmish');
  expect(app.state.playerUnits).toBeGreaterThan(0);
});

// why this test matters: finishing a run should surface the end card and persist high scores for replayability.
test('finishRun surfaces overlay with star rating', () => {
  const { app, elements } = createApp();
  app.init();
  app.resetState();
  app.enterForwardPhase();
  app.handleGateChoice(0);
  app.finishRun(true, 'Test success');
  expect(elements.overlay.classList.contains('hidden')).toBe(false);
  expect(elements.stars.textContent.length).toBe(3);
});

// why this test matters: pause controls must toggle without breaking the game loop.
test('pause menu toggles visibility and state flag', () => {
  const { app, elements } = createApp();
  app.init();
  app.resetState();
  app.enterForwardPhase();
  app.togglePauseMenu();
  expect(elements.pauseMenu.style.display).toBe('flex');
  expect(app.state.paused).toBe(true);
  app.togglePauseMenu();
  expect(elements.pauseMenu.style.display).toBe('none');
});

// why this test matters: the reverse chase needs to respect lane targets and gates to deliver the intended tension curve.
test('reverse chase drains units and spawns gate choices', () => {
  const originalRAF = global.requestAnimationFrame;
  const originalCAF = global.cancelAnimationFrame;
  const frameCallbacks = [];
  global.requestAnimationFrame = (cb) => {
    frameCallbacks.push(cb);
    return frameCallbacks.length;
  };
  global.cancelAnimationFrame = jest.fn();

  const { app, elements } = createApp();
  app.init();
  app.resetState();
  app.enterForwardPhase();
  app.handleGateChoice(0);
  app.handleGateChoice(0);
  app.handleGateChoice(0);
  app.enterSkirmish();
  app.state.playerUnits = 40;
  app.enterReverse();
  expect(app.state.phase).toBe('reverse');
  expect(frameCallbacks.length).toBeGreaterThan(0);
  frameCallbacks.forEach((cb, index) =>
    cb(performance.now() + (index + 1) * 200)
  );
  app.state.sliderPosition = 0;
  app.stepReverse(performance.now() + 500);
  expect(app.state.playerUnits).toBeLessThan(40);

  app.state.reverseGateQueue = [
    {
      threshold: 0,
      resolved: false,
      options: app.state.currentGates,
    },
  ];
  app.state.phase = 'reverse';
  app.stepReverse(performance.now() + 700);
  expect(elements.reverseGates.children.length).toBeGreaterThan(0);
  elements.reverseGates.querySelector('button').click();

  global.requestAnimationFrame = originalRAF;
  global.cancelAnimationFrame = originalCAF;
});

// why this test matters: persistence failures should not crash the game loop.
test('persistence guards log warnings without throwing', () => {
  const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const getSpy = jest
    .spyOn(window.localStorage.__proto__, 'getItem')
    .mockImplementation(() => {
      throw new Error('read error');
    });
  const setSpy = jest
    .spyOn(window.localStorage.__proto__, 'setItem')
    .mockImplementation(() => {
      throw new Error('write error');
    });

  const { app } = createApp();
  app.loadPersistence();
  app.savePersistence();

  expect(warnSpy).toHaveBeenCalled();
  getSpy.mockRestore();
  setSpy.mockRestore();
  warnSpy.mockRestore();
});

// why this test matters: timers should automatically fail the run when time expires.
test('startTimer counts down and triggers failure', () => {
  jest.useFakeTimers();
  const { app } = createApp();
  app.init();
  app.resetState();
  app.state.phase = 'forward';
  app.state.timerSeconds = 0.2;
  app.startTimer();
  jest.advanceTimersByTime(500);
  expect(app.elements.overlay.classList.contains('hidden')).toBe(false);
  jest.useRealTimers();
});

// why this test matters: mute toggles and failure states should not leave the UI in an inconsistent state.
test('toggleMute and failure finishRun update UI', () => {
  const { app, elements } = createApp();
  app.init();
  app.resetState();
  app.toggleMute();
  expect(document.body.dataset.muted).toBe('true');
  app.state.phase = 'reverse';
  app.finishRun(false, 'unit test failure');
  expect(elements.overlay.classList.contains('hidden')).toBe(false);
  expect(elements.endTitle.textContent).toBe('Defeat');
  Object.defineProperty(document, 'hidden', {
    configurable: true,
    value: true,
  });
  document.dispatchEvent(new Event('visibilitychange'));
  expect(app.state.paused).toBe(true);
});
