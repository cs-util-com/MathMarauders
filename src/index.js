import { GameApp } from './app/controller.js';

function collectElements(doc) {
  return {
    sceneRoot: doc.querySelector('[data-scene-root]'),
    start: doc.querySelector('[data-start]'),
    overlayRestart: doc.querySelector('[data-overlay-restart]'),
    overlay: doc.querySelector('[data-overlay]'),
    endTitle: doc.querySelector('[data-end-title]'),
    endScore: doc.querySelector('[data-end-score]'),
    stars: doc.querySelector('[data-stars]'),
    score: doc.querySelector('[data-score]'),
    timer: doc.querySelector('[data-timer]'),
    units: doc.querySelector('[data-units]'),
    stageLabel: doc.querySelector('[data-stage-label]'),
    gatePanel: doc.querySelector('[data-gate-panel]'),
    gateOptions: doc.querySelector('[data-gate-options]'),
    skirmishPanel: doc.querySelector('[data-skirmish-panel]'),
    skirmishTicks: doc.querySelector('[data-skirmish-ticks]'),
    skirmishDuration: doc.querySelector('[data-skirmish-duration]'),
  skirmishSurvivors: doc.querySelector('[data-skirmish-survivors]'),
  skirmishEnemy: doc.querySelector('[data-skirmish-enemy]'),
    skirmishNext: doc.querySelector('[data-skirmish-next]'),
    reversePanel: doc.querySelector('[data-reverse-panel]'),
    reverseUnits: doc.querySelector('[data-reverse-units]'),
    reverseGap: doc.querySelector('[data-reverse-gap]'),
    reverseProgress: doc.querySelector('[data-reverse-progress]'),
    reverseGates: doc.querySelector('[data-reverse-gates]'),
    steerInput: doc.querySelector('[data-steer-input]'),
    targetIndicator: doc.querySelector('[data-target-indicator]'),
    pauseButton: doc.querySelector('[data-pause]'),
    pauseMenu: doc.querySelector('[data-pause-menu]'),
    resumeButton: doc.querySelector('[data-resume]'),
    restartButton: doc.querySelector('[data-restart]'),
    muteButton: doc.querySelector('[data-mute]'),
  };
}

function requireElements(elements) {
  Object.entries(elements).forEach(([key, value]) => {
    if (!value) {
      throw new Error(`Missing DOM element for ${key}`);
    }
  });
}

function bootstrap() {
  const elements = collectElements(document);
  requireElements(elements);
  const app = new GameApp({ elements });
  app.init();
  window.mathMarauders = app;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}

export { GameApp } from './app/controller.js';
