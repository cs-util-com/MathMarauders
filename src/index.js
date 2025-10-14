import { GameEngine } from './game/gameEngine.js';
import { createRenderer } from './ui/render.js';

const elements = {
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
    steeringValue: document.querySelector('[data-steering-value]'),
  },
};

const render = createRenderer(elements);
const game = new GameEngine({ onChange: render });

bindForwardSelection(game, elements.forward.gateContainer);
bindStartCta(game, elements.end.restartCta);
bindPauseControls(game, elements);
bindSteering(elements);

render(game.getState());

function bindForwardSelection(engine, container) {
  container.addEventListener('click', (event) => {
    const option = event.target.closest('[data-option-id]');
    if (!option) {
      return;
    }
    engine.chooseGate(option.dataset.optionId);
  });
}

function bindStartCta(engine, button) {
  button.addEventListener('click', () => {
    const state = engine.getState();
    if (state.phase === 'idle') {
      engine.start();
    } else if (state.phase === 'end') {
      engine.restart();
    } else {
      engine.restart();
    }
  });
}

function bindPauseControls(engine, ui) {
  const { pauseButton } = ui.controls;
  const { container, resumeButton, restartButton, muteButton, effectsButton } =
    ui.pauseMenu;

  pauseButton.addEventListener('click', () => {
    const isOpen = pauseButton.getAttribute('aria-expanded') === 'true';
    const nextOpen = !isOpen;
    pauseButton.setAttribute('aria-expanded', String(nextOpen));
    container.hidden = !nextOpen;
    if (nextOpen) {
      const state = engine.getState();
      if (!state.isPaused) {
        engine.togglePause();
      }
    } else if (engine.getState().isPaused) {
      engine.togglePause();
    }
  });

  resumeButton.addEventListener('click', () => {
    pauseButton.setAttribute('aria-expanded', 'false');
    container.hidden = true;
    if (engine.getState().isPaused) {
      engine.togglePause();
    }
  });

  restartButton.addEventListener('click', () => {
    container.hidden = true;
    pauseButton.setAttribute('aria-expanded', 'false');
    engine.restart();
  });

  muteButton.addEventListener('click', () => {
    const { muted } = engine.getState();
    engine.setMute(!muted);
  });

  effectsButton.addEventListener('click', () => {
    const { effectsMode } = engine.getState();
    engine.setEffectsMode(effectsMode === 'ultra' ? 'low' : 'ultra');
  });
}

function bindSteering(ui) {
  const { steeringSlider } = ui.controls;
  const { steeringValue } = ui.meta;
  if (!steeringSlider) {
    return;
  }
  steeringSlider.addEventListener('input', () => {
    steeringValue.textContent = `${Math.round(steeringSlider.value)}%`;
  });
}
