import { jest } from '@jest/globals';

jest.mock('./app.js', () => ({
  initApp: jest.fn(),
}));

const { initApp } = require('./app.js');

function setReadyState(state) {
  Object.defineProperty(document, 'readyState', {
    configurable: true,
    value: state,
  });
}

describe('index bootstrapping', () => {
  afterEach(() => {
    initApp.mockClear();
    setReadyState('complete');
  });

  test('initialises immediately when DOM is already ready', async () => {
    // why this test matters: ensures eager boots do not wait for events unnecessarily.
    setReadyState('interactive');
    await jest.isolateModulesAsync(async () => {
      await import('./index.js');
    });
    expect(initApp).toHaveBeenCalledTimes(1);
  });

  test('waits for DOMContentLoaded when still loading', async () => {
    // why this test matters: prevents init from running before the HUD exists.
    setReadyState('loading');
    await jest.isolateModulesAsync(async () => {
      await import('./index.js');
    });
    expect(initApp).not.toHaveBeenCalled();
    document.dispatchEvent(new Event('DOMContentLoaded'));
    expect(initApp).toHaveBeenCalledTimes(1);
  });
});
