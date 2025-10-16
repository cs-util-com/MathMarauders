jest.mock('./app/controller.js', () => {
  class FakeGameApp {
    constructor({ elements }) {
      this.elements = elements;
      FakeGameApp.instances.push(this);
    }
    init() {
      FakeGameApp.initCalled += 1;
    }
  }
  FakeGameApp.instances = [];
  FakeGameApp.initCalled = 0;
  return { GameApp: FakeGameApp };
});

// why this test matters: the bootstrap should wire required DOM nodes before starting the app.
test('index bootstrap collects DOM elements and initializes the app', async () => {
  document.body.innerHTML = `
    <button data-start></button>
    <button data-overlay-restart></button>
    <div data-overlay class="hidden"></div>
    <div data-end-title></div>
    <div data-end-score></div>
    <div data-stars></div>
    <div data-score></div>
    <div data-timer></div>
    <div data-units></div>
    <div data-stage-label></div>
  <div data-scene-root></div>
    <div data-steering-slider></div>
    <div data-gate-panel></div>
    <div data-gate-options></div>
    <div data-skirmish-panel></div>
    <div data-skirmish-ticks></div>
    <div data-skirmish-duration></div>
  <div data-skirmish-survivors></div>
  <div data-skirmish-enemy></div>
    <button data-skirmish-next></button>
    <div data-reverse-panel></div>
    <div data-reverse-units></div>
    <div data-reverse-gap></div>
    <div data-reverse-progress></div>
    <div data-reverse-gates></div>
    <input data-steer-input />
    <div data-target-indicator></div>
    <button data-pause></button>
    <div data-pause-menu></div>
    <button data-resume></button>
    <button data-restart></button>
    <button data-mute></button>
  `;

  global.requestAnimationFrame = (cb) => {
    cb(performance.now());
    return 1;
  };
  global.cancelAnimationFrame = () => {};

  await import('./index.js');
  const { GameApp } = await import('./app/controller.js');
  expect(GameApp.instances).toHaveLength(1);
  expect(GameApp.initCalled).toBe(1);
  expect(window.mathMarauders).toBeInstanceOf(GameApp.instances[0].constructor);
});
