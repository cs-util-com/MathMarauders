import { setupPauseMenu } from './pauseMenu.js';

describe('pause menu controls', () => {
  test('opens, closes and forwards toggle events', () => {
    // why this test matters: pause interactions maintain pacing and accessibility expectations.
    const overlay = document.createElement('div');
    const pauseButton = document.createElement('button');
    const resumeButton = document.createElement('button');
    const restartButton = document.createElement('button');
    const muteToggle = document.createElement('input');
    muteToggle.type = 'checkbox';
    const lowModeToggle = document.createElement('input');
    lowModeToggle.type = 'checkbox';

    const onPause = jest.fn();
    const onResume = jest.fn();
    const onRestart = jest.fn();
    const onMuteChange = jest.fn();
    const onLowModeToggle = jest.fn();

    const menu = setupPauseMenu(
      {
        overlay,
        pauseButton,
        resumeButton,
        restartButton,
        muteToggle,
        lowModeToggle,
      },
      { onPause, onResume, onRestart, onMuteChange, onLowModeToggle }
    );

    pauseButton.click();
    expect(overlay.classList.contains('is-visible')).toBe(true);
    expect(onPause).toHaveBeenCalledTimes(1);

    muteToggle.checked = true;
    muteToggle.dispatchEvent(new Event('change'));
    expect(onMuteChange).toHaveBeenCalledWith(true);

    lowModeToggle.checked = true;
    lowModeToggle.dispatchEvent(new Event('change'));
    expect(onLowModeToggle).toHaveBeenCalledWith(true);

    resumeButton.click();
    expect(onResume).toHaveBeenCalledTimes(1);
    expect(overlay.classList.contains('is-visible')).toBe(false);

    pauseButton.click();
    const child = document.createElement('div');
    overlay.appendChild(child);
    child.dispatchEvent(new Event('click', { bubbles: true }));
    expect(overlay.classList.contains('is-visible')).toBe(true);
    overlay.dispatchEvent(new Event('click'));
    expect(onResume).toHaveBeenCalledTimes(2);

    pauseButton.click();
    restartButton.click();
    expect(onRestart).toHaveBeenCalledTimes(1);

    menu.setMute(true);
    expect(muteToggle.checked).toBe(true);
    menu.setLowMode(true);
    expect(lowModeToggle.checked).toBe(true);
  });

  test('handles optional callbacks gracefully', () => {
    // why this test matters: ensures defensive defaults avoid runtime crashes.
    const overlay = document.createElement('div');
    const pauseButton = document.createElement('button');
    const resumeButton = document.createElement('button');
    const restartButton = document.createElement('button');
    const muteToggle = document.createElement('input');
    muteToggle.type = 'checkbox';
    const lowModeToggle = document.createElement('input');
    lowModeToggle.type = 'checkbox';

    const menu = setupPauseMenu(
      {
        overlay,
        pauseButton,
        resumeButton,
        restartButton,
        muteToggle,
        lowModeToggle,
      },
      {}
    );

    expect(() => menu.open()).not.toThrow();
    expect(() => menu.close()).not.toThrow();
    pauseButton.click();
    resumeButton.click();
    restartButton.click();
    muteToggle.dispatchEvent(new Event('change'));
    lowModeToggle.dispatchEvent(new Event('change'));
    overlay.dispatchEvent(new Event('click'));
    menu.setMute(false);
    menu.setLowMode(false);
  });
});
