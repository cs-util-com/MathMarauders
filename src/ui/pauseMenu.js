export function setupPauseMenu(
  {
    overlay,
    pauseButton,
    resumeButton,
    restartButton,
    muteToggle,
    lowModeToggle,
  },
  handlers = {}
) {
  const {
    onPause = () => {},
    onResume = () => {},
    onRestart = () => {},
    onMuteChange = () => {},
    onLowModeToggle = () => {},
  } = handlers;

  function open() {
    overlay.classList.add('is-visible');
    onPause();
  }

  function close() {
    overlay.classList.remove('is-visible');
    onResume();
  }

  pauseButton.addEventListener('click', open);
  resumeButton.addEventListener('click', () => {
    close();
  });
  restartButton.addEventListener('click', () => {
    close();
    onRestart();
  });
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) {
      close();
    }
  });

  muteToggle.addEventListener('change', (event) => {
    onMuteChange(event.target.checked);
  });

  lowModeToggle.addEventListener('change', (event) => {
    onLowModeToggle(event.target.checked);
  });

  return {
    open,
    close,
    setMute(value) {
      muteToggle.checked = Boolean(value);
    },
    setLowMode(value) {
      lowModeToggle.checked = Boolean(value);
    },
  };
}
